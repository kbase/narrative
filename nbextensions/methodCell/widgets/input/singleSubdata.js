/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'bluebird',
    'kb_common/html',
    'kb_service/client/workspace',
    'kb_service/utils',
    '../../validation',
    '../../events',
    '../../runtime',
    'bootstrap',
    'css!font-awesome'
], function ($, Promise, html, Workspace, serviceUtils, Validation, Events, Runtime) {
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
        select = t('select'), option = t('option');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            subdataOptions = spec.spec.textsubdata_options,
            parent,
            container,
            $container,
            workspaceId = config.workspaceId,
            subdata = spec.textsubdata_options,
            bus = config.bus,
            runCount = 0,
            model = {
                referenceObjectName: 'SomeFakeData',
                availableValues: null,
                value: null
            },
            options = {
                objectSelectionPageSize: 20
            },
            runtime = Runtime.make();

        // Validate configuration.
        if (!workspaceId) {
            throw new Error('Workspace id required for the object widget');
        }
        //if (!workspaceUrl) {
        //    throw new Error('Workspace url is required for the object widget');
        //}

        options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
        options.multiple = spec.multipleItems();
        options.required = spec.required();
        options.enabled = true;

        function makeInputControl(events, bus) {
            // There is an input control, and a dropdown,
            // TODO select2 after we get a handle on this...
            var selectOptions,
                size = 1,
                multiple = false;
            if (subdataOptions.multiselection) {
                size = 10;
                multiple = true;
            }
            if (model.availableValues) {
                selectOptions = model.availableValues.map(function (value) {
                    var selected = false,
                        optionLabel = value.id,
                        optionValue = value.id; // JSON.stringify(value);
                    // TODO: pull the value out of the object
                    if (value.dataname === model.value) {
                        selected = true;
                    }
                    return option({
                        value: optionValue,
                        selected: selected
                    }, optionLabel);
                });
            }

            // CONTROL
            return select({
                id: events.addEvent({type: 'change', handler: function (e) {
                        validate()
                            .then(function (result) {
                                if (result.isValid) {
                                    bus.send({
                                        type: 'changed',
                                        newValue: result.value
                                    });
                                } else if (result.diagnosis === 'required-missing') {
                                    bus.send({
                                        type: 'changed',
                                        newValue: result.value
                                    });
                                }
                                bus.send({
                                    type: 'validation',
                                    errorMessage: result.errorMessage,
                                    diagnosis: result.diagnosis
                                });
                            });
                    }}),
                size: size,
                multiple: multiple,
                class: 'form-control',
                dataElement: 'input'
            }, [option({value: ''}, '')].concat(selectOptions));
        }

        function setupSelect2($input, placeholder, defaultValue, multiselection,
            show_src_obj, allow_custom) {
            var noMatchesFoundStr = "No matching data found or loaded yet.",
                multiple = subdataOptions.multiselection ? true : false,
                showSourceOjbect = subdataOptions.show_src_obj ? true : false,
                allowCustom = subdataOptions.allow_custom ? true : false;
            
            function select2Matcher(term, text) {
                return text.toUpperCase().indexOf(term.toUpperCase())>=0;
            }
            
            $input.select2({
                matcher: select2Matcher,
                formatNoMatches: noMatchesFoundStr,
                placeholder: placeholder,
                allowClear: true,
                selectOnBlur: true,
                multiple: multiple,
                tokenSeparators: [',', ' '],
                query: function (query) {
                    var data = {results: []};

                    // if there is a current selection (this is a bit of a hack) we
                    // prefill the input box so we don't have to do additional typing
                    if (!multiple && query.term.trim() === "" && $input.select2('data') && $input.data('select2').kbaseHackLastSelection) {
                        var searchbox = $input.data('select2').search;
                        if (searchbox) {
                            $(searchbox).val($input.select2('data').id);
                            query.term = $input.select2('data').id;
                            $input.data('select2').kbaseHackLastSelection = null;
                        }
                    }
                    $input.data('select2').kbaseHackLastTerm = query.term;

                    // populate the names from our valid data object list
                    var exactMatch = false;
                    
                    if (model.availableValues) {
                        model.availableValues.forEach(function (value) {
                            var text = ' '; // for some reason, this has to be nonempty in some cases
                            if (value.desc) {
                                text = value.desc;
                            }
                            if (query.term.trim() !== '') {
                                if (select2Matcher(query.term, value.id) ||
                                    select2Matcher(query.term, text) ||
                                    select2Matcher(query.term, value.objectName)) {
                                    data.results.push({
                                        id: value.id, 
                                        text: text,
                                        objectRef: value.objectRef, 
                                        objectName: value.objectName
                                    });
                                }
                            } else {
                                data.results.push({
                                    id: value.id, 
                                    text: text,
                                    objectRef: value.objectRef, 
                                    objectName: value.objectName
                                });
                            }
                        });
                    }

                    //allow custom names if specified and multiselect is off (for some reason
                    //custome fields don't work in multiselect mode) then unshift it to the front...
                    if (allow_custom && !multiple && query.term.trim() !== '') {
                        data.results.unshift({
                            id: query.term, 
                            text: ''
                        });
                    }

                    // paginate results
                    var pageSize = options.objectSelectionPageSize;
                    query.callback({
                        results: data.results.slice((query.page - 1) * pageSize, query.page * pageSize),
                        more: data.results.length >= query.page * pageSize
                    });
                },
                formatSelection: function (object, container) {
                    var display = '<span class="kb-parameter-data-selection">' + object.id + '</span>';
                    return display;
                },
                formatResult: function (object, container, query) {
                    var display = '<span style="word-wrap:break-word;"><b>' + object.id + '</b>';
                    if (object.text)
                        display += object.text;
                    if (show_src_obj && object.dname)
                        display += '<br>&nbsp&nbsp&nbsp&nbsp&nbsp<i>in ' + object.dname + '</i>';
                    display += '</span>';
                    return display;
                }
            })
                .on("select2-selecting",
                    function (e) {
                        $input.data('select2').kbaseHackLastSelection = e.choice;
                    });

            if (defaultValue) {
                $input.select2("data", {id: defaultValue, text: defaultValue});
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
            return $container.find('[data-element="input-container"] [data-element="input"]').val();
        }

        function setModelValue(value) {
            return Promise.try(function () {
                if (model.value !== value) {
                    model.value = value;
                    return true;
                }
                return false;
            })
                .then(function (changed) {
                    return render();
                });
        }

        function unsetModelValue() {
            return Promise.try(function () {
                model.value = undefined;
            })
                .then(function (changed) {
                    render();
                });
        }

        function resetModelValue() {
            if (spec.spec.default_values && spec.spec.default_values.length > 0) {
                setModelValue(spec.spec.default_values[0]);
            } else {
                unsetModelValue();
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

                return Validation.validateWorkspaceObjectName(rawValue, validationOptions);
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

        function getObjectsByType(type) {
            var workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken()
            });
            return workspace.list_objects({
                type: type,
                ids: [workspaceId]
            })
                .then(function (data) {
                    return data.map(function (objectInfo) {
                        return serviceUtils.objectInfoToObject(objectInfo);
                    });
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


        function fetchData() {
            if (!model.referenceObjectName) {
                return Promise.try(function () {
                    return null;
                });
            }
            var workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken()
            }),
                options = spec.spec.textsubdata_options,
                subObjectIdentity = {
                    ref: workspaceId + '/' + model.referenceObjectName,
                    included: options.subdata_selection.subdata_included
                };
            return workspace.get_object_subset([
                subObjectIdentity
            ])
                .then(function (results) {
                    // We have only one ref, so should just be one result.
                    var values = [];
                    results.forEach(function (result) {
                        if (!result) {
                            return;
                        }
                        var subdata = getProp(result.data, options.subdata_selection.path_to_subdata);
                        if (subdata instanceof Array) {
                            subdata.forEach(function (datum) {
                                values.push({
                                    id: datum,
                                    desc: 'n/a', // TODO
                                    objectRef: [result[6], result[0], result[4]].join('/'),
                                    objectName: result[1]
                                });
                            });
                        } else {
                            Object.keys(subdata).forEach(function (key) {
                                var datum = subdata[key],
                                    id = key,
                                    selectionId = options.subdata_selection.selection_id;

                                if (selectionId) {
                                    switch (typeof datum) {
                                        case 'object':
                                            id = datum[selectionId];
                                            break;
                                        case 'string':
                                        case 'number':
                                            if (selectionId === 'value') {
                                                id = datum;
                                            }
                                            break;
                                    }
                                }

                                values.push({
                                    id: key,
                                    desc: 'n/a', // todo
                                    objectRef: [result.info[6], result.info[0], result.info[4]].join('/'),
                                    objectName: result.info[1]
                                });
                            });
                        }
                    });
                    return values;
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

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function render() {
            return Promise.try(function () {
                var events = Events.make(),
                    inputControl = makeInputControl(events, bus),
                    content = div({class: 'input-group', style: {width: '100%'}}, inputControl);

                $container.find('[data-element="input-container"]').html(content);
                events.attachEvents(container);
            })
                .then(function () {
                    return autoValidate();
                });
        }

        function renderx() {
            return Promise.try(function () {
                container.innerHTML = 'WILL BE...';
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
                div({dataElement: 'input-container'})
            ]);
            return {
                content: content,
                events: events
            };
        }

        function autoValidate() {
            return validate()
                .then(function (result) {
                    bus.send({
                        type: 'validation',
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        // LIFECYCLE API

        function init() {
        }

        function attach(node) {
            return Promise.try(function () {
                parent = node;
                container = node.appendChild(document.createElement('div'));
                $container = $(container);

                var events = Events.make(),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents(container);
            });
        }

        function start() {
            return Promise.try(function () {
                bus.on('reset-to-defaults', function (message) {
                    resetModelValue();
                });
                bus.on('update', function (message) {
                    setModelValue(message.value);
                });
                // This control has a dependency relationship in that its
                // selection of available values is dependent upon a sub-property
                // of an object referenced by another parameter.
                // Rather than explicitly refer to that parameter, we have a
                // generic capability to receive updates for that value, after
                // which we re-fetch the values, and re-render the control.
                bus.on('update-reference-object', function (message) {
                    setReferenceValue(message.objectRef);
                });
                bus.send({type: 'sync'});
            });
        }

        function run(params) {
            return Promise.try(function () {
                return fetchData(params);
            })
                .then(function (data) {
                    console.log('GOOOOT', data);
                    model.availableValues = data;
                    render();
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                })
        }

        return {
            init: init,
            attach: attach,
            start: start,
            run: run
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});