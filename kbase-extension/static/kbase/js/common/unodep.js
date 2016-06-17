/*global define*/
/*jslint white:true,browser:true*/

define([
], function () {
    'use strict';

    /*
     * Show elapsed time in a friendly fashion.
     */
    function pad(string, width, char, right) {
        if (!char) {
            char = '0';
        }
        if (typeof string === 'number') {
            string = String(string);
        }
        var padLen = width - string.length,
            padding = '', i;
        if (padLen <= 0) {
            return string;
        }
        for (i = 0; i < padLen; i += 1) {
            padding += char;
        }
        if (right) {
            return string + padding;
        }
        return padding + string;
    }
    function formatElapsedTime(value, defaultValue) {
        if (!value) {
            return defaultValue;
        }
        var temp = value;

        var units = [1000, 60, 60, 24].map(function (unit) {
            var unitValue = temp % unit;
            temp = (temp - unitValue) / unit;
            return unitValue;
        });

        return [[pad(units[3], 2), pad(units[2], 2), pad(units[1], 2)].join(':'), pad(units[0], 3)].join('.');
    }
    function formatTime(time) {
        if (time) {
            return format.niceElapsedTime(time);
        }
    }
    function isEqual(v1, v2) {
        var path = [];
        function iseq(v1, v2) {
            var t1 = typeof v1;
            var t2 = typeof v2;
            if (t1 !== t2) {
                return false;
            }
            switch (t1) {
                case 'string':
                case 'number':
                case 'boolean':
                    if (v1 !== v2) {
                        return false;
                    }
                    break;
                case 'undefined':
                    if (t2 !== 'undefined') {
                        return false;
                    }
                    break;
                case 'object':
                    if (v1 instanceof Array) {
                        if (v1.length !== v2.length) {
                            return false;
                        } else {
                            for (var i = 0; i < v1.length; i++) {
                                path.push(i);
                                if (!iseq(v1[i], v2[i])) {
                                    return false;
                                }
                                path.pop();
                            }
                        }
                    } else if (v1 === null) {
                        if (v2 !== null) {
                            return false;
                        }
                    } else if (v2 === null) {
                        return false;
                    } else {
                        var k1 = Object.keys(v1);
                        var k2 = Object.keys(v2);
                        if (k1.length !== k2.length) {
                            return false;
                        }
                        for (var i = 0; i < k1.length; i++) {
                            path.push(k1[i]);
                            if (!iseq(v1[k1[i]], v2[k1[i]])) {
                                return false;
                            }
                            path.pop();
                        }
                    }
            }
            return true;
        }
        return iseq(v1, v2);
    }

    return {
        formatElapsedTime: formatElapsedTime,
        formatTime: formatTime,
        isEqual: isEqual
    };

});