/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'bluebird',
    'kb_common/html',
    'kb_service/client/workspace',
    'kb_service/utils',
    '../validation',
    '../events',
    'bootstrap',
    'css!font-awesome'
], function ($, Promise, html, Workspace, serviceUtils, Validation, Events) {
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
            workspaceUrl = config.workspaceUrl,
            bus = config.bus;

        // Validate configuration.
        if (!workspaceId) {
            throw new Error('Workspace id required for the object widget');
        }
        if (!workspaceUrl) {
            throw new Error('Workspace url is required for the object widget');
        }

        function makeInputControl(data, events, bus) {
            // There is an input control, and a dropdown,
            // TODO select2 after we get a handle on this...
            var selectOptions = data.map(function (objectInfo) {
                return option({
                    value: objectInfo.ref
                }, objectInfo.name);
            });

            // CONTROL
            return select({
                id: events.addEvent({type: 'change', handler: function (e) {
                        var result = validate();
                        if (result.isValid) {
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

        function validate() {
            if (!options.enabled) {
                return {
                    isValid: true,
                    validated: false,
                    diagnosis: 'disabled'
                };
            }

            var rawValue = getInputValue(),
                someErrorDetected = false,
                errorMessage,
                value = rawValue.trim(),
                validationResult,
                diagnosis;

            // Validate if we need to.
            if (options.required && !value) {
                errorMessage = 'required field ' + spec.label() + ' missing';
                diagnosis = 'required-missing';
            } else if (!options.required && value === '') {
                // just skip it, it is ok.
                diagnosis = 'optional-empty';
            } else {
                // Truth be told, we cannot even get here unless this condition
                // is met.
                validationResult = Validation.validateObjectRef(value);
                if (!validationResult.isValid) {
                    errorMessage = validationResult.errorMessage;
                    diagnosis = 'invalid';
                }
            }

            return {
                isValid: !someErrorDetected,
                validated: true,
                diagnosis: diagnosis || 'valid',
                errorMessage: errorMessage,
                value: validationResult.parsedValue
            };
        }

        function getObjectsByType(type, authToken) {
            var workspace = new Workspace(workspaceUrl, {
                token: authToken
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

        function fetchData(input) {
            var types = spec.spec.text_options.valid_ws_types;
            return Promise.all(types.map(function (type) {
                return getObjectsByType(type, input.authToken);
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
        function render(params, data) {
            var events = Events.make();
            var inputControl = makeInputControl(data, events, bus);
            
            $container.find('[data-element="input-container"]').html(inputControl);
                
        }

        /*
         * In the layout we set up an environment in which one or more parameter
         * rows may be inserted.
         * For the objectInput, there is only ever one control.
         */
        function layout(events) {
            var content;
            if (options.multiple) {
                content = div({
                    class: 'kb-method-parameter-row',
                    dataElement: 'main-panel',
                    id: events.addEvents({events: [
                            {
                                type: 'mouseeneter',
                                handler: function (e) {
                                    e.target.classList.add('kb-method-parameter-row-hover');
                                }
                            },
                            {
                                type: 'mouseleave',
                                handler: function (e) {
                                    e.target.classList.remove('kb-method-parameter-row-hover');
                                }
                            }
                        ]})}, [
                    div({dataElement: 'input-container'})
                ]);
            } else {
                content = div({
                    dataElement: 'main-panel'
                }, [
                    div({dataElement: 'input-container'})
                ]);
            }
            return {
                content: content,
                events: events
            };
        }

        // LIFECYCLE API

        function init() {
            // Normalize the parameter specification settings.
            // TODO: much of this is just silly, we should be able to use the spec 
            //   directly in most places.
            options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
            // options.classes = classSets[options.environment];
            options.multiple = spec.multipleItems();
            options.required = spec.required();
            // options.isOutputName = spec.text_options && spec.text_options.is_output_name;
            options.enabled = true;
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
            });
        }

        function run(params) {
            // return render();
            return fetchData(params)
                .then(function (data) {
                    return render(params, data);
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