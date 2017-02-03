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
            padding = '',
            i;
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
            minimized = [],
            units = [1000, 60, 60, 24, 30].map(function (unit) {
                var unitValue = temp % unit;
                temp = (temp - unitValue) / unit;
                return unitValue;
            }).reverse();

        units.pop();

        var keep = false;
        for (var i = 0; i < units.length; i += 1) {
            if (!keep) {
                if (units[i] > 0) {
                    keep = true;
                    if (i > 0) {
                        minimized.push(units[i - 1]);
                        minimized.push(units[i]);
                    }
                }
            } else {
                minimized.push(units[i]);
            }
        }

        // return [pad(units[4], 2), pad(units[3], 2), pad(units[2], 2), pad(units[1], 2)].join(':');
        return minimized.map(function (value) {
            return pad(value, 2);
        })
        .join(':');
    }

    function niceDuration(value, defaultValue) {
        if (!value) {
            return defaultValue;
        }
        var minimized = [];
        var units = [{
            unit: 'millisecond',
            short: 'ms',
            single: 'm',
            size: 1000
        }, {
            unit: 'second',
            short: 'sec',
            single: 's',
            size: 60
        }, {
            unit: 'minute',
            short: 'min',
            single: 'm',
            size: 60
        }, {
            unit: 'hour',
            short: 'hr',
            single: 'h',
            size: 24
        }, {
            unit: 'day',
            short: 'day',
            single: 'd',
            size: 30
        }];
        var temp = value;
        var parts = units
            .map(function (unit) {
                var unitValue = temp % unit.size;
                temp = (temp - unitValue) / unit.size;
                return {
                    name: unit.single,
                    value: unitValue
                };
            }).reverse();

        parts.pop();


        var keep = false;
        for (var i = 0; i < parts.length; i += 1) {
            if (!keep) {
                if (parts[i].value > 0) {
                    keep = true;
                    // if (i > 0) {
                        // minimized.push(parts[i - 1]);
                        minimized.push(parts[i]);
                    // }
                }
            } else {
                minimized.push(parts[i]);
            }
        }

        if (minimized.length === 0) {
            // This means that there is are no time measurements > 1 second.
            return '<1s';
        } else {
            // return [pad(units[4], 2), pad(units[3], 2), pad(units[2], 2), pad(units[1], 2)].join(':');
            return minimized.map(function (item) {
                // return pad(item.value, 2) + item.name;
                return String(item.value) + item.name;
            })
            .join(' ');
        }
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
        niceDuration: niceDuration,
        niceTime: niceTime
    });
});