define([], () => {
    'use strict';

    /** A class which captures any error generated by the JSONRPC request. Typically subclassed
     * in order to provide more specific information.
     * It supports "KBase-style" JSON-RPC 1.1 errors.
     *
     * Note that in the context of the client, these error classes capture the error context in the
     * request to and response from a server. Some errors are captured before the request,
     * some during the request, some after.
     *
     * See `serverErrors.js` for errors propagated from the RPC error response.
     */
    class ClientError extends Error {
        /**
         *
         * @param {string} message - A human-readable description of the error.
         * @param {Object} options - an "options style" parameter containing context common
         * to most, if not all, possible errors, which can optionally be displayed or logged
         * in order to provide fuller context for the error. The options is mandatory, but
         * each property is optional.
         * @param {string} [options.method] - The
         * @param {string} [options.params] -
         * @param {string} [options.url] -
         * @param {string} [options.originalMessage] -
         */
        constructor(message, { url, method, params, originalMessage }) {
            super(message);
            this.name = 'ClientError';

            if (typeof url === 'undefined') {
                throw new TypeError(
                    'the "url" property is required in the second constructor argument'
                );
            }
            this.url = url;

            if (typeof method === 'undefined') {
                throw new TypeError(
                    'the "method" property is required in the second constructor argument'
                );
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

    /**
     * An error class which captures errors in the Request phase of a JSON-RPC call.
     */
    class ClientRequestError extends ClientError {
        constructor(message, props) {
            super(message, props);
            this.name = 'ClientRequestError';
        }
    }

    /**
     * An error class which captures a timeout error during a JSON-RPC call.
     */
    class ClientAbortError extends ClientRequestError {
        constructor(message, params) {
            super(message, params);
            this.name = 'ClientAbortError';
            const { timeout, elapsed, status } = params;
            if (typeof timeout === 'undefined') {
                throw new TypeError(
                    'the "timeout" property is required in the second constructor argument'
                );
            }
            this.timeout = timeout;

            if (typeof elapsed === 'undefined') {
                throw new TypeError(
                    'the "elapsed" property is required in the second constructor argument'
                );
            }
            this.elapsed = elapsed;

            if (typeof status === 'undefined') {
                throw new TypeError(
                    'the "status" property is required in the second constructor argument'
                );
            }
            this.status = status;
        }
        toJSON() {
            const json = super.toJSON();
            json.timeout = this.timeout;
            json.elapsed = this.elapsed;
            json.status = this.status;
            return json;
        }
    }

    /**
     * An error class which captures an error during the Response phase of a JSON-RPC call.
     */
    class ClientResponseError extends ClientError {
        constructor(message, params) {
            super(message, params);
            this.name = 'ClientResponseError';
            const { responseCode } = params;
            if (typeof responseCode === 'undefined') {
                throw new TypeError(
                    'the "responseCode" property is required in the second constructor argument'
                );
            }
            this.responseCode = responseCode;
        }
        toJSON() {
            const json = super.toJSON();
            json.responseCode = this.responseCode;
            return json;
        }
    }

    /**
     * An error class which captures an error parsing the response text into JSON
     */
    class ClientParseError extends ClientResponseError {
        constructor(message, params) {
            super(message, params);
            const { responseText } = params;
            if (typeof responseText === 'undefined') {
                throw new TypeError(
                    'the "responseText" property is required in the second constructor argument'
                );
            }
            this.responseText = responseText;
            this.name = 'ClientParseError';
        }
        toJSON() {
            const json = super.toJSON();
            json.responseText = this.responseText;
            return json;
        }
    }

    return Object.freeze({
        ClientError,
        ClientRequestError,
        ClientResponseError,
        ClientParseError,
        ClientAbortError,
    });
});