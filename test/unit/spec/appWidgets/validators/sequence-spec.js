define([
    'widgets/appWidgets2/validators/constants',
    'widgets/appWidgets2/validators/resolver',
    'testUtil',
], (Constants, Resolver, TestUtil) => {
    'use strict';

    const validation = {
        valid: {
            isValid: true,
            diagnosis: Constants.DIAGNOSIS.VALID,
        },
        requiredMissing: {
            isValid: false,
            diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
            messageId: Constants.MESSAGE_IDS.REQUIRED_MISSING,
        },
        optionalEmpty: {
            isValid: true,
            diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
        },
        valueAboveMax: {
            isValid: false,
            messageId: Constants.MESSAGE_IDS.VALUE_OVER_MAX,
            diagnosis: Constants.DIAGNOSIS.INVALID,
        },
        invalidFormat: {
            isValid: false,
            diagnosis: Constants.DIAGNOSIS.INVALID,
        },
    };

    describe('validateSequence', () => {
        const requiredSequenceSpec = {
            data: {
                type: 'sequence',
                constraints: {
                    required: true,
                },
                defaultValue: [],
                nullValue: null,
            },
            parameters: {
                specs: {
                    item: {
                        data: {
                            type: 'int',
                            sequence: false,
                            constraints: {
                                required: true,
                                min: -100,
                                max: 100,
                            },
                            defaultValue: null,
                            nullValue: null,
                        },
                    },
                },
            },
        };

        const optionalSequenceSpec = TestUtil.JSONcopy(requiredSequenceSpec);
        optionalSequenceSpec.data.constraints.required = false;
        optionalSequenceSpec.parameters.specs.item.data.constraints.required = false;

        // sequence tests
        const sequenceTests = [
            // top level list is null or empty
            {
                required: true,
                value: null,
                result: validation.requiredMissing,
            },
            {
                required: true,
                value: [],
                result: validation.requiredMissing,
            },
            {
                required: false,
                value: null,
                result: validation.optionalEmpty,
            },
            {
                required: false,
                value: [],
                result: validation.optionalEmpty,
            },
            // list contents
            {
                required: true,
                value: [null, null, null],
                result: validation.requiredMissing,
                validations: [
                    validation.requiredMissing,
                    validation.requiredMissing,
                    validation.requiredMissing,
                ],
            },
            {
                required: false,
                value: [null, null, null],
                result: validation.valid,
                validations: [
                    validation.optionalEmpty,
                    validation.optionalEmpty,
                    validation.optionalEmpty,
                ],
            },
            {
                required: true,
                value: [1, 2, 3],
                result: validation.valid,
                validations: [validation.valid, validation.valid, validation.valid],
            },
            {
                required: false,
                value: [1, 2, 3],
                result: validation.valid,
                validations: [validation.valid, validation.valid, validation.valid],
            },
            {
                required: true,
                value: [1500, -70, null, 'blob'],
                result: validation.requiredMissing,
                validations: [
                    validation.valueAboveMax,
                    validation.valid,
                    validation.requiredMissing,
                    validation.invalidFormat,
                ],
            },
            {
                required: false,
                value: [1500, -70, null, 'blob'],
                result: validation.valid,
                validations: [
                    validation.valueAboveMax,
                    validation.valid,
                    validation.optionalEmpty,
                    validation.invalidFormat,
                ],
            },
        ];

        sequenceTests.forEach((test) => {
            it(`validates the sequence ${JSON.stringify(test.value)}, values ${
                test.required ? 'required' : 'optional'
            }`, async () => {
                const options = test.required ? requiredSequenceSpec : optionalSequenceSpec;

                const seqResult = await Resolver.validate(test.value, options);
                expect(seqResult).toEqual(jasmine.objectContaining(test.result));
                if (test.validations) {
                    seqResult.validations.forEach((val, ix) => {
                        expect(val).toEqual(jasmine.objectContaining(test.validations[ix]));
                    });
                }
            });
        });
    });
});
