define([
    'preact',
    'htm',
    'preactComponents/Loading',
    'preactComponents/ErrorAlert',
    'uuid',
    '../util/SendChannel',
    '../util/ReceiveChannel',
    'narrativeConfig',
    'api/auth',
    'common/runtime',
    'common/cellUtils',
    'jsonrpc/1.1/DynamicServiceClient',
    'base/js/namespace',
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
    {SendChannel},
    {ReceiveChannel},
    narrativeConfig,
    Auth,
    Runtime,
    {findById, getCellMeta, setTitle},
    DynamicServiceClient,
    Jupyter,
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

            // For the postMessage communication with the widget.
            this.hostChannelId = new Uuid(4).format();
            this.guestChannelId = new Uuid(4).format();
            this.receiveChannel = new ReceiveChannel({
                window,
                id: this.hostChannelId
            });
            this.receiveChannel.receiveFrom(this.guestChannelId);


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

        findCellForId(id) {
            const matchingCells = Jupyter.notebook.get_cells().filter((cell) => {
                if (cell.metadata && cell.metadata.kbase && cell.metadata.kbase.attributes) {
                    return cell.metadata.kbase.attributes.id === id;
                }
                return false;
            });
            if (matchingCells.length === 1) {
                return matchingCells[0];
            }
            return null;
        }

         /**
         *
         * @param {*} iframeWindow - The window DOM object for the iframe containing the app
         * @param {*} params - The parameters to pass to the app when it is first loaded
         */
        onIframeLoaded(iframeWindow) {
            // if (this.state.status !== 'SUCCESS') {
            //     return;
            // }

            const targetOrigin = new URL(this.state.value.serviceURL).origin;
            this.sendChannel = new SendChannel({
                window: iframeWindow.contentWindow,
                targetOrigin,
                id: this.hostChannelId,
                to: this.guestChannelId
            });

            // The app in the iframe should emit the 'clicked' event for any mouse clicks.
            // E.g. catch the click event on the body.
            // 
            // This allows ui elements in the host environment, like drop down windows,
            // which rely upon catching 'click' events on the body, to operate as
            // expected.
            //
            // For example, dropdown menus should close automatically when the user
            // clicks anywhere outside the menu. Without propagating a click from inside
            // the iframe, the menu would not close if a user clicked inside the iframe.
            //
            this.receiveChannel.on('click', () => {
                const cell = this.findCellForId(this.props.cellId);
                if (!cell) {
                    return;
                }
                cell.element.click();
            });

            // A widget may set the title of its cell.
             this.receiveChannel.on('set-title', ({title}) => {
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
            this.receiveChannel.on('widget-state', ({widgetState}) => {
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
            this.receiveChannel.once('ready', PLUGIN_STARTUP_TIMEOUT, async ({channelId}) => {
                // this.channel.setPartner(channelId || this.pluginChannelId);
                this.receiveChannel.receiveFrom(channelId || this.guestChannelId);

                const authClient = Auth.make({
                    url: narrativeConfig.url('auth')
                })

                const token = authClient.getAuthToken();
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

                this.sendChannel.send('start', startMessage);
            });

            // The 'started' event is sent after the app receives and processes the
            // 'start' event.
            this.receiveChannel.once('started', PLUGIN_STARTUP_TIMEOUT, ({height, channelId}) => {
                // TODO: Remove the loading
                this.$widgetArea.css('height', `${height}px`);
            });

            this.receiveChannel.start();
        }

        async getServiceURL() {
            const authClient = Auth.make({
                url: narrativeConfig.url('auth')
            })

            const token = authClient.getAuthToken();

            // Note that the service base url is the same form as the classic
            // environment variable KBASE_ENDPOINT, which includes the /services/ suffix,
            // which you will also note includes the training forward slash.
            // E.g. https://ci.kbase.us/servics/

            if (this.props.isDynamicService) {
                const {url} = await new DynamicServiceClient({
                    url: narrativeConfig.config.services.service_wizard.url,
                    module: this.props.moduleName,
                    timeout: 10000,
                    token
                }).getModule()
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
                    guestChannelId=${this.guestChannelId}
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
