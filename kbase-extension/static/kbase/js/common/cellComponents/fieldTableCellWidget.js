define([
    'bluebird',
    'google-code-prettify/prettify',
    'kb_common/html',
    'common/events',
    'common/runtime',
    'widgets/appWidgets2/errorControl',
    'css!google-code-prettify/prettify.css'
], function(
    Promise,
    PR,
    html,
    Events,
    Runtime,
    ErrorControlFactory
) {

    'use strict';

    const t = html.tag,
        td = t('td'),
        div = t('div'),
        label = t('label'),
        cssBaseClass = 'kb-field-cell';

    function factory(config) {
        var runtime = Runtime.make(),
            bus = runtime.bus().makeChannelBus({
                description: 'Field bus'
            }),
            places,
            parent,
            container,
            inputControlFactory = config.inputControlFactory,
            inputControl,
            fieldId = html.genId(),
            spec = config.parameterSpec;

        try {
            inputControl = inputControlFactory.make({
                bus: bus,
                paramsChannelName: config.paramsChannelName,
                channelName: bus.channelName,
                initialValue: config.initialValue,
                appSpec: config.appSpec,
                parameterSpec: config.parameterSpec,
                workspaceInfo: config.workspaceInfo,
                workspaceId: config.workspaceId,
                fieldSpec: config.fieldSpec,
                referenceType: config.referenceType,
                closeParameters: config.closeParameters,
            });
        } catch (ex) {
            console.error('Error creating input control', ex);
            inputControl = ErrorControlFactory.make({
                message: ex.message
            }).make();
        }

        function render(events) {
            var ids = {
                fieldPanel: html.genId(),
                inputControl: html.genId(),
            };

            var content = td({
                class: `${cssBaseClass}__tableCell`,
                id: ids.fieldPanel,
                dataElement: 'field-panel'
            }, [
                label({
                    class: `${cssBaseClass}__cell_label`,
                    title: spec.ui.label || spec.ui.id,
                    for: ids.inputControl,
                    id: events.addEvent({
                        type: 'click',
                        handler: function() {
                            places.infoPanel.querySelector('[data-element="big-tip"]').classList.toggle('hidden');
                        }
                    })
                }, [
                    spec.ui.label || spec.ui.id
                ]),
                div({
                    class: `${cssBaseClass}__input_control`,
                    id: ids.inputControl,
                    dataElement: 'input-control'
                })
            ]);

            return {
                content: content,
                places: ids
            };
        }

        // LIFECYCLE

        function attach(node) {
            return Promise.try(function() {
                parent = node;
                let containerDiv = document.createElement('div');
                containerDiv.classList.add(`${cssBaseClass}__param_container`);

                container = parent.appendChild(containerDiv);
                var events = Events.make({
                    node: container
                });

                var rendered = render(events);
                container.innerHTML = rendered.content;
                events.attachEvents();
                // TODO: use the pattern in which the render returns an object,
                // which includes events and other functions to be run after
                // content is added to the dom.
                PR.prettyPrint(null, container);

                places = {
                    field: document.getElementById(fieldId),
                    message: document.getElementById(rendered.places.message),
                    inputControl: document.getElementById(rendered.places.inputControl)
                };
                if (inputControl.attach) {
                    return inputControl.attach(places.inputControl);
                }
            });
        }

        function start(arg) {
            return attach(arg.node)
                .then(function() {
                    if (inputControl.start) {
                        return inputControl.start({
                            node: places.inputControl
                        })
                            .then(function() {
                                // TODO: get rid of this pattern
                                bus.emit('run', {
                                    node: places.inputControl
                                });
                            });
                    }
                });
        }

        function stop() {
            return Promise.try(function() {
                return inputControl.stop()
                    .then(function() {
                        if (parent && container) {
                            parent.removeChild(container);
                        }
                        bus.stop();
                        return null;
                    });
            });
        }

        return {
            start: start,
            stop: stop,
            bus: bus
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});