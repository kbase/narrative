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
        const paramKeys = ['data', 'id', 'multipleItems', 'ui', '_position'];
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

    describe('The SDK converter', () => {
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

        // dropdown, single selection
        const dropdownOptions = {
            options: [
                {
                    display: 'Comma-separated (CSV)',
                    value: 'CSV',
                },
                {
                    display: 'Tab-separated (TSV)',
                    value: 'TSV',
                },
                {
                    display: 'Excel (XLSX)',
                    value: 'EXCEL',
                },
            ],
        };

        const required = true;
        const baseSelect = {
            advanced: 0,
            default_values: ['CSV'],
            description: 'Format for the output file',
            disabled: 0,
            dropdown_options: {},
            field_type: 'dropdown',
            id: 'output_file_type',
            optional: 0,
            short_hint: 'Format for the output file',
            ui_class: 'parameter',
            ui_name: 'Output file type',
        };

        const singleSelect = {
            ...baseSelect,
            allow_multiple: 0,
            dropdown_options: {
                multiselection: 0,
                ...dropdownOptions,
            },
        };

        const manySelects = {
            ...baseSelect,
            allow_multiple: 1,
            dropdown_options: {
                multiselection: 0,
                ...dropdownOptions,
            },
        };

        const multiSelect = {
            ...baseSelect,
            allow_multiple: 0,
            default_values: ['CSV', 'TSV', 'EXCEL'],
            dropdown_options: {
                multiselection: 1,
                ...dropdownOptions,
            },
        };

        describe('dropdown spec conversion', () => {
            it('single select', () => {
                const converted = SDK.convertParameter(singleSelect);
                expect(converted.multipleItems).toEqual(false);
                expect(converted.data).toEqual({
                    type: 'string',
                    sequence: false,
                    constraints: {
                        required,
                        ...dropdownOptions,
                        multiselection: 0,
                    },
                    nullValue: '',
                    defaultValue: 'CSV',
                });
                expect(converted.parameters).not.toBeDefined();
            });

            it('creates a spec for multiple select elements', () => {
                const converted = SDK.convertParameter(manySelects);
                expect(converted.data).toEqual({
                    type: 'sequence',
                    constraints: {
                        required,
                    },
                    defaultValue: [],
                    nullValue: null,
                });
                expect(converted.parameters).toBeDefined();
                expect(converted.parameters.layout).toEqual(['item']);
                expect(converted.parameters.specs.item).toEqual(
                    jasmine.objectContaining({
                        data: {
                            type: 'string',
                            sequence: false,
                            constraints: {
                                required,
                                ...dropdownOptions,
                                multiselection: 0,
                            },
                            defaultValue: 'CSV',
                            nullValue: '',
                        },
                    })
                );
            });

            it('creates a spec for a multiselect', () => {
                const converted = SDK.convertParameter(multiSelect);
                expect(converted.data).toEqual({
                    type: 'string',
                    sequence: false,
                    constraints: {
                        required,
                        ...dropdownOptions,
                        multiselection: 1,
                    },
                    nullValue: [],
                    defaultValue: multiSelect.default_values,
                });
                expect(converted.parameters).not.toBeDefined();
            });
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
