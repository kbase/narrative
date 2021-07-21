define(['uuid', './errors'], (Uuid, errors) => {
    'use strict';

    const {
        JSONRPCRequestError,
        JSONRPCTimeoutError,
        JSONRPCResponseError,
        JSONRPCMethodError,
    } = errors;

    class JSONRPCClient {
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
        }

        startTimeout({ after }) {
            let status = 'none';
            const controller = new AbortController();
            let timeout = window.setTimeout(() => {
                timeout = null;
                status = 'timedout';
                controller.abort();
            }, after);

            /**
             * Called to cancel the timeout.
             */
            const cancel = () => {
                window.clearTimeout(timeout);
                timeout = null;
                status = 'canceled';
            };

            /**
             * Called to cancel the request (via the controller)
             */
            const abort = () => {
                window.clearTimeout(timeout);
                timeout = null;
                status = 'aborted';
                controller.abort();
            };

            const is = (statusTooTest) => {
                return status === statusTooTest;
            };

            status = 'started';

            return {
                //NOPMD
                signal: controller.signal,
                cancel,
                abort,
                is,
                started: Date.now(),
            };
        }

        cancelPending() {
            this.timeoutMonitor.abort();
            this.timeoutMonitor = null;
        }

        async request({ method, params, options = {} }) {
            // API Usage error, not JSONRPC Error.
            if (typeof method === 'undefined') {
                throw new TypeError('The "method" is required');
            }
            const { url } = this;

            const timeout = options.timeout || this.timeout;

            const rpc = {
                method,
                version: '1.1',
                id: new Uuid(4).format(),
            };
            if (typeof params !== 'undefined') {
                rpc.params = params;
            }
            const headers = {
                'Content-Type': 'application/json',
            };

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

            // Enforce timeout (see timeout method)
            const timeoutMonitor = this.startTimeout({ after: timeout });
            this.timeoutMonitor = timeoutMonitor;
            fetchOptions.signal = timeoutMonitor.signal;

            let response;
            try {
                response = await fetch(url, fetchOptions);
            } catch (ex) {
                if (ex instanceof DOMException && ex.name === 'AbortError') {
                    const elapsed = Date.now() - timeoutMonitor.started;
                    if (timeoutMonitor.is('timedout')) {
                        // probably a timeout.
                        throw new JSONRPCTimeoutError(
                            `Timeout after ${elapsed}ms with timeout of ${timeout}ms`,
                            {
                                method,
                                params,
                                url,
                                timeout,
                                elapsed,
                                originalMessage: ex.message,
                            }
                        );
                    } else if (timeoutMonitor.is('aborted')) {
                        throw new JSONRPCTimeoutError('Request aborted', {
                            method,
                            params,
                            url,
                            timeout,
                            elapsed,
                            originalMessage: ex.message,
                        });
                    } else {
                        // perhaps still could be, given unknowns about the precise timing of setTimeout, but chances are low.
                        throw new JSONRPCTimeoutError(
                            `Request aborted with elapsed time ${elapsed}ms and a timeout of ${timeout}ms`,
                            {
                                method,
                                params,
                                url,
                                timeout,
                                elapsed,
                                originalMessage: ex.message,
                            }
                        );
                    }
                }
                throw new JSONRPCRequestError('Error fetching request', {
                    method,
                    params,
                    url,
                    originalMessage: ex.message,
                });
            } finally {
                timeoutMonitor.cancel();
            }

            let jsonrpcResponse;
            const textResponse = await response.text();
            try {
                jsonrpcResponse = JSON.parse(textResponse);
            } catch (ex) {
                throw new JSONRPCResponseError('Error parsing response', {
                    method,
                    params,
                    url,
                    statusCode: response.status,
                    originalMessage: ex.message,
                });
            }

            if (this.strict) {
                if (typeof jsonrpcResponse.id === 'undefined' || jsonrpcResponse.id === null) {
                    // The id will be missing or null for parse errors, and may be missing for an invalid request */
                    if (
                        !(
                            jsonrpcResponse.error &&
                            [-32700, -32600].includes(jsonrpcResponse.error.code)
                        )
                    ) {
                        throw new JSONRPCResponseError(
                            `Id in response "${jsonrpcResponse.id}" does not match id in request "${rpc.id}"`,
                            { method, params, url }
                        );
                    }
                }
                if (jsonrpcResponse.id !== rpc.id) {
                    throw new JSONRPCResponseError(
                        `Id in response "${jsonrpcResponse.id}" does not match id in request "${rpc.id}"`,
                        { method, params, url }
                    );
                }
                if (typeof jsonrpcResponse.version === 'undefined') {
                    throw new JSONRPCResponseError('"version" property missing in response', {
                        method,
                        params,
                        url,
                    });
                }
                if (jsonrpcResponse.version !== '1.1') {
                    throw new JSONRPCResponseError(
                        `"version" property is "${jsonrpcResponse.version}" not "1.1" as required`,
                        { method, params, url }
                    );
                }
            }

            // THe state of the response can either be result, or error.

            if (typeof jsonrpcResponse.result !== 'undefined') {
                if (typeof jsonrpcResponse.error !== 'undefined') {
                    throw new JSONRPCResponseError(
                        'only one of "result" or "error" property may be provided in the response',
                        {
                            method,
                            params,
                            url,
                            statusCode: response.status,
                        }
                    );
                }
                // Normal result response.
                return jsonrpcResponse.result;
            }

            if (typeof jsonrpcResponse.error !== 'undefined') {
                throw new JSONRPCMethodError('Error from server or method', {
                    method,
                    params,
                    url,
                    originalMessage: jsonrpcResponse.error.message,
                    statusCode: response.status,
                    error: jsonrpcResponse.error,
                });
            }

            throw new JSONRPCResponseError('"result" or "error" property required in response', {
                method,
                params,
                url,
                statusCode: response.status,
            });
        }
    }

    return { JSONRPCClient };
});
