define([
    'jquery',
    'bluebird',
    'kb_common/html',
    '../validation',
    'common/events',
    'common/runtime',
    'common/ui',
    'common/props',
    'common/jupyter',
    'base/js/namespace',
    '../subdataMethods/manager',
    'bootstrap',
    'css!font-awesome',
], (
    $,
    Promise,
    html,
    Validation,
    Events,
    Runtime,
    UI,
    Props,
    Narrative,
    Jupyter,
    SubdataMethods
) => {
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
    const t = html.tag,
        div = t('div'),
        p = t('p'),
        span = t('span'),
        input = t('input'),
        option = t('option'),
        button = t('button');

    function factory(config) {
        let spec = config.parameterSpec,
            parent,
            container,
            runtime = Runtime.make(),
            workspaceId = runtime.getEnv('workspaceId'),
            // bus = config.bus,
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            paramsChannel = busConnection.channel(config.paramsChannelName),
            model,
            subdataMethods,
            isAvailableValuesInitialized = false,
            options = {
                objectSelectionPageSize: 20,
            },
            minimumFilterLength = 0,
            ui;

        // Validate configuration.
        if (!workspaceId) {
            throw new Error('Workspace id required for the object widget');
        }

        options.enabled = true;

        subdataMethods = SubdataMethods.make();

        function buildOptions() {
            const availableValues = model.getItem('availableValues'),
                value = model.getItem('value') || [],
                selectOptions = [option({ value: '' }, '')];
            if (!availableValues) {
                return selectOptions;
            }
            return selectOptions.concat(
                availableValues.map((availableValue) => {
                    let selected = false,
                        optionLabel = availableValue.id,
                        optionValue = availableValue.id;
                    // TODO: pull the value out of the object
                    if (value.indexOf(availableValue.id) >= 0) {
                        selected = true;
                    }
                    return option(
                        {
                            value: optionValue,
                            selected: selected,
                        },
                        optionLabel
                    );
                })
            );
        }

        function buildCount() {
            const availableValues = model.getItem('availableValues') || [],
                value = model.getItem('value') || [];

            return String(value.length) + ' / ' + String(availableValues.length) + ' items';
        }

        function filterItems(items, filter) {
            if (!filter) {
                return items;
            }
            const re = new RegExp(filter, 'i');
            return items.filter((item) => {
                // TODO: better filtering, but need support from the
                // subdata generators (../subdataMethods) to expose the individual
                // fields. Or, strip out any html from here.
                if (item.text && item.text.match(re)) {
                    return true;
                }
                return false;
            });
        }

        function doFilterItems() {
            const items = model.getItem('availableValues', []),
                filteredItems = filterItems(items, model.getItem('filter'));

            // for now we just reset the from/to range to the beginning.
            model.setItem('filteredAvailableItems', filteredItems);

            doFirstPage();
        }

        function renderAvailableItems() {
            let selected = model.getItem('selectedItems', []),
                allowSelection = spec.ui.multiSelection || selected.length === 0,
                items = model.getItem('filteredAvailableItems', []),
                from = model.getItem('showFrom'),
                to = model.getItem('showTo'),
                itemsToShow = items.slice(from, to),
                events = Events.make({ node: container }),
                content;

            if (!isAvailableValuesInitialized) {
                content = div({ style: { textAlign: 'center' } }, html.loading('Loading data...'));
            } else if (itemsToShow.length === 0) {
                content = div({ style: { textAlign: 'center' } }, 'no available values');
            } else {
                content = itemsToShow
                    .map((item, index) => {
                        const isSelected = selected.some((id) => {
                                return item.id === id;
                            }),
                            disabled = isSelected;
                        return div({ class: 'row', style: { border: '1px #CCC solid' } }, [
                            div(
                                {
                                    class: 'col-md-2',
                                    style: {
                                        verticalAlign: 'middle',
                                        borderRadius: '3px',
                                        padding: '2px',
                                        backgroundColor: '#EEE',
                                        color: '#444',
                                        textAlign: 'right',
                                        paddingRight: '6px',
                                        fontFamily: 'monospace',
                                    },
                                },
                                String(from + index + 1)
                            ),
                            div(
                                {
                                    class: 'col-md-8',
                                    style: {
                                        padding: '2px',
                                    },
                                },
                                item.text
                            ),
                            div(
                                {
                                    class: 'col-md-2',
                                    style: {
                                        padding: '2px',
                                        textAlign: 'right',
                                        verticalAlign: 'top',
                                    },
                                },
                                [
                                    (function () {
                                        if (disabled) {
                                            return span(
                                                {
                                                    class: 'kb-btn-icon',
                                                    type: 'button',
                                                    dataToggle: 'tooltip',
                                                    title: 'Remove from selected',
                                                },
                                                [
                                                    span({
                                                        class: 'fa fa-minus-circle',
                                                        style: {
                                                            color: 'red',
                                                            fontSize: '200%',
                                                        },
                                                    }),
                                                ]
                                            );
                                        }
                                        if (allowSelection) {
                                            return span(
                                                {
                                                    class: 'kb-btn-icon',
                                                    type: 'button',
                                                    dataToggle: 'tooltip',
                                                    title: 'Add to selected',
                                                    dataItemId: item.id,
                                                },
                                                [
                                                    span({
                                                        class: 'fa fa-plus-circle',
                                                        style: {
                                                            color: 'green',
                                                            fontSize: '200%',
                                                        },
                                                    }),
                                                ]
                                            );
                                        }
                                        return span(
                                            {
                                                class: 'kb-btn-icon',
                                                type: 'button',
                                                dataToggle: 'tooltip',
                                                title: "Can't add - remove one first",
                                                dataItemId: item.id,
                                            },
                                            span({
                                                class: 'fa fa-ban',
                                                style: { color: 'silver', fontSize: '200%' },
                                            })
                                        );
                                    })(),
                                ]
                            ),
                        ]);
                    })
                    .join('\n');
            }

            ui.setContent('available-items', content);
            events.attachEvents();
            ui.enableTooltips('available-items');
        }

        function renderSelectedItems() {
            let selectedItems = model.getItem('selectedItems', []),
                valuesMap = model.getItem('availableValuesMap', {}),
                events = Events.make({ node: container }),
                content;

            if (selectedItems.length === 0) {
                content = div({ style: { textAlign: 'center' } }, 'no selected values');
            } else {
                content = selectedItems
                    .map((itemId, index) => {
                        let item = valuesMap[itemId];
                        if (item === undefined || item === null) {
                            item = {
                                text: itemId,
                            };
                        }

                        return div(
                            {
                                class: 'row',
                                style: {
                                    border: '1px #CCC solid',
                                    borderCollapse: 'collapse',
                                    boxSizing: 'border-box',
                                },
                            },
                            [
                                div(
                                    {
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
                                            fontFamily: 'monospace',
                                        },
                                    },
                                    String(index + 1)
                                ),
                                div(
                                    {
                                        class: 'col-md-8',
                                        style: {
                                            xdisplay: 'inline-block',
                                            xwidth: '90%',
                                            padding: '2px',
                                        },
                                    },
                                    item.text
                                ),
                                div(
                                    {
                                        class: 'col-md-2',
                                        style: {
                                            xdisplay: 'inline-block',
                                            xwidth: '10%',
                                            padding: '2px',
                                            textAlign: 'right',
                                            verticalAlign: 'top',
                                        },
                                    },
                                    [
                                        span(
                                            {
                                                class: 'kb-btn-icon',
                                                type: 'button',
                                                dataToggle: 'tooltip',
                                                title: 'Remove from selected',
                                            },
                                            span({
                                                class: 'fa fa-minus-circle',
                                                style: { color: 'red', fontSize: '200%' },
                                            })
                                        ),
                                    ]
                                ),
                            ]
                        );
                    })
                    .join('\n');
            }
            ui.setContent('selected-items', content);
            events.attachEvents();
            ui.enableTooltips('selected-items');
        }

        function renderSearchBox() {
            let events = Events.make({ node: container }),
                content;

            content = input({
                class: 'form-contol',
                placeholder: 'search',
                value: model.getItem('filter') || '',
                id: events.addEvents({
                    events: [
                        {
                            type: 'keyup',
                            handler: function (e) {
                                doSearchKeyUp(e);
                            },
                        },
                        {
                            type: 'focus',
                            handler: function () {
                                Jupyter.narrative.disableKeyboardManager();
                            },
                        },
                        {
                            type: 'blur',
                            handler: function () {
                                // console.log('SingleSubData Search BLUR');
                                // Jupyter.narrative.enableKeyboardManager();
                            },
                        },
                        {
                            type: 'click',
                            handler: function () {
                                Jupyter.narrative.disableKeyboardManager();
                            },
                        },
                    ],
                }),
            });

            ui.setContent('search-box', content);
            events.attachEvents();
        }

        function renderSearchMessage() {
            const content = span({
                dataElement: 'message',
            });

            ui.setContent('search-message', content);
        }

        function setSearchMessage(message) {
            ui.setText('search-message.message', message);
        }

        function renderStats() {
            let availableItems = model.getItem('availableValues', []),
                filteredItems = model.getItem('filteredAvailableItems', []),
                content;
            if (!isAvailableValuesInitialized) {
                content = span({ style: { fontStyle: 'italic' } }, [
                    ' - ' + html.loading('Loading data...'),
                ]);
            } else if (availableItems.length === 0) {
                content = span({ style: { fontStyle: 'italic' } }, [' - no available items']);
            } else if (filteredItems.length === availableItems.length) {
                content = span({ style: { fontStyle: 'italic' } }, [
                    ' - ',
                    String(availableItems.length),
                ]);
            } else {
                content = span({ style: { fontStyle: 'italic' } }, [
                    ' - filtered ',
                    span([String(filteredItems.length), ' out of ', String(availableItems.length)]),
                ]);
            }

            ui.setContent('stats', content);
        }

        function renderToolbar() {
            let items = model.getItem('filteredAvailableItems', []),
                events = Events.make({ node: container }),
                content;

            if (items.length === 0) {
                content = '';
            } else {
                content = div([
                    button(
                        {
                            type: 'button',
                            class: 'btn btn-default',
                            style: { xwidth: '100%' },
                            id: events.addEvent({
                                type: 'click',
                                handler: function () {
                                    doFirstPage();
                                },
                            }),
                        },
                        ui.buildIcon({ name: 'step-forward', rotate: 270 })
                    ),
                    button(
                        {
                            class: 'btn btn-default',
                            type: 'button',
                            style: { xwidth: '50%' },
                            id: events.addEvent({
                                type: 'click',
                                handler: function () {
                                    doPreviousPage();
                                },
                            }),
                        },
                        ui.buildIcon({ name: 'caret-up' })
                    ),
                    button(
                        {
                            class: 'btn btn-default',
                            type: 'button',
                            style: { xwidth: '100%' },
                            id: events.addEvent({
                                type: 'click',
                                handler: function () {
                                    doNextPage();
                                },
                            }),
                        },
                        ui.buildIcon({ name: 'caret-down' })
                    ),
                    button(
                        {
                            type: 'button',
                            class: 'btn btn-default',
                            style: { xwidth: '100%' },
                            id: events.addEvent({
                                type: 'click',
                                handler: function () {
                                    doLastPage();
                                },
                            }),
                        },
                        ui.buildIcon({ name: 'step-forward', rotate: 90 })
                    ),
                ]);
            }

            ui.setContent('toolbar', content);
            events.attachEvents();
        }

        function setPageStart(newFrom) {
            let from = model.getItem('showFrom'),
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
            const filterLength = e.target.value.length;
            if (filterLength >= minimumFilterLength) {
                model.setItem('filter', e.target.value);
                doFilterItems();
                setSearchMessage('filter applied');
            } else {
                if (filterLength > 0 && minimumFilterLength > 0) {
                    setSearchMessage(
                        'Enter ' +
                            (minimumFilterLength - e.target.value.length) +
                            ' more character to filter'
                    );
                } else {
                    setSearchMessage('');
                }
                if (model.getItem('filter')) {
                    model.setItem('filter', null);
                    doFilterItems();
                }
            }
        }

        function makeInputControl() {
            // There is an input control, and a dropdown,
            // TODO select2 after we get a handle on this...
            const availableValues = model.getItem('availableValues');

            if (!availableValues) {
                return p(
                    {
                        class: 'form-control-static',
                        style: {
                            fontStyle: 'italic',
                            whiteSpace: 'normal',
                            padding: '3px',
                            border: '1px silver solid',
                        },
                    },
                    'Items will be available after selecting a value for ' +
                        spec.data.constraints.subdataSelection.parameter_id
                );
            }

            return div([
                ui.buildCollapsiblePanel({
                    title: span(['Available Items', span({ dataElement: 'stats' })]),
                    classes: ['kb-panel-light'],
                    collapsed: !Narrative.canEdit(),
                    body: div(
                        { dataElement: 'available-items-area', style: { marginTop: '10px' } },
                        [
                            div({ class: 'row' }, [
                                div(
                                    {
                                        class: 'col-md-6',
                                    },
                                    [
                                        span({ dataElement: 'search-box' }),
                                        span({
                                            style: {
                                                marginLeft: '4px',
                                                fontStyle: 'italic',
                                            },
                                            dataElement: 'search-message',
                                        }),
                                    ]
                                ),
                                div({
                                    class: 'col-md-6',
                                    style: { textAlign: 'right' },
                                    dataElement: 'toolbar',
                                }),
                            ]),
                            div({ class: 'row', style: { marginTop: '4px' } }, [
                                div(
                                    { class: 'col-md-12' },
                                    div({
                                        style: {
                                            border: '1px silver solid',
                                        },
                                        dataElement: 'available-items',
                                    })
                                ),
                            ]),
                        ]
                    ),
                }),
                ui.buildPanel({
                    title: 'Selected Items',
                    classes: ['kb-panel-light'],
                    body: div({
                        style: {
                            border: '1px silver solid',
                        },
                        dataElement: 'selected-items',
                    }),
                }),
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
                    ui.setContent('input-control.count', buildCount());

                    break;
                case 'availableValues':
                    // rebuild the options
                    // re-apply the selections from the value
                    ui.setContent('input-control.input', buildOptions());
                    ui.setContent('input-control.count', buildCount());

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
        function resetModelValue() {
            model.reset();
            model.setItem('value', spec.defaultValue);
        }

        // safe, but ugly.

        function fetchData() {
            let referenceObjectName = model.getItem('referenceObjectName'),
                referenceObjectRef = spec.data.constraints.subdataSelection.constant_ref;

            if (!referenceObjectRef) {
                if (!referenceObjectName) {
                    return [];
                }
                referenceObjectRef = workspaceId + '/' + referenceObjectName;
            }

            return subdataMethods.fetchData({
                referenceObjectRef: referenceObjectRef,
                spec: spec,
            });
        }

        function syncAvailableValues() {
            return Promise.try(() => {
                return fetchData();
            }).then((data) => {
                isAvailableValuesInitialized = true;
                if (!data) {
                    return ' no data? ';
                }

                // If default values have been provided, prepend them to the data.

                // We use the raw default values here since we are not really using
                // it as the default value, but as a set of additional items
                // to select.
                const defaultValues = spec.defaultValue;
                if (defaultValues && defaultValues instanceof Array && defaultValues.length > 0) {
                    defaultValues.forEach((itemId) => {
                        if (itemId && itemId.trim().length > 0) {
                            data.unshift({
                                id: itemId,
                                text: itemId,
                            });
                        }
                    });
                }

                // The data represents the total available subdata, with all
                // necessary fields for display. We build from that three
                // additional structures
                // - a map of id to object
                // - a set of available ids
                // - a set of selected ids
                // - a set of filtered ids
                model.setItem('availableValues', data);

                if (data.length > 4000) {
                    minimumFilterLength = 3;
                } else {
                    minimumFilterLength = 0;
                }

                // TODO: generate all of this in the fetchData -- it will be a bit faster.
                const map = {};
                data.forEach((datum) => {
                    map[datum.id] = datum;
                });

                model.setItem('availableValuesMap', map);

                doFilterItems();
            });
        }

        /*
         * Creates the markup
         * Places it into the ui node
         * Hooks up event listeners
         */
        function render() {
            return Promise.try(() => {
                // check to see if we have to render inputControl.
                const events = Events.make({ node: container }),
                    inputControl = makeInputControl(),
                    content = div(
                        {
                            class: 'input-group',
                            style: {
                                width: '100%',
                            },
                        },
                        inputControl
                    );

                ui.setContent('input-container', content);
                renderSearchBox();
                renderSearchMessage();
                renderStats();
                renderToolbar();
                renderAvailableItems();
                renderSelectedItems();

                events.attachEvents();
            }).catch((err) => {
                console.error('ERROR in render', err);
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
                [
                    div({
                        dataElement: 'input-container',
                    }),
                ]
            );
            return {
                content: content,
                events: events,
            };
        }

        function registerEvents() {
            /*
             * Issued when thre is a need to have all params reset to their
             * default value.
             */
            channel.on('reset-to-defaults', () => {
                resetModelValue();
                // model.reset();
                // TODO: this should really be set when the linked field is reset...
                model.setItem('availableValues', []);
                model.setItem('referenceObjectName', null);
                doFilterItems();
                renderSearchBox();
            });

            /*
             * Issued when there is an update for this param.
             */
            channel.on('update', (message) => {
                model.setItem('value', message.value);
                updateInputControl('value');
            });

            /*
             * Called when for an update to any param. This is necessary for
             * any parameter which has a dependency upon any other.
             *
             */
            paramsChannel.listen({
                key: {
                    type: 'parameter-changed',
                    parameter: spec.data.constraints.subdataSelection.constant_ref,
                },
                handle: function (message) {
                    let newValue = message.newValue;
                    if (message.newValue === '') {
                        newValue = null;
                    }
                    // reset the entire model.
                    model.reset();
                    model.setItem('referenceObjectName', newValue);
                    syncAvailableValues()
                        .then(() => {
                            updateInputControl('availableValues');
                        })
                        .catch((err) => {
                            console.error('ERROR syncing available values', err);
                        });
                },
            });

            paramsChannel.listen({
                key: {
                    type: 'parameter-changed',
                    parameter: spec.data.constraints.subdataSelection.parameter_id,
                },
                handle: function (message) {
                    let newValue = message.newValue;
                    if (message.newValue === '') {
                        newValue = null;
                    }
                    // reset the entire model.
                    model.reset();
                    model.setItem('referenceObjectName', newValue);
                    syncAvailableValues()
                        .then(() => {
                            updateInputControl('availableValues');
                        })
                        .catch((err) => {
                            console.error('ERROR syncing available values', err);
                        });
                },
            });

            paramsChannel.listen({
                key: {
                    type: 'parameter-value',
                    parameter: spec.data.constraints.subdataSelection.parameter_id,
                },
                handle: function (message) {
                    let newValue = message.newValue;
                    if (message.newValue === '') {
                        newValue = null;
                    }
                    model.reset();
                    model.setItem('referenceObjectName', newValue);
                    syncAvailableValues()
                        .then(() => {
                            updateInputControl('availableValues');
                        })
                        .catch((err) => {
                            console.error('ERROR syncing available values', err);
                        });
                },
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
            // bus.emit('sync');

            paramsChannel.request(
                {
                    parameterName: spec.id,
                },
                {
                    key: {
                        type: 'get-parameter',
                    },
                }
            );
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

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({
                    node: container,
                });

                const events = Events.make(),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                render();

                events.attachEvents(container);

                registerEvents();

                // Get initial data.
                // Weird, but will make it look nicer.
                Promise.all([
                    paramsChannel.request(
                        {
                            parameterName: spec.data.constraints.subdataSelection.parameter_id,
                        },
                        {
                            key: {
                                type: 'get-parameter',
                            },
                        }
                    ),
                ])
                    .spread((referencedParamValue) => {
                        // hmm, the default value of a subdata is null, but that does
                        // not play nice with the model props defaulting mechanism which
                        // works with absent or undefined (null being considered an actual value, which
                        // it is of course!)
                        if (!config.initialValue) {
                            model.setItem('selectedItems', []);
                        } else {
                            let selectedItems = config.initialValue;
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
                            .then(() => {
                                updateInputControl('availableValues');
                            })
                            .catch((err) => {
                                console.error('ERROR syncing available values', err);
                            });
                    })
                    .catch((err) => {
                        console.error('ERROR fetching initial data', err);
                    });
            });
        }

        function stop() {
            return Promise.try(() => {
                if (parent && container) {
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
                showTo: 5,
            },
            onUpdate: function () {
                renderStats();
                renderToolbar();
                renderAvailableItems();
                renderSelectedItems();
            },
        });

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
