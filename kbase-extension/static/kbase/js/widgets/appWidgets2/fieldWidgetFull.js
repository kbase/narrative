/*global define*/
/*jslint white:true,browser:true*/
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
    'google-code-prettify/prettify',
    'kb_common/html',
    'common/events',
    'common/ui',
    'common/props',
    './errorControl',
    'css!google-code-prettify/prettify.css'
], function(
    Promise,
    PR,
    html,
    Events,
    UI,
    Props,
    ErrorControlFactory) {
    'use strict';

    var t = html.tag,
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
                hintColClass: 'col-md-5'
            },
            sidePanel: {
                nameColClass: 'col-md-12',
                inputColClass: 'col-md-12',
                hintColClass: 'col-md-12'
            }
        };

    function factory(config) {
        var ui,
            bus = config.bus,
            places, container,
            inputControlFactory = config.inputControlFactory,
            inputControl,
            options = {},
            fieldId = html.genId(),
            spec = config.parameterSpec;

        try {
            inputControl = inputControlFactory.make({
                bus: config.bus,
                initialValue: config.initialValue,
                appSpec: config.appSpec,
                parameterSpec: config.parameterSpec,
                workspaceInfo: config.workspaceInfo,
                workspaceId: config.workspaceId,
                fieldSpec: config.fieldSpec,
                referenceType: config.referenceType
            });
        } catch (ex) {
            inputControl = ErrorControlFactory.make({
                message: ex.message
            }).make();
        }

        // options.isOutputName = spec.text_options && spec.text_options.is_output_name;
        options.enabled = true;
        options.classes = classSets.standard;

        function showMessageDialog(id) {
            ui.showInfoDialog({
                title: 'MESSAGE TITLE',
                body: 'Message id: ' + id
            });
        }

        function buildInputMessage(messageDef) {
            var events = Events.make(),
                content = div({
                    class: 'alert alert-' + messageDef.type,
                    role: 'alert'
                }, [
                    span({ style: { fontWeight: 'bold' } }, messageDef.title),
                    ': ',
                    messageDef.message,
                    ' ',
                    button({
                        type: 'button',
                        class: 'btn btn-link alert-link',
                        id: events.addEvent({
                            type: 'click',
                            handler: function() {
                                showMessageDialog(messageDef.id);
                            }
                        })
                    }, ui.buildIcon({ name: 'info-circle' }))
                ]);
            return {
                events: events,
                content: content
            };
        }

        function setError(error) {
            var component = buildInputMessage({
                title: 'ERROR',
                type: 'danger',
                message: error.message,
                id: error.id
            });
            places.messagePanel.classList.remove('hidden');
            places.message.innerHTML = component.content;
            places.message.classList.add('-error');
            component.events.attachEvents(document.body);
        }

        function setWarning(warning) {
            var component = buildInputMessage({
                title: 'Warning',
                type: 'warning',
                message: warning.message,
                id: warning.id
            });
            places.messagePanel.classList.remove('hidden');
            places.message.innerHTML = component.content;
            places.message.classList.add('-warning');
            component.events.attachEvents(document.body);
        }


        function clearError() {
            places.field.classList.remove('-error');
            places.field.classList.remove('-warning');
            places.message.remove('-error');
            places.message.remove('-warning');
            places.message.innerHTML = '';
            places.messagePanel.classList.add('hidden');
        }

        function hideError() {
            places.field.classList.remove('-error');
            places.messagePanel.classList.add('hidden');
            places.feedbackIndicator.classes = '';
        }

        function feedbackNone() {
            places.feedbackIndicator.classes = '';
            places.feedbackIndicator.classList.add('hidden');
        }

        function feedbackOk() {
            places.feedbackIndicator.classes = '';
            places.feedbackIndicator.setAttribute('title', 'input is ok');
            places.feedbackIndicator.classList.remove('hidden');
        }

        function feedbackRequired() {
            places.feedbackIndicator.classes = 'kb-app-parameter-required-glyph fa fa-arrow-left';
            places.feedbackIndicator.setAttribute('title', 'required field');
        }

        function feedbackError(row) {
            places.feedbackIndicator.classes = 'kb-app-parameter-required-glyph fa fa-ban';
        }

        function rawSpec(spec) {
            var specText = JSON.stringify(spec.spec, false, 3),
                fixedSpec = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return pre({ class: 'prettyprint lang-json', style: { fontSize: '80%' } }, fixedSpec);
        }

        function parameterInfoContent(spec) {
            return div({ style: { padding: '4px' } }, [
                div({ style: { fontWeight: 'bold' } }, spec.label()),
                div({ style: { fontStyle: 'italic' } }, spec.name()),
                div({ style: { fontSize: '80%' } }, spec.description())
            ]);
        }

        function parameterInfoTypeRules(spec) {
            switch (spec.dataType()) {
                case 'float':
                    return [
                        tr([th('Min'), td(spec.spec.text_options.min_float)]),
                        tr([th('Max'), td(spec.spec.text_options.max_float)])
                    ];
                case 'int':
                    // just for now ...
                    if (spec.spec.field_type === 'checkbox') {
                        return [
                            tr([th('Value when checked'), td(Props.getDataItem(spec.spec, 'checkbox_options.checked_value', UI.na()))]),
                            tr([th('Value when un-checked'), td(Props.getDataItem(spec.spec, 'checkbox_options.unchecked_value', UI.na()))])
                        ];
                    }
                    return [
                        tr([th('Min'), td(spec.spec.text_options.min_int)]),
                        tr([th('Max'), td(spec.spec.text_options.max_int)])
                    ];
            }
        }

        function parameterInfoRules(spec) {
            return table({ class: 'table table-striped' }, [
                tr([th('Required'), td(spec.required() ? 'yes' : 'no')]),
                tr([th('Data type'), td(spec.dataType())]),
                tr([th('Field type'), td(spec.spec.field_type)]),
                tr([th('Multiple values?'), td(spec.multipleItems() ? 'yes' : 'no')]),
                (function() {
                    if (!spec.spec.default_values) {
                        return;
                    }
                    if (spec.spec.default_values.length === 0) {
                        return;
                    }
                    var defaultValues = spec.defaultValue();
                    if (defaultValues instanceof Array) {
                        return tr([th('Default value'), td(defaultValues.join('<br>'))]);
                    }
                    return tr([th('Default value'), td(defaultValues)]);
                }()),
                (function() {
                    if (spec.spec.text_options && spec.spec.text_options.valid_ws_types && spec.spec.text_options.valid_ws_types.length > 0) {
                        return tr([th('Valid types'), td(spec.spec.text_options.valid_ws_types.join('<br>'))]);
                    }
                }())
            ].concat(parameterInfoTypeRules(spec)));
        }

        function parameterInfoLittleTip(spec) {
            return spec.dataType();
            //var mult = (spec.multipleItems() ? '[]' : ''),
            //    type = spec.dataType();
            //return mult + type;
        }


        function renderInfoTip() {
            var infoTipText;
            if (spec.description() && spec.hint() !== spec.description()) {
                infoTipText = spec.description();
            } else {
                infoTipText = spec.hint() || spec.description();
            }

            return div([
                // div({dataElement: 'little-tip'}, parameterInfoLittleTip(spec)),
                div({ dataElement: 'big-tip', class: 'hidden' }, html.makeTabs({
                    alignRight: true,
                    tabs: [{
                            label: 'Description',
                            name: 'description',
                            content: div({ style: { padding: '4px' } }, infoTipText)
                        },
                        {
                            label: 'About',
                            name: 'about',
                            content: parameterInfoContent(spec)
                        },
                        {
                            label: 'Rules',
                            name: 'rules',
                            content: parameterInfoRules(spec)
                        },
                        {
                            label: 'Spec',
                            name: 'spec',
                            content: rawSpec(spec)
                        }
                    ]
                }))
            ]);
        }

        function render(events) {
            var feedbackTip;

            // FEEDBACK
            if (spec.required()) {
                feedbackTip = span({
                    class: 'kb-app-parameter-required-glyph fa fa-arrow-left',
                    title: 'required field',
                    dataElement: 'feedback'
                });
            }

            var infoId = html.genId();

            var advanced;
            if (spec.spec.advanced) {
                advanced = 'advanced-parameter-hidden';
            } else {
                advanced = '';
            }

            var infoTipText;
            if (spec.ui.description && spec.ui.hint !== spec.ui.description) {
                infoTipText = spec.ui.description;
            } else {
                infoTipText = spec.ui.hint || spec.ui.description;
            }

            var content = div({
                class: ['form-horizontal', 'kb-app-parameter-row', 'parameter-panel', advanced].join(' '),
                dataAdvancedParameter: spec.isAdvanced && spec.isAdvanced(),
                style: {
                    marginTop: '8px'
                },
                id: fieldId
            }, [
                div({ class: 'form-group kb-app-parameter-input field-panel', dataElement: 'field-panel', style: { marginBottom: '0' } }, [
                    label({
                        class: 'xcontrol-label kb-app-parameter-name control-label',
                        title: infoTipText,
                        style: {cursor: 'help'},
                        id: events.addEvent({
                            type: 'click',
                            handler: function () {
                                places.infoPanel.querySelector('[data-element="big-tip"]').classList.toggle('hidden');
                            }
                        })
                    }, [
                        spec.ui.label || spec.ui.id
                    ])
                ]),
                div({ class: 'input-group col-md-10', style: { xwidth: '100%' } }, [
                    div({ dataElement: 'input-control' }),
                    div({
                        class: 'input-group-addon kb-input-group-addon kb-app-field-feedback',
                        dataElement: 'feedback',
                        style: {
                            width: '30px',
                            padding: '0'
                        }
                    }, [
                        div({ dataElement: 'indicator' })
                    ])
                    /*,
                        div({ class: 'input-group-addon kb-input-group-addon', style: { width: '30px', padding: '0' } }, [
                            div({ dataElement: 'info' }, button({
                                    class: 'btn btn-link btn-xs',
                                    type: 'button',
                                    id: events.addEvent({
                                        type: 'click',
                                        handler: function() {
                                            ui.getElement('big-tip').classList.toggle('hidden');
                                        }
                                    })
                                },
                                span({ class: 'fa fa-info-circle' })
                            ))
                        ]*/
                ]),
                div(
                    {
                        class: 'message-panel hidden',
                        dataElement: 'message-panel'
                    }, [
                        div({ class: 'col-md-3' }),
                        div({ class: 'col-md-9' },
                            div({
                                class: 'message',
                                dataElement: 'message'
                            })
                        )
                    ]
                ),
                div({ class: 'info-panel row', dataElement: 'info-panel' }, [
                    div({ class: 'col-md-12' }, div({ id: infoId }, [
                        renderInfoTip()
                    ]))
                ])
            ]);
            return content;
        }

        // LIFECYCLE

        function attach(node) {
            var events = Events.make();

            container = node;
            container.innerHTML = render(events);
            events.attachEvents(container);
            ui = UI.make({ node: container });
            // TODO: use the pattern in which the redner returns an object,
            // which includes events and other functions to be run after
            // content is added to the dom.
            PR.prettyPrint(null, container);

            places = {
                field: document.getElementById(fieldId),
                message: ui.getElement('message'),
                messagePanel: ui.getElement('message-panel'),
                feedback: ui.getElement('feedback'),
                feedbackIndicator: ui.getElement('feedback.indicator'),
                removalButton: ui.getElement('removal-button')
            };
            if (inputControl.attach) {
                return inputControl.attach(ui.getElement('input-control'));
            }
        }

        function start(arg) {
            attach(arg.node);
            return Promise.try(function() {
                bus.on('validation', function(message) {
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
                                id: message.messageId
                            });
                            break;
                        case 'invalid':
                            feedbackError();
                            clearError();
                            setError({
                                id: message.messageId,
                                message: message.errorMessage
                            });
                            break;
                        case 'optional-empty':
                            feedbackNone();
                            clearError();
                            break;
                    }
                });
                bus.on('touched', function(message) {
                    places.feedback.style.backgroundColor = 'yellow';
                });
                bus.on('changed', function() {
                    places.feedback.style.backgroundColor = '';
                });
                bus.on('saved', function(message) {
                    console.log('FIELD detected saved');
                });
                if (inputControl.start) {
                    return inputControl.start()
                        .then(function() {
                            bus.emit('run', {
                                node: ui.getElement('input-control')
                            });
                        });
                }
            });
        }

        function stop() {
            return Promise.try(function() {
                return null;
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
