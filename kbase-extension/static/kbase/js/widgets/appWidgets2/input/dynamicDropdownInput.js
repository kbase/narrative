define([
    'bluebird',
    'jquery',
    'common/html',
    'StagingServiceClient',
    '../validation',
    'common/events',
    'common/runtime',
    'common/ui',
    '../validators/constants',
    'util/timeFormat',
    'util/string',
    'kbase-generic-client-api',
    'common/props',
    'select2',
    'bootstrap',
], (
    Promise,
    $,
    html,
    StagingServiceClient,
    Validation,
    Events,
    Runtime,
    UI,
    Constants,
    TimeFormat,
    StringUtil,
    GenericClient,
    Props
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
                value: undefined,
            },
            userId = runtime.userId();
        let parent, container, ui;

        if (typeof ddOptions.query_on_empty_input === 'undefined') {
            ddOptions.query_on_empty_input = 1;
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
        function setControlValue(value) {
            const control = ui.getElement('input-container.input');
            if ($(control).find('option[value="' + value + '"]').length) {
                $(control).val(value).trigger('change');
            } else {
                const newOption = new Option(value, value, true, true);
                $(control).append(newOption).trigger('change');
            }
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

        async function fetchData(searchTerm) {
            searchTerm = searchTerm || '';

            if (!searchTerm && !ddOptions.query_on_empty_input) {
                return Promise.resolve([]);
            }
            if (dataSource === 'ftp_staging') {
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
                                    // dont include bad parameters that don't exist
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
                            obj.id = _index; // what the fuck
                        }
                        // this blows away any 'text' field
                        obj.text = obj[ddOptions.selection_id];
                        results[_index] = obj;
                    });
                    return results;
                }
            }
        }

        function doChange() {
            validate().then((result) => {
                if (result.isValid) {
                    const newValue =
                        result.parsedValue === undefined ? result.value : result.parsedValue;
                    model.value = newValue;
                    channel.emit('changed', {
                        newValue: newValue,
                    });
                } else if (result.diagnosis === Constants.DIAGNOSIS.REQUIRED_MISSING) {
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
         * Clears the current selection and updates the model.
         */
        function doClear() {
            model.value = spec.data.nullValue;
            channel.emit('changed', {
                newValue: spec.data.nullValue,
            });
        }

        /**
         * Formats the display of an object in the dropdown.
         * id: "data/bulk/wjriehl/subfolder/i_am_a_file.txt"
         * isFolder: false
         * mtime: 1508441424000
         * name: "i_am_a_file.txt"
         * path: "data/bulk/wjriehl/subfolder/i_am_a_file.txt"
         * size: 0
         * text: "data/bulk/wjriehl/subfolder/i_am_a_file.txt"
         */
        function formatObjectDisplay(retObj) {
            if (!retObj.id) {
                return retObj.text || '';
            } else if (dataSource === 'ftp_staging') {
                if (!retObj.id) {
                    return $(
                        div(
                            {
                                class: `${baseCssClass}_display`,
                            },
                            StringUtil.escape(retObj.text)
                        )
                    );
                }
                return $(
                    div([
                        span(
                            {
                                class: `${baseCssClass}_display__filepath`,
                            },
                            [StringUtil.escape(retObj.subdir), b(StringUtil.escape(retObj.name))]
                        ),
                        div(
                            {
                                class: `${baseCssClass}_display__indent`,
                            },
                            [
                                'Size: ' + StringUtil.readableBytes(retObj.size) + '<br>',
                                'Uploaded ' + TimeFormat.getTimeStampStr(retObj.mtime, true),
                            ]
                        ),
                    ])
                );
            } else {
                const replacer = function (_match, p1) {
                    return retObj[p1];
                };
                let formattedString;
                if (ddOptions.description_template) {
                    // use slice to avoid modifying global description_template
                    formattedString = ddOptions.description_template
                        .slice()
                        .replace(/{{(.+?)}}/g, replacer);
                } else {
                    formattedString = JSON.stringify(retObj);
                }
                return $(
                    div(
                        {
                            class: `${baseCssClass}_display`,
                        },
                        StringUtil.escape(formattedString)
                    )
                );
            }
        }

        function selectionTemplate(object) {
            if (ddOptions.description_template) {
                return formatObjectDisplay(object);
            }
            if (ddOptions.selection_id) {
                return object[ddOptions.selection_id];
            }
            if (!object.id) {
                return object.text;
            }
            return object.id;
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function render() {
            return Promise.try(() => {
                const events = Events.make(),
                    inputControl = makeInputControl(),
                    content = div({ class: 'input-group', style: { width: '100%' } }, inputControl);

                ui.setContent('input-container', content);

                $(ui.getElement('input-container.input'))
                    .select2({
                        allowClear: true,
                        templateResult: formatObjectDisplay,
                        templateSelection: selectionTemplate,
                        ajax: {
                            delay: 250,
                            transport: function (params, success, failure) {
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
                    })
                    .on('change', () => {
                        doChange();
                    })
                    .on('select2:clear', () => {
                        doClear();
                    });
                events.attachEvents(container);
            });
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
                channel.emit('validation', {
                    errorMessage: result.errorMessage,
                    diagnosis: result.diagnosis,
                });
            });
        }

        // LIFECYCLE API
        function start(arg) {
            parent = arg.node;
            container = parent.appendChild(document.createElement('div'));
            ui = UI.make({ node: container });

            const events = Events.make();

            container.innerHTML = layout();
            events.attachEvents(container);

            if (config.initialValue !== undefined) {
                // note this might come from a different workspace...
                model.value = config.initialValue;
            }

            return render().then(() => {
                channel.on('reset-to-defaults', () => {
                    resetModelValue();
                });
                channel.on('update', (message) => {
                    setModelValue(message.value);
                });
                setControlValue(getModelValue());
                return autoValidate();
            });
        }

        function stop() {
            return Promise.try(() => {
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
