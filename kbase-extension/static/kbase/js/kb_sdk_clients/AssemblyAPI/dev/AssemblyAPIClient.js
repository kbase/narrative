/*global define */
/*jslint white:true,browser:true,jsnomen:true*/
define([
    '../../jsonRpc-native'
], function (jsonRpc) {
    'use strict';

    function AssemblyAPI(arg) {
        var module = 'AssemblyAPI';
        // Establish an auth object which has properties token and user_id.
        var auth;
        if (typeof arg.auth === 'function') {
            auth = arg.auth();
        } else {
            auth = arg.auth || {};
        }
        
        if (!arg.url) {
            console.error('ERROR', arg);
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
                        version: arg.version
                    }];
            return jsonRpc.request(arg.url, 'ServiceWizard', func, params, 1, options());
        };

        /*
         * ref
         */
        this.get_assembly_id = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_assembly_id';

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
        this.get_external_source_info = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_external_source_info';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };


        /*
         * ref
         */
        this.get_stats = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_stats';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };


        /*
         * ref
         */
        this.get_number_contigs = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_number_contigs';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };


        /*
         * ref
         */
        this.get_gc_content = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_gc_content';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };


        /*
         * ref
         */
        this.get_dna_size = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_dna_size';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };


        /*
         * ref
         */
        this.get_contig_ids = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_contig_ids';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };


        /*
         * ref, contig_id_list
         */
        this.get_contig_lengths = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_contig_lengths';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });            
        };


        /*
         * ref, contig_id_list
         */
        this.get_contig_gc_content = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_contig_gc_content';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                }); 
        };


        /*
         * ref, contig_id_list
         */
        this.get_contigs = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_contigs';

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

    return AssemblyAPI;
});
