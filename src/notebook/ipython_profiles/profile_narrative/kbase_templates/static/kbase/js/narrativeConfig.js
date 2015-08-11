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
    console.log(configSet);
    var config = {
        urls:            configSet[configSet['config']],
        version:         configSet['version'],
        name:            configSet['name'],
        git_commit_hash: configSet['git_commit_hash'],
        git_commit_time: configSet['git_commit_time'],
        // landing_page_map:landingPageMap,
        release_notes:   configSet['release_notes'],
        mode:            configSet['mode'],
        icons:           iconsSet,
        workspaceId:     workspaceId,
        loading_gif:     configSet['loading_gif']                    
    };
    return config;
});