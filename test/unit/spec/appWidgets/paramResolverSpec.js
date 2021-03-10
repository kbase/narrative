define(['widgets/appWidgets2/paramResolver'], (ParamResolver) => {
    'use strict';

    describe('The ParamResolver module', () => {
        it('Should load the module code successfully', () => {
            expect(ParamResolver).toBeDefined();
        });

        it('Should have the factory method', () => {
            expect(ParamResolver.make).toBeDefined();
            expect(ParamResolver.make).toEqual(jasmine.any(Function));
        });

        it('Should be created', () => {
            const paramResolverInstance = ParamResolver.make();
            ['loadInputControl', 'loadViewControl'].forEach((fn) => {
                expect(paramResolverInstance[fn]).toEqual(jasmine.any(Function));
            });
        });
    });

    describe('The paramResolver instance', () => {
        beforeEach(function () {
            this.paramResolverInstance = ParamResolver.make();
        });

        const testList = [
            {
                spec: { data: { type: 'string' }, ui: { control: 'textarea' } },
                moduleName: 'textarea',
            },
            {
                spec: { data: { type: 'string' }, ui: { control: 'custom_textsubdata' } },
                moduleName: 'customSubdata',
            },
            {
                spec: { data: { type: 'int' }, ui: { control: 'checkbox' } },
                moduleName: 'checkbox',
            },
            {
                spec: { data: { type: 'boolean' }, ui: { control: 'none' } },
                moduleName: 'toggleButton',
            },
            {
                spec: { data: { type: 'int' }, ui: { control: 'whatever' } },
                moduleName: 'int',
            },
            {
                spec: { data: { type: 'struct' }, ui: { control: 'whatever' } },
                moduleName: 'struct',
            },
            {
                spec: { data: { type: 'sequence' }, ui: { control: 'whatever' } },
                moduleName: 'sequence',
            },
            {
                spec: { data: { type: 'customSubdata' }, ui: { control: 'whatever' } },
                moduleName: 'customSubdata',
            },
            {
                spec: {
                    data: { type: 'workspaceObjectRef' },
                    ui: { class: 'parameter', control: 'whatever' },
                },
                moduleName: 'select2Object',
            },
            {
                spec: {
                    data: { type: 'workspaceObjectRef' },
                    ui: { class: 'foo', control: 'bar' },
                },
                moduleName: 'undefined',
            },
            {
                spec: {
                    data: { type: 'workspaceObjectName' },
                    ui: { class: 'parameter', control: 'whatever' },
                },
                moduleName: 'newObject',
            },
            {
                spec: {
                    data: { type: 'workspaceObjectName' },
                    ui: { class: 'foo', control: 'bar' },
                },
                moduleName: 'undefined',
            },
        ];

        testList.forEach((test) => {
            describe('with spec input ' + JSON.stringify(test.spec), () => {
                ['Input', 'View'].forEach((type) => {
                    it('should return a module', async function () {
                        const module = await this.paramResolverInstance[`load${type}Control`](
                            test.spec
                        );
                        expect(module).toEqual(jasmine.any(Object));
                        expect(module.make).toBeDefined();
                        expect(module.make).toEqual(jasmine.any(Function));
                    });

                    it('should return the right module', async function () {
                        const moduleData = await this.paramResolverInstance.getControlData(
                            test.spec,
                            type
                        );
                        expect(moduleData.moduleName).toEqual(`${test.moduleName}${type}`);
                    });
                });
            });
        });
        const invalidInput = [
            null,
            undefined,
            'string',
            {},
            { data: {} },
            { data: null, ui: null },
        ];
        invalidInput.forEach((input) => {
            ['Input', 'View'].forEach((type) => {
                it(`should throw an error with invalid input ${JSON.stringify(
                    input
                )}`, async function () {
                    try {
                        await this.paramResolverInstance[`load${type}Control`](input);
                        fail(`load${type}Control should not have passed`);
                    } catch (err) {
                        expect(err).toMatch(/Could not determine control modules for this spec/);
                    }
                    try {
                        await this.paramResolverInstance.getControlData(input, type);
                        fail(`getControlData with type ${type} should not have passed`);
                    } catch (err) {
                        expect(err).toMatch(/Could not determine control modules for this spec/);
                    }
                });
            });
        });
    });
});
