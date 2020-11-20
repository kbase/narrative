define([
    'bluebird',
    'common/ui',
    'common/html',
    'common/events',
    'common/runtime',
    'common/cellComponents/paramsWidget'
], (
    Promise,
    UI,
    html,
    Events,
    Runtime,
    ParamsWidget
) => {
    'use strict';

    const div = html.tag('div'),
        span = html.tag('span'),
        form = html.tag('form'),
        cssCellType = 'kb-bulk-import-configure';

    /*
        Options:
            bus: message bus
            workspaceInfo: workspace information
            model: cell metadata
            spec: app spec 
    */
    function ConfigureWidget(options) {
        const bus = options.bus,
            workspaceInfo = options.workspaceInfo,
            model = options.model,
            spec = options.spec;

        let container = null,
            ui = null,
            runtime = Runtime.make();

        /**
         * args includes:
         *  - node - the DOM node to act as this widget's container
         *  - workspaceInfo - workspace information used to intialize the parameter widget
         * @param {object} args
         */
        function start(args) {
            return Promise.try(() => {
                container = args.node;
                ui = UI.make({
                    node: container,
                    bus: bus
                });

                const layout = renderLayout();
                container.innerHTML = layout.content;

                let paramNode = document.createElement('div');
                container.appendChild(paramNode);

                buildParamsWidget(paramNode).then(() => {                    
                    layout.events.attachEvents(container);
                });

            });          
        
        }


        /*
            node: container node to build the widget into
            This is more or less copied over from the way that the appCell handles building the widget. This model assumes one instance of the params widget per cell, so may need some adjustment as we make the bulk import work with multiple data types
        */
        function buildParamsWidget(node) {
            const paramBus = runtime.bus().makeChannelBus({ description: 'Parent comm bus for input widget' });

            const widget = ParamsWidget.make({
                bus: paramBus,
                workspaceInfo: workspaceInfo,
                initialParams: model.getItem('params')
            });

            //TODO: how do these differ from the bus commands on the paramsWidget itself? do we need all of them?
            paramBus.on('sync-params', function(message) {
                message.parameters.forEach(function(paramId) {
                    paramBus.send({
                        parameter: paramId,
                        value: model.getItem(['params', message.parameter])
                    }, {
                        key: {
                            type: 'update',
                            parameter: message.parameter
                        }
                    });
                });
            });

            paramBus.on('parameter-sync', function(message) {
                var value = model.getItem(['params', message.parameter]);
                paramBus.send({
                    value: value
                }, {
                    // This points the update back to a listener on this key
                    key: {
                        type: 'update',
                        parameter: message.parameter
                    }
                });
            });

            paramBus.on('set-param-state', function(message) {
                model.setItem('paramState', message.id, message.state);
            });

            paramBus.respond({
                key: {
                    type: 'get-param-state'
                },
                handle: function(message) {
                    return {
                        state: model.getItem('paramState', message.id)
                    };
                }
            });

            paramBus.respond({
                key: {
                    type: 'get-parameter'
                },
                handle: function(message) {
                    return {
                        value: model.getItem(['params', message.parameterName])
                    };
                }
            });

            //TODO: disabling for now until we figure out what to do about state
            // paramBus.on('parameter-changed', function(message) {
            //     // TODO: should never get these in the following states....

            //     let state = fsm.getCurrentState().state;
            //     let isError = Boolean(message.isError);
            //     if (state.mode === 'editing') {
            //         model.setItem(['params', message.parameter], message.newValue);
            //         evaluateAppState(isError);
            //     } else {
            //         console.warn('parameter-changed event detected when not in editing mode - ignored');
            //     }
            // });

            return widget.start({
                node: node,
                appSpec: model.getItem('app.spec'),
                parameters: spec.getSpec().parameters
            })
                .then(function() {
                    return {
                        bus: paramBus,
                        instance: widget
                    };
                });
        }

        function renderLayout() {

            let events = Events.make(),
                formContent = [
                    ui.buildPanel({
                        title: span([
                            'File Paths',
                            span({
                                class: `${cssCellType}__advanced_hidden_message`,
                                dataElement: 'advanced-hidden-message'
                            })]),
                        name: 'file-paths-area',
                        body: div({ dataElement: 'file-path-fields' }),
                        classes: ['kb-panel-light']
                    })
                ];

            const content = form({ dataElement: 'input-widget-form' }, formContent);

            return {
                content: content,
                events: events
            };
        }

        function stop() {
            return Promise.try(() => {
                container.innerHTML = '';
            });
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: ConfigureWidget
    };
});