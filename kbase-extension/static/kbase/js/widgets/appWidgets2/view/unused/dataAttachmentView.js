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
], (
    Promise,
    html,
    Validation,
    Events,
    Dom,
    Runtime
    ) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'), button = t('button'), span = t('span'), input = t('input');

    function factory(config) {
        let options = {},
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
            const kvMap = {};
            Object.keys(model.value).forEach((id) => {
                const kv = model.value[id];
                kvMap[kv.key] = kv.value;                
            });
            return kvMap;
        }
        
        // MODEL ITEMS

        function setModelValue(key, value, id) {
            return Promise.try(() => {
                if (!key || key.length === 0) {
                    delete model.value[id];
                }
                model.value[id] = {
                    key: key,
                    value: value
                };
                
            })
                .then(() => {
                    render();
                });
        }

        function addModelValue(key, value, id) {
            return Promise.try(() => {
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
            const newObj = {};
            props.forEach((prop) => {
                newObj[prop] = from[prop];
            });
            return newObj;
        }

        function validate(rawValue) {
            return Promise.try(() => {
                if (!options.enabled) {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: 'disabled'
                    };
                }

                const validationOptions = copyProps(spec.spec.text_options, ['regexp_constraint', 'min_length', 'max_length']);

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
            let preButton, postButton,
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
            let parent = node.parentNode;
            while (parent) {
                if (matcher(parent)) {
                    return parent;
                }
                parent = parent.parentNode;
            } 
        }
        
        function doAddNewItem(event) {
            const control = findParent(event.target, (node) => {
                return node.getAttribute('data-element') === 'input-row';
            }),
                id =  html.genId(),
                key = control.querySelector('[data-element="key"]').value,
                value = control.querySelector('[data-element="value"]').value;
            addModelValue(key, value, id)
                .then(() => {
                    bus.emit('changed', {
                        newValue: exportModel()
                    });
                })                
                .then(() => {
                    render();
                })
                .catch((err) => {
                    alert(err.message);
                });
            
        }

        function makeNewInputControl(key, value,  events, bus) {
            // CONTROL
            let preButton, postButton,
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
            const kvs = Object.keys(model.value).map((id) => {
                const kv = model.value[id];
                return {
                    id: id,
                    key: kv.key,
                    value: kv.value
                };
            }).sort((a, b) => {
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
            let items = kvs.map((kv, index) => {                
                return makeSingleInputControl(kv.key, kv.value, kv.id, index, events, bus);
            });


            items = items.concat(makeNewInputControl('', '', events, bus));

            const content = items.join('\n');
            return content;
        }

        function render() {

            // if we have input widgets already, tear them down.

            widgets.forEach((widget) => {
                widget.bus.emit('stop');

                // TODO figure out how to remove unused channels.
                // widget.bus.done();
            });
            widgets = [];
            // we don't have to wait for anything...

            const events = Events.make(),
                control = makeInputControl(events, bus);

            dom.setContent('input-container', control);
            widgets.forEach((widget) => {
                widget.instance.start()
                    .then(() => {
                        widget.bus.emit('run', {
                            debug: true,
                            node: document.querySelector('#' + widget.id)
                        });
                    });
            });
            events.attachEvents(container);
        }

        function layout(events) {
            const content = div({
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
            return Promise.all(model.value.map((value, index) => {
                // could get from DOM, but the model is the same.
                const rawValue = container.querySelector('[data-index="' + index + '"]').value;
                // console.log('VALIDATE', value);
                return validate(rawValue);
            }))
                .then((results) => {
                    // a bit of a hack -- we need to handle the 
                    // validation here, and update the individual rows
                    // for now -- just create one mega message.
                    let errorMessages = [],
                        validationMessage;
                    results.forEach((result, index) => {
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
            return Promise.try(() => {
                // runtime.bus().logMessages(true);

                bus.on('run', (message) => {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    dom = Dom.make({node: container});

                    const events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents(container);

                    bus.on('reset-to-defaults', (message) => {
                        resetModel();
                        render();
                    });
                    bus.on('update', (message) => {
                        setModel(message.value);
                        render();
                    });
                    bus.on('refresh', () => {

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