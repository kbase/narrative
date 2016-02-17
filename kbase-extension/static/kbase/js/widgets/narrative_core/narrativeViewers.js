/*global define*/
/*jslint white: true*/

define(['jquery',
        'underscore',
        'narrativeConfig',
        'bluebird',
        'kbase-client-api'],
function($, _, Config, Promise, Clients) {
    'use strict';

    /**
     * Returns a Promise that, when resolved, will yield an object with 5 fields:
     * viewers - the set of viewers
     * landingPageUrls
     * typeNames
     * specs,
     * methodIds
     *
     * Works in two deferred steps:
     * 1. Looks up all method and type specs from the Narrative Method Store.
     * 2. Shuffles those to get all data viewers, landing page urls, type names, and method ids
     * for each viewer method
     * 3. Using those method ids, fetch all of their specs
     * 4. Finally, return all of those at the end stage of the promise - that's what gets returned.
     *
     * So, an example would be:
     * loadViewerInfo().then(function(info) {
     *     console.log(info);
     * });
     *
     * would dump out the object with the five keys outlined above.
     */
    function loadViewerInfo () {
        var viewers = {};
        var landingPageUrls = {};
        var typeNames = {};
        var specs = {};
        var methodIds = [];

        var methodStoreClient = new NarrativeMethodStore(Config.url('narrative_method_store'));
        
        return Promise.resolve(methodStoreClient.list_categories({
            load_methods: 1,
            load_apps: 0,
            load_types: 1
        })).then(function(data) {
            var methodInfo = data[1];
            var allTypes = data[3];

            _.each(allTypes, function (val, key) {
                // If there's an error, whine.
                if (val.loading_error) {
                    console.error("Error loading method [" + key + "]: " + val.loading_error);
                }
                // If it has at least one method id, make sure its there.
                else if (val.view_method_ids && val.view_method_ids.length > 0) {
                    var methodId = val.view_method_ids[0];
                    if (!methodInfo[methodId]) {
                        console.log('Can\'t find method info for id: ' + methodId);
                    } else if (methodInfo[methodId].loading_error) {
                        console.log('There is an error for method info with id [' + methodId + ']: ' + methodInfo[methodId].loading_error);
                    } else {
                        viewers[key] = methodId;
                        landingPageUrls[key] = val.landing_page_url_prefix;
                        typeNames[key] = val.name;
                        methodIds.push(methodId);
                    }
                }
            });

            methodIds = _.uniq(methodIds);
            return Promise.resolve(methodStoreClient.get_method_spec({ids: methodIds}));
        }).then(function (specs) {
            _.each(specs, function (val, key) {
                specs[val.info.id] = val;
            });
            return { viewers: viewers,
                     landingPageUrls: landingPageUrls,
                     typeNames: typeNames,
                     specs: specs,
                     methodIds: methodIds };
        });
    }

    /**
     * Builds a viewer widget.
     * Returns a promise that builds <div> with the widget attached to it, if possible, and the title of that widget.
     *
     * usage:
     * createViewer(dataCell).then(function(result) {
     *    $('body').append(result.title).append(result.widget);
     * })
     * 
     */
    function createViewer (dataCell) {
        var getParamValue = function (o, mapping) {
            var param = null;

            if (mapping.input_parameter) {
                param = o.name;
            }
            else if (mapping.constant_value) {
                param = mapping.constant_value;
            }
            else if (mapping.narrative_system_variable) {
                switch (mapping.narrative_system_variable) {
                    case 'workspace':
                        param = o.ws_name;
                        break;
                    default:
                        console.error('An error occurred');
                }
            }
            else {
                console.error('an error occurred');
            }
            return param;
        }

        var transformParam = function (o, mapping, param) {
            if (mapping.target_type_transform) {
                switch (mapping.target_type_transform) {
                    case 'list':
                        param = [param];
                        break;
                    case 'ref':
                        param = o['ws_name'] + '/' + param;
                        break;
                    default:
                        param = null;
                }
            }
            return param;
        }

        return loadViewerInfo().then(function(viewerInfo) {
            console.log(viewerInfo);
            
            var o = dataCell.obj_info;
            var methodId = viewerInfo.viewers[o.bare_type];
            if (!methodId) {
                console.debug("No viewer found for type=" + o.bare_type);
                return { widget: defaultViewer(dataCell), title: 'Unknown Data Type' };
            }
            var spec = viewerInfo.specs[methodId];
            var inputParamId = spec['parameters'][0]['id'];
            var output = {};
            _.each(spec.behavior.output_mapping, function (mapping) {
                // Get parameter value
                var param = getParamValue(o, mapping);
                if (param === null) {
                    console.error('Unsupported output mapping structure:', mapping);
                    return null;
                }
                // Get transformed parameter value
                param = transformParam(o, mapping, param);
                if (param === null) {
                    console.error('Method (' + methodId + ') spec: bad transformation type=', method.target_type_transform);
                    return null;
                }
                // Get target property
                if (!mapping.target_property) {
                    console.error('Method (' + methodId + ') spec: missing target property');
                    return null;
                }
                // Set target property to transformed parameter value
                output[mapping.target_property] = param;
            });

            output.widgetTitle = viewerInfo.typeNames[o.bare_type] || 'Unknown Data Type'; //spec.info.name;
            output.landing_page_url_prefix = viewerInfo.landingPageUrls[o.bare_type];
            var outputWidget = spec.widgets.output;
            var w = null;
            // XXX: Temporary until all widgets are loaded with Require.
            // First, try to load it from global space.
            var $elem = $('<div>');
            try {
                w = $elem[outputWidget](output);
            }
            // If that fails, try to load with require. 
            // If THAT fails, fail with an error (though the error should be improved)
            catch (err) {
                require([outputWidget], function () {
                    w = $elem[outputWidget](output);
                    return w;
                }, function () {
                    console.error("error making widget: " + outputWidget);
                    $elem = defaultViewer(dataCell);
                    output.widgetTitle = 'Unknown Data Type';
                });
            }
            return {
                widget: $elem,
                title: output.widgetTitle
            };
        });
    }

    /**
     * Builds and returns a default viewer from a given dataCell.
     * Tries to add any object metadata (if available) to that viewer.
     * This returns a jquery node with a <pre> containing that info.
     */
    function defaultViewer (dataCell) {
        var o = dataCell.obj_info;
        var mdDesc = '';

        if (_.isEmpty(o.meta)) {
            mdDesc += "No metadata";
        } else {
            mdDesc += "Metadata";
            _.each(_.pairs(o.meta), function (p) {
                mdDesc += '\n' + p[0] + ': ' + p[1];
            });
        }
        return $('<div>').append($('<pre>').append(mdDesc));
    }

    return {
        viewerInfo: loadViewerInfo(),
        createViewer: createViewer,
        defaultViewer: defaultViewer
    };
});