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
define(['jquery', 
        'json!kbase/config.json',
        'json!kbase/icons.json'
], function($,
            configSet,
            iconsSet) {
    "use strict";

    var workspaceId = null;
    var m = window.location.href.match(/ws\.(\d+)\.obj\.(\d+)/);
    if (m && m.length > 1)
        workspaceId = parseInt(m[1]);
    var config = {
        urls:            configSet[configSet['config']],
        version:         configSet['version'],
        name:            configSet['name'],
        git_commit_hash: configSet['git_commit_hash'],
        git_commit_time: configSet['git_commit_time'],
        release_notes:   configSet['release_notes'],
        mode:            configSet['mode'],
        icons:           iconsSet,
        workspaceId:     workspaceId,
        loading_gif:     configSet['loading_gif'],
    };
    require.config({
        paths: {
            'uiCommonPaths': config.urls.ui_common_root + "widget-paths"
        }
    });
    window.kbconfig = config;

    var updateConfig = function(callback) {
        // var uiCommonPaths = config.urls.ui_common_root + "widget-paths.json";
        require(['uiCommonPaths'], function(pathConfig) {
            for (var name in pathConfig.paths) {
                pathConfig.paths[name] = config.urls.ui_common_root + pathConfig.paths[name];
            }
            require.config(pathConfig);
            config.new_paths = pathConfig;
            callback(config);
        }, function(error) { 
            console.log("Unable to get updated widget paths. Sticking with what we've got.");
            callback(config);
        });
    };

    return {
        updateConfig: updateConfig,
        config: config
    };
});