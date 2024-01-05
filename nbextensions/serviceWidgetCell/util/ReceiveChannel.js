define([], () => {
    class ChannelListener {
        // name;
        // callback: (payload: Payload) => void;
        // onError?: (error: any) => void;

        constructor({ name, callback, onError }) {
            this.name = name;
            this.callback = callback;
            this.onError = onError;
        }
    }

    class ChannelWaitingListener extends ChannelListener {
        // started: Date;
        // timeout: number;

        constructor(params) {
            super(params);
            this.started = new Date();
            this.timeout = params.timeout || 5000;
        }
    }

    class ReceiveChannel {
        constructor({ window, id }) {
            // The given window upon which we will listen for messages.
            this.window = window;
    
            // The channel id. Used to filter all messages received to
            // this channel.
            this.receiveFromIds = [];
    
            this.id = id;
    
            this.waitingListeners = new Map();
            this.listeners = new Map();
    
            this.currentListener = null;
            this.running = false;
            this.stats = {
                sent: 0,
                received: 0,
                ignored: 0,
            };
        }
    
        receiveFrom(id) {
            this.receiveFromIds.push(id);
        }
    
        getId() {
            return this.id;
        }
    
        getStats() {
            return this.stats;
        }
    
        /**
         * Receives all messages sent via postMessage to the associated window.
         *
         * @param messageEvent - a post message event
         */
        receiveMessage(messageEvent) {
            const message = messageEvent.data;
            // Here we have a series of filters to determine whether this message should be
            // handled by this post message bus.
            // In all cases we issue a warning, and return.
    
            if (typeof message !== 'object' || message === null) {
                this.stats.ignored += 1;
                return;
            }
    
            // TODO: could do more here.
            if (!message.envelope) {
                this.stats.ignored += 1;
                return;
            }
    
            // Here we ignore messages intended for another channels.
            if (message.envelope.to !== this.id) {
                this.stats.ignored += 1;
                return;
            }
    
            if (!this.receiveFromIds.includes(message.envelope.from)) {
                this.stats.ignored += 1;
                return;
            }
    
            this.stats.received += 1;
    
            if (this.waitingListeners.has(message.name)) {
                const awaiting = this.waitingListeners.get(message.name);
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
                switch (message.envelope.type) {
                    case 'plain':
                    default:
                        // default case handles older messages without the envelope type.
                        try {
                            return listener.callback(message.payload);
                        } catch (ex) {
                            if (listener.onError) {
                                listener.onError(ex);
                            }
                        }
                        break;
                }
            }
        }
    
        listen(listener) {
            if (!this.listeners.has(listener.name)) {
                this.listeners.set(listener.name, []);
            }
            this.listeners.get(listener.name).push(listener);
        }
    
        on(messageId, callback, onError) {
            this.listen(
                new ChannelListener({
                    name: messageId,
                    callback,
                    onError: (error) => {
                        if (onError) {
                            onError(error);
                        }
                    },
                })
            );
        }
    
        startMonitor() {
            window.setTimeout(() => {
                const now = new Date().getTime();
    
                // first take care of listeners awaiting a message.
                for (const [id, listeners] of Array.from(
                    this.waitingListeners.entries()
                )) {
                    const newListeners = listeners.filter((listener) => {
                        if (listener instanceof ChannelWaitingListener) {
                            const elapsed = now - listener.started.getTime();
                            if (elapsed > listener.timeout) {
                                try {
                                    if (listener.onError) {
                                        listener.onError(
                                            new Error('timout after ' + elapsed)
                                        );
                                    }
                                } catch (ex) {
                                    console.error(
                                        'Error calling error handler',
                                        id,
                                        ex
                                    );
                                }
                                return false;
                            } else {
                                return true;
                            }
                        } else {
                            return true;
                        }
                    });
                    if (newListeners.length === 0) {
                        this.waitingListeners.delete(id);
                    }
                }
    
                if (this.waitingListeners.size > 0) {
                    this.startMonitor();
                }
            }, 100);
        }
    
        listenOnce(listener) {
            if (!this.waitingListeners.has(listener.name)) {
                this.waitingListeners.set(listener.name, []);
            }
            this.waitingListeners.get(listener.name).push(listener);
            if (listener.timeout) {
                this.startMonitor();
            }
        }
    
        once(
            name,
            timeout,
            callback,
            onError
        ) {
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
        
        start() {
            this.currentListener = (message) => {
                this.receiveMessage(message);
            };
            this.window.addEventListener('message', this.currentListener, false);
            this.running = true;
            return this;
        }
    
        stop() {
            this.running = false;
            if (this.currentListener) {
                this.window.removeEventListener(
                    'message',
                    this.currentListener,
                    false
                );
            }
            return this;
        }
    }

    return {ReceiveChannel};

});