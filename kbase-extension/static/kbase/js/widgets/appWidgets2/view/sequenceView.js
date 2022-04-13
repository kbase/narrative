define([
    'require',
    'bluebird',
    'common/html',
    'common/events',
    'common/ui',
    'common/runtime',
    'util/util',
    'common/props',
    '../paramResolver',
    '../validators/sequence',
    '../fieldWidgetMicro',

    'bootstrap',
], (
    require,
    Promise,
    html,
    Events,
    UI,
    Runtime,
    Util,
    Props,
    Resolver,
    Validation,
    FieldWidget
) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        button = t('button');

    function factory(config) {
        let container, parent, ui;
        const spec = config.parameterSpec,
            itemSpec = spec.parameters.specs.item,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            model = {
                value: [],
            },
            viewModel = Props.make({
                data: {
                    items: [],
                },
            }),
            resolver = Resolver.make();

        function normalizeModel() {
            const newModel = model.value.filter((item) => {
                return item ? true : false;
            });
            model.value = newModel;
        }

        function setModelValue(value, index) {
            return Promise.try(() => {
                if (index !== undefined) {
                    if (value) {
                        model.value[index] = value;
                    } else {
                        model.value.splice(index, 1);
                    }
                } else {
                    if (value) {
                        model.value = value;
                    } else {
                        unsetModelValue();
                    }
                }
                normalizeModel();
            }).then(() => {
                return render();
            });
        }

        function unsetModelValue() {
            return Promise.try(() => {
                model.value = [];
            }).then(() => {
                return render();
            });
        }

        function resetModelValue() {
            return;
        }

        function exportModel() {
            return viewModel.getItem('items').map((value) => {
                return value.value;
            });
        }

        function validate(rawValue) {
            return Promise.try(() => {
                // TODO: validate all items within the list as well!
                return Validation.validate(rawValue, spec);
            });
        }

        // TODO: wrap this in a new type of field control --
        //   specialized to be very lightweight for the sequence control.
        function makeSingleViewControl(control) {
            return resolver.loadViewControl(itemSpec).then((widgetFactory) => {
                // CONTROL
                const widgetId = html.genId(),
                    inputBus = runtime.bus().makeChannelBus({
                        description: 'Array input control',
                    }),
                    fieldWidget = FieldWidget.make({
                        inputControlFactory: widgetFactory,
                        showHint: false,
                        showLabel: false,
                        showInfo: false,
                        useRowHighight: true,
                        initialValue: control.value,
                        parameterSpec: itemSpec,
                        referenceType: 'ref',
                        paramsChannelName: config.paramsChannelName,
                    });

                // set up listeners for the input
                fieldWidget.bus.on('sync', () => {
                    const value = viewModel.getItem(['items', control.index, 'value']);
                    if (value) {
                        inputBus.emit('update', {
                            value: value,
                        });
                    }
                });

                fieldWidget.bus.respond({
                    key: {
                        type: 'get-parameter',
                    },
                    handle: function (message) {
                        if (message.parameterName) {
                            return channel.request(message, {
                                key: {
                                    type: 'get-parameter',
                                },
                            });
                        } else {
                            return null;
                        }
                    },
                });

                const postButton = div(
                    {
                        class: 'input-group-addon kb-input-group-addon',
                        style: {
                            padding: '0',
                        },
                    },
                    button(
                        {
                            class: 'btn btn-link btn-xs',
                            type: 'button',
                            style: { width: '4ex' },
                            dataIndex: String(control.index),
                        },
                        ''
                    )
                );
                const content = div(
                    {
                        dataElement: 'input-row',
                        dataIndex: String(control.index),
                        style: {
                            width: '100%',
                            padding: '2px',
                        },
                    },
                    [div({ class: 'input-group' }, [div({ id: widgetId }), postButton])]
                );
                return {
                    id: widgetId,
                    instance: fieldWidget,
                    bus: inputBus,
                    content: content,
                };
            });
        }

        // DOM EVENTS & HANDLERS

        /*
            Add a new model element and associated input control.
            First version: append a new default value to the model,
              and then re-render.
            Second version:
              Append a new default value to the model.
              Create and append a new input control to the DOM
              Set focus on the new input control
        */

        function addNewControl(initialValue) {
            if (initialValue === undefined) {
                initialValue = Util.copy(itemSpec.data.defaultValue);
            }
            return Promise.try(() => {
                const events = Events.make({ node: container });
                const control = {
                    // current native value.
                    value: initialValue,
                    // the actual input control (or field wrapper around such)
                    inputControl: null,
                    // the actual dome node (used?) to which the input control is attached
                    node: null,
                    // the current index - note: used by the inputControl
                    index: null,
                };
                const index = viewModel.pushItem(['items'], control);
                control.index = index;
                const parent = ui.getElement('control-container');
                const controlNode = document.createElement('div');
                parent.appendChild(controlNode);
                return makeSingleViewControl(control, events)
                    .then((inputControl) => {
                        // This adds the control wrapper html.
                        controlNode.innerHTML = inputControl.content;
                        // Each wrapper has a node inside with id "id" for
                        // the control to attach to.
                        const attachmentNode = document.getElementById(inputControl.id);
                        control.node = controlNode;
                        control.inputControl = inputControl;

                        return inputControl.instance.start({
                            node: attachmentNode,
                        });
                    })
                    .then(() => {
                        events.attachEvents();
                        return index;
                    })
                    .catch((err) => {
                        console.error('ERROR!!!', err);
                    });
            });
        }

        function addEmptyControl() {
            const controlContainer = ui.getElement('control-container');
            controlContainer.innerHTML = div(
                {
                    style: {
                        fontStyle: 'italic',
                        color: 'gray',
                    },
                },
                'no items to display'
            );
        }

        function render(initialValue) {
            return Promise.try(() => {
                // render now just builds the initial view
                container.innerHTML = makeLayout();

                if (!initialValue || initialValue.length === 0) {
                    return addEmptyControl();
                }
                return Promise.all(
                    initialValue.map((value) => {
                        return addNewControl(value);
                    })
                ).then(() => {
                    autoValidate();
                });
            });
        }

        function makeLayout() {
            return div(
                {
                    dataElement: 'main-panel',
                },
                [
                    div({
                        dataElement: 'control-container',
                    }),
                ]
            );
        }

        function autoValidate() {
            return validate(exportModel()).then((result) => {
                channel.emit('validation', result);
            });
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                return render(config.initialValue).then(() => {
                    channel.on('reset-to-defaults', () => {
                        resetModelValue();
                    });
                    channel.on('update', (message) => {
                        setModelValue(message.value);
                    });
                    channel.on('refresh', () => {});

                    return autoValidate();
                    // bus.emit('sync');
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                return Promise.all(
                    viewModel.getItem('items').map((item) => {
                        return item.inputControl.instance.stop();
                    })
                ).then(() => {
                    busConnection.stop();
                });
            });
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
