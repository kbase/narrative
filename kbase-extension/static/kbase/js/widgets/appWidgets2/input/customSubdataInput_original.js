/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'bluebird',
    'kb_common/html',
    '../validation',
    'common/events',
    'common/runtime',
    'common/ui',
    'common/props',
    'base/js/namespace',
    './subdataMethods/manager',
    'bootstrap',
    'css!font-awesome'
], function(
    $,
    Promise,
    html,
    Validation,
    Events,
    Runtime,
    UI,
    Props,
    Jupyter,
    SubdataMethodsManager
) {
    'use strict';

    /*
     * spec
     *   textsubdata_options
     *     allow_custom: 0/1
     *     multiselection: 0/1
     *     placholder: text
     *     show_src_obj: 0/1
     *     subdata_selection:
     *       parameter_id: string
     *       path_to_subdata: array<string>
     *       selection_id: string
     *       subdata_included: array<string>
     *
     */

    // Constants
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        input = t('input'),
        option = t('option'),
        button = t('button');

    function factory(config) {
        var options = {},
            // TODO: 
            appSpec = config.appSpec,
            spec = config.parameterSpec,
            parent,
            container,
            workspaceId = config.workspaceId,
            bus = config.bus,
            model,
            subdataMethodsManager,
            options = {
                objectSelectionPageSize: 20
            },
            runtime = Runtime.make(),
            ui;

        // Validate configuration.
        if (!workspaceId) {
            throw new Error('Workspace id required for the object widget');
        }

        options.enabled = true;

        subdataMethodsManager = SubdataMethodsManager.make();

        function buildOptions() {
            var availableValues = model.getItem('values.available.all'),
                value = model.getItem('value') || [],
                selectOptions = [option({ value: '' }, '')];
            if (!availableValues) {
                return selectOptions;
            }
            return selectOptions.concat(availableValues.map(function(availableValue) {
                var selected = false,
                    optionLabel = availableValue.id,
                    optionValue = availableValue.id;
                // TODO: pull the value out of the object
                if (value.indexOf(availableValue.id) >= 0) {
                    selected = true;
                }
                return option({
                    value: optionValue,
                    selected: selected
                }, optionLabel);
            }));
        }

        function buildCount() {
            var availableValues = model.getItem('values.available.all') || [],
                value = model.getItem('value') || [];

            return String(value.length) + ' / ' + String(availableValues.length) + ' items';
        }

        function filterItems(items, filter) {
            if (!filter) {
                return items;
            }
            var re = new RegExp(filter, 'i');
            return items.filter(function(item) {
                if (item.text && item.text.match(re)) {
                    return true;
                }
                return false;
            });
        }

        function doFilterItems() {
            var items = model.getItem('values.available.all', []),
                filteredItems = filterItems(items, model.getItem('filter'));


            // for now we just reset the from/to range to the beginning.
            model.setItem('values.available.filtered', filteredItems);

            doFirstPage();
        }

        function didChange() {
            validate()
                .then(function(result) {
                    // NOTE that as part of this control trying to be both single and 
                    // multiple, we use the value for the model - this is always an array -
                    // and the parsed value to sent off in the changed message, because
                    // that must match the "type" in the param spec
                    if (result.isValid) {
                        model.setItem('value', result.value);
                        updateInputControl('value');
                        bus.emit('changed', {
                            newValue: result.parsedValue
                        });
                    } else if (result.diagnosis === 'required-missing') {
                        model.setItem('value', result.value);
                        updateInputControl('value');
                        bus.emit('changed', {
                            newValue: result.parsedValue
                        });
                    }
                    bus.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        function doAddItem(itemId) {
            var selectedItems = model.getItem('value') || [];
            selectedItems.push(itemId);
            model.setItem('value', selectedItems);
            didChange();
        }

        function doRemoveSelectedItem(indexOfitemToRemove) {
            var selectedItems = model.getItem('value') || [],
                prevAllowSelection = spec.allow_multiple || selectedItems.length === 0;
            selectedItems.splice(indexOfitemToRemove, 1);

            var newAllowSelection = spec.spec.allow_multiple || selectedItems.length === 0;
            if (newAllowSelection && !prevAllowSelection) {
                // update text areas to have md-col-7 (from md-col-10)
                $(ui.getElement('input-container')).find('.row > .col-md-10').switchClass('col-md-10', 'col-md-7');
                $(ui.getElement('input-container')).find('.col-md-3.hidden').removeClass('hidden');

                // update button areas to remove hidden class
            }
            model.setItem('value', selectedItems);
            didChange();
        }

        function doRemoveSelectedAvailableItem(idToRemove) {
            var selectedItems = model.getItem('value', []);

            model.setItem('value', selectedItems.filter(function(id) {
                if (idToRemove === id) {
                    return false;
                }
                return true;
            }));
            didChange();
        }

        function renderAvailableItems() {
            var selected = model.getItem('value', []),
                allowSelection = (spec.spec.allow_multiple || selected.length === 0),
                items = model.getItem('values.available.filtered', []),
                from = model.getItem('showFrom'),
                to = model.getItem('showTo'),
                itemsToShow = items.slice(from, to),
                events = Events.make({ node: container }),
                content;

            if (itemsToShow.length === 0) {
                content = div({ style: { textAlign: 'center' } }, 'no available values');
            } else {
                content = itemsToShow.map(function(item, index) {
                        var isSelected = selected.some(function(id) {
                                return (item.id === id);
                            }),
                            disabled = isSelected;

                        return div({ class: 'row', style: { border: '1px #CCC solid' } }, [
                            div({
                                class: 'col-md-2',
                                style: {
                                    verticalAlign: 'middle',
                                    borderRadius: '3px',
                                    padding: '2px',
                                    backgroundColor: '#EEE',
                                    color: '#444',
                                    textAlign: 'right',
                                    paddingRight: '6px',
                                    fontFamily: 'monospace'
                                }
                            }, String(from + index + 1)),
                            div({
                                class: 'col-md-8',
                                style: {
                                    padding: '2px'
                                }
                            }, item.text),
                            div({
                                class: 'col-md-2',
                                style: {
                                    padding: '2px',
                                    textAlign: 'right',
                                    verticalAlign: 'top'
                                }
                            }, [
                                (function() {
                                    if (disabled) {
                                        return span({
                                            class: 'kb-btn-icon',
                                            type: 'button',
                                            dataToggle: 'tooltip',
                                            title: 'Remove from selected',
                                            id: events.addEvent({
                                                type: 'click',
                                                handler: function() {
                                                    doRemoveSelectedAvailableItem(item.id);
                                                }
                                            })
                                        }, [
                                            span({
                                                class: 'fa fa-minus-circle',
                                                style: {
                                                    color: 'red',
                                                    fontSize: '200%'
                                                }
                                            })
                                        ]);
                                    }
                                    if (allowSelection) {
                                        return span({
                                            class: 'kb-btn-icon',
                                            type: 'button',
                                            dataToggle: 'tooltip',
                                            title: 'Add to selected',
                                            dataItemId: item.id,
                                            id: events.addEvent({
                                                type: 'click',
                                                handler: function() {
                                                    doAddItem(item.id);
                                                }
                                            })
                                        }, [span({
                                            class: 'fa fa-plus-circle',
                                            style: {
                                                color: 'green',
                                                fontSize: '200%'
                                            }
                                        })]);
                                    }
                                    return span({
                                        class: 'kb-btn-icon',
                                        type: 'button',
                                        dataToggle: 'tooltip',
                                        title: 'Can\'t add - remove one first',
                                        dataItemId: item.id
                                    }, span({ class: 'fa fa-ban', style: { color: 'silver', fontSize: '200%' } }));
                                }())

                            ])
                        ]);
                    })
                    .join('\n');
            }

            ui.setContent('available-items', content);
            events.attachEvents();
            ui.enableTooltips('available-items');
        }

        function renderSelectedItems() {
            var selectedItems = model.getItem('value') || [],
                valuesMap = model.getItem('values.available.map', {}),
                events = Events.make({ node: container }),
                content;

            if (selectedItems.length === 0) {
                content = div({ style: { textAlign: 'center' } }, 'no selected values');
            } else {
                content = selectedItems.map(function(itemId, index) {
                    var item = valuesMap[itemId];
                    if (item === undefined || item === null) {
                        item = {
                            text: itemId
                        };
                    }

                    return div({ class: 'row', style: { border: '1px #CCC solid', borderCollapse: 'collapse', boxSizing: 'border-box' } }, [
                        div({
                            class: 'col-md-2',
                            style: {
                                xdisplay: 'inline-block',
                                xwidth: '20%',
                                verticalAlign: 'middle',
                                borderRadius: '3px',
                                padding: '2px',
                                backgroundColor: '#EEE',
                                color: '#444',
                                textAlign: 'right',
                                paddingRight: '6px',
                                fontFamily: 'monospace'
                            }
                        }, String(index + 1)),
                        div({
                            class: 'col-md-8',
                            style: {
                                xdisplay: 'inline-block',
                                xwidth: '90%',
                                padding: '2px'
                            }
                        }, item.text),
                        div({
                            class: 'col-md-2',
                            style: {
                                xdisplay: 'inline-block',
                                xwidth: '10%',
                                //minWidth: '6em',
                                //maxWidth: '6em',
                                padding: '2px',
                                textAlign: 'right',
                                verticalAlign: 'top'
                            }
                        }, [
                            span({
                                class: 'kb-btn-icon',
                                type: 'button',
                                dataToggle: 'tooltip',
                                title: 'Remove from selected',
                                id: events.addEvent({
                                    type: 'click',
                                    handler: function() {
                                        doRemoveSelectedItem(index);
                                    }
                                })
                            }, span({ class: 'fa fa-minus-circle', style: { color: 'red', fontSize: '200%' } }))
                        ])
                    ]);
                }).join('\n');
            }
            ui.setContent('selected-items', content);
            events.attachEvents();
            ui.enableTooltips('selected-items');
        }

        function renderSearchBox() {
            var items = model.getItem('values.available.all', []),
                events = Events.make({ node: container }),
                content;

            content = input({
                class: 'form-contol',
                style: { xwidth: '100%' },
                placeholder: 'search',
                value: model.getItem('filter') || '',
                id: events.addEvents({
                    events: [{
                        type: 'keyup',
                        handler: function(e) {
                            doSearchKeyUp(e);
                        }
                    }]
                })
            });

            ui.setContent('search-box', content);
            events.attachEvents();
        }

        function renderStats() {
            var availableItems = model.getItem('values.available.all', []),
                filteredItems = model.getItem('values.available.filtered', []),
                content;

            if (availableItems.length === 0) {
                content = span({ style: { fontStyle: 'italic' } }, [
                    ' - no available items'
                ]);
            } else {
                content = span({ style: { fontStyle: 'italic' } }, [
                    ' - showing ',
                    span([
                        String(filteredItems.length),
                        ' of ',
                        String(availableItems.length)
                    ])
                ]);
            }

            ui.setContent('stats', content);
        }

        function renderToolbar() {
            var items = model.getItem('values.available.filtered', []),
                events = Events.make({ node: container }),
                content;

            if (items.length === 0) {
                content = '';
            } else {
                content = div([
                    button({
                        type: 'button',
                        class: 'btn btn-default',
                        style: { xwidth: '100%' },
                        id: events.addEvent({
                            type: 'click',
                            handler: function() {
                                doFirstPage();
                            }
                        })
                    }, ui.buildIcon({ name: 'step-forward', rotate: 270 })),
                    button({
                        class: 'btn btn-default',
                        type: 'button',
                        style: { xwidth: '50%' },
                        id: events.addEvent({
                            type: 'click',
                            handler: function() {
                                doPreviousPage();
                            }
                        })
                    }, ui.buildIcon({ name: 'caret-up' })),
                    button({
                        class: 'btn btn-default',
                        type: 'button',
                        style: { xwidth: '100%' },
                        id: events.addEvent({
                            type: 'click',
                            handler: function() {
                                doNextPage();
                            }
                        })
                    }, ui.buildIcon({ name: 'caret-down' })),
                    button({
                        type: 'button',
                        class: 'btn btn-default',
                        style: { xwidth: '100%' },
                        id: events.addEvent({
                            type: 'click',
                            handler: function() {
                                doLastPage();
                            }
                        })
                    }, ui.buildIcon({ name: 'step-forward', rotate: 90 }))
                ]);
            }

            ui.setContent('toolbar', content);
            events.attachEvents();
        }

        function setPageStart(newFrom) {
            var from = model.getItem('showFrom'),
                to = model.getItem('to'),
                newTo,
                total = model.getItem('values.available.filtered', []).length,
                pageSize = 5;

            if (newFrom <= 0) {
                newFrom = 0;
            } else if (newFrom >= total) {
                newFrom = total - pageSize;
                if (newFrom < 0) {
                    newFrom = 0;
                }
            }

            if (newFrom !== from) {
                model.setItem('showFrom', newFrom);
            }

            newTo = newFrom + pageSize;
            if (newTo >= total) {
                newTo = total;
            }
            if (newTo !== to) {
                model.setItem('showTo', newTo);
            }
        }

        function movePageStart(diff) {
            setPageStart(model.getItem('showFrom') + diff);
        }

        function doPreviousPage() {
            movePageStart(-5);
        }

        function doNextPage() {
            movePageStart(5);
        }

        function doFirstPage() {
            setPageStart(0);
        }

        function doLastPage() {
            setPageStart(model.getItem('values.available.filtered').length);
        }

        function doSearchKeyUp(e) {
            if (e.target.value.length > 2) {
                model.setItem('filter', e.target.value);
                doFilterItems();
            } else {
                if (model.getItem('filter')) {
                    model.setItem('filter', null);
                    doFilterItems();
                }
            }
        }

        function makeInputControl(events, bus) {
            // There is an input control, and a dropdown,
            // TODO select2 after we get a handle on this...
            var selectOptions,
                size = 10,
                multiple = false,
                availableValues = model.getItem('values.available.all'),
                value = model.getItem('value') || [];

            if (spec.spec.allow_multiple) {
                size = 10;
                multiple = true;
            }

            selectOptions = buildOptions();

            return div([
                ui.buildCollapsiblePanel({
                    title: span(['Available Items', span({ dataElement: 'stats' })]),
                    classes: ['kb-panel-light'],
                    body: div({ dataElement: 'available-items-area', style: { marginTop: '10px' } }, [
                        div({ class: 'row' }, [
                            div({
                                class: 'col-md-6'
                            }, [
                                span({ dataElement: 'search-box' })
                            ]),
                            div({
                                class: 'col-md-6',
                                style: { textAlign: 'right' },
                                dataElement: 'toolbar'
                            })
                        ]),
                        div({ class: 'row', style: { marginTop: '4px' } }, [
                            div({ class: 'col-md-12' },
                                div({
                                    style: {
                                        border: '1px silver solid'
                                    },
                                    dataElement: 'available-items'
                                }))
                        ])
                    ])
                }),
                ui.buildPanel({
                    title: 'Selected Items',
                    classes: ['kb-panel-light'],
                    body: div({
                        style: {
                            border: '1px silver solid'
                        },
                        dataElement: 'selected-items'
                    })
                })

            ]);
        }

        /*
         * Given an existing input control, and new model state, update the
         * control to suite the new data.
         * Cases:
         *
         * - change in source data - fetch new data, populate available values,
         *   reset selected values, remove existing options, add new options.
         *
         * - change in selected items - remove all selections, add new selections
         *
         */
        function updateInputControl(changedProperty) {
            switch (changedProperty) {
                case 'value':
                    // just change the selections.
                    var count = buildCount();
                    ui.setContent('input-control.count', count);

                    break;
                case 'availableValues':
                    // rebuild the options
                    // re-apply the selections from the value
                    var options = buildOptions(),
                        count = buildCount();
                    ui.setContent('input-control.input', options);
                    ui.setContent('input-control.count', count);

                    break;
                case 'referenceObjectName':
                    // refetch the available values
                    // set available values
                    // update input control for available values
                    // set value to null


            }
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
            return model.getItem('value');
        }

        function resetModelValue() {
            // model.reset();
            if (spec.spec.default_values && spec.spec.default_values.length > 0) {
                // nb i'm assuming here that this set of strings is actually comma
                // separated string on the other side.
                var defaultValues = spec.spec.default_values.filter(function(value) {
                    return (value && value.length > 0);
                });
                model.setItem('value', defaultValues);
            } else {
                model.setItem('value', []);
            }
        }

        function validate() {
            return Promise.try(function() {
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

                    return Validation.validateStringSet(rawValue, validationOptions);
                })
                .then(function(validationResult) {
                    if (!spec.multipleItems()) {
                        // Convert to the singule-string result if this is not a 
                        // multiple item control.
                        // TODO: a more graceful way of doing this!
                        // IDEAS? This probably should be a separate control.
                        // the single input is much different -- it does not need to
                        // support a set of values, just select a single one.
                        if (validationResult.parsedValue.length > 0) {
                            validationResult.parsedValue = validationResult.parsedValue[0];
                        } else {
                            validationResult.parsedeValue = '';
                        }
                    }
                    return validationResult;
                });
        }

        // unsafe, but pretty.
        function getProp(obj, props) {
            props.forEach(function(prop) {
                obj = obj[prop];
            });
            return obj;
        }

        // safe, but ugly.


        var subdataInfo = subdataMethodsManager.getSubdataInfo(appSpec, spec.spec);

        function fetchData() {
            var referenceObjectName = model.getItem('referenceObjectName'),
                referenceObjectRef = workspaceId + '/' + referenceObjectName,
                params = model.getItem('required-params');

            if (!referenceObjectName) {
                return;
            }

            return subdataMethodsManager.customFetchData({
                referenceObjectRef: referenceObjectRef,
                params: params,
                getRef: subdataInfo.getRef,
                included: subdataInfo.included,
                extractItems: subdataInfo.extractItems
            });
        }

        function syncAvailableValues() {
            return Promise.try(function() {
                    return fetchData();
                })
                .then(function(data) {
                    if (!data) {
                        data = [];
                    }
                    // 
                    // The data represents the total available subdata, with all
                    // necessary fields for display. We build from that three
                    // additional structures
                    // - a map of id to object
                    // - a set of available ids
                    // - a set of selected ids
                    // - a set of filtered ids
                    model.setItem('values.available.all', data);

                    // TODO: generate all of this in the fetchData -- it will be a bit faster.
                    var map = {};
                    data.forEach(function(datum) {
                        map[datum.id] = datum;
                    });

                    model.setItem('values.available.map', map);

                    doFilterItems();
                });
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

        /*
         * Creates the markup
         * Places it into the ui node
         * Hooks up event listeners
         */
        function render() {
            return Promise.try(function() {
                    // check to see if we have to render inputControl.
                    var events = Events.make({ node: container }),
                        inputControl = makeInputControl(events, bus),
                        content = div({
                            class: 'input-group',
                            style: {
                                width: '100%'
                            }
                        }, inputControl);

                    ui.setContent('input-container', content);
                    renderSearchBox();
                    renderStats();
                    renderToolbar();
                    renderAvailableItems();
                    renderSelectedItems();

                    events.attachEvents();
                })
                .then(function() {
                    return autoValidate();
                })
                .catch(function(err) {
                    console.error('ERROR in render', err);
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
                div({
                    dataElement: 'input-container'
                })
            ]);
            return {
                content: content,
                events: events
            };
        }

        function updateParam(paramId, value) {
            var newValue;
            if (value === '') {
                newValue = null;
            } else {
                newValue = value;
            }

            if (newValue === model.getItem(['required-params', paramId])) {
                return;
            }

            model.setItem('value', []);
            model.setItem(['required-params', paramId], newValue);

            // If any of the required parameters are missing, we need to reset the
            // primary value.
            if (subdataInfo.params.dependencies.some(function(paramId) {
                    return (model.getItem(['required-params', paramId], null) === null);
                })) {
                resetModelValue();
            }

            // If we have a change in the primary reference object, we need to 
            // resync the values derived from it (available values).            
            if (paramId === subdataInfo.params.referenceObject) {
                model.setItem('referenceObjectName', newValue);
                return syncAvailableValues()
            }
        }

        function registerEvents() {
            /*
             * Issued when thre is a need to have all params reset to their
             * default value.
             */
            bus.on('reset-to-defaults', function(message) {
                resetModelValue();
                // model.reset();
                // TODO: this should really be set when the linked field is reset...
                model.setItem('availableValues', []);
                model.setItem('referenceObjectName', null);
                doFilterItems();

                renderSearchBox();
                renderStats();
                renderToolbar();
                renderAvailableItems();
                renderSelectedItems();

            });

            /*
             * Issued when there is an update for this param.
             */
            bus.on('update', function(message) {
                // a little hack since this handles both single and multi
                // and single will default to an empty string or null
                // for defaulting.
                var newValue = message.value;
                if (!newValue || ((typeof newValue === 'string') && newValue.length === 0)) {
                    newValue = [];
                }
                model.setItem('value', newValue);
                updateInputControl('value');
            });

            if (subdataInfo.params.dependencies) {
                subdataInfo.params.dependencies.forEach(function(paramId) {
                    bus.listen({
                        key: {
                            type: 'parameter-changed',
                            parameter: paramId
                        },
                        handle: function(message) {
                            updateParam(paramId, message.newValue);
                        }
                    });

                    bus.listen({
                        key: {
                            type: 'parameter-value',
                            parameter: paramId
                        },
                        handle: function(message) {
                            updateParam(paramId, message.newValue);
                        }
                    });
                    bus.request({
                            parameterName: paramId
                        }, {
                            key: {
                                type: 'get-parameter'
                            }
                        })
                        .then(function(message) {
                            updateParam(paramId, message.value);
                        })
                        .catch(function(err) {
                            console.log('ERROR getting parameter', err);
                        });
                });
            }


            bus.emit('sync');

            //bus.request({
            //    parameterName: spec.id()
            //}, {
            //    key: {
            //        type: 'get-parameter'
            //    }
            //})
            //    .then(function (message) {
            //        console.log('Now i got it again', message);
            //    });




        }

        // MODIFICATION EVENTS

        /*
         * More refinement of modifications.
         *
         * - initial run
         * - reference data updated
         *   - added "reset" method to props (model) to allow graceful zapping
         *     of the model state.
         * - item added to selected
         * - item removed from selected
         * - search term available
         * - search term removed
         * - filtered data updated
         *
         */


        // LIFECYCLE API

        function start() {
            return Promise.try(function() {
                bus.on('run', function(message) {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    ui = UI.make({
                        node: container
                    });

                    var events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;

                    render();

                    events.attachEvents(container);

                    registerEvents();

                    bus.emit('sync-params', {
                        parameters: subdataInfo.params.dependencies
                    });
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



        // MAIN

        model = Props.make({
            data: {
                referenceObjectName: null,
                availableValues: [],
                selectedItems: [],
                value: null,
                showFrom: 0,
                showTo: 5
            },
            onUpdate: function(props) {
                renderStats();
                renderToolbar();
                renderAvailableItems();
                renderSelectedItems();
            }
        });

        return {
            start: start,
            stop: stop
        };
    }

    return {
        id: 'custom-subdata',
        version: '0.0.1',
        make: function(config) {
            return factory(config);
        }
    };
});