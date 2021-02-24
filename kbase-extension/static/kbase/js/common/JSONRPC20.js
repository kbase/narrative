/*
    JSONRPC20
    A module implementing JSORPC 2.0
    See: https://www.jsonrpc.org/specification
    
    This implementation is not complete, but functional enough for it's usages.
    Extend as need be.
*/
define([
    'uuid'
], (
    Uuid
) => {
    'use strict';
    class JSONRPC20 {
        constructor({url, token}) {
            if (!url) {
                throw new Error('"url" is required to construct a JSONRPC20 object');
            }
            this.url = url; 
            this.token = token;
        }

        timeout({after}) {
            if (!AbortController) {
                console.warn('AbortController not available, cannot implement timeout');
            }
            const controller = new AbortController();
            const timeout = window.setTimeout(() => {
                console.warn(`Timed out after ${after}ms`);
                controller.abort();
            }, after);
            const cancel = () => {
                window.clearTimeout(timeout);
            };
            return { //NOPMD
                signal: controller.signal,
                cancel,
                started: Date.now()
            }; 
        }

        callMethod({method, params, timeout}) {
            if (!method) {
                throw new Error('"method" required to call a jsonrpc method');
            }
            if (!timeout) {
                throw new Error('"timeout" required to call a jsonrpc method');
            }
            const id = new Uuid(4).format();
            const request = {
                jsonrpc: '2.0',
                id,
                method
            };
            if (params) {
                request.params = params;
            }
            const body = JSON.stringify(request);
            const options = {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                },
                body
            };
            // Authorization is optional
            if (this.token) {
                options.headers.Authorization = this.token;
            }

            // Enforce timeout (see timeout method)
            const {signal, cancel: cancelTimeout, started} = this.timeout({after: timeout});
            if (signal) {
                options.signal = signal;
            }

            return fetch(this.url, options)
                .catch((error) => {
                    // Rethrow error with more useful message. The default message for AbortError is quite 
                    // mysterious.
                    if (error instanceof DOMException && error.name === 'AbortError') {
                        const elapsed = Date.now() - started;
                        if (elapsed >= timeout) {
                            // probably a timeout.
                            throw new Error(`Request canceled - probably timed out after ${elapsed}ms with timeout of ${timeout}ms`);
                        } else {
                            // perhaps still could be, given unknowns about the precise timing of setTimeout, but chances are low.
                            throw new Error(`Request canceled - but elapsed time ${elapsed}ms does not exceed timeout of ${timeout}ms`);
                        }
                    }
                    // Otherwise, just let the error propagate.
                    throw error;
                })
                .then((response) => {
                    cancelTimeout();
                    if (response.status !== 200) {
                        throw new Error(`Unexpected error ${response.status}`);
                    }
                    return response.text()
                        .then((textResponse) => {
                            try {
                                const jsonrpcResponse = JSON.parse(textResponse);
                                if (jsonrpcResponse.error) {
                                    throw new Error(jsonrpcResponse.error.message);
                                }
                                if (response.status !== 200) {
                                    // should never occur.
                                    console.error(`Non-200 status ${response.status} but not error response`, response.status, jsonrpcResponse);
                                    throw new Error(`Non-200 status ${response.status} but not error response`);
                                }
                                if (jsonrpcResponse.id !== id) {
                                    console.warn(`Id in request ${id} does not match id in response ${jsonrpcResponse.id}`);
                                }
                                if (!jsonrpcResponse.jsonrpc) {
                                    console.error('"jsonrpc" property missing in response', jsonrpcResponse);
                                    throw new Error('"jsonrpc" property missing in response');
                                }
                                if (jsonrpcResponse.jsonrpc !== '2.0') {
                                    console.error(`"jsonrpc" property is ${jsonrpcResponse.jsonrpc} not "2.0" as expected`, jsonrpcResponse);
                                    throw new Error(`"jsonrpc" property is ${jsonrpcResponse.jsonrpc} not "2.0" as expected`);
                                }
                                return jsonrpcResponse.result;
                            } catch (ex) {
                                if (response.status !== 200) {
                                    console.error(`Non-JSON body with Non-200 status ${response.status}: ${response.status}`, textResponse);
                                    throw new Error(`Non-JSON body with Non-200 status ${response.status}: ${response.status}`);
                                }
                                console.error('Non-JSON body in response', textResponse);
                                throw new Error('Non-JSON body in response');
                            }
                        });
                });
        }
    }
    return JSONRPC20;
});