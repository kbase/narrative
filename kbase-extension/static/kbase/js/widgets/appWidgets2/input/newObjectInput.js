/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    '../validation',
    'common/events',
    'common/runtime',
    'common/dom',
    'bootstrap',
    'css!font-awesome'
], function(Promise, html, Validation, Events, Runtime, Dom) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        input = t('input');

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
            runtime = Runtime.make(),
            otherOutputParams = config.closeParameters.filter((value) => {
                return value !== spec.id;
            });

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
            return Promise.try(function() {
                if (model.value !== value) {
                    model.value = value;
                    return true;
                }
                return false;
            })
                .then(function(changed) {
                    render();
                });
        }

        function unsetModelValue() {
            return Promise.try(function() {
                model.value = undefined;
            })
                .then(function(changed) {
                    render();
                });
        }

        function resetModelValue() {
            if (spec.data.defaultValue) {
                setModelValue(spec.data.defaultValue);
            } else {
                unsetModelValue();
            }
        }

        /*
         * Text fields can occur in multiples.
         * We have a choice, treat single-text fields as a own widget
         * or as a special case of multiple-entry --
         * with a min-items of 1 and max-items of 1.
         */

        function validate() {
            if (!options.enabled) {
                return Promise.try(() => {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: 'disabled'
                    };
                });
            }
            else {
                var rawValue = getInputValue();
                return validateUniqueOutput(rawValue)
                    .then((isUnique) => {
                        if (!isUnique) {
                            return Promise.try(() => {
                                return {
                                    isValid: false,
                                    diagnosis: 'invalid',
                                    errorMessage: 'Every output object from a single app run must have a unique name.'
                                };
                            });
                        }
                        else {
                            let validationOptions = {
                                required: spec.data.constraints.required,
                                shouldNotExist: true,
                                workspaceId: workspaceId,
                                types: spec.data.constraints.types,
                                authToken: runtime.authToken(),
                                workspaceServiceUrl: runtime.config('services.workspace.url')
                            };
                            return Validation.validateWorkspaceObjectName(rawValue, validationOptions);
                        }
                    })
                    .then(function(validationResult) {
                        return validationResult;
                    });
            }
        }

        /* Validate that this is a unique value among all output parameters */
        function validateUniqueOutput(rawValue) {
            return bus.request({
                parameterNames: otherOutputParams
            }, {
                key: {
                    type: 'get-parameters'
                }
            }).then((paramValues) => {
                let duplicates = Object.values(paramValues).filter(value => rawValue === value && !!value);
                return !Boolean(duplicates.length);
            });
        }

        var autoChangeTimer;

        function cancelTouched() {
            if (autoChangeTimer) {
                window.clearTimeout(autoChangeTimer);
                autoChangeTimer = null;
            }
        }

        function handleTouched(interval) {
            var editPauseInterval = interval || 500;
            return {
                type: 'keyup',
                handler: function(e) {
                    bus.emit('touched');
                    cancelTouched();
                    autoChangeTimer = window.setTimeout(function() {
                        autoChangeTimer = null;
                        e.target.dispatchEvent(new Event('change'));
                    }, editPauseInterval);
                }
            };
        }

        function handleChanged() {
            return {
                type: 'change',
                handler: function() {
                    validate()
                        .then(function(result) {
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
                        .catch(function(err) {
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
                        handleChanged(), handleTouched()
                    ]
                }),
                class: 'form-control',
                dataElement: 'input',
                value: currentValue
            });
        }

        function render() {
            Promise.try(function() {
                var events = Events.make(),
                    inputControl = makeInputControl(model.value, events, bus);

                dom.setContent('input-container', inputControl);
                events.attachEvents(container);
            })
                .then(function() {
                    return autoValidate();
                });
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
            return validate()
                .then(function(result) {
                    bus.emit('validation', result);
                })
                .catch(function(err) {
                    bus.emit('validation', {
                        errorMessage: err.message,
                        diagnosis: 'error'
                    });
                });
        }

        // LIFECYCLE API

        function start() {
            return Promise.try(function() {
                bus.on('run', function(message) {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    dom = Dom.make({ node: container });

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

        return {
            start: start
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});