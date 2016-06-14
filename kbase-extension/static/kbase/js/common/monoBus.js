/*global define */
/*jslint white:true,global:true*/
/*
 * MonoBus
 * One bus to rule them all...
 * 
 * The idea is to have a single message bus which allows natural and transparent
 * partitioning.
 * 
 * A single message bus is easier to debug, and should make more abstract bus
 * mechanisms easier to create.
 * 
 * But a single bus by itself exposes too much, provides no privacy or protection
 * for otherwise private channels.
 * 
 * 
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
        var api,
            config = config || {},
            listenerRegistry = {},
            sendQueue = [],
            requestMap = [],
            interval = 0,
            timer,
            instanceId = newInstance(),
            channels = {},
            doLogMessages = false,
            strictMode = config.strict;

        // CHANNELS

        /*
         * Channels are the top level method for distributing messages. Many
         * message producers and consumers will communicate solely over a channel.
         * 
         * Channels are implemented as property of envelopes and addresses.
         */

        function makeChannel(spec) {
            if (channels[spec.name]) {                
                throw new Error('A channel with name "' + spec.name + '" already exists');
            }
            if (!spec.description) {
                if (strictMode) {
                    throw new Error('Channel description is required');
                } else {
                    console.warn('Channel created without description');
                }
            }
            console.log('MAKING CHANNEL', spec);
            channels[spec.name] = {
                name: spec.name,
                description: spec.description,
                created: new Date(),
                messageCount: 0,
                listeners: [],
                keyListeners: {},
                testListeners: []
            };
            return channels[spec.name];
        }

        function ensureChannel(name) {
            if (!channels[name]) {
                console.warn('Channel implicitly created', name);
                makeChannel({name: name});
            }
            return channels[name];
        }
        
        function getChannel(name) {
            var channel = channels[name];
            if (!channel) {
                throw new Error('Channel with name "' + name + '" does not exist');
            }
            return channel;
        }

        function removeChannel(name) {
            delete channels[name];
        }

        // LISTENING

        function letListenerHandle(item, handle) {
            try {
                handle(item.message, item.envelope);
            } catch (ex) {
                console.error('Bus handle failure', ex);
            }
        }

        function processKeyListeners(channel, item) {
            var listeners = channel.keyListeners[item.envelope.key],
                handled = false;
            if (!listeners) {
                return;
            }
            listeners.forEach(function (listener) {
                handled = true;
                if (doLogMessages) {
                    console.log('PROCESSING KEY LISTENER', channel, item);
                }
                letListenerHandle(item, listener.handle);
            });
            return handled;
        }

        function testListener(item, tester) {
            try {
                return tester(item.message, item.envelope);
            } catch (ex) {
                console.error('Bus test failure', ex);
                return false;
            }
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
                },
            channelName = spec.channel || 'default',
                channel = ensureChannel(channelName);
            if (spec.key) {
                key = encodeKey(spec.key);
                if (!channel.keyListeners[key]) {
                    channel.keyListeners[key] = [];
                }
                listener.handle = spec.handle;
                listener.key = key;

                channel.keyListeners[key].push(listener);
            } else if (spec.test) {
                listener.test = spec.test;
                listener.handle = spec.handle;
                channel.testListeners.push(listener);
            } else {
                console.warn('listen: nothing to listen on (test or key)');
            }

            return id;
        }
        
        // PROCESSING ENGINE 

        function processTestListeners(channel, item) {
            var handled = false;
            channel.testListeners.forEach(function (listener) {
                if (doLogMessages) {
                    console.log('PROCESSING TEST LISTENER?', channel, item);
                }
                if (testListener(item, listener.test)) {
                    handled = true;
                    console.log('PROCESSING TEST LISTENER!', channel, item);
                    letListenerHandle(item, listener.handle);
                }
            });
            return handled;
        }
        function processPending() {
            var processingQueue = sendQueue;
            sendQueue = [];
            processingQueue.forEach(function (item) {
                var channel = getChannel(item.envelope.channel),
                    handled;

                if (item.envelope.key) {
                    if (doLogMessages) {
                        console.log('PROCESSING KEY', channel, item);
                    }
                    handled = processKeyListeners(channel, item);
                } else {
                    if (doLogMessages) {
                        console.log('PROCESSING TEST', channel, item);
                    }
                    handled = processTestListeners(channel, item);
                }
                if (!handled) {
                    console.warn('No listeners handled message', item, channel);
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
                    console.error('Bus processing error', ex);
                }
            }, interval);
        }

        // SENDING

        /*
         * sending places a message into the queue (bus).
         *
         * The optional address can be used to route the message to some
         * some specific key or other strategy not yet thunk up.
         */
        function send(message, address) {
            // support simple message sending ...
            address = address || {};

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

            envelope.channel = address.channel || 'default';

            if (doLogMessages) {
                console.log('SEND', message, envelope);
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
                    var responseMessage = originalHandle(message);
                    send(responseMessage, {
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
                    handle: function (responseMessage) {
                        resolve(responseMessage);
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
        function on(type, handler, channel) {
            // listen({
            //     test: function (message) {
            //         return (message.type === type);
            //     },
            //     handle: handler
            // });
            listen({
                channel: channel,
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

        function logMessages(doLog) {
            if (doLog) {
                doLogMessages = true;
            } else {
                doLogMessages = false;
            }
        }



        // CHANNEL BUS

        /*
         * Creates and returns a mini bus wrapper around a single channel.
         * Allows usage of the main bus but within a scope limited to the 
         * specific channel. The main bus is available through a method.
         */
        function makeChannelBus(name, description) {
            var channelName = name || new Uuid(4).format(),
                channelSpec = {
                    name: channelName,
                    description: description
                };
                
            makeChannel(channelSpec);

            function on(type, handler) {
                return listen({
                    channel: channelName,
                    key: {type: type},
                    handle: handler
                });
            }

            function emit(type, message) {
                if (message === undefined) {
                    message = {};
                }
                return send(message, {
                    channel: channelName,
                    key: {type: type}
                });
            }

            function channelSend(message, address) {
                address = address || {};
                address.channel = channelName;
                return send(message, address);
            }

            function channelListen(spec) {
                spec.channel = channelName;
                return listen(spec);
            }

            function channelRequest(message, address) {
                address = address || {};
                address.channel = channelName;
                return request(message, address);
            }

            function channelRespond(spec) {
                spec.channel = channelName;
                return respond(spec);
            }

            function bus() {
                return api;
            }
            
            function stop() {
                removeChannel(channelName);
            }

            return {
                on: on,
                emit: emit,
                bus: bus,
                listen: channelListen,
                send: channelSend,
                respond: channelRespond,
                request: channelRequest,
                stop: stop
            };
        }

        // MANAGEMENT



        // MAIN
        makeChannel({name: 'default', description: 'The Default Channel'});

        // API
        api = {
            listen: listen,
            send: send,
            respond: respond,
            request: request,
            on: on,
            emit: emit,
            makeChannelBus: makeChannelBus,
            makeChannel: makeChannel,
            removeChannel: removeChannel,
            logMessages: logMessages
        };

        return api;
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});