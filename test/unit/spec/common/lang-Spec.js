define(['common/lang'], (Utils) => {
    'use strict';

    describe('Lang Util functions', () => {
        it('should have expected functions', () => {
            ['copy', 'isEqual', 'pRequire'].forEach((fn) => {
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

        describe('the isEqual function', () => {
            const testCases = [
                'a',
                1,
                [],
                {},
                [1, 2, 3],
                { a: 1 },
                { a: { b: { c: ['d', 'e', 'f'] } } },
                undefined,
                true,
                false,
                null,
            ];
            const complicatedObj = {
                b: null,
                c: 1,
                d: 'a',
                e: ['a', 'b', 'c'],
                f: {
                    g: null,
                    i: {
                        j: 'yes!',
                        k: ['x', 'y', 'z'],
                        l: true,
                    },
                },
            };
            it('should return equal when doing an identity comparison', () => {
                testCases.forEach((testCase) => {
                    expect(Utils.isEqual(testCase, testCase)).toBeTrue();
                });
            });

            it('should return equal for simple copies of objects', () => {
                testCases.forEach((testCase) => {
                    const copied = Utils.copy(testCase);
                    expect(Utils.isEqual(testCase, copied)).toBeTrue();
                });
            });

            it('should return equal for complex structures', () => {
                const copied = Utils.copy(complicatedObj);
                expect(Utils.isEqual(complicatedObj, copied)).toBeTrue();
            });

            it('should return unequal when things are different', () => {
                testCases.forEach((testCase) => {
                    expect(Utils.isEqual(testCase, 1000)).toBeFalse();
                    expect(Utils.isEqual(1000, testCase)).toBeFalse(); // reverse should also be false
                });
            });

            it('should return unequal with a deep nested difference', () => {
                const obj = Utils.copy(complicatedObj);
                obj.f.i.l = false;
                expect(Utils.isEqual(complicatedObj, obj)).toBeFalse();
            });

            const testArray = ['a', 'b', 'c'];
            const arrayCases = [['a', 'b'], [], ['a', 'b', 'd'], ['a', 'b', 'c', undefined]];
            it('should properly compare arrays', () => {
                arrayCases.forEach((arrayCase) => {
                    expect(Utils.isEqual(testArray, arrayCase)).toBeFalse();
                });
            });

            it('should compare nulls with objects to be false', () => {
                expect(Utils.isEqual(null, { a: 1 })).toBeFalse();
                expect(Utils.isEqual({ a: 1 }, null)).toBeFalse();
            });

            it('should similar, non-identical objects to be false', () => {
                const mainObj = { a: 1, b: 2 };
                const testCases = [{ a: 1 }, { b: 2 }, { a: 1, b: 2, c: 3 }, { a: 1, b: 3 }];
                testCases.forEach((testCase) => {
                    expect(Utils.isEqual(mainObj, testCase)).toBeFalse();
                    expect(Utils.isEqual(testCase, mainObj)).toBeFalse();
                });
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
    });
});
