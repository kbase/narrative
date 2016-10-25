/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    '../validation',
    'common/events',
    'common/dom',
    'common/runtime',
    'bootstrap',
    'css!font-awesome'
], function (
    Promise,
    html,
    Validation,
    Events,
    Dom,
    Runtime
    ) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), button = t('button'), span = t('span'), input = t('input');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            container,
            parent,
            bus = config.bus,
            dom,
            model = {
                value: {}
            },
            runtime = Runtime.make(),
            widgets = [];


        // MODEL

        function setModel(value) {
            model.value = value;
        }

        function unsetModel() {
            setModel({});
        }

        function resetModel() {
            if (spec.defaultValue) {
                setModel(spec.defaultValue);
            } else {
                unsetModel();
            }
        }
        
        function exportModel() {
            var kvMap = {};
            Object.keys(model.value).forEach(function (id) {
                var kv = model.value[id];
                kvMap[kv.key] = kv.value;                
            });
            return kvMap;
        }
        
        // MODEL ITEMS

        function setModelValue(key, value, id) {
            return Promise.try(function () {
                if (!key || key.length === 0) {
                    delete model.value[id];
                }
                model.value[id] = {
                    key: key,
                    value: value
                };
                
            })
                .then(function () {
                    render();
                });
        }

        function addModelValue(key, value, id) {
            return Promise.try(function () {
                if (model.value.hasOwnProperty(key)) {
                    throw new Error('Key value already exists');
                }
                model.value[id] = {
                    key: key,
                    value: value
                };
            });
        }


        function copyProps(from, props) {
            var newObj = {};
            props.forEach(function (prop) {
                newObj[prop] = from[prop];
            });
            return newObj;
        }

        function validate(rawValue) {
            return Promise.try(function () {
                if (!options.enabled) {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: 'disabled'
                    };
                }

                var validationOptions = copyProps(spec.spec.text_options, ['regexp_constraint', 'min_length', 'max_length']);

                validationOptions.required = spec.required();
                return Validation.validateTextString(rawValue, validationOptions);
            });
        }

        function setKeyValue(id, newKeyValue) {
            model.value[id].key = newKeyValue;
        }
        
        function doChangeKey(id, newKeyValue) {
            try {
                setKeyValue(id, newKeyValue);
                bus.emit('changed', {
                    newValue: model.value
                });
                render();
            } catch (err) {
                alert('Error saving key:' + err.message);
            }
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */

        function makeKeyValueControl(key, value, id, events) {
            return div({style: {
                dataElement: 'control',
                border: '1px orange dashed',
                dataId: id
            }}, [
                div({}, [
                    span({style: {width: '30%'}}, 'k:'),
                    input({
                        style: {
                            width: '70%'
                        },
                        dataElement: 'key',
                        value: key,
                        id: events.addEvent({
                            type: 'change',
                            handler: function (e) {
                                doChangeKey(id, e.target.value);
                            }
                        })
                    })
                ]),
                div({}, [
                    span({style: {width: '30%'}}, 'v:'),
                    input({
                        style: {
                            width: '50%'
                        },
                        dataElement: 'value',
                        value: value
                    })
                ])
            ]);
        }
        
         function makeNewKeyValueControl(key, value, events) {
            return div({style: {
                dataElement: 'control',
                border: '1px orange dashed'
            }}, [
                div({}, [
                    span({style: {width: '30%'}}, 'k:'),
                    input({
                        style: {
                            width: '70%'
                        },
                        dataElement: 'key',
                        value: key
                    })
                ]),
                div({}, [
                    span({style: {width: '30%'}}, 'v:'),
                    input({
                        style: {
                            width: '50%'
                        },
                        dataElement: 'value',
                        value: value
                    })
                ])
            ]);
        }
        
        function makeSingleInputControl(key, value, id, index, events, bus) {
            // CONTROL
            var preButton, postButton,
                widgetId = html.genId(),
                inputBus = runtime.bus().makeChannelBus(null, 'Multi int input bus'),
//                inputWidget = SingleIntInputWidget.make({
//                    bus: inputBus,
//                    parameterSpec: spec,
//                    spec: spec,
//                    fieldSpec: config.fieldSpec,
//                    showOwnMessages: true
//                }),
//                widgetWrapper = {
//                    id: widgetId,
//                    instance: inputWidget,
//                    bus: inputBus,
//                    key: key
//                },
//                placeholder = div({id: widgetId}),
                control = makeKeyValueControl(key, value, id, events),
                errorRow;

            // widgets.push(widgetWrapper);

            // set up listeners for the input
//            inputBus.on('sync', function (message) {
//                var value = model.value[key];
//                if (value) {
//                    inputBus.emit('update', {
//                        value: value
//                    });
//                }
//            });
//            inputBus.on('validation', function (message) {
//                if (message.diagnosis === 'optional-empty') {
//                    // alert('delete me!');
//                    model.value.splice(widgetWrapper.index, 1);
//                    bus.emit('changed', {
//                        newValue: model.value
//                    });
//                    render();
//                }
//            });
//            inputBus.on('changed', function (message) {
//                model.value[index] = message.newValue;
//                // TODO: validate the main control...
//                bus.emit('changed', {
//                    newValue: model.value
//                });
//            });

            preButton = div({class: 'input-group-addon', style: {width: '5ex', padding: '0'}}, String(index + 1) + '.');
            postButton = div({class: 'input-group-addon', style: {padding: '0'}}, button({
                class: 'btn btn-danger btn-link btn-xs',
                type: 'button',
                style: {width: '4ex'},
                dataKey: key,
                id: events.addEvent({type: 'click', handler: function (e) {
                        // no, we don't need to consult the control, we just remove 
                        // it...
                        delete model.value[id];
                        // model.value.splice(widgetWrapper.index, 1);
                        //var index = e.target.getAttribute('data-index'),
                        //    control = container.querySelector('input[data-index="' + index + '"]');
                        //control.value = '';
                        //control.dispatchEvent(new Event('change'));
                        bus.emit('changed', {
                            newValue: exportModel()
                        });
                        render();
                    }})
            }, 'x'));
            
            return div({dataElement: 'input-row', dataKey: String(key), style: {width: '100%'}}, [
                div({class: 'input-group'}, [
                    preButton,
                    control,
                    postButton
                ])
            ]);
        }
        
        function findParent(node, matcher) {
            var parent = node.parentNode;
            while (parent) {
                if (matcher(parent)) {
                    return parent;
                }
                parent = parent.parentNode;
            } 
        }
        
        function doAddNewItem(event) {
            var control = findParent(event.target, function (node) {
                return node.getAttribute('data-element') === 'input-row';
            }),
                id =  html.genId(),
                key = control.querySelector('[data-element="key"]').value,
                value = control.querySelector('[data-element="value"]').value;
            addModelValue(key, value, id)
                .then(function() {
                    bus.emit('changed', {
                        newValue: exportModel()
                    });
                })                
                .then(function () {
                    render();
                })
                .catch(function (err) {
                    alert(err.message);
                });
            
        }

        function makeNewInputControl(key, value,  events, bus) {
            // CONTROL
            var preButton, postButton,
                widgetId = html.genId(),
                // inputBus = runtime.bus().makeChannelBus(null, '"new input" parent comm bus'),
//                inputWidget = SingleIntInputWidget.make({
//                    bus: inputBus,
//                    // initialValue: config.initialValue,
//                    parameterSpec: spec,
//                    spec: spec,
//                    fieldSpec: config.fieldSpec,
//                    showOwnMessages: true
//                }),
                errorRow,
                control = makeNewKeyValueControl(key, value, events);
                // placeholder = div({id: widgetId});

//            widgets.push({
//                id: widgetId,
//                instance: inputWidget,
//                bus: inputBus
//            });

//            inputBus.on('changed', function (message) {
//                model.value.push(message.newValue);
//
//                // TODO: and insert a new row ...
//
//                // first attempt, re-render the whole shebang.
//                render();
//
//                // TODO: validate the main control...
//                bus.emit('changed', {
//                    newValue: model.value
//                });inputBus
//            });

            preButton = div({class: 'input-group-addon', style: {width: '5ex', padding: '0'}}, '');
            postButton = div({class: 'input-group-addon', style: {padding: '0'}}, button({
                class: 'btn btn-primary btn-link btn-xs',
                type: 'button',
                style: {width: '4ex'},
                id: events.addEvent({type: 'click', handler: doAddNewItem})
            }, '+'));

            return div({dataElement: 'input-row', style: {width: '100%'}}, [
                div({class: 'input-group'}, [
                    preButton,
                    control,
                    postButton
                ])
            ]);
        }

        function makeInputControl(events, bus) {
            
            // get all keys
            var kvs = Object.keys(model.value).map(function (id) {
                var kv = model.value[id];
                return {
                    id: id,
                    key: kv.key,
                    value: kv.value
                };
            }).sort(function (a, b) {
                if (a.key < b.key) { 
                    return -1;
                }
                if (a.key > b.key) {
                    return 1;
                }
                return 0;
            });
            
            console.log('kvs?', kvs);
                
            
            // order them
            // iterate, over them, adding one input control at a time.
            var items = kvs.map(function (kv, index) {                
                return makeSingleInputControl(kv.key, kv.value, kv.id, index, events, bus);
            });


            items = items.concat(makeNewInputControl('', '', events, bus));

            var content = items.join('\n');
            return content;
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
            return Promise.all(model.value.map(function (value, index) {
                // could get from DOM, but the model is the same.
                var rawValue = container.querySelector('[data-index="' + index + '"]').value;
                // console.log('VALIDATE', value);
                return validate(rawValue);
            }))
                .then(function (results) {
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
                // runtime.bus().logMessages(true);

                bus.on('run', function (message) {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    dom = Dom.make({node: container});

                    var events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents(container);

                    bus.on('reset-to-defaults', function (message) {
                        resetModel();
                        render();
                    });
                    bus.on('update', function (message) {
                        setModel(message.value);
                        render();
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