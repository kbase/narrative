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

    /**
     * Given a number in bytes, converts to most relevant
     * order - KB, MB, GB, etc., up to TB
     * Lots of dividing by 1024.
     */
    function readableBytes (value) {
        var unitList = ["B", "KB", "MB", "GB", "TB", "PB"];
        var unit = 0;
        while (value >= 1024 && unit < 5) {
            value /= 1024;
            unit++;
        }
        return String(value.toFixed(2)) + " " + unitList[unit];
    }

    function prettyPrintJSON (obj) {
        var s = obj;
        if (typeof s != 'string') {
            s = JSON.stringify(s, undefined, 2);
            s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            s = s.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
                function (match) {
                    var cls = 'number';
                    if (/^"/.test(match)) {
                        if (/:$/.test(match)) {
                            cls = 'key';
                        } else {
                            cls = 'string';
                        }
                    } else if (/true|false/.test(match)) {
                        cls = 'boolean';
                    } else if (/null/.test(match)) {
                        cls = 'null';
                    }
                    return '<span class="' + cls + '">' + match + '</span>';
                }
            );
        }
        return s;
    }

    return {
        uuid: uuid,
        safeJSONStringify: safeJSONStringify,
        readableBytes: readableBytes,
        prettyPrintJSON: prettyPrintJSON
    };
});
