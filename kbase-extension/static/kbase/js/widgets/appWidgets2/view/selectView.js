/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    '../validators/text',
    'common/events',
    'common/ui',

    'bootstrap',
    'css!font-awesome'
], function(
    Promise,
    html,
    Validation,
    Events,
    UI) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        select = t('select'),
        option = t('option');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            bus = config.bus,
            parent,
            ui,
            container,
            model = {
                availableValues: null,
                value: null
            };

        // Validate configuration.
        // Nothing to do...

        options.enabled = true;

        model.availableValues = spec.data.constraints.options;

        model.availableValuesMap = {};
        model.availableValues.forEach(function(item, index) {
            item.index = index;
            model.availableValuesMap[item.value] = item;
        });

        function getControlValue() {
            var control = ui.getElement('input-container.input'),
                selected = control.selectedOptions;

            if (selected.length === 0) {
                return spec.data.nullValue;
            }

            // we are modeling a single string value, so we always just get the 
            // first selected element, which is all there should be!
            return selected.item(0).value;
        }

        // VALIDATION

        function importControlValue() {
            return Promise.try(function() {
                return Validation.importString(getControlValue());
            });
        }

        function validate(value) {
            return Promise.try(function() {
                return Validation.validate(value, spec);
            });
        }

        function autoValidate() {
            return validate(model.value)
                .then(function(result) {
                    bus.emit('validation', result);
                });
        }

        function makeInputControl(events) {
            var selected,
                selectOptions = model.availableValues.map(function(item) {
                    selected = false;
                    if (item.value === model.value) {
                        selected = true;
                    }

                    return option({
                        value: item.value,
                        selected: selected
                    }, item.display);
                });

            // CONTROL
            return select({
                class: 'form-control',
                dataElement: 'input',
                readonly: true,
                disabled: true
            }, [option({ value: '' }, '')].concat(selectOptions));
        }

        function syncModelToControl() {
            // assuming the model has been modified...
            var control = ui.getElement('input-control.input');
            // loop through the options, selecting the one with the value.
            // unselect
            if (control.selectedIndex >= 0) {
                control.options.item(control.selectedIndex).selected = false;
            }
            var selectedItem = model.availableValuesMap[model.value];
            if (selectedItem) {
                control.options.item(selectedItem.index + 1).selected = true;
            }
        }

        function layout(events) {
            var content = div({
                dataElement: 'main-panel'
            }, [
                div({ dataElement: 'input-container' },
                    makeInputControl(events)
                )
            ]);
            return {
                content: content,
                events: events
            };
        }

        function setModelValue(value) {
            if (model.value !== value) {
                model.value = value;
            }
        }

        function resetModelValue() {
            setModelValue(spec.data.defaultValue);
        }


        // LIFECYCLE API

        function start(arg) {
            return Promise.try(function() {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                var events = Events.make({ node: container }),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents();

                bus.on('reset-to-defaults', function() {
                    resetModelValue();
                });
                bus.on('update', function(message) {
                    setModelValue(message.value);
                });
                // bus.emit('sync');

                setModelValue(config.initialValue);
                autoValidate();
                syncModelToControl();
            });
        }

        function stop() {
            return Promise.try(function() {
                if (container) {
                    parent.removeChild(container);
                }
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