define([
    'bluebird',
    'common/html',
    'common/events',
    'common/ui',
    'common/runtime',
    'util/util',
    'common/props',
    '../paramResolver',
    'widgets/appWidgets2/validators/sequence',
    '../fieldWidgetMicro',

    'bootstrap',
], (Promise, html, Events, UI, Runtime, Util, Props, ParamResolver, Validation, FieldWidget) => {
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
            viewModel = Props.make({
                data: {
                    items: [],
                },
                onUpdate: function () {
                    doModelUpdated();
                },
            }),
            resolver = ParamResolver.make();

        function doModelUpdated() {
            const exported = exportModel();
            channel.emit('changed', {
                newValue: exported.values,
                newDisplayValue: exported.displays,
            });
        }

        function exportModel() {
            return viewModel.getItem('items').reduce(
                (prev, item) => {
                    prev.values.push(item.value);
                    prev.displays.push(item.display);
                    return prev;
                },
                { values: [], displays: [] }
            );
        }

        function validate(rawValue) {
            return Promise.try(() => {
                // TODO: validate all items within the list as well!
                return Validation.validate(rawValue, spec);
            });
        }

        function doRemoveControl(control) {
            const item = viewModel.getItem(['items', control.index]);

            // Remove item from viewmodel.
            const items = viewModel.getItem('items');
            items.splice(control.index, 1);

            // stop the field widget. This will unook all listeners
            // and also clear the dom node.
            item.inputControl.instance.stop().then(() => {
                // And we also need to remove the wrapper div attachment
                // point as well.
                item.node.parentNode.removeChild(item.node);

                // Now, to renumber. Oh, fun!
                items.forEach((control, index) => {
                    control.index = index;
                    UI.make({ node: control.node }).setContent(
                        'index-label.index',
                        String(index + 1)
                    );
                });

                viewModel.setItem('items', items);

                autoValidate();
            });
        }

        function doChanged(index, value, display) {
            viewModel.setItem(['items', index, 'value'], value);
            viewModel.setItem(['items', index, 'display'], display);
            return validate(exportModel().values).then((result) => {
                channel.emit('validation', result);
            });
        }

        // TODO: wrap this in a new type of field control --
        //   specialized to be very lightweight for the sequence control.
        function makeSingleInputControl(control, events) {
            return resolver.loadInputControl(itemSpec).then((widgetFactory) => {
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
                        initialDisplayValue: control.displayValue,
                        parameterSpec: itemSpec,
                        referenceType: 'ref',
                        paramsChannelName: config.paramsChannelName,
                    });

                // set up listeners for the input
                fieldWidget.bus.on('sync', () => {
                    const value = viewModel.getItem(['items', control.index, 'value']);
                    const displayValue = viewModel.getItem(['items', control.index, 'display']);
                    if (value) {
                        inputBus.emit('update', {
                            value,
                            displayValue,
                        });
                    }
                });
                fieldWidget.bus.on('changed', (message) => {
                    doChanged(control.index, message.newValue, message.newDisplayValue);
                });

                fieldWidget.bus.on('touched', () => {
                    channel.emit('touched');
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

                fieldWidget.bus.respond({
                    key: {
                        type: 'get-parameters',
                    },
                    handle: (message) => {
                        return channel.request(message, {
                            key: {
                                type: 'get-parameters',
                            },
                        });
                    },
                });

                const postButton = div(
                    {
                        class: 'input-group-addon kb-app-row-close-btn-addon',
                        style: {
                            padding: '0',
                            height: '100%',
                        },
                    },
                    button(
                        {
                            class: 'btn btn-danger btn-xs kb-app-row-close-btn',
                            type: 'button',
                            dataIndex: String(control.index),
                            id: events.addEvent({
                                type: 'click',
                                handler: function () {
                                    doRemoveControl(control);
                                },
                            }),
                        },
                        ui.buildIcon({
                            name: 'close',
                        })
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
        function doAddNew() {
            return {
                type: 'click',
                handler: function () {
                    addNewControl().then(() => {
                        return autoValidate();
                    });
                },
            };
        }

        function makeToolbar(events) {
            return div(
                {
                    class: '',
                    role: '',
                    style: {
                        padding: '6px',
                    },
                },
                [
                    div(
                        {
                            style: {
                                textAlign: 'left',
                            },
                        },
                        [
                            button(
                                {
                                    type: 'button',
                                    class: 'btn btn-default',
                                    style: {
                                        color: '#666',
                                        width: '100px',
                                        border: '1',
                                        'text-align': 'center',
                                    },
                                    id: events.addEvents({ events: [doAddNew()] }),
                                },
                                ui.buildIcon({
                                    name: 'plus-circle',
                                    size: 'lg',
                                })
                            ),
                        ]
                    ),
                ]
            );
        }

        function addNewControl(initialValue, initialDisplayValue) {
            if (initialValue === undefined) {
                initialValue = Util.copy(itemSpec.data.defaultValue);
            }
            return Promise.try(() => {
                const events = Events.make({ node: container });
                const control = {
                    // current native value.
                    value: initialValue,
                    displayValue: initialDisplayValue,
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
                return makeSingleInputControl(control, events)
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
                        // TODO insert an Error Control placeholder
                        console.error('Error adding new control', err);
                    });
            });
        }

        function render(initialValue, initialDisplayValue) {
            return Promise.try(() => {
                // render now just builds the initial view
                const events = Events.make({ node: container });
                container.innerHTML = makeLayout();
                ui.setContent('toolbar-container', makeToolbar(events));
                events.attachEvents();

                if (!initialValue) {
                    return;
                }
                if (!initialDisplayValue) {
                    initialDisplayValue = Array(initialValue.length);
                }
                return Promise.all(
                    initialValue.map((value, index) => {
                        return addNewControl(value, initialDisplayValue[index]);
                    })
                ).then(() => {
                    return autoValidate();
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
                    div({
                        dataElement: 'toolbar-container',
                    }),
                ]
            );
        }

        function autoValidate() {
            const data = exportModel();
            return validate(data.values).then((result) => {
                channel.emit('validation', result);
            });
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                return render(config.initialValue, config.initialDisplayValue).then(() => {
                    return autoValidate();
                });
            });
        }

        function stop() {
            return Promise.all(
                viewModel.getItem('items').map((item) => {
                    return item.inputControl.instance.stop();
                })
            ).then(() => {
                busConnection.stop();
            });
        }

        return {
            start,
            stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
