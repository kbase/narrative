define([
    'bluebird',
    'jquery',
    'common/html',
    'StagingServiceClient',
    '../validation',
    'common/runtime',
    'common/ui',
    'common/events',
    '../validators/constants',
    'util/timeFormat',
    'util/string',
    'kbase-generic-client-api',
    'common/props',
    'widgets/appWidgets2/common',
    'select2',
    'bootstrap',
], (
    Promise,
    $,
    html,
    StagingServiceClient,
    Validation,
    Runtime,
    UI,
    Events,
    Constants,
    TimeFormat,
    StringUtil,
    GenericClient,
    Props,
    WidgetCommon
) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        span = t('span'),
        b = t('b'),
        select = t('select'),
        option = t('option'),
        baseCssClass = 'kb-appInput__dynDropdown';

    function factory(config) {
        const spec = config.parameterSpec,
            runtime = Runtime.make(),
            bus = runtime.bus().connect(),
            channel = bus.channel(config.channelName),
            ddOptions = spec.original.dynamic_dropdown_options || {},
            dataSource = ddOptions.data_source || 'ftp_staging',
            model = {
                displayValue: undefined,
                value: undefined,
                descriptionFields: new Set(),
                exactMatchError: false,
            };
        let parent, container, ui;
        if (typeof ddOptions.query_on_empty_input === 'undefined') {
            ddOptions.query_on_empty_input = 1;
        }

        // if there's a template, process it so we have expected fields
        if (ddOptions.description_template) {
            const m = [...ddOptions.description_template.matchAll(/{{(.+?)}}/g)];
            m.forEach((match) => model.descriptionFields.add(match[1]));
        }

        /**
         * This function takes a nested return and returns a flat key-value pairing for use with
         * handlebar replacement for example {"foo":{"bar": "meh"}} becomes {"foo.bar": "meh"}
         */
        const flattenObject = function (ob) {
            const toReturn = {};
            for (const i in ob) {
                if (!Object.prototype.hasOwnProperty.call(ob, i)) continue;

                if (typeof ob[i] === 'object') {
                    const flatObject = flattenObject(ob[i]);
                    for (const x in flatObject) {
                        if (!Object.prototype.hasOwnProperty.call(flatObject, x)) continue;
                        toReturn[i + '.' + x] = flatObject[x];
                    }
                } else {
                    toReturn[i] = ob[i];
                }
            }
            return toReturn;
        };

        function makeInputControl() {
            let selectOptions;
            const selectElem = select(
                {
                    class: 'form-control',
                    dataElement: 'input',
                    style: {
                        width: '100%',
                    },
                    multiple: false,
                    id: html.genId(),
                },
                [option({ value: '' }, '')].concat(selectOptions)
            );

            return selectElem;
        }

        // CONTROL
        function getControlValue() {
            const control = ui.getElement('input-container.input'),
                selected = $(control).select2('data')[0];

            const selection_val = selected
                ? selected[ddOptions.selection_id] || selected.subpath
                : '';
            if (!selected || !selection_val) {
                // might have just started up, and we don't have a selection value, but
                // we might have a model value.
                const modelVal = getModelValue();
                if (modelVal) {
                    return modelVal;
                } else {
                    return '';
                }
            }
            return selection_val;
        }

        /**
         * Sets the dropdown value to the given value. Constructs an id from it that (should)
         * be unique enough to apply to the dropdown.
         */
        function updateControlValue() {
            const value = model.value;
            const displayValue = model.displayValue || {};
            const control = ui.getElement('input-container.input');
            if (value) {
                const selectorValue = value.replace(/"/g, '\\"').replace(/'/g, "\\'");
                if ($(control).find(`option[value="${selectorValue}"]`).length) {
                    $(control).val(value).trigger('change');
                } else {
                    const dataAdapter = $(control).data('select2').dataAdapter;
                    const newOption = dataAdapter.option(
                        Object.assign({ id: model.value, value: model.value }, displayValue)
                    );
                    dataAdapter.addOptions(newOption);
                    $(control).val(value).trigger('change');
                }
            }
        }

        // MODEL

        function setModelValue(value, displayValue) {
            if (value === undefined) {
                return;
            }
            if (model.value !== value) {
                model.value = value;
                model.displayValue = displayValue || {};
            }
            updateControlValue();
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
                if (model.exactMatchError) {
                    const response = Validation.validateFalse(model.value);
                    response.errorMessage = `An exact match was not found for "${model.value}". Please search again.`;
                    return response;
                }
                let selectedItem = getControlValue();
                const validationConstraints = {
                    min_length: spec.data.constraints.min_length,
                    max_length: spec.data.constraints.max_length,
                    required: spec.data.constraints.required,
                };
                // selected item might be either a string or a number.
                // if it's a number, we want it to be a string
                // if it's something else, we should raise an error, since that's
                // something fishy coming from the data-providing service
                if (typeof selectedItem === 'number') {
                    selectedItem = String(selectedItem);
                }
                return Validation.validateTextString(selectedItem, validationConstraints);
            });
        }

        function genericClientCall(callParams) {
            const swUrl = runtime.config('services.service_wizard.url'),
                genericClient = new GenericClient(swUrl, {
                    token: runtime.authToken(),
                });
            return genericClient.sync_call(
                ddOptions.service_function,
                callParams,
                null,
                null,
                ddOptions.service_version || 'release'
            );
        }

        /**
         * Special case for Staging area file seach, which is a little different from the
         * generalized dynamic service approach.
         * This returns a list of file objects returned from searching the staging service. Each
         * object contains the keys "text", "subdir", "subpath", and "id", the values of which
         * are all strings.
         * @param {string} searchTerm
         * @returns Array
         */
        async function fetchFtpStagingData(searchTerm) {
            const userId = runtime.userId();
            const stagingService = new StagingServiceClient({
                root: runtime.config('services.staging_api_url.url'),
                token: runtime.authToken(),
            });
            let results = await Promise.resolve(stagingService.search({ query: searchTerm }));
            results = JSON.parse(results).filter((file) => {
                return !file.isFolder;
            });
            results.forEach((file) => {
                file.text = file.path;
                file.subdir = file.path.substring(0, file.path.length - file.name.length);
                file.subpath = file.path.substring(userId.length + 1);
                file.id = file.subpath;
            });
            return results;
        }

        async function fetchData(searchTerm) {
            searchTerm = searchTerm || '';

            if (!searchTerm && !ddOptions.query_on_empty_input) {
                return Promise.resolve([]);
            }
            if (dataSource === 'ftp_staging') {
                return fetchFtpStagingData(searchTerm);
            } else {
                let callParams = JSON.stringify(ddOptions.service_params).replace(
                    '{{dynamic_dropdown_input}}',
                    searchTerm
                );
                callParams = JSON.parse(callParams);

                // TODO: wrap lines 228-252 in a check for ddOptions.include_user_params and implement that in NMS
                const params = await channel.request({}, { key: { type: 'get-parameters' } });

                // text replacement for any dynamic parameter values
                callParams = callParams.map((callParam) => {
                    return Object.entries(callParam).reduce((acc, [k, v]) => {
                        if (typeof v === 'string') {
                            // match dynamic user params that are {{in brackets}}
                            const dParam = v.match(/[^{{]+(?=}\})/);
                            if (dParam !== null) {
                                if (!(dParam[0] in params)) {
                                    console.error(
                                        `Parameter "{{${dParam[0]}}}" does not exist as a parameter for this method. ` +
                                            `this dynamic parameter will be omitted in the call to ${ddOptions.service_function}.`
                                    );
                                    // don't include bad parameters that don't exist
                                    return acc;
                                }
                                // replace dynamic values with actual param values
                                acc[k] = params[dParam[0]];
                                return acc;
                            }
                        }
                        // return anything else as normal
                        acc[k] = v;
                        return acc;
                    }, {});
                });

                let results = await Promise.resolve(genericClientCall(callParams));
                const index = ddOptions.result_array_index || 0;
                if (index >= results.length) {
                    console.error(
                        `Result array from ${ddOptions.service_function} ` +
                            `has length ${results.length} but index ${index} ` +
                            'was requested'
                    );
                    return [];
                }
                results = results[index];
                let path = ddOptions.path_to_selection_items;
                if (!path) {
                    path = [];
                }
                results = Props.getDataItem(results, path);
                if (!Array.isArray(results)) {
                    console.error(
                        'Selection items returned from ' +
                            `${ddOptions.service_function} at path /${path.join('/')} ` +
                            `in postion ${index} of the returned list are not an array`
                    );
                    return [];
                } else {
                    results.forEach((obj, _index) => {
                        // could check here that each item is a map? YAGNI
                        obj = flattenObject(obj);
                        if (!('id' in obj)) {
                            obj.id = String(_index);
                        }
                        // this blows away any 'text' field
                        obj.text = obj[ddOptions.selection_id];
                        results[_index] = obj;
                    });
                    return results;
                }
            }
        }

        /**
         *
         * @param {Object} dataElement
         */
        async function doChange(dataElement) {
            const result = await validate();
            const changeMsg = {
                newDisplayValue: undefined,
                newValue: spec.data.nullValue,
            };

            if (result.isValid) {
                model.exactMatchError = false;
                const newValue =
                    result.parsedValue === undefined ? result.value : result.parsedValue;
                model.value = newValue;
                if (dataElement) {
                    model.displayValue = [...model.descriptionFields].reduce((acc, key) => {
                        acc[key] = dataElement[key];
                        return acc;
                    }, {});
                } else {
                    model.displayValue = undefined;
                }
                changeMsg.newDisplayValue = model.displayValue;
                changeMsg.newValue = newValue;
                channel.emit('changed', changeMsg);
            } else if (result.diagnosis === Constants.DIAGNOSIS.REQUIRED_MISSING) {
                model.value = spec.data.nullValue;
                channel.emit('changed', changeMsg);
            }
            channel.emit('validation', result);
        }

        /**
         * Clears the current selection and updates the model.
         */
        function doClear() {
            model.exactMatchError = false;
            $(ui.getElement('input-container.input')).html('');
            model.value = spec.data.nullValue;
            channel.emit('changed', {
                newDisplayValue: undefined,
                newValue: spec.data.nullValue,
            });
        }

        /**
         * Formats Staging Area file data for display in the dropdown.
         * Expects an example fileData object as below:
         * {
         *   id: "data/bulk/wjriehl/subfolder/i_am_a_file.txt"
         *   isFolder: false
         *   mtime: 1508441424000
         *   name: "i_am_a_file.txt"
         *   path: "data/bulk/wjriehl/subfolder/i_am_a_file.txt"
         *   size: 0
         *   text: "data/bulk/wjriehl/subfolder/i_am_a_file.txt"
         * }
         * @param {Object} fileData
         * @returns {JQueryElement} a jQuery-wrapped div element
         */
        function formatFtpStagingDisplay(fileData) {
            return $(
                div([
                    span(
                        {
                            class: `${baseCssClass}_display__filepath`,
                        },
                        [StringUtil.escape(fileData.subdir), b(StringUtil.escape(fileData.name))]
                    ),
                    div(
                        {
                            class: `${baseCssClass}_display__indent`,
                        },
                        [
                            'Size: ' + StringUtil.readableBytes(fileData.size) + '<br>',
                            'Uploaded ' + TimeFormat.getTimeStampStr(fileData.mtime, true),
                        ]
                    ),
                ])
            );
        }

        /**
         * Formats the display of an object in the dropdown. Every Option in Select2 gets passed
         * through here, for better or worse. This includes temporary ones inserted by Select2,
         * like "Searching..." or "Loading..." fields.
         *
         * This returns either a text string (which will be escaped before rendering)
         * or a jQuery element, which expects pre-escaped "safe" HTML.
         *
         * So here are input cases:
         * 1. (most common), an object with an id, text, and fields as returned from the dynamic
         *    search. This gets rendered using the ddOptions template.
         * 2. (on search/load), an object without an id, but with a text field. Expects to
         *    just return the bare text or an empty string - this lets Select2 use the default
         *    "Searching..." or "Loading..." strings as temporary/unselectable options.
         * 3. (on widget load), an object with id, text, and nothing else should just return
         *    the text?
         * See https://select2.org/dropdown#templating for more details.
         */
        function formatObjectDisplay(obj) {
            if (!obj.id) {
                return obj.text || '';
            } else if (dataSource === 'ftp_staging') {
                return config.isViewOnly ? obj.id : formatFtpStagingDisplay(obj);
            } else {
                let formattedString;
                // if we have a template and at least one item to fill the template with,
                // do the formatted template
                if (
                    ddOptions.description_template &&
                    [...model.descriptionFields].some((key) => key in obj)
                ) {
                    formattedString = formatDescriptionTemplate(obj);
                }
                // otherwise, if we have a text use that. And if not, use the id as a last resort.
                else {
                    formattedString = obj.text || obj.id;
                }
                // and squash the result in a jQuery object with a div.
                return $(
                    div(
                        {
                            class: `${baseCssClass}_display`,
                        },
                        formattedString
                    )
                );
            }
        }

        /**
         * Formats the dynamic dropdown description template by replacing templated
         * values with values from the given object.
         * For example, if the template (in ddOptions.description_template) looks like this:
         *
         * Template value: {{foo}}
         *
         * and the given object is:
         * {
         *   foo: "bar"
         * }
         *
         * This returns the string "Template value: bar".
         *
         * Note that this assumes that ddOptions.description_template exists, for simplicity.
         * @param {any} obj the object to use for replacing template fields
         * @returns {String} the formatted string
         */
        function formatDescriptionTemplate(obj) {
            const replacer = (_match, paramId) => {
                return obj[paramId];
            };
            return ddOptions.description_template.replace(/{{(.+?)}}/g, replacer);
        }

        function selectionTemplate(obj) {
            if (ddOptions.description_template) {
                return formatObjectDisplay(obj);
            }
            if (ddOptions.selection_id) {
                return obj[ddOptions.selection_id];
            }
            if (!obj.id) {
                return obj.text;
            }
            return obj.id;
        }

        function getCopyString() {
            const data = $(ui.getElement('input-container.input')).select2('data')[0];
            if (!data) {
                return '';
            } else if (ddOptions.exact_match_on && data[ddOptions.exact_match_on]) {
                return data[ddOptions.exact_match_on];
            } else {
                const rendered = selectionTemplate(data);
                if (typeof rendered !== 'string') {
                    return rendered.text();
                }
                return rendered;
            }
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        async function render() {
            // const inputControl = makeInputControl(),
            //     content = div({ class: 'input-group', style: { width: '100%' } }, inputControl);
            // ui.setContent('input-container', content);
            const events = Events.make();
            const inputControl = makeInputControl();
            ui.setContent('input-container', '');
            const _container = ui.getElement('input-container');
            const content = WidgetCommon.containerContent(
                div,
                t('button'),
                events,
                ui,
                _container,
                inputControl,
                getCopyString
            );
            ui.setContent('input-container', content);

            const dropdown = $(ui.getElement('input-container.input'));
            const data = [];

            if (config.isViewOnly) {
                let viewData = {
                    selected: true,
                    id: config.initialValue || undefined,
                    text: config.initialValue,
                };
                if (config.initialDisplayValue) {
                    if (typeof config.initialDisplayValue === 'string') {
                        viewData.text = config.initialDisplayValue;
                    } else if (
                        config.initialDisplayValue !== null &&
                        typeof config.initialDisplayValue === 'object'
                    ) {
                        viewData = Object.assign(viewData, config.initialDisplayValue);
                        if (!viewData.text) {
                            viewData.text = viewData.id;
                        }
                    }
                }
                data.push(viewData);
            } else if (model.value && !model.displayValue && ddOptions.exact_match_on) {
                const searchResults = await fetchData(model.value);
                // verify that we have an exact match
                let match = null;
                for (const result of searchResults) {
                    if (
                        model.value.toLowerCase() === result[ddOptions.exact_match_on].toLowerCase()
                    ) {
                        match = result;
                        break;
                    }
                }
                if (match) {
                    data.push(Object.assign(match, { selected: true }));
                    model.value = match.id;
                } else {
                    model.exactMatchError = true;
                }
            }

            dropdown.select2({
                allowClear: true,
                disabled: config.isViewOnly,
                templateResult: formatObjectDisplay,
                templateSelection: selectionTemplate,
                data,
                ajax: {
                    delay: 250,
                    processResults: (data) => {
                        // update the currently selected one if applicable
                        const currentData = dropdown.select2('data')[0];
                        if (currentData) {
                            const updatedData = data.results.filter((item) => {
                                return item.id === currentData.id;
                            });
                            if (updatedData.length) {
                                for (const key of Object.keys(updatedData[0])) {
                                    currentData[key] = updatedData[0][key];
                                }
                                dropdown.trigger('change');
                            }
                        }
                        return data;
                    },
                    transport: function (params, success, failure) {
                        model.exactMatchError = false;
                        return fetchData(params.data.term)
                            .then((data) => {
                                success({ results: data });
                            })
                            .catch((err) => {
                                console.error(err);
                                failure(err);
                            });
                    },
                },
                placeholder: {
                    id: 'select an option',
                },
            });
            dropdown
                .on('change', () => {
                    const data = dropdown.select2('data');
                    return doChange(data ? data[0] : {});
                })
                .on('select2:clear', () => {
                    doClear();
                });
            events.attachEvents(_container);
        }

        /*
         * In the layout we set up an environment in which one or more parameter
         * rows may be inserted.
         * For the objectInput, there is only ever one control.
         */
        function layout() {
            return div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' })]
            );
        }

        function autoValidate() {
            return validate().then((result) => {
                channel.emit('validation', result);
            });
        }

        // LIFECYCLE API
        async function start(arg) {
            parent = arg.node;
            container = parent.appendChild(document.createElement('div'));
            ui = UI.make({ node: container });

            container.innerHTML = layout();

            if (config.initialValue !== undefined) {
                // note this might come from a different workspace...
                model.value = config.initialValue;
            }
            if (config.initialDisplayValue !== undefined) {
                model.displayValue = config.initialDisplayValue;
            }

            await render();
            channel.on('reset-to-defaults', () => {
                resetModelValue();
            });
            channel.on('update', (message) => {
                setModelValue(message.value, message.displayValue);
            });
            updateControlValue();
            return autoValidate();
        }

        function stop() {
            return Promise.try(() => {
                const control = ui.getElement('input-container.input');
                if (control) {
                    $(control).select2('destroy').html('');
                }
                if (container) {
                    parent.removeChild(container);
                }
                bus.stop();
            });
        }

        // INIT

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
