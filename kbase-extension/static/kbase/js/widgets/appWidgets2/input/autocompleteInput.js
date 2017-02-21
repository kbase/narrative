/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'bluebird',
    'bloodhound',
    'kb_common/html',
    'kb_service/client/workspace',
    'kb_sdk_clients/genericClient',
    'Taxonomy-client-api',
    'kbase-generic-client-api',
    'narrativeConfig',
    'common/validation',
    'common/events',
    'common/ui',
    'common/runtime',
    '../inputUtils',

    'typeahead',
    'bootstrap',
    'css!font-awesome'
], function(
    $,
    Promise,
    Bloodhound,
    html,
    Workspace,
    GenericSdkClient,
    TaxonomyClientAPI,
    GenericClient,
    Config,
    Validation,
    Events,
    UI,
    Runtime,
    inputUtils
) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        var spec = config.parameterSpec,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            parent,
            container,
            ui,
            runtime = Runtime.make(),
            places = {
                autocompleteControl: null
            },
            model = {
                value: undefined
            };

        function getInputValue() {
            return ui.getElement('autocomplete-container.input').value;
        }

        function setModelValue(value) {
            return Promise.try(function() {
                if (model.value !== value) {
                    model.value = value;
                    channel.emit('changed', {
                        newValue: value
                    });
                }
            });
        }

        function resetModelValue() {
            model.value = spec.data.defaultValue;
        }

        // VALIDATION

        function validate(rawValue) {
            return Promise.try(function() {
                if (rawValue === undefined) {
                    rawValue = getInputValue();
                }
                return Validation.validateTextString(rawValue, spec.data.constraints);
            });
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


        // DOM EVENTS

        function handleChange(newValue) {
            validate(newValue)
                .then(function(result) {
                    if (result.isValid) {
                        setModelValue(result.parsedValue);
                        syncModelToControl();
                    } else if (result.diagnosis === 'required-missing') {
                        setModelValue(result.parsedValue);
                        syncModelToControl();
                        channel.emit('changed', {
                            newValue: result.parsedValue
                        });
                    } else {
                        if (config.showOwnMessages) {
                            var message = inputUtils.buildMessageAlert({
                                title: 'ERROR',
                                type: 'danger',
                                id: result.messageId,
                                message: result.errorMessage
                            });
                            ui.setContent('autocomplete-container.message', message.content);
                            message.events.attachEvents();
                        }
                    }

                    channel.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        // RENDERING

        function makeInputControl(currentValue) {
            return div({
                class: 'form-group',
                style: {
                    border: '1px green dotted'
                }
            }, [
                input({
                    id: html.genId(),
                    class: 'form-control',
                    dataElement: 'input',
                    style: {
                        width: '100%'
                    }
                }),
                div({
                    dataElement: 'scientific-name',
                    style: {
                        border: '1px silver solid'
                    }
                }, 'xxx')
            ]);
        }

        function render() {
            var ic_id;

            Promise.try(function() {
                    var events = Events.make(),
                        inputControl = makeInputControl(model.value, events);
                    ui.setContent('autocomplete-container', inputControl);
                    // This is saved because the autocomplete control clones this input and 
                    // we won't be able to query for it as we might expect!
                    places.autocompleteControl = ui.getElement('autocomplete-container.input');
                    ic_id = $(ui.getElement('autocomplete-container.input')).attr('id');
                    events.attachEvents(container);
                })
                .then(function() {
                    setTimeout(function() {
                        var genericClient = new GenericClient(Config.url('service_wizard'), {
                            token: Runtime.make().authToken()
                        });

                        var dog = new Bloodhound({
                            datumTokenizer: Bloodhound.tokenizers.whitespace,
                            queryTokenizer: Bloodhound.tokenizers.whitespace,
                            // `states` is an array of state names defined in "The Basics"
                            remote: {
                                url: 'http://kbase.us/some/fake/url', //bloodhound remote requires a URL
                                filter: function(query, settings) {
                                    return query.hits;
                                },
                                prepare: function(settings) {
                                    return settings;
                                },
                                transport: function(options, onSuccess, onError) {
                                    console.log('transport', options);
                                    genericClient.sync_call("taxonomy_service.search_taxonomy", [{
                                        private: 0,
                                        public: 1,
                                        search: options.url,
                                        limit: 10,
                                        start: 0
                                    }]).then(function(d) {
                                        console.log('success', d);
                                        onSuccess(d[0]);
                                    }).catch(function(e) {
                                        onError(e);
                                    });
                                }
                            }
                        });
                        var $control = $('#' + ic_id);
                        $control.typeahead({
                            hint: true,
                            highlight: true,
                            minLength: 2,
                            limit: 10
                        }, {
                            name: 'states',
                            source: dog,
                            display: function(v) {
                                return v.label
                            }
                        });
                        $control.bind('typeahead:select', function(e, suggestion) {
                            // NB for 'select' event it is the suggestion object,
                            // for 'change' it is the display value as defined above.
                            // e.g. 
                            // category: "public"
                            // id: "1779/300381/1"
                            // label: "Klebsiella sp. ok1_1_9_S34"
                            // parent: "Klebsiella"
                            // parent_ref: "1779/139747/1"
                            console.log('suggestion', suggestion);

                            handleChange(suggestion.id);
                        });
                    }, 1);
                    return autoValidate();
                });
        }

        function layout() {
            return div({
                dataElement: 'main-panel'
            }, [
                div({ dataElement: 'autocomplete-container' })
            ]);
        }

        function getTaxonObjectyy(objectRef) {
            var workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken()
            });
            return workspace.get_objects2({
                    objects: [{
                        ref: objectRef
                    }],
                    ignoreErrors: 1,
                    no_data: 0
                })
                .then(function(result) {
                    return result[0];
                });
        }

        function getTaxonObjectx(objectRef) {
            var genericClient = new GenericClient(Config.url('service_wizard'), {
                token: Runtime.make().authToken()
            });
            return genericClient.sync_call('taxonomy_service.get_taxonomies_by_id', [{
                    taxonomy_object_refs: [
                        objectRef
                    ]
                }])
                .then(function(result) {
                    console.log('HERE', result);
                    return result[0];
                })
        }

        function getScientificName(objectRef) {
            var taxonClient = new GenericSdkClient({
                url: Config.url('service_wizard'),
                module: 'TaxonAPI',
                // version: 'dev',
                token: Runtime.make().authToken()
            });
            return taxonClient.callFunc('get_scientific_name', [objectRef])
                .then(function(result) {
                    if (result.length === 0) {
                        throw new Error('Cannot find taxon: ' + objectRef);
                    }
                    if (result.length > 1) {
                        throw new Error('Too many taxa found for ' + objectRef);
                    }
                    return result[0];
                })
        }

        // Call this whenever you need the state of the model to be reflected in the control.
        function syncModelToControl() {
            return Promise.try(function() {
                var modelValue;

                if (model.value === undefined) {
                    // should never be the case ...
                    // should either be the nullValue, defaultValue, or the present value.
                    modelValue = '';
                } else if (model.value === spec.data.nullValue) {
                    modelValue = '';
                } else {
                    modelValue = model.value;
                }
                // ui.getElement('autocomplete-container.input').value = controlValue;
                if (modelValue === '') {
                    ui.getElement('autocomplete-container.input').value = '';
                    return null;
                }
                console.log('syncing', modelValue);
                return getScientificName(modelValue)
                    .then(function(scientificName) {
                        console.log('sci name', scientificName);
                        $(places.autocompleteControl).typeahead('val', scientificName);
                        // $(ui.getElement('autocomplete-container.input')).val(scientificName);
                        // ui.getElement('autocomplete-container.input').value = scientificName;
                        // $(ui.getElement('autocomplete-container.input')).val(scientificName);

                    });
            });
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(function() {
                    parent = arg.node;
                    container = parent.appendChild(document.createElement('div'));
                    ui = UI.make({ node: arg.node });

                    var events = Events.make();
                    container.innerHTML = layout(events);
                    events.attachEvents(container);

                    setModelValue(config.initialValue);

                    channel.on('reset-to-defaults', function() {
                        resetModelValue();
                    });
                    channel.on('update', function(message) {
                        setModelValue(message.value);
                    });

                    // bus.emit('sync');
                    return render();
                })
                .then(function() {
                    return syncModelToControl();
                });
        }

        function stop() {
            return Promise.try(function() {
                if (container) {
                    parent.removeChild(container);
                }
                busConnection.stop();
            });
        }

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