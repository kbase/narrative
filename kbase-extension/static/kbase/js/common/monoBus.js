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
    'bluebird',
    './lang',
    './unodep'
], function(Uuid, Promise, lang, utils) {
    'use strict';
    var instanceId = 0;

    function newInstance() {
        instanceId += 1;
        return instanceId;
    }

    function factory(cfg) {
        var api,
            config = cfg || {},
            listenerRegistry = {},
            verbose = config.verbose || false,
            chatty = config.chatty || false,
            transientMessages = [],
            requestMap = [],
            interval = 0,
            timer,
            instanceId = newInstance(),
            channels = {},
            doLogMessages = false,
            strictMode = config.strict;


        function warn(message) {
            if (verbose) {
                console.warn(message);
            }
        }

        function log(message) {
            if (chatty) {
                console.log(message);
            }
        }

        // CHANNELS

        /*
         * Channels are the top level method for distributing messages. Many
         * message producers and consumers will communicate solely over a channel.
         *
         * Channels are implemented as property of envelopes and addresses.
         */

        function makeChannel(spec) {
            if (!spec.name) {
                spec.name = new Uuid(4).format();
            }
            if (channels[spec.name]) {
                console.error('bus error - A channel with name "' + spec.name + '" already exists');
                throw new Error('A channel with name "' + spec.name + '" already exists');
            }
            if (!spec.description) {
                if (strictMode) {
                    throw new Error('Channel description is required');
                } else {
                    warn('Channel created without description');
                }
            }
            channels[spec.name] = {
                name: spec.name,
                description: spec.description,
                created: new Date(),
                messageCount: 0,
                listeners: {},
                keyListeners: {},
                testListeners: [],
                persistentMessages: {}
            };
            return spec.name;
        }

        function ensureChannel(name) {
            if (!channels[name]) {
                warn('Channel implicitly created', name);
                makeChannel({ name: name });
            }
            return channels[name];
        }

        function getChannel(name) {
            var channel = channels[name];
            if (!channel) {
                // throw new Error('Channel with name "' + name + '" does not exist');
                return;
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
                console.error(ex.message);
            }
        }

        function processListener(channel, item) {
            var listener = channel.listeners[item.envelope.listenerId],
                handled = false;
            if (!listener) {
                return;
            }
            letListenerHandle(item, listener.handle);
            return handled;
        }

        function processKeyListeners(channel, item) {
            var listeners = channel.keyListeners[item.envelope.key],
                handled = false;
            if (!listeners) {
                return;
            }
            listeners.forEach(function(listener) {
                handled = true;
                log('PROCESSING KEY LISTENER', channel, item);
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

        /*
         * basically takes care of sorting the keys before encoding.
         * TODO: actually do that.
         */
        function encodeObject(tryObject) {
            return JSON.stringify(tryObject);
        }

        function canonicalizeChannelName(channelName, defaultName) {
            if (!channelName) {
                return defaultName || 'default';
            }
            if (typeof channelName === 'object') {
                return encodeObject(channelName);
            }
            if (typeof channelName === 'string') {
                return channelName;
            }
            return String(channelName);
        }


        function listen(spec) {
            var id = new Uuid(4).format(),
                key,
                channelName = canonicalizeChannelName(spec.channel),
                channel = ensureChannel(channelName),
                listener = {
                    spec: spec,
                    id: id,
                    created: new Date(),
                    channelName: channelName
                };

            if (spec.key) {
                key = encodeKey(spec.key);
                if (!channel.keyListeners[key]) {
                    channel.keyListeners[key] = [];
                }
                listener.handle = spec.handle;
                listener.key = key;

                channel.keyListeners[key].push(listener);
                channel.listeners[id] = listener;

                // If it matches a persistent message, we need to trigger the
                // persistent message to emit a message immediately.

                maybeSendPersistentMessages(channel, key, id);

                // Just trigger a queue run in case there are any persistent
                // messages.
                run();
            } else if (spec.test) {
                listener.test = spec.test;
                listener.handle = spec.handle;
                channel.testListeners.push(listener);
            } else {
                warn('listen: nothing to listen on (test or key)');
            }

            listenerRegistry[id] = listener;
            return id;
        }

        function removeListener(id) {
            var listenerToRemove = listenerRegistry[id],
                channel, listeners, newListeners;
            if (!listenerToRemove) {
                return;
            }
            channel = getChannel(listenerToRemove.channelName);
            if (!channel) {
                return;
            }
            if (listenerToRemove.key) {
                listeners = channel.keyListeners[listenerToRemove.key];
                if (!listeners) {
                    return;
                }
                channel.keyListeners[listenerToRemove.key] = listeners.filter(function(listener) {
                    return (listener.id !== listenerToRemove.id);
                });
            } else if (listenerToRemove.test) {
                listeners = channel.testListeners;
                if (!listeners) {
                    return;
                }
                channel.testListeners = listeners.filter(function(listener) {
                    return (listener.id !== listenerToRemove.id);
                });
            }
        }

        function removeListeners(ids) {
            ids.forEach(function(id) {
                removeListener(id);
            });
        }

        // PROCESSING ENGINE

        // PROCESSING ENGINE

        function processTestListeners(channel, item) {
            var handled = false;
            channel.testListeners.forEach(function(listener) {
                log('PROCESSING TEST LISTENER?', channel, item);
                if (testListener(item, listener.test)) {
                    handled = true;
                    log('PROCESSING TEST LISTENER!', channel, item);
                    letListenerHandle(item, listener.handle);
                }
            });
            return handled;
        }


        function processQueueItem(item) {
            var channel = getChannel(item.envelope.channel),
                handled;

            if (!channel) {
                return;
            }

            if (item.envelope.listenerId) {
                log('PROCESSING BY LISTENER ID', channel, item);
                handled = processListener(channel, item);
            } else if (item.envelope.key) {
                log('PROCESSING KEY', channel, item);
                handled = processKeyListeners(channel, item);
            } else {
                log('PROCESSING TEST', channel, item);
                handled = processTestListeners(channel, item);
            }
            if (!handled) {
                warn('No listeners handled message', item, channel);
            }
        }


        function processQueues() {
            var processingQueue = transientMessages;
            transientMessages = [];

            processingQueue.forEach(function(item) {
                try {
                    processQueueItem(item);
                } catch (ex) {
                    console.error('ERROR processing queue item', ex);
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
            timer = window.setTimeout(function() {
                timer = null;
                try {
                    processQueues();
                } catch (ex) {
                    console.error('Bus processing error', ex);
                }
            }, interval);
        }

        // SENDING

        function setPersistentMessage(message, envelope) {
            var channel = ensureChannel(envelope.channel),
                key = envelope.key,
                existingMessage;
            if (!key) {
                throw new Error('Persistent messages require a key');
            }

            existingMessage = channel.persistentMessages[key];
            if (existingMessage) {
                if (utils.isEqual(existingMessage.message, message)) {
                    return;
                }
            }

            channel.persistentMessages[key] = {
                message: message,
                envelope: envelope
            };
            transientMessages.push({
                message: message,
                envelope: envelope
            });
            run();
        }

        function maybeSendPersistentMessages(channel, key, id) {
            var persistentMessage = channel.persistentMessages[key];
            if (!persistentMessage) {
                return;
            }
            var envelope = lang.copy(persistentMessage.envelope);
            envelope.listenerId = id;
            transientMessages.push({
                message: persistentMessage.message,
                envelope: envelope
            });
            run();
        }

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

            if (address.key) {
                envelope.key = encodeKey(address.key);
            }

            envelope.channel = canonicalizeChannelName(address.channel);

            log('SEND', message, envelope);

            transientMessages.push({
                message: message,
                envelope: envelope
            });
            run();
        }

        function set(message, address) {
            // support simple message sending ...
            address = address || {};

            var envelope = {
                created: new Date(),
                id: new Uuid(4).format(),
                address: address
            };

            if (!address.key) {
                throw new Error('Setting a persistent message requires a key');
            }

            envelope.key = encodeKey(address.key);
            envelope.channel = canonicalizeChannelName(address.channel);

            log('SET', message, envelope);

            // Persistent messages are stored on a map by 'key' per channel.
            setPersistentMessage(message, envelope);
        }

        function get(spec, defaultValue) {
            var key,
                channelName = canonicalizeChannelName(spec.channel),
                channel = ensureChannel(channelName);

            if (spec.key) {
                key = encodeKey(spec.key);

                var persistentMessage = channel.persistentMessages[key];
                if (!persistentMessage) {
                    return defaultValue;
                }

                return persistentMessage.message;
            } else if (spec.test) {
                // TODO
                // listener.test = spec.test;
                // listener.handle = spec.handle;
                // channel.testListeners.push(listener);
                warn('Not current support for test filtering on get');
                return defaultValue;
            } else {
                warn('listen: nothing to listen on (test or key)');
                return defaultValue;
            }
        }

        /*
         *
         * Respond sets up a special listener, which when it matches,
         * will put a return value into the bus as a new message targeted
         * at the requestId
         *
         *
         */
        function respond(spec) {
            var originalHandle = spec.handle;

            function newHandle(message, envelope) {
                try {
                    var responseMessage = originalHandle(message);
                    send(responseMessage, {
                        channel: envelope.channel,
                        key: { requestId: envelope.address.requestId }
                    });
                } catch (ex) {
                    console.error('Error handling in respond', ex);
                }
            }
            spec.handle = newHandle;
            return listen(spec);
        }

        /*
         * Request supports request/response style messaging.
         * It accomplishes this by using a special store for messages -
         * pending requests - which is a map of all request messages.
         */
        function request(message, address) {
            return new Promise(function(resolve, reject) {
                var requestId = new Uuid(4).format();

                // when this listener with a key set to the request id
                // is called, it will resolve the promise, and it is
                // configured to be removed from the listeners once it
                // is run, as well as to invoke the error handler upon
                // timeout. (TODO)
                listen({
                    channel: address.channel,
                    key: { requestId: requestId },
                    once: true,
                    timeout: address.timeout || 10000,
                    handle: function(responseMessage) {
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

        // function get(address) {
        //     return new Promise(function(resolve, reject) {
        //         console.log('GOT? request with', address);
        //         listen({
        //             channel: address.channel,
        //             key: address.key,
        //             // once: true,
        //             timeout: address.timeout || 10000,
        //             handle: function(message) {
        //                 resolve(message);
        //             }
        //         });
        //     });
        // }
        function plisten(spec) {
            var initialized = false;
            var id;
            var p = new Promise(function(resolve) {
                id = listen({
                    channel: spec.channel,
                    key: spec.key,
                    handle: function(message, address) {
                        if (!initialized) {
                            initialized = true;
                            resolve(message);
                        } else {
                            try {
                                spec.handle(message, address);
                            } catch (ex) {
                                console.error('ERROR in plisten', ex);
                            }
                        }
                    }
                });
            });
            return {
                promise: p,
                id: id
            };
        }

        function when(spec) {

            return new Promise(function(resolve) {
                listen({
                    channel: spec.channel,
                    key: spec.key,
                    once: true,
                    handle: function(message) {
                        resolve(message);
                    }
                });
            });
        }

        /*
         Get a persistent message.
         If the message is available already, return it.
         If not, then issue a listener with the timeout given in
         address.
         Essentially, and this is how it is implemented, it is a
         listener with a timeout, wrapped in a promise.
        */

        // convenience strategies.
        function on(type, handler, channel) {
            return listen({
                channel: channel,
                key: JSON.stringify({ type: type }),
                handle: handler
            });
        }

        function emit(type, message) {
            if (message === undefined) {
                message = {};
            }
            send(message, {
                key: { type: type }
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
            Creates a bus api wrapped around a single bus.
            Makes it easy to communicate over a single channel without
            having to name the channel each time.
            if no channel supplied, will create a channel with a uuid.
         */
        function makeChannelBus(arg) {
            arg = arg || {};
            var channelName = canonicalizeChannelName(arg.name, new Uuid(4).format());
            if (arg.description) {
                makeChannel({
                    name: channelName,
                    description: arg.description
                });
            } else {
                ensureChannel(channelName);
            }

            function on(type, handler) {
                return listen({
                    channel: channelName,
                    key: { type: type },
                    handle: handler
                });
            }

            function emit(type, message) {
                if (message === undefined) {
                    message = {};
                }
                return send(message, {
                    channel: channelName,
                    key: { type: type }
                });
            }

            function channelSend(message, address) {
                address = address || {};
                address.channel = channelName;
                return send(message, address);
            }

            function channelSet(message, address) {
                address = address || {};
                address.channel = channelName;
                return set(message, address);
            }

            function channelSet2(type, message) {
                var address = {
                    channel: channelName,
                    key: {
                        type: type
                    }
                };
                return set(message, address);
            }

            function channelGet(spec, defaultValue) {
                if (typeof spec === 'string') {
                    spec = {
                        key: {
                            type: spec
                        }
                    };
                }
                spec.channel = channelName;
                return get(spec, defaultValue);
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

            function channelWhen(type) {
                return when({
                    channel: channelName,
                    key: { type: type }
                });
            }

            function channelPlisten(spec) {
                spec.channel = channelName;
                return plisten(spec);
            }

            function bus() {
                return api;
            }

            function stop() {
                removeChannel(channelName);
            }

            function stats() {
                var channel = ensureChannel(channelName);
                return {
                    listeners: {
                        persistent: Object.keys(channel.persistentMessages).length,
                        key: Object.keys(channel.keyListeners).length,
                        test: channel.testListeners.length
                    }
                };
            }

            return {
                on: on,
                emit: emit,
                set: channelSet,
                set2: channelSet2,
                get: channelGet,
                bus: bus,
                listen: channelListen,
                send: channelSend,
                respond: channelRespond,
                request: channelRequest,
                when: channelWhen,
                plisten: channelPlisten,
                stop: stop,
                channelName: channelName,
                stats: stats
            };
        }

        // MANAGEMENT

        // CONNECT
        /*
            A connection is essentially a bus api which remembers all
            listeners, which allows the connection owner to clean up
            upon closing.
        */

        function connect() {
            var listeners = [];

            function channel(channelName) {

                // Without a channel name, we use the main bus.
                if (!channelName) {
                    channelName = new Uuid(4).format();
                }

                var localChannel = makeChannelBus({
                    name: channelName
                });

                function on() {
                    var l = localChannel.on.apply(null, arguments);
                    listeners.push(l);
                }

                function emit() {
                    localChannel.emit.apply(null, arguments);
                }

                function listen() {
                    var l = localChannel.listen.apply(null, arguments);
                    listeners.push(l);
                }

                function send() {
                    localChannel.emit.apply(null, arguments);
                }

                function respond() {
                    var l = localChannel.respond.apply(null, arguments);
                    listeners.push(l);
                }

                function request() {
                    return localChannel.request.apply(null, arguments);
                }

                function plisten() {
                    var result = localChannel.plisten.apply(null, arguments);
                    listeners.push(result.id);
                    return result;
                }

                function set() {
                    return localChannel.set2.apply(null, arguments);
                }

                function get() {
                    return localChannel.get.apply(null, arguments);
                }

                function when() {
                    return localChannel.when.apply(null, arguments);
                }

                function stats() {
                    return localChannel.stats();
                }

                return {
                    on: on,
                    emit: emit,
                    listen: listen,
                    send: send,
                    respond: respond,
                    request: request,
                    plisten: plisten,
                    set: set,
                    get: get,
                    when: when,
                    stats: stats
                };
            }

            function stop() {
                listeners.forEach(function(l) {
                    removeListener(l);
                });
                listeners = [];
            }

            function stats() {
                return {
                    listeners: {
                        active: listeners.length
                    }
                };
            }

            function genName() {
                return new Uuid(4).format();
            }

            function connectionListen() {
                var l = listen.apply(null, arguments);
                listeners.push(l);
            }


            return {
                channel: channel,
                genName: genName,
                stats: stats,
                stop: stop,
                // global listeners, etc.
                listen: connectionListen
            };
        }


        // MAIN
        makeChannel({ name: 'default', description: 'The Default Channel' });

        // API
        api = {
            listen: listen,
            send: send,
            respond: respond,
            request: request,
            on: on,
            emit: emit,
            set: set,
            plisten: plisten,
            when: when,
            makeChannelBus: makeChannelBus,
            makeChannel: makeChannel,
            removeChannel: removeChannel,
            logMessages: logMessages,
            removeListener: removeListener,
            removeListeners: removeListeners,
            connect: connect
        };

        return api;
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});
