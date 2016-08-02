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
    'jquery',
    'google-code-prettify/prettify',
    'kb_common/html',
    'common/events',
    'common/ui',
    './input/errorInput',
    'css!google-code-prettify/prettify.css'
], function (Promise, $, PR, html, Events, UI, ErrorControlFactory) {
    'use strict';
    var t = html.tag,
        div = t('div'), span = t('span'), label = t('label'), button = t('button'),
        table = t('table'), tr = t('tr'), th = t('th'), td = t('td'), pre = t('pre'),
        textarea = t('textarea'),
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
                    fieldSpec: config.fieldSpec
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
                    span({style: {fontWeight: 'bold'}}, messageDef.title),
                    ': ',
                    messageDef.message,
                    ' ',
                    button({
                        type: 'button',
                        class: 'btn btn-link alert-link',
                        id: events.addEvent({
                            type: 'click',
                            handler: function () {
                                showMessageDialog(messageDef.id);
                            }
                        })
                    }, ui.buildIcon({name: 'info-circle'}))
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
            places.$messagePanel
                .removeClass('hidden');
            places.$message
                .html(component.content)
                .addClass('-error');
            component.events.attachEvents(document.body);
        }

        function setWarning(warning) {
            var component = buildInputMessage({
                title: 'Warning',
                type: 'warning', 
                message: warning.message,
                id: warning.id
            });
            places.$messagePanel
                .removeClass('hidden');
            places.$message
                .html(component.content)
                .addClass('-warning');
            component.events.attachEvents(document.body);
        }


        function clearError() {
            places.$field
                .removeClass('-error')
                .removeClass('-warning');
            places.$message
                .removeClass('-error')
                .removeClass('-warning')
                .html('');
            places.$messagePanel
                .addClass('hidden');
        }

        function hideError() {
            places.$field.removeClass('-error');
            places.$messagePanel.addClass('hidden');
            places.$feedback.removeClass();
        }

        function feedbackNone() {
            places.$feedback
                .removeClass()
                .hide();
        }

        function feedbackOk() {
            places.$feedback
                .removeClass()
                // .addClass('kb-app-parameter-accepted-glyph fa fa-check')
                .prop('title', 'input is ok')
                .show();
        }

        function feedbackRequired(row) {
            places.$feedback
                .removeClass()
                .addClass('kb-app-parameter-required-glyph fa fa-arrow-left')
                .prop('title', 'required field')
                .show();
        }

        function feedbackError(row) {
            places.$feedback
                .removeClass()
                .addClass('kb-app-parameter-required-glyph fa fa-ban')
                .show();
        }

        function rawSpec(spec) {
            var specText = JSON.stringify(spec.spec, false, 3),
                fixedSpec = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return pre({class: 'prettyprint lang-json', style: {fontSize: '80%'}}, fixedSpec);
        }

        function parameterInfoContent(spec) {
            return div({style: {padding: '4px'}}, [
                div({style: {fontWeight: 'bold'}}, spec.label()),
                div({style: {fontStyle: 'italic'}}, spec.name()),
                div({style: {fontSize: '80%'}}, spec.description())
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
                            tr([th('Min'), td(String(0))]),
                            tr([th('Max'), td(String(1))])
                        ];
                    }
                    return [
                        tr([th('Min'), td(spec.spec.text_options.min_int)]),
                        tr([th('Max'), td(spec.spec.text_options.max_int)])
                    ];
            }
        }

        function parameterInfoRules(spec) {
            return table({class: 'table table-striped'}, [
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
                    var defaultValues = spec.defaultValue();
                    if (defaultValues instanceof Array) {
                        return tr([th('Default value'), td(defaultValues.join('<br>'))]);
                    }
                    return tr([th('Default value'), td(defaultValues)]);
                }()),
                (function () {
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
                div({dataElement: 'big-tip', style: {display: 'none'}}, html.makeTabs({
                    alignRight: true,
                    tabs: [
                        {
                            label: 'Description',
                            name: 'description',
                            content: div({style: {padding: '4px'}}, infoTipText)
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
                    ]}))
            ]);
        }
//        function renderLabelTip() {
//            return div([
//                div({dataElement: 'little-tip', style: {display: 'none'}}, parameterInfoLittleTip(spec))
//            ]);
//        }

        function render(events) {
            var placeholder = '',
                fieldContainer,
                feedbackTip, nameCol, inputCol, hintCol;

            // PLACHOLDER (todo: put it somewhere!)
            if (spec.text_options && spec.text_options.placeholder) {
                placeholder = spec.text_options.placeholder.replace(/(\r\n|\n|\r)/gm, '');
            }

            // FEEDBACK
            if (spec.required()) {
                feedbackTip = span({
                    class: 'kb-app-parameter-required-glyph fa fa-arrow-left',
                    title: 'required field',
                    dataElement: 'feedback'
                });
            }

            // INPUT (control with feedback)
            // Note -- here is where we
            inputCol = div({class: [options.classes.inputColClass, 'kb-app-parameter-input'].join(' ')}, [
                div({style: {width: '100%', display: 'inline-block'}}, [
                    div({dataElement: 'input-control'})
                ]),
                div({style: {display: 'inline-block'}}, [
                    feedbackTip
                ])
            ]);

            // FIELD NAME
//            nameCol = div({class: options.classes.nameColClass},
//                class: [options.classes.nameColClass, 'kb-app-parameter-name'].join(' ')
//            }, spec.label());

            // HINT (help)


            var infoId = html.genId();

            var advanced;
            if (spec.spec.advanced) {
                advanced = 'advanced-parameter-hidden';
            } else {
                advanced = '';
            }

            var content = div({class: ['form-horizontal', 'kb-app-parameter-row', advanced].join(' '), dataAdvancedParameter: spec.isAdvanced(), style: {marginTop: '8px'}, id: fieldId}, [
                div({class: 'form-group kb-app-parameter-input', dataElement: 'field-panel', style: {marginBottom: '0'}}, [
//                    label({class: 'xcol-md-12 xcontrol-label kb-app-parameter-name'}, [
//                        spec.label() || spec.id()
//                    ]),
                    //div({class: 'xcol-md-12'}, div({class: ''}, [
                    label({class: 'col-md-3 xcontrol-label kb-app-parameter-name control-label'}, [
                        spec.label() || spec.id()
                    ]),
                    div({class: 'input-group col-md-9', style: {xwidth: '100%'}}, [
                        div({dataElement: 'input-control'}),
                        div({class: 'input-group-addon', style: {width: '30px', padding: '0'}}, [
                            div({dataElement: 'feedback'})
                        ]),
                        div({class: 'input-group-addon', style: {width: '30px', padding: '0'}}, [
                            div({dataElement: 'info'}, button({
                                class: 'btn btn-link btn-xs',
                                type: 'button',
                                id: events.addEvent({
                                    type: 'click',
                                    handler: function (e) {
                                        var // info = document.getElementById(infoId),
                                            // littleTip = container.querySelector('[data-element="little-tip"]'),
                                            bigTip = container.querySelector('[data-element="big-tip"]');
                                        // the info button is used to switch between two different
                                        // displays -- a compact display of type and a
                                        // tabview with richer info to explore.
                                        if (bigTip.style.display === 'none') {
                                            bigTip.style.display = 'block';
                                            // littleTip.style.display = 'block';
                                        } else {
                                            bigTip.style.display = 'none';
                                            // littleTip.style.display = 'none';
                                        }
                                    }
                                })
                            },
                                span({class: 'fa fa-info-circle'})
                                ))
                        ])
                    ])
                        //]))


                ]),
                div({class: 'hidden', dataElement: 'message-panel'}, [
                    div({class: 'col-md-3'}),
                    div({class: 'col-md-9'}, div({
                        class: 'message',
                        dataElement: 'message'
                    }))
                ]),
                div({class: 'row', dataElement: 'info-panel'}, [
                    div({class: 'col-md-12', style: {paddingBottom: '10px'}}, div({id: infoId}, [
                        renderInfoTip()
                    ]))

                ])
            ]);

            return content;
        }

        // LIFECYCLE

        function attach(node) {
            return Promise.try(function () {
                var events = Events.make(),
                    $container;
                container = node;
                container.innerHTML = render(events);
                events.attachEvents(container);
                ui = UI.make({node: container});
                // TODO: use the pattern in which the redner returns an object,
                // which includes events and other functions to be run after
                // content is added to the dom.
                PR.prettyPrint(null, container);

                // create the "places" shortcuts.
                $container = $(container);
                places = {
                    $field: $container.find('#' + fieldId),
                    $fieldPanel: $container.find('[data-element="field-panel"]'),
                    $input: $container.find('[data-element="input"]'),
                    $message: $container.find('[data-element="message"]'),
                    $messagePanel: $container.find('[data-element="message-panel"]'),
                    $feedback: $container.find('[data-element="feedback"]'),
                    $removalButton: $container.find('[data-element="removal-button"]')
                };
                if (inputControl.attach) {
                    return inputControl.attach($container.find('[data-element="input-control"]').get(0));
                }
            });
        }

        function start() {
            return Promise.try(function () {
                bus.on('validation', function (message) {
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
                if (inputControl.start) {
                    return inputControl.start()
                        .then(function () {
                            bus.emit('run', {
                                node: ui.getElement('input-control')
                            });
                        });
                }
            });
        }

        function run(params) {
            return Promise.try(function () {
                if (inputControl.run) {
                    return inputControl.run(params);
                }
            });
        }

        return {
            // init: init,
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
