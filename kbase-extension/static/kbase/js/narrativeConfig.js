/*global define*/
/*jslint white:true*/
/**
 * Loads the required narrative configuration files.
 * This returns a Promise that will eventually hold the results.
 * This should mainly be invoked by the starting app, then
 * that result should be injected where necessary.
 *
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @class narrativeConfig
 * @module Narrative
 * @static
 */
define([
    'jquery',
    'bluebird',
    'json!kbase/config/config.json',
    'json!kbase/config/icons.json'],
function($,
         Promise,
         configSet,
         iconsSet) {
    'use strict';

    // Get the workspace id from the URL
    var workspaceId = null;
    var m = window.location.href.match(/ws\.(\d+)\.obj\.(\d+)/);
    if (m && m.length > 1) {
        workspaceId = parseInt(m[1]);
    }

    // Build the config up from the configSet (from config.json)
    var config = {
        environment:       configSet.config,
        urls:              configSet[configSet.config],
        version:           configSet.version,
        name:              configSet.name,
        git_commit_hash:   configSet.git_commit_hash,
        git_commit_time:   configSet.git_commit_time,
        release_notes:     configSet.release_notes,
        mode:              configSet.mode,
        dev_mode:          configSet.dev_mode,
        tooltip:           configSet.tooltip,
        icons:             iconsSet,
        workspaceId:       workspaceId,
        loading_gif:       configSet.loading_gif,
        use_local_widgets: configSet.use_local_widgets
    };

    var debug = config.mode === "debug";
    config.debug = debug;

    // Add a remote UI-common to the Require.js config
    require.config({
        paths: {
            uiCommonPaths: config.urls.ui_common_root + 'widget-paths'
        }
    });
    window.kbconfig = config;

    /**
     * Updates the RequireJS config with additional locations from 
     * a config given by the ui-common repo. This file is expected to be 
     * called "widget-paths.js" and should be deployed in the configured
     * ui-common location.
     *
     * Note that this is optional. If we're expected to use local widgets,
     * as configured with the use_local_widgets flag, then skip this step
     * and just run the callback.
     */
    function updateConfig() {
        return Promise.try(function() {
            console.log('Config: checking remote widgets');
            if (!config.use_local_widgets) {
                // var uiCommonPaths = config.urls.ui_common_root + "widget-paths.json";
                require(['uiCommonPaths'], function(pathConfig) {
                    for (var name in pathConfig.paths) {
                        pathConfig.paths[name] = config.urls.ui_common_root + pathConfig.paths[name];
                    }
                    require.config(pathConfig);
                    config.new_paths = pathConfig;
                    if (callback) {
                        callback(config);
                    }
                }, function(error) {
                    console.log("Unable to get updated widget paths. Sticking with what we've got.");
                });
            }
            return config;
        })
        .then(function(config) {
            console.log('Config: fetching remote data configuration.');
            return Promise.resolve($.getJSON(config.urls.data_panel_sources));
        })
        .then(function(dataCategories) {
            console.log('Config: processing remote data configuration.');
            config.publicCategories = dataCategories[config.environment].publicData;
            config.exampleData = dataCategories[config.environment].exampleData;
            return Promise.try(function() { return config; });
        })
        .catch(function(error) {
            console.error('Config: unable to process remote data configuration options. Searching locally.');
            // hate embedding this stuff, but it seems the only good way.
            // the filename is the last step of that url path (after the last /)
            var path = config.urls.data_panel_sources.split('/');

            return Promise.resolve($.getJSON('static/kbase/config/' + path[path.length-1]))
            .then(function(dataCategories) {
                console.log('Config: processing local data configuration.');
                config.publicCategories = dataCategories[config.environment].publicData;
                config.exampleData = dataCategories[config.environment].exampleData;
                return Promise.try(function() { return config; });
            })
            .catch(function(error) {
                console.error('Config: unable to process local configuration options, too! Public and Example data unavailable!');
                return Promise.try(function() { return config; });
            });
        })
    }

    /**
     * Simple wrapper to return a URL by its key. If not present, just returns undefined.
     */
    function url(key) {
        return config.urls[key];
    }

    /**
     * Simple wrapper to return some value by its key. If not present, just returns undefined.
     */
    function get(key) {
        return config[key];
    }

    return {
        updateConfig: updateConfig,
        config: config,
        url: url,
        get: get,
        debug: debug
    }
});