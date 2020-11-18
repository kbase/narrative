define([
    'bluebird',
    'common/ui',
    'common/html',
    'common/events',
    'common/runtime',
    'common/props',
    'common/utils',
    'common/spec',
    '../paramsWidget'
], (
    Promise,
    UI,
    html,
    Events,
    Runtime,
    Props,
    utils,
    Spec,
    ParamsWidget
) => {
    'use strict';

    const div = html.tag('div'),
        span = html.tag('span'),
        form = html.tag('form');

    /*
        Options:
            bus: message bus
            workspaceInfo: 
    */
    function ConfigureWidget(options) {
        const bus = options.bus,
            workspaceInfo = options.workspaceInfo,
            cell = options.cell;

        let container = null,
            ui = null,
            runtime = Runtime.make();

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

                //TODO: not sure about using this Props factory
                this.model = Props.make({
                    data: utils.getMeta(cell, 'appCell'),
                    onUpdate: function(props) {
                        utils.setMeta(cell, 'appCell', props.getRawObject());
                    }
                });

                this.spec = Spec.make({
                    appSpec: this.model.getItem('app.spec')
                });

                //TODO: this should return a widget and bus we can attach to the container 
                loadParamsWidget({
                    bus: bus,
                    workspaceInfo: workspaceInfo
                });

                const layout = renderLayout(args);
                container.innerHTML = layout.content;
                layout.events.attachEvents(container);
            });          
        
        }


        /*
            to initalize a params widget pass in: 
                * bus
                * workspaceInfo
                * initialParams

            assuming we have a single instance of a tab per app run

            in the app cell the configure widget is loaded with the returned parameter widget 
        */
        function loadParamsWidget(options) {
            console.log('we have loaded the params widget, options: ', options);

            //TODO: is this the right way to set the message bus? or should it use the bus we can receive from the parent container? 
            const bus = runtime.bus().makeChannelBus({ description: 'Parent comm bus for input widget' });

            const workspaceInfo = options.workspaceInfo;

            const widget = ParamsWidget.make({
                bus: bus,
                workspaceInfo: workspaceInfo,
                initialParams: this.model.getItem('params')
            });

            bus.on('sync-params', function(message) {
                message.parameters.forEach(function(paramId) {
                    bus.send({
                        parameter: paramId,
                        value: this.model.getItem(['params', message.parameter])
                    }, {
                        key: {
                            type: 'update',
                            parameter: message.parameter
                        }
                    });
                });
            });

            bus.on('parameter-sync', function(message) {
                var value = this.model.getItem(['params', message.parameter]);
                bus.send({
                    value: value
                }, {
                    // This points the update back to a listener on this key
                    key: {
                        type: 'update',
                        parameter: message.parameter
                    }
                });
            });

            bus.on('set-param-state', function(message) {
                this.model.setItem('paramState', message.id, message.state);
            });

            bus.respond({
                key: {
                    type: 'get-param-state'
                },
                handle: function(message) {
                    return {
                        state: this.model.getItem('paramState', message.id)
                    };
                }
            });

            bus.respond({
                key: {
                    type: 'get-parameter'
                },
                handle: function(message) {
                    return {
                        value: this.model.getItem(['params', message.parameterName])
                    };
                }
            });

            //TODO: disabling for now until we figure out what to do about state
            // bus.on('parameter-changed', function(message) {
            //     // TODO: should never get these in the following states....

            //     let state = fsm.getCurrentState().state;
            //     let isError = Boolean(message.isError);
            //     if (state.mode === 'editing') {
            //         this.model.setItem(['params', message.parameter], message.newValue);
            //         evaluateAppState(isError);
            //     } else {
            //         console.warn('parameter-changed event detected when not in editing mode - ignored');
            //     }
            // });

            //TODO: how to handle the app spec and param retreival?
            return widget.start({
                node: options.node,
                appSpec: this.model.getItem('app.spec'),
                parameters: this.spec.getSpec().parameters
            })
                .then(function() {
                    return {
                        bus: bus,
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
                                dataElement: 'advanced-hidden-message'
                            })]),
                        name: 'file-paths-area',
                        body: div({ dataElement: 'file-path-fields' }),
                        classes: ['kb-panel-light']
                    }),
                    ui.buildPanel({
                        title: span([
                            'Parameters',
                            span({
                                dataElement: 'advanced-hidden-message'
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
