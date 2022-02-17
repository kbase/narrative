define([
    'jquery',
    'bluebird',
    'underscore',
    'common/html',
    'kb_service/client/workspace',
    'kb_service/utils',
    'kb_sdk_clients/genericClient',
    '../validation',
    'common/events',
    'common/runtime',
    'common/ui',
    'bootstrap',
], (
    $,
    Promise,
    _,
    html,
    Workspace,
    serviceUtils,
    GenericClient,
    Validation,
    Events,
    Runtime,
    UI
) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        const spec = config.parameterSpec,
            objectRefType = config.referenceType || 'name',
            runtime = Runtime.make(),
            workspaceId = runtime.getEnv('workspaceId'),
            bus = config.bus,
            eventListeners = [],
            model = {
                blacklistValues: undefined,
                availableValues: undefined,
                value: undefined,
            };
        let container, ui, parent;

        model.blacklistValues = config.blacklist || [];

        // Validate configuration.
        if (!workspaceId) {
            throw new Error('Workspace id required for the object widget');
        }

        function makeInputControl() {
            // There is an input control, and a dropdown,
            // TODO select2 after we get a handle on this...
            let selectOptions;
            if (model.availableValues) {
                selectOptions = model.availableValues
                    .filter((objectInfo) => {
                        if (model.blacklistValues) {
                            return !model.blacklistValues.some((value) => {
                                return value === getObjectRef(objectInfo, value);
                            });
                        }
                    })
                    .map((objectInfo) => {
                        let selected = false;
                        const ref = getObjectRef(objectInfo, model.value);
                        if (ref === model.value) {
                            selected = true;
                        }
                        return option(
                            {
                                value: ref,
                                selected,
                                disabled: true,
                            },
                            objectInfo.name
                        );
                    });
            }

            // CONTROL
            return select(
                {
                    class: 'form-control',
                    dataElement: 'input',
                    readonly: true,
                    disabled: true,
                },
                [option({ value: '' }, '')].concat(selectOptions)
            );
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
            const control = ui.getElement('input-container.input'),
                selected = control.selectedOptions;
            if (selected.length === 0) {
                return;
            }
            // we are modeling a single string value, so we always just get the
            // first selected element, which is all there should be!
            return selected.item(0).value;
        }

        function setModelValue(value) {
            return Promise.try(() => {
                if (model.value !== value) {
                    model.value = value;
                    return true;
                }
                return false;
            })
                .then(() => {
                    return render();
                })
                .then(() => {
                    autoValidate();
                });
        }

        function resetModelValue() {
            return spec.data.defaultValue;
        }

        function validate() {
            return Promise.try(() => {
                const rawValue = getInputValue(),
                    validationOptions = {
                        required: spec.data.constraints.required,
                        authToken: runtime.authToken(),
                        workspaceServiceUrl: runtime.config('services.workspace.url'),
                    };

                switch (objectRefType) {
                    case 'ref':
                        return Validation.validateWorkspaceObjectRef(rawValue, validationOptions);
                    case 'name':
                    default:
                        return Validation.validateTextString(rawValue, validationOptions);
                }
            }).then((validationResult) => {
                return {
                    isValid: validationResult.isValid,
                    validated: true,
                    diagnosis: validationResult.diagnosis,
                    errorMessage: validationResult.errorMessage,
                    value: validationResult.parsedValue,
                };
            });
        }

        function filterObjectInfoByType(objects, types) {
            return objects
                .map((objectInfo) => {
                    const type = objectInfo.typeModule + '.' + objectInfo.typeName;
                    if (types.indexOf(type) >= 0) {
                        return objectInfo;
                    }
                })
                .filter((item) => {
                    return item !== undefined;
                });
        }

        function getObjectsForTypes(types) {
            const listener = runtime.bus().plisten({
                channel: 'data',
                key: {
                    type: 'workspace-data-updated',
                },
                handle: function (message) {
                    doWorkspaceChanged(filterObjectInfoByType(message.objectInfo, types));
                },
            });
            eventListeners.push(listener.id);
            return listener.promise.then((message) => {
                return filterObjectInfoByType(message.objectInfo, types);
            });
        }

        function fetchData() {
            const types = spec.data.constraints.types;
            return getObjectsForTypes(types).then((objects) => {
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

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function render() {
            return Promise.try(() => {
                const events = Events.make(),
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
            const content = div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' })]
            );
            return {
                content,
                events,
            };
        }

        function autoValidate() {
            return validate().then((result) => {
                bus.emit('validation', {
                    errorMessage: result.errorMessage,
                    diagnosis: result.diagnosis,
                });
            });
        }

        function getObjectRef(objectInfo) {
            if (objectInfo.dp_info) {
                return objectInfo.dp_info.ref + ';' + objectInfo.ref;
            }

            if (objectInfo.wsid === workspaceId) {
                return objectInfo.name;
            }

            return objectInfo.ref;
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
            if (!_.isEqual(data, model.availableValues)) {
                model.availableValues = data;
                const matching = model.availableValues.filter((value) => {
                    if (model.value && model.value === getObjectRef(value, model.value)) {
                        return true;
                    }
                    return false;
                });
                if (matching.length === 0) {
                    model.value = null;
                }
                render().then(() => {
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

                return fetchData()
                    .then((data) => {
                        model.availableValues = data;
                        render();
                    })
                    .then(() => {
                        bus.on('reset-to-defaults', () => {
                            resetModelValue();
                        });
                        bus.on('update', (message) => {
                            setModelValue(message.value);
                        });
                        bus.emit('sync');
                    });
            });
        }

        function stop() {
            return Promise.try(() => {
                if (container) {
                    parent.removeChild(container);
                }
                eventListeners.forEach((id) => {
                    runtime.bus().removeListener(id);
                });
            });
        }

        return {
            start,
            stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
