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
        let tag;
        // TODO: make some form of service / API call for this. Link to runtime module?
        // Also update other modules that dig through the same magic pathway to get that tag.
        if (Jupyter && Jupyter.narrative && Jupyter.narrative.sidePanel && Jupyter.narrative.sidePanel.$methodsWidget) {
            tag = Jupyter.narrative.sidePanel.$methodsWidget.currentTag;
        }
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
    function getAppSpecs(idList, tag) {
        if (!tag) {
            tag = getAppVersionTag();
        }
        const nms = new NarrativeMethodStore(Config.url('narrative_method_store'));
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
     *
     * Note that if there's a reference path (xx/yy/zz;aa/bb/cc), these MUST include
     * versions. I.e. xx/yy;aa/bb/cc will fail.
     * @param {string} ref - a workspace reference string
     */
    function checkObjectRef(ref) {
        // return true if this.options.objRef = a reference or reference path
        // return false otherwise
        if (!ref) {
            return false;
        }

        const refRegex = /^\w+\/\w+(\/\d+)?$/;
        if (ref.indexOf(';') === -1) { // if it's not a path, just do the basic regex
            if (refRegex.exec(ref)) {
                return true;
            }
            return false;
        }

        const versionRefRegex = /^\w+\/\w+\/\d+?$/;
        var refList = ref.split(';');
        var validRef = true;
        refList.forEach(function(r) {
            if (!versionRefRegex.exec(r)) {
                validRef = false;
            }
        });
        return validRef;
    }

    /**
     * This breaks down a workspace type name into its component parts. This returns an object with
     * structure with these properties:
     * - module - the module name
     * - type - the type name
     * - version - the complete version
     * - majorVersion - the major part of the version
     * - minorVersion - the minor part of the version
     * For example, "KBaseNarrative.Narrative-1.0" would break down to:
     * {
     *   module: 'KBaseNarrative',
     *   type: 'Narrative',
     *   version: '1.0',
     *   majorVersion: '1',
     *   minorVersion: '0'
     * }
     * If the string is not a valid workspace type string, this returns null;
     * @param {string} typeString a workspace type string of format:
     *      ModuleName.TypeName-MajorVersion.MinorVersion
     */
    function parseWorkspaceType (typeString) {
        if (!typeString) {
            return null;
        }
        const pattern = /^(\w+)\.(\w+)-((\d+)\.(\d+))$/;
        const matches = typeString.match(pattern);
        if (!matches) {
            return null;
        }
        return {
            module: matches[1],
            type: matches[2],
            version: matches[3],
            majorVersion: matches[4],
            minorVersion: matches[5],
        };
    }

    return {
        getAppSpec: getAppSpec,
        getAppSpecs: getAppSpecs,
        getAppVersionTag: getAppVersionTag,
        checkObjectRef: checkObjectRef,
        parseWorkspaceType: parseWorkspaceType
    };
});
