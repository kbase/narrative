define([
    'bluebird',
    'jquery',
    'kb_common/html',
    'kb_common/utils',
    'kb_service/client/workspace',
    'kb_service/utils',
    '../validation',
    'common/events',
    'common/runtime',
    'common/dom',
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
    Dom) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        let runtime = Runtime.make(),
            constraints = config.parameterSpec.data.constraints,
            workspaceId = runtime.getEnv('workspaceId'),
            objectRefType = config.referenceType || 'name',
            parent,
            container,
            bus = config.bus,
            dom,
            model = {
                blacklistValues: undefined,
                availableValues: undefined,
                value: undefined
            };

        model.blacklistValues = config.blacklist || [];

        // Validate configuration.
        if (!workspaceId) {
            throw new Error('Workspace id required for the object ref input widget');
        }

        function makeInputControl(events, bus) {
            // There is an input control, and a dropdown,
            // TODO select2 after we get a handle on this...
            let selectOptions;
            if (model.availableValues) {
                selectOptions = model.availableValues
                    .filter((objectInfo) => {
                        if (model.blacklistValues) {
                            return !model.blacklistValues.some((value) => {
                                return (value === getObjectRef(objectInfo));
                            });
                        }
                    })
                    .map((objectInfo) => {
                        let selected = false,
                            ref = getObjectRef(objectInfo);
                        if (ref === model.value) {
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
            return select({
                id: events.addEvent({
                    type: 'change',
                    handler: function(e) {
                        validate()
                            .then((result) => {
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
                    }
                }),
                class: 'form-control',
                dataElement: 'input'
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
            const control = dom.getElement('input-container.input'),
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
                .then((changed) => {
                    return render();
                })
                .then(() => {
                    autoValidate();
                });
        }

        function unsetModelValue() {
            return Promise.try(() => {
                    model.value = undefined;
                })
                .then((changed) => {
                    render();
                })
                .then(() => {
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
            return Promise.try(() => {
                    const rawValue = getInputValue(),
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
                .then((validationResult) => {
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
            return new Promise((resolve) => {
                // wow, creative (ab)use of trigger!
                $(document).trigger('dataLoadedQuery.Narrative', [
                    [type], 0,
                    function(data) {
                        const items = [];
                        Object.keys(data).forEach((type) => {
                            data[type].forEach((objInfo) => {
                                items.push(serviceUtils.objectInfoToObject(objInfo));
                            });
                        });
                        resolve(items);
                    }
                ]);
            });
        }

        function getObjectsByTypex(type) {
            const workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken()
            });
            return workspace.list_objects({
                    type: type,
                    ids: [workspaceId]
                })
                .then((data) => {
                    return data.map((objectInfo) => {
                        return serviceUtils.objectInfoToObject(objectInfo);
                    });
                });
        }

        function fetchData() {
            const types = constraints.types;
            return Promise.all(types.map((type) => {
                    return getObjectsByType(type);
                }))
                .then((objectSets) => {
                    // we could also use [] rather than Array.prototype, but
                    // this way is both more mysterious and better performing.
                    return Array.prototype.concat.apply([], objectSets);
                })
                .then((objects) => {
                    objects.sort((a, b) => {
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
            return Promise.try(() => {
                const events = Events.make(),
                    inputControl = makeInputControl(events, bus),
                    content = div({ class: 'input-group', style: { width: '100%' } }, inputControl);

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
                case 'ref':
                    return objectInfo.ref;
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
                .then((data) => {
                    // compare to availableData.
                    if (!utils.isEqual(data, model.availableValues)) {
                        model.availableValues = data;
                        const matching = model.availableValues.filter((value) => {
                            if (value.name === getObjectRef(value)) {
                                return true;
                            }
                            return false;
                        });

                        // disable for now -- race between this widget and the data panel
                        // the data panel is slower, so this widget thinks there are
                        // no availale objects, so it empties the model...
                        //if (matching.length === 0) {
                        //    model.value = null;
                        // }

                        render()
                            .then(() => {
                                autoValidate();
                            });
                    }
                });

        }

        // LIFECYCLE API
        function start() {
            return Promise.try(() => {
                bus.on('run', (message) => {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    dom = Dom.make({ node: container });

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
                            bus.on('reset-to-defaults', (message) => {
                                resetModelValue();
                            });
                            bus.on('update', (message) => {
                                setModelValue(message.value);
                            });
                            //bus.on('workspace-changed', function (message) {
                            //    doWorkspaceChanged();
                            //});
                            runtime.bus().on('workspace-changed', (message) => {
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
        make: function(config) {
            return factory(config);
        }
    };
});
