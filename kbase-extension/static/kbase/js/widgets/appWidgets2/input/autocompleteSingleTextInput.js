/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'bluebird',
    'base/js/namespace',
    'kb_common/html',
    'common/validation',
    'common/events',
    'common/dom',
    'common/runtime',
    '../inputUtils',
    'bloodhound',
    'narrativeConfig',
    'Taxonomy-client-api',
    'kbase-generic-client-api',

    'typeahead',
    'bootstrap',
    'css!font-awesome'
], function(
    $,
    Promise,
    Jupyter,
    html,
    Validation,
    Events,
    Dom,
    Runtime,
    inputUtils,
    Bloodhound,
    Config,
    TaxonomyClientAPI,
    GenericClient
) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        var options = {},
            constraints,
            parent,
            container,
            bus = config.bus,
            dom,
            model = {
                value: undefined
            };

        if (config.parameterSpec) {
            constraints = config.parameterSpec.data.constraints;
        } else {
            constraints = config.constraints;
        }

        //
        // Validate configuration.
        // Nothing to do...

        options.enabled = true;


        /*
         * If the parameter is optional, and is empty, return null.
         * If it allows multiple values, wrap single results in an array
         * There is a weird twist where if it ...
         * well, hmm, the only consumer of this, isValid, expects the values
         * to mirror the input rows, so we shouldn't really filter out any
         * values.
         */

        function getInputValue() {
            return dom.getElement('autocomplete-container.input').value;
        }

        function setModelValue(value) {
            return Promise.try(function() {
                    if (model.value !== value) {
                        model.value = value;
                        return true;
                    }
                    return false;
                })
                .then(function(changed) {
                    render();
                });
        }

        function unsetModelValue() {
            return Promise.try(function() {
                    model.value = undefined;
                })
                .then(function(changed) {
                    render();
                });
        }

        function resetModelValue() {
            if (constraints.defaultValue) {
                setModelValue(constraints.defaultValue);
            } else {
                unsetModelValue();
            }
        }

        /*
         *
         * Text fields can occur in multiples.
         * We have a choice, treat single-text fields as a own widget
         * or as a special case of multiple-entry --
         * with a min-items of 1 and max-items of 1.
         *
         *
         */

        function validate(rawValue) {
            return Promise.try(function() {
                if (!options.enabled) {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: 'disabled'
                    };
                }
                if (rawValue === undefined) {
                    rawValue = getInputValue();
                }
                return Validation.validateTextString(rawValue, constraints);
            });
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function handleChange(newValue) {
            validate(newValue)
                .then(function(result) {
                    if (result.isValid) {
                        setModelValue(result.parsedValue);
                        bus.emit('changed', {
                            newValue: result.parsedValue
                        });
                    } else if (result.diagnosis === 'required-missing') {
                        setModelValue(result.parsedValue);
                        bus.emit('changed', {
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
                            dom.setContent('autocomplete-container.message', message.content);
                            message.events.attachEvents();
                        }
                    }

                    bus.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }

        function makeInputControl(currentValue) {
            return input({
                id: html.genId(),
                class: 'form-control',
                dataElement: 'input',
                value: currentValue
            });
        }

        function render() {
            var ic_id;

            Promise.try(function() {
                    var events = Events.make(),
                        inputControl = makeInputControl(model.value, events, bus);
                    dom.setContent('autocomplete-container', inputControl);
                    ic_id = $(inputControl).attr('id');
                    events.attachEvents(container);
                })
                .then(function() {
                    setTimeout(function() {
                        var genericClient = new GenericClient(Config.url('service_wizard'), { token: Runtime.make().authToken() });

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
                                    genericClient.sync_call("taxonomy_service.search_taxonomy", [{
                                        private: 0,
                                        public: 1,
                                        search: options.url,
                                        limit: 10,
                                        start: 0
                                    }]).then(function(d) {
                                        onSuccess(d[0]);
                                    }).fail(function(e) {
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
                            // for 'chnage' it is the display value as defined above.
                            // e.g. 
                            // category: "public"
                            // id: "1779/300381/1"
                            // label: "Klebsiella sp. ok1_1_9_S34"
                            // parent: "Klebsiella"
                            // parent_ref: "1779/139747/1"
                            // console.log('suggestion', suggestion);
                            handleChange(suggestion.label);
                        });
                    }, 1);
                    return autoValidate();
                });
        }

        function layout(events) {
            var content = div({
                dataElement: 'main-panel'
            }, [
                div({ dataElement: 'autocomplete-container' })
            ]);
            return {
                content: content,
                events: events
            };
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


        // LIFECYCLE API

        function start() {
            return Promise.try(function() {
                bus.on('run', function(message) {

                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    dom = Dom.make({ node: message.node });

                    var events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents(container);

                    bus.on('reset-to-defaults', function(message) {
                        resetModelValue();
                    });
                    bus.on('update', function(message) {
                        setModelValue(message.value);
                    });
                    bus.emit('sync');
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