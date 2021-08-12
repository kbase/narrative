define(['uuid', './errors', './jsonrpcErrors'], (Uuid, errors, jsonrpcErrors) => {
    'use strict';

    const { ClientRequestError, ClientResponseError, ClientParseError, ClientAbortError } = errors;
    const { responseError } = jsonrpcErrors;

    /**
     * A managed AbortController with timeout.
     */
    class AbortTimeoutController {
        /**
         *
         * @param {Object} param - named constructor params
         * @param {number} param.timeoutAfter - a time duration, in milliseconds, after which the abort signal is sent to the associated fetch request.
         */
        constructor({ timeoutAfter }) {
            this.timeoutAfter = timeoutAfter;
            this.controller = new AbortController();
            this.status = 'none';
            this.timeoutTimer = null;
            this.startedAt = null;
            this.timedoutAt = null;
        }

        /**
         * Starts the timeout monitor the for the associated request; aborts the request if the timeout expires.
         *
         * @returns {AbortTimeoutController} this object
         */
        start() {
            this.timeoutTimer = window.setTimeout(() => {
                this.timeout = null;
                this.status = 'timedout';
                this.timedoutAt = Date.now();
                this.controller.abort();
            }, this.timeoutAfter);
            this.startedAt = Date.now();
            this.status = 'started;';
            return this;
        }

        /**
         * Called to cancel the request (via the controller)
         *
         * @returns {AbortTimeoutController} this object
         */
        abort() {
            window.clearTimeout(this.timeoutTimer);
            this.timeout = null;
            this.status = 'aborted';
            this.controller.abort();
            return this;
        }

        /**
         * Should be called when the request is completed; cancels
         * the timeout timer.
         *
         * @returns {AbortTimeoutController} this object
         */
        stop() {
            window.clearTimeout(this.timeoutTimer);
            this.timeout = null;
            this.status = 'done';
            return this;
        }

        /**
         *
         * @returns {AbortSignal} Returns the signal property of the abort controller
         */
        getSignal() {
            return this.controller.signal;
        }

        /**
         *
         * @returns {string} The value of the internal status variable which tracks the state
         */
        getStatus() {
            return this.status;
        }

        getElapsed() {
            return this.timedoutAt - this.startedAt;
        }
    }

    class JSONRPCClient {
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
        constructor({ url, timeout, authorization, strict = true }) {
            // API Usage error, not JSONRPC Error.
            if (typeof url === 'undefined') {
                throw new TypeError('The "url" is required');
            }
            this.url = url;

            // API Usage error, not JSONRPC Error.
            if (typeof timeout === 'undefined') {
                throw new TypeError('The "timeout" is required');
            }
            this.timeout = timeout;

            // Optional
            this.authorization = authorization;
            this.strict = strict;

            this.abortController = null;
        }

        /**
         * Aborts a pending request; same effect as a timeout but controlled procedurally.
         *
         * @returns {void} nothing
         */
        cancelPending() {
            this.controller.abort();
            this.controller = null;
        }

        /**
         * Calls the JSON-RPC endpoint with the given `method` and `params`, with behavior controlled
         * by `options`.
         *
         * @param {string} method
         * @param {Object} params
         * @param {Object} options
         * @returns
         */
        makeRPCRequest(method, params, options) {
            const rpc = {
                version: '1.1',
                method,
            };
            if (!options.omitId) {
                rpc.id = new Uuid(4).format();
            }
            if (typeof params !== 'undefined') {
                rpc.params = params;
            }
            return rpc;
        }

        /**
         * Handles the response from a request to a JSON-RPC 1.1 server.
         *
         * @param {string} url - the original url for the request
         * @param {object} rpc - the original JSON-RPC request object sent in the request
         * @param {Response} response - the response object returned by fetch
         * @returns {object} - the JSON-RPC response object
         */
        async handleRPCResponse(url, rpc, response) {
            const { method, params } = rpc;

            // First handle basic parsing of the response. All responses should be JSON, even
            // errors. However, there are cases in which the service may be down or timing out
            // and we get a text-based response from a proxy, or the service is imperfect and may
            // return a text-based non-2xx response from the server layer.
            // We don't try to be clever with differentiating those circumstances, but rather
            // throw a single parsing error, which contains the context from the response,

            const responseText = await response.text();

            let jsonrpcResponse;
            try {
                jsonrpcResponse = JSON.parse(responseText);
            } catch (ex) {
                throw new ClientParseError('Error parsing response', {
                    method,
                    // because params may be undefined.
                    params,
                    url,
                    responseCode: response.status,
                    responseText,
                    originalMessage: ex.message,
                });
            }

            // In strict mode, we try to honor the spec a bit more closely in areas
            // which, at least in the manner in which we (KBase) use JSON-RPC are
            // not critical, and we may relax.
            // - enforce rules for id
            // - enforce rules for version

            if (this.strict) {
                if (typeof rpc.id !== 'undefined') {
                    if (typeof jsonrpcResponse.id === 'undefined' || jsonrpcResponse.id === null) {
                        // The id will be missing or null for parse errors, and may be missing for an invalid request */
                        if (
                            !(
                                jsonrpcResponse.error &&
                                [-32700, -32600].includes(jsonrpcResponse.error.code)
                            )
                        ) {
                            throw new ClientResponseError(`"id" missing in response`, {
                                method,
                                params,
                                url,
                                responseCode: response.status,
                            });
                        }
                    } else {
                        if (jsonrpcResponse.id !== rpc.id) {
                            throw new ClientResponseError(
                                `"id" in response "${jsonrpcResponse.id}" does not match "id" in request "${rpc.id}"`,
                                { method, params, url, responseCode: response.status }
                            );
                        }
                    }
                }

                if (typeof jsonrpcResponse.version === 'undefined') {
                    throw new ClientResponseError('"version" property missing in response', {
                        method,
                        params,
                        url,
                        responseCode: response.status,
                    });
                }
                if (jsonrpcResponse.version !== '1.1') {
                    throw new ClientResponseError(
                        `"version" property is "${jsonrpcResponse.version}" not "1.1" as required`,
                        { method, params, url, responseCode: response.status }
                    );
                }
            }

            // The state of the response can either be result, or error.

            if (typeof jsonrpcResponse.result !== 'undefined') {
                if (typeof jsonrpcResponse.error !== 'undefined') {
                    throw new ClientResponseError(
                        'only one of "result" or "error" property may be provided in the response',
                        {
                            method,
                            params,
                            url,
                            responseCode: response.status,
                        }
                    );
                }
                // Normal result response.
                return jsonrpcResponse.result;
            }

            if (typeof jsonrpcResponse.error === 'undefined') {
                throw new ClientResponseError('"result" or "error" property required in response', {
                    method,
                    params,
                    url,
                    responseCode: response.status,
                });
            }

            // Below here, everything throws
            // Note that when a method returns an error, the error code should
            // not be in the reserved range

            // server reported errors
            throw responseError(jsonrpcResponse, { url, method, params });
        }

        async request({ method, params, ...options }) {
            // API Usage error, not JSONRPC Error.
            if (typeof method === 'undefined') {
                throw new TypeError('The "method" is required');
            }
            const { url } = this;

            const timeout = options.timeout || this.timeout;

            const rpc = this.makeRPCRequest(method, params, options);

            // NB cannot add content-type, otherwise triggers CORS errors for cross-domain
            // requests because our servers are not always set up to respond to preflight requests,
            // which are triggered by certain usages (e.g. using Content-Type).
            // see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests
            const headers = {};

            const authorization = options.authorization || this.authorization;
            if (authorization) {
                headers.Authorization = authorization;
            }

            const fetchOptions = {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers,
                body: JSON.stringify(rpc),
            };

            // Enforce timeout and general abort handling via an abort controller
            const controller = new AbortTimeoutController({
                timeoutAfter: timeout,
            }).start();
            this.controller = controller;
            fetchOptions.signal = controller.getSignal();

            let response;
            try {
                response = await fetch(url, fetchOptions);
            } catch (ex) {
                if (ex instanceof DOMException && ex.name === 'AbortError') {
                    const elapsed = controller.getElapsed();
                    throw new ClientAbortError(
                        `Request aborted with status "${controller.status}" after ${elapsed}ms with timeout of ${timeout}ms`,
                        {
                            method,
                            params,
                            url,
                            status: controller.getStatus(),
                            timeout,
                            elapsed,
                            originalMessage: ex.message,
                        }
                    );
                }
                throw new ClientRequestError('Network error', {
                    method,
                    params,
                    url,
                    originalMessage: ex.message,
                });
            } finally {
                controller.stop();
            }

            return this.handleRPCResponse(url, rpc, response);
        }
    }

    return JSONRPCClient;
});
