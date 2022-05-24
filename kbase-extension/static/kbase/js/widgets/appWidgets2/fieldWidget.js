/*
 * The Field Widget has two main jobs:
 * - render an input within within a layout
 * - provide reaction to input widget events to give user feedback
 *
 * The first goal is accomplished through the usual widget machineral - attach, start, run, stop.
 * The second through a simple message bus in which the input widget emits from a set
 * of events which reflect the state of the input after user interaction.
 */
define([
    'bluebird',
    'jquery',
    'google-code-prettify/prettify',
    'common/html',
    'common/events',
    'common/ui',
    'common/props',
    './errorControl',
    'css!google-code-prettify/prettify',
], (Promise, $, PR, html, Events, UI, Props, ErrorControlFactory) => {
    'use strict';
    const t = html.tag,
        div = t('div'),
        span = t('span'),
        label = t('label'),
        button = t('button'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        pre = t('pre'),
        classSets = {
            standard: {
                nameColClass: 'col-md-2',
                inputColClass: 'col-md-5',
                hintColClass: 'col-md-5',
            },
            sidePanel: {
                nameColClass: 'col-md-12',
                inputColClass: 'col-md-12',
                hintColClass: 'col-md-12',
            },
        };

    function factory(config) {
        let ui, places, container, inputControl;

        const bus = config.bus,
            inputControlFactory = config.inputControlFactory,
            options = {},
            fieldId = html.genId(),
            spec = config.parameterSpec;

        try {
            inputControl = inputControlFactory.make({
                bus: config.bus,
                initialValue: config.initialValue,
                initialDisplayValue: config.initialDisplayValue,
                appSpec: config.appSpec,
                parameterSpec: config.parameterSpec,
                workspaceInfo: config.workspaceInfo,
                workspaceId: config.workspaceId,
                fieldSpec: config.fieldSpec,
                referenceType: config.referenceType,
            });
        } catch (ex) {
            inputControl = ErrorControlFactory.make({
                message: ex.message,
            }).make();
        }

        options.enabled = true;
        options.classes = classSets.standard;

        function showMessageDialog(id) {
            ui.showInfoDialog({
                title: 'MESSAGE TITLE',
                body: 'Message id: ' + id,
            });
        }

        function buildInputMessage(messageDef) {
            const events = Events.make(),
                content = div(
                    {
                        class: 'alert alert-' + messageDef.type,
                        role: 'alert',
                    },
                    [
                        span({ style: { fontWeight: 'bold' } }, messageDef.title),
                        ': ',
                        messageDef.message,
                        ' ',
                        button(
                            {
                                type: 'button',
                                class: 'btn btn-link alert-link',
                                id: events.addEvent({
                                    type: 'click',
                                    handler: function () {
                                        showMessageDialog(messageDef.id);
                                    },
                                }),
                            },
                            ui.buildIcon({ name: 'info-circle' })
                        ),
                    ]
                );
            return {
                events: events,
                content: content,
            };
        }

        function setError(error) {
            const component = buildInputMessage({
                title: 'ERROR',
                type: 'danger',
                message: error.message,
                id: error.id,
            });
            places.$messagePanel.removeClass('hidden');
            places.$message.html(component.content).addClass('-error');
            component.events.attachEvents(document.body);
        }

        function setWarning(warning) {
            const component = buildInputMessage({
                title: 'Warning',
                type: 'warning',
                message: warning.message,
                id: warning.id,
            });
            places.$messagePanel.removeClass('hidden');
            places.$message.html(component.content).addClass('-warning');
            component.events.attachEvents(document.body);
        }

        function clearError() {
            places.$field.removeClass('-error').removeClass('-warning');
            places.$message.removeClass('-error').removeClass('-warning').html('');
            places.$messagePanel.addClass('hidden');
        }

        function feedbackNone() {
            places.$feedbackIndicator.removeClass().hide();
        }

        function feedbackOk() {
            places.$feedbackIndicator.removeClass().prop('title', 'input is ok').show();
        }

        function feedbackRequired() {
            places.$feedbackIndicator
                .removeClass()
                .addClass('kb-app-parameter-required-glyph fa fa-arrow-left')
                .prop('title', 'required field')
                .show();
        }

        function feedbackError() {
            places.$feedbackIndicator
                .removeClass()
                .addClass('kb-app-parameter-required-glyph fa fa-ban')
                .show();
        }

        function rawSpec() {
            const specText = JSON.stringify(spec.spec, null, 3),
                fixedSpec = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return pre({ class: 'prettyprint lang-json', style: { fontSize: '80%' } }, fixedSpec);
        }

        function parameterInfoContent() {
            return div({ style: { padding: '4px' } }, [
                div({ style: { fontWeight: 'bold' } }, spec.label()),
                div({ style: { fontStyle: 'italic' } }, spec.name()),
                div({ style: { fontSize: '80%' } }, spec.description()),
            ]);
        }

        function parameterInfoTypeRules() {
            switch (spec.dataType()) {
                case 'float':
                    return [
                        tr([th('Min'), td(spec.spec.text_options.min_float)]),
                        tr([th('Max'), td(spec.spec.text_options.max_float)]),
                    ];
                case 'int':
                    // just for now ...
                    if (spec.spec.field_type === 'checkbox') {
                        return [
                            tr([
                                th('Value when checked'),
                                td(
                                    Props.getDataItem(
                                        spec.spec,
                                        'checkbox_options.checked_value',
                                        UI.na()
                                    )
                                ),
                            ]),
                            tr([
                                th('Value when un-checked'),
                                td(
                                    Props.getDataItem(
                                        spec.spec,
                                        'checkbox_options.unchecked_value',
                                        UI.na()
                                    )
                                ),
                            ]),
                        ];
                    }
                    return [
                        tr([th('Min'), td(spec.spec.text_options.min_int)]),
                        tr([th('Max'), td(spec.spec.text_options.max_int)]),
                    ];
            }
        }

        function parameterInfoRules() {
            return table(
                { class: 'table table-striped' },
                [
                    tr([th('Required'), td(spec.required() ? 'yes' : 'no')]),
                    tr([th('Data type'), td(spec.dataType())]),
                    tr([th('Field type'), td(spec.spec.field_type)]),
                    tr([th('Multiple values?'), td(spec.multipleItems() ? 'yes' : 'no')]),
                    (function () {
                        if (!spec.spec.default_values) {
                            return;
                        }
                        if (spec.spec.default_values.length === 0) {
                            return;
                        }
                        const defaultValues = spec.defaultValue();
                        if (defaultValues instanceof Array) {
                            return tr([th('Default value'), td(defaultValues.join('<br>'))]);
                        }
                        return tr([th('Default value'), td(defaultValues)]);
                    })(),
                    (function () {
                        if (
                            spec.spec.text_options &&
                            spec.spec.text_options.valid_ws_types &&
                            spec.spec.text_options.valid_ws_types.length > 0
                        ) {
                            return tr([
                                th('Valid types'),
                                td(spec.spec.text_options.valid_ws_types.join('<br>')),
                            ]);
                        }
                    })(),
                ].concat(parameterInfoTypeRules())
            );
        }

        function renderInfoTip() {
            let infoTipText;
            if (spec.description() && spec.hint() !== spec.description()) {
                infoTipText = spec.description();
            } else {
                infoTipText = spec.hint() || spec.description();
            }

            return div([
                div(
                    { dataElement: 'big-tip', class: 'hidden' },
                    html.makeTabs({
                        alignRight: true,
                        tabs: [
                            {
                                label: 'Description',
                                name: 'description',
                                content: div({ style: { padding: '4px' } }, infoTipText),
                            },
                            {
                                label: 'About',
                                name: 'about',
                                content: parameterInfoContent(),
                            },
                            {
                                label: 'Rules',
                                name: 'rules',
                                content: parameterInfoRules(),
                            },
                            {
                                label: 'Spec',
                                name: 'spec',
                                content: rawSpec(),
                            },
                        ],
                    })
                ),
            ]);
        }

        function render() {
            const infoId = html.genId();

            let advanced;
            if (spec.spec.advanced) {
                advanced = 'advanced-parameter-hidden';
            } else {
                advanced = '';
            }

            return div(
                {
                    class: [
                        'form-horizontal',
                        'kb-app-parameter-row',
                        'parameter-panel',
                        advanced,
                    ].join(' '),
                    dataAdvancedParameter: spec.isAdvanced(),
                    style: { marginTop: '8px' },
                    id: fieldId,
                },
                [
                    div(
                        {
                            class: 'form-group kb-app-parameter-input field-panel',
                            dataElement: 'field-panel',
                            style: { marginBottom: '0' },
                        },
                        [
                            label(
                                {
                                    class: 'col-md-3 kb-app-parameter-name control-label',
                                },
                                [spec.label() || spec.id()]
                            ),
                            div({ class: 'input-group col-md-9', style: { xwidth: '100%' } }, [
                                div({ dataElement: 'input-control' }),
                                div(
                                    {
                                        class: 'input-group-addon kb-input-group-addon kb-app-field-feedback',
                                        dataElement: 'feedback',
                                        style: { width: '30px', padding: '0' },
                                    },
                                    [div({ dataElement: 'indicator' })]
                                ),
                            ]),
                        ]
                    ),
                    div({ class: 'message-panel hidden', dataElement: 'message-panel' }, [
                        div({ class: 'col-md-3' }),
                        div(
                            { class: 'col-md-9' },
                            div({
                                class: 'message',
                                dataElement: 'message',
                            })
                        ),
                    ]),
                    div({ class: 'info-panel row', dataElement: 'info-panel' }, [
                        div({ class: 'col-md-12' }, div({ id: infoId }, [renderInfoTip()])),
                    ]),
                ]
            );
        }

        // LIFECYCLE

        function attach(node) {
            return Promise.try(() => {
                const events = Events.make();
                container = node;
                container.innerHTML = render();
                events.attachEvents(container);
                ui = UI.make({ node: container });
                // TODO: use the pattern in which the redner returns an object,
                // which includes events and other functions to be run after
                // content is added to the dom.
                PR.prettyPrint(null, container);

                // create the "places" shortcuts.
                const $container = $(container);
                places = {
                    $field: $container.find('#' + fieldId),
                    $fieldPanel: $container.find('[data-element="field-panel"]'),
                    $input: $container.find('[data-element="input"]'),
                    $message: $container.find('[data-element="message"]'),
                    $messagePanel: $container.find('[data-element="message-panel"]'),
                    $feedback: $container.find('[data-element="feedback"]'),
                    $feedbackIndicator: $container.find(
                        '[data-element="feedback"][data-element="indicator"]'
                    ),
                    $removalButton: $container.find('[data-element="removal-button"]'),
                };
                if (inputControl.attach) {
                    return inputControl.attach(
                        $container.find('[data-element="input-control"]').get(0)
                    );
                }
            });
        }

        function start() {
            return Promise.try(() => {
                bus.on('validation', (message) => {
                    switch (message.diagnosis) {
                        case 'valid':
                            feedbackOk();
                            clearError();
                            break;
                        case 'required-missing':
                            feedbackRequired();
                            clearError();
                            break;
                        case 'suspect':
                            feedbackOk();
                            clearError();
                            setWarning({
                                message: message.shortMessage,
                                id: message.messageId,
                            });
                            break;
                        case 'invalid':
                            feedbackError();
                            clearError();
                            setError({
                                id: message.messageId,
                                message: message.errorMessage,
                            });
                            break;
                        case 'optional-empty':
                            feedbackNone();
                            clearError();
                            break;
                    }
                });
                bus.on('touched', () => {
                    places.$feedback.css('background-color', 'yellow');
                });
                bus.on('changed', () => {
                    places.$feedback.css('background-color', '');
                });
                if (inputControl.start) {
                    return inputControl.start().then(() => {
                        bus.emit('run', {
                            node: ui.getElement('input-control'),
                        });
                    });
                }
            });
        }

        function run(params) {
            return Promise.try(() => {
                if (inputControl.run) {
                    return inputControl.run(params);
                }
            });
        }

        return {
            // init: init,
            attach: attach,
            start: start,
            run: run,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
