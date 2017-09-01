/*global define*/
/*jslint white: true*/
/**
 * A few utility functions. These are kinda unrelated, but used in several places.
 *
 * @author Bill Riehl wjriehl@lbl.gov
 */
define([], function() {
    'use strict';

    var monthLookup = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    /**
     * @method makePrettyTimestamp
     * Makes a span containing the 'started time' in units of time ago, with a Bootstrap 3 tooltip
     * that gives the exact time.
     *
     * Note that this tooltip needs to be activated with the $().tooltip() method before it'll function.
     *
     * @param timestamp the timestamp to calculate this span around. Should be in a Date.parse() parseable format.
     * @return a span element with the timestamp calculated to be in terms of how long ago, with a tooltip containing the exact time.
     * @private
     */
    function prettyTimestamp (timestamp) {
        var d = parseDate(timestamp);

        var parsedTime = reformatDate(d);
        var timediff = calcTimeFromNow(d);
        var timeMillis = d ? d.getTime() : '';

        var timeHtml = '<span href="#" data-toggle="tooltip" title="' + parsedTime + '" millis="' + timeMillis + '" >' + timediff + '</span>';
        return timeHtml;
    }

    /**
     * VERY simple date parser.
     * Returns a valid Date object if that time stamp's real.
     * Returns null otherwise.
     * @param {String} time - the timestamp to convert to a Date
     * @returns {Object} - a Date object or null if the timestamp's invalid.
     */
    function parseDate (time) {
        /**
         * Some trickery here based on this StackOverflow post:
         * http://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
         *
         * Try to make a new Date object.
         * If that fails, break it apart - This might be caused by some issues with the typical ISO
         * timestamp style in certain browsers' implementations. From breaking it apart, build a
         * new Date object directly.
         */
        var d = new Date(time);
        if (Object.prototype.toString.call(d) !== '[object Date]' || isNaN(d.getTime())) {
            var t = time.split(/[^0-9]/);
            // if t[0] is 0 or empty string, then just bail now and return null. This means that the
            // given timestamp was not valid.
            if (!t[0]) {
                return null;
            }
            while (t.length < 7) {
                t.push(0);
            }
            d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5], t[6]);
            // Test the new Date object
            if (Object.prototype.toString.call(d) === '[object Date]') {
                // This would mean its got the 'Invalid Date' status.
                if (isNaN(d.getTime())) {
                    return null;
                }
                else {
                    d.setFullYear(t[0]);
                    return d;
                }
            }
            return null;
        }
        else {
            return d;
        }
    }

    /**
     * @method reformatISOTimeString
     * Parses the user_and_job_state timestamp and returns it as a user-
     * readable string in the UTC time.
     *
     * This assumes that the timestamp string is in the following format:
     *
     * YYYY-MM-DDThh:mm:ssZ, where Z is the difference
     * in time to UTC in the format +/-HHMM, eg:
     *   2012-12-17T23:24:06-0500 (EST time)
     *   2013-04-03T08:56:32+0000 (UTC time)
     *
     * If the string is not in that format, this method returns the unchanged
     * timestamp.
     *
     * @param {String} timestamp - the timestamp string returned by the service
     * @returns {String} a parsed timestamp in the format "YYYY-MM-DD HH:MM:SS" in the browser's local time.
     * @private
     */
    function reformatISOTimeString (timestamp) {
        var dateObj = parseDate(timestamp);
        if (dateObj === null) {
            return timestamp;
        }
        return reformatDate(dateObj);
    }

    /**
     * @method reformatDate
     * Reformats a date from a JavaScript Date object to the following format:
     *
     * YYYY-MM-DD HH:MM:SS
     * e.g.
     * 2016-01-05 13:26:02
     *
     * Adds leading zeros to each field if necessary.
     *
     * If it is not a dateObj, this just returns the input, unchanged.
     *
     * @param {Object} dateObj - the JavaScript Date object to format.
     * @returns {String} a parsed timestamp as above in the browser's local time.
     * @private
     */
    function reformatDate (dateObj) {
        if (Object.prototype.toString.call(dateObj) !== '[object Date]') {
            return dateObj;
        }
        var addLeadingZero = function (value) {
            value = String(value);
            if (value.length === 1) {
                return '0' + value;
            }
            return value;
        };

        return dateObj.getFullYear() + '-' +
               addLeadingZero(dateObj.getMonth() + 1) + '-' +
               addLeadingZero(dateObj.getDate()) + ' ' +
               addLeadingZero(dateObj.getHours()) + ':' +
               addLeadingZero(dateObj.getMinutes()) + ':' +
               addLeadingZero(dateObj.getSeconds());
    }

    /**
     * @method calcTimeFromNow
     * From two timestamps (i.e. Date.parse() parseable), calculate the
     * time difference and return it as a human readable string.
     *
     * @param {String} time - the timestamp to calculate a difference from
     * @returns {String} - a string representing the time difference between the two parameter strings
     */
    function calcTimeFromNow (timestamp, dateObj) {
        var now = new Date();
        var time = null;

        if (timestamp) {
            time = parseDate(timestamp);
        }
        else if (dateObj) {
            time = dateObj;
        }
        if (time === null) {
            return 'Unknown time';
        }

        // so now, 'time' and 'now' are both Date() objects
        var timediff = calcTimeDifference(now, time);

        if (time > now) {
            timediff += ' from now';
        }
        else {
            timediff += ' ago';
        }

        return timediff;
    }

    /**
     * @method calcTimeDifference
     * Turns the difference between two Date objects
     * into something human readable, e.g. "1.5 hrs"
     *
     * essentially does |d2-d1|, and makes it legible.
     *
     * @return {string} Time difference.
     */
    function calcTimeDifference (d1, d2) {
        // start with seconds
        var timeDiff = Math.abs((d2 - d1) / 1000 );

        var unit = ' sec';

        // if > 60 seconds, go to minutes.
        if (timeDiff >= 60) {
            timeDiff /= 60;
            unit = ' min';

            // if > 60 minutes, go to hours.
            if (timeDiff >= 60) {
                timeDiff /= 60;
                unit = ' hrs';

                // if > 24 hours, go to days
                if (timeDiff >= 24) {
                    timeDiff /= 24;
                    unit = ' days';
                }

                // now we're in days. if > 364.25, go to years)
                if (timeDiff >= 364.25) {
                    timeDiff /= 364.25;
                    unit = ' yrs';

                    // now we're in years. just for fun, if we're over a century, do that too.
                    if (timeDiff >= 100) {
                        timeDiff /= 100;
                        unit = ' centuries';

                        // ok, fine, i'll do millennia, too.
                        if (timeDiff >= 10) {
                            timeDiff /= 10;
                            unit = ' millennia';
                        }
                    }
                }
            }
        }

        return timeDiff.toFixed(1) + unit;
    }

    /**
     * Ported out from data list widget... needs updating.
     * edited from: http://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
     */
    function getTimeStampStr (objInfoTimeStamp, alwaysExact) {
        var date = new Date(objInfoTimeStamp);
        var seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 0) {
            seconds = 0;
        }

        var exactDate = function(date) {
            return monthLookup[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
        };

        // f-ing safari, need to add extra ':' delimiter to parse the timestamp
        if (isNaN(seconds)) {
            var tokens = objInfoTimeStamp.split('+');  // this is just the date without the GMT offset
            var newTimestamp = tokens[0] + '+' + tokens[1].substr(0, 2) + ':' + tokens[1].substr(2, 2);
            date = new Date(newTimestamp);
            seconds = Math.floor((new Date() - date) / 1000);
            if (isNaN(seconds)) {
                // just in case that didn't work either, then parse without the timezone offset, but
                // then just show the day and forget the fancy stuff...
                return exactDate(new Date(tokens[0]));
            }
        }

        var pluralizeTimeStr = function(num, timeSpan) {
            var suffix = '';
            if (num > 1 || num === 0) {
                suffix = 's';
            }
            return num + ' ' + timeSpan + suffix + ' ago';
        };

        if (alwaysExact) {
            return exactDate(date);
        }

        var interval = Math.floor(seconds / 31536000);
        if (interval > 1) {
            return exactDate(date);
        }
        interval = Math.floor(seconds / 2592000);
        if (interval > 1) {
            if (interval < 4) {
                return pluralizeTimeStr(interval, 'month');
            } else {
                return exactDate(date);
            }
        }
        interval = Math.floor(seconds / 86400);
        if (interval > 1) {
            return pluralizeTimeStr(interval, 'day');
        }
        interval = Math.floor(seconds / 3600);
        if (interval > 1) {
            return pluralizeTimeStr(interval, 'hour');
        }
        interval = Math.floor(seconds / 60);
        if (interval > 1) {
            return pluralizeTimeStr(interval, 'minute');
        }
        return pluralizeTimeStr(Math.floor(seconds), 'second');
    }

    /**
     * @private
     * @method
     * Checks if the timestamp looks like it should be ISO 8601 format.
     * If so, it "cleans" it up to make sure (if it has a trailing +0000, it converts it
     * to a trailing +00:00, for example)
     */
    function cleanupISOFormat (timestamp) {
        // check if ISO.

    };

    /**
     * Converts a timestamp to a simple string.
     * Do this American style - HH:MM:SS MM/DD/YYYY
     *
     * @param {string} timestamp - a timestamp in number of milliseconds since the epoch, or any
     * ISO8601 format that new Date() can deal with.
     * @return {string} a human readable timestamp
     */
    function readableTimestamp (timestamp) {
        var format = function (x) {
            if (x < 10)
                x = '0' + x;
            return x;
        };

        var d = parseDate(timestamp);
        var hours = format(d.getHours());
        var minutes = format(d.getMinutes());
        var seconds = format(d.getSeconds());
        var month = d.getMonth() + 1;
        var day = format(d.getDate());
        var year = d.getFullYear();

        return hours + ':' + minutes + ':' + seconds + ', ' + month + '/' + day + '/' + year;
    }


    return {
        parseDate: parseDate,
        prettyTimestamp: prettyTimestamp,
        calcTimeFromNow: calcTimeFromNow,
        calcTimeDifference: calcTimeDifference,
        reformatDate: reformatDate,
        reformatISOTimeString: reformatISOTimeString,
        getTimeStampStr: getTimeStampStr,
        readableTimestamp: readableTimestamp
    };
});
