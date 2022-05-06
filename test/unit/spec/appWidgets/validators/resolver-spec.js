define([
    'widgets/appWidgets2/validators/resolver',
    'widgets/appWidgets2/validators/sequence',
    'widgets/appWidgets2/validators/struct',
    'widgets/appWidgets2/validators/workspaceObjectName',
    'widgets/appWidgets2/validators/workspaceObjectRef',
    'widgets/appWidgets2/validation',
], (
    ValidationResolver,
    SequenceValidator,
    StructValidator,
    WSObjNameValidator,
    WSObjRefValidator,
    Validation
) => {
    'use strict';

    describe('The ValidationResolver', () => {
        describe('module', () => {
            it('is defined', () => {
                expect(ValidationResolver).toBeDefined();
            });
            it('has a validate function', () => {
                expect(ValidationResolver.validate).toEqual(jasmine.any(Function));
            });

            it('exports validation mappings', () => {
                ['typeToValidator', 'typeToValidatorModule'].forEach((mappingType) => {
                    expect(ValidationResolver[mappingType]).toEqual(jasmine.any(Object));
                });
            });
        });

        // input format:
        // fieldValue, fieldSpec, options

        describe('validate function', () => {
            describe('resolving to the Validation module', () => {
                for (const type in ValidationResolver.typeToValidator) {
                    it(`sends ${type}s to the Validation module, all fields`, async () => {
                        const validationFn = ValidationResolver.typeToValidator[type];
                        spyOn(Validation, validationFn);
                        await ValidationResolver.validate(
                            null,
                            { data: { type, constraints: { a: 1, b: 2 } } },
                            { this: 'that' }
                        );
                        expect(Validation[validationFn].calls.allArgs()).toEqual([
                            [null, { a: 1, b: 2 }, { this: 'that' }],
                        ]);
                    });
                    it(`sends ${type}s to the Validation module, with defaults`, async () => {
                        const validationFn = ValidationResolver.typeToValidator[type];
                        spyOn(Validation, validationFn);
                        await ValidationResolver.validate(null, { data: { type } });
                        expect(Validation[validationFn].calls.allArgs()).toEqual([[null, {}, {}]]);
                    });
                }
            });

            describe('resolving to an individual module', () => {
                const moduleMapping = {
                    sequence: SequenceValidator,
                    struct: StructValidator,
                    workspaceObjectName: WSObjNameValidator,
                    workspaceObjectRef: WSObjRefValidator,
                };

                for (const type in ValidationResolver.typeToValidatorModule) {
                    it(`sends ${type} data to their own special module`, async () => {
                        const moduleName = ValidationResolver.typeToValidatorModule[type];
                        const module = moduleMapping[moduleName];
                        spyOn(module, 'validate');
                        await ValidationResolver.validate(null, { data: { type } }, {});
                        expect(module.validate.calls.allArgs()).toEqual([
                            [null, { data: { type } }, {}],
                        ]);
                    });
                }
            });

            describe('no resolution possible', () => {
                for (const invalidType of [undefined, null, {}, [], 'whatever', 123456]) {
                    it(`rejects invalid data type ${invalidType}`, async () => {
                        await expectAsync(
                            ValidationResolver.validate(null, { data: { type: invalidType } })
                        ).toBeRejectedWithError(`No validator for type: ${invalidType}`);
                    });
                }
            });
        });
    });
});
