/*global define */
/*jslint white:true,browser:true*/
define([
    'jquery',
    'base/js/namespace',
    'narrativeConfig',
    'common/props',
    'common/clock',
    './monoBus'
], function (
    $,
    Jupyter,
    Config,
    Props,
    Clock,
    Bus
) {
    'use strict';
    var narrativeConfig = Props.make({ data: Config.getConfig() });

    function factory(config) {
        function createRuntime() {
            var bus = Bus.make();

            var clock = Clock.make({
                bus: bus,
                resolution: 1000
            });
            clock.start();

            $(document).on('dataUpdated.Narrative', function () {
                bus.emit('workspace-changed');
            });

            return {
                created: new Date(),
                bus: bus,
                env: Props.make({})
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



        function setEnv(key, value) {
            window.kbaseRuntime.env.setItem(key, value);
        }

        function getEnv(key, defaultValue) {
            return window.kbaseRuntime.env.getItem(key, defaultValue);
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