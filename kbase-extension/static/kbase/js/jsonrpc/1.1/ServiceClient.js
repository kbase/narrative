define(['./JSONRPCClient'], (JSONRPCClient) => {
    'use strict';

    class ServiceClient {
        constructor({ url, module, timeout, token, strict }) {
            // Required
            if (!url) {
                throw new TypeError('"url" is required');
            }
            this.url = url;

            if (!module) {
                throw new TypeError('"module" is required');
            }
            this.module = module;

            if (!timeout) {
                throw new TypeError('"timeout" is required');
            }
            this.timeout = timeout;

            // Optional:
            this.token = token || null;
            this.strict = strict || false;
        }

        rpcCall(funcName, { params, timeout, token }) {
            let callParams;
            if (typeof params === 'undefined') {
                callParams = [];
            } else {
                callParams = [params];
            }

            timeout = timeout || this.timeout;
            const options = {};
            if (this.token) {
                options.authorization = this.token;
            }
            const constructorParams = { url: this.url, timeout, strict: this.strict };

            // Token can be overridden, or simply supplied by calls.
            const auth = token || this.token;
            if (auth) {
                constructorParams.authorization = auth;
            }

            const client = new JSONRPCClient(constructorParams);

            const request = client
                .request({
                    method: `${this.module}.${funcName}`,
                    params: callParams,
                    options,
                })
                .then((response) => {
                    const [unwrapped] = response;
                    return unwrapped;
                });

            return [request, client];
        }

        callFuncCancellable(funcName, options = {}) {
            const [request, client] = this.rpcCall(funcName, options);

            const canceller = () => {
                client.cancelPending();
            };

            return [request, canceller];
        }

        callFunc(funcName, options = {}) {
            const [request] = this.rpcCall(funcName, options);
            return request;
        }
    }

    return ServiceClient;
});
