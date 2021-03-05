/**
 * Some utility KBase-wrapping functions
 */

define(['bluebird', 'kbase-client-api', 'narrativeConfig', 'base/js/namespace'], (
    Promise,
    KBaseClient,
    Config,
    Jupyter
) => {
    'use strict';
    function getAppSpec(id, tag) {
        return getAppSpecs([id], tag).then((result) => {
            return Promise.try(() => {
                return result[0];
            });
        });
    }

    function getAppVersionTag() {
        let tag = Jupyter.narrative.sidePanel.$methodsWidget.currentTag;
        if (!tag) {
            tag = 'release';
        }
        return tag;
    }

    /*
     * Expects idList to be a list of app ids
     * If tag is not present, it uses the currently configured tag
     */
    function getAppSpecs(idList, tag) {
        if (!tag) {
            tag = getAppVersionTag();
        }
        const nms = new NarrativeMethodStore(Config.url('narrative_method_store'));
        return Promise.resolve(nms.get_method_spec({ ids: idList, tag: tag }));
    }

    /**
     * Checks that a given object reference is valid. Returns true if the reference
     * is of the form xx/yy or xx/yy/zz or xx/yy/zz;aa/bb/cc, or combinations.
     * Basically, if it's a reference or reference path, this returns true.
     */
    function checkObjectRef(ref) {
        // return true if this.options.objRef = a reference or reference path
        // return false otherwise
        if (!ref) {
            return false;
        }
        const refRegex = /^\S+\/\S+(\/\d+)?$/;
        const refList = ref.split(';');
        let validRef = true;
        refList.forEach((r) => {
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
        checkObjectRef: checkObjectRef,
    };
});
