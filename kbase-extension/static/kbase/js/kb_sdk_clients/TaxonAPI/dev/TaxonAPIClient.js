/*global define */
/*jslint white:true,browser:true,jsnomen:true*/
define([
    '../../jsonRpc-native'
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
     * auth_cb - function which returns the above value
     * async_job_check_time_ms - unused? 
     */
    function TaxonAPI(arg) {
        // Establish an auth object which has properties token and user_id.
        var module = 'TaxonAPI';
        var auth;
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
            var func = 'get_service_status',
                params = [{
                        module_name: module,
                        version: arg.version || 'dev'
                    }];
            return jsonRpc.request(arg.url, 'ServiceWizard', func, params, 1, options());
        };

        /*
         * ref
         */
        this.get_parent = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_parent';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_children = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_children';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_genome_annotations = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_genome_annotations';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_scientific_lineage = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_scientific_lineage';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_scientific_name = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_scientific_name';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_taxonomic_id = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_taxonomic_id';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_kingdom = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_kingdom';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_domain = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_domain';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_genetic_code = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_genetic_code';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_aliases = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_aliases';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_info = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_info';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_history = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_history';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_provenance = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_provenance';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_id = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_id';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_name = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_name';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };
        
        // NOTE: arguments to the api call should match the spec.
        // Thus the somewhat arcane structure internally. The anonymous immmediately
        // executed functional creates a barrier between the injected parameter names
        // in the main api function , and the internal implementation of constructing
        // the actual service call. Otherwise there could always be a conflict between
        // the injected parameters and any internal variables.
        // Of course, this could be caught at spec-time if the spec were aware of 
        // reserved 
        
        /*
         * ref
         */
        this.get_all_data = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_all_data';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_decorated_scientific_lineage = function () {
            // We need to use the raw arguments magic local variable rather than
            // explicit arguments because the arguments are injected from specs
            // and may conflict with Javascript reserved words, variables
            // internal to this function, or shadow other symbols we need 
            // (e.g. the options function).
            var params = Array.prototype.slice.call(arguments),
                func = 'get_decorated_scientific_lineage';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };
        
        this.get_decorated_children = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_decorated_children';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * ref
         */
        this.get_version = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_version';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * 
         */
        this.status = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'status';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };
    }
    return TaxonAPI;
});
