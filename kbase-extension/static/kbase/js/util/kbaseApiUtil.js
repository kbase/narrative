/**
 * Some utility KBase-wrapping functions
 */

define([
    'bluebird',
    'kbase-client-api',
    'kbase-generic-client-api',
    'narrativeConfig',
    'base/js/namespace'
], function (
    Promise,
    KBaseClient,
    GenericClient,
    Config,
    Jupyter
) {

    function getAppSpec (id, tag) {
        return getAppSpecs([id], tag).then(function(result) {
            return Promise.try(function() {
                return result[0];
            });
        });
    }

    function getAppVersionTag () {
        var tag = Jupyter.narrative.sidePanel.$methodsWidget.currentTag;
        if (!tag) {
            tag = "release";
        }
        return tag;
    }

    /*
     * Expects idList to be a list of app ids
     * If tag is not present, it uses the currently configured tag
     */
    function getAppSpecs (idList, tag) {
        if (!tag) {
            tag = getAppVersionTag();
        }
        var nms = new NarrativeMethodStore(Config.url('narrative_method_store'));
        return Promise.resolve(nms.get_method_spec({ids: idList, tag: tag}));
    }

    return {
        getAppSpec: getAppSpec,
        getAppSpecs: getAppSpecs,
        getAppVersionTag: getAppVersionTag
    };
});
