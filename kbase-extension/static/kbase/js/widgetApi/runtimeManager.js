/*global define*/
/*jslint white:true,browser:true */
define([
], function () {
    'use strict';

    function factory(config) {
        var cdnUrl = config.cdnUrl;
        var runtimes = {
            '0.1.0': {
                version: '0.1.0',
                amd: {
                    paths: {
                        bluebird: 'bluebird/3.3.4/bluebird',
                        jquery: 'jquery/2.2.2/jquery',
                        underscore: 'underscore/1.8.3/underscore',
                        bootstrap: 'bootstrap/3.3.6/js/bootstrap',
                        bootstrap_css: 'bootstrap/3.3.6/css/bootstrap',
                        d3: 'd3/3.5.16/d3',
                        datatables: 'datatables/1.10.10/js/jquery.dataTables',
                        datatables_css: 'datatables/1.10.10/css/jquery.dataTables',
                        datatables_bootstrap: 'datatables-bootstrap3-plugin/0.4.0/js/datatables-bootstrap3',
                        datatables_bootstrap_css: 'datatables-bootstrap3-plugin/0.4.0/css/datatables-bootstrap3',
                        'font-awesome': 'font-awesome/4.3.0/font-awesome',
                        handlebars: 'handlebars/4.0.5/handlebars',
                        'js-yaml': 'js-yaml/3.3.1/js-yaml',
                        knockout: 'knockout/3.4.0/knockout',
                        numeral: 'numeral/1.5.0/numeral',
                        nunjucks: 'nunjucks/2.4.1/nunjucks',
                        plotly: 'plotly/1.5.0/plotly',
                        uuid: 'pure-uuid/1.3.0/uuid',
                        
                        
                        // require plugins
                        css: 'require-css/0.1.8/css',
                        text: 'requirejs-text/2.0.14/text',
                        yaml: 'require-yaml/0.1.2/yaml',
                            
                        // kbase
                        'kb_service': 'kbase-service-clients-js/1.4.0',
                        'kb_common': 'kbase-common-js/1.5.3',
                        'kb_widget_service': 'kbase-widget-service/0.1.0'
                    },
                    shim: {
                        bootstrap: {
                            deps: ['css!bootstrap_css', 'jquery']
                        },
                        datatables: {
                            deps: ['css!datatables_css']
                        },
                        datatables_bootstrap: {
                            deps: ['css!datatables_bootstrap_css', 'datatables']
                        }
                    }
                }
            },
            '0.1.1': {
                version: '0.1.1',
                amd: {
                    paths: {
                        bluebird: 'bluebird/3.3.4/bluebird',
                        jquery: 'jquery/2.2.2/jquery',
                        underscore: 'underscore/1.8.3/underscore',
                        bootstrap: 'bootstrap/3.3.6/js/bootstrap',
                        bootstrap_css: 'bootstrap/3.3.6/css/bootstrap',
                        d3: 'd3/3.5.16/d3',
                        datatables: 'datatables/1.10.10/js/jquery.dataTables',
                        datatables_css: 'datatables/1.10.10/css/jquery.dataTables',
                        datatables_bootstrap: 'datatables-bootstrap3-plugin/0.4.0/js/datatables-bootstrap3',
                        datatables_bootstrap_css: 'datatables-bootstrap3-plugin/0.4.0/css/datatables-bootstrap3',
                        'font-awesome': 'font-awesome/4.3.0/font-awesome',
                        handlebars: 'handlebars/4.0.5/handlebars',
                        'js-yaml': 'js-yaml/3.3.1/js-yaml',
                        knockout: 'knockout/3.4.0/knockout',
                        numeral: 'numeral/1.5.0/numeral',
                        nunjucks: 'nunjucks/2.4.1/nunjucks',
                        plotly: 'plotly/1.5.0/plotly',
                        uuid: 'pure-uuid/1.3.0/uuid',
                        
                        // require plugins
                        css: 'require-css/0.1.8/css',
                        text: 'requirejs-text/2.0.14/text',
                        yaml: 'require-yaml/0.1.2/yaml',
                            
                        // kbase
                        // kbase
                        'kb_service': 'kbase-service-clients-js/1.4.0',
                        'kb_common': 'kbase-common-js/1.5.4',
                        'kb_widget_service': 'kbase-widget-service/0.1.0'
                    },
                    shim: {
                        bootstrap: {
                            deps: ['css!bootstrap_css']
                        }
                        //datatables: {
                        //    deps: ['css!datatables_css']
                        //},
                        //datatables_bootstrap: {
                        //    deps: ['css!datatables_bootstrap_css', 'datatables']
                        //}
                    }
                }
            }
        };
        
        // Fix up the paths one time, based on the cdn base url.
        // This is done because the requirejs object produced by the client
        // will be localized to itself (e.g. widget) so we don't want to 
        // set the base url here to the cdn.
        Object.keys(runtimes).forEach(function (version) {            
            var newMap = {},
                runtime = runtimes[version];
            Object.keys(runtime.amd.paths).forEach(function (moduleName) {
                newMap[moduleName] = [cdnUrl, runtime.amd.paths[moduleName]].join('/');
            });
            runtime.amd.paths = newMap;
        });

        function getRuntime(version) {
            var runtime = runtimes[version];
            if (!runtime) {
                throw new Error('No runtime defined for version ' + version);
            }
            return runtime;
        }
        
        function getModuleLoader(version, baseRequire, baseUrl) {
            var runtime = getRuntime(version);
            return baseRequire.config({
                context: 'runtime_' + runtime.version,
                baseUrl: baseUrl,
                paths: runtime.amd.paths,
                shim: runtime.amd.shim
            });
        }

        return {
            getRuntime: getRuntime,
            getModuleLoader: getModuleLoader
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});