/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define(['Util/String'], function(StringUtil) {
    'use strict';
    
    describe('KBase String Utility function module', function() {
        it('uuid() should create a uuid', function() {
            var uuid = StringUtil.uuid();
            expect(uuid.length).toBe(36);
        });

        it('uuid() should create a unique uuid', function() {
            var uuid1 = StringUtil.uuid();
            var uuid2 = StringUtil.uuid();
            expect(uuid1).not.toBe(uuid2);
        });

        it('safeJSONStringify should stringify a normal object', function() {
            var plainObj = {
                a: 1,
                b: 'a string'
            };

            var jsonified = StringUtil.safeJSONStringify(plainObj);
            // by the JSON spec, we can't count on the order - 
            // so look for keys individually
            expect(jsonified).toContain('"a":1');
            expect(jsonified).toContain('"b":"a string"');
        });

        it('safeJSONStringify should HTML-escape quotes', function() {
            var quoteObj = {
                a: 1,
                b: 'a "string"',
                c: "another 'string'"
            };

            var jsonified = StringUtil.safeJSONStringify(quoteObj);
            expect(jsonified).toContain('"a":1');
            expect(jsonified).toContain('"b":"a &quot;string&quot;"');
            expect(jsonified).toContain('"c":"another &apos;string&apos;"');
        });
    });
});