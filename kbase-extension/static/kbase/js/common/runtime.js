/*global define */
/*jslint white:true,browser:true*/
define([
    'base/js/namespace',
    'narrativeConfig',
    'common/props',
    './monoBus'
], function (
    Jupyter,
    Config,
    Props,
    Bus) {
    'use strict';
    var narrativeConfig = Props.make({data: Config.getConfig()});

    function factory(config) {


        function createRuntime() {
            var bus = Bus.make();
            return {
                created: new Date(),
                bus: bus
            };
        }

        /*
         * The runtime hooks into a window
         */
        if (!window.kbaseRuntime) {
            window.kbaseRuntime = createRuntime();
        }

        // Global scope

        function bus() {
            return window.kbaseRuntime.bus;
        }


        // These are still module scope

        function authToken() {
            return Jupyter.narrative.authToken;
        }

        function getConfig(key, defaultValue) {
            return narrativeConfig.getItem(key, defaultValue);

//            var path = key.split('.'),
//                root = path[0],
//                rest = path.slice(1),
//                configRoot = Config.get(root);
//            if (!configRoot) {
//                return defaultValue;
//            }
//            rest.forEach(function (pathElement) {
//                configRoot = configRoot[pathElement];
//                if (!configRoot) {
//                    return;
//                }
//            });
//            if (!configRoot) {
//                return defaultValue;
//            }
//            return configRoot;
        }
        
         function getUserSetting(settingKey, defaultValue) {
            var settings = Jupyter.notebook.metadata.kbase.userSettings,
                setting;
            if (!settings) {
                return defaultValue;
            }
            setting = settings[settingKey];
            if (setting === undefined) {
                return defaultValue;
            }
            return setting;
        }
        
        var env = Props.make({});
        function setEnv(key, value) {
            env.setItem(key, value);
        }
        
        function getEnv(key, defaultValue) {
            return env.getItem(key, defaultValue);
        }
        
        /*
         * This is how the narrative core object does this.
         * We should really hook into a single method which gets this 
         * source of truth, validates it against the workspace to get a workspace
         * info, and makes that info available in the runtime at load time.
         * But for now, it is very helpful to have a single runtime object/module
         * available instead of needing to thread global state through everything.
         * The kbaseNarrative object does this, but it also does a lot more...
         */
        function workspaceId() {
            var wsInfo = window.location.href.match(/ws\.(\d+)\.obj\.(\d+)/);
            if (wsInfo && wsInfo.length === 3) {
                return wsInfo[1];
            }
        }
        
        // This is how the 

        return {
            authToken: authToken,
            config: getConfig,
            bus: bus,
            getUserSetting: getUserSetting,
            setEnv: setEnv,
            getEnv: getEnv,
            workspaceId: workspaceId
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});