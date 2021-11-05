define([
    'bluebird',
    'jquery',
    'underscore',
    'common/html',
    'common/data',
    'common/events',
    'common/runtime',
    'common/ui',
    'common/validation',
    'util/timeFormat',
    'widgets/appWidgets2/common',

    'select2',
    'bootstrap',
], (Promise, $, _, html, Data, Events, Runtime, UI, Validation, TimeFormat, WidgetCommon) => {
    'use strict';

    // Constants
    const t = html.tag,
        button = t('button'),
        div = t('div'),
        span = t('span'),
        select = t('select'),
        option = t('option'),
        cssBaseClass = 'kb-select2-object-input';

    function factory(config) {
        const spec = config.parameterSpec,
            objectRefType = config.referenceType || 'name',
            runtime = Runtime.make(),
            bus = runtime.bus().connect(),
            channel = bus.channel(config.channelName),
            model = {
                blacklistValues: undefined,
                availableValues: undefined,
                availableValuesMap: {},
                value: undefined,
            };
        let parent, container, ui;

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
                selectOptions = model.availableValues
                    .filter((objectInfo) => {
                        if (model.blacklistValues) {
                            return !model.blacklistValues.some((value) => {
                                return objectInfoHasRef(objectInfo, value);
                            });
                        }
                    })
                    .map((objectInfo, idx) => {
                        let selected = false;
                        const ref = idx;
                        if (objectInfoHasRef(objectInfo, model.value)) {
                            selected = true;
                        }
                        return option(
                            {
                                value: ref,
                                selected: selected,
                            },
                            objectInfo.name
                        );
                    });
            }

            // CONTROL
            const selectElem = select(
                {
                    class: 'form-control',
                    dataElement: 'input',
                    style: {
                        width: '100%',
                    },
                    id: html.genId(),
                },
                [option({ value: '' }, '')].concat(selectOptions)
            );

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
                const objInfo = model.availableValues[getControlValue()],
                    validationOptions = {
                        required: spec.data.constraints.required,
                        authToken: runtime.authToken(),
                        workspaceServiceUrl: runtime.config('services.workspace.url'),
                    };
                let processedValue = '';

                if (objInfo && objInfo.dataPaletteRef) {
                    return Validation.validateWorkspaceDataPaletteRef(
                        objInfo.dataPaletteRef,
                        validationOptions
                    );
                }

                if (objInfo) {
                    processedValue = objectRefType === 'ref' ? objInfo.ref : objInfo.name;
                }

                switch (objectRefType) {
                    case 'ref':
                        return Validation.validateWorkspaceObjectRef(
                            processedValue,
                            validationOptions
                        );
                    case 'name':
                    default:
                        return Validation.validateWorkspaceObjectName(
                            processedValue,
                            validationOptions
                        );
                }
            });
        }

        function getObjectsByTypes_datalist(types) {
            return Data.getObjectsByTypes(types, bus, (result) => {
                doWorkspaceUpdated(result.data);
            }).then((result) => {
                return result.data;
            });
        }

        function fetchData() {
            const types = spec.data.constraints.types;
            return getObjectsByTypes_datalist(types).then((objects) => {
                objects.sort((a, b) => {
                    if (a.saveDate < b.saveDate) {
                        return 1;
                    }
                    if (a.saveDate === b.saveDate) {
                        return 0;
                    }
                    return -1;
                });
                // if our current object isn't in the list,
                // try to fetch its info manually
                // (it might be in another workspace)
                let containsCurrent = false;
                const currentObj = getModelValue();
                // to begin, this only applies to obj references.
                // so test for that.
                if (Validation.validateWorkspaceObjectRef(currentObj).isValid) {
                    objects.forEach((o) => {
                        if (o.ref === currentObj) {
                            containsCurrent = true;
                        }
                    });
                    if (!containsCurrent) {
                        return Data.getObjectsByRef([currentObj]).then((info) => {
                            return [info[currentObj]].concat(objects);
                        });
                    }
                }
                return Promise.try(() => {
                    return objects;
                });
            });
        }

        function doChange() {
            validate().then((result) => {
                if (result.isValid) {
                    model.value = result.parsedValue;
                    channel.emit('changed', {
                        newValue: result.parsedValue,
                    });
                } else if (result.diagnosis === 'required-missing') {
                    model.value = spec.data.nullValue;
                    channel.emit('changed', {
                        newValue: spec.data.nullValue,
                    });
                }
                channel.emit('validation', {
                    errorMessage: result.errorMessage,
                    diagnosis: result.diagnosis,
                });
            });
        }

        /**
         * Formats the display of an object in the dropdown.
         */
        function formatObjectDisplay(object) {
            if (!object.id) {
                return $(
                    div(
                        {
                            class: `${cssBaseClass}__item`,
                        },
                        object.text
                    )
                );
            }
            const objectInfo = model.availableValues[object.id];
            return $(
                div([
                    span(
                        {
                            class: `${cssBaseClass}__object`,
                        },
                        [
                            span(
                                {
                                    class: `${cssBaseClass}__object_name`,
                                },
                                objectInfo.name
                            ),
                            ` (v${objectInfo.version})`,
                        ]
                    ),

                    div(
                        {
                            class: `${cssBaseClass}__object_details`,
                        },
                        [
                            span(
                                {
                                    class: `${cssBaseClass}__object_type`,
                                },
                                objectInfo.typeName
                            ),
                            span(
                                {
                                    class: `${cssBaseClass}__object_narrative`,
                                },
                                `Narrative ${objectInfo.wsid}`
                            ),
                            span(
                                {
                                    class: `${cssBaseClass}__object_updated`,
                                },
                                'updated ' +
                                    TimeFormat.getTimeStampStr(objectInfo.save_date) +
                                    ' by ' +
                                    objectInfo.saved_by
                            ),
                        ]
                    ),
                ])
            );
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function render() {
            return Promise.try(() => {
                const events = Events.make(),
                    inputControl = makeInputControl();

                ui.setContent('input-container', '');
                const _container = ui.getElement('input-container');
                const content = WidgetCommon.containerContent(
                    div,
                    button,
                    events,
                    ui,
                    _container,
                    inputControl
                );
                ui.setContent('input-container', content);

                $(ui.getElement('input-container.input'))
                    .select2({
                        templateResult: formatObjectDisplay,
                        templateSelection: function (object) {
                            if (!object.id) {
                                return object.text;
                            }
                            return model.availableValues[object.id].name;
                        },
                    })
                    .on('change', () => {
                        doChange();
                    })
                    .on('advanced-shown.kbase', (e) => {
                        $(e.target).select2({ width: 'resolve' });
                    });
                events.attachEvents(_container);
            });
        }

        /*
         * In the layout we set up an environment in which one or more parameter
         * rows may be inserted.
         * For the objectInput, there is only ever one control.
         */
        function layout(events) {
            const content = div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' })]
            );
            return {
                content: content,
                events: events,
            };
        }

        function autoValidate() {
            return validate().then((result) => {
                channel.emit('validation', {
                    errorMessage: result.errorMessage,
                    diagnosis: result.diagnosis,
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
            if (!_.isEqual(data, model.availableValues)) {
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
                return render().then(() => {
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
                    // note this might come from a different workspace...
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
                    $(ui.getElement('input-container.input')).off('change');
                    $(ui.getElement('input-container.input')).off('advanced-shown.kbase');
                    $(ui.getElement('input-container.input')).select2('destroy');
                    container.remove();
                }
                bus.stop();
            });
        }

        // INIT

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
