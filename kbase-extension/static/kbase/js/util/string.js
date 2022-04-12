/**
 * A few string utility functions. These are kinda unrelated, but used in several places.
 *
 * @author Bill Riehl wjriehl@lbl.gov
 */
define([], () => {
    'use strict';

    /**
     * @method
     * Unique UUID generator. Uses version 4 of the ISO spec.
     *
     * @public
     */
    function uuid() {
        const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
        return template.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0,
                v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * @method
     * convenience to stringify a structure while escaping everything that needs it.
     * @public
     */
    function safeJSONStringify(obj) {
        const esc = function (s) {
            return s.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
        };
        return JSON.stringify(obj, (key, value) => {
            return typeof value === 'string' ? esc(value) : value;
        });
    }

    /**
     * @method
     * Escape a string to be HTML-safe. Don't let clever people inject script tags into their user name.
     * @public
     */
    function escape(str) {
        if (!str) {
            return str;
        }
        const charMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;',
        };
        return str.replace(/[&<>"']/g, (s) => {
            return charMap[s];
        });
    }

    /**
     * Given a number in bytes, converts to most relevant
     * order - KB, MB, GB, etc., up to TB
     * Adapted from https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
     */
    function readableBytes(value) {
        if (value === 0) {
            return '0 B';
        }
        const k = 1024,
            unitList = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            unitIndex = Math.min(Math.floor(Math.log(value) / Math.log(k)), unitList.length - 1),
            readableValue =
                parseFloat((value / Math.pow(k, unitIndex)).toFixed(2)) + ' ' + unitList[unitIndex];
        return readableValue;
    }

    function prettyPrintJSON(obj) {
        let s = obj;
        if (typeof s != 'string') {
            s = JSON.stringify(s, undefined, 2);
            s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            s = s.replace(
                /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
                (match) => {
                    let cls = 'number';
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

    /**
     * Set the first letter of a string to uppercase
     *
     * Returns the input unchanged if it is not a string
     *
     * @param {string} string
     */
    function capitalize(string) {
        if (typeof string !== 'string') {
            return string;
        }
        return string.charAt(0).toLocaleUpperCase() + string.slice(1);
    }

    /**
     * Turn an array of strings into a comma-separated string
     * @param {array} array
     * @returns {string}
     */
    function arrayToEnglish(array) {
        const cleanArray = array.filter((item) => !!item);
        if (cleanArray.length < 3) {
            return array.join(' and ');
        }
        const lastItem = cleanArray.pop();
        return cleanArray
            .map((item) => `${item},`)
            .concat(`and ${lastItem}`)
            .join(' ');
    }

    /**
     * Returns true if the value is an empty string (or entirely whitespace), or null.
     * Returns false otherwise.
     * @param {*} value
     */
    function isEmptyString(value) {
        if (value === null) {
            return true;
        }
        if (typeof value === 'string' && value.trim() === '') {
            return true;
        }
        return false;
    }

    /**
     * This brings sanity to the output object name string in a few steps:
     * 1. the name is treated as a path, and reduced down to only the filename
     *   e.g. /path/to/file.txt -> file.txt
     * 2. any illegal characters are transformed into _
     *   e.g. "bad_file name&?.txt" -> "bad_file_name__.txt"
     * 3. if the name is entirely numerical (not allowed), "obj_" is prepended
     * 4. if the name is over 255 characters, it gets truncated to that length
     * @param {string} name the potential output object name to make valid
     */
    function sanitizeWorkspaceObjectName(name, isPath) {
        const maxNameLength = 255; // undocumented, from the workspace code
        // if we're in a subpath, need to strip it down to just the file name
        if (isPath && name.indexOf('/') !== -1) {
            name = name.substring(name.lastIndexOf('/') + 1);
        }
        if (name.match(/^\d+$/)) {
            name = `obj_${name}`;
        }
        if (name.length > maxNameLength) {
            name = name.substring(0, maxNameLength);
        }
        return name.replace(/[^A-Za-z0-9|._-]/g, '_');
    }

    return {
        uuid,
        safeJSONStringify,
        readableBytes,
        prettyPrintJSON,
        escape,
        capitalize,
        arrayToEnglish,
        isEmptyString,
        sanitizeWorkspaceObjectName,
    };
});
