define([
    'bluebird',
    'jquery',
    'kb_common/html',
    'kb_common/utils',
    'kb_service/client/workspace',
    'kb_service/utils',
    'common/validation',
    'common/events',
    'common/runtime',
    'common/ui',
    'common/data',
    'util/timeFormat',
    'kb_sdk_clients/genericClient',

    'select2',
    'bootstrap',
    'css!font-awesome',
], (
    Promise,
    $,
    html,
    utils,
    Workspace,
    serviceUtils,
    Validation,
    Events,
    Runtime,
    UI,
    Data,
    TimeFormat,
    GenericClient
) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        let spec = config.parameterSpec,
            parent,
            container,
            runtime = Runtime.make(),
            bus = runtime.bus().connect(),
            channel = bus.channel(config.channelName),
            ui,
            model = {
                value: undefined,
            },
            eventListeners = [];

        function makeInputControl() {
            let selectOptions;
            const selectElem = select(
                {
                    class: 'form-control',
                    dataElement: 'input',
                },
                [option({ value: '' }, '')].concat(selectOptions)
            );

            return selectElem;
        }

        // CONTROL

        function getControlValue() {
            const control = ui.getElement('input-container.input');
            return $(control).val();
        }

        function setControlValue(value) {
            let stringValue;
            if (value === null) {
                stringValue = '';
            } else {
                stringValue = value;
            }

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
                    diagnosis: 'valid',
                    errorMessage: null,
                    value: value,
                    parsedValue: value,
                };
            });
        }

        function doTemplateResult(item) {
            // console.log('template', item);
            if (!item.id) {
                return $(
                    div(
                        {
                            style: {
                                display: 'block',
                                height: '20px',
                            },
                        },
                        item.label || ''
                    )
                );
            }
            return $(
                div(
                    {
                        style: {
                            display: 'block',
                        },
                    },
                    item.label
                )
            );
        }

        function doTemplateSelection(item) {
            return $(
                div(
                    {
                        style: {
                            display: 'block',
                        },
                    },
                    item.label
                )
            );
        }

        let totalItems;
        let currentPage;
        let currentStartItem;
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
            currentPage = page;
            currentStartItem = startItem;
            const start = new Date().getTime();

            const taxonClient = new GenericClient({
                url: runtime.config('services.service_wizard.url'),
                module: 'taxonomy_service',
                // version: 'dev',
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
                    // var elapsed = new Date().getTime() - start;
                    // console.log('Loaded data ' + result[0].hits.length + ' items of ' + result[0].num_of_hits + ' in ' + elapsed + 'ms');
                    totalItems = result[0].num_of_hits;
                    return result[0];
                });
        }

        function getTaxonomyItem(taxonObject) {
            // console.log('get taxonomy', taxonObject);
            const ref = taxonObject,
                taxonClient = new GenericClient({
                    url: runtime.config('services.service_wizard.url'),
                    module: 'TaxonAPI',
                    // version: 'dev',
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
                    inputControl = makeInputControl(events),
                    content = div({ class: 'input-group', style: { width: '100%' } }, inputControl);

                ui.setContent('input-container', content);

                $(ui.getElement('input-container.input')).select2({
                    disabled: true,
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
                            // console.log('TAXON', taxon);
                            callback(taxon);
                        });
                    },
                    formatMoreResults: function (page) {
                        return 'more???';
                    },
                    language: {
                        loadingMore: function (arg) {
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
                            // console.log('processing', data, params);
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
                                .catch((err) => {
                                    status = 'error';
                                    failure();
                                });
                            // console.log('transport got ', options);

                            return {
                                status: status,
                            };
                        },
                    },
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
                    // bus.channel().on('workspace-changed', function() {
                    //     doWorkspaceChanged();
                    // });
                    // bus.emit('sync');

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
                eventListeners.forEach((id) => {
                    runtime.bus().removeListener(id);
                });
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
