/*global define */
/*jslint white:true,browser:true,nomen:true*/
define([
    '../../jsonRpc-native'
], function (jsonRpc) {
    'use strict';

    function GenomeAnnotationAPI(arg) {
        var module = 'GenomeAnnotationAPI';
        // Establish an auth object which has properties token and user_id.
        var auth;
        if (typeof arg.auth === 'function') {
            auth = arg.auth();
        } else {
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
                        version: arg.version
                    }];
            return jsonRpc.request(arg.url, 'ServiceWizard', func, params, 1, options());
        };

        /*
         * inputs_get_taxon
         */
        this.get_taxon = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_taxon';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_assembly
         */
        this.get_assembly = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_assembly';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_feature_types
         */
        this.get_feature_types = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_feature_types';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_feature_type_descriptions
         */
        this.get_feature_type_descriptions = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_feature_type_descriptions';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_feature_type_counts
         */
        this.get_feature_type_counts = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_feature_type_counts';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_feature_ids
         */
        this.get_feature_ids = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_feature_ids';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_features
         */
        this.get_features = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_features';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * params
         */
        this.get_features2 = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_features2';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_proteins
         */
        this.get_proteins = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_proteins';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_feature_locations
         */
        this.get_feature_locations = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_feature_locations';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_feature_publications
         */
        this.get_feature_publications = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_feature_publications';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_feature_dna
         */
        this.get_feature_dna = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_feature_dna';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_feature_functions
         */
        this.get_feature_functions = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_feature_functions';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_feature_aliases
         */
        this.get_feature_aliases = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_feature_aliases';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_cds_by_gene
         */
        this.get_cds_by_gene = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_cds_by_gene';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_mrna_id_list
         */
        this.get_cds_by_mrna = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_cds_by_mrna';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_gene_by_cds
         */
        this.get_gene_by_cds = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_gene_by_cds';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_gene_by_mrna
         */
        this.get_gene_by_mrna = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_gene_by_mrna';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_mrna_by_cds
         */
        this.get_mrna_by_cds = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_mrna_by_cds';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_mrna_by_gene
         */
        this.get_mrna_by_gene = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_mrna_by_gene';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_mrna_exons
         */
        this.get_mrna_exons = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_mrna_exons';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_mrna_utrs
         */
        this.get_mrna_utrs = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_mrna_utrs';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_get_summary
         */
        this.get_summary = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_summary';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * inputs_save_summary
         */
        this.save_summary = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'save_summary';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 2, options());
                });
        };

        /*
         * params
         */
        this.get_combined_data = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_combined_data';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * params
         */
        this.get_genome_v1 = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'get_genome_v1';

            return this.lookupModule()
                .then(function (serviceStatus) {
                    return jsonRpc.request(serviceStatus.url, module, func, params, 1, options());
                });
        };

        /*
         * params
         */
        this.save_one_genome_v1 = function () {
            var params = Array.prototype.slice.call(arguments),
                func = 'save_one_genome_v1';

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

    return GenomeAnnotationAPI;
});