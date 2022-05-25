define(['common/spec', 'testUtil', 'json!/test/data/NarrativeTest.test_input_params.spec.json'], (
    Spec,
    TestUtil,
    TestAppSpec
) => {
    'use strict';

    function testSpecFns(spec) {
        [
            'getSpec',
            'makeDefaultedModel',
            'validateModel',
            'validateParams',
            'validateParamsArray',
            'validateMultipleParamsArray',
        ].forEach((fn) => {
            expect(spec[fn]).toEqual(jasmine.any(Function));
        });
    }

    describe('basic spec module test', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('should have a factory', () => {
            expect(Spec.make).toEqual(jasmine.any(Function));
        });

        it('should make an instance from an app spec from NMS', () => {
            testSpecFns(Spec.make({ appSpec: TestAppSpec }));
        });

        it('should make an instance from a simple spec object', () => {
            const verySimpleSpec = {
                parameters: {
                    layout: ['woo'],
                    specs: {
                        woo: {},
                    },
                },
            };
            testSpecFns(Spec.make({ spec: verySimpleSpec }));
        });

        it('should throw an error if the factory does not get a spec', () => {
            expect(() => {
                Spec.make();
            }).toThrow();
        });
    });

    describe('spec module tests', () => {
        const defaultParams = {
            actual_input_object: '',
            actual_output_object: null,
            single_int: null,
            list_of_ints: [],
            single_float: null,
            list_of_floats: [],
            single_string: '',
            list_of_strings: [],
            single_ws_object: null,
            list_of_ws_objects: [],
            dropdown_selection: '',
            list_of_dropdown_selections: [],
            single_checkbox: 0,
            single_textarea: '',
            list_of_textareas: [],
            model_for_subdata: null,
            single_textsubdata: [],
        };

        beforeEach(function () {
            this.spec = Spec.make({
                appSpec: TestAppSpec,
            });
        });

        afterEach(() => {
            TestUtil.clearRuntime();
        });

        describe('basic tests', () => {
            it('should return the spec structure on request', function () {
                // just do a high level comparison
                const specObj = this.spec.getSpec();
                expect('parameters' in specObj).toBeTruthy();
                ['layout', 'specs'].forEach((key) => {
                    expect(key in specObj.parameters).toBeTruthy();
                });
            });

            it('should make a defaulted "model" object from a bulk import spec', function () {
                const defModel = this.spec.makeDefaultedModel('bulkImport');
                expect(defModel).toEqual({
                    params: defaultParams,
                });
            });

            it('should make a defaulted "model" object from a non-bulk spec', function () {
                const defModel = this.spec.makeDefaultedModel();
                expect(defModel).toEqual(defaultParams);
            });

            it('should validate an entire model', function () {
                const model = Object.assign({}, defaultParams);
                model.actual_input_object = 'foo';
                return this.spec.validateModel(model).then((result) => {
                    expect(result).toBeDefined();
                });
            });

            it('should validate some given parameters', function () {
                return this.spec
                    .validateParams(['actual_input_object'], { actual_input_object: 'ok' })
                    .then((result) => {
                        expect(result).toBeDefined();
                    });
            });
        });

        describe('validate arrays of parameters', () => {
            // generate an array of 3, alter which one should be invalid
            const totalVals = 3;
            for (let invalid = 0; invalid < totalVals; invalid++) {
                const paramArr = new Array(totalVals).fill(1);
                paramArr[invalid] = 'not_a_number';
                it(`validateParamsArray should validate an array of ${totalVals} parameters, with index ${invalid} invalid`, async function () {
                    const validations = await this.spec.validateParamsArray('single_int', paramArr);
                    expect(validations.length).toBe(totalVals);
                    validations.forEach((v, idx) => {
                        expect(v.isValid).toBe(idx !== invalid);
                    });
                });
            }

            it('validateParamsArray works with an empty array', async function () {
                const validations = await this.spec.validateParamsArray('single_int', []);
                expect(validations).toEqual([]);
            });
        });

        describe('validate groups of arrays of parameters', () => {
            // like above, generate some arrays, test the validations/invalidation groups
            const totalVals = 3;
            for (let invalidInt = 0; invalidInt < totalVals; invalidInt++) {
                for (let invalidFloat = 0; invalidFloat < totalVals; invalidFloat++) {
                    const singleIntArr = new Array(totalVals).fill(1);
                    singleIntArr[invalidInt] = 'not an int';
                    const singleFloatArr = new Array(totalVals).fill(2.2);
                    singleFloatArr[invalidFloat] = 'not a float';

                    it(`validateMultipleParamsArray works, keeps order of validation, bad int=${invalidInt}, bad float=${invalidFloat}`, async function () {
                        const paramIds = ['single_int', 'single_float'];
                        const paramValues = {
                            single_int: singleIntArr,
                            single_float: singleFloatArr,
                        };
                        const validations = await this.spec.validateMultipleParamsArray(
                            paramIds,
                            paramValues
                        );
                        for (const paramId of paramIds) {
                            expect(validations[paramId].length).toBe(totalVals);
                            validations[paramId].forEach((v, idx) => {
                                if (paramId === 'single_int') {
                                    expect(v.isValid).toBe(idx !== invalidInt);
                                } else {
                                    expect(v.isValid).toBe(idx !== invalidFloat);
                                }
                            });
                        }
                    });
                }
            }

            it('validateMultipleParamsArray works with multiple empty arrays', async function () {
                const paramIds = ['single_int', 'single_string'];
                const paramValues = {
                    single_int: [],
                    single_string: [],
                };
                const validations = await this.spec.validateMultipleParamsArray(
                    paramIds,
                    paramValues
                );
                expect(validations).toEqual({
                    single_int: [],
                    single_string: [],
                });
            });
        });
    });
});
