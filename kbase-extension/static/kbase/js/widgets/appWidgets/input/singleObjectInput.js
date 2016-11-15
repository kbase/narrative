/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'jquery',
    'base/js/namespace',
    'kb_common/html',
    'kb_common/utils',
    'kb_service/client/workspace',
    'kb_service/utils',
    'common/validation',
    'common/events',
    'common/runtime',
    'common/dom',
    'select2',
    'bootstrap',
    'css!font-awesome'
], function (
    Promise,
    $,
    Jupyter,
    html,
    utils,
    Workspace,
    serviceUtils,
    Validation,
    Events,
    Runtime,
    Dom) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        select = t('select'), option = t('option');

    function factory(config) {
        var constraints = config.parameterSpec.getConstraints(),
            workspaceId = config.workspaceId,
            objectRefType = config.referenceType || 'name',
            parent,
            container,
            bus = config.bus,
            dom,
            model = {
                blacklistValues: undefined,
                availableValues: undefined,
                value: undefined
            },
            runtime = Runtime.make();

        model.blacklistValues = config.blacklist || [];

        // Validate configuration.
        if (!workspaceId) {
            throw new Error('Workspace id required for the object widget');
        }

        function makeInputControl(events, bus) {
            // There is an input control, and a dropdown,
            // TODO select2 after we get a handle on this...
            var selectOptions;
            if (model.availableValues) {
                selectOptions = model.availableValues
                    .filter(function (objectInfo) {
                        if (model.blacklistValues) {
                            return !model.blacklistValues.some(function (value) {
                                return (value === getObjectRef(objectInfo));
                            });
                        }
                    })
                    .map(function (objectInfo) {
                        var selected = false,
                            ref = getObjectRef(objectInfo);
                        if (ref === model.value) {
                            selected = true;
                        }
                        return option({
                            value: ref,
                            selected: selected
                        }, objectInfo.name + ' ' + objectInfo.ref);
                    });
            }

            // CONTROL
            return select({
                id: events.addEvent({type: 'change', handler: function (e) {
                        validate()
                            .then(function (result) {
                                if (result.isValid) {
                                    model.value = result.value;
                                    bus.emit('changed', {
                                        newValue: result.value
                                    });
                                } else if (result.diagnosis === 'required-missing') {
                                    model.value = result.value;
                                    bus.emit('changed', {
                                        newValue: result.value
                                    });
                                }
                                bus.emit('validation', {
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
            var control = dom.getElement('input-container.input'),
                selected = control.selectedOptions;
            if (selected.length === 0) {
                return;
            }
            // we are modeling a single string value, so we always just get the
            // first selected element, which is all there should be!
            return selected.item(0).value;
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
                })
                .then(function () {
                    autoValidate();
                });
        }

        function unsetModelValue() {
            return Promise.try(function () {
                model.value = undefined;
            })
                .then(function (changed) {
                    render();
                })
                .then(function () {
                    autoValidate();
                });
        }

        function resetModelValue() {
            if (constraints.defaultValue) {
                setModelValue(constraints.defaultValue);
            } else {
                unsetModelValue();
            }
        }

        function validate() {
            return Promise.try(function () {
                var rawValue = getInputValue(),
                    validationOptions = {
                        required: constraints.required,
                        authToken: runtime.authToken(),
                        workspaceServiceUrl: runtime.config('services.workspace.url')
                    };

                switch (objectRefType) {
                    case 'ref':
                        return Validation.validateWorkspaceObjectRef(rawValue, validationOptions);
                    case 'name':
                    default:
                        return Validation.validateWorkspaceObjectName(rawValue, validationOptions);
                }
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
            return Promise.try(function() {
                return Jupyter.narrative.sidePanel.$dataWidget.getLoadedData(type);
            })
            .then(function(data) {
                var objList = [];
                Object.keys(data).forEach(function(typeKey) {
                    objList = objList.concat(data[typeKey]);
                });
                console.log(objList);
                return objList.map(function (objectInfo) {
                    return serviceUtils.objectInfoToObject(objectInfo);
                });
            });

        }

        function fetchData() {
            var types = constraints.types;
            return Promise.all(types.map(function (type) {
                return getObjectsByType(type);
            }))
                .then(function (objectSets) {
                    // we could also use [] rather than Array.prototype, but
                    // this way is both more mysterious and better performing.
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

                dom.setContent('input-container', content);
                events.attachEvents(container);

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
                    bus.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        function getObjectRef(objectInfo) {
            switch (objectRefType) {
                case 'name':
                    return objectInfo.name;
                    break;
                case 'ref':
                    return objectInfo.ref;
                    break;
                default:
                    throw new Error('Unsupported object reference type ' + objectRefType);
            }
        }

        /*
         * Handle the workspace being updated and reflecting that correctly
         * in the ui.
         * Re-fetch available values, if different than existing, then
         * rebuild the control. If there is a current value and it is no longer
         * available, issue a warning
         */
        function doWorkspaceChanged() {
            // there are a few thin
            fetchData()
                .then(function (data) {
                    // compare to availableData.
                    if (!utils.isEqual(data, model.availableValues)) {
                        model.availableValues = data;
                        var matching = model.availableValues.filter(function (value) {
                            if (value.name === getObjectRef(value)) {
                                return true;
                            }
                            return false;
                        });
                        if (matching.length === 0) {
                            model.value = null;
                        }
                        render()
                            .then(function () {
                                autoValidate();
                            });
                    }
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

                    return fetchData()
                        .then(function (data) {
                            model.availableValues = data;
                            render();
                        })
                        .then(function () {
                            bus.on('reset-to-defaults', function (message) {
                                resetModelValue();
                            });
                            bus.on('update', function (message) {
                                setModelValue(message.value);
                            });
                            //bus.on('workspace-changed', function (message) {
                            //    doWorkspaceChanged();
                            //});
                            runtime.bus().on('workspace-changed', function (message) {
                                doWorkspaceChanged();
                            });
                            bus.emit('sync');
                        });
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
