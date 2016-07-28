/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'bluebird',
    'handlebars',
    'kb_common/html',
    'kb_service/client/workspace',
    'common/validation',
    'common/events',
    'common/runtime',
    'common/ui',
    'common/props',
    'base/js/namespace',
    'bootstrap',
    'css!font-awesome',
    'kbase-generic-client-api'
], function (
    $,
    Promise,
    Handlebars,
    html,
    Workspace,
    Validation,
    Events,
    Runtime,
    UI,
    Props,
    Jupyter
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
        div = t('div'), p = t('p'), span = t('span'),
        input = t('input'),
        option = t('option'), button = t('button');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            subdataOptions = spec.spec.textsubdata_options,
            parent,
            container,
            workspaceId = config.workspaceId,
            subdata = spec.textsubdata_options,
            bus = config.bus,
            model,
            //model = {
            //    referenceObjectName: null,
            //    availableValues: null,
            //    value: null
            //},
            options = {
                objectSelectionPageSize: 20
            },
        runtime = Runtime.make(),
            ui;

        // Validate configuration.
        if (!workspaceId) {
            throw new Error('Workspace id required for the object widget');
        }
        //if (!workspaceUrl) {
        //    throw new Error('Workspace url is required for the object widget');
        //}

        options.enabled = true;

        function buildOptions() {
            var availableValues = model.getItem('availableValues'),
                value = model.getItem('value') || [],
                selectOptions = [option({value: ''}, '')];
            if (!availableValues) {
                return selectOptions;
            }
            return selectOptions.concat(availableValues.map(function (availableValue) {
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
            var availableValues = model.getItem('availableValues') || [],
                value = model.getItem('value') || [];

            return String(value.length) + ' / ' + String(availableValues.length) + ' items';
        }

        function filterItems(items, filter) {
            if (!filter) {
                return items;
            }
            var re = new RegExp(filter);
            return items.filter(function (item) {
                if (item.label && item.label.match(re, 'i')) {
                    return true;
                }
                return false;
            });
        }

        function doFilterItems() {
            var items = model.getItem('availableValues', []),
                filteredItems = filterItems(items, model.getItem('filter'));


            // for now we just reset the from/to range to the beginning.
            model.setItem('filteredAvailableItems', filteredItems);

            doFirstPage();
        }

        function didChange() {
            validate()
                .then(function (result) {
                    if (result.isValid) {
                        model.setItem('value', result.value);
                        updateInputControl('value');
                        bus.emit('changed', {
                            newValue: result.value
                        });
                    } else if (result.diagnosis === 'required-missing') {
                        model.setItem('value', result.value);
                        updateInputControl('value');
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

        function doAddItem(itemId) {
            var selectedItems = model.getItem('selectedItems', []);
            selectedItems.push(itemId);
            model.setItem('selectedItems', selectedItems);
            didChange();
        }

        function doRemoveSelectedItem(indexOfitemToRemove) {
            var selectedItems = model.getItem('selectedItems', []),
                prevAllowSelection = spec.spec.textsubdata_options.multiselection || selectedItems.length === 0;
            selectedItems.splice(indexOfitemToRemove, 1);

            var newAllowSelection = spec.spec.textsubdata_options.multiselection || selectedItems.length === 0;
            if (newAllowSelection && !prevAllowSelection) {
                // update text areas to have md-col-7 (from md-col-10)
                $(ui.getElement('input-container')).find('.row > .col-md-10').switchClass('col-md-10', 'col-md-7');
                $(ui.getElement('input-container')).find('.col-md-3.hidden').removeClass('hidden');

                // update button areas to remove hidden class
            }
            model.setItem('selectedItems', selectedItems);
            didChange();
        }

        function doRemoveSelectedAvailableItem(idToRemove) {
            var selectedItems = model.getItem('selectedItems', []);

            model.setItem('selectedItems', selectedItems.filter(function (id) {
                if (idToRemove === id) {
                    return false;
                }
                return true;
            }));
            didChange();
        }

        function renderAvailableItems() {
            var selected = model.getItem('selectedItems', []),
                allowSelection = (spec.spec.textsubdata_options.multiselection || selected.length === 0),
                items = model.getItem('filteredAvailableItems', []),
                from = model.getItem('showFrom'),
                to = model.getItem('showTo'),
                itemsToShow = items.slice(from, to),
                events = Events.make({node: container}),
                content;

            if (itemsToShow.length === 0) {
                content = div({style: {textAlign: 'center'}}, 'no available values');
            } else {
                content = itemsToShow.map(function (item, index) {
                    var isSelected = selected.some(function (id) {
                        return (item.id === id);
                    }),
                        disabled = isSelected;
                    return div({class: 'row', style: {border: '1px #CCC solid'}}, [
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
                        }, item.label),
                        div({class: 'col-md-2',
                            style: {
                                padding: '2px',
                                textAlign: 'right',
                                verticalAlign: 'top'
                            }
                        }, [
                            (function () {
                                if (disabled) {
                                    return span({
                                        class: 'kb-btn-icon',
                                        type: 'button',
                                        dataToggle: 'tooltip',
                                        title: 'Remove from selected',
                                        id: events.addEvent({
                                            type: 'click',
                                            handler: function () {
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
                                            handler: function () {
                                                doAddItem(item.id);
                                            }
                                        })}, [span({
                                            class: 'fa fa-plus-circle',
                                            style: {
                                                color: 'green',
                                                fontSize: '200%'
                                            }
                                        })
                                    ]);
                                }
                                return span({
                                    class: 'kb-btn-icon',
                                    type: 'button',
                                    dataToggle: 'tooltip',
                                    title: 'Can\'t add - remove one first',
                                    dataItemId: item.id
                                }, span({class: 'fa fa-ban', style: {color: 'silver', fontSize: '200%'}}));
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
            var selectedItems = model.getItem('selectedItems', []),
                valuesMap = model.getItem('availableValuesMap', {}),
                events = Events.make({node: container}),
                content;

            if (selectedItems.length === 0) {
                content = div({style: {textAlign: 'center'}}, 'no selected values');
            } else {
                content = selectedItems.map(function (itemId, index) {
                    var item = valuesMap[itemId];
                    if (item === undefined || item === null) {
                        item = {
                            label: itemId
                        };
                    }

                    return div({class: 'row', style: {border: '1px #CCC solid', borderCollapse: 'collapse', boxSizing: 'border-box'}}, [
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
                        }, item.label),
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
                                    handler: function () {
                                        doRemoveSelectedItem(index);
                                    }
                                })
                            }, span({class: 'fa fa-minus-circle', style: {color: 'red', fontSize: '200%'}}))
                        ])
                    ]);
                }).join('\n');
            }
            ui.setContent('selected-items', content);
            events.attachEvents();
            ui.enableTooltips('selected-items');
        }

        function renderSearchBox() {
            var items = model.getItem('availableValues', []),
                events = Events.make({node: container}),
                content;

            //if (items.length === 0) {
            //    content = '';
            //} else {
            content = input({
                class: 'form-contol',
                style: {xwidth: '100%'},
                placeholder: 'search',
                value: model.getItem('filter') || '',
                id: events.addEvents({events: [
                        {
                            type: 'keyup',
                            handler: function (e) {
                                doSearchKeyUp(e);
                            }
                        },
                        {
                            type: 'focus',
                            handler: function () {
                                Jupyter.narrative.disableKeyboardManager();
                            }
                        },
                        {
                            type: 'blur',
                            handler: function () {
                                console.log('SingleSubData Search BLUR');
                                // Jupyter.narrative.enableKeyboardManager();
                            }
                        },
                        {
                            type: 'click',
                            handler: function () {
                                Jupyter.narrative.disableKeyboardManager();
                            }
                        }
                    ]})
            });
            //}

            ui.setContent('search-box', content);
            events.attachEvents();
        }

        function renderStats() {
            var availableItems = model.getItem('availableValues', []),
                filteredItems = model.getItem('filteredAvailableItems', []),
                content;

            if (availableItems.length === 0) {
                content = span({style: {fontStyle: 'italic'}}, [
                    ' - no available items'
                ]);
            } else {
                content = span({style: {fontStyle: 'italic'}}, [
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
            var items = model.getItem('filteredAvailableItems', []),
                events = Events.make({node: container}),
                content;

            if (items.length === 0) {
                content = '';
            } else {
                content = div([
                    button({
                        type: 'button',
                        class: 'btn btn-default',
                        style: {xwidth: '100%'},
                        id: events.addEvent({
                            type: 'click',
                            handler: function () {
                                doFirstPage();
                            }
                        })
                    }, ui.buildIcon({name: 'step-forward', rotate: 270})),
                    button({
                        class: 'btn btn-default',
                        type: 'button',
                        style: {xwidth: '50%'},
                        id: events.addEvent({
                            type: 'click',
                            handler: function () {
                                doPreviousPage();
                            }
                        })
                    }, ui.buildIcon({name: 'caret-up'})),
                    button({
                        class: 'btn btn-default',
                        type: 'button',
                        style: {xwidth: '100%'},
                        id: events.addEvent({
                            type: 'click',
                            handler: function () {
                                doNextPage();
                            }
                        })
                    }, ui.buildIcon({name: 'caret-down'})),
                    button({
                        type: 'button',
                        class: 'btn btn-default',
                        style: {xwidth: '100%'},
                        id: events.addEvent({
                            type: 'click',
                            handler: function () {
                                doLastPage();
                            }
                        })
                    }, ui.buildIcon({name: 'step-forward', rotate: 90}))
                ]);
            }

            ui.setContent('toolbar', content);
            events.attachEvents();
        }

        function setPageStart(newFrom) {
            var from = model.getItem('showFrom'),
                to = model.getItem('to'),
                newTo,
                total = model.getItem('filteredAvailableItems', []).length,
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
            setPageStart(model.getItem('filteredAvailableItems').length);
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
                size = 1,
                multiple = false,
                availableValues = model.getItem('availableValues'),
                value = model.getItem('value') || [];

            if (subdataOptions.multiselection) {
                size = 10;
                multiple = true;
            }
            if (!availableValues) {
                return p({
                    class: 'form-control-static',
                    style: {
                        fontStyle: 'italic',
                        whiteSpace: 'normal',
                        padding: '3px',
                        border: '1px silver solid'
                    }
                }, 'Items will be available after selecting a value for ' + subdataOptions.subdata_selection.parameter_id);
            }

            selectOptions = buildOptions();

            return div([
//                div({class: 'row'}, [
//                    div({class: 'col-md-6', style: {paddingBottom: '6px'}}, [
//                        div({
//                            style: {
//                                fontWeight: 'bold',
//                                textDecoration: 'underline',
//                                fontStyle: 'italic',
//                                textAlign: 'center'
//                            }
//                        }, 'Available')
//                    ]),
//                    div({class: 'col-md-6'}, [
//                        div({
//                            style: {
//                                fontWeight: 'bold',
//                                textDecoration: 'underline',
//                                fontStyle: 'italic',
//                                textAlign: 'center'
//                            }
//                        }, 'Selected')
//                    ])
//                ]),
                ui.buildCollapsiblePanel({
                    title: span(['Available Items', span({dataElement: 'stats'})]),
                    classes: ['kb-panel-light'],
                    body: div({dataElement: 'available-items-area', style: {marginTop: '10px'}}, [
                        div({class: 'row'}, [
                            div({
                                class: 'col-md-6'
                            }, [
                                span({dataElement: 'search-box'})
                            ]),
//                            div({
//                                class: 'col-md-3'
//                            }, [
//                                span({
//                                    dataElement: 'stats',
//                                    style: {
//                                        fontStyle: 'italic'
//                                    }
//                                })
//                            ]),
                            div({
                                class: 'col-md-6',
                                style: {textAlign: 'right'},
                                dataElement: 'toolbar'
                            })
                        ]),
                        div({class: 'row', style: {marginTop: '4px'}}, [
                            div({class: 'col-md-12'},
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

//                div({class: 'row'}, [
//                    div({class: 'col-md-6'},
//                        div({
//                            style: {
//                                border: '1px silver solid',
//                                xheight: '100px'
//                            },
//                            dataElement: 'available-items'
//                        })),
//                    div({class: 'col-md-6'},
//                        div({
//                            style: {
//                                border: '1px silver solid',
//                                xheight: '100px'
//                            },
//                            dataElement: 'selected-items'
//                        }))
//                ])
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
//            var control = ui.getElement('input-container.input');
//            if (!control) {
//                return null;
//            }
//            var input = control.selectedOptions,
//                i, values = [];
//            for (i = 0; i < input.length; i += 1) {
//                values.push(input.item(i).value);
//            }
//            // cute ... allows selecting multiple values but does not expect a sequence...
//            return values;
            return model.getItem('selectedItems');
        }

        function resetModelValue() {
            model.reset();
            if (spec.spec.default_values && spec.spec.default_values.length > 0) {
                // nb i'm assuming here that this set of strings is actually comma
                // separated string on the other side.
                model.setItem('value', spec.spec.default_values[0].split(','));
            } else {
                model.setItem('value', null);
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

                return Validation.validateStringSet(rawValue, validationOptions);
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

        // unsafe, but pretty.
        function getProp(obj, props) {
            props.forEach(function (prop) {
                obj = obj[prop];
            });
            return obj;
        }

        // safe, but ugly.

        function makeLabel(item, showSourceObjectName) {
            return div({style: {wordWrap: 'break-word'}}, [
                div({style: {fontWeight: 'bold'}}, item.id),
                item.desc,
                (function () {
                    if (showSourceObjectName && item.objectName) {
                        return div({style: {padding: '0px', fontStyle: 'italic'}}, item.objectName);
                    }
                }())
            ]);
        }

        function fetchData() {
            var referenceObjectName = model.getItem('referenceObjectName'),
                referenceObjectRef = spec.spec.textsubdata_options.subdata_selection.constant_ref;

            if (!referenceObjectRef) {
                if (!referenceObjectName) {
                    return [];
                }
                referenceObjectRef = workspaceId + '/' + referenceObjectName;
            }
            var options = spec.spec.textsubdata_options;
            var subObjectIdentity = {
                ref: referenceObjectRef,
                included: options.subdata_selection.subdata_included
            };
            var ret;
            if (options.subdata_selection.service_function) {
                var swUrl = runtime.config('services.service_wizard.url');
                var genericClient = new GenericClient(swUrl, {
                    token: runtime.authToken()
                });
                ret = genericClient.sync_call(options.subdata_selection.service_function,
                    [[subObjectIdentity]], null, null,
                    options.subdata_selection.service_version);
            } else {
                var workspace = new Workspace(runtime.config('services.workspace.url'), {
                    token: runtime.authToken()
                });
                ret = workspace.get_object_subset([subObjectIdentity]);
            }
            return ret
                .then(function (results) {
                    // alert('done!');
                    // We have only one ref, so should just be one result.
                    var values = [],
                        selectionId = options.subdata_selection.selection_id,
                        descriptionFields = options.subdata_selection.selection_description || [],
                        descriptionTemplateText = options.subdata_selection.description_template,
                        descriptionTemplate, label;

                    if (!descriptionTemplateText) {
                        descriptionTemplateText = descriptionFields.map(function (field) {
                            return '{{' + field + '}}';
                        }).join(' - ');
                    }

                    descriptionTemplate = Handlebars.compile(descriptionTemplateText);
                    results.forEach(function (result) {
                        if (!result) {
                            return;
                        }

                        // Check if some generic wrapping is used which wasn't unwrapped by GenericClient
                        if (result.constructor === Array)
                            result = result[0];

                        var subdata = Props.getDataItem(result.data, options.subdata_selection.path_to_subdata);

                        if (!subdata) {
                            return;
                        }

                        // if(subdata instanceof Array) {
                        //     for(var k=0; k<subdata.length; k++) {
                        //         var dname = datainfo[1];
                        //         if(includeWsId) { dname = datainfo[6] + '/' + datainfo[1]; }
                        //         var id = subdata[k]; // default id is just the value
                        //         // if the selection_id is set, and the object is an object of somekind, then use that value
                        //         if(selection_id && typeof id === 'object') {
                        //             id = subdata[k][selection_id];
                        //         }
                        //         var autofill = {
                        //             id: id,
                        //             desc: hb_template(subdata[k]),
                        //             dref: datainfo[6] + '/' + datainfo[0] + '/' + datainfo[4],
                        //             dname: dname
                        //         };
                        //         self.autofillData.push(autofill);
                        //     }

                        if (subdata instanceof Array) {
                            // For arrays we pluck off the "selectionId" property from
                            // each item.
                            subdata.forEach(function (datum) {
                                var id = datum;
                                if (selectionId && typeof id === 'object') {
                                    id = datum[selectionId];
                                }
                                values.push({
                                    id: id,
                                    desc: descriptionTemplate(datum), // TODO
                                    objectRef: [result.info[6], result.info[0], result.info[4]].join('/'),
                                    objectName: result.info[1]
                                });
                            });
                        } else {
                            Object.keys(subdata).forEach(function (key) {
                                var datum = subdata[key],
                                    id;

                                if (selectionId) {
                                    switch (typeof datum) {
                                        case 'object':
                                            id = datum[selectionId];
                                            break;
                                        case 'string':
                                        case 'number':
                                            if (selectionId === 'value') {
                                                id = datum;
                                            } else {
                                                id = key;
                                            }
                                            break;
                                        default:
                                            id = key;
                                    }
                                } else {
                                    id = key;
                                }

                                values.push({
                                    id: id,
                                    desc: descriptionTemplate(datum), // todo
                                    // desc: id,
                                    objectRef: [result.info[6], result.info[0], result.info[4]].join('/'),
                                    objectName: result.info[1]
                                });
                            });
                        }
                    });
                    return values.map(function (item) {
                        item.label = makeLabel(item, options.show_src_obj);
                        return item;
                    });
                })
                .then(function (data) {
                    // sort by id now.
                    data.sort(function (a, b) {
                        if (a.id > b.id) {
                            return 1;
                        }
                        if (a.id < b.id) {
                            return -1;
                        }
                        return 0;
                    });
                    return data;
                });
        }

        function syncAvailableValues() {
            return Promise.try(function () {
                return fetchData();
            })
                .then(function (data) {
                    // The data represents the total available subdata, with all
                    // necessary fields for display. We build from that three
                    // additional structures
                    // - a map of id to object
                    // - a set of available ids
                    // - a set of selected ids
                    // - a set of filtered ids
                    model.setItem('availableValues', data);

                    // TODO: generate all of this in the fetchData -- it will be a bit faster.
                    var map = {};
                    data.forEach(function (datum) {
                        map[datum.id] = datum;
                    });

                    //var availableIds = data.map(function (datum) {
                    //    return datum.id;
                    //});

                    model.setItem('availableValuesMap', map);

                    doFilterItems();
                });
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


        /*
         * Creates the markup
         * Places it into the ui node
         * Hooks up event listeners
         */
        function render() {
            return Promise.try(function () {
                // check to see if we have to render inputControl.
                var events = Events.make({node: container}),
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
                .then(function () {
                    return autoValidate();
                })
                .catch(function (err) {
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

        function registerEvents() {
            /*
             * Issued when thre is a need to have all params reset to their
             * default value.
             */
            bus.on('reset-to-defaults', function (message) {
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

                // updateInputControl('availableValues');
                // updateInputControl('value');
            });

            /*
             * Issued when there is an update for this param.
             */
            bus.on('update', function (message) {
                model.setItem('value', message.value);
                updateInputControl('value');
            });
            // NEW


            //                bus.receive({
            //                    test: function (message) {
            //                        return (message.type === 'parameter-changed');
            //                    },
            //                    handle: function(message) {
            //                        console.log('parameter changed', message);
            //                   bus }
            //                });



            //bus.on('parameter-changed', function (message) {
            //    if (message.parameter === subdataOptions.subdata_selection.parameter_id) {

            /*
             * Called when for an update to any param. This is necessary for
             * any parameter which has a dependency upon any other.
             *
             */
            // bus.on('parameter')


            bus.listen({
                key: {
                    type: 'parameter-changed',
                    parameter: subdataOptions.subdata_selection.parameter_id
                },
                handle: function (message) {
                    var newValue = message.newValue;
                    if (message.newValue === '') {
                        newValue = null;
                    }
                    // reset the entire model.
                    model.reset();
                    model.setItem('referenceObjectName', newValue);
                    syncAvailableValues()
                        .then(function () {
                            updateInputControl('availableValues');
                        })
                        .catch(function (err) {
                            console.error('ERROR syncing available values', err);
                        });
                }
            });

            bus.listen({
                key: {
                    type: 'parameter-value',
                    parameter: subdataOptions.subdata_selection.parameter_id
                },
                handle: function (message) {
                    var newValue = message.newValue;
                    if (message.newValue === '') {
                        newValue = null;
                    }
                    model.reset();
                    model.setItem('referenceObjectName', newValue);
                    syncAvailableValues()
                        .then(function () {
                            updateInputControl('availableValues');
                        })
                        .catch(function (err) {
                            console.error('ERROR syncing available values', err);
                        });
                }
            });

            // This control has a dependency relationship in that its
            // selection of available values is dependent upon a sub-property
            // of an object referenced by another parameter.
            // Rather than explicitly refer to that parameter, we have a
            // generic capability to receive updates for that value, after
            // which we re-fetch the values, and re-render the control.
//            bus.on('update-reference-object', function (message) {
//                model.setItem('referenceObjectName', value)
//                setReferenceValue(message.objectRef);
//            });
            bus.emit('sync');

            bus.request({
                parameterName: spec.id()
            }, {
                key: {
                    type: 'get-parameter'
                }
            })
                .then(function (message) {
                    console.log('Now i got it again', message);
                });




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
            return Promise.try(function () {
                bus.on('run', function (message) {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    ui = UI.make({
                        node: container
                    });

                    var events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
//
//                    bus.request({
//                        parameter: subdataOptions.subdata_selection.parameter_id
//                    }, {
//                        type: 'get-parameter'
//                    })
//                        .then(function (message) {
//                            model.setItem('referenceObjectName', message.value);
//                            render();
//                        })
//                        .catch(function (err) {
//                            console.error('ERROR getting parameter ' + subdataOptions.subdata_selection.parameter_id);
//                        });
//

                    render();


                    events.attachEvents(container);

                    registerEvents();

                    // Get initial data.
                    // Weird, but will make it look nicer.
                    Promise.all([
                        bus.request({
                            parameterName: spec.id()
                        },
                            {
                                key: {
                                    type: 'get-parameter'
                                }
                            }),
                        bus.request({
                            parameterName: subdataOptions.subdata_selection.parameter_id
                        },
                            {
                                key: {
                                    type: 'get-parameter'
                                }
                            })
                    ])
                        .spread(function (paramValue, referencedParamValue) {
                            // hmm, the default value of a subdata is null, but that does
                            // not play nice with the model props defaulting mechanism which
                            // works with absent or undefined (null being considered an actual value, which
                            // it is of course!)
                            if (paramValue.value === null) {
                                model.setItem('selectedItems', []);
                            } else {
                                var selectedItems = paramValue.value;
                                if (!(selectedItems instanceof Array)) {
                                    selectedItems = [selectedItems];
                                }
                                model.setItem('selectedItems', selectedItems);
                            }
                            updateInputControl('value');

                            if (referencedParamValue) {
                                model.setItem('referenceObjectName', referencedParamValue.value);
                            }
                            return syncAvailableValues()
                                .then(function () {
                                    updateInputControl('availableValues');
                                })
                                .catch(function (err) {
                                    console.error('ERROR syncing available values', err);
                                });

                        })
                        .catch(function (err) {
                            console.error('ERROR fetching initial data', err);
                        });
                });
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
            }
            ,
            onUpdate: function (props) {
                // cheap version
                //renderSearchBox();
                renderStats();
                renderToolbar();

                renderAvailableItems();
                renderSelectedItems();
                // renderNavbar();
                // render();
                // updateInputControl(props);
            }
        });

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