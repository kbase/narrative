define([
    'jquery',
    'base/js/namespace',
    'narrativeConfig',
    'common/props',
    'common/clock',
    './monoBus',
], ($, Jupyter, Config, Props, Clock, Bus) => {
    'use strict';
    const narrativeConfig = Props.make({ data: Config.getConfig() });

    const FEATURE_DELIMITER = '_';

    function factory(config = {}) {
        const busArgs = config.bus || {};
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
         * The FeatureEnablement represents an instruction as to whether to enable
         * or disable a given feature. A feature is identified, to the human and the
         * Narrative, by the `name`. If `disable` is `true`, the feature is enabled; if
         * `false` it is disabled.
         *
         * The provision of a FeatureEnablement in the URL supersedes all other settings, as
         * it represents the immediate desire of the user.
         *
         * @typedef {Object} FeatureEnablement
         * @property {string} name the feature name and identifier
         * @property {boolean} disable -hether to disable the feature or not (enable it)
         */

        /**
         * Get the list of features, if any, provided in the Narrative URL.
         *
         * The optional `features` search parameter provides a list of features to be
         * enabled or disabled. A feature `name` prefixed with a dash `-` disables the
         * feature; otherwise the feature `name` enables it.
         *
         * If the feature is not provided, other configuration in the Narrative may
         * determine whether it is enabled or disabled.
         *
         * @returns {Array<FeatureEnablement>} An array of features as provided in the URL.
         */
        function getFeaturesFromURL() {
            const url = new URL(window.location.href);
            if (!url.searchParams.has('features')) {
                return [];
            }
            // Extract a comma-separated list of features (see
            // config/feature-config.json) to enable.
            return (new URL(window.location.href).searchParams.get('features') || '')
                .split(FEATURE_DELIMITER)
                .map((feature) => {
                    let name;
                    let disable;

                    if (feature.charAt(0) === '-') {
                        disable = true;
                        name = feature.slice(1);
                        return { disable: true, name: feature.slice(1) };
                    } else {
                        disable = false;
                        name = feature;
                    }
                    return { name, disable };
                })
                .filter(({ name }) => {
                    if (!this.hasConfig(['features', name])) {
                        console.error(`Feature is undefined: ${name}`);
                        return false;
                    }
                    return true;
                });
        }

        /**
         * Given a list of features, create and return a url which contains the feature
         * enablement instructions in single `features` search param field.
         *
         * The list of features are encoded in a single field with a very specific format.
         * The format is chosen to be human-readable.
         *
         * Each feature is represented as the feature `name`. If the name is prefixed with a
         * dash `-` the meaning is that the feature is disabled; otherwise, it is enabled.
         * Such feature enablement instructions are separated by an underscore `_`. This
         * separator was chosen because it is allowable in urls, and it is visually distinct
         * from the dash. Other allowable non-alphanumeric characters are more difficult to
         * distinguish from the dash, or might otherwise be confusing (e.g. period `.`)
         *
         * @param {Array<FeatureEnablement>} features
         * @returns {void} nothing
         */
        function setFeaturesInURL(features) {
            const featuresString = features
                .filter(({ name }) => {
                    // If a feature is not defined in the configuration, we ignore it.
                    const isDefined = this.hasConfig(['features', name]);
                    if (!isDefined) {
                        console.error(`Feature is undefined: ${name}`);
                    }
                    return isDefined;
                })
                .map(({ name, disable }) => {
                    return `${disable ? '-' : ''}${name}`;
                })
                .join(FEATURE_DELIMITER);

            const url = new URL(window.location.href);

            url.searchParams.set('features', featuresString);

            return url;
        }

        /**
         * Given a feature name, return the feature enablement from the URL, if any.
         *
         * If absent, `undefined` is returned.
         *
         * @param {FeatureEnablement} featureName
         * @returns {FeatureEnablement | undefined}
         */
        function getFeatureFromURL(featureName) {
            // An undefined feature is always undefined.
            if (!this.hasConfig(['features', featureName], false)) {
                console.error(`Feature is undefined: ${featureName}`);
                return false;
            }

            // Extract a comma-separated list of features (see
            // config/feature-config.json) to enable.
            const matchingFeatures = this.getFeaturesFromURL().filter(({ name }) => {
                return name === featureName;
            });

            return matchingFeatures.slice(-1)[0];
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
         * @param {string} featureName The name of the given feature.
         * @returns {boolean} Whether the given feature is enabled
         */
        function isFeatureEnabled(featureName) {
            // An undefined feature is always disabled.
            if (!this.hasConfig(['features', featureName], false)) {
                console.error(`Feature is undefined: ${featureName}`);
                return false;
            }

            // If a feature is specified in the URL (see above), we either enable or
            // disable it. Otherwise, try to get the feature from the other places.
            const featureFromURL = this.getFeatureFromURL(featureName);
            if (featureFromURL) {
                return !featureFromURL.disable;
            }

            // May be a string value? At least the pre-existing code implied it may not
            // be boolean, so we coerce it.
            //
            // TODO: temporarily disabled; there is a race condition in the underlying
            // code, as we need the notebook to be fully populated in order to get the
            // userSetting, but that may not be the case when this code is called.

            // const featureEnabledFromUserSetting = !!getUserSetting(featureName);
            const featureEnabledFromUserSetting = null;

            // The full set of features, with default enablement, is available in
            // feature-config.json, which is made available in the Narrative config
            // object under the 'features' key.
            const featureEnabledFromConfig = getConfig(['features', featureName], false);

            return featureEnabledFromUserSetting || featureEnabledFromConfig;
        }

        function getConfig(key, defaultValue) {
            if (key) {
                return narrativeConfig.getItem(key, defaultValue);
            } else {
                return narrativeConfig.getRawObject();
            }
        }

        function hasConfig(key) {
            return narrativeConfig.hasItem(key);
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
            return narrativeConfig.getItem('workspaceId', null);
        }

        return {
            authToken,
            config: getConfig,
            hasConfig,
            bus,
            getUserSetting,
            setEnv,
            getEnv,
            workspaceId,
            userId,
            isFeatureEnabled,
            getFeaturesFromURL,
            getFeatureFromURL,
            setFeaturesInURL,
            destroy,
        };
    }

    return {
        make: factory,
    };
});
