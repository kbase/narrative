/*global define,window,console,require*/
/*jslint white:true,browser:true*/
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
    'narrative_paths',
    'jquery',
    'bluebird',
    'json!kbase/config/config.json',
    'json!kbase/config/icons.json',
    'json!kbase/config/cdn-service-config.json',
    'json!kbase/config/feature-config.json',
    'json!kbase/config/staging_upload.json',
    'require'
], function (
    paths,
    $,
    Promise,
    ConfigSet,
    IconsSet,
    ServiceSet,
    FeatureSet,
    StagingUpload,
    localRequire
) {
    'use strict';

    var config, debug;

    // Get the workspace id from the URL
    console.log(window.location.href);
    var workspaceId = null,
        objectId = null,
        narrativeRef = null,
        m = window.location.href.match(/(ws\.)?(\d+)((\.obj\.(\d+))(\.ver\.(\d+))?)?/);
    // 2 = wsid
    // 5 = objid
    // 7 = ver
    if (m && m.length > 2) {
        workspaceId = parseInt(m[2]);
        if (m[5] != undefined) {
            objectId = parseInt(m[5]);
            narrativeRef = workspaceId + '/' + objectId;
        }
    }

    // Build the config up from the configSet (from config.json)
    config = {
        environment: ConfigSet.config,
        urls: ConfigSet[ConfigSet.config],
        version: ConfigSet.version,
        name: ConfigSet.name,
        git_commit_hash: ConfigSet.git_commit_hash,
        git_commit_time: ConfigSet.git_commit_time,
        release_notes: ConfigSet.release_notes,
        mode: ConfigSet.mode,
        dev_mode: ConfigSet.dev_mode,
        tooltip: ConfigSet.tooltip,
        icons: IconsSet,
        workspaceId: workspaceId,
        objectId: objectId,
        narrativeRef: narrativeRef,
        loading_gif: ConfigSet.loading_gif,
        use_local_widgets: ConfigSet.use_local_widgets,
        features: FeatureSet,
        uploaders: StagingUpload,
        data_panel: ConfigSet.data_panel,
        comm_wait_timeout: ConfigSet.comm_wait_timeout,
        auth_cookie: ConfigSet.auth_cookie,
        auth_sleep_recheck_ms: ConfigSet.auth_sleep_recheck_ms
    };

    debug = config.mode === 'debug';
    config.debug = debug;

    // Add a remote UI-common to the Require.js config
    require.config({
        paths: {
            uiCommonPaths: config.urls.ui_common_root + 'widget-paths'
        }
    });

    window.kbconfig = config;
    Object.keys(ServiceSet).forEach(function (key) {
        config[key] = ServiceSet[key];
    });

    config['services'] = {};
    Object.keys(config.urls).forEach(function (key) {
        config.services[key] = { 'url': config.urls[key], 'name': key };
    });

    function assertConfig() {
        if (config === undefined) {
            throw new Error('Config has not yet been loaded');
        }
    }

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
        return new Promise(function (resolve, reject) {
            if (window.kbconfig) {
                resolve(window.kbconfig);
            }
            console.log('Config: checking remote widgets');
            assertConfig();
            if (!config.use_local_widgets) {
                // var uiCommonPaths = config.urls.ui_common_root + "widget-paths.json";
                require(['uiCommonPaths'], function (pathConfig) {
                    for (var name in pathConfig.paths) {
                        pathConfig.paths[name] = config.urls.ui_common_root + pathConfig.paths[name];
                    }
                    require.config(pathConfig);
                    config.new_paths = pathConfig;
                    resolve(config);
                }, function () {
                    console.warn("Unable to get updated widget paths. Sticking with what we've got.");
                    resolve(config);
                });
            } else {
                resolve(config);
            }
        }).then(function (config) {
            console.log('Config: fetching remote data configuration.');
            return Promise.resolve($.ajax({
                dataType: 'json',
                cache: false,
                url: config.urls.data_panel_sources
            }));
        }).then(function (dataCategories) {
            console.log('Config: processing remote data configuration.');
            var env = config.environment;
            // little bit of a hack, but dev should => ci for all things data.
            // it doesn't seem worth making a new dev block for the example data.
            if (env === 'dev') {
                env = 'ci';
            }
            config.publicCategories = dataCategories[env].publicData;
            config.exampleData = dataCategories[env].exampleData;
            return Promise.try(function () {
                return config;
            });
        }).catch(function (error) {
            console.error('Config: unable to process remote data configuration options. Searching locally.');
            // hate embedding this stuff, but it seems the only good way.
            // the filename is the last step of that url path (after the last /)
            var path = config.urls.data_panel_sources.split('/');

            return Promise.resolve($.ajax({
                dataType: 'json',
                cache: false,
                url: 'static/kbase/config/' + path[path.length - 1]
            }))
                .then(function (dataCategories) {
                    console.log('Config: processing local data configuration.');
                    var env = config.environment;
                    if (env === 'dev') {
                        env = 'ci';
                    }
                    config.publicCategories = dataCategories[env].publicData;
                    config.exampleData = dataCategories[env].exampleData;
                    return config;
                })
                .catch(function (error) {
                    console.error('Config: unable to process local configuration options, too! Public and Example data unavailable!');
                    return config;
                });
        });
    }

    /**
     * Simple wrapper to return a URL by its key. If not present, just returns undefined.
     */
    function url(key) {
        assertConfig();
        return config.urls[key];
    }

    /**
     * Simple wrapper to return some value by its key. If not present, just returns undefined.
     */
    function get(key) {
        assertConfig();
        return config[key];
    }

    /*
     * If the module is defined in multiple module loaders, the module variable config and debug will
     * not be available.
     */
    function getConfig() {
        return window.kbconfig;
    }

    return {
        updateConfig: updateConfig,
        config: config,
        getConfig: getConfig,
        url: url,
        get: get,
        debug: debug
    };
});
