/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'bluebird',
    'kb_common/html',
    'kb_common/utils',
    'kb_service/client/workspace',
    'kb_service/utils',
    'kb_sdk_clients/genericClient',
    '../validation',
    'common/events',
    'common/runtime',
    'common/ui',
    'bootstrap',
    'css!font-awesome'
], function(
    $,
    Promise,
    html,
    utils,
    Workspace,
    serviceUtils,
    GenericClient,
    Validation,
    Events,
    Runtime,
    UI) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        var spec = config.parameterSpec,
            objectRefType = config.referenceType || 'name',
            runtime = Runtime.make(),
            workspaceId = runtime.getEnv('workspaceId'),
            parent,
            container,
            bus = config.bus,
            ui,
            model = {
                blacklistValues: undefined,
                availableValues: undefined,
                value: undefined
            };

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
                    .filter(function(objectInfo) {
                        if (model.blacklistValues) {
                            return !model.blacklistValues.some(function(value) {
                                return (value === getObjectRef(objectInfo, value));
                            });
                        }
                    })
                    .map(function(objectInfo) {
                        var selected = false,
                            ref = getObjectRef(objectInfo, model.value);
                        if (ref === model.value) {
                            selected = true;
                        }
                        return option({
                            value: ref,
                            selected: selected
                        }, objectInfo.name);
                    });
            }

            // CONTROL
            return select({
                class: 'form-control',
                dataElement: 'input',
                readonly: true,
                disabled: true
            }, [option({ value: '' }, '')].concat(selectOptions));
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
            var control = ui.getElement('input-container.input'),
                selected = control.selectedOptions;
            if (selected.length === 0) {
                return;
            }
            // we are modeling a single string value, so we always just get the 
            // first selected element, which is all there should be!
            return selected.item(0).value;
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
                    return render();
                })
                .then(function() {
                    autoValidate();
                });
        }

        function resetModelValue() {
            return spec.data.defaultValue;
        }

        function validate() {
            return Promise.try(function() {
                    var rawValue = getInputValue(),
                        validationOptions = {
                            required: spec.data.constraints.required,
                            authToken: runtime.authToken(),
                            workspaceServiceUrl: runtime.config('services.workspace.url')
                        };



                    switch (objectRefType) {
                        case 'ref':
                            return Validation.validateWorkspaceObjectRef(rawValue, validationOptions);
                        case 'name':
                        default:
                            return Validation.validateText(rawValue, validationOptions);
                            // return Validation.validateWorkspaceObjectName(rawValue, validationOptions);
                    }
                })
                .then(function(validationResult) {
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
                .then(function(data) {
                    return data.map(function(objectInfo) {
                        return serviceUtils.objectInfoToObject(objectInfo);
                    });
                });
        }

        function getObjectsByTypes(types) {
            return Promise.all(types.map(function(type) {
                    return getObjectsByType(type);
                }))
                .then(function(objectSets) {
                    return Array.prototype.concat.apply([], objectSets);
                });
        }


        function getPaletteObjectsByTypes(types) {
            var narrativeClient = new GenericClient({
                module: 'NarrativeService',
                url: runtime.config('services.service_wizard.url'),
                version: 'dev',
                token: runtime.authToken()
            });
            return narrativeClient.callFunc('list_objects_with_sets', [{
                    ws_id: workspaceId,
                    types: types,
                    includeMetadata: 1
                }])
                .then(function(result) {
                    var objects = result[0].data.map(function(obj) {
                        var info = serviceUtils.objectInfoToObject(obj.object_info);
                        if (obj.dp_info) {
                            info.palette = obj.dp_info.ref;
                        }
                        return info;
                    });
                    return objects;
                });
        }

        function filterObjectInfoByType(objects, types) {
            return objects.map(function(objectInfo) {
                    var type = objectInfo.typeModule + '.' + objectInfo.typeName;
                    if (types.indexOf(type) >= 0) {
                        return objectInfo;
                    }
                })
                .filter(function(item) {
                    return item !== undefined;
                });
        }

        function getObjectsForTypes(types) {
            return runtime.bus().plisten({
                    channel: 'data',
                    key: {
                        type: 'workspace-data-updated'
                    },
                    handle: function(message) {
                        doWorkspaceChanged(filterObjectInfoByType(message.objectInfo, types));
                    }
                })
                .then(function(message) {
                    // console.log('GOT first workspace-data-updated', message);
                    return filterObjectInfoByType(message.objectInfo, types);
                });
        }

        function getObjectsByTypeDataPanel(type) {
            return new Promise(function(resolve) {
                // wow, creative (ab)use of trigger!
                $(document).trigger('dataLoadedQuery.Narrative', [
                    [type], 0,
                    function(data) {
                        var items = [];
                        Object.keys(data).forEach(function(type) {
                            data[type].forEach(function(objInfo) {
                                items.push(serviceUtils.objectInfoToObject(objInfo));
                            });
                        });
                        resolve(items);
                    }
                ]);
            });
        }

        function fetchData() {
            var types = spec.data.constraints.types;
            return getObjectsForTypes(types)
                .then(function(objects) {
                    objects.sort(function(a, b) {
                        if (a.saveDate < b.saveDate) {
                            return 1;
                        }
                        if (a.saveDate === b.saveDate) {
                            return 0;
                        }
                        return -1;
                    });
                    return objects;
                });
        }

        function fetchData_narrativService() {
            var types = spec.data.constraints.types;
            return getPaletteObjectsByTypes(types)
                // .spread(function(paletteObjects, objects) {
                //     return paletteObjects.concat(objects);
                // })
                //.then(function(objectSets) {
                // we could also use [] rather than Array.prototype, but
                // this way is both more mysterious and better performing.
                // console.log('got objects', objectSets);
                // return Array.prototype.concat.apply([], objectSets);
                // })
                .then(function(objects) {
                    objects.sort(function(a, b) {
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
            return Promise.try(function() {
                var events = Events.make(),
                    inputControl = makeInputControl(events, bus),
                    content = div({ class: 'input-group', style: { width: '100%' } }, inputControl);

                ui.setContent('input-container', content);
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
                    bus.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        function getObjectRef(objectInfo, ref) {
            if (objectInfo.dp_info) {
                return objectInfo.dp_info.ref + ';' + objectInfo.ref;
            }
            var type;
            if (ref) {
                type = grokObjectRefType(ref);
            } else {
                type = objectRefType
            }

            if (objectInfo.wsid === workspaceId) {
                return objectInfo.name;
            }

            return objectInfo.ref;

            // switch (type) {
            //     case 'name':
            //         // to accomodate object by name but in a data palette, we need
            //         // to include the workspace id or name.
            //         // If the object is in this Narrative Workspace, only use the name;
            //         // If elsewhere, use the full reference.
            //         if (objectInfo.wsid === workspaceId) {
            //             return objectInfo.name;
            //         } else {
            //             return objectInfo.ref;
            //         }
            //     case 'ref':
            //         // By reference, use the absolute ref.
            //         return objectInfo.ref;
            //     default:
            //         throw new Error('Unsupported object reference type ' + objectRefType);
            // }
        }

        function grokObjectRefType(ref) {
            if (ref.match(/\;/)) {
                return 'paletteRef';
            }
            if (ref.match(/\//)) {
                return 'ref';
            }
            return 'name';
        }

        /*
         * Handle the workspace being updated and reflecting that correctly
         * in the ui.
         * Re-fetch available values, if different than existing, then
         * rebuild the control. If there is a current value and it is no longer
         * available, issue a warning
         */
        function doWorkspaceChanged(data) {

            // compare to availableData.
            if (!utils.isEqual(data, model.availableValues)) {
                model.availableValues = data;
                console.log('DATA', data);
                var matching = model.availableValues.filter(function(value) {
                    if (model.value && model.value === getObjectRef(value, model.value)) {
                        return true;
                    }
                    return false;
                });
                if (matching.length === 0) {
                    model.value = null;
                }
                render()
                    .then(function() {
                        autoValidate();
                    });
            }
        }

        function doWorkspaceChanged_fetch() {
            // there are a few thin
            fetchData()
                .then(function(data) {
                    // compare to availableData.
                    if (!utils.isEqual(data, model.availableValues)) {
                        model.availableValues = data;
                        console.log('DATA', data);
                        var matching = model.availableValues.filter(function(value) {
                            if (model.value && model.value === getObjectRef(value, model.value)) {
                                return true;
                            }
                            return false;
                        });
                        if (matching.length === 0) {
                            model.value = null;
                        }
                        render()
                            .then(function() {
                                autoValidate();
                            });
                    }
                });

        }

        // LIFECYCLE API
        function start(arg) {
            return Promise.try(function() {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                var events = Events.make(),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents(container);

                return fetchData()
                    .then(function(data) {
                        model.availableValues = data;
                        render();
                    })
                    .then(function() {
                        bus.on('reset-to-defaults', function(message) {
                            resetModelValue();
                        });
                        bus.on('update', function(message) {
                            setModelValue(message.value);
                        });
                        // runtime.bus().on('workspace-changed', function(message) {
                        //     doWorkspaceChanged();
                        // });
                        bus.emit('sync');
                    });
            });
        }

        function stop() {
            return Promise.try(function() {
                if (container) {
                    parent.removeChild(container);
                }
            });
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