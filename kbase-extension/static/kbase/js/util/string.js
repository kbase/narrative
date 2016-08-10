/*global define*/
/*jslint white: true*/
/**
 * A few string utility functions. These are kinda unrelated, but used in several places.
 *
 * @author Bill Riehl wjriehl@lbl.gov
 */
define([], function() {
    'use strict';

    /**
     * @method
     * Unique UUID generator. Uses version 4 of the ISO spec.
     *
     * @public
     */
    function uuid () {
        var template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
        return template.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
            return v.toString(16);});
    }

    /**
     * @method
     * convenience to stringify a structure while escaping everything that needs it.
     * @private
     */
    function safeJSONStringify (obj) {
        var esc = function(s) {
            return s.replace(/'/g, "&apos;")
                    .replace(/"/g, "&quot;");
        };
        return JSON.stringify(obj, function(key, value) {
            return (typeof(value) === 'string') ? esc(value) : value;
        });
    }

    return {
        uuid: uuid,
        safeJSONStringify: safeJSONStringify
    };
});