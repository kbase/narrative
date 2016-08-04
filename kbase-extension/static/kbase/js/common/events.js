/*global define,console*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'kb_common/html'
], function ($, html) {
    'use strict';

    function factory(config) {
        var events = [],
            config = config || {},
            globalRoot = config.node;
        function addEvent(event) {
            var selector, id;
            if (event.id) {
                id = event.id;
                selector = '#' + event.id;
            } else if (event.selector) {
                id = html.genId();
                selector = event.selector;
            } else {
                id = html.genId();
                selector = '#' + id;
            }
            events.push({
                type: event.type,
                selector: selector,
                jquery: event.jquery,
                handler: function (e) {
                    event.handler(e);
                }
            });
            return id;
        }
        function addEvents(newEvents) {
            var selector, id;
            if (newEvents.id) {
                id = newEvents.id;
                selector = '#' + newEvents.id;
            } else if (newEvents.selector) {
                id = html.genId();
                selector = newEvents.selector;
            } else {
                id = html.genId();
                selector = '#' + id;
            }
            newEvents.events.forEach(function (event) {
                events.push({
                    type: event.type,
                    selector: selector,
                    handler: function (e) {
                        event.handler(e);
                    }
                });
            });
            return id;
        }
        function attachEvents(eventsRoot) {
            var root = globalRoot || eventsRoot;            
            events.forEach(function (event) {
                var node = root.querySelector(event.selector);
                if (!node) {
                    // console.error('could not find node', event.selector, root);
                    throw new Error('could not find node for ' + event.selector);
                }
                if (event.jquery) {
                    $(node).on(event.type, event.handler);
                } else {
                    node.addEventListener(event.type, event.handler);
                }
            });
            events = [];
        }
        return {
            addEvent: addEvent,
            addEvents: addEvents,
            attachEvents: attachEvents
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});