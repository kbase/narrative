/*global define */
/*jslint white:true,browser:true*/
define([
    'base/js/namespace',
    'narrativeConfig'
], function (Jupyter, Config) {
    'use strict';

    function factory(config) {

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
            config: getConfig
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});