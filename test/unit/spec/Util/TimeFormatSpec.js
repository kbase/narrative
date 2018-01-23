/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'bootstrap',
    'jquery',
    'util/timeFormat',
    'testUtil'
], function(
	bootstrap,
	$,
	TF,
    TestUtil
) {
    'use strict';
    var testISOTime = '2015-12-09T21:58:22.202Z';
    var testISOTime2 = '2016-01-06T00:48:43.196Z';
    var testOutputString = 'Wed Dec 09 2015';
    var reformattedString = '2015-12-09 13:58:22';
    var testExactDayStr = 'Dec 9, 2015';

    describe('KBase Time Formatting Utility function module', function() {
        it('getTimeStampStr should properly output an exact time string', function() {
            var d = TF.getTimeStampStr(testISOTime, true);
            expect(d).toBe(testExactDayStr);
        });

        it('getTimeStampStr should return a fuzzy relative time string', function() {
            var prevDay = new Date();
            prevDay.setDate(prevDay.getDate()-2);
            var d = TF.getTimeStampStr(prevDay, false);
            expect(d).toBe('2 days ago');
        });

        it('getTimeStampStr should return a fuzzy relative time string @ 2 days 2 hours', function() {
            var prevDay = new Date();
            prevDay.setDate(prevDay.getDate()-2);
            prevDay.setHours(prevDay.getHours()-2);
            var d = TF.getTimeStampStr(prevDay, false);
            expect(d).toBe('2 days ago');
        });

        it('getTimeStampStr should return a fuzzy relative time string @ 1 day', function() {
            var prevDay = new Date();
            prevDay.setDate(prevDay.getDate()-1);
            var d = TF.getTimeStampStr(prevDay, false);
            expect(d).toBe('1 day ago');
        });

        it('getTimeStampStr should return a fuzzy relative time string @ 1 hour', function() {
            var prevDay = new Date();
            prevDay.setHours(prevDay.getHours()-1);
            var d = TF.getTimeStampStr(prevDay, false);
            expect(d).toBe('1 hour ago');
        });

        it('getTimeStampStr should return a fuzzy relative time string @ 1 minute', function() {
            var prevDay = new Date();
            prevDay.setMinutes(prevDay.getMinutes()-1);
            var d = TF.getTimeStampStr(prevDay, false);
            expect(d).toBe('1 minute ago');
        });

        it('getShortTimeStampStr should properly output an exact time string', function() {
            var d = TF.getShortTimeStampStr(testISOTime, true);
            expect(d).toBe(testExactDayStr);
        });

        it('getShortTimeStampStr should return a fuzzy relative time string [ 2 mons ]', function() {
            var prevDay = new Date();
            prevDay.setMonth(prevDay.getMonth()-2);
            var d = TF.getShortTimeStampStr(prevDay, false);
            expect(d).toBe('2 mons');
        });

        it('getShortTimeStampStr should return a fuzzy relative time string [ 1 hr ]', function() {
            var prevDay = new Date();
            prevDay.setHours(prevDay.getHours()-1);
            var d = TF.getShortTimeStampStr(prevDay, false);
            expect(d).toBe('1 hr');
        });

        it('getShortTimeStampStr should return a fuzzy relative time string [ 3 mins ]', function() {
            var prevDay = new Date();
            prevDay.setSeconds(prevDay.getSeconds()-5);
            var d = TF.getShortTimeStampStr(prevDay, false);
            expect(d).toBe('5 secs');
        });

        it('getShortTimeStampStr should return a fuzzy relative time string [ 5 secs ]', function() {
            var prevDay = new Date();
            prevDay.setMinutes(prevDay.getMinutes()-3);
            var d = TF.getShortTimeStampStr(prevDay, false);
            expect(d).toBe('3 mins');
        });


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

            var title = tsDiv.attr('title');
            expect(new Date(title).toUTCString()).toBe(new Date(reformattedString).toUTCString());
            // expect(tsDiv.attr('title')).toBe(reformattedString);
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
            expect(new Date(newTimeStr).toUTCString())
                  .toBe(new Date(reformattedString).toUTCString());
        });

        it('reformatISOTimeString should not reformat a bad timestamp', function() {
            var testStr = 'bad time';
            var newTimeStr = TF.reformatISOTimeString(testStr);
            expect(newTimeStr).toBe(testStr);
        });

        it('reformatDate should reformat a date object into a good string', function() {
            var d = new Date(testISOTime);
            var retDate = TF.reformatDate(d);
            expect(new Date(retDate).toUTCString()).toBe(new Date(reformattedString).toUTCString());
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
