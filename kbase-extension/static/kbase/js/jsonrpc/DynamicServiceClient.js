/*jslint white:true,browser:true,jsnomen:true*/
define([
    './JSON-RPC_1.1'
], function (jsonRpc) {
    'use strict';
    class DynamicServiceClient {
        constructor({module, version, token, url, timeout}) {
            this.module = module;
            this.token = token;
            this.timeout = timeout;
            this.url = url;
            this.version = version;
        
            if (!url) {
                throw new Error('The service discovery url was not provided');
            }
        }

        callFunc(funcName, params) {
            const options = {
                timeout: this.timeout,
                authorization: this.token
            };

            const serviceLookupParams = [{
                module_name: this.module,
                version: this.version || null
            }];
            return jsonRpc.request(this.url, 'ServiceWizard', 'get_service_status', serviceLookupParams, options)
                .then(([{url}]) => {
                    return jsonRpc.request(url, this.module, funcName, params, options);
                });
        }
    }
    return DynamicServiceClient;
});
