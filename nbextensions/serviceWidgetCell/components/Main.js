define([
    'preact',
    'preact_compat',
    'prop_types',
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
    './IFrame',
    '../utils',
    '../constants',

    // For effect
    'bootstrap',
], (
    preact,
    preactCompat,
    PropTypes,
    htm,
    Loading,
    ErrorAlert,
    Uuid,
    SendChannel,
    ReceiveChannel,
    narrativeConfig,
    Auth,
    Runtime,
    cellUtils,
    DynamicServiceClient,
    IFrame,
    utils,
    constants
) => {
    'use strict';

    const { h } = preact;
    const { Component } = preactCompat;
    const html = htm.bind(h);

    const { getCellMeta, setTitle } = cellUtils;
    const { niceConfig } = utils;
    const { WIDGET_SERVICE_TIMEOUT } = constants;

    const STATUS = {
        NONE: 'NONE',
        PENDING: 'PENDING',
        SUCCESS: 'SUCCESS',
        ERROR: 'ERROR',
    };

    /**
     * @typedef {object} MainProps
     * @property {string} moduleName The name of the service model which will be serving
     * the widget app.
     * @property {string} widgetName The name of the widget within the service
     * @property {boolean} isDynamicService Whether the service is a dynamic service or not
     * @property {object} params A parameters object utilized by the widget; think parameters
     * for a widget like function parameters.
     * @property {object} state The state object contains dynamic information which can
     * be utilized by the widget; typically state is set by the service widget or widget
     * app, stored in the cell metadata, and restored to the cell and cell app when the
     * cell is next revived.
     * @property {string} cellId The cell's unique, persistent id; used by to coordinate
     * events between this cell and the widget app.
     *
     *  @typedef {Object} NotebookCell The native notebook cell object.
     */

    class Main extends Component {
        /**
         *
         * @param {MainProps} props
         */
        constructor(props) {
            super(props);

            this.runtime = Runtime.make();

            // For the postMessage communication with the widget.
            this.channelId = new Uuid(4).format();
            this.receiveChannel = new ReceiveChannel({
                window,
                channel: this.channelId,
            });

            this.status = {
                status: STATUS.NONE,
            };
        }

        async componentDidMount() {
            this.setState({
                status: STATUS.PENDING,
            });

            try {
                const serviceURL = await this.getServiceURL();
                this.setState({
                    status: STATUS.SUCCESS,
                    value: {
                        serviceURL,
                    },
                });
            } catch (ex) {
                this.setState({
                    status: STATUS.ERROR,
                    error: {
                        message: ex.message,
                    },
                });
            }
        }

        /**
         * Called when the iframe has been loaded, as signaled by the 'load' event on
         * the window.
         *
         * @param {Window} iframeWindow - The window DOM object for the iframe containing the app
         *
         * @returns {void}
         */
        onIFrameLoaded(iframeWindow) {
            const targetOrigin = new URL(this.state.value.serviceURL).origin;
            this.sendChannel = new SendChannel({
                window: iframeWindow.contentWindow,
                targetOrigin,
                channel: this.channelId,
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
                this.props.cell.element.click();
            });

            // A widget may set the title of its cell.
            this.receiveChannel.on('set-title', ({ title }) => {
                setTitle(this.props.cell, title);
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
            this.receiveChannel.on('widget-state', ({ widgetState }) => {
                this.runtime.bus().send(
                    {
                        widgetState,
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
            });

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
            this.receiveChannel.once('ready', WIDGET_SERVICE_TIMEOUT, async () => {
                const authClient = Auth.make({
                    url: narrativeConfig.url('auth'),
                });

                const token = authClient.getAuthToken();
                const {
                    user: username,
                    display: realname,
                    roles,
                } = await authClient.getCurrentProfile(token);

                const authentication = {
                    token,
                    username,
                    realname,
                    roles: roles.map(({ id }) => id),
                };

                // Some widget state may come from the props, which ultimately comes from the code cell's
                // Python snippet.
                const propsState = this.props.state || {};

                // We also get stored widget state from the cell's metadata.
                const widgetState = getCellMeta(this.props.cell, 'kbase.widgetState', {});

                const startMessage = {
                    authentication,
                    config: niceConfig(),
                    params: this.props.params,
                    state: Object.assign({}, propsState, widgetState),
                };

                this.sendChannel.send('start', startMessage);
            });

            // The 'started' event is sent after the app receives and processes the
            // 'start' event.
            this.receiveChannel.once('started', WIDGET_SERVICE_TIMEOUT, ({ height }) => {
                this.$widgetArea.css('height', `${height}px`);
            });

            this.receiveChannel.start();

            this.props.onDelete(() => {
                this.receiveChannel.stop();
            });
        }

        /**
         *
         * @returns
         */
        async getServiceURL() {
            const { url } = await new DynamicServiceClient({
                url: narrativeConfig.config.services.service_wizard.url,
                module: this.props.moduleName,
                timeout: 10000,
            }).getModule();
            return url;
        }

        // actions

        renderPending() {
            return html`<${Loading} message="Loading..." />`;
        }

        renderError({ message }) {
            return html`<${ErrorAlert} message=${message} />`;
        }

        renderSuccess({ serviceURL }) {
            return html`
                <${IFrame}
                    serviceURL=${serviceURL}
                    widgetName=${this.props.widgetName}
                    channelId=${this.channelId}
                    params=${this.props.params}
                    onLoaded=${this.onIFrameLoaded.bind(this)}
                />
            `;
        }

        // renderers
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
            return html`
                <div className="nbextensions-serviceWidgetCell-Main">${this.renderState()}</div>
            `;
        }
    }

    Main.propTypes = {
        cell: PropTypes.object.isRequired,
        cellId: PropTypes.string.isRequired,
        state: PropTypes.object,
        params: PropTypes.object.isRequired,
        moduleName: PropTypes.string.isRequired,
        widgetName: PropTypes.string.isRequired,
        onDelete: PropTypes.func.isRequired,
    };

    return Main;
});
