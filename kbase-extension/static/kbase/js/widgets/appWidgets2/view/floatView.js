/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'base/js/namespace',
    'kb_common/html',
    '../validators/float',
    'common/events',
    'common/ui',
    'common/props',

    'bootstrap',
    'css!font-awesome'
], function(Promise, Jupyter, html, Validation, Events, UI, Props) {
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

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */


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
                        dataType: 'float',
                        style: {
                            textAlign: 'right'
                        },
                        value: initialControlValue,
                        readonly: true
                    }),
                    (typeof max === 'number' ? div({ class: 'input-group-addon kb-input-group-addon', fontFamily: 'monospace' }, ' &#8804; ' + String(max)) : '')
                ]),
                div({ dataElement: 'message', style: { backgroundColor: 'red', color: 'white' } })
            ]);
        }

        function render() {
            return Promise.try(function() {
                var events = Events.make(),
                    inputControl = makeViewControl(model.getItem('value'), events, bus);

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

        function autoValidate() {
            return validate(model.getItem('value'))
                .then(function(result) {
                    bus.emit('validation', result);
                });
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
                // model.setItem('value', arg.value);

                bus.on('reset-to-defaults', function() {
                    resetModelValue();
                });
                bus.on('update', function(message) {
                    model.setItem('value', message.value);
                });
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
            stop: stop
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});