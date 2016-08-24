/*global define*/
/*jslint white:true,browser:true*/

define([
    'kb_common/format',
], function (format) {
    'use strict';

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

    function elapsedTime(value, defaultValue) {
        if (!value) {
            return defaultValue;
        }
        var temp = value,
            units = [1000, 60, 60, 24].map(function (unit) {
            var unitValue = temp % unit;
            temp = (temp - unitValue) / unit;
            return unitValue;
        });

        return [pad(units[3], 2), pad(units[2], 2), pad(units[1], 2)].join(':');
    }
    
    function niceElapsedTime(date) {
        if (!date) {
            return '-';
        }
        return format.niceElapsedTime(date);
    }
    
    function niceTime(date) {
        if (!date) {
            return '-';
        }
        return format.niceTime(date);
    }

    return Object.freeze({
        elapsedTime: elapsedTime,
        niceElapsedTime: niceElapsedTime,
        niceTime: niceTime
    });
});