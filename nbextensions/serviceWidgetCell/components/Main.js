define([
    'preact',
    'htm',
    'preactComponents/Loading',
    'preactComponents/ErrorAlert',
    'uuid',
    'util/windowChannel',
    'narrativeConfig',
    'api/auth',
    'common/runtime',
    'common/cellUtils',
    'jsonrpc/1.1/DynamicServiceClient',
    './IFrame',
    '../utils',
    '../constants',

    // For effect
    'bootstrap',
    'css!./Main.css'
], (
    preact,
    htm,
    Loading,
    ErrorAlert,
    Uuid,
    {WindowChannelInit},
    narrativeConfig,
    Auth,
    Runtime,
    {findById, getCellMeta, setTitle},
    DynamicServiceClient,
    IFrame,
    {niceConfig},
    {PLUGIN_STARTUP_TIMEOUT}
) => {
    const {h, Component} = preact;
    const html = htm.bind(h);

    const STATUS = {
        NONE: 'NONE',
        PENDING: 'PENDING',
        SUCCESS: 'SUCCESS',
        ERROR: 'ERROR'
    }

    class Main extends Component {
        state = {
            status: STATUS.NONE,
        }

        constructor(props) {
            super(props);

            this.runtime = Runtime.make();
            this.hostChannelId = new Uuid(4).format();
            this.pluginChannelId = new Uuid(4).format();

            this.status = {
                status: STATUS.NONE,
            }
        }

        async componentDidMount() {
            this.setState({
                status: STATUS.PENDING
            });

            try {
                const serviceURL = await this.getServiceURL();

                this.setState({
                    status: STATUS.SUCCESS,
                    value: {
                        serviceURL
                    }
                })
            } catch (ex) {
                this.setState({
                    status: STATUS.ERROR,
                    error: {
                        message: ex.message
                    }
                })
            }
        }

         /**
         *
         * @param {*} iframeWindow - The window DOM object for the iframe containing the app
         * @param {*} params - The parameters to pass to the app when it is first loaded
         */
        onIframeLoaded(iframeWindow) {
            const chan = new WindowChannelInit({
                id: this.hostChannelId,
                window: iframeWindow.contentWindow,
                host: window.document.location.origin,
            });
            this.channel = chan.makeChannel(this.pluginChannelId);

            // The app should emit the 'clicked' event for any mouse clicks.
            // E.g. catch the click event on the body.
            // This allows anything in the host environment, like drop down windows,
            // which open and rely upon catching 'click' on the host body.
            this.channel.on('clicked', () => {
                window.document.body.click();
            });

            this.channel.on('click', () => {
                window.document.body.click();
            });

            // A widget may set the title of its cell.
             this.channel.on('set-title', ({title}) => {
                 console.log('setting title...', title);
                setTitle(this.props.cellId, title);
             });

            // TODO: re-enable auto sizing. The cell size should end up being
             // either the height of the internal widget, or the max height, whichever
             // is the least.
             // The cell is still resizable in case the user wants to make the cell taller
             // for a tall internal widget.

            // The iframe wrapper needs to be resized when the internal content is
            // resized
            // this.channel.on('resized', ({_width, height}) => {
            //     if (this.autoResize) {
            //         this.resizeHeight = Math.ceil(height);
            //         console.log('resizing...', this.resizeHeight, this.toolbarHeight);
            //         this.$widgetArea.css('height', `${this.resizeHeight}px`);
            //     }
            // });

            // The 'widget-state' event is emitted by the service widget app
            // when it's internal state is changed in a manner which it wants
            // to restore later, when it is reloaded.
            this.channel.on('widget-state', ({widgetState}) => {
                this.runtime.bus().send(
                    {
                        widgetState
                    },
                    {
                        channel: {
                            cell: this.props.cellId,
                        },
                        key: {
                            type: 'widget-state',
                        },
                    }
                );
            })

            // When the service widget app is fully loaded and ready to start
            // running, it needs to emit the 'ready' event. It may, optionally,
            // send its own channelId.
            // The latter allows for some small manner of extra security.
            //
            // This handler turns around and sends the 'start' event, along with
            // the standard payload of auth, configuration, and the app's params.
            //
            // Note that this event handler is only handled one time, and is then
            // removed from the channel.
            //
            // TODO: error handler in case of plugin startup timeout.
            this.channel.once('ready', PLUGIN_STARTUP_TIMEOUT, async ({channelId}) => {
                this.channel.setPartner(channelId || this.pluginChannelId);

                const authClient = Auth.make({
                    url: narrativeConfig.url('auth')
                })

                const token = authClient.getAuthToken();
                // const temp = await authClient.getCurrentProfile(token);
                // console.log('TEMP', temp);
                const {user: username, display: realname, roles} = await authClient.getCurrentProfile(token);

                const authentication = {
                    token,
                    username,
                    realname,
                    roles: roles.map(({ id }) => id)
                };

                // Some widget state may come from the props, which ultimately comes from the code cell's
                // Python snippet.
                const propsState = this.props.state || {};

                // We also get stored widget state from the cell's metadata.
                const widgetState = getCellMeta(findById(this.props.cellId), "kbase.serviceWidget.widgetState", {});

                const startMessage = {
                    authentication,
                    config: niceConfig(),
                    params: this.props.params,
                    state: {...propsState, ...widgetState}
                };

                this.channel.send('start', startMessage);
            });

            // The 'started' event is sent after the app receives and processes the
            // 'start' event.
            this.channel.once('started', PLUGIN_STARTUP_TIMEOUT, (message) => {
                // TODO: Remove the loading
            });

            this.channel.start();
        }

        async getServiceURL() {
            // TODO? what is this madness, get it from the runtime.
            const authClient = Auth.make({
                url: narrativeConfig.url('auth')
            })

            const token = authClient.getAuthToken();

            // Note that the service base url is the same form as the classic
            // environment variable KBASE_ENDPOINT, which includes the /services/ suffix,
            // which you will also note includes the training forward slash.
            // E.g. https://ci.kbase.us/servics/

            if (this.props.isDynamicService) {
                console.log('is dynamic service...');
                const {url} = await new DynamicServiceClient({
                    url: narrativeConfig.config.services.service_wizard.url,
                    module: this.props.moduleName,
                    timeout: 10000,
                    token
                }).getModule()
                console.log('got url', url);
                return url;
            }
            const [_, serviceBaseURL] = narrativeConfig.config.services.service_wizard.url.match(/^(.*\/services\/).*/);
            return new URL(`${serviceBaseURL}${this.props.moduleName}`).toString();
        }
        // actions

        renderPending() {
            return html`<${Loading} message="Loading..." />`;
        }

        renderError({message}) {
            return html`<${ErrorAlert} message=${message} />`
        }

        renderSuccess({serviceURL }) {
            return html`
                <${IFrame}
                    serviceURL=${serviceURL}
                    appName=${this.props.appName}
                    hostChannelId=${this.hostChannelId}
                    pluginChannelId=${this.pluginChannelId}
                    params=${this.props.params}
                    onLoaded=${this.onIframeLoaded.bind(this)}
                    />
            `;
        }

        // renderers
        // TODO: enable when we have a loading/error cover for the iframe
        renderState() {
            switch (this.state.status) {
                case STATUS.NONE:
                case STATUS.PENDING:
                    return this.renderPending();
                case STATUS.SUCCESS:
                    console.log('SUCCESS');
                    return this.renderSuccess(this.state.value);
                case STATUS.ERROR:
                    return this.renderError(this.state.error);
            }
        }

        render() {
            return html `
                <div className="nbextensions-serviceWidgetCell-Main">
                    ${this.renderState()}
                </div>
            `;
        }
    }

    return Main;
});
