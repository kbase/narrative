/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'jquery',
    'base/js/namespace',
    'kb_common/html',
    'common/events',
    'common/ui',
    'common/runtime',
    'common/props',
    'kb_service/client/userAndJobState',
    'kb_service/client/shock',
    '../validators/text',


    'bootstrap',
    'css!font-awesome'
], function (
    Promise,
    $,
    Jupyter,
    html,
    Events,
    UI,
    Runtime,
    Props,
    UJS,
    Shock,
    Validation
) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        input = t('input'),
        table = t('table'),
        tr = t('tr'),
        td = t('td');

    function factory(config) {
        var spec = config.parameterSpec,
            hostNode,
            container,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            ui,
            model;

        // MODEL

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
            setModelValue(spec.data.defaultValue);
        }

        // sync the dom to the model.
        function syncModelToControl() {
            setControlValue(model.getItem('value', null));
        }

        // CONTROL 

        function setControlValue(newValue) {
            ui.getElement('input-container.input').value = newValue;
        }


        // VALIDATION

        function validate(value) {
            return Promise.try(function () {
                return Validation.validate(value, spec);
            });
        }

        function autoValidate() {
            return validate(model.getItem('value'))
                .then(function (result) {
                    channel.emit('validation', result);
                });
        }

        function makeViewControl(currentValue) {
            return input({
                class: 'form-control',
                readonly: true,
                dataElement: 'input',
                value: currentValue
            });
        }

        function render() {
            Promise.try(function () {
                var events = Events.make(),
                    inputControl = makeViewControl(model.value, events);

                ui.setContent('input-container', inputControl);
                events.attachEvents(container);
            })
            .then(function () {
                return autoValidate();
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
            return Promise.try(function () {
                hostNode = arg.node;
                container = hostNode.appendChild(document.createElement('div'));
                ui = UI.make({ node: arg.node });

                var events = Events.make(),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents(container);

                setModelValue(config.initialValue);

                render();
                autoValidate();
                syncModelToControl();


                channel.on('reset-to-defaults', function (message) {
                    resetModelValue();
                });
                channel.on('update', function (message) {
                    setModelValue(message.value);
                });
                // channel.emit('sync');
            });
        }

        function stop() {
            return Promise.try(function () {
                if (container) {
                    hostNode.removeChild(container);
                }
                busConnection.stop();
            });
        }

        model = Props.make({
            data: {
                value: null
            },
            onUpdate: function () {
                //syncModelToControl();
                //autoValidate();
            }
        });

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});