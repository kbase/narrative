define([
    'bluebird',
    'jquery',
    'kb_common/html',
    'kb_common/utils',
    'StagingServiceClient',
    'kb_service/utils',
    'common/validation',
    'common/events',
    'common/runtime',
    'common/ui',
    'common/data',
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
    utils,
    StagingServiceClient,
    serviceUtils,
    Validation,
    Events,
    Runtime,
    UI,
    Data,
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
        option = t('option');

    function factory(config) {
        const spec = config.parameterSpec,
            runtime = Runtime.make(),
            bus = runtime.bus().connect(),
            channel = bus.channel(config.channelName),
            dd_options = spec.original.dynamic_dropdown_options || {},
            dataSource = dd_options.data_source || 'ftp_staging',
            model = {
                value: undefined,
            },
            stagingService = new StagingServiceClient({
                root: runtime.config('services.staging_api_url.url'),
                token: runtime.authToken(),
            }),
            userId = runtime.userId();
        let parent, container, ui;

        if (typeof dd_options.query_on_empty_input === 'undefined') {
            dd_options.query_on_empty_input = 1;
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
                ? selected[dd_options.selection_id] || selected.subpath
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
                return Validation.validateText(selectedItem, validationConstraints);
            });
        }

        function genericClientCall(call_params) {
            const swUrl = runtime.config('services.service_wizard.url'),
                genericClient = new GenericClient(swUrl, {
                    token: runtime.authToken(),
                });
            return genericClient.sync_call(
                dd_options.service_function,
                call_params,
                null,
                null,
                dd_options.service_version || 'release'
            );
        }

        function fetchData(searchTerm) {
            searchTerm = searchTerm || '';

            if (!searchTerm && !dd_options.query_on_empty_input) {
                return Promise.resolve([]);
            }
            if (dataSource === 'ftp_staging') {
                return Promise.resolve(stagingService.search({ query: searchTerm })).then(
                    (results) => {
                        results = JSON.parse(results).filter((file) => {
                            return !file.isFolder;
                        });
                        results.forEach((file) => {
                            file.text = file.path;
                            file.subdir = file.path.substring(
                                0,
                                file.path.length - file.name.length
                            );
                            file.subpath = file.path.substring(userId.length + 1);
                            file.id = file.subpath;
                        });
                        return results;
                    }
                );
            } else {
                let call_params = JSON.stringify(dd_options.service_params).replace(
                    '{{dynamic_dropdown_input}}',
                    searchTerm
                );
                call_params = JSON.parse(call_params);

                return Promise.resolve(genericClientCall(call_params)).then((results) => {
                    let index = dd_options.result_array_index;
                    if (!index) {
                        index = 0;
                    }
                    if (index >= results.length) {
                        console.error(
                            `Result array from ${dd_options.service_function} ` +
                                `has length ${results.length} but index ${index} ` +
                                'was requested'
                        );
                        return [];
                    }
                    results = results[index];
                    let path = dd_options.path_to_selection_items;
                    if (!path) {
                        path = [];
                    }
                    results = Props.getDataItem(results, path);
                    if (!Array.isArray(results)) {
                        console.error(
                            'Selection items returned from ' +
                                `${dd_options.service_function} at path /${path.join('/')} ` +
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
                            //this blows away any 'text' field
                            obj.text = obj[dd_options.selection_id];
                            results[_index] = obj;
                        });
                        return results;
                    }
                });
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
         id: "data/bulk/wjriehl/subfolder/i_am_a_file.txt"
         isFolder: false
         mtime: 1508441424000
         name: "i_am_a_file.txt"
         path: "data/bulk/wjriehl/subfolder/i_am_a_file.txt"
         size: 0
         text: "data/bulk/wjriehl/subfolder/i_am_a_file.txt"
         */
        function formatObjectDisplay(ret_obj) {
            if (!ret_obj.id) {
                return '';
            } else if (dataSource === 'ftp_staging') {
                if (!ret_obj.id) {
                    return $('<div style="display:block; height:20px">').append(ret_obj.text);
                }
                return $(
                    div([
                        span({ style: 'word-wrap: break-word' }, [ret_obj.subdir, b(ret_obj.name)]),
                        div({ style: 'margin-left: 7px' }, [
                            'Size: ' + StringUtil.readableBytes(ret_obj.size) + '<br>',
                            'Uploaded ' + TimeFormat.getTimeStampStr(ret_obj.mtime, true),
                        ]),
                    ])
                );
            } else {
                const replacer = function (match, p1) {
                    return ret_obj[p1];
                };
                let formatted_string;
                if (dd_options.description_template) {
                    // use slice to avoid modifying global description_template
                    formatted_string = dd_options.description_template
                        .slice()
                        .replace(/{{(.+?)}}/g, replacer);
                } else {
                    formatted_string = JSON.stringify(ret_obj);
                }
                return $('<div style="display:block; height:20px">').append(formatted_string);
            }
        }

        function selectionTemplate(object) {
            if (dd_options.description_template) {
                return formatObjectDisplay(object);
            }
            if (dd_options.selection_id) {
                return object[dd_options.selection_id];
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

                return render().then(() => {
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
