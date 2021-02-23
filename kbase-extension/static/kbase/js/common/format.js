define([
    'kb_common/format'
], (format) => {
    'use strict';

    function pad(string, width, char, right) {
        if (!char) {
            char = '0';
        }
        if (typeof string === 'number') {
            string = String(string);
        }
        let padLen = width - string.length,
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
        let temp = value,
            minimized = [],
            units = [1000, 60, 60, 24, 30].map((unit) => {
                const unitValue = temp % unit;
                temp = (temp - unitValue) / unit;
                return unitValue;
            }).reverse();

        units.pop();

        let keep = false;
        for (let i = 0; i < units.length; i += 1) {
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

        return minimized.map((value) => {
            return pad(value, 2);
        })
        .join(':');
    }

    function niceDuration(value, defaultValue) {
        if (!value) {
            return defaultValue;
        }
        const minimized = [];
        const units = [{
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
        let temp = value;
        const parts = units
            .map((unit) => {
                const unitValue = temp % unit.size;
                temp = (temp - unitValue) / unit.size;
                return {
                    name: unit.single,
                    value: unitValue
                };
            }).reverse();

        parts.pop();

        let keep = false;
        for (let i = 0; i < parts.length; i += 1) {
            if (!keep) {
                if (parts[i].value > 0) {
                    keep = true;
                    minimized.push(parts[i]);
                }
            } else {
                minimized.push(parts[i]);
            }
        }

        if (minimized.length === 0) {
            // This means that there is are no time measurements > 1 second.
            return '<1s';
        } else {
            // Skip seconds if we are into the hours...
            if (minimized.length > 2) {
                minimized.pop();
            }
            return minimized.map((item) => {
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