/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define(['Util/TimeFormat'], function(Util) {
    'use strict';
    describe('KBase Utility function module', function() {
        it('parseDate should properly parse an ISO date string', function() {
            var d = Util.parseDate('2015-12-09T21:58:22.202Z');
            expect(d).toEqual(jasmine.any(Object));
            expect(d.toDateString()).toBe('Wed Dec 09 2015');
        });
    });
});