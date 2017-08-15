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
    'common/runtime',
    './errorControl',
    'css!google-code-prettify/prettify.css'
], function(
    Promise,
    PR,
    html,
    Events,
    UI,
    Props,
    Runtime,
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
            }
        };

    function factory(config) {
        var ui,
            runtime = Runtime.make(),
            bus = runtime.bus().makeChannelBus({
                description: 'Field bus'
            }),
            places,
            parent, container,
            inputControlFactory = config.inputControlFactory,
            inputControl,
            options = {},
            fieldId = html.genId(),
            spec = config.parameterSpec,
            enabled;

        try {
            inputControl = inputControlFactory.make({
                bus: bus,
                paramsChannelName: config.paramsChannelName,
                channelName: bus.channelName,
                initialValue: config.initialValue,
                appSpec: config.appSpec,
                parameterSpec: config.parameterSpec,
                workspaceInfo: config.workspaceInfo,
                workspaceId: config.workspaceId,
                fieldSpec: config.fieldSpec,
                referenceType: config.referenceType
            });
        } catch (ex) {
            console.error('Error creating input control', ex);
            inputControl = ErrorControlFactory.make({
                message: ex.message
            }).make();
        }

        enabled = true;
        options.classes = classSets.standard;

        function doEnable() {
            if (!enabled) {
                // do something...
                var mask = ui.getElement('field-mask');
                mask.classList.add('hidden');

                enabled = true;
            }
        }

        function doDisable() {
            if (enabled) {
                // do something
                var mask = ui.getElement('field-mask');
                mask.classList.remove('hidden');

                enabled = false;
            }
        }

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
            places.message.classList.remove('-error');
            places.message.classList.remove('-warning');
            places.message.innerHTML = '';
            places.messagePanel.classList.add('hidden');
        }

        function hideError() {
            places.field.classList.remove('-error');
            places.messagePanel.classList.add('hidden');
            places.feedbackIndicator.className = '';
        }

        function feedbackNone() {
            places.feedbackIndicator.className = '';
            places.feedbackIndicator.classList.add('hidden');
        }

        function feedbackOk() {
            places.feedbackIndicator.className = '';
            places.feedbackIndicator.setAttribute('title', 'input is ok');
            places.feedbackIndicator.classList.remove('hidden');
        }

        function feedbackRequired() {
            places.feedbackIndicator.className = 'kb-app-parameter-right-error-bar';
            places.feedbackIndicator.setAttribute('title', 'required field');
        }

        function feedbackError() {
            places.feedbackIndicator.className = 'kb-app-parameter-right-error-bar';
        }

        function rawSpec(spec) {
            var specText = JSON.stringify(spec, false, 3),
                fixedSpec = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return pre({ class: 'prettyprint lang-json', style: { fontSize: '80%' } }, fixedSpec);
        }

        function parameterInfoContent(spec) {
            return div({ style: { padding: '0px' } }, [
                div({ style: { fontWeight: 'bold' } }, spec.ui.label),
                div({ style: { fontStyle: 'italic' } }, spec.id),
                div({ style: { fontSize: '80%' } }, spec.ui.description)
            ]);
        }

        function parameterInfoTypeRules(spec) {
            switch (spec.data.type) {
                case 'float':
                case 'int':
                    return [
                        tr([th('Min'), td(spec.data.constraints.min)]),
                        tr([th('Max'), td(spec.data.constraints.max)])
                    ];
            }
        }

        function parameterInfoRules(spec) {
            return table({ class: 'table table-striped' }, [
                tr([th('Required'), td(spec.data.constraints.required ? 'yes' : 'no')]),
                tr([th('Data type'), td(spec.data.type)]),
                // tr([th('Field type'), td(spec.spec.field_type)]),
                tr([th('Multiple values?'), td(spec.multipleItems ? 'yes' : 'no')]),
                (function() {
                    return tr([th('Default value'), td(spec.data.defaultValue)]);
                }()),
                (function() {
                    if (spec.data.constraints.types) {
                        return tr([th('Valid types'), td(spec.data.constraints.types.join('<br>'))]);
                    }
                }())
            ].concat(parameterInfoTypeRules(spec)));
        }

        function parameterInfoLittleTip(spec) {
            return spec.data.type;
            //var mult = (spec.multipleItems() ? '[]' : ''),
            //    type = spec.dataType();
            //return mult + type;
        }


        function renderInfoTip() {
            var infoTipText;
            if (spec.ui.description && spec.ui.hint !== spec.ui.description) {
                infoTipText = spec.ui.description;
            } else {
                infoTipText = spec.ui.hint || spec.ui.description;
            }

            return div([
                // div({dataElement: 'little-tip'}, parameterInfoLittleTip(spec)),
                div({ dataElement: 'big-tip', class: 'hidden' }, html.makeTabs({
                    alignRight: true,
                    tabs: [{
                            label: 'Description',
                            name: 'description',
                            content: div({ style: { padding: '0px' } }, infoTipText)
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
            var ids = {
                fieldPanel: html.genId(),
                messagePanel: html.genId(),
                message: html.genId(),
                infoPanel: html.genId(),
                feedback: html.genId(),
                feedbackIndicator: html.genId(),
                inputControl: html.genId()
            };

            // FEEDBACK

            var infoId = html.genId();

            var advanced;
            if (spec.ui.advanced) {
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
                dataAdvancedParameter: spec.ui.advanced,
                id: fieldId,
                style: { position: 'relative' }
            }, [
                // disabled mask
                div({
                    dataElement: 'field-mask',
                    class: 'hidden',
                    style: {
                        position: 'absolute',
                        top: '0',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        backgroundColor: 'rgba(255,255,255, 0.5)',
                        zIndex: '100'
                    }
                }),
                div({
                    id: ids.fieldPanel,
                    class: 'form-group kb-app-parameter-input field-panel',
                    dataElement: 'field-panel',
                    style: {
                        marginBottom: '0'
                    }
                }, [
                    div({ class: 'col-md-3' }, [
                        label({
                            class: 'xcontrol-label kb-app-parameter-name control-label',
                            title: infoTipText,
                            style: { cursor: 'help' },
                            id: events.addEvent({
                                type: 'click',
                                handler: function() {
                                    places.infoPanel.querySelector('[data-element="big-tip"]').classList.toggle('hidden');
                                }
                            })
                        }, [
                            spec.ui.label || spec.ui.id
                        ])
                    ]),
                    div({ class: 'input-group col-md-9' }, [
                        div({
                            id: ids.inputControl,
                            dataElement: 'input-control'
                        }),
                        div({
                            id: ids.feedback,
                            class: 'input-group-addon kb-input-group-addon kb-app-field-feedback',
                            dataElement: 'feedback',
                            style: {
                                width: '3px',
                                height: '100%',
                                'margin-left': '4px'
                            }
                        }, [
                            div({
                                id: ids.feedbackIndicator,
                                dataElement: 'indicator',
                                style: {
                                    width: '3px'
                                }
                            })
                        ]),
                        /*div({
                            class: 'input-group-addon kb-input-group-addon',
                            style: {
                                width: '30px',
                                padding: '0'
                            }
                        }, [
                            div({ dataElement: 'info' }, button({
                                class: 'btn btn-link btn-xs',
                                type: 'button',
                                tabindex: '-1',
                                id: events.addEvent({
                                    type: 'click',
                                    handler: function () {
                                        places.infoPanel.querySelector('[data-element="big-tip"]').classList.toggle('hidden');
                                        // ui.getElement('big-tip').classList.toggle('hidden');
                                    }
                                })
                            }, span({ class: 'fa fa-info-circle' })))
                        ])*/
                    ])
                ]),
                div({
                    id: ids.messagePanel,
                    class: 'message-panel hidden',
                    dataElement: 'message-panel'
                }, [
                    div({ class: 'col-md-3' }),
                    div({ class: 'col-md-9' }, [
                        div({
                            id: ids.message,
                            class: 'message',
                            dataElement: 'message'
                        })
                    ])
                ]),
                div({
                    id: ids.infoPanel,
                    class: 'info-panel row',
                    dataElement: 'info-panel'
                }, [
                    div({ class: 'col-md-12' }, div({ id: infoId }, [
                        renderInfoTip()
                    ]))

                ])
            ]);

            return {
                content: content,
                places: ids
            };
        }

        // LIFECYCLE

        function attach(node) {
            return Promise.try(function() {
                parent = node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });
                var events = Events.make({
                    node: container
                });

                var rendered = render(events);
                container.innerHTML = rendered.content;
                events.attachEvents();
                // TODO: use the pattern in which the render returns an object,
                // which includes events and other functions to be run after
                // content is added to the dom.
                PR.prettyPrint(null, container);

                places = {
                    field: document.getElementById(fieldId),
                    message: document.getElementById(rendered.places.message),
                    messagePanel: document.getElementById(rendered.places.messagePanel),
                    infoPanel: document.getElementById(rendered.places.infoPanel),
                    feedback: document.getElementById(rendered.places.feedback),
                    feedbackIndicator: document.getElementById(rendered.places.feedbackIndicator),
                    inputControl: document.getElementById(rendered.places.inputControl)
                };
                if (inputControl.attach) {
                    return inputControl.attach(places.inputControl);
                }
            });
        }

        function start(arg) {
            return attach(arg.node)
                .then(function() {
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
                    // bus.on('touched', function (message) {
                    //     places.feedback.style.backgroundColor = 'yellow';
                    // });
                    // bus.on('changed', function () {
                    //     places.feedback.style.backgroundColor = '';
                    // });
                    bus.on('enable', function(message) {
                        doEnable();
                    });
                    bus.on('disable', function(message) {
                        doDisable();
                    });

                    if (inputControl.start) {
                        return inputControl.start({
                                node: places.inputControl
                            })
                            .then(function() {
                                // TODO: get rid of this pattern
                                bus.emit('run', {
                                    node: places.inputControl
                                });
                            });
                    }
                });
        }

        function stop() {
            return Promise.try(function() {
                return inputControl.stop()
                    .then(function() {
                        if (parent && container) {
                            parent.removeChild(container);
                        }
                        bus.stop();
                        return null;
                    });
            });
        }

        return {
            start: start,
            stop: stop,
            bus: bus
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});