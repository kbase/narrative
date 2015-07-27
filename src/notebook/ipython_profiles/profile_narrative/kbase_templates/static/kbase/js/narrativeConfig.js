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
define(['jquery'], function($) {
    "use strict";

    var deferred = new $.Deferred();

    // Dumb thing to get the workspace ID just like the back end does - from the URL at startup.
    // This snippet keeps the workspace ID local, so it shouldn't be changed if someone pokes at the URL
    // before trying to fetch it again.
    var workspaceId = null;
    var m = window.location.href.match(/ws\.(\d+)\.obj\.(\d+)/);
    if (m && m.length > 1)
        workspaceId = parseInt(m[1]);

    var configProm = $.ajax({
        url: 'static/kbase/config.json',
        dataType: 'json',
        cache: false
    });
    var iconsProm = $.ajax({
        url: 'static/kbase/icons.json',
        dataType: 'json',
        cache: false
    });

    $.when(configProm, iconsProm).done(
        // configRes and iconsRes are the arguments resolved from their respective lookups.
        // they are both arrays with the structure [data, statustext, jqXHR]
        function loadedConfig(configRes, iconsRes) {
            var configSet = configRes[0];
            var iconsSet = iconsRes[0];
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
            }
            deferred.resolve(config);
        }
    ).fail(
        function failedConfig(configFail, iconFail) {
            console.err('Fatal error - unable to load configuration.');
            // include other fatal error stuff here - should log the error.
            deferred.reject(null);
        }
    );

    return deferred.promise();
});