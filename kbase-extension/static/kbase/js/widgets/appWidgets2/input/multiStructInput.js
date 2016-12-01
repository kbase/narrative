/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    '../validation',
    'common/events',
    'common/ui',
    'common/runtime',
    './structInput',
    'bootstrap',
    'css!font-awesome'
], function(
    Promise,
    html,
    Validation,
    Events,
    UI,
    Runtime,
    structInputWidget) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        button = t('button');

    function factory(config) {
        var options = {},
            // The spec for the struct is actally in the parameters now, which is always
            // the parameter with id 'item'.
            spec = config.parameterSpec,
            structSpec = spec.parameters.specs.item,
            container,
            parent,
            bus = config.bus,
            ui,
            model = {
                value: []
            },
            runtime = Runtime.make(),
            widgets = [];

        function normalizeModel() {
            var newModel = model.value.filter(function(item) {
                return item ? true : false;
            });
            model.value = newModel;
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
                    render();
                });
        }

        function addModelValue(value) {
            return Promise.try(function() {
                    model.value.push(value);
                })
                .then(function() {
                    return render();
                })
                .then(function() {
                    bus.emit('changed', {
                        newValue: model.value
                    });
                });
        }

        function unsetModelValue() {
            return Promise.try(function() {
                    model.value = [];
                })
                .then(function(changed) {
                    render();
                });
        }

        function resetModelValue() {
            if (spec.defaultValue) {
                setModelValue(spec.defaultValue);
            } else {
                unsetModelValue();
            }
        }

        /*
         * If the parameter is optional, and is empty, return null.
         * If it allows multiple values, wrap single results in an array
         * There is a weird twist where if it ...
         * well, hmm, the only consumer of this, isValid, expects the values
         * to mirror the input rows, so we shouldn't really filter out any
         * values.
         */

        function getInputValue() {
            return ui.getElement('input-container.input').value;
        }

        /*
         *
         * Text fields can occur in multiples.
         * We have a choice, treat single-text fields as a own widget
         * or as a special case of multiple-entry -- 
         * with a min-items of 1 and max-items of 1.
         * 
         *
         */

        function copyProps(from, props) {
            var newObj = {};
            props.forEach(function(prop) {
                newObj[prop] = from[prop];
            });
            return newObj;
        }

        function validate(rawValue) {
            return Promise.try(function() {
                if (!options.enabled) {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: 'disabled'
                    };
                }

                // don't validate yet.
                return Validation.validateTrue(rawValue);

                //var validationOptions = copyProps(spec.spec.text_options, ['regexp_constraint', 'min_length', 'max_length']);

                //validationOptions.required = spec.required();
                //return Validation.validateTextString(rawValue, validationOptions);
            });
        }

        function updateValue() {

        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */



        function makeSingleInputControl(currentValue, index, events, bus) {
            // CONTROL
            var preButton, postButton,
                widgetId = html.genId(),
                inputBus = runtime.bus().makeChannelBus(null, 'Multi int input bus'),
                // TODO: should be a very lightweight wrapper widget here,
                // at least to create and manage the channel.
                inputWidget = structInputWidget.make({
                    bus: inputBus,
                    parameterSpec: structSpec,
                    spec: spec,
                    fieldSpec: config.fieldSpec,
                    showOwnMessages: true
                }),
                widgetWrapper = {
                    id: widgetId,
                    instance: inputWidget,
                    bus: inputBus,
                    index: index
                },
                placeholder = div({ id: widgetId });

            widgets.push(widgetWrapper);

            // set up listeners for the input
            inputBus.on('sync', function(message) {
                var value = model.value[index];
                if (value) {
                    inputBus.emit('update', {
                        value: value
                    });
                }
            });
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
            inputBus.on('changed', function(message) {
                model.value[index] = message.newValue;
                // TODO: validate the main control...
                bus.emit('changed', {
                    newValue: model.value
                });
            });

            inputBus.on('touched', function(message) {
                bus.emit('touched');
            });

            preButton = div({ class: 'input-group-addon', style: { width: '5ex', padding: '0' } }, String(index + 1) + '.');
            postButton = div({ class: 'input-group-addon', style: { padding: '0' } }, button({
                class: 'btn btn-danger btn-link btn-xs',
                type: 'button',
                style: { width: '4ex' },
                dataIndex: String(index),
                id: events.addEvent({
                    type: 'click',
                    handler: function(e) {
                        // no, we don't need to consult the control, we just remove 
                        // it...
                        model.value.splice(widgetWrapper.index, 1);
                        //var index = e.target.getAttribute('data-index'),
                        //    control = container.querySelector('input[data-index="' + index + '"]');
                        //control.value = '';
                        //control.dispatchEvent(new Event('change'));
                        bus.emit('changed', {
                            newValue: model.value
                        });
                        render();
                    }
                })
            }, 'x'));
            return div({ dataElement: 'input-row', dataIndex: String(index), style: { width: '100%' } }, [
                div({ class: 'input-group' }, [
                    preButton,
                    placeholder,
                    postButton
                ])
            ]);
        }

        function handleAddNew() {
            return {
                type: 'click',
                handler: function(e) {
                    addModelValue(JSON.parse(JSON.stringify(structSpec.data.defaultValue)));
                }
            };
        }

        function makeInputControl(events, bus) {
            var items = model.value.map(function(value, index) {
                return makeSingleInputControl(value, index, events, bus);
            });
            var existing;
            if (items.length > 0) {
                existing = items;
            } else {
                existing = [
                    div({}, 'No items, please add one below')
                ];
            }

            /*
            Note about the button toolbar at the bottom of the phones list.
            It would be nice to use a button inside a group inside a toolbar.
            Semantically tight, extensible, right? Problem is they are implemented
            as floats, so centering is not possible. So we use our own versions
            */
            return existing.concat([
                div({
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
                            id: events.addEvents({ events: [handleAddNew()] })
                        }, 'Add New')
                    ])
                ])
            ]).join('\n');
        }

        function render() {

            console.log('Rendering: ', widgets, model);

            // if we have input widgets already, tear them down.

            widgets.forEach(function(widget) {
                console.log('stopping?', widget);
                widget.bus.stop();
                widget.instance.stop();
                // TODO figure out how to remove unused channels.
                // widget.bus.done();
            });
            widgets = [];
            // we don't have to wait for anything...

            var events = Events.make(),
                control = makeInputControl(events, bus);

            ui.setContent('input-container', control);
            widgets.forEach(function(widget) {
                console.log('starting widget...', widget);
                widget.instance.start({
                        node: document.getElementById(widget.id)
                    })
                    .then(function() {
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
                div({ dataElement: 'input-container' })
            ]);
            return {
                content: content,
                events: events
            };
        }

        function autoValidate() {
            return Promise.all(model.value.map(function(value, index) {
                    // could get from DOM, but the model is the same.
                    var rawValue = container.querySelector('[data-index="' + index + '"]').value;
                    return validate(rawValue);
                }))
                .then(function(results) {
                    // a bit of a hack -- we need to handle the 
                    // validation here, and update the individual rows
                    // for now -- just create one mega message.
                    var errorMessages = [],
                        validationMessage;
                    results.forEach(function(result, index) {
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
            return Promise.try(function() {
                // runtime.bus().logMessages(true);

                bus.on('run', function(message) {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    ui = UI.make({ node: container });

                    var events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents(container);

                    bus.on('reset-to-defaults', function(message) {
                        resetModelValue();
                    });
                    bus.on('update', function(message) {
                        setModelValue(message.value);
                    });
                    bus.on('refresh', function() {

                    });
                    bus.emit('sync');
                });
            });
        }

        function stop() {
            return Promise.resolve();
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