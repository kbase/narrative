/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    'common/validation',
    'common/events',
    'common/dom',
    'common/runtime',
    './singleObjectInput',
    '../display/singleObjectDisplay',
    'bootstrap',
    'css!font-awesome'
], function (
    Promise,
    html,
    Validation,
    Events,
    Dom,
    Runtime,
    SingleObjectInputWidget,
    SingleObjectDisplayWidget) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), button = t('button');

    function factory(config) {
        var spec = config.parameterSpec,
            container,
            parent,
            bus = config.bus,
            dom,
            model = {
                value: []
            },
            runtime = Runtime.make(),
            widgets = [];

        function normalizeModel() {
            var newModel = model.value.filter(function (item) {
                return item ? true : false;
            });
            model.value = newModel;
        }

        function getModelValue() {
            return model.value;
        }

        function setModelValue(value, index) {
            return Promise.try(function () {
                if (index !== undefined) {
                    if (value) {
                        model.value[index] = value;
                    } else {
                        model.value.splice(index, 1);
                    }
                } else {
                    if (value) {
                        model.value = value.map(function (item) {
                            return item;
                        });
                    } else {
                        unsetModelValue();
                    }
                }
                normalizeModel();
            })
                .then(function () {
                    render();
                })
                .then(function () {
                    autoValidate();
                });
        }

        function deleteModelValue(index) {
            return Promise.try(function () {
                if (index !== undefined) {
                    model.value.splice(index, 1);
                }
                normalizeModel();
            })
                .then(function () {
                    render();
                })
                .then(function () {
                    autoValidate();
                });
        }

        function addModelValue(value) {
            return Promise.try(function () {
                model.value.push(value);
            })
                .then(function () {
                    render();
                })
                .then(function () {
                    autoValidate();
                });
        }

        function unsetModelValue() {
            return Promise.try(function () {
                model.value = [];
            })
                .then(function (changed) {
                    render();
                })
                .then(function () {
                    autoValidate();
                });

        }

        function resetModelValue() {
            if (spec.spec.default_values && spec.spec.default_values.length > 0) {
                setModelValue(spec.spec.default_values);
            } else {
                unsetModelValue();
            }
        }

        function validate() {
            return Promise.try(function () {
                var validationOptions = {
                    validObjectTypes: spec.spec.text_options.valid_ws_types,
                    required: spec.required()
                };
                var rawValue = getModelValue();
                return Validation.validateWorkspaceObjectRefSet(rawValue, validationOptions);
            });
        }

        function makeInputControl(events, bus) {
            var items = model.value.map(function (value, index) {
                return makeSingleInputControl(value, index, events, bus);
            });


            items = items.concat(makeNewInputControl('', events, bus));

            var content = items.join('\n');
            return content;
        }

        function makeSingleInputControl(currentValue, index, events, bus) {
            // CONTROL
            var preButton, postButton,
                widgetId = html.genId(),
                inputBus = runtime.bus().makeChannelBus(null, 'Multi object input'),
                displayWidget = SingleObjectDisplayWidget.make({
                    bus: inputBus,
                    parameterSpec: spec,
                    workspaceInfo: config.workspaceInfo,
                    workspaceId: config.workspaceId
                }),
                widgetWrapper = {
                    id: widgetId,
                    instance: displayWidget,
                    bus: inputBus,
                    index: index
                },
                placeholder = div({id: widgetId});

            widgets.push(widgetWrapper);

            // set up listeners for the input
            inputBus.on('sync', function (message) {
                var value = model.value[index];
                if (value) {
                    inputBus.emit('update', {
                        value: value
                    });
                }
            });
            inputBus.on('validation', function (message) {
                if (message.diagnosis === 'optional-empty') {
                    // alert('delete me!');
                    model.value.splice(widgetWrapper.index, 1);
                    bus.emit('changed', {
                        newValue: model.value
                    });
                    render();
                }
            });
            inputBus.on('changed', function (message) {
                setModelValue(message.newValue, index);
                // model.value[index] = message.newValue;
                // TODO: validate the main control...
                bus.emit('changed', {
                    newValue: model.value
                });


            });

            preButton = div({class: 'input-group-addon', style: {width: '5ex', padding: '0'}}, String(index + 1) + '.');
            postButton = div({class: 'input-group-addon', style: {padding: '0'}}, button({
                class: 'btn btn-danger btn-link btn-xs',
                type: 'button',
                style: {width: '4ex'},
                dataIndex: String(index),
                id: events.addEvent({type: 'click', handler: function (e) {
                        // no, we don't need to consult the control, we just remove 
                        // it...
                        deleteModelValue(widgetWrapper.index);
                        bus.emit('changed', {
                            newValue: model.value
                        });
                    }})
            }, 'x'));
            return div({class: 'input-group', dataIndex: String(index)}, [
                preButton,
                placeholder,
                postButton
            ]);
        }

        function makeNewInputControl(currentValue, events, bus) {
            // CONTROL
            var preButton, postButton,
                widgetId = html.genId(),
                inputBus = runtime.bus().makeChannelBus(null, 'new object input comm bus'),
                inputWidget = SingleObjectInputWidget.make({
                    bus: inputBus,
                    // initialValue: config.initialValue,
                    parameterSpec: spec,
                    spec: spec,
                    workspaceInfo: config.workspaceInfo,
                    workspaceId: config.workspaceId,
                    blacklist: model.value,
                    fieldSpec: config.fieldSpec
                }),
                placeholder = div({id: widgetId});

            widgets.push({
                id: widgetId,
                instance: inputWidget,
                bus: inputBus
            });

            inputBus.on('changed', function (message) {
                addModelValue(message.newValue);
                // model.value.push(message.newValue);

                // TODO: and insert a new row ...

                // first attempt, re-render the whole shebang.
                render();

                // TODO: validate the main control...
                bus.emit('changed', {
                    newValue: model.value
                });
            });

            preButton = div({class: 'input-group-addon', style: {width: '5ex', padding: '0'}}, '');
            postButton = div({class: 'input-group-addon', style: {padding: '0'}}, button({
                class: 'btn btn-primary btn-link btn-xs',
                type: 'button',
                style: {width: '4ex'},
                id: events.addEvent({type: 'click', handler: function (e) {
                        // alert('add me');
                    }})
            }, '+'));

            return div({class: 'input-group'}, [
                preButton,
                placeholder,
                postButton
            ]);
        }

        function render() {

            // if we have input widgets already, tear them down.

            widgets.forEach(function (widget) {
                widget.bus.emit('stop');
                // TODO figure out how to remove unused channels.
                // widget.bus.done();
            });
            widgets = [];
            // we don't have to wait for anything...

            var events = Events.make(),
                control = makeInputControl(events, bus);

            dom.setContent('input-container', control);
            widgets.forEach(function (widget) {
                widget.instance.start()
                    .then(function () {
                        widget.bus.emit('run', {
                            debug: true,
                            node: document.querySelector('#' + widget.id)
                        });
                    });
            });
            events.attachEvents(container);
        }

        function layout(events) {
            var content = div({
                dataElement: 'main-panel'
            }, [
                div({dataElement: 'input-container'})
            ]);
            return {
                content: content,
                events: events
            };
        }
        function autoValidate() {
            //return Promise.all(model.value.map(function (value, index) {
            // could get from DOM, but the model is the same.
            // var rawValue = container.querySelector('[data-index="' + index + '"]').value;
            // console.log('VALIDATE', value);
            //    return validate();
            //}))
            return validate()
                .then(function (results) {
                    bus.emit('validation', results);
                    return;
                    // a bit of a hack -- we need to handle the 
                    // validation here, and update the individual rows
                    // for now -- just create one mega message.
                    var errorMessages = [],
                        validationMessage;
                    results.forEach(function (result, index) {
                        if (result.errorMessage) {
                            errorMessages.push(result.errorMessage + ' in item ' + index);
                        }
                    });
                    if (errorMessages.length) {
                        validationMessage = {
                            diagnosis: 'invalid',
                            errorMessage: errorMessages.join('<br/>')
                        };
                    } else {
                        validationMessage = {
                            diagnosis: 'valid'
                        };
                    }
                    bus.emit('validation', validationMessage);

                });
        }


        // LIFECYCLE API

        function start() {
            return Promise.try(function () {
                bus.on('run', function (message) {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    dom = Dom.make({node: container});

                    var events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents(container);

                    bus.on('reset-to-defaults', function (message) {
                        resetModelValue();
                    });
                    bus.on('update', function (message) {
                        setModelValue(message.value);
                    });
                    bus.on('refresh', function () {

                    });
                    bus.emit('sync');
                });
            });
        }

        return {
            start: start
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});