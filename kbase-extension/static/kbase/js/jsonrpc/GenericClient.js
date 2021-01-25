/*jslint white:true,browser:true,jsnomen:true*/
define([
    './JSON-RPC_1.1'
], function (jsonRpc) {
    'use strict';
    class GenericClient {
        constructor({module, token, url, timeout}) {
            this.module = module;
            this.token = token;
            this.timeout = timeout;
            this.url = url;
        
            if (!url) {
                throw new Error('The service url was not provided');
            }
        }

        callFunc(funcName, params) {
            const options = {
                timeout: this.timeout,
                authorization: this.token
            };
            return jsonRpc.request(this.url, this.module, funcName, params, options);
        }
    }
    return GenericClient;
});
