/*global define */
/*jslint white:true,browser:true*/
define([
    'base/js/namespace',
    'narrativeConfig',
    './monoBus'
], function (Jupyter, Config, Bus, Clock) {
    'use strict';

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
            var path = key.split('.'),
                root = path[0],
                rest = path.slice(1),
                configRoot = Config.get(root);
            if (!configRoot) {
                return defaultValue;
            }
            rest.forEach(function (pathElement) {
                configRoot = configRoot[pathElement];
                if (!configRoot) {
                    return;
                }
            });
            if (!configRoot) {
                return defaultValue;
            }
            return configRoot;
        }
        
        return {
            authToken: authToken,
            config: getConfig,
            bus: bus
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});