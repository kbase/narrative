define([
    'google-code-prettify/prettify',
    'kb_common/html',
    'common/events',
    'common/runtime',
    'widgets/appWidgets2/errorControl',
    'css!google-code-prettify/prettify.css',
], (PR, html, Events, Runtime, ErrorControlFactory) => {
    'use strict';

    const t = html.tag,
        td = t('td'),
        div = t('div'),
        label = t('label'),
        cssBaseClass = 'kb-field-cell';

    function factory(config) {
        const runtime = Runtime.make(),
            bus = runtime.bus().makeChannelBus({
                description: 'Field bus',
            }),
            inputControlFactory = config.inputControlFactory,
            spec = config.parameterSpec;
        let places, parent, container, inputControl;

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
                message: ex.message,
            }).make();
        }

        function render() {
            const ids = {
                fieldPanel: html.genId(),
                inputControl: html.genId(),
            };

            const content = td(
                {
                    class: `${cssBaseClass}__tableCell`,
                    id: ids.fieldPanel,
                    dataElement: 'field-panel',
                },
                [
                    label(
                        {
                            class: `${cssBaseClass}__cell_label`,
                            title: spec.ui.label || spec.ui.id,
                            for: ids.inputControl,
                        },
                        [spec.ui.label || spec.ui.id]
                    ),
                    div({
                        class: `${cssBaseClass}__input_control`,
                        id: ids.inputControl,
                        dataElement: 'input-control',
                    }),
                ]
            );

            return {
                content: content,
                ids: ids,
            };
        }

        // LIFECYCLE

        function attach(node) {
            parent = node;
            const containerDiv = document.createElement('div');
            containerDiv.classList.add(`${cssBaseClass}__param_container`);

            container = parent.appendChild(containerDiv);
            const events = Events.make({
                node: container,
            });

            const rendered = render(events);
            container.innerHTML = rendered.content;
            events.attachEvents();
            // TODO: use the pattern in which the render returns an object,
            // which includes events and other functions to be run after
            // content is added to the dom.
            PR.prettyPrint(null, container);

            places = {
                inputControl: container.querySelector('#' + rendered.ids.inputControl),
            };
        }

        function start(arg) {
            attach(arg.node);

            return inputControl
                .start({
                    node: places.inputControl,
                })
                .then(() => {
                    // TODO: get rid of this pattern
                    bus.emit('run', {
                        node: places.inputControl,
                    });
                })
                .catch((error) => {
                    throw new Error(`Unable to start fieldTableCellWidget: ${error}`);
                });
        }

        function stop() {
            return inputControl
                .stop()
                .then(() => {
                    if (parent && container) {
                        parent.removeChild(container);
                    }
                    bus.stop();
                    return null;
                })
                .catch((err) => {
                    console.error('Error stopping fieldTableCellWidget: ', err);
                    if (parent && container) {
                        parent.removeChild(container);
                    }
                    bus.stop();
                    return null;
                });
        }

        return {
            start: start,
            stop: stop,
            bus: bus,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
