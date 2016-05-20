/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'bluebird',
    'kb_common/html',
    'kb_service/client/workspace',
    'kb_service/utils',
    '../../validation',
    '../../events',
    '../../runtime',
    'bootstrap',
    'css!font-awesome'
], function ($, Promise, html, Workspace, serviceUtils, Validation, Events, Runtime) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        select = t('select'), option = t('option');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            parent,
            container,
            $container,
            workspaceId = config.workspaceId,
            bus = config.bus,
            runCount = 0,
            model = {
                availableValues: undefined,
                value: undefined
            },
        runtime = Runtime.make();

        // Validate configuration.
        if (!workspaceId) {
            throw new Error('Workspace id required for the object widget');
        }
        //if (!workspaceUrl) {
        //    throw new Error('Workspace url is required for the object widget');
        //}

        options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
        options.multiple = spec.multipleItems();
        options.required = spec.required();
        options.enabled = true;

        function makeInputControl(events, bus) {
            // There is an input control, and a dropdown,
            // TODO select2 after we get a handle on this...
            var selectOptions;
            if (model.availableValues) {
                selectOptions = model.availableValues.map(function (objectInfo) {
                    var selected = false;
                    if (objectInfo.name === model.value) {
                        selected = true;
                    }
                    return option({
                        value: objectInfo.name,
                        selected: selected
                    }, objectInfo.name);
                });
            }

            // CONTROL
            return select({
                id: events.addEvent({type: 'change', handler: function (e) {
                        validate()
                            .then(function (result) {
                                if (result.isValid) {
                                    bus.send({
                                        type: 'changed',
                                        newValue: result.value
                                    });
                                } else if (result.diagnosis === 'required-missing') {
                                    bus.send({
                                        type: 'changed',
                                        newValue: result.value
                                    });
                                }
                                bus.send({
                                    type: 'validation',
                                    errorMessage: result.errorMessage,
                                    diagnosis: result.diagnosis
                                });
                            });
                    }}),
                class: 'form-control',
                dataElement: 'input'
            }, [option({value: ''}, '')].concat(selectOptions));
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
            return $container.find('[data-element="input-container"] [data-element="input"]').val();
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
                    return render();
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
                        required: spec.required()
                    };

                return Validation.validateWorkspaceObjectName(rawValue, validationOptions);
            })
                .then(function (validationResult) {
                    return {
                        isValid: validationResult.isValid,
                        validated: true,
                        diagnosis: validationResult.diagnosis,
                        errorMessage: validationResult.errorMessage,
                        value: validationResult.parsedValue
                    };
                });
        }

        function getObjectsByType(type) {
            var workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken()
            });
            return workspace.list_objects({
                type: type,
                ids: [workspaceId]
            })
                .then(function (data) {
                    return data.map(function (objectInfo) {
                        return serviceUtils.objectInfoToObject(objectInfo);
                    });
                });
        }

        function fetchData() {
            var types = spec.spec.text_options.valid_ws_types;
            return Promise.all(types.map(function (type) {
                return getObjectsByType(type);
            }))
                .then(function (objectSets) {
                    return Array.prototype.concat.apply([], objectSets);
                })
                .then(function (objects) {
                    objects.sort(function (a, b) {
                        if (a.name < b.name) {
                            return -1;
                        }
                        if (a.name === b.name) {
                            return 0;
                        }
                        return 1;
                    });
                    return objects;
                });
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function render() {
            return Promise.try(function () {
                var events = Events.make(),
                    inputControl = makeInputControl(events, bus),
                    content = div({class: 'input-group', style: {width: '100%'}}, inputControl);

                $container.find('[data-element="input-container"]').html(content);
                events.attachEvents(container);
            })
                .then(function () {
                    return autoValidate();
                });
        }

        /*
         * In the layout we set up an environment in which one or more parameter
         * rows may be inserted.
         * For the objectInput, there is only ever one control.
         */
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
                    bus.send({
                        type: 'validation',
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        // LIFECYCLE API

        function init() {
        }

        function attach(node) {
            return Promise.try(function () {
                parent = node;
                container = node.appendChild(document.createElement('div'));
                $container = $(container);

                var events = Events.make(),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents(container);
            });
        }

        function start() {
            return Promise.try(function () {
                bus.on('reset-to-defaults', function (message) {
                    resetModelValue();
                });
                bus.on('update', function (message) {
                    setModelValue(message.value);
                });
                bus.send({type: 'sync'});
            });
        }

        function run(params) {
            return Promise.try(function () {
                return fetchData(params);
            })
                .then(function (data) {
                    model.availableValues = data;
                    render();
                });
        }

        return {
            init: init,
            attach: attach,
            start: start,
            run: run
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});