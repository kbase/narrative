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
     * @public
     */
    function safeJSONStringify (obj) {
        var esc = function(s) {
            return s.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
        };
        return JSON.stringify(obj, function(key, value) {
            return (typeof(value) === 'string') ? esc(value) : value;
        });
    }

    /**
     * @method
     * Escape a string to be HTML-safe. Don't let clever people inject script tags into their user name.
     * @public
     */
    function escape (str) {
        if (!str) {
            return str;
        }
        return str.replace(/[&<>"']/g, (s) => {
            const charMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return charMap[s];
        });
    }

    /**
     * Given a number in bytes, converts to most relevant
     * order - KB, MB, GB, etc., up to TB
     * Adapted from https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
     */
    function readableBytes (value) {
        if (value === 0) {
            return '0 B';
        }
        var k = 1024,
            unitList = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            unitIndex = Math.min(Math.floor(Math.log(value) / Math.log(k)), unitList.length-1),
            readableValue = parseFloat((value / Math.pow(k, unitIndex)).toFixed(2)) + ' ' + unitList[unitIndex];
        return readableValue;
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
        prettyPrintJSON: prettyPrintJSON,
        escape: escape
    };
});
