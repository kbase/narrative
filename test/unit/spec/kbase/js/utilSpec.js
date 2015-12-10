/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define(['Util'], function(Util) {
    'use strict';
    describe('KBase Utility function module', function() {
        it('uuid() should create a uuid', function() {
            var uuid = Util.uuid();
            expect(uuid.length).toBe(36);
        });

        it('uuid() should create a unique uuid', function() {
            var uuid1 = Util.uuid();
            var uuid2 = Util.uuid();
            expect(uuid1).not.toBe(uuid2);
        });

        it('parseDate should properly parse an ISO date string', function() {
            var d = Util.parseDate('2015-12-09T21:58:22.202Z');
            expect(d).toEqual(jasmine.any(Object));
            expect(d.toDateString()).toBe('Wed Dec 09 2015');
        });


    });
});