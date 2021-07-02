define([
    'google-code-prettify/prettify',
    'kb_common/html',
    'common/runtime',
    'widgets/appWidgets2/errorControl',
    'css!google-code-prettify/prettify.css',
], (PR, html, Runtime, ErrorControlFactory) => {
    'use strict';

    const t = html.tag,
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
            const controlConfig = Object.assign({}, config, {bus, channelName: bus.channelName});
            inputControl = inputControlFactory.make(controlConfig);
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

            const content = div(
                {
                    class: `${cssBaseClass}__rowCell`,
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

            const rendered = render();
            container.innerHTML = rendered.content;
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
