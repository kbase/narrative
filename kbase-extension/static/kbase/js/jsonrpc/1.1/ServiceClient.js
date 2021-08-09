define(['./JSONRPCClient'], (JSONRPCClient) => {
    'use strict';

    class ServiceClient {
        /**
         * A class representing a client for a KBase core service based on JSON-RPC 1.1
         *
         * @param {Object} param
         * @param {string} param.url
         * @param {string} param.module
         * @param {number} param.timeout
         * @param {string} [param.token]
         * @param {boolean} [param.strict] -
         */
        constructor({ url, module, timeout, token, strict }) {
            // Required
            if (typeof url === 'undefined') {
                throw new TypeError('"url" is required');
            }
            this.url = url;

            if (typeof module === 'undefined') {
                throw new TypeError('"module" is required');
            }
            this.module = module;

            if (typeof timeout === 'undefined') {
                throw new TypeError('"timeout" is required');
            }
            this.timeout = timeout;

            // Optional:
            this.token = token || null;
            this.strict = strict || false;
        }

        rpcCall(funcName, params, { timeout, token }) {
            let callParams;
            if (typeof params === 'undefined') {
                callParams = [];
            } else {
                callParams = [params];
            }

            timeout = timeout || this.timeout;
            const requestOptions = {};
            if (this.token) {
                requestOptions.authorization = this.token;
            }
            const constructorParams = { url: this.url, timeout, strict: this.strict };

            // Token can be overridden, or simply supplied by calls.
            const auth = token || this.token;
            if (auth) {
                constructorParams.authorization = auth;
            }

            const client = new JSONRPCClient(constructorParams);

            requestOptions.method = `${this.module}.${funcName}`;
            requestOptions.params = callParams;

            const request = client.request(requestOptions).then((response) => {
                if (!Array.isArray(response)) {
                    throw new Error(`response is not an array`);
                }
                const [unwrapped] = response;
                return unwrapped;
            });

            return [request, client];
        }

        callFuncCancellable(funcName, params, options = {}) {
            const [request, client] = this.rpcCall(funcName, params, options);

            const canceller = () => {
                client.cancelPending();
            };

            return [request, canceller];
        }

        callFunc(funcName, params, options = {}) {
            const [request] = this.rpcCall(funcName, params, options);
            return request;
        }
    }

    return ServiceClient;
});
