define([
    'bluebird',
    'jquery',
    'common/html',
    'common/events',
    'common/runtime',
    'common/ui',
    'kb_sdk_clients/genericClient',
    '../validators/constants',

    'select2',
    'bootstrap',
], (Promise, $, html, Events, Runtime, UI, GenericClient, Constants) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        select = t('select'),
        option = t('option'),
        cssBaseClass = 'kb-select2-taxonomy-ref';

    function factory(config) {
        const spec = config.parameterSpec,
            runtime = Runtime.make(),
            bus = runtime.bus().connect(),
            channel = bus.channel(config.channelName),
            model = {
                value: undefined,
            };
        let parent, container, ui;

        function makeInputControl() {
            return select(
                {
                    class: 'form-control',
                    dataElement: 'input',
                },
                [option({ value: '' }, '')]
            );
        }

        // CONTROL

        function getControlValue() {
            const control = ui.getElement('input-container.input');
            return $(control).val();
        }

        function setControlValue(value) {
            const control = ui.getElement('input-container.input');
            $(control).val(value).trigger('change.select2');
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
                const value = getControlValue();
                return {
                    isValid: true,
                    validated: true,
                    diagnosis: Constants.DIAGNOSIS.VALID,
                    errorMessage: null,
                    value: value,
                    parsedValue: value,
                };
            });
        }

        function doChange() {
            validate().then((result) => {
                if (result.isValid) {
                    model.value = result.parsedValue;
                    channel.emit('changed', {
                        newValue: result.parsedValue,
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

        function doTemplateResult(item) {
            return $(
                div(
                    {
                        class: `${cssBaseClass}__item`,
                    },
                    item.label || ''
                )
            );
        }

        function doTemplateSelection(item) {
            return $(
                div(
                    {
                        class: `${cssBaseClass}__item`,
                    },
                    item.label
                )
            );
        }

        const pageSize = 10;

        function doTaxonomySearch(data) {
            const term = data.q;
            const page = data.page;
            let startItem;
            if (page) {
                startItem = pageSize * (page - 1);
            } else {
                startItem = 0;
            }

            // globals
            const startTime = new Date().getTime();
            const taxonClient = new GenericClient({
                url: runtime.config('services.service_wizard.url'),
                module: 'taxonomy_service',
                token: Runtime.make().authToken(),
            });
            return taxonClient
                .callFunc('search_taxonomy', [
                    {
                        private: 0,
                        public: 1,
                        search: term,
                        limit: pageSize,
                        start: startItem,
                    },
                ])
                .then((result) => {
                    const elapsedTime = new Date().getTime() - startTime;
                    // eslint-disable-next-line no-console
                    console.log(
                        'Loaded data ' +
                            result[0].hits.length +
                            ' items of ' +
                            result[0].num_of_hits +
                            ' in ' +
                            elapsedTime +
                            'ms'
                    );
                    return result[0];
                });
        }

        function getTaxonomyItem(taxonObject) {
            const ref = taxonObject,
                taxonClient = new GenericClient({
                    url: runtime.config('services.service_wizard.url'),
                    module: 'TaxonAPI',
                    token: Runtime.make().authToken(),
                });
            return taxonClient.callFunc('get_scientific_name', [ref]).then((result) => {
                if (result.length === 0) {
                    throw new Error('Cannot find taxon: ' + ref);
                }
                if (result.length > 1) {
                    throw new Error('Too many taxa found for ' + ref);
                }
                // simulate the result from the taxonomy service
                return [
                    {
                        id: taxonObject,
                        label: result[0],
                    },
                ];
            });
        }

        function render() {
            return Promise.try(() => {
                const events = Events.make(),
                    inputControl = makeInputControl(),
                    content = div({ class: 'input-group', style: { width: '100%' } }, inputControl);

                ui.setContent('input-container', content);

                $(ui.getElement('input-container.input'))
                    .select2({
                        templateResult: doTemplateResult,
                        templateSelection: doTemplateSelection,
                        minimumInputLength: 2,
                        escapeMarkup: function (markup) {
                            return markup;
                        },
                        initSelection: function (element, callback) {
                            const currentValue = model.value;
                            if (!currentValue) {
                                return;
                            }
                            getTaxonomyItem(currentValue).then((taxon) => {
                                callback(taxon);
                            });
                        },
                        language: {
                            loadingMore: function () {
                                return html.loading('Loading more scientific names');
                            },
                        },
                        ajax: {
                            service: 'myservice',
                            dataType: 'json',
                            delay: 500,
                            data: function (params) {
                                return {
                                    q: params.term,
                                    page: params.page,
                                };
                            },
                            processResults: function (data, params) {
                                params.page = params.page || 1;
                                return {
                                    results: data.hits,
                                    pagination: {
                                        more: params.page * pageSize < data.num_of_hits,
                                    },
                                };
                            },
                            transport: function (options, success, failure) {
                                let status = null;

                                doTaxonomySearch(options.data)
                                    .then((results) => {
                                        success(results);
                                    })
                                    .catch(() => {
                                        status = 'error';
                                        failure();
                                    });
                                return {
                                    status: status,
                                };
                            },
                        },
                    })
                    .on('change', () => {
                        doChange();
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
                    model.value = config.initialValue;
                }

                render().then(() => {
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
                    $(ui.getElement('input-container.input')).off('change');
                    $(ui.getElement('input-container.input')).select2('destroy');
                    container.remove();
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
