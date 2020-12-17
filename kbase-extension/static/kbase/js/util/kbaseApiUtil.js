/**
 * Some utility KBase-wrapping functions
 */

define([
    'bluebird',
    'kb_service/client/narrativeMethodStore',
    'narrativeConfig',
    'base/js/namespace'
], function (
    Promise,
    NarrativeMethodStore,
    Config,
    Jupyter
) {
    'use strict';
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
            tag = 'release';
        }
        return tag;
    }

    /**
     * Returns a Promise that resolves into a list of app specs in the same order as the
     * ids in idList. These get augmented with the "full_info" key that has the results of
     * "get_method_full_info" from the Narrative Method Store service.
     * @param {Array} idList - a list of app ids
     * @param {String} tag - a tag, one of 'release', 'beta', 'dev'
     */
    function getAppSpecs (idList, tag) {
        if (!tag) {
            tag = getAppVersionTag();
        }
        var nms = new NarrativeMethodStore(Config.url('narrative_method_store'));
        return Promise.all([
            nms.get_method_spec({
                ids: idList, tag: tag
            }),
            nms.get_method_full_info({
                ids: idList, tag: tag
            })
        ])
            .then(([appSpecs, appFullInfos]) => {
                appFullInfos.forEach((info, idx) => {
                    appSpecs[idx].full_info = info;
                });
                return appSpecs;
            });
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
