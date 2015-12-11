/*global define*/
/*jslint white: true*/
/**
 * A few utility functions. These are kinda unrelated, but used in several places.
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
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);});
    }

    /**
     * @method makePrettyTimestamp
     * Makes a div containing the 'started time' in units of time ago, with a Bootstrap 3 tooltip
     * that gives the exact time.
     *
     * Note that this tooltip needs to be activated with the $().tooltip() method before it'll function.
     *
     * @param timestamp the timestamp to calculate this div around. Should be in a Date.parse() parseable format.
     * @param suffix an optional suffix for the time element. e.g. "ago" or "from now".
     * @return a div element with the timestamp calculated to be in terms of how long ago, with a tooltip containing the exact time.
     * @private
     */
    function prettyTimestamp (timestamp, suffix) {
        var d = parseDate(timestamp);

        var parsedTime = reformatDate(d);
        var timediff = calcTimeDiffRelative(d);
        var timeMillis = d ? d.getTime() : "";

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
        var d = new Date(time);
        // if that doesn't work, then split it apart.
        if (Object.prototype.toString.call(d) !== '[object Date]') {
            var t = time.split(/[^0-9]/);
            while (t.length < 7) {
                t.append(0);
            }
            d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5], t[6]);
            if (Object.prototype.toString.call(d) === '[object Date]') {
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
     * @method parseTimestamp
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
    function reformatISOTimestamp (timestamp) {
        var dateObj = parseDate(timestamp);
        if (dateObj === null)
            return timestamp;
        return reformatDate(dateObj);
    }

    function reformatDate (dateObj) {
        var addLeadingZero = function (value) {
            value = String(value);
            if (value.length === 1)
                return '0' + value;
            return value;
        }

        return dateObj.getFullYear() + '-' + 
               addLeadingZero((dateObj.getMonth() + 1)) + '-' + 
               addLeadingZero(dateObj.getDate()) + ' ' + 
               addLeadingZero(dateObj.getHours()) + ':' + 
               addLeadingZero(dateObj.getMinutes()) + ':' + 
               addLeadingZero(dateObj.getSeconds());

    }

    /**
     * @method calcTimeDifference
     * From two timestamps (i.e. Date.parse() parseable), calculate the
     * time difference and return it as a human readable string.
     *
     * @param {String} time - the timestamp to calculate a difference from
     * @returns {String} - a string representing the time difference between the two parameter strings
     */
    function calcTimeDiffRelative (timestamp, dateObj) {
        var now = new Date();
        var time = null;

        if (timestamp)
            time = parseDate(timestamp);
        else if(dateObj)
            time = dateObj;

        if (time === null)
            return 'Unknown time';

        // so now, 'time' and 'now' are both Date() objects
        var timediff = calcTimeDiffReadable(now, time);

        if (time > now)
            timediff += ' from now';
        else
            timediff += ' ago';

        return timediff;
    }

    /**
     * @method calcTimeDifference
     * Turns the difference between two Date objects
     * into something human readable, e.g. "-1.5 hrs"
     *
     * essentially does d2-d1, and makes it legible.
     * 
     * @return {string} Time difference.
     */
    function calcTimeDiffReadable (d1, d2) {
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

    function calcTimeDifference () {

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
        parseDate: parseDate,
        prettyTimestamp: prettyTimestamp,
        safeJSONStringify: safeJSONStringify,
        calcTimeDifference: calcTimeDifference,
        reformatDate: reformatDate
    };
});