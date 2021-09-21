define(['common/lang'], (Utils) => {
    'use strict';

    describe('Lang Util functions', () => {
        it('should have expected functions', () => {
            ['copy', 'pRequire'].forEach((fn) => {
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
    });
});
