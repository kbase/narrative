define(['util/string'], (StringUtil) => {
    'use strict';

    describe('KBase String Utility function module', () => {
        it('uuid() should create a uuid', () => {
            const uuid = StringUtil.uuid();
            expect(uuid.length).toBe(36);
        });

        it('uuid() should create a unique uuid', () => {
            const uuid1 = StringUtil.uuid();
            const uuid2 = StringUtil.uuid();
            expect(uuid1).not.toBe(uuid2);
        });

        it('safeJSONStringify should stringify a normal object', () => {
            const plainObj = {
                a: 1,
                b: 'a string',
            };

            const jsonified = StringUtil.safeJSONStringify(plainObj);
            // by the JSON spec, we can't count on the order -
            // so look for keys individually
            expect(jsonified).toContain('"a":1');
            expect(jsonified).toContain('"b":"a string"');
        });

        it('safeJSONStringify should HTML-escape quotes', () => {
            const quoteObj = {
                a: 1,
                b: 'a "string"',
                // eslint-disable-next-line quotes
                c: "another 'string'",
            };

            const jsonified = StringUtil.safeJSONStringify(quoteObj);
            expect(jsonified).toContain('"a":1');
            expect(jsonified).toContain('"b":"a &quot;string&quot;"');
            expect(jsonified).toContain('"c":"another &apos;string&apos;"');
        });

        it('readableBytes should return reasonable values', () => {
            expect(StringUtil.readableBytes(1000)).toBe('1000 B');
            expect(StringUtil.readableBytes(0)).toBe('0 B');
            expect(StringUtil.readableBytes(10000)).toBe('9.77 KB');
            expect(StringUtil.readableBytes(100000)).toBe('97.66 KB');
            expect(StringUtil.readableBytes(1024)).toBe('1 KB');
            expect(StringUtil.readableBytes(9999999999999999999999999)).toBe('8.27 YB');
            expect(StringUtil.readableBytes(99999999999999999999999999999)).toBe('82718.06 YB');
        });

        it('pretty print JSON should do exactly that', () => {
            const obj = {
                a: 1,
                b: true,
                c: [1, 2, 3],
                d: {
                    e: 'foo',
                    f: null,
                },
            };
            const result =
                '{\n' +
                '  <span class="key">"a":</span> <span class="number">1</span>,\n' +
                '  <span class="key">"b":</span> <span class="boolean">true</span>,\n' +
                '  <span class="key">"c":</span> [\n' +
                '    <span class="number">1</span>,\n' +
                '    <span class="number">2</span>,\n' +
                '    <span class="number">3</span>\n' +
                '  ],\n' +
                '  <span class="key">"d":</span> {\n' +
                '    <span class="key">"e":</span> <span class="string">"foo"</span>,\n' +
                '    <span class="key">"f":</span> <span class="null">null</span>\n' +
                '  }\n' +
                '}';
            expect(StringUtil.prettyPrintJSON(obj)).toBe(result);
        });

        it('escape should turn nasty HTML into printable HTML', () => {
            const tests = [
                ['foo', 'foo'],
                ['<script>', '&lt;script&gt;'],
                ['&<>"\'', '&amp;&lt;&gt;&quot;&#39;'],
                ['some string', 'some string'],
            ];
            tests.forEach((t) => {
                expect(StringUtil.escape(t[0])).toEqual(t[1]);
            });
        });

        it('escape should do nothing if passed a falsy str', () => {
            const tests = [
                ['', ''],
                [false, false],
                [undefined, undefined],
                [null, null],
            ];
            tests.forEach((t) => {
                expect(StringUtil.escape(t[0])).toEqual(t[1]);
            });
        });
    });
});
