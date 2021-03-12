define([
    'bluebird',
    'kb_common/html',
    'common/events',
    'common/ui',
    'common/props',
    'common/runtime',
    '../inputUtils',
    '../validators/int',

    'bootstrap',
    'css!font-awesome',
], (Promise, html, Events, UI, Props, Runtime, inputUtils, Validation) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        const spec = config.parameterSpec,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            model = Props.make({
                data: {
                    value: spec.data.nullValue,
                },
                onUpdate: function () {},
            });

        let parent, container, ui;

        // CONTROL

        function getControlValue() {
            return ui.getElement('input-container.input').value;
        }

        // MODEL

        function setModelValue(value) {
            // If a model value needs resetting, that should be done
            // by resetModelValue
            if (value === undefined) {
                return;
            }
            if (model.getItem('value') === value) {
                return;
            }
            model.setItem('value', value);
        }

        function resetModelValue() {
            setModelValue(spec.data.constraints.defaultValue);
        }

        // VALIDATION

        function validate(value) {
            return Promise.try(() => {
                return Validation.validate(value, spec);
            });
        }

        function autoValidate() {
            return validate(model.getItem('value')).then((result) => {
                channel.emit('validation', result);
            });
        }

        function importControlValue() {
            return Promise.try(() => {
                return Validation.importString(getControlValue());
            });
        }

        let autoChangeTimer;

        function cancelTouched() {
            if (autoChangeTimer) {
                window.clearTimeout(autoChangeTimer);
                autoChangeTimer = null;
            }
        }

        function handleTouched(interval) {
            const editPauseInterval = interval || 100;
            return {
                type: 'keyup',
                handler: function (e) {
                    channel.emit('touched');
                    cancelTouched();
                    autoChangeTimer = window.setTimeout(() => {
                        autoChangeTimer = null;
                        e.target.dispatchEvent(new Event('change'));
                    }, editPauseInterval);
                },
            };
        }

        function handleChanged() {
            return {
                type: 'change',
                handler: function () {
                    cancelTouched();
                    importControlValue()
                        .then((value) => {
                            model.setItem('value', value);
                            channel.emit('changed', {
                                newValue: value,
                            });
                            return validate(value);
                        })
                        .then((result) => {
                            if (result.isValid) {
                                if (config.showOwnMessages) {
                                    ui.setContent('input-container.message', '');
                                }
                            } else if (result.diagnosis === 'required-missing') {
                                // nothing??
                            } else {
                                if (config.showOwnMessages) {
                                    // show error message -- new!
                                    const message = inputUtils.buildMessageAlert({
                                        title: 'ERROR',
                                        type: 'danger',
                                        id: result.messageId,
                                        message: result.errorMessage,
                                    });
                                    ui.setContent('input-container.message', message.content);
                                    // FIXME: when enabled, this (silently) throws error
                                    // "Error: could not find node for #kb_html_.+"
                                    //
                                    // message.events.attachEvents();
                                }
                            }
                            channel.emit('validation', result);
                        })
                        .catch((err) => {
                            channel.emit('validation', {
                                isValid: false,
                                diagnosis: 'invalid',
                                errorMessage: err.message,
                            });
                        });
                },
            };
        }

        function makeInputControl(currentValue, events) {
            // CONTROL
            const min = spec.data.constraints.min,
                max = spec.data.constraints.max;
            let initialControlValue;
            if (typeof currentValue === 'number') {
                initialControlValue = String(currentValue);
            }
            return div({ style: { width: '100%' }, dataElement: 'input-wrapper' }, [
                div({ class: 'input-group', style: { width: '100%' } }, [
                    typeof min === 'number'
                        ? div(
                              {
                                  class: 'input-group-addon kb-input-group-addon',
                                  fontFamily: 'monospace',
                              },
                              String(min) + ' &#8804; '
                          )
                        : '',
                    input({
                        id: events.addEvents({
                            events: [handleChanged(), handleTouched()],
                        }),
                        class: 'form-control',
                        dataElement: 'input',
                        dataType: 'int',
                        value: initialControlValue,
                        style: {
                            textAlign: 'right',
                        },
                    }),
                    typeof max === 'number'
                        ? div(
                              {
                                  class: 'input-group-addon kb-input-group-addon',
                                  fontFamily: 'monospace',
                              },
                              ' &#8804; ' + String(max)
                          )
                        : '',
                ]),
                div({ dataElement: 'message', style: { backgroundColor: 'red', color: 'white' } }),
            ]);
        }

        function render() {
            return Promise.try(() => {
                const events = Events.make(),
                    inputControl = makeInputControl(model.getItem('value'), events);

                ui.setContent('input-container', inputControl);
                events.attachEvents(container);
            });
        }

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

                channel.on('reset-to-defaults', () => {
                    resetModelValue();
                });
                channel.on('update', (message) => {
                    model.setItem('value', message.value);
                });

                return render().then(() => {
                    return autoValidate();
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                if (container) {
                    parent.removeChild(container);
                }
                return null;
            });
        }

        // INIT
        setModelValue(config.initialValue);

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
