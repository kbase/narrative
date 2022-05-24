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

            it('has expected functions', () => {
                for (const fn of ['validate', 'validateArray']) {
                    expect(ValidationResolver[fn]).toEqual(jasmine.any(Function));
                }
            });

            it('exports validation mappings', () => {
                ['typeToValidator', 'typeToValidatorModule', 'typeToArrayValidator'].forEach(
                    (mappingType) => {
                        expect(ValidationResolver[mappingType]).toEqual(jasmine.any(Object));
                    }
                );
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

        describe('validateArray function', () => {
            describe('resolving to an array validator', () => {
                for (const type in ValidationResolver.typeToArrayValidator) {
                    it(`sends ${type}s to the Validation module, all fields`, async () => {
                        const validationFn = ValidationResolver.typeToArrayValidator[type];
                        spyOn(Validation, validationFn);
                        await ValidationResolver.validateArray(
                            [],
                            { data: { type, constraints: { a: 1, b: 2 } } },
                            { this: 'that' }
                        );
                        expect(Validation[validationFn].calls.allArgs()).toEqual([
                            [[], { a: 1, b: 2 }, { this: 'that' }],
                        ]);
                    });

                    it(`sends ${type}s to the Validation module, with defaults`, async () => {
                        const validationFn = ValidationResolver.typeToArrayValidator[type];
                        spyOn(Validation, validationFn);
                        await ValidationResolver.validateArray([], { data: { type } });
                        expect(Validation[validationFn].calls.allArgs()).toEqual([[[], {}, {}]]);
                    });
                }
            });

            describe('resolving to an Array of uses of an individual module', () => {
                // TODO there's some weird scoping/closure issue where spying doesn't want to work right.
                // Ideally, here we'd spy on `ValidationResolver.validate` and make sure it gets called
                // multiple times, but the spy doesn't seem to want to work.
                //
                // instead, this spot-tests all of the Validation calls registered in `typeToValidator`
                // except for those in the array validator. If those work right, then we can assume
                // that calls to individual Validation modules would work right as well.
                const individualResolvers = new Set([
                    ...Object.keys(ValidationResolver.typeToValidator),
                ]);
                for (const type in ValidationResolver.typeToArrayValidator) {
                    individualResolvers.delete(type);
                }
                for (const type of individualResolvers) {
                    const vals = ['a', 'b'];
                    const spec = { data: { type } };
                    const validationFn = ValidationResolver.typeToValidator[type];
                    it(`runs multiple single ${type} resolvers when given an array`, async () => {
                        spyOn(Validation, validationFn);
                        await ValidationResolver.validateArray(vals, spec);
                        expect(Validation[validationFn]).toHaveBeenCalledTimes(vals.length);
                        const expectedCalls = vals.map((val) => [val, {}, {}]);
                        expect(Validation[validationFn].calls.allArgs()).toEqual(expectedCalls);
                    });
                }
            });
        });
    });
});
