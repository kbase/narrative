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

    /**
     * Checks that a given object reference is valid. Returns true if the reference
     * is of the form xx/yy or xx/yy/zz or xx/yy/zz;aa/bb/cc, or combinations.
     * Basically, if it's a reference or reference path, this returns true.
     */
    function checkObjectRef (ref) {
        // return true if this.options.objRef = a reference or reference path
        // return false otherwise
        if (!ref) {
            return false;
        }
        var refRegex = /^\S+\/\S+(\/\d+)?$/;
        var refList = ref.split(';');
        var validRef = true;
        refList.forEach(function(r) {
            if (!refRegex.exec(r)) {
                validRef = false;
            }
        });
        return validRef;
    }

    return {
        getAppSpec: getAppSpec,
        getAppSpecs: getAppSpecs,
        getAppVersionTag: getAppVersionTag,
        checkObjectRef: checkObjectRef
    };
});
