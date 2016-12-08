/*global define*/
/*jslint white:true,browser:true*/
define([
    
], function () {
    'use strict';
    
    function factory(config) {
         var url = config.url,
            cdnUrl = config.cdn;
        // NB: For prototyping we supply this widget db in code.
        // This is modeling a service which provides widget lookup.
        var widgetPackages = [
            {
                name: 'widgets',
                versions: [
                    {
                        version: '0.1.0',
                        config: {
                            runtime: {
                                version: '0.1.1'
                            }
                        },
                        widgets: [
                            {
                                widgetName: 'test',
                                fileName: 'testWidget.js',
                                amdName: 'testWidget',
                                // inputs are named properties, with optional type and required flag
                                input: {
                                    objectRef: {
                                        required: true,
                                        type: '??'
                                    }
                                }
                            },
                            {
                                widgetName: 'pairedEndLibrary',
                                fileName: 'pairedEndLibrary.js',
                                amdName: 'pairedEndLibrary',
                                input: {
                                    objects: {
                                        objectRef: {
                                            required: true
                                        }
                                    },
                                    options: {}
                                }
                            },
                            {
                                widgetName: 'contigSet',
                                fileName: 'contigSet.js',
                                amdName: 'contigSet',
                                input: {
                                    objects: {
                                        objectRef: {
                                            required: true
                                        }
                                    },
                                    options: {}
                                }
                            },
                            {
                                widgetName: 'genomeComparison',
                                fileName: 'genomeCompairson.js',
                                amdName: 'genomeComparison',
                                input: {
                                    objects: {
                                        objectRef: {
                                            required: true
                                        }
                                    }
                                }
                            },
                            {
                                widgetName: 'objectOverview',
                                // TODO: this needs to be dynamically allocated
                                // when a widget container is launched, or perhaps
                                // mapped into the widget service server with a specific root.
                                // Yeah, that would probably work.
                                url: 'http://localhost:9001/index.html',
                                input: {
                                    objects: {
                                        objectRef: {
                                            required: true
                                        }
                                    }
                                }
                            },
                            {
                                widgetName: 'pairedEndLibrary',
                                // TODO: this needs to be dynamically allocated
                                // when a widget container is launched, or perhaps
                                // mapped into the widget service server with a specific root.
                                // Yeah, that would probably work.
                                url: 'http://localhost:9002/index.html',
                                input: {
                                    objects: {
                                        objectRef: {
                                            required: true
                                        }
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        ];
        
        var widgetDb = {};
        widgetPackages.forEach(function (widgetPackage) {
            widgetDb[widgetPackage.name] = {};
            widgetPackage.versions.forEach(function(version) {
                widgetDb[widgetPackage.name][version.version] = {
                    config: version.config,
                    widgets: {}
                };
                version.widgets.forEach(function (widget) {
                    widgetDb[widgetPackage.name][version.version].widgets[widget.widgetName] = widget;
                });
            });
        });

        function findPackage(packageName, version) {
            var widgetPackage = widgetDb[packageName];
            if (!widgetPackage) {
                throw new Error('Cannot locate package ' + packageName);
            }
            var versionedPackage = widgetPackage[version];
            if (!versionedPackage) {
                throw new Error('Cannot locate version ' + version + ' for package ' + packageName);
            }

            return versionedPackage;
        }

        /*
         * Get a specific widget
         */
        function getWidget(packageName, version, widgetName) {
            var versionedPackage = findPackage(packageName, version),
                widget = versionedPackage.widgets[widgetName];
            
            if (!widget) {
                throw new Error('Cannot locate widget ' + widgetName + ' in package ' + packageName + ' version ' + version);
            }

            return {
                widget: widget,
                packageName: packageName,
                packageVersion: version
            };
        }
        
        /*
         * Find a widget with certain constraints.
         * Currently finds the most recent widget
         */
        function findWidget(findWidgetName) {
            var i, j, k, widgetPackage, version, widget;
            for (i = 0; i < widgetPackages.length; i += 1) {
                widgetPackage = widgetPackages[i];
                for (j = 0; j < widgetPackage.versions.length; j += 1) {
                    version = widgetPackage.versions[j];
                    for (k = 0; k < version.widgets.length; k += 1) {
                        widget = version.widgets[k];
                        if (widget.widgetName === findWidgetName) {
                            return {
                                packageName: widgetPackage.name,
                                packageVersion: version.version,
                                widget: widget
                            };
                        }
                    }
                }
                
            }
        }

        function getBaseUrl(widgetDef) {
            return [url, widgetDef.packageName, widgetDef.packageVersion].join('/');
        }

        return Object.freeze({
            getBaseUrl: getBaseUrl,
            getWidget: getWidget,
            findWidget: findWidget,
            version: '0.1.0',
            about: 'This is the Widget Service Factory'
        });
    }
    
    return {
        make: function (config) {
            return factory(config);
        }
    };
});