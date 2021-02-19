define(['bootstrap', 'jquery', 'util/timeFormat'], (bootstrap, $, TF) => {
    'use strict';
    const testISOTime = '2015-12-09T21:58:22.202Z';
    const testISOTime2 = '2016-01-06T00:48:43.196Z';
    const testOutputString = 'Wed Dec 09 2015';
    const testExactDayStr = 'Dec 9, 2015';

    describe('KBase Time Formatting Utility function module', () => {
        it('getTimeStampStr should properly output an exact time string', () => {
            const d = TF.getTimeStampStr(testISOTime, true);
            expect(d).toBe(testExactDayStr);
        });

        it('getTimeStampStr should return a fuzzy relative time string', () => {
            const prevDay = new Date();
            prevDay.setDate(prevDay.getDate() - 2);
            const d = TF.getTimeStampStr(prevDay, false);
            expect(d).toBe('2 days ago');
        });

        it('getTimeStampStr should return a fuzzy relative time string @ 2 days 2 hours', () => {
            const prevDay = new Date();
            prevDay.setDate(prevDay.getDate() - 2);
            prevDay.setHours(prevDay.getHours() - 2);
            const d = TF.getTimeStampStr(prevDay, false);
            expect(d).toBe('2 days ago');
        });

        it('getTimeStampStr should return a fuzzy relative time string @ 1 day', () => {
            const prevDay = new Date();
            prevDay.setDate(prevDay.getDate() - 1);
            const d = TF.getTimeStampStr(prevDay, false);
            expect(d).toBe('1 day ago');
        });

        it('getTimeStampStr should return a fuzzy relative time string @ 1 hour', () => {
            const prevDay = new Date();
            prevDay.setHours(prevDay.getHours() - 1);
            const d = TF.getTimeStampStr(prevDay, false);
            expect(d).toBe('1 hour ago');
        });

        it('getTimeStampStr should return a fuzzy relative time string @ 1 minute', () => {
            const prevDay = new Date();
            prevDay.setMinutes(prevDay.getMinutes() - 1);
            const d = TF.getTimeStampStr(prevDay, false);
            expect(d).toBe('1 minute ago');
        });

        it('getShortTimeStampStr should properly output an exact time string', () => {
            const d = TF.getShortTimeStampStr(testISOTime, true);
            expect(d).toBe(testExactDayStr);
        });

        it('getShortTimeStampStr should return a fuzzy relative time string [ 2 mons ]', () => {
            const prevDay = new Date();
            prevDay.setDate(prevDay.getDate() - 5);
            prevDay.setMonth(prevDay.getMonth() - 2);
            const d = TF.getShortTimeStampStr(prevDay, false);
            expect(d).toBe('2 mons');
        });

        it('getShortTimeStampStr should return a fuzzy relative time string [ 1 hr ]', () => {
            const prevDay = new Date();
            prevDay.setHours(prevDay.getHours() - 1);
            const d = TF.getShortTimeStampStr(prevDay, false);
            expect(d).toBe('1 hr');
        });

        it('getShortTimeStampStr should return a fuzzy relative time string [ 3 mins ]', () => {
            const prevDay = new Date();
            prevDay.setSeconds(prevDay.getSeconds() - 5);
            const d = TF.getShortTimeStampStr(prevDay, false);
            expect(d).toBe('5 secs');
        });

        it('getShortTimeStampStr should return a fuzzy relative time string [ 5 secs ]', () => {
            const prevDay = new Date();
            prevDay.setMinutes(prevDay.getMinutes() - 3);
            const d = TF.getShortTimeStampStr(prevDay, false);
            expect(d).toBe('3 mins');
        });

        it('parseDate should properly parse an ISO date string', () => {
            const d = TF.parseDate(testISOTime);
            expect(d).toEqual(jasmine.any(Object));
            expect(d.toDateString()).toBe(testOutputString);
        });

        it('parseDate should properly return null with a bad date', () => {
            expect(TF.parseDate('not an iso string!')).toBeNull();
        });

        it('prettyTimestamp should create a span from a good timestamp', () => {
            let tsDiv = TF.prettyTimestamp(testISOTime);
            tsDiv = $(tsDiv);
            expect(tsDiv.is('span')).toBe(true);

            const title = tsDiv.attr('title');
            expect(new Date(title).toUTCString()).toBe(new Date(testISOTime).toUTCString());
        });

        it('prettyTimestamp should silently put up with an invalid timestamp', () => {
            const badButPrettyTimestamp = TF.prettyTimestamp('bad time');
            expect(badButPrettyTimestamp).toBeUndefined();
        });

        it('reformatISOTimeString should work with a good ISO string', () => {
            const newTimeStr = TF.reformatISOTimeString(testISOTime);
            expect(new Date(newTimeStr).toUTCString()).toBe(new Date(testISOTime).toUTCString());
        });

        it('reformatISOTimeString should not reformat a bad timestamp', () => {
            const testStr = 'bad time';
            const newTimeStr = TF.reformatISOTimeString(testStr);
            expect(newTimeStr).toBe(testStr);
        });

        it('reformatDate should reformat a date object into a good string', () => {
            const d = new Date(testISOTime);
            const retDate = TF.reformatDate(d);
            expect(new Date(retDate).toUTCString()).toBe(new Date(testISOTime).toUTCString());
        });

        it('reformatDate should return the same input with a bad date', () => {
            expect(TF.reformatDate('blah!')).toBe('blah!');
        });

        it('calcTimeFromNow should have no change when done immediately', () => {
            const curTime = new Date();
            const curISO = curTime.toISOString();

            const timeDiff = TF.calcTimeFromNow(curISO);
            expect(timeDiff).toBe('0.0 sec ago');
        });

        it('calcTimeDifference should get the diff between two times', () => {
            const time1 = new Date(testISOTime);
            const time2 = new Date(testISOTime2);

            const diff = TF.calcTimeDifference(time1, time2);
            expect(diff).toBe('27.1 days');
        });

        it('calcTimeDifference should be the same in both directions', () => {
            const time1 = new Date(testISOTime);
            const time2 = new Date(testISOTime2);

            const diff = TF.calcTimeDifference(time1, time2);
            expect(diff).toBe(TF.calcTimeDifference(time2, time1));
        });
    });
});
