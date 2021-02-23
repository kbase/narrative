define([
    '../../jsonRpc-native'
], (jsonRpc) => {
    'use strict';

    /*
     * arg is:
     * url - service wizard url
     * timeout - request timeout
     * version - service release version or tag
     * auth - auth structure
     *   token - auth token
     *   username - username
     * auth_cb - function which returns the above value
     * async_job_check_time_ms - unused?
     */
    function SetAPI(arg) {
        // Establish an auth object which has properties token and user_id.
        const module = 'SetAPI';
        let auth;
        if (typeof arg.auth === 'function') {
            auth = arg.auth();
        } else {
            // REALLY??
            auth = arg.auth || {};
        }

        if (!arg.url) {
            throw new Error('The service discovery url was not provided');
        }
        if (!arg.version) {
            throw new Error('The service version was not provided');
        }


        function options() {
            return {
                timeout: arg.timeout,
                authorization: auth.token,
                rpcContext: arg.rpcContext
            };
        }

        this.lookupModule = function () {
            const func = 'get_service_status',
                params = [{
                        module_name: module,
                        version: arg.version || 'dev'
                    }];
            return jsonRpc.request(arg.url, 'ServiceWizard', func, params, 1, options());
        };

        /*
         * ref
         */
        this.get_reads_set_v1 = function () {
            const params = Array.prototype.slice.call(arguments),
                func = 'get_reads_set_v1';

            return this.lookupModule()
                .then((serviceStatus) => {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.save_reads_set_v1 = function () {
            const params = Array.prototype.slice.call(arguments),
                func = 'save_reads_set_v1';

            return this.lookupModule()
                .then((serviceStatus) => {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.list_sets = function () {
            const params = Array.prototype.slice.call(arguments),
                func = 'list_sets';

            return this.lookupModule()
                .then((serviceStatus) => {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_set_items = function () {
            const params = Array.prototype.slice.call(arguments),
                func = 'get_set_items';

            return this.lookupModule()
                .then((serviceStatus) => {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.status = function () {
            const params = Array.prototype.slice.call(arguments),
                func = 'status';

            return this.lookupModule()
                .then((serviceStatus) => {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };
    }
    return SetAPI;
});
