define([
    'bluebird',
    'kb_common/html',
    '../validators/text',
    'common/events',
    'common/ui',
    'common/props',
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
        textarea = t('textarea');

    function factory(config) {
        var spec = config.parameterSpec,
            parent, container,
            bus = config.bus,
            model = {
                value: undefined
            },
            ui,
            options = {
                enabled: true,
                rowCount: spec.ui.nRows || 5
            };

        // CONTROL

        function setControlValue(newValue) {
            if (newValue === null) {
                newValue = '';
            }
            ui.getElement('input-container.input').value = newValue;
        }

        // MODEL

        // NB this is a trusted method. The value had better be valid,
        // since it won't (can't) be validated. Validation is an event 
        // which sits between the control and the model.
        function setModelValue(value) {
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

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeViewControl() {
            return textarea({
                class: 'form-control',
                dataElement: 'input',
                readonly: true,
                rows: options.rowCount
            });
        }

        function render() {
            var content = div({
                dataElement: 'main-panel'
            }, [
                div({ dataElement: 'input-container' }, [
                    makeViewControl()
                ])
            ]);
            return {
                content: content
            };
        }

        // LIFECYCLE API
        function start(arg) {
            return Promise.try(function() {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                var theLayout = render();

                setModelValue(config.initialValue);

                container.innerHTML = theLayout.content;

                bus.on('reset-to-defaults', function() {
                    resetModelValue();
                });
                bus.on('update', function(message) {
                    setModelValue(message.value);
                });
                syncModelToControl();
            });
        }

        function stop() {
            return Promise.try(function() {
                if (parent && container) {
                    parent.removeChild(container);
                }
            });
        }

        // INIT

        model = Props.make({
            data: {
                value: null
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