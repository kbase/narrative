/*global define*/
/*jslint white:true,browser:true*/
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
    'KBaseSearchEngineClient',
    'select2',
    'bootstrap',
    'css!font-awesome'
], function(
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
    GenericClient
) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        b = t('b'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        var spec = config.parameterSpec,
            parent,
            container,
            runtime = Runtime.make(),
            bus = runtime.bus().connect(),
            channel = bus.channel(config.channelName),
            ui,
            dd_options = spec.original.dynamic_dropdown_options,
            dataSource = dd_options.data_source || 'ftp_staging',
            model = {
                value: undefined
            },
            stagingService = new StagingServiceClient({
                root: runtime.config('services.staging_api_url.url'),
                token: runtime.authToken()
            }),
            searchClient = new KBaseSearchEngine(
                runtime.config('services.KBaseSearchEngine.url'),
                {token: runtime.authToken()}
            ),
            userId = runtime.userId(),
            eventListeners = [];

        /**
         * This function takes a nested return and returns a flat key-value pairing for use with
         * handlebar replacement for example {"foo":{"bar": "meh"}} becomes {"foo.bar": "meh"}
         */
        var flattenObject = function(ob) {
            var toReturn = {};
            for (var i in ob) {
                if (!ob.hasOwnProperty(i)) continue;

                if ((typeof ob[i]) === 'object') {
                    var flatObject = flattenObject(ob[i]);
                    for (var x in flatObject) {
                        if (!flatObject.hasOwnProperty(x)) continue;
                        toReturn[i + '.' + x] = flatObject[x];
                    }
                } else {
                    toReturn[i] = ob[i];
                }
            }
            return toReturn;
        };

        function makeInputControl() {
            var selectOptions;
            var selectElem = select({
                class: 'form-control',
                dataElement: 'input',
                style: {
                    width: '100%'
                },
                multiple: dd_options.multiselection || false,
                id: html.genId()
            }, [option({ value: '' }, '')].concat(selectOptions));

            return selectElem;
        }

        // CONTROL
        function getControlValue() {
            var control = ui.getElement('input-container.input'),
                selected = $(control).select2('data')[0];

            var selection_val = selected[dd_options.selection_id] || selected.subpath;
            if (!selected || !selection_val) {
                // might have just started up, and we don't have a selection value, but
                // we might have a model value.
                var modelVal = getModelValue();
                if (modelVal) {
                    return modelVal;
                }
                else {
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
            var control = ui.getElement('input-container.input');
            if ($(control).find('option[value="' + value + '"]').length) {
                $(control).val(value).trigger('change');
            } else {
                var newOption = new Option(value, value, true, true);
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
            return Promise.try(function() {
                var selectedItem = getControlValue(),
                    validationConstraints = {
                        min_length: spec.data.constraints.min_length,
                        max_length: spec.data.constraints.max_length,
                        required: spec.data.constraints.required
                    };
                return Validation.validateText(selectedItem, validationConstraints);
            });
        }

        function genericClientCall(call_params) {
            var swUrl = runtime.config('services.service_wizard.url'),
            genericClient = new GenericClient(swUrl, {
                token: runtime.authToken()
            });
            return genericClient.sync_call(dd_options.service_function,
                call_params, null, null, dd_options.service_version || 'release');
        }

        function fetchData(searchTerm) {
            searchTerm = searchTerm || '';
            var call_params = JSON.stringify(dd_options.service_params).replace("{{dynamic_dropdown_input}}", searchTerm);
            call_params =  JSON.parse(call_params);

            if (dataSource === 'ftp_staging') {
                return Promise.resolve(stagingService.search({query: searchTerm}))
                    .then(function(results) {
                        results = JSON.parse(results).filter(function(file) {
                            return !file.isFolder;
                        });
                        results.forEach(function(file) {
                            file.text = file.path;
                            file.subdir = file.path.substring(0, file.path.length - file.name.length);
                            file.subpath = file.path.substring(userId.length + 1);
                            file.id = file.subpath;
                        });
                        return results;
                    });
            } else if (dataSource === 'search') {
                if (Array.isArray(call_params)){
                    call_params = call_params[0];
                }
                return Promise.resolve(searchClient.search_objects(call_params))
                    .then(function (results) {
                        results.objects.forEach(function(obj, index) {
                            obj = flattenObject(obj);
                            obj.id = obj.guid;
                            obj.text = obj[dd_options.selection_id];
                            results.objects[index] = obj;
                        });
                        return results.objects;
                    });
            } else {
                return Promise.resolve(genericClientCall(call_params))
                    .then(function (results) {
                        if (results[0][0]) {
                            return results[0];
                        }
                        return [];
                    });
            }
        }

        function doChange() {
            validate()
                .then(function(result) {
                    if (result.isValid) {
                        var newValue = result.parsedValue === undefined ? result.value : result.parsedValue;
                        model.value = newValue;
                        channel.emit('changed', {
                            newValue: newValue
                        });
                    } else if (result.diagnosis === 'required-missing') {
                        model.value = spec.data.nullValue;
                        channel.emit('changed', {
                            newValue: spec.data.nullValue
                        });
                    }
                    channel.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
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
            if (dataSource === 'ftp_staging') {
                if (!ret_obj.id) {
                    return $('<div style="display:block; height:20px">').append(ret_obj.text);
                }
                return $(div([
                    span({style: 'word-wrap: break-word'}, [
                        ret_obj.subdir,
                        b(ret_obj.name)
                    ]),
                    div({style: 'margin-left: 7px'}, [
                        'Size: ' + StringUtil.readableBytes(ret_obj.size) + '<br>',
                        'Uploaded ' + TimeFormat.getTimeStampStr(ret_obj.mtime, true)
                    ])
                ]));
            } else {
                var replacer = function (match, p1, offset, string) {return ret_obj[p1]};
                var formatted_string;
                if (dd_options.description_template) {
                    // use slice to avoid modifying global description_template
                    formatted_string = dd_options.description_template.slice().replace(/{{(.+?)}}/g, replacer);
                } else {
                    formatted_string = JSON.stringify(ret_obj);
                }
                return  $('<div style="display:block; height:20px">').append(formatted_string);
            }
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function render() {
            return Promise.try(function() {
                var events = Events.make(),
                    inputControl = makeInputControl(events),
                    content = div({ class: 'input-group', style: { width: '100%' } }, inputControl);

                ui.setContent('input-container', content);

                $(ui.getElement('input-container.input')).select2({
                    templateResult: formatObjectDisplay,
                    templateSelection: function(object) {
                        if (dd_options.selection_id) {
                            return object[dd_options.selection_id];
                        }
                        if (!object.id) {
                            return object.text;
                        }
                        return object.id;
                    },
                    ajax: {
                        delay: 250,
                        transport: function(params, success, failure) {
                            return fetchData(params.data.term)
                                .then(function(data) {
                                    success({results: data});
                                })
                                .catch(function(err) {
                                    console.error(err);
                                    failure(err);
                                });
                        }
                    }
                }).on('change', function() {
                    doChange();
                }).on('advanced-shown.kbase', function(e) {
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
            var content = div({
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
                .then(function(result) {
                    channel.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        // LIFECYCLE API
        function start(arg) {
            return Promise.try(function() {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                var events = Events.make(),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents(container);

                if (config.initialValue !== undefined) {
                    // note this might come from a different workspace...
                    model.value = config.initialValue;
                }

                return render()
                    .then(function() {
                        channel.on('reset-to-defaults', function() {
                            resetModelValue();
                        });
                        channel.on('update', function(message) {
                            setModelValue(message.value);
                        });
                        setControlValue(getModelValue());
                        autoValidate();
                    });
            });
        }

        function stop() {
            return Promise.try(function() {
                if (container) {
                    parent.removeChild(container);
                }
                bus.stop();
                eventListeners.forEach(function(id) {
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
