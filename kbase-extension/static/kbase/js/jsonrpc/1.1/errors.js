/*jslint white:true,browser:true*/
define([], () => {
    'use strict';

    /* 
    JSONRPC errors capture the calling information and some
    error state. This or a sublcass should be used for all errors
    encountered within the request function. Subclasses may capture
    more specific information about specific errors.
    */
    class JSONRPCError extends Error {
        constructor(message, { url, method, params, originalMessage }) {
            super(message);
            this.name = 'JSONRPCError';

            if (typeof url === 'undefined') {
                throw new Error('the "url" property is required in the second constructor argument');
            }
            this.url = url;

            if (typeof method === 'undefined') {
                throw new Error('the "method" property is required in the second constructor argument');
            }
            this.method = method;
           
            // Optional
            this.params = params;
            this.originalMessage = originalMessage;
        }
        toJSON() {
            return {
                name: this.name,
                message: this.message,
                url: this.url,
                method: this.method,
                params: this.params,
                originalMessage: this.originalMessage,
            };
        }
    }

    class JSONRPCRequestError extends JSONRPCError {
        constructor(message, { method, params, url, originalMessage }) {
            super(message, { method, params, url, originalMessage });
            this.name = 'JSONRPCRequestError';
        }
    }

    class JSONRPCTimeoutError extends JSONRPCRequestError {
        constructor(message, { method, params, url, originalMessage, timeout, elapsed }) {
            super(message, { method, params, url, originalMessage });
            if (typeof timeout === 'undefined') {
                throw new Error('the "timeout" property is required in the second constructor argument');
            }
            this.timeout = timeout;

            if (typeof elapsed === 'undefined') {
                throw new Error('the "elapsed" property is required in the second constructor argument');
            }
            this.elapsed = elapsed;
        }
        toJSON() {
            const json = super.toJSON();
            json.timeout = this.timeout;
            json.elapsed = this.elapsed;
            return json;
        }
    }

    /* 
    JSONRPC errors capture the calling information and some
    error state. This or a sublcass should be used for all errors
    encountered within the request function. Subclasses may capture
    more specific information about specific errors.
    */
    class JSONRPCResponseError extends JSONRPCError {
        constructor(message, { method, params, url, originalMessage, statusCode }) {
            super(message, { method, params, url, originalMessage });
            if (typeof statusCode === 'undefined') {
                throw new Error('the "statusCode" property is required in the second constructor argument');
            }
            this.statusCode = statusCode;
            
            this.name = 'JSONRPCResponseError';
        }
        toJSON() {
            const json = super.toJSON();
            json.statusCode = this.statusCode;
            json.name = this.name;
            return json;
        }
    }

    /**
     * An error returned from a JSON-RPC 1.1. method call
     */
    class JSONRPCMethodError extends JSONRPCResponseError {
        constructor(message, { method, params, url, originalMessage, statusCode, error }) {
            super(message, { method, params, url, statusCode, originalMessage });

            if (typeof error === 'undefined') {
                throw new Error('the "error" property is required in the second constructor argument');
            }
            if (typeof error !== 'object' && error.constructor !== {}.constructor) {
                throw new Error('the "error" property is must be a plain object');
            }
            const requiredKeys = ['name', 'message', 'code', 'error'];
            if (requiredKeys.some((key) => {
                return !(key in error);
            })) {
                throw new Error(`the "error" property requires the fields "${requiredKeys.join(', ')}"`);
            }
            this.error = error;
            this.name = 'JSONRPCMethodError';
        }
        toJSON() {
            const json = super.toJSON();
            json.error = this.error;
            json.name = this.name;
            return json;
        }
    }

    return Object.freeze({
        JSONRPCError,
        JSONRPCRequestError,
        JSONRPCResponseError,
        JSONRPCTimeoutError,
        JSONRPCMethodError,
    });
});
