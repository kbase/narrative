define(['uuid'], (Uuid) => {
    'use strict';

    /**
     * Generates a random or pseudo-random string identifier.
     *
     * @returns {string}
     */
    function uniqueId() {
        return new Uuid(4).format();
    }

    /**
     * @typedef {Object} MessagePayload
     *
     * @typedef {Object} MessageEnvelope
     * @property {string} channel The unique identifier for the channel
     * @property {number} created The creation time of the message
     * @property {string} id A unique identifier for the message
     *
     * @typedef {Object} ChannelMessageConstructorParams
     * @property {string}            name      The message name; what one might think of
     * as the event name, if the message can be thought of as an event.
     * @property {MessagePayload}    payload   The data sent with the message; any
     * JSON-compatible value may be used, but it is advised to use an object for
     * self-documentation and future expandability.
     * @property {MessageEnvelope}  envelope  Think of this as the message metadata;
     */

    /**
     * Represents a message in a channel.
     *
     */
    class ChannelMessage {
        /**
         *
         * @param {ChannelMessageConstructorParams} param0 The constructor parameters in
         * object clothing
         */
        constructor({ name, payload, envelope }) {
            this.name = name;
            this.payload = payload;
            this.id = uniqueId();
            this.created = new Date();
            this.envelope = envelope;
        }

        toJSON() {
            const { envelope, name, payload } = this;
            return { envelope, name, payload };
        }
    }

    /**
     * @typedef {Object} SendChannelConstructorParams
     * @property {Window} window The window to which to send messages
     * @property {string} targetOrigin The URL origin of the window to which we are
     * sending messages
     * @property {string} channel The identifier assigned to this channel.
     */

    /**
     * Supports targeted window message sending.
     *
     */
    class SendChannel {
        /**
         *
         * @param {SendChannelConstructorParams} param0 The constructor parameters;
         */
        constructor({ window, targetOrigin, channel }) {
            // The given window upon which we will listen for messages.
            this.window = window;

            // The host for the window; required for postmessage
            this.targetOrigin = targetOrigin;

            // The channel id. Used to filter all messages received to
            // this channel.
            this.channel = channel;
        }

        /**
         * Sends a message to the configured window.
         *
         * @param {string} name
         * @param {MessagePayload} payload
         */
        send(name, payload) {
            const envelope = {
                channel: this.channel,
                created: Date.now(),
                id: uniqueId(),
            };
            const message = new ChannelMessage({ name, payload, envelope });
            this.window.postMessage(message.toJSON(), this.targetOrigin);
        }
    }

    return SendChannel;
});
