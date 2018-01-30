/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'util/string'
], function(
    StringUtil
) {
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

        it('readableBytes should return reasonable values', function() {
            expect(StringUtil.readableBytes(1000)).toBe('1000 B');
            expect(StringUtil.readableBytes(0)).toBe('0 B');
            expect(StringUtil.readableBytes(10000)).toBe('9.77 KB');
            expect(StringUtil.readableBytes(100000)).toBe('97.66 KB');
            expect(StringUtil.readableBytes(1024)).toBe('1 KB');
            expect(StringUtil.readableBytes(9999999999999999999999999)).toBe('8.27 YB');
            expect(StringUtil.readableBytes(99999999999999999999999999999)).toBe('82718.06 YB');
        });
    });
});
