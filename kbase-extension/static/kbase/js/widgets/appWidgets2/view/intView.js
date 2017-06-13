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
    Props) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        var spec = config.parameterSpec,
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

        function makeViewControl(currentValue) {
            // CONTROL
            var initialControlValue,
                min = spec.data.constraints.min,
                max = spec.data.constraints.max;
            if (typeof currentValue === 'number') {
                initialControlValue = String(currentValue);
            }
            return div({ style: { width: '100%' }, dataElement: 'input-wrapper' }, [
                div({ class: 'input-group', style: { width: '100%' } }, [
                    (typeof min === 'number' ? div({ class: 'input-group-addon kb-input-group-addon', fontFamily: 'monospace' }, String(min) + ' &#8804; ') : ''),
                    input({
                        class: 'form-control',
                        dataElement: 'input',
                        dataType: 'int',
                        readonly: true,
                        value: initialControlValue,
                        style: {
                            textAlign: 'right'
                        }
                    }),
                    (typeof max === 'number' ? div({ class: 'input-group-addon kb-input-group-addon', fontFamily: 'monospace' }, ' &#8804; ' + String(max)) : '')
                ]),
                div({ dataElement: 'message', style: { backgroundColor: 'red', color: 'white' } })
            ]);
        }

        function render() {
            return Promise.try(function() {
                var events = Events.make(),
                    inputControl = makeViewControl(model.getItem('value'), events);

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