/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'jquery',
    'kb_common/html',
    'kb_common/utils',
    'kb_service/client/workspace',
    'kb_service/utils',
    'common/validation',
    'common/events',
    'common/runtime',
    'common/ui',
    'common/data',
    'util/timeFormat',
    'kb_sdk_clients/genericClient',

    'select2',
    'bootstrap',
    'css!font-awesome'
], function(
    Promise,
    $,
    html,
    utils,
    Workspace,
    serviceUtils,
    Validation,
    Events,
    Runtime,
    UI,
    Data,
    TimeFormat,
    GenericClient) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        b = t('b'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        var spec = config.parameterSpec,
            objectRefType = config.referenceType || 'name',
            parent,
            container,
            runtime = Runtime.make(),
            bus = runtime.bus().connect(),
            channel = bus.channel(config.channelName),
            ui,
            model = {
                blacklistValues: undefined,
                availableValues: undefined,
                availableValuesMap: {},
                value: undefined
            },
            eventListeners = [],
            workspaceId = runtime.getEnv('workspaceId');

        // TODO: getting rid of blacklist temporarily until we work out how to state-ify everything by reference.
        model.blacklistValues = []; //config.blacklist || [];

        function objectInfoHasRef(objectInfo, ref) {
            if (objectInfo.dataPaletteRef) {
                return objectInfo.dataPaletteRef === ref;
            }
            if (/\//.test(ref)) {
                return objectInfo.ref;
            }
            return objectInfo.name;
        }

        function makeInputControl() {
            var selectOptions;
            if (model.availableValues) {
                var filteredOptions = [];
                selectOptions = model.availableValues
                    .filter(function(objectInfo, idx) {
                        if (model.blacklistValues) {
                            return !model.blacklistValues.some(function(value) {
                                if (objectInfoHasRef(objectInfo, value)) {
                                    // if (value === getObjectRef(objectInfo)) {
                                    filteredOptions.push(idx);
                                    return true;
                                }
                                return false;
                            });
                        }
                    })
                    .map(function(objectInfo, idx) {
                        var selected = false,
                            ref = idx; //getObjectRef(objectInfo);
                        if (objectInfoHasRef(objectInfo, model.value)) {
                            // if (getObjectRef(objectInfo) === model.value) {
                            selected = true;
                        }
                        return option({
                            value: ref,
                            selected: selected
                        }, objectInfo.name);
                    });
            }

            // CONTROL
            var selectElem = select({
                class: 'form-control',
                dataElement: 'input'
            }, [option({ value: '' }, '')].concat(selectOptions));

            return selectElem;
        }

        // CONTROL

        function getControlValue() {
            var control = ui.getElement('input-container.input'),
                selected = control.selectedOptions;
            if (selected.length === 0) {
                return;
            }
            // we are modeling a single string value, so we always just get the
            // first selected element, which is all there should be!
            return selected.item(0).value;
        }

        function setControlValue(value) {
            var stringValue;
            if (value === null) {
                stringValue = '';
            } else {
                stringValue = value;
            }

            var control = ui.getElement('input-container.input');

            // NB id used as String since we are comparing it below to the actual dom
            // element id
            var currentSelectionId = String(model.availableValuesMap[stringValue]);

            $(control).val(currentSelectionId).trigger('change.select2');
        }

        // MODEL

        function setModelValue(value) {
            if (model.value === undefined) {
                return;
            }
            if (model.value !== value) {
                model.value = value;
            }
        }

        function resetModelValue() {
            setModelValue(spec.data.defaultValue);
        }

        function getModelValue() {
            return model.value;
        }

        // VALIDATION

        function validate() {
            return Promise.try(function() {
                var objInfo = model.availableValues[getControlValue()],
                    processedValue = '',
                    validationOptions = {
                        required: spec.data.constraints.required,
                        authToken: runtime.authToken(),
                        workspaceServiceUrl: runtime.config('services.workspace.url')
                    };

                if (objInfo && objInfo.dataPaletteRef) {
                    return Validation.validateWorkspaceDataPaletteRef(objInfo.dataPaletteRef, validationOptions);
                }

                if (objInfo) {
                    processedValue = objectRefType === 'ref' ? objInfo.ref : objInfo.name;
                }

                switch (objectRefType) {
                case 'ref':
                    return Validation.validateWorkspaceObjectRef(processedValue, validationOptions);
                case 'name':
                default:
                    return Validation.validateWorkspaceObjectName(processedValue, validationOptions);
                }
            });
        }

        function getObjectsByTypes_datalist(types) {
            return Data.getObjectsByTypes(types, bus, function(result) {
                doWorkspaceUpdated(result.data);
            })
            .then(function(result) {
                return result.data;
            });
        }


        function fetchData() {
            var types = spec.data.constraints.types;
            return getObjectsByTypes_datalist(types)
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

        function doChange() {
            validate()
                .then(function(result) {
                    if (result.isValid) {
                        model.value = result.parsedValue;
                        channel.emit('changed', {
                            newValue: result.parsedValue
                        });
                    } else if (result.diagnosis === 'required-missing') {
                        model.value = spec.data.nullValue;
                        channel.emit('changed', {
                            newValue: spec.data.nullValue
                        });
                    }
                    channel.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        /**
         * Formats the display of an object in the dropdown.
         */
        function formatObjectDisplay(object) {
            if (!object.id) {
                return $('<div style="display:block; height:20px">').append(object.text);
            }
            var objectInfo = model.availableValues[object.id];
            return $(div([
                span({ style: 'word-wrap: break-word' }, [
                    b(objectInfo.name)
                ]),
                ' (v' + objectInfo.version + ')<br>',
                div({ style: 'margin-left: 7px' }, [
                    '<i>' + objectInfo.typeName + '</i><br>',
                    'Narrative id: ' + objectInfo.wsid + '<br>',
                    'updated ' + TimeFormat.getTimeStampStr(objectInfo.save_date) + ' by ' + objectInfo.saved_by
                ])
            ]));
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function render() {
            return Promise.try(function() {
                var events = Events.make(),
                    inputControl = makeInputControl(events),
                    content = div({ class: 'input-group', style: { width: '100%' } }, inputControl);

                ui.setContent('input-container', content);

                $(ui.getElement('input-container.input')).select2({
                    templateResult: formatObjectDisplay,
                    templateSelection: function(object) {
                        if (!object.id) {
                            return object.text;
                        }
                        return model.availableValues[object.id].name;
                    }
                }).on('change', function() {
                    doChange();
                });
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
                    channel.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        // function getObjectRef(objectInfo) {
        //     switch (objectRefType) {
        //         case 'name':
        //             return objectInfo.name;
        //         case 'ref':
        //             return objectInfo.ref;
        //         default:
        //             throw new Error('Unsupported object reference type ' + objectRefType);
        //     }
        // }

        /*
         * Handle the workspace being updated and reflecting that correctly
         * in the ui.
         * Re-fetch available values, if different than existing, then
         * rebuild the control. If there is a current value and it is no longer
         * available, issue a warning
         */

        function doWorkspaceUpdated(data) {
            // compare to availableData.
            if (!utils.isEqual(data, model.availableValues)) {
                model.availableValues = data;
                model.availableValuesMap = {};
                // our map is a little strange.
                // we have dataPaletteRefs, which are always ref paths
                // we have object ref or names otherwise.
                // whether we are using refs or names depends on the 
                // config setting. This is because some apps don't yet accept
                // names... 
                // So our key is either dataPaletteRef or (ref or name)
                model.availableValues.forEach(function(objectInfo, index) {
                    var id;
                    if (objectInfo.dataPaletteRef) {
                        id = objectInfo.dataPaletteRef;
                    } else if (objectRefType === 'ref') {
                        id = objectInfo.ref;
                    } else {
                        id = objectInfo.name;
                    }
                    model.availableValuesMap[id] = index;
                });
                return render()
                    .then(function() {
                        setControlValue(getModelValue());
                        autoValidate();
                    });
            }
        }

        function doWorkspaceChanged() {
            // there are a few thin
            fetchData()
                .then(function(data) {
                    return doWorkspaceUpdated(data);
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

                if (config.initialValue !== undefined) {
                    model.value = config.initialValue;
                }

                return fetchData()
                    .then(function(data) {
                        doWorkspaceUpdated(data);
                        // model.availableValues = data;
                        return render();
                    })
                    .then(function() {

                        channel.on('reset-to-defaults', function() {
                            resetModelValue();
                        });
                        channel.on('update', function(message) {
                            setModelValue(message.value);
                        });
                        // bus.channel().on('workspace-changed', function() {
                        //     doWorkspaceChanged();
                        // });
                        // bus.emit('sync');

                        setControlValue(getModelValue());
                        autoValidate();
                    });
            });
        }

        function stop() {
            return Promise.try(function() {
                if (container) {
                    parent.removeChild(container);
                }
                bus.stop();
                eventListeners.forEach(function(id) {
                    runtime.bus().removeListener(id);
                });
            });
        }

        // INIT


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