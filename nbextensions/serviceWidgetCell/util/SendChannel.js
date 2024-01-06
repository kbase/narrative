define([], () => {
    'use strict';

    function uniqueId() {
        if (window.crypto) {
            return window.crypto.randomUUID();
        } else {
            return `${Date.now()}-${Math.random()}`;
        }
    }

    class ChannelMessage {
        constructor({ name, payload, envelope }) {
            this.name = name;
            this.payload = payload;
            this.id = uniqueId();
            this.created = new Date();
            this.envelope = envelope;
        }

        toJSON() {
            return {
                envelope: this.envelope,
                name: this.name,
                payload: this.payload,
            };
        }
    }

    class SendChannel {
        constructor({ window, targetOrigin, id, to }) {
            // The given window upon which we will listen for messages.
            this.window = window;

            // The host for the window; required for postmessage
            this.targetOrigin = targetOrigin;

            // The channel id. Used to filter all messages received to
            // this channel.
            this.id = id;

            this.partnerId = to;

            this.stats = {
                sent: 0,
                received: 0,
                ignored: 0,
            };
        }

        getId() {
            return this.id;
        }

        getPartnerId() {
            return this.partnerId;
        }

        getStats() {
            return this.stats;
        }

        sendMessage(message) {
            this.stats.sent += 1;
            this.window.postMessage(message.toJSON(), this.targetOrigin);
        }

        genId() {
            return uniqueId();
        }

        send(name, payload) {
            const envelope = {
                type: 'plain',
                from: this.id,
                to: this.partnerId,
                created: Date.now(),
                id: this.genId(),
            };
            const message = new ChannelMessage({ name, payload, envelope });
            this.sendMessage(message);
        }

        setPartner(id) {
            this.partnerId = id;
        }
    }

    return SendChannel;
});
