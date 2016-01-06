/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define(['jquery', 'Util/TimeFormat'], function($, TF) {
    'use strict';
    var testISOTime = '2015-12-09T21:58:22.202Z';
    var testISOTime2 = '2016-01-06T00:48:43.196Z';
    var testOutputString = 'Wed Dec 09 2015';
    var reformattedString = '2015-12-09 13:58:22';

    describe('KBase Time Formatting Utility function module', function() {
        it('parseDate should properly parse an ISO date string', function() {
            var d = TF.parseDate(testISOTime);
            expect(d).toEqual(jasmine.any(Object));
            expect(d.toDateString()).toBe(testOutputString);
        });

        it('parseDate should properly return null with a bad date', function() {
            expect(TF.parseDate('not an iso string!')).toBeNull();
        });

        it('prettyTimestamp should create a span from a good timestamp', function() {
            var tsDiv = TF.prettyTimestamp(testISOTime);
            tsDiv = $(tsDiv);
            expect(tsDiv.is('span')).toBe(true);
            expect(tsDiv.attr('title')).toBe(reformattedString);
        });

        it('prettyTimestamp should throw an error with a bad timestamp', function() {
            try {
                TF.prettyTimestamp('bad time');
            }
            catch (error) {
                expect(error).not.toBeNull();
            }
        });

        it('reformatISOTimeString should work with a good ISO string', function() {
            var newTimeStr = TF.reformatISOTimeString(testISOTime);
            expect(newTimeStr).toBe(reformattedString);
        });

        it('reformatISOTimeString should not reformat a bad timestamp', function() {
            var testStr = 'bad time';
            var newTimeStr = TF.reformatISOTimeString(testStr);
            expect(newTimeStr).toBe(testStr);
        });

        it('reformatDate should reformat a date object into a good string', function() {
            var d = new Date(testISOTime);
            expect(TF.reformatDate(d)).toBe(reformattedString);
        });

        it('reformatDate should return the same input with a bad date', function() {
            expect(TF.reformatDate('blah!')).toBe('blah!');
        });

        it('calcTimeFromNow should have no change when done immediately', function() {
            var curTime = new Date();
            var curISO = curTime.toISOString();

            var timeDiff = TF.calcTimeFromNow(curISO);
            expect(timeDiff).toBe('0.0 sec ago');
        });

        it('calcTimeDifference should get the diff between two times', function() {
            var time1 = new Date(testISOTime);
            var time2 = new Date(testISOTime2);

            var diff = TF.calcTimeDifference(time1, time2);
            expect(diff).toBe('27.1 days');
        });

        it('calcTimeDifference should be the same in both directions', function() {
            var time1 = new Date(testISOTime);
            var time2 = new Date(testISOTime2);

            var diff = TF.calcTimeDifference(time1, time2);
            expect(diff).toBe(TF.calcTimeDifference(time2, time1));
        });
    });
});