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
    'kb_common/html',
    '../events'
], function (Promise, $, html, Events) {
    'use strict';
    var t = html.tag,
        div = t('div'), span = t('span'), label = t('label'), button = t('button'),
        table = t('table'), tr = t('tr'), th = t('th'), td = t('td'),
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
        var places, container,
            inputControlFactory = config.inputControlFactory,
            inputControl = inputControlFactory.make({
                bus: config.bus,
                initialValue: config.initialValue,
                parameterSpec: config.parameterSpec,
                workspaceInfo: config.workspaceInfo,
                workspaceId: config.workspaceId
            }),
            options = {},
            fieldId = html.genId(),
            bus = config.bus,
            spec = config.parameterSpec;

        // options.isOutputName = spec.text_options && spec.text_options.is_output_name;
        options.enabled = true;
        options.classes = classSets.standard;


        function setError(errorMessage) {
            // places.$feedback.removeClass();
            places.$field.addClass('kb-method-parameter-row-error');
            places.$errorPanel.addClass('kb-method-parameter-row-error');
            places.$error
                .html(errorMessage);
            places.$errorPanel
                .show();
        }

        function clearError() {
            places.$field.removeClass('kb-method-parameter-row-error');
            places.$error
                .html('');
            places.$errorPanel
                .hide();
        }

        function hideError() {
            places.$field.removeClass('kb-method-parameter-row-error');
            places.$errorPanel.hide();
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
                // .addClass('kb-method-parameter-accepted-glyph fa fa-check')
                .prop('title', 'input is ok')
                .show();
        }

        function feedbackRequired(row) {
            places.$feedback
                .removeClass()
                .addClass('kb-method-parameter-required-glyph fa fa-arrow-left')
                .prop('title', 'required field')
                .show();
        }
        
         function feedbackError(row) {
            places.$feedback
                .removeClass()
                .addClass('kb-method-parameter-required-glyph fa fa-ban')
                .show();
        }
        
        function parameterInfoContent(spec) {
            return div([
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
            }
        }
        function parameterInfoRules(spec) {
            return table({class: 'table table-striped'}, [
                tr([th('Required'), td(spec.required() ? 'yes' : 'no')]),
                tr([th('Type'), td(spec.dataType())]),
                tr([th('Multiple values?'), td(spec.multipleItems() ? 'yes' : 'no')]),
                (function () {
                    if (!spec.spec.default_values) {
                        return;
                    }
                    if (spec.spec.default_values.length === 0) {
                        return;
                    }
                    if (spec.multipleItems()) {
                        tr([th('Default value'), td(spec.spec.default_values[0])]);
                    }
                    return tr([th('Default value'), td(spec.spec.default_values.join('<br>'))]);
                }())
            ].concat(parameterInfoTypeRules(spec)));
        }

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
                    class: 'kb-method-parameter-required-glyph fa fa-arrow-left',
                    title: 'required field',
                    dataElement: 'feedback'
                });
            }

            // INPUT (control with feedback)
            // Note -- here is where we 
            inputCol = div({class: [options.classes.inputColClass, 'kb-method-parameter-input'].join(' ')}, [
                div({style: {width: '100%', display: 'inline-block'}}, [
                    div({dataElement: 'input-control'})
                ]),
                div({style: {display: 'inline-block'}}, [
                    feedbackTip
                ])
            ]);

            // FIELD NAME
//            nameCol = div({class: options.classes.nameColClass}, 
//                class: [options.classes.nameColClass, 'kb-method-parameter-name'].join(' ')
//            }, spec.label());

            // HINT (help)
            var infoTipText;
            if (spec.description() && spec.hint() !== spec.description()) {
                infoTipText = spec.description();
            } else {
                infoTipText = spec.hint() || spec.description();
            }
            
            var infoId = html.genId();

            var content = div({class: 'form-horizontal', style: {marginTop: '8px'}, id: fieldId}, [
                div({class: 'form-group', dataElement: 'field-panel'},[
                    label({class: 'col-md-3 control-label kb-method-parameter-name'}, [
                        spec.label()
                    ]),
                    div({class: 'col-md-4'}, div({class: 'kb-method-parameter-input'}, [
                        div({class: 'input-group', style: {width: '100%'}}, [
                            div({dataElement: 'input-control'}),
                            div({class: 'input-group-addon', style: {width: '50px', padding: '0'}}, [
                                div({dataElement: 'feedback'})
                            ]),
                            div({class: 'input-group-addon', style: {width: '30px', padding: '0'}}, [
                                div({dataElement: 'info'}, button({
                                    class: 'btn btn-link btn-xs',
                                    type: 'button',
                                    id: events.addEvent({
                                        type: 'click',
                                        handler: function (e) {
                                           var info = document.getElementById(infoId);
                                           if (info.style.display === 'block') {
                                               info.style.display = 'none';
                                           } else {
                                               info.style.display = 'block';
                                           }
                                        }
                                    })
                                },
                                    span({class: 'fa fa-info-circle'})
                                ))
                            ])
                        ])
                    ])),
                    div({class: 'col-md-5'},  div({id: infoId, style: {display: 'none'}}, html.makeTabs({
                            tabs: [
                            {
                                label: 'Description',
                                name: 'description',
                                content: infoTipText
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
                            }
                        ]})))
                    
                ]),
                div({class: 'form-group', dataElement: 'error-panel', style: {display: 'none'}}, [                    
                    div({class:'col-md-2'}),
                    div({class: 'col-md-5'},  div({
                        class: ['kb-method-parameter-error-message'].join(' '),
                        dataElement: 'error-message'
                    })),
                    div({class: 'col-md-5'})
                ])
            ]);
            
            return content;
        }

        // LIFECYCLE

//        function init() {
//            // A bit more friendly and normalized properties of the parameter spec.
//            // options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
//            // options.classes g= classSets[options.environment];
//            options.multiple = spec.multiple();
//            options.required = spec.required();
//            // options.isOutputName = spec.text_options && spec.text_options.is_output_name;
//            options.enabled = true;
//            // return inputControl.init();
//        }

        function attach(node) {
            var events = Events.make(),
                $container;
            container = node;
            container.innerHTML = render(events);
            events.attachEvents(container);

            // create the "places" shortcuts.
            $container = $(container);
            places = {
                $field: $container.find('#' + fieldId),
                $fieldPanel: $container.find('[data-element="field-panel"]'),
                $input: $container.find('[data-element="input"]'),
                $error: $container.find('[data-element="error-message"]'),
                $errorPanel: $container.find('[data-element="error-panel"]'),
                $feedback: $container.find('[data-element="feedback"]'),
                $removalButton: $container.find('[data-element="removal-button"]')
            };
            return inputControl.attach($container.find('[data-element="input-control"]').get(0));
        }

        function start() {
            return Promise.try(function () {
                bus.listen({
                    test: function (message) {
                        return (message.type === 'validation');
                    },
                    handle: function (message) {
                        switch (message.diagnosis) {
                            case 'valid':
                                feedbackOk();
                                clearError();
                                break;
                            case 'required-missing':
                                feedbackRequired();
                                // setError(message.errorMessage, spec.label());
                                clearError();
                                break;
                            case 'invalid':
                                feedbackError();
                                setError(message.errorMessage, spec.label());
                                break;
                            case 'optional-empty':
                                feedbackNone();
                                clearError();
                                break;
                        }
                    }
                });
                if (inputControl.start) {
                    return inputControl.start();
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