define([
    'jquery',
    'base/js/namespace',
    'narrativeConfig',
    'common/props',
    'common/clock',
    './monoBus',
], ($, Jupyter, Config, Props, Clock, Bus) => {
    'use strict';
    const NARRATIVE_CONFIG = Props.make({ data: Config.getConfig() });

    function factory(params = {}) {
        const busArgs = params.bus || {};
        let clock, theBus;

        function createRuntime() {
            theBus = Bus.make(busArgs);

            clock = Clock.make({
                bus: theBus,
                resolution: 1000,
            });
            clock.start();

            $(document).on('dataUpdated.Narrative', () => {
                theBus.emit('workspace-changed');
            });

            return {
                created: new Date(),
                bus: theBus,
                env: Props.make({}),
                clock,
            };
        }

        function destroy() {
            if (clock) {
                clock.stop();
            }
            $(document).off('dataUpdated.Narrative');
            if (theBus) {
                theBus.destroy();
            }
            theBus = null;
            window.kbaseRuntime = null;
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
            return Jupyter.narrative.getAuthToken();
        }

        function userId() {
            return Jupyter.narrative.userId;
        }

        function getUserSetting(settingKey, defaultValue) {
            const settings = Jupyter.notebook.metadata.kbase.userSettings;
            if (!settings) {
                return defaultValue;
            }
            const setting = settings[settingKey];
            if (typeof setting === 'undefined') {
                return defaultValue;
            }
            return setting;
        }

        /**
         * Determines if a given feature is enabled.
         *
         * Sources of feature enablement are, in order of precedence:
         *   url search param, user settings, configuration.
         *
         * url search param -  url search param named "features" containing a
         *   comma-separated list of features found in "feature-config.json".
         * user settings - a userSettings feature (see getUserSetting above) which does
         *   not seem to be used
         * configuration - the file "feature-config.json" located in
         *   "kbase-extension/static/kbase/config/feature-config.json" contains a object
         *   in which the keys are feature ids and the value indicates whether it is
         *   enabled or not. This is both the canonical set of features, and also their
         *   default values.
         *
         * If a feature is not found under the given name, the result is always false.
         *
         * @param {string} featureName
         * @returns {boolean} Whether the given feature is enabled
         */
        function isFeatureEnabled(featureName) {
            // Extract a comma-separated list of features (see
            // config/feature-config.json) to enable.
            const featuresFromURL = (
                new URL(window.location.href).searchParams.get('features') || ''
            ).split(',');

            // May be a string value? At least the pre-existing code implied it may not
            // be boolean, so we coerce it.
            // TODO: temporarily disabled; there is a race condition in the underlying
            // code, as we need the notebook to be fully populated in order to get the
            // userSetting, but that may not be the case when this code is called.

            // const featureEnabledFromUserSetting = !!getUserSetting(featureName);
            const featureEnabledFromUserSetting = null;

            // The full set of features, with default enablement, is available in
            // feature-config.json, which is made available in the Narrative config
            // object under the 'features' key.

            const featureEnabledFromConfig = config(['features', featureName], false);

            return (
                featuresFromURL.includes(featureName) ||
                featureEnabledFromUserSetting ||
                featureEnabledFromConfig
            );
        }

        function isDeveloper() {
            return isFeatureEnabled('developer');
        }

        function isAdvanced() {
            return isFeatureEnabled('advanced');
        }

        function config(key, defaultValue) {
            if (key) {
                return NARRATIVE_CONFIG.getItem(key, defaultValue);
            } else {
                return NARRATIVE_CONFIG.getRawObject();
            }
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
            return NARRATIVE_CONFIG.getItem('workspaceId', null);
        }

        return {
            authToken,
            config,
            bus,
            getUserSetting,
            setEnv,
            getEnv,
            workspaceId,
            userId,
            isDeveloper,
            isAdvanced,
            isFeatureEnabled,
            destroy,
        };
    }

    return {
        make: factory,
    };
});
