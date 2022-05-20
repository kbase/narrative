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

    describe('validate arrays of parameters', () => {});
});
