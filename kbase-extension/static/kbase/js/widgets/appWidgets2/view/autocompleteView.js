define([
    'jquery',
    'bluebird',
    'kb_common/html',
    'common/validation',
    'common/events',
    'common/ui',
    'common/runtime',
    '../inputUtils',
    'bloodhound',
    'narrativeConfig',
    'Taxonomy-client-api',
    'kbase-generic-client-api',

    'typeahead',
    'bootstrap',
    'css!font-awesome',
], (
    $,
    Promise,
    html,
    Validation,
    Events,
    UI,
    Runtime,
    inputUtils,
    Bloodhound,
    Config,
    TaxonomyClientAPI,
    GenericClient
) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        let bus = config.bus,
            spec = config.parameterSpec,
            parent,
            container,
            ui,
            model = {
                value: undefined,
            };

        function getInputValue() {
            return ui.getElement('autocomplete-container.input').value;
        }

        function setModelValue(value) {
            return Promise.try(() => {
                if (model.value !== value) {
                    model.value = value;
                    bus.emit('changed', {
                        newValue: value,
                    });
                }
            });
        }

        function resetModelValue() {
            model.value = spec.data.defaultValue;
        }

        // VALIDATION

        function validate(rawValue) {
            return Promise.try(() => {
                if (rawValue === undefined) {
                    rawValue = getInputValue();
                }
                return Validation.validateTextString(rawValue, spec.data.constraints);
            });
        }

        function autoValidate() {
            return validate().then((result) => {
                bus.emit('validation', {
                    errorMessage: result.errorMessage,
                    diagnosis: result.diagnosis,
                });
            });
        }

        // DOM EVENTS

        function handleChange(newValue) {
            validate(newValue).then((result) => {
                if (result.isValid) {
                    setModelValue(result.parsedValue);
                } else if (result.diagnosis === 'required-missing') {
                    setModelValue(result.parsedValue);
                    bus.emit('changed', {
                        newValue: result.parsedValue,
                    });
                } else {
                    if (config.showOwnMessages) {
                        const message = inputUtils.buildMessageAlert({
                            title: 'ERROR',
                            type: 'danger',
                            id: result.messageId,
                            message: result.errorMessage,
                        });
                        ui.setContent('autocomplete-container.message', message.content);
                        message.events.attachEvents();
                    }
                }

                bus.emit('validation', {
                    errorMessage: result.errorMessage,
                    diagnosis: result.diagnosis,
                });
            });
        }

        // RENDERING

        function makeInputControl(currentValue) {
            return input({
                id: html.genId(),
                class: 'form-control',
                dataElement: 'input',
                style: {
                    width: '100%',
                },
                value: currentValue,
            });
        }

        function render() {
            let ic_id;

            Promise.try(() => {
                const events = Events.make(),
                    inputControl = makeInputControl(model.value, events, bus);
                ui.setContent('autocomplete-container', inputControl);
                ic_id = $(inputControl).attr('id');
                events.attachEvents(container);
            }).then(() => {
                setTimeout(() => {
                    const genericClient = new GenericClient(Config.url('service_wizard'), {
                        token: Runtime.make().authToken(),
                    });

                    const dog = new Bloodhound({
                        datumTokenizer: Bloodhound.tokenizers.whitespace,
                        queryTokenizer: Bloodhound.tokenizers.whitespace,
                        // `states` is an array of state names defined in "The Basics"
                        remote: {
                            url: 'http://kbase.us/some/fake/url', //bloodhound remote requires a URL
                            filter: function (query, settings) {
                                return query.hits;
                            },
                            prepare: function (settings) {
                                return settings;
                            },
                            transport: function (options, onSuccess, onError) {
                                genericClient
                                    .sync_call('taxonomy_service.search_taxonomy', [
                                        {
                                            private: 0,
                                            public: 1,
                                            search: options.url,
                                            limit: 10,
                                            start: 0,
                                        },
                                    ])
                                    .then((d) => {
                                        onSuccess(d[0]);
                                    })
                                    .catch((e) => {
                                        onError(e);
                                    });
                            },
                        },
                    });
                    const $control = $('#' + ic_id);
                    $control.typeahead(
                        {
                            hint: true,
                            highlight: true,
                            minLength: 2,
                            limit: 10,
                        },
                        {
                            name: 'states',
                            source: dog,
                            display: function (v) {
                                return v.label;
                            },
                        }
                    );
                    $control.bind('typeahead:select', (e, suggestion) => {
                        // NB for 'select' event it is the suggestion object,
                        // for 'change' it is the display value as defined above.
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

        function layout() {
            return div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'autocomplete-container' })]
            );
        }

        function syncModelToControl() {
            let controlValue;
            if (model.value === undefined) {
                // should never be the case ...
                // should either be the nullValue, defaultValue, or the present value.
                controlValue = '';
            } else if (model.value === spec.data.nullValue) {
                controlValue = '';
            } else {
                controlValue = model.value;
            }
            ui.getElement('autocomplete-container.input').value = controlValue;
        }

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: arg.node });

                const events = Events.make();
                container.innerHTML = layout(events);
                events.attachEvents(container);

                setModelValue(config.initialValue);

                bus.on('reset-to-defaults', () => {
                    resetModelValue();
                });
                bus.on('update', (message) => {
                    setModelValue(message.value);
                });

                // bus.emit('sync');
                return render();
            }).then(() => {
                syncModelToControl();
            });
        }

        function stop() {
            return Promise.try(() => {
                if (container) {
                    parent.removeChild(container);
                }
            });
        }

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
