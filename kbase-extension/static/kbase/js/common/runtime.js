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

        return {
            authToken: authToken,
            config: getConfig,
            bus: bus,
            getUserSetting: getUserSetting
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});