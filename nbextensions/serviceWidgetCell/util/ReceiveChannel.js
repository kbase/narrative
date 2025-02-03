define([], () => {
    'use strict';

    const DEFAULT_WAITING_LISTENER_TIMEOUT = 5000;
    const DEFAULT_WAITING_LISTENER_WAKEUP_INTERVAL = 100;

    /**
     * This class defines a thing which can be used to register itself to be called when
     * an event matching the name provided is received.
     *
     * @callback ListenerCallback
     * @param {object} payload The message payload
     *
     * @callback ErrorCallback
     * @param {Error} error The error/exception thrown by by the listener callback
     *
     * @typedef {Object} ChannelListenerParams
     * @property {string}           name The message name, or id.
     * @property {ListenerCallback} callback The function to be called when a message matching
     * the name is received
     * @property {ErrorCallback}    onError An optional function to call in case an exception is
     * caught executing the callback
     *
     *
     */
    class ChannelListener {
        /**
         *
         * @param {ChannelListenerParams} params
         */
        constructor(params) {
            const { name, callback, onError } = params;
            this.name = name;
            this.callback = callback;
            this.onError = onError;
        }
    }

    /**
     * This class defines a thing which, in addition to a basic listener, will be used
     * in situations in which which a listener is only enabled for a certain amount of time.
     *
     * @typedef {Object} ChannelWaitingListener
     * @extends {ChannelListenerParams}
     * @property {number} timeout The duration for which the listener is valid; after
     * the timeout expires the onError, if defined, will be called
     *
     */
    class ChannelWaitingListener extends ChannelListener {
        /**
         *
         * @param {ChannelWaitingListener} params
         */
        constructor(params) {
            super(params);
            const { timeout } = params;
            this.started = new Date();
            this.timeout = timeout || DEFAULT_WAITING_LISTENER_TIMEOUT;
        }
    }

    /**
     * An implementation of a "channel", or constrained window message listener.
     *
     * The channel is established by a pair of identifiers - one assigned to the sender,
     * one to the receiver.
     *
     * @typedef {Object} ReceiveChannelConstructorParameters
     * @property {Window} window The window upon whFch to receive messages
     * @property {string} channel The identifier to use for this "channel"; only messages
     * whose envelope contains this id will be recognized.
     *
     */
    class ReceiveChannel {
        /**
         *
         * @param {ReceiveChannelConstructorParameters} param0
         */
        constructor({ window, channel }) {
            // The given window upon which we will listen for messages.
            this.window = window;

            this.channel = channel;

            this.waitingListeners = new Map();
            this.listeners = new Map();

            this.currentListener = null;
        }

        /**
         * Receives all messages sent via postMessage to the associated window.
         *
         * @private
         *
         * @typedef {object} MessageEvent
         * @property {import('./SendChannel.js').ChannelMessage}  data The message to
         * send
         *
         * @param {MessageEvent} messageEvent - a post message event
         *
         * @returns {void} nothing
         */
        receiveMessage(messageEvent) {
            const message = messageEvent.data;

            // Here we have a series of filters to determine whether this message should be
            // handled by this post message bus.
            // In all cases we simply return.
            if (typeof message !== 'object' || message === null) {
                return;
            }

            if (!message.envelope) {
                return;
            }

            // Ignore messages intended for another channels.
            if (message.envelope.channel !== this.channel) {
                return;
            }

            this.processMessage(message);
        }

        /**
         * Attempts to handle the given message.
         *
         * @private
         *
         * @param {import('./SendChannel.js').ChannelMessage} message
         * @returns {void} nothing
         */
        processMessage(message) {
            // "waiting listeners" will exist for a limited amount of time, during which
            // they are "waiting" for the given message to be received.
            // Here we process any waiting listeners that match the incoming message.
            if (this.waitingListeners.has(message.name)) {
                const awaiting = this.waitingListeners.get(message.name);

                // Waiting listeners are always removed when processed, even if they fail.
                this.waitingListeners.delete(message.name);
                awaiting.forEach((listener) => {
                    try {
                        listener.callback(message.payload);
                    } catch (ex) {
                        if (listener.onError) {
                            listener.onError(ex);
                        }
                    }
                });
            }

            // Otherwise, permanently registered handlers are found in the listeners for the
            // message name.
            const listeners = this.listeners.get(message.name) || [];
            for (const listener of listeners) {
                try {
                    return listener.callback(message.payload);
                } catch (ex) {
                    if (listener.onError) {
                        listener.onError(ex);
                    }
                }
            }
        }

        /**
         * Registers a listener object to be available thenceforth from now.
         *
         * @private
         * @param {ChannelListener} listener
         */
        listen(listener) {
            if (!this.listeners.has(listener.name)) {
                this.listeners.set(listener.name, []);
            }
            this.listeners.get(listener.name).push(listener);
        }

        /**
         *
         *
         * @public
         *
         * @param {*} name
         * @param {*} callback
         * @param {*} onError
         */
        on(name, callback, onError) {
            this.listen(
                new ChannelListener({
                    name,
                    callback,
                    onError: (error) => {
                        if (onError) {
                            onError(error);
                        }
                    },
                })
            );
        }

        /**
         * Starts a timeout-based monitoring loop to handle any waiting listeners.
         *
         * If there are no waiting listeners, the loop will terminate.
         *
         * @private
         *
         * @returns {void} nothing
         */
        startMonitor() {
            window.setTimeout(() => {
                const now = new Date().getTime();

                // first take care of listeners awaiting a message.
                for (const [messageName, listeners] of Array.from(
                    this.waitingListeners.entries()
                )) {
                    // Remove any expired listeners.
                    const newListeners = listeners.filter((listener) => {
                        if (listener instanceof ChannelWaitingListener) {
                            const elapsed = now - listener.started.getTime();
                            if (elapsed > listener.timeout) {
                                try {
                                    if (listener.onError) {
                                        listener.onError(new Error('timout after ' + elapsed));
                                    }
                                } catch (ex) {
                                    console.error('Error calling error handler', messageName, ex);
                                }
                                return false;
                            } else {
                                return true;
                            }
                        } else {
                            return true;
                        }
                    });

                    // Waiting listeners are organized in a map by message name;
                    if (newListeners.length === 0) {
                        this.waitingListeners.delete(messageName);
                    }
                }

                // We only monitor waiting listeners if there are any.
                if (this.waitingListeners.size > 0) {
                    this.startMonitor();
                }
            }, DEFAULT_WAITING_LISTENER_WAKEUP_INTERVAL);
        }

        /**
         *
         * @private
         *
         * @param {ChannelWaitingListener} listener
         *
         * @returns {void} nothing
         */
        listenOnce(listener) {
            if (!this.waitingListeners.has(listener.name)) {
                this.waitingListeners.set(listener.name, []);
            }
            this.waitingListeners.get(listener.name).push(listener);
            if (listener.timeout) {
                this.startMonitor();
            }
        }

        /**
         *
         * @public
         *
         * @param {string} name The message name
         * @param {number} timeout How long to wait for the message to be received
         * @param {ListenerCallback} callback
         * @param {ErrorCallback} onError
         *
         * @returns {void} nothing
         */
        once(name, timeout, callback, onError) {
            this.listenOnce(
                new ChannelWaitingListener({
                    name,
                    callback,
                    timeout,
                    onError: (error) => {
                        if (onError) {
                            onError(error);
                        }
                    },
                })
            );
        }

        /**
         * A Promise-based version of "once" - resolves when the message is received,
         * rejects if the timeout is exceeded before the message is received.
         *
         * @public
         *
         * @param {string} name The message name
         * @param {number} timeout How long to wait for the message to be received
         *
         * @returns {Promise} A promise which resolves when the message is re
         */
        when(name, timeout) {
            return new Promise((resolve, reject) => {
                return this.listenOnce(
                    new ChannelWaitingListener({
                        name,
                        timeout,
                        callback: (payload) => {
                            resolve(payload);
                        },
                        onError: (error) => {
                            reject(error);
                        },
                    })
                );
            });
        }

        /**
         * Starts the channel listening for window messages.
         *
         * @returns {ReceiveChannel}
         */
        start() {
            this.currentListener = (message) => {
                this.receiveMessage(message);
            };
            this.window.addEventListener('message', this.currentListener, false);
            return this;
        }

        /**
         * Stops listening for window messages.
         *
         * @returns {ReceiveChannel}
         */
        stop() {
            if (this.currentListener) {
                this.window.removeEventListener('message', this.currentListener, false);
            }
            return this;
        }
    }

    return ReceiveChannel;
});
