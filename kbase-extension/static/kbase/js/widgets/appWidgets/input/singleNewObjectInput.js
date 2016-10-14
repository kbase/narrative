/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'base/js/namespace',
    'kb_common/html',
    'common/validation',
    'common/events',
    'common/runtime',
    'common/dom',
    'bootstrap',
    'css!font-awesome'
], function (Promise, Jupyter, html, Validation, Events, Runtime, Dom) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), input = t('input');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            workspaceId = config.workspaceId,
            parent,
            container,
            bus = config.bus,
            model = {
                value: undefined
            },
            dom,
            runtime = Runtime.make();

        // Validate configuration.
        // Nothing to do...

        options.enabled = true;


        /*
         * If the parameter is optional, and is empty, return null.
         * If it allows multiple values, wrap single results in an array
         * There is a weird twist where if it ...
         * well, hmm, the only consumer of this, isValid, expects the values
         * to mirror the input rows, so we shouldn't really filter out any
         * values.
         */

        function getInputValue() {
            return dom.getElement('input-container.input').value;
        }

        function setModelValue(value) {
            return Promise.try(function () {
                if (model.value !== value) {
                    model.value = value;
                    return true;
                }
                return false;
            })
                .then(function (changed) {
                    render();
                });
        }

        function unsetModelValue() {
            return Promise.try(function () {
                model.value = undefined;
            })
                .then(function (changed) {
                    render();
                });
        }

        function resetModelValue() {
            if (spec.spec.default_values && spec.spec.default_values.length > 0) {
                setModelValue(spec.spec.default_values[0]);
            } else {
                unsetModelValue();
            }
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

        function validate() {
            return Promise.try(function () {
                if (!options.enabled) {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: 'disabled'
                    };
                }

                var rawValue = getInputValue(),
                    validationOptions = {
                        required: spec.required(),
                        shouldNotExist: true,
                        workspaceId: workspaceId,
                        types: spec.spec.text_options.valid_ws_types,
                        authToken: runtime.authToken(),
                        workspaceServiceUrl: runtime.config('services.workspace.url')
                    };

                return Validation.validateWorkspaceObjectName(rawValue, validationOptions);
            })
                .then(function (validationResult) {
                    // TODO: should pass the validation object through untouched...
                    return validationResult;
//                    return {
//                        isValid: validationResult.isValid,
//                        validated: true,
//                        diagnosis: validationResult.diagnosis,
//                        errorMessage: validationResult.errorMessage,
//                        shortMessage: validationResult.shortMessage,
//                        value: validationResult.parsedValue
//                    };
                });
        }

        function changeOnPause() {
            var editPauseTimer,
                editPauseInterval = 2000;
            return {
                type: 'keyup',
                handler: function (e) {
                    if (editPauseTimer) {
                        window.clearTimeout(editPauseTimer);
                    }
                    editPauseTimer = window.setTimeout(function () {
                        editPauseTimer = null;
                        e.target.dispatchEvent(new Event('change'));
                    }, editPauseInterval);
                }
            };
        }

        function evaluateChange() {
            return {
                type: 'change',
                handler: function () {
                    validate()
                        .then(function (result) {
                            if (result.isValid) {
                                bus.emit('changed', {
                                    newValue: result.parsedValue
                                });
                            } else if (result.diagnosis === 'required-missing') {
                                bus.emit('changed', {
                                    newValue: result.parsedValue
                                });
                            }
                            bus.emit('validation', result);
                        })
                        .catch(function (err) {
                            bus.emit('validation', {
                                errorMessage: err.message,
                                diagnosis: 'error'
                            });
                        });
                }
            };
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeInputControl(currentValue, events, bus) {
            // CONTROL
            return input({
                id: events.addEvents({
                    events: [
                        evaluateChange(), changeOnPause()
                    ]}),
                class: 'form-control',
                dataElement: 'input',
                value: currentValue
            });
        }

        function render() {
            Promise.try(function () {
                var events = Events.make(),
                    inputControl = makeInputControl(model.value, events, bus);

                dom.setContent('input-container', inputControl);
                events.attachEvents(container);
            })
                .then(function () {
                    return autoValidate();
                });
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
            return validate()
                .then(function (result) {
                    bus.emit('validation', result);
                })
                .catch(function (err) {
                    bus.emit('validation', {
                        errorMessage: err.message,
                        diagnosis: 'error'
                    });
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
                    bus.on('workspace-changed', function (message) {
                        console.log('workspace updated!!!');
                    });

                    //runtime.bus().receive({
                    //    test: function (message) {
                    //        return (message.type === 'workspace-updated');
                    //    },
                    //    handle: function (message) {
                    //        console.log('received here too...');
                    //    }
                    //});

                    //runtime.bus().on('workspace-updated', function () {
                    //    console.log('received here too...');
                    //})
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