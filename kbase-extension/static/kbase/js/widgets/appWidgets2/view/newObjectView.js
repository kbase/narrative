/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    '../validation',
    'common/events',
    'common/runtime',
    'common/dom',
    'bootstrap',
    'css!font-awesome'
], function(Promise, html, Validation, Events, Runtime, Dom) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        input = t('input');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            parent,
            container,
            bus = config.bus,
            model = {
                value: undefined
            },
            dom;

        options.enabled = true;

        function setModelValue(value) {
            return Promise.try(function() {
                    if (model.value !== value) {
                        model.value = value;
                        return true;
                    }
                    return false;
                })
                .then(function(changed) {
                    render();
                });
        }

        function unsetModelValue() {
            return Promise.try(function() {
                    model.value = undefined;
                })
                .then(function(changed) {
                    render();
                });
        }

        function resetModelValue() {
            if (spec.data.defaultValue) {
                setModelValue(spec.data.defaultValue);
            } else {
                unsetModelValue();
            }
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function makeInputControl(currentValue, events, bus) {
            return input({
                class: 'form-control',
                dataElement: 'input',
                value: currentValue,
                readonly: true,
                disabled: true
            });
        }

        function render() {
            Promise.try(function() {
                var events = Events.make(),
                    inputControl = makeInputControl(model.value, events, bus);

                dom.setContent('input-container', inputControl);
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

        function start() {
            return Promise.try(function() {
                bus.on('run', function(message) {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    dom = Dom.make({ node: container });

                    var events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents(container);


                    bus.on('reset-to-defaults', function(message) {
                        resetModelValue();
                    });
                    bus.on('update', function(message) {
                        setModelValue(message.value);
                    });
                    bus.on('refresh', function() {

                    });

                    bus.emit('sync');
                });
            });
        }

        return {
            start: start
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});