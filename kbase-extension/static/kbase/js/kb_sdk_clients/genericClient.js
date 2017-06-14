/*global define */
/*jslint white:true,browser:true,jsnomen:true*/
define([
    './jsonRpc-native'
], function (jsonRpc) {
    'use strict';

    /*
     * arg is:
     * url - service wizard url
     * timeout - request timeout
     * version - service release version or tag
     * auth - auth structure
     *   token - auth token
     *   username - username
     * rpcContext
     */
    function GenericClient(arg) {
        // Establish an auth object which has properties token and user_id.
        var module = arg.module;
        var token = arg.token || (arg.auth ? arg.auth.token : null);
        
        if (!arg.url) {
            throw new Error('The service discovery url was not provided');
        }
        if (!arg.version) {
            throw new Error('The service version was not provided');
        }

        function options() {
            return {
                timeout: arg.timeout,
                authorization: token,
                rpcContext: arg.rpcContext
            };
        }

        this.lookupModule = function () {
            var func = 'get_service_status',
                params = [{
                        module_name: module,
                        version: arg.version || 'dev'
                    }];
            // NB: pass null for numRets (number of return values) so we get the 
            // full return structure.
            return jsonRpc.request(arg.url, 'ServiceWizard', func, params, null, options());
        };
        
        this.callFunc = function(funcName, params) {
            // var params = Array.prototype.slice.call(arguments);
            return this.lookupModule()
                .spread(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, funcName, params, null, options());
                });
        };

    }
    return GenericClient;
});
