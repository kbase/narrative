define([
    'bluebird',
    'kb_common/html',
    '../validators/int',
    'common/events',
    'common/ui',
    'common/props',
    '../inputUtils',

    'bootstrap',
    'css!font-awesome'
], function(
    Promise,
    html,
    Validation,
    Events,
    UI,
    Props,
    inputUtils) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        var enabled = config.enabled || true,
            spec = config.parameterSpec,
            bus = config.bus,
            parent,
            container,
            model,
            ui;

        // CONTROL

        function getControlValue() {
            return ui.getElement('input-container.input').value;
        }

        function setControlValue(value) {
            var stringValue;
            if (value === null) {
                stringValue = '';
            } else {
                stringValue = String(value);
            }

            ui.getElement('input-container.input').value = stringValue;
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

        // sync the dom to the model.
        function syncModelToControl() {
            setControlValue(model.getItem('value', null));
        }


        // ENABLE / DISABLE

        function doEnable() {
            if (enabled === false) {
                // do something.
                enabled = true;
                var control = ui.getElement('input-container.input');
                if (control) {
                    control.disabled = false;
                    control.readonly = false;
                }
            }
        }

        function doDisable() {
            if (enabled === true) {
                // do something
                enabled = false;
                var control = ui.getElement('input-container.input');
                if (control) {
                    control.disabled = true;
                    control.readonly = true;
                }
            }
        }

        // VALIDATION

        function validate(value) {
            return Promise.try(function() {
                return Validation.validate(value, spec);
            });
        }

        function autoValidate() {
            return validate(model.getItem('value'))
                .then(function(result) {
                    bus.emit('validation', result);
                });
        }

        function importControlValue() {
            return Promise.try(function() {
                return Validation.importString(getControlValue());
            });
        }

        var autoChangeTimer;

        function cancelTouched() {
            if (autoChangeTimer) {
                window.clearTimeout(autoChangeTimer);
                autoChangeTimer = null;
            }
        }

        function handleTouched(interval) {
            var editPauseInterval = interval || 100;
            return {
                type: 'keyup',
                handler: function(e) {
                    bus.emit('touched');
                    cancelTouched();
                    autoChangeTimer = window.setTimeout(function() {
                        autoChangeTimer = null;
                        e.target.dispatchEvent(new Event('change'));
                    }, editPauseInterval);
                }
            };
        }

        function handleChanged() {
            return {
                type: 'change',
                handler: function() {
                    cancelTouched();
                    importControlValue()
                        .then(function(value) {
                            model.setItem('value', value);
                            bus.emit('changed', {
                                newValue: value
                            });
                            return validate(value);
                        })
                        .then(function(result) {
                            if (result.isValid) {
                                if (config.showOwnMessages) {
                                    ui.setContent('input-container.message', '');
                                }
                            } else if (result.diagnosis === 'required-missing') {
                                // nothing??
                            } else {
                                if (config.showOwnMessages) {
                                    // show error message -- new!
                                    var message = inputUtils.buildMessageAlert({
                                        title: 'ERROR',
                                        type: 'danger',
                                        id: result.messageId,
                                        message: result.errorMessage
                                    });
                                    ui.setContent('input-container.message', message.content);
                                    message.events.attachEvents();
                                }
                            }
                            bus.emit('validation', result);
                        })
                        .catch(function(err) {
                            bus.emit('validation', {
                                isValid: false,
                                diagnosis: 'invalid',
                                errorMessage: err.message
                            });
                        });
                }
            };
        }

        function makeInputControl(currentValue, events) {
            // CONTROL
            var initialControlValue,
                min = spec.data.constraints.min,
                max = spec.data.constraints.max;
            if (currentValue) {
                initialControlValue = String(currentValue);
            }
            return div({ style: { width: '100%' }, dataElement: 'input-wrapper' }, [
                div({ class: 'input-group', style: { width: '100%' } }, [
                    (typeof min === 'number' ? div({ class: 'input-group-addon', fontFamily: 'monospace' }, String(min) + ' &#8804; ') : ''),
                    input({
                        id: events.addEvents({
                            events: [handleChanged(), handleTouched()]
                        }),
                        class: 'form-control',
                        dataElement: 'input',
                        dataType: 'int',
                        value: initialControlValue,
                        style: {
                            textAlign: 'right'
                        }
                    }),
                    (typeof max === 'number' ? div({ class: 'input-group-addon', fontFamily: 'monospace' }, ' &#8804; ' + String(max)) : '')
                ]),
                div({ dataElement: 'message', style: { backgroundColor: 'red', color: 'white' } })
            ]);
        }

        function render() {
            return Promise.try(function() {
                var events = Events.make(),
                    inputControl = makeInputControl(model.getItem('value'), events);

                ui.setContent('input-container', inputControl);
                events.attachEvents(container);
            });
        }

        function layout(events) {
            var content = div({
                dataElement: 'main-panel'
            }, [
                div({ dataElement: 'input-container' })
            ]);
            return {
                content: content,
                events: events
            };
        }



        // LIFECYCLE API

        function start(arg) {
            return Promise.try(function() {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                var events = Events.make(),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents(container);
                // model.setItem('value', message.value);

                bus.on('reset-to-defaults', function() {
                    resetModelValue();
                });
                bus.on('update', function(message) {
                    model.setItem('value', message.value);
                });
                bus.on('enable', function() {
                    doEnable();
                });
                bus.on('disable', function() {
                    doDisable();
                });

                // TODO: since we now rely on initialValue -- perhaps 
                // we can omit the 'sync' event or at least in cases
                // in which the initial value is known to be available.
                // bus.emit('sync');

                return render()
                    .then(function() {
                        return autoValidate();
                    });
            });
        }

        function stop() {
            return Promise.try(function() {
                if (container) {
                    parent.removeChild(container);
                }
                return null;
            });
        }

        // INIT

        model = Props.make({
            data: {
                value: spec.data.nullValue
            },
            onUpdate: function() {}
        });

        setModelValue(config.initialValue);

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