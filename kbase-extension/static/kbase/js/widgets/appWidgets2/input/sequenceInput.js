define([
    'require',
    'bluebird',
    'kb_common/html',
    'common/events',
    'common/ui',
    'common/runtime',
    'common/lang',
    'common/props',
    '../paramResolver',
    '../validators/sequence',

    'bootstrap',
    'css!font-awesome'
], function(
    require,
    Promise,
    html,
    Events,
    UI,
    Runtime,
    lang,
    Props,
    Resolver,
    Validation
) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        button = t('button');

    function factory(config) {
        var spec = config.parameterSpec,
            itemSpec = spec.parameters.specs.item,
            container,
            parent,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            ui,
            model = {
                value: []
            },
            viewModel = Props.make({
                data: {
                    items: []
                },
                onUpdate: function(props) {
                    doModelUpdated();
                }
            }),
            resolver = Resolver.make();

        function normalizeModel() {
            var newModel = model.value.filter(function(item) {
                return item ? true : false;
            });
            model.value = newModel;
        }

        function doModelUpdated() {
            channel.emit('changed', {
                newValue: exportModel()
            });
            // autoValidate();
        }

        function setModelValue(value, index) {
            return Promise.try(function() {
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
                })
                .then(function() {
                    return render();
                });
        }

        function unsetModelValue() {
            return Promise.try(function() {
                    model.value = [];
                })
                .then(function() {
                    return render();
                });
        }

        function resetModelValue() {
            return;
        }

        function exportModel() {
            return viewModel.getItem('items').map(function(value) {
                return value.value;
            });
        }


        function validate(rawValue) {
            return Promise.try(function() {
                // TODO: validate all items within the list as well!
                return Validation.validate(rawValue, spec);
            });
        }

        function doRemoveControl(control) {
            var item = viewModel.getItem(['items', control.index]);

            // Remove item from viewmodel.
            var items = viewModel.getItem('items');
            items.splice(control.index, 1);

            // stop the field widget. This will unook all listeners
            // and also clear the dom node.
            item.inputControl.instance.stop()
                .then(function() {

                    // And we also need to remove the wrapper div attachment
                    // point as well.
                    item.node.parentNode.removeChild(item.node);

                    // Now, to renumber. Oh, fun!
                    items.forEach(function(control, index) {
                        control.index = index;
                        UI.make({ node: control.node }).setContent('index-label.index', String(index + 1));
                    });

                    viewModel.setItem('items', items);

                    //bus.emit('changed', {
                    //     newValue: exportModel()
                    // });

                    autoValidate();
                });
        }

        function doChanged(index, value) {
            viewModel.setItem(['items', index, 'value'], value);
            return validate(exportModel())
                .then(function(result) {
                    channel.emit('validation', result);
                });
        }

        // TODO: wrap this in a new type of field control -- 
        //   specialized to be very lightweight for the sequence control.
        function makeSingleInputControl(control, events) {
            return resolver.loadInputControl(itemSpec)
                .then(function(InputWidget) {
                    // CONTROL
                    var preButton, postButton,
                        widgetId = html.genId(),
                        inputBus = runtime.bus().makeChannelBus({
                            description: 'Array input control'
                        }),
                        // TODO: should be a very lightweight wrapper widget here,
                        // at least to create and manage the channel.
                        inputWidget = InputWidget.make({
                            bus: inputBus,
                            paramsChannelName: config.paramsChannelName,
                            channelName: inputBus.channelName,
                            parameterSpec: itemSpec,
                            showOwnMessages: true,
                            initialValue: control.value
                        });

                    // set up listeners for the input
                    inputBus.on('sync', function() {
                        var value = viewModel.getItem(['items', control.index, 'value']);
                        if (value) {
                            inputBus.emit('update', {
                                value: value
                            });
                        }
                    });
                    inputBus.on('changed', function(message) {
                        doChanged(control.index, message.newValue);
                    });

                    inputBus.on('touched', function() {
                        channel.emit('touched');
                    });

                    inputBus.respond({
                        key: {
                            type: 'get-parameter'
                        },
                        handle: function (message) {
                            if (message.parameterName) {
                                return channel.request(message, {
                                    key: {
                                        type: 'get-parameter'
                                    }
                                });
                            } else {
                                return null;
                            }
                        }
                    });

                    preButton = div({
                        class: 'input-group-addon',
                        dataElement: 'index-label',
                        style: {
                            width: '5ex',
                            padding: '0'
                        }
                    }, [
                        span({ dataElement: 'index' }, String(control.index + 1)), '.'
                    ]);
                    postButton = div({
                        class: 'input-group-addon',
                        style: {
                            padding: '0'
                        }
                    }, button({
                        class: 'btn btn-danger btn-link btn-xs',
                        type: 'button',
                        style: { width: '4ex' },
                        dataIndex: String(control.index),
                        id: events.addEvent({
                            type: 'click',
                            handler: function() {
                                doRemoveControl(control);
                            }
                        })
                    }, ui.buildIcon({
                        name: 'trash'
                    })));
                    var content = div({
                        dataElement: 'input-row',
                        dataIndex: String(control.index),
                        style: {
                            width: '100%'
                        }
                    }, [
                        div({ class: 'input-group' }, [
                            preButton,
                            div({ id: widgetId }),
                            postButton
                        ])
                    ]);
                    return {
                        id: widgetId,
                        instance: inputWidget,
                        bus: inputBus,
                        content: content
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
                handler: function() {
                    addNewControl()
                    .then(function() {
                        autoValidate();
                    });
                }
            };
        }

        function makeToolbar(events) {
            return div({
                class: '',
                role: '',
                style: {
                    border: '1px solid #ccc',
                    //backgroundColor: '#eee',
                    padding: '6px',
                    textAlign: 'center'
                }
            }, [
                div({
                    style: {
                        textAlign: 'center',
                        display: 'inline-block'
                    }
                }, [
                    button({
                        type: 'button',
                        class: 'btn btn-default',
                        style: {
                            color: '#666'
                        },
                        id: events.addEvents({ events: [doAddNew()] })
                    }, ui.buildIcon({
                        name: 'plus-circle',
                        size: 'lg'
                    }))
                ])
            ]);
        }

        function addNewControl(initialValue) {
            if (initialValue === undefined) {
                initialValue = lang.copy(itemSpec.data.defaultValue);
            }
            return Promise.try(function() {
                var events = Events.make({ node: container });
                var control = {
                    // current native value.
                    value: initialValue,
                    // the actual input control (or field wrapper around such)
                    inputControl: null,
                    // the actual dome node (used?) to which the input control is attached
                    node: null,
                    // the current index - note: used by the inputControl 
                    index: null
                };
                var index = viewModel.pushItem(['items'], control);
                control.index = index;
                var parent = ui.getElement('control-container');
                var controlNode = document.createElement('div');
                parent.appendChild(controlNode);
                return makeSingleInputControl(control, events)
                    .then(function(inputControl) {
                        // This adds the control wrapper html.
                        controlNode.innerHTML = inputControl.content;
                        // Each wrapper has a node inside with id "id" for
                        // the control to attach to.
                        var attachmentNode = document.getElementById(inputControl.id);
                        control.node = controlNode;
                        control.inputControl = inputControl;

                        return inputControl.instance.start({
                            node: attachmentNode
                        });
                    })
                    .then(function() {
                        events.attachEvents();
                        // doModelUpdated();
                        return index;
                    })
                    .catch(function(err) {
                        console.log('ERROR!!!', err);
                    });
            })
        }

        function render(initialValue) {
            return Promise.try(function() {
                // render now just builds the initial view
                var events = Events.make({ node: container });
                container.innerHTML = makeLayout();
                ui.setContent('toolbar-container', makeToolbar(events));
                events.attachEvents();

                if (!initialValue) {
                    return;
                }
                return Promise.all(initialValue.map(function(value) {
                    return addNewControl(value);
                }))
                .then(function () {
                    autoValidate();
                });
            });
        }

        function makeLayout() {
            return div({
                dataElement: 'main-panel'
            }, [
                div({
                    dataElement: 'control-container'
                }),
                div({
                    dataElement: 'toolbar-container'
                })
            ]);
        }

        function autoValidate() {
            return validate(exportModel())
                .then(function(result) {
                    channel.emit('validation', result);
                });
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(function() {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                return render(config.initialValue)
                    .then(function() {
                        channel.on('reset-to-defaults', function(message) {
                            resetModelValue();
                        });
                        channel.on('update', function(message) {
                            setModelValue(message.value);
                        });
                        channel.on('refresh', function() {});

                        return autoValidate();
                        // bus.emit('sync');
                    });

            });
        }

        function stop() {
            return Promise.try(function() {
                return Promise.all(viewModel.getItem('items').map(function(item) {
                        return item.inputControl.instance.stop();
                    }))
                    .then(function() {
                        busConnection.stop();
                    });
            })
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});