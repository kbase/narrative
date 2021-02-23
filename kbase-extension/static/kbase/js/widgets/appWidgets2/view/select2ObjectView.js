/*global define*/
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
    'widgets/appWidgets2/common',
    'select2',
    'bootstrap',
    'css!font-awesome'
], (
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
    WidgetCommon,
) => {
    'use strict';

    // Constants
    const t = html.tag,
        button = t('button'),
        div = t('div'),
        span = t('span'),
        b = t('b'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        let spec = config.parameterSpec,
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
            let selectOptions;
            if (model.availableValues) {
                const filteredOptions = [];
                selectOptions = model.availableValues
                    .filter((objectInfo, idx) => {
                        if (model.blacklistValues) {
                            return !model.blacklistValues.some((value) => {
                                if (objectInfoHasRef(objectInfo, value)) {
                                    // if (value === getObjectRef(objectInfo)) {
                                    filteredOptions.push(idx);
                                    return true;
                                }
                                return false;
                            });
                        }
                    })
                    .map((objectInfo, idx) => {
                        let selected = false,
                            ref = idx; //getObjectRef(objectInfo);
                        if (objectInfoHasRef(objectInfo, model.value)) {
                            // if (getObjectRef(objectInfo) === model.value) {
                            selected = true;
                        }
                        return option({
                            value: ref,
                            selected: selected,
                            disabled: true
                        }, objectInfo.name);
                    });
            }

            // CONTROL

            const selectElem = select({
                id: html.genId(),
                class: 'form-control',
                style: {
                    width: '100%'
                },
                dataElement: 'input',
                disabled: true
            }, [option({ value: '' }, '')].concat(selectOptions));

            return selectElem;
        }

        // CONTROL

        function getControlValue() {
            const control = ui.getElement('input-container.input'),
                selected = control.selectedOptions;
            if (selected.length === 0) {
                return;
            }
            // we are modeling a single string value, so we always just get the
            // first selected element, which is all there should be!
            return selected.item(0).value;
        }


        function setControlValue(value) {
            let stringValue;
            if (value === null) {
                stringValue = '';
            } else {
                stringValue = value;
            }

            const control = ui.getElement('input-container.input');

            // NB id used as String since we are comparing it below to the actual dom
            // element id
            const currentSelectionId = String(model.availableValuesMap[stringValue]);

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
            return Promise.try(() => {
                let objInfo = model.availableValues[getControlValue()],
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
            return Data.getObjectsByTypes(types, bus, (result) => {
                    doWorkspaceUpdated(result.data);
                })
                .then((result) => {
                    return result.data;
                });
        }


        function fetchData() {
            const types = spec.data.constraints.types;
            return getObjectsByTypes_datalist(types)
                .then((objects) => {
                    objects.sort((a, b) => {
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

        /**
         * Formats the display of an object in the dropdown.
         */
        function formatObjectDisplay(object) {
            if (!object.id) {
                return $('<div style="display:block; height:20px">').append(object.text);
            }
            const objectInfo = model.availableValues[object.id];
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
            return Promise.try(() => {
                const events = Events.make(),
                    inputControl = makeInputControl(events);

                ui.setContent('input-container', '');
                const container = ui.getElement('input-container');
                const content = WidgetCommon.containerContent(
                    div, button, events, ui, container, inputControl
                );
                ui.setContent('input-container', content);

                $(ui.getElement('input-container.input')).select2({
                        readonly: true,
                        templateResult: formatObjectDisplay,
                        templateSelection: function(object) {
                            if (!object.id) {
                                return object.text;
                            }
                            return model.availableValues[object.id].name;
                        }
                    })
                    .on('advanced-shown.kbase', (e) => {
                        $(e.target).select2({ width: 'resolve' });
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
            const content = div({
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
                .then((result) => {
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
                model.availableValues.forEach((objectInfo, index) => {
                    let id;
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
                    .then(() => {
                        setControlValue(getModelValue());
                        autoValidate();
                    });
            }
        }

        // LIFECYCLE API
        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                const events = Events.make(),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents(container);

                if (config.initialValue !== undefined) {
                    model.value = config.initialValue;
                }

                return fetchData()
                    .then((data) => {
                        doWorkspaceUpdated(data);
                        return render();
                    })
                    .then(() => {

                        channel.on('reset-to-defaults', () => {
                            resetModelValue();
                        });
                        channel.on('update', (message) => {
                            setModelValue(message.value);
                        });

                        setControlValue(getModelValue());
                        autoValidate();
                    });
            });
        }

        function stop() {
            return Promise.try(() => {
                if (container) {
                    parent.removeChild(container);
                }
                bus.stop();
                eventListeners.forEach((id) => {
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
