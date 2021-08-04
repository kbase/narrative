define([
    'common/sdk',
    'testUtil',
    'json!/test/data/NarrativeTest.test_simple_inputs.spec.json',
    'json!/test/data/NarrativeTest.test_input_params.spec.json',
], (SDK, TestUtil, SimpleAppSpec, ComplexAppSpec) => {
    'use strict';

    const validateConvertedSpec = function (spec) {
        if (!spec || !('parameters' in spec)) {
            return false;
        }
        if (!('layout' in spec.parameters) || !('specs' in spec.parameters)) {
            return false;
        }
        const paramKeys = ['id', 'multipleItems', 'ui', 'data', '_position'];
        let passedInternal = true;
        spec.parameters.layout.forEach((param) => {
            paramKeys.forEach((key) => {
                if (!(key in spec.parameters.specs[param])) {
                    passedInternal = false;
                    console.error('TEST ERROR: param ' + param + ' missing key ' + key);
                }
            });
        });
        return passedInternal;
    };

    describe('Test SDK convertor tool', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('Is alive!', () => {
            expect(SDK).toBeTruthy();
        });

        it('Can convert a simple app spec', () => {
            const spec = SDK.convertAppSpec(SimpleAppSpec);
            expect(validateConvertedSpec(spec)).toBe(true);
        });

        it('Can convert a rather complex app spec', () => {
            const spec = SDK.convertAppSpec(ComplexAppSpec);
            expect(validateConvertedSpec(spec)).toBe(true);
        });

        it('Throws an error with an app spec with missing stuff', () => {
            try {
                SDK.convertAppSpec(null);
            } catch (error) {
                expect(error).not.toBeNull();
            }
        });
    });
});
