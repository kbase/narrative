/*global define */
/*jslint white:true,global:true*/
/*
 * MiniBus
 * A lightweight message bus implementation.
 * The metaphor of the bus, is that of the hardware bus ... a set of devices
 * connected over a communication channel (wires) which can send and receive
 * data over the channel.
 * As with hardware buses, this requires that each thing on the bus -- components -- 
 * need to have the smarts to deal with the bus. However, in our case those 
 * requirements are very minimal.
 * 
 * bus - the object which manages the communication and to which components may send and receive messages
 * message - a piece of data sent from one component to another, a plain javascript object
 * envelope - an internal container for the message which acts both as a wrapper and
 *            place to retain message state.
 * timeout - each message may provide a timeout
 * 
 * api
 * send - a component places a message onto the bus
 * listen - a component requests that messages meeting a certain pattern invoke a function it provides
 *
 */
define([
], function () {
    'use strict';
    function factory(config) {
        var listeners = [],
            queue = [],
            interval = 0,
            timer;
        function testListener(message, tester) {
            try {
                return tester(message);
            } catch (ex) {
                console.error('microBus test failure', ex);
                return false;
            }
        }
        function letListenerHandle(message, handle) {
            try {
                handle(message);
            } catch (ex) {
                console.error('microBus handle failure', ex);
            }
        }
        function processPending() {
            var processing = queue;
            queue = [];
            processing.forEach(function (item) {
                listeners.forEach(function (listener) {
                    if (testListener(item.message, listener.test)) {
                        letListenerHandle(item.message, listener.handle);
                    }
                });
            });
        }
        /*
         * 
         * running the bus queue is as
         */
        function run() {
            if (timer) {
                return;
            }
            timer = window.setTimeout(function () {
                timer = null;
                try {
                    processPending();
                } catch (ex) {
                    console.error('microBus processing error', ex);
                }
            }, interval);
        }
        /*
         * Listening registers a function which when true given a message,
         * invokes the receiving function.
         * 
         */
        function listen(spec) {
            listeners.push({
                test: spec.test,
                handle: spec.handle
            });
        }
        function on(type, handler) {
            listeners.push({
                test: function (message) {
                    return (type === message.type);
                },
                handle: handler
            });
        }

        /*
         * sending places a message into the queue (bus)
         */
        function send(message, options) {
            queue.push({
                message: message,
                envelope: {
                    created: new Date()
                }
            });
            run();
        }

        return {
            listen: listen,
            send: send,
            on: on
        };
    }
    
    return {
        make: function (config) {
            return factory(config);
        }
    };
});