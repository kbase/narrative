define([], () => {
    'use strict';

    class JSONRPCError extends Error {
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
        constructor(errorMessage, { error: { name, code, message, error }, url, method, params }) {
            super(errorMessage);
            this.name = 'JSONRPCError';

            // Absorb the JSON-RPC error response.

            if (typeof code === 'undefined') {
                throw new Error(
                    'the "error.code" property is required in the second constructor argument'
                );
            }

            if (typeof message === 'undefined') {
                throw new Error(
                    'the "error.message" property is required in the second constructor argument'
                );
            }

            this.error = { code, message };

            // NB - "name" is required for JSON-RPC 1.1, but we generally use JSON-RPC 2.0
            // errors w/in JSON-RPC 1.1.
            if (typeof name !== 'undefined') {
                this.error.name = name;
            }

            if (typeof error !== 'undefined') {
                this.error.error = error;
            }

            // Other constructor properties are important attributes of the request
            // itself.

            if (typeof url === 'undefined') {
                throw new Error(
                    'the "url" property is required in the second constructor argument'
                );
            }
            this.url = url;

            if (typeof method === 'undefined') {
                throw new Error(
                    'the "method" property is required in the second constructor argument'
                );
            }
            this.method = method;

            // Optional
            this.params = params;
        }

        toJSONRPCError() {
            const error = {
                name: 'JSONRPCError',
                code: this.error.code,
                message: this.error.message,
            };
            if (typeof this.error.error !== 'undefined') {
                error.error = this.error.error;
            }
            return Object.assign({}, error);
        }
    }

    /**
     * An error class which captures a an error parsing the request text into JSON
     */
    class JSONRPCParseError extends JSONRPCError {
        constructor(message, props) {
            props.error.code = -32700;
            super(message, props);
            this.name = 'JSONRPCParseError';
        }
    }

    class JSONRPCInvalidRequestError extends JSONRPCError {
        constructor(message, props) {
            props.error.code = -32600;
            super(message, props);
            this.name = 'JSONRPCInvalidRequestError';
        }
    }

    class JSONRPCMethodNotFoundError extends JSONRPCError {
        constructor(message, props) {
            props.error.code = -32601;
            super(message, props);
            this.name = 'JSONRPCMethodNotFoundError';
        }
    }

    class JSONRPCInvalidParamsError extends JSONRPCError {
        constructor(message, props) {
            props.error.code = -32602;
            super(message, props);
            this.name = 'JSONRPCInvalidParamsError';
        }
    }

    class JSONRPCInternalError extends JSONRPCError {
        constructor(message, props) {
            props.error.code = -32603;
            super(message, props);
            this.name = 'JSONRPCInternalError';
        }
    }
    class JSONRPCServerError extends JSONRPCError {
        constructor(message, props) {
            super(message, props);
            this.name = 'JSONRPCServerError';

            if (props.error.code > -32000 || props.error.code < -32099) {
                throw new TypeError(
                    `the "code" constructor property must be between -32000 and -32099`
                );
            }
        }
    }
    class JSONRPCUnknownError extends JSONRPCError {
        constructor(message, props) {
            super(message, props);
            this.name = 'JSONRPCUnknownError';

            if (props.error.code > -32000 || props.error.code < -32768) {
                throw new TypeError(
                    `the "code" constructor property must be between -32000 and -32768`
                );
            }
            if (
                [-32700, -32600, -32601, -32602, -32603].includes(props.error.code) ||
                (props.error.code <= -32000 && props.error.code >= -32099)
            ) {
                throw new TypeError(
                    `the "code" constructor property must be not be a reserved JSON-RPC error code`
                );
            }
        }
    }
    class JSONRPCApplicationError extends JSONRPCError {
        constructor(message, props) {
            super(message, props);
            this.name = 'JSONRPCApplicationError';
            if (props.error.code <= -32000 && props.error.code >= -32768) {
                throw new TypeError(
                    `the "code" constructor property must not be within the reserved inclusive range -32000 to -32768`
                );
            }
        }
    }

    function responseError(response, { url, method, params }) {
        const ErrorClass = (() => {
            switch (response.error.code) {
                case -32700:
                    return JSONRPCParseError;
                case -32600:
                    return JSONRPCInvalidRequestError;
                case -32601:
                    return JSONRPCMethodNotFoundError;
                case -32602:
                    return JSONRPCInvalidParamsError;
                case -32603:
                    return JSONRPCInternalError;
                default:
                    if (response.error.code <= -32000 && response.error.code >= -32099) {
                        return JSONRPCServerError;
                    } else if (response.error.code > -32000 || response.error.code < -32768) {
                        return JSONRPCApplicationError;
                    } else {
                        return JSONRPCUnknownError;
                    }
            }
        })();
        return new ErrorClass(response.error.message, {
            error: response.error,
            url,
            method,
            params,
        });
    }

    return Object.freeze({
        JSONRPCError,
        JSONRPCParseError,
        JSONRPCInvalidRequestError,
        JSONRPCMethodNotFoundError,
        JSONRPCInvalidParamsError,
        JSONRPCInternalError,
        JSONRPCServerError,
        JSONRPCApplicationError,
        JSONRPCUnknownError,
        responseError,
    });
});
