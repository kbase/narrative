define([
    'bluebird',
    'common/ui',
    'common/html',
    'common/events',
    'common/runtime',
    '../paramsWidget'
], (
    Promise,
    UI,
    html,
    Events,
    runtime,
    ParamsWidget
) => {
    'use strict';

    const div = html.tag('div'),
        span = html.tag('span'),
        form = html.tag('form');

    function ConfigureWidget(options) {
        const bus = options.bus;
        let container = null,
            ui = null;

        /**
         * args includes:
         *  - node - the DOM node to act as this widget's container
         *  - something something inputs and parameters
         * @param {object} args
         */
        function start(args) {
            return Promise.try(() => {
                container = args.node;
                ui = UI.make({
                    node: container,
                    bus: bus
                });

                loadParamsWidget(args);
                const layout = renderLayout();
                container.innerHTML = layout.content;
                layout.events.attachEvents(container);
            });
        }

        function loadParamsWidget(arg) {
            console.log('we have loaded the params widgeth: ', ParamsWidget, ' args are: ', arg);

            const bus = runtime.bus().makeChannelBus({ 
                    description: 'Parent comm bus for input widget' 
                }),
            widget = ParamsWidget.make({
                    bus: bus,
                    workspaceInfo: arg.workspaceInfo
                });

            bus.emit('run', {
                node: arg.node,
                appSpec: arg.appSpec,
                parameters: arg.parameters
            });

            bus.on('sync-params', function(message) {
                message.parameters.forEach(function(paramId) {
                    bus.send({
                        parameter: paramId,
                        value: arg.model.getItem(['params', message.parameter])
                    }, {
                        key: {
                            type: 'update',
                            parameter: message.parameter
                        }
                    });
                });
            });

            bus.on('parameter-sync', function(message) {
                var value = arg.model.getItem(['params', message.parameter]);
                bus.send({
                    //                            parameter: message.parameter,
                    value: value
                }, {
                    // This points the update back to a listener on this key
                    key: {
                        type: 'update',
                        parameter: message.parameter
                    }
                });
            });

            bus.respond({
                key: {
                    type: 'get-parameter'
                },
                handle: function(message) {
                    return {
                        value: arg.model.getItem(['params', message.parameterName])
                    };
                }
            });

            bus.on('parameter-changed', function(message) {
                arg.model.setItem(['params', message.parameter], message.newValue);
                // evaluateAppState();
            });

            //start the widget
            //return the bus and widget instance (?)
        }

        function renderLayout() {
            let events = Events.make(),
                formContent = [
                    ui.buildPanel({
                        title: span([
                            'File Paths',
                            span({
                                dataElement: 'advanced-hidden-message',
                                style: {
                                    marginLeft: '6px',
                                    fontStyle: 'italic'
                                }
                            })]),
                        name: 'file-paths-area',
                        body: div({ dataElement: 'file-path-fields' }),
                        classes: ['kb-panel-light']
                    }),
                    ui.buildPanel({
                        title: span([
                            'Parameters',
                            span({
                                dataElement: 'advanced-hidden-message',
                                style: {
                                    marginLeft: '6px',
                                    fontStyle: 'italic'
                                }
                            })]),
                        name: 'parameters-area',
                        body: div({ dataElement: 'parameter-fields' }),
                        classes: ['kb-panel-light']
                    }),
                ];
            const content = form({ dataElement: 'input-widget-form' }, formContent);
            return {
                content: content,
                events: events
            };

        }

        function stop() {
            container.innerHTML = '';
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
