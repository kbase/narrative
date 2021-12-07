define(['util/util'], (Utils) => {
    'use strict';

    describe('Basic Util functions', () => {
        it('should have expected functions', () => {
            ['copy', 'pRequire', 'toInteger'].forEach((fn) => {
                expect(Utils[fn]).toEqual(jasmine.any(Function));
            });
        });

        describe('the copy function', () => {
            it('should copy a series of objects and such', () => {
                const testCases = [
                    'a',
                    1,
                    [],
                    {},
                    [1, 2, 3],
                    { a: 1 },
                    { a: { b: { c: ['d', 'e', 'f'] } } },
                    undefined,
                ];
                testCases.forEach((testCase) => {
                    expect(Utils.copy(testCase)).toEqual(testCase);
                });
            });

            it('altering a copied object should not change the original', () => {
                const obj = {
                    foo: {
                        bar: 'baz',
                    },
                };

                const copied = Utils.copy(obj);
                expect(copied).toEqual(obj);
                copied.foo.bar = 'wat';
                expect(copied).not.toEqual(obj);
                expect(obj.foo.bar).toEqual('baz');
            });
        });

        describe('the pRequire function', () => {
            const modules = ['common/html', 'util/string'];
            it('should load a module in a Promise', async () => {
                const module = [modules[0]]; // simple with few dependencies of its own and no side effects
                const [html] = await Utils.pRequire(module);
                expect(html).toBeDefined();
                expect(html.tag).toEqual(jasmine.any(Function));
            });

            it('should load multiple modules in a single pRequire call', async () => {
                const [html, StringUtil] = await Utils.pRequire(modules);
                expect(html.tag).toEqual(jasmine.any(Function));
                expect(StringUtil.capitalize).toEqual(jasmine.any(Function));
            });

            it('should load modules and use the Bluebird .spread function to resolve', () => {
                return Utils.pRequire(modules).spread((html, StringUtil) => {
                    expect(html.tag).toEqual(jasmine.any(Function));
                    expect(StringUtil.capitalize).toEqual(jasmine.any(Function));
                });
            });

            it('should load module and unpack them into an array', () => {
                return Utils.pRequire([modules[0]]).then(([html]) => {
                    expect(html.tag).toEqual(jasmine.any(Function));
                });
            });

            it('should fail to load a non-existent module', async () => {
                const module = 'not_a_real_module';
                await expectAsync(Utils.pRequire([module])).toBeRejected();
            });
        });

        describe('the toInteger function', () => {
            [
                undefined,
                null,
                {},
                { a: 1 },
                [],
                () => {
                    /* no op */
                },
            ].forEach((input) => {
                it(`should not convert "${input}" to an integer`, () => {
                    expect(() => Utils.toInteger(input)).toThrowError(
                        /cannot be converted to integer/
                    );
                });
            });

            it('should convert number strings', () => {
                const okCases = {
                    '-1': -1,
                    '+1': 1,
                    1: 1,
                    100000000: 100000000,
                    0: 0,
                };
                Object.keys(okCases).forEach((testCase) => {
                    expect(Utils.toInteger(testCase)).toEqual(okCases[testCase]);
                });
            });

            it('should fail to convert non-integer numbers', () => {
                const badCases = [1.1, -1.01, 10.00000001];
                badCases.forEach((bad) => {
                    expect(() => Utils.toInteger(bad)).toThrowError(
                        'Integer is a non-integer number'
                    );
                });
            });

            it('should fail to convert non-integer strings', () => {
                const badCases = ['-1.1', '0.00000001', '1.1', 'foo', '1 '];
                badCases.forEach((bad) => {
                    expect(() => Utils.toInteger(bad)).toThrowError('Invalid integer format');
                });
            });
        });

        describe('the objectToString method', () => {
            const tests = [
                ['Null', null],
                ['Undefined', undefined],
                ['Number', 123456],
                ['Number', 1.23456],
                ['String', 'string'],
                ['String', ''],
                ['Array', [1, 2, 3]],
                ['Object', { this: 'that' }],
                [
                    'Function',
                    () => {
                        /* no op */
                    },
                ],
                ['Object', Utils],
                ['Date', new Date()],
                ['Set', new Set()],
            ];

            tests.forEach((test) => {
                const [type, sample] = test;
                it(`identifies ${sample} as type ${type}`, () => {
                    expect(Utils.objectToString(sample)).toEqual(type);
                });
            });
        });
    });
});
