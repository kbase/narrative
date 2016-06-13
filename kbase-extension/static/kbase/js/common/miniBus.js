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
    'uuid',
    'bluebird'
], function (Uuid, Promise) {
    'use strict';
    var instanceId = 0;
    function newInstance() {
        instanceId += 1;
        return instanceId;
    }

    function factory(config) {
        var testListeners = [],
            keyListeners = {},
            listenerRegistry = {},
            sendQueue = [],
            requestMap = [],
            interval = 0,
            timer,
            instanceId = newInstance();


        function letListenerHandle(item, handle) {
            try {
                handle(item.message, item.envelope);
            } catch (ex) {
                console.error('miniBus handle failure', ex);
            }
        }

        function processKeyListeners(item) {
            var listeners = keyListeners[item.envelope.key];
            if (!listeners) {
                return;
            }
            listeners.forEach(function (listener) {
                letListenerHandle(item, listener.handle);
            });
        }

        function testListener(item, tester) {
            try {
                return tester(item.message, item.envelope);
            } catch (ex) {
                console.error('miniBus test failure', ex);
                return false;
            }
        }
        function processTestListeners(item) {
            testListeners.forEach(function (listener) {
                if (testListener(item, listener.test)) {
                    letListenerHandle(item, listener.handle);
                }
            });
        }
        function processPending() {
            var processingQueue = sendQueue;
            sendQueue = [];
            processingQueue.forEach(function (item) {
                if (item.envelope.key) {
                    processKeyListeners(item);
                } else {
                    processTestListeners(item);
                }
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
                    console.error('miniBus processing error', ex);
                }
            }, interval);
        }
        /*
         * Listening registers a function which when true given a message,
         * invokes the receiving function.
         *
         * Update: for more efficient routing, it is now possible to
         * specify a listen key which is used as an absolute address for
         * messages. The key may be a string or an object. Objects are converted
         * to a hash of sorts and then used as strings.
         *
         * Also, each listener now gets a unique id to allow unsubscription.
         *
         */
        function encodeKey(tryKey) {
            if (typeof tryKey === 'object') {
                return JSON.stringify(tryKey);
            }
            return tryKey;
        }
        function listen(spec) {
            var id = new Uuid(4).format(),
                key,
                listener = {
                    spec: spec,
                    id: id,
                    created: new Date()
                };

            if (spec.key) {
                key = encodeKey(spec.key);
                if (!keyListeners[key]) {
                    keyListeners[key] = [];
                }
                listener.handle = spec.handle;
                listener.key = key;

                keyListeners[key].push(listener);
            } else if (spec.test) {
                listener.test = spec.test;
                listener.handle = spec.handle;
                testListeners.push(listener);
            }

            listenerRegistry[id] = listener;

            return id;
        }

        /*
         * sending places a message into the queue (bus).
         *
         * The optional address can be used to route the message to some
         * some specific key or other strategy not yet thunk up.
         */
        function send(message, address) {
            // support simple message sending ...

            var envelope = {
                created: new Date(),
                id: new Uuid(4).format(),
                address: address
            };
            if (address) {
                if (address.key) {
                    envelope.key = encodeKey(address.key);
                }
            }
            sendQueue.push({
                message: message,
                envelope: envelope
            });
            run();
        }

        /*
         *
         * Respond sets up a special listener, which when it matches,
         * will put a return value into the bus as a new message targeted
         * at the requestId
         *
         */
        function respond(spec) {
            var originalHandle = spec.handle;
            function newHandle(message, envelope) {
                try {
                    var result = originalHandle(message);
                    send(result, {
                        key: {requestId: envelope.address.requestId}
                    });
                } catch (ex) {
                    console.error('Error handling in respond', ex);
                }
            }
            spec.handle = newHandle;
            listen(spec);
        }

        /*
         * Request supports request/response style messaging.
         * It accomplishes this by using a special store for messages -
         * pending requests - which is a map of all request messages.
         */
        function request(message, address) {
            return new Promise(function (resolve, reject) {
                var requestId = new Uuid(4).format();

                // when this listener with a key set to the request id
                // is called, it will resolve the promise, and it is
                // configured to be removed from the listeners once it
                // is run, as well as to invoke the error handler upon
                // timeout. (TODO)
                listen({
                    key: {requestId: requestId},
                    once: true,
                    timeout: address.timeout || 10000,
                    handle: function (message) {
                        resolve(message);
                    }
                });

                // NB - respond understands requestId in the envelope.
                if (!address) {
                    address = {};
                }
                address.requestId = requestId;
                send(message, address);
            });
        }

        // convenience strategies.
        function on(type, handler) {
            // listen({
            //     test: function (message) {
            //         return (message.type === type);
            //     },
            //     handle: handler
            // });
            listen({
               key: JSON.stringify({type: type}),
               handle: handler
            });
        }

        function emit(type, message) {
          if (message === undefined) {
            message = {};
          }
          send(message, {
            key: {type: type}
          });
        }


        return {
            listen: listen,
            send: send,
            respond: respond,
            request: request,
            on: on,
            emit: emit
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});
