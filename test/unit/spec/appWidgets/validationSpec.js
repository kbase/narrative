define([
    'bluebird',
    'widgets/appWidgets2/validation',
    'widgets/appWidgets2/validators/constants',
    'testUtil',
    'narrativeMocks',
], (Promise, Validation, Constants, TestUtil, Mocks) => {
    'use strict';

    const aLoadOfInputs = [
        null,
        undefined,
        '',
        'string',
        42,
        [],
        {},
        [1, 2, 3],
        { this: 'that' },
        () => {
            return;
        },
    ];

    fdescribe('Validator functions', () => {
        it('Is alive', () => {
            let alive;
            if (Validation) {
                alive = true;
            } else {
                alive = false;
            }
            expect(alive).toBeTruthy();
        });

        /* map from wsid to objects that match the name
         * used for mocking out the responses needed for validateWorkspaceObjectName,
         * in the case where we want to ensure that the object
         * doesn't already exist.
         * These will be used across different mock workspaces, with the same name.
         * ws 1 - it doesn't exist.
         * ws 2 - it exists, of the same type
         * ws 3 - it exists, of different type
         */
        const wsObjName = 'SomeObject',
            wsObjType = 'SomeModule.SomeType',
            fullType = `${wsObjType}-1.0`,
            wsObjMapping = {
                1: [null],
                2: [
                    [
                        1,
                        wsObjName,
                        fullType,
                        '2019-07-23T22:42:44+0000',
                        1,
                        'someuser',
                        2,
                        'someworkspace',
                        'somehash',
                        123,
                        null,
                    ],
                ],
                3: [
                    [
                        1,
                        wsObjName,
                        'SomeOtherModule.SomeOtherType-2.0',
                        '2019-07-23T22:42:44+0000',
                        1,
                        'someotheruser',
                        3,
                        'someotherworkspace',
                        'somehash',
                        123,
                        null,
                    ],
                ],
            },
            fakeWsUrl = 'https://test.kbase.us/services/ws';

        beforeEach(() => {
            jasmine.Ajax.install();

            Mocks.mockJsonRpc1Call({
                url: fakeWsUrl,
                body: /wsid.\s*:\s*1\s*,/,
                response: wsObjMapping['1'],
            });

            Mocks.mockJsonRpc1Call({
                url: fakeWsUrl,
                body: /wsid.\s*:\s*2\s*,/,
                response: wsObjMapping['2'],
            });

            Mocks.mockJsonRpc1Call({
                url: fakeWsUrl,
                body: /wsid.\s*:\s*3\s*,/,
                response: wsObjMapping['3'],
            });
        });

        afterEach(() => {
            TestUtil.clearRuntime();
            jasmine.Ajax.uninstall();
        });

        describe('validateWorkspaceObjectName', () => {
            it('returns valid when they should not exist', () => {
                return Validation.validateWorkspaceObjectName(wsObjName, {
                    shouldNotExist: true,
                    workspaceId: 1,
                    workspaceServiceUrl: fakeWsUrl,
                    types: [wsObjType],
                }).then((result) => {
                    expect(result).toEqual({
                        isValid: true,
                        messageId: undefined,
                        errorMessage: undefined,
                        shortMessage: undefined,
                        diagnosis: Constants.DIAGNOSIS.VALID,
                        value: wsObjName,
                        parsedValue: wsObjName,
                    });
                });
            });

            it('returns valid-ish when type exists of same type', () => {
                return Validation.validateWorkspaceObjectName(wsObjName, {
                    shouldNotExist: true,
                    workspaceId: 2,
                    workspaceServiceUrl: fakeWsUrl,
                    types: [wsObjType],
                }).then((result) => {
                    expect(result).toEqual({
                        isValid: true,
                        messageId: Constants.MESSAGE_IDS.OBJ_OVERWRITE_WARN,
                        shortMessage: 'an object already exists with this name',
                        diagnosis: Constants.DIAGNOSIS.SUSPECT,
                        errorMessage: undefined,
                        value: wsObjName,
                        parsedValue: wsObjName,
                    });
                });
            });

            it('returns invalid when type exists of different type', () => {
                return Validation.validateWorkspaceObjectName(wsObjName, {
                    shouldNotExist: true,
                    workspaceId: 3,
                    workspaceServiceUrl: fakeWsUrl,
                    types: [wsObjType],
                }).then((result) => {
                    expect(result).toEqual({
                        isValid: false,
                        messageId: Constants.MESSAGE_IDS.OBJ_OVERWRITE_DIFF_TYPE,
                        errorMessage:
                            'an object already exists with this name and is not of the same type',
                        diagnosis: Constants.DIAGNOSIS.INVALID,
                        shortMessage: undefined,
                        value: wsObjName,
                        parsedValue: wsObjName,
                    });
                });
            });
        });

        describe('workspace lookup', () => {
            it('Can look up workspace names', () => {
                return Validation.validateWorkspaceObjectName('somename', {
                    shouldNotExist: true,
                    workspaceId: 1,
                    workspaceServiceUrl: 'https://test.kbase.us/services/ws',
                    types: [wsObjType],
                }).then((result) => {
                    expect(result).toEqual({
                        isValid: true,
                        messageId: undefined,
                        errorMessage: undefined,
                        diagnosis: Constants.DIAGNOSIS.VALID,
                        shortMessage: undefined,
                        value: 'somename',
                        parsedValue: 'somename',
                    });
                });
            });
        });

        describe('validateCustomInput', () => {
            it('returns valid', () => {
                aLoadOfInputs.forEach((value) => {
                    expect(Validation.validateCustomInput(value)).toEqual({
                        isValid: true,
                        errorMessage: null,
                        diagnosis: Constants.DIAGNOSIS.VALID,
                    });
                });
            });
        });

        describe('validateTrue', () => {
            it('should be an instant truthy no-op-ish response', () => {
                aLoadOfInputs.forEach((value) => {
                    expect(Validation.validateTrue(value)).toEqual({
                        isValid: true,
                        errorMessage: null,
                        diagnosis: Constants.DIAGNOSIS.VALID,
                        value: value,
                        parsedValue: value,
                    });
                });
            });
        });

        // STRING
        describe('validateTextString', () => {
            it('a simple string without constraints', () => {
                expect(Validation.validateTextString('test', {}).isValid).toEqual(true);
            });

            it('a simple string required and supplied', () => {
                const result = Validation.validateTextString('test', {
                    required: true,
                });
                expect(result.isValid).toEqual(true);
            });
            it('a simple string, required, empty string', () => {
                const result = Validation.validateTextString('', { required: true });
                expect(result.isValid).toEqual(false);
            });
            it('a simple string, required, null', () => {
                const result = Validation.validateTextString(null, {
                    required: true,
                });
                expect(result.isValid).toEqual(false);
            });
            it('a simple string, min and max length, within range', () => {
                const result = Validation.validateTextString('hello', {
                    required: true,
                    min_length: 5,
                    max_length: 10,
                });
                expect(result.isValid).toEqual(true);
            });
            it('a simple string, min and max length, below', () => {
                const result = Validation.validateTextString('hi', {
                    required: true,
                    min_length: 5,
                    max_length: 10,
                });
                expect(result.isValid).toEqual(false);
            });
            it('a simple string, min and max length, above range', () => {
                const result = Validation.validateTextString('hello earthling', {
                    required: true,
                    min_length: 5,
                    max_length: 10,
                });
                expect(result.isValid).toEqual(false);
            });
            it('a regexp with matching string', () => {
                const value = 'foobar';
                const options = {
                    regexp: [
                        {
                            regex: '^foo',
                            error_text: 'error',
                            match: 1,
                        },
                    ],
                };
                const result = Validation.validateTextString(value, options);
                expect(result).toEqual({
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.VALID,
                    value: value,
                    parsedValue: value,
                    errorMessage: undefined,
                    messageId: undefined,
                });
            });
            it('a regexp with non-matching string', () => {
                const value = 'barfoo';
                const options = {
                    regexp: [
                        {
                            regex: '^\\d+$',
                            match: 1,
                        },
                    ],
                };
                expect(Validation.validateTextString(value, options)).toEqual({
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    value: value,
                    parsedValue: value,
                    errorMessage: `Failed regular expression /${options.regexp[0].regex}/`,
                    messageId: Constants.MESSAGE_IDS.INVALID,
                });
            });
        });

        // INTEGER
        describe('validateIntString', () => {
            it('an integer without constraints', () => {
                const result = Validation.validateIntString('42', {});
                expect(result.isValid).toEqual(true);
            });
            it('an integer, required', () => {
                const result = Validation.validateIntString('42', {
                    required: true,
                });
                expect(result.isValid).toEqual(true);
            });
            it('an integer, required', () => {
                const result = Validation.validateIntString('', {
                    required: true,
                });
                expect(result.isValid).toEqual(false);
            });
            it('an integer, required', () => {
                const result = Validation.validateIntString(null, {
                    required: true,
                });
                expect(result.isValid).toEqual(false);
            });
            it('an integer, required', () => {
                const result = Validation.validateIntString('7', {
                    required: true,
                    min: 5,
                    max: 10,
                });
                expect(result.isValid).toEqual(true);
            });
            it('an integer, required', () => {
                const result = Validation.validateIntString('3', {
                    required: true,
                    min: 5,
                    max: 10,
                });
                expect(result.isValid).toEqual(false);
            });
            it('an integer, required', () => {
                const result = Validation.validateIntString('42', {
                    required: true,
                    min: 5,
                    max: 10,
                });
                expect(result.isValid).toEqual(false);
            });
            it('an integer string, wrong type (int)', () => {
                const result = Validation.validateIntString(42, {
                    required: true,
                    min: 5,
                    max: 10,
                });
                expect(result.isValid).toEqual(false);
            });
        });

        describe('validateFloatString', () => {
            // FLOAT
            it('a float without constraints', () => {
                const result = Validation.validateFloatString('42.12', {});
                expect(result.isValid).toEqual(true);
            });
            it('a bad without constraints', () => {
                const result = Validation.validateFloatString('x', {});
                expect(result.isValid).toEqual(false);
            });
            it('an empty without constraints', () => {
                const result = Validation.validateFloatString('', {});
                expect(result.isValid).toEqual(true);
            });
            it('a float string, required', () => {
                const result = Validation.validateFloatString('42.12', {
                    required: true,
                });
                expect(result.isValid).toEqual(true);
            });
            it('an empty string, required', () => {
                const result = Validation.validateFloatString('', {
                    required: true,
                });
                expect(result.isValid).toEqual(false);
            });
            it('an empty string, required', () => {
                const result = Validation.validateFloatString(null, {
                    required: true,
                });
                expect(result.isValid).toEqual(false);
            });
            // bad types
            it('an undefined, required', () => {
                const result = Validation.validateFloatString(undefined, {
                    required: true,
                });
                expect(result.isValid).toEqual(false);
            });
            it('an array, required', () => {
                const result = Validation.validateFloatString([], {
                    required: true,
                });
                expect(result.isValid).toEqual(false);
            });
        });

        function runTests(method, testSet) {
            describe(method, () => {
                testSet.forEach((test) => {
                    if (test.options.required === undefined) {
                        [true, false].forEach((required) => {
                            it(test.title + ' - required: ' + required, () => {
                                return Promise.try(() => {
                                    const options = test.options;
                                    options.required = required;
                                    return Validation[method](test.value, options);
                                }).then((result) => {
                                    Object.keys(test.result).forEach((key) => {
                                        expect(result[key]).toEqual(test.result[key]);
                                    });
                                });
                            });
                        });
                    } else {
                        it(test.title, () => {
                            return Promise.try(() => {
                                return Validation[method](test.value, test.options);
                            }).then((result) => {
                                Object.keys(test.result).forEach((key) => {
                                    expect(result[key]).toEqual(test.result[key]);
                                });
                            });
                        });
                    }
                });
            });
        }

        // FLOATS
        const floatTests = [
            // empty values
            {
                title: 'empty string',
                value: '',
                options: { required: false },
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                    errorMessage: undefined,
                    value: '',
                    parsedValue: undefined,
                },
            },
            {
                title: 'string of just spaces same as empty',
                value: '   ',
                options: { required: false },
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                    errorMessage: undefined,
                    value: '   ',
                    parsedValue: undefined,
                },
            },
            {
                title: 'null',
                value: null,
                options: { required: false },
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                    errorMessage: undefined,
                    value: null,
                    parsedValue: undefined,
                },
            },
            {
                title: 'empty string, required',
                value: '',
                options: { required: true },
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                    errorMessage: 'value is required',
                    value: '',
                    parsedValue: undefined,
                },
            },
            {
                title: 'string of empty spaces, required',
                value: '   ',
                options: { required: true },
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                    errorMessage: 'value is required',
                    value: '   ',
                    parsedValue: undefined,
                },
            },
            {
                title: 'null, required',
                value: null,
                options: { required: true },
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                    errorMessage: 'value is required',
                    value: null,
                    parsedValue: undefined,
                },
            },
            // acceptable format
            {
                title: 'integer format',
                value: '42',
                options: {},
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.VALID,
                    errorMessage: undefined,
                    value: '42',
                    parsedValue: 42,
                },
            },
            {
                title: 'decmial format',
                value: '42.12',
                options: {},
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.VALID,
                    errorMessage: undefined,
                    value: '42.12',
                    parsedValue: 42.12,
                },
            },
            {
                title: 'float exp format',
                value: '42e2',
                options: {},
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.VALID,
                    errorMessage: undefined,
                    value: '42e2',
                    parsedValue: 42e2,
                },
            },
            // bad value
            {
                title: 'string of chars',
                value: 'abc',
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'Invalid float format: abc',
                    value: 'abc',
                    parsedValue: undefined,
                },
            },
            // type
            {
                title: 'validate undefined',
                value: undefined,
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'value must be a string or number (it is of type "undefined")',
                    value: undefined,
                    parsedValue: undefined,
                },
            },
            {
                title: 'validate array',
                value: [],
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'value must be a string or number (it is of type "object")',
                    value: [],
                    parsedValue: undefined,
                },
            },
            {
                title: 'validate object',
                value: {},
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'value must be a string or number (it is of type "object")',
                    value: {},
                    parsedValue: undefined,
                },
            },
            {
                title: 'validate date',
                value: new Date(0),
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'value must be a string or number (it is of type "object")',
                    value: new Date(0),
                    parsedValue: undefined,
                },
            },
            // could go on..
            // validate range
            {
                title: 'value over max',
                value: '123.45',
                options: {
                    max: 100,
                },
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'the maximum value for this parameter is 100',
                    value: '123.45',
                    parsedValue: undefined,
                },
            },
            {
                title: 'value under min',
                value: '5',
                options: {
                    min: 10,
                },
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'the minimum value for this parameter is 10',
                    value: '5',
                    parsedValue: undefined,
                },
            },
            {
                title: 'within range',
                value: '5.5',
                options: {
                    min: 0,
                    max: 10,
                },
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.VALID,
                    errorMessage: undefined,
                    value: '5.5',
                    parsedValue: 5.5,
                },
            },
            {
                title: 'infinite',
                value: 'Infinity',
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'value must be finite',
                    value: 'Infinity',
                    parsedValue: undefined,
                },
            },
        ];

        runTests('validateFloatString', floatTests);

        // INTEGERS
        const integerTests = [
            // empty values
            {
                title: 'empty string',
                value: '',
                options: { required: false },
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                    errorMessage: undefined,
                    value: '',
                    parsedValue: undefined,
                },
            },
            {
                title: 'string of just spaces same as empty',
                value: '   ',
                options: { required: false },
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                    errorMessage: undefined,
                    value: '   ',
                    parsedValue: undefined,
                },
            },
            {
                title: 'null',
                value: null,
                options: { required: false },
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                    errorMessage: undefined,
                    value: null,
                    parsedValue: undefined,
                },
            },
            {
                title: 'empty string, required',
                value: '',
                options: { required: true },
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                    errorMessage: 'value is required',
                    value: '',
                    parsedValue: undefined,
                },
            },
            {
                title: 'string of empty spaces, required',
                value: '   ',
                options: { required: true },
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                    errorMessage: 'value is required',
                    value: '   ',
                    parsedValue: undefined,
                },
            },
            {
                title: 'null, required',
                value: null,
                options: { required: true },
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                    errorMessage: 'value is required',
                    value: null,
                    parsedValue: undefined,
                },
            },
            // acceptableFormatTests
            {
                title: 'integer format',
                value: '42',
                options: {},
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.VALID,
                    errorMessage: undefined,
                    value: '42',
                    parsedValue: 42,
                },
            },
            // badValueTests
            {
                title: 'string of chars',
                value: 'abc',
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'Invalid integer format: abc',
                    value: 'abc',
                    parsedValue: undefined,
                },
            },
            {
                title: 'decimal format',
                value: '42.12',
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'Invalid integer format: 42.12',
                    value: '42.12',
                    parsedValue: undefined,
                },
            },
            // typeTests
            {
                title: 'validate undefined',
                value: undefined,
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'value must be a string or number (it is of type "undefined")',
                    value: undefined,
                    pasedValue: undefined,
                },
            },
            {
                title: 'validate array',
                value: [],
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'value must be a string or number (it is of type "object")',
                    value: [],
                    parsedValue: undefined,
                },
            },
            {
                title: 'validate object',
                value: {},
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'value must be a string or number (it is of type "object")',
                    value: {},
                    parsedValue: undefined,
                },
            },
            {
                title: 'validate date',
                value: new Date(0),
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'value must be a string or number (it is of type "object")',
                    value: new Date(0),
                    parsedValue: undefined,
                },
            },
            // could go on..
        ];
        runTests('validateIntString', integerTests);

        // STRINGS
        const stringTests = [
            // emptyValues
            {
                title: 'empty string',
                value: '',
                options: { required: false },
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                    errorMessage: undefined,
                    value: '',
                    parsedValue: undefined,
                },
            },
            {
                title: 'string of just spaces same as empty',
                value: '   ',
                options: { required: false },
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                    errorMessage: undefined,
                    value: '   ',
                    parsedValue: undefined,
                },
            },
            {
                title: 'null',
                value: null,
                options: { required: false },
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                    errorMessage: undefined,
                    value: null,
                    parsedValue: undefined,
                },
            },
            {
                title: 'empty string, required',
                value: '',
                options: { required: true },
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                    errorMessage: 'value is required',
                    value: '',
                    parsedValue: undefined,
                },
            },
            {
                title: 'string of empty spaces, required',
                value: '   ',
                options: { required: true },
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                    errorMessage: 'value is required',
                    value: '   ',
                    parsedValue: undefined,
                },
            },
            {
                title: 'null, required',
                value: null,
                options: { required: true },
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                    errorMessage: 'value is required',
                    value: null,
                    parsedValue: undefined,
                },
            },
            // acceptableFormatTests
            {
                title: 'string format',
                value: '42',
                options: {},
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.VALID,
                    errorMessage: undefined,
                    value: '42',
                    parsedValue: '42',
                },
            },
            {
                title: 'string format',
                value: 'abc',
                options: {},
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.VALID,
                    errorMessage: undefined,
                    value: 'abc',
                    parsedValue: 'abc',
                },
            },
            {
                title: 'string format',
                value: 'uniîcodé',
                options: {},
                result: {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.VALID,
                    errorMessage: undefined,
                    value: 'uniîcodé',
                    parsedValue: 'uniîcodé',
                },
            },
            // no badValueTests
            // typeTests
            {
                title: 'validate undefined',
                value: undefined,
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'value must be a string (it is of type "undefined")',
                    value: undefined,
                    pasedValue: undefined,
                },
            },
            {
                title: 'validate array',
                value: [],
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'value must be a string (it is of type "object")',
                    value: [],
                    parsedValue: undefined,
                },
            },
            {
                title: 'validate object',
                value: {},
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'value must be a string (it is of type "object")',
                    value: {},
                    parsedValue: undefined,
                },
            },
            {
                title: 'validate date',
                value: new Date(0),
                options: {},
                result: {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.INVALID,
                    errorMessage: 'value must be a string (it is of type "object")',
                    value: new Date(0),
                    parsedValue: undefined,
                },
            },
            // could go on..
        ];
        runTests('validateTextString', stringTests);

        // validateSet
        describe('validateSet', () => {
            const testCases = [
                {
                    title: 'undefined all the way',
                    value: undefined,
                    options: {},
                    result: {
                        isValid: true,
                        diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                    },
                },
                {
                    title: 'undefined, not required',
                    value: undefined,
                    options: { required: false },
                    result: {
                        isValid: true,
                        diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                        parsedValue: undefined,
                        errorMessage: undefined,
                        value: undefined,
                    },
                },
                {
                    title: 'undefined, required',
                    value: undefined,
                    options: { required: true },
                    result: {
                        isValid: false,
                        diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                        parsedValue: undefined,
                        errorMessage: 'value is required',
                        value: undefined,
                    },
                },
                {
                    title: 'boolean, required, ok',
                    value: true,
                    options: { required: true, values: [true, false] },
                    result: {
                        isValid: true,
                        parsedValue: true,
                        value: true,
                    },
                },
                {
                    title: 'boolean, not required, ok',
                    value: true,
                    options: { required: false, values: [true, false] },
                    result: {
                        isValid: true,
                        parsedValue: true,
                        value: true,
                    },
                },
                {
                    title: 'value not present',
                    value: 'a',
                    options: { required: false, values: ['b', 'c'] },
                    result: {
                        isValid: false,
                        errorMessage: 'Value not in the set',
                        parsedValue: 'a',
                        value: 'a',
                        diagnosis: Constants.DIAGNOSIS.INVALID,
                    },
                },
            ];

            testCases.forEach((testCase) => {
                it(testCase.title, () => {
                    const result = Validation.validateSet(testCase.value, testCase.options);
                    Object.keys(testCase.result).forEach((key) => {
                        expect(testCase.result[key]).toEqual(result[key]);
                    });
                });
            });
        });

        // validateBoolean
        const boolNonStringValues = [1, 0, -1, undefined, [], {}],
            boolNonStringCases = boolNonStringValues.map((value) => {
                return {
                    title: 'non string - ' + value,
                    value: value,
                    options: {},
                    result: {
                        isValid: false,
                        errorMessage:
                            'value must be a string (it is of type "' + typeof value + '")',
                        diagnosis: Constants.DIAGNOSIS.INVALID,
                    },
                };
            }),
            boolEmptyStringValues = ['', ' ', '\t'],
            boolEmptyStringCases = boolEmptyStringValues
                .map((value, idx) => {
                    return {
                        title: 'empty string type ' + (idx + 1) + ' - required',
                        value: value,
                        options: { required: true },
                        result: {
                            isValid: false,
                            errorMessage: 'value is required',
                            diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                        },
                    };
                })
                .concat(
                    boolEmptyStringValues.map((value, idx) => {
                        return {
                            title: 'empty string type ' + (idx + 1) + ' - not required',
                            value: value,
                            options: { required: false },
                            result: {
                                isValid: true,
                                diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                            },
                        };
                    })
                ),
            boolBadStringValues = [
                'wat',
                '123/45/6/7',
                '123/456/789;123',
                '123/456/7;123/45/6/7',
                'foo/bar/baz',
            ],
            boolBadStringCases = boolBadStringValues.map((value) => {
                return {
                    title: 'bad string - ' + value,
                    value: value,
                    options: {},
                    result: {
                        isValid: false,
                        diagnosis: Constants.DIAGNOSIS.INVALID,
                    },
                };
            }),
            boolGoodStringValues = [
                'true',
                'false',
                'TRUE',
                'FALSE',
                'True',
                'False',
                't',
                'f',
                'T',
                'F',
                'yes',
                'no',
                'y',
                'n',
            ],
            boolGoodStringCases = boolGoodStringValues.map((value) => {
                return {
                    title: 'good string - ' + value,
                    value: value,
                    options: {},
                    result: {
                        isValid: true,
                        diagnosis: Constants.DIAGNOSIS.VALID,
                    },
                };
            });

        const booleanTestCases = [
            ...boolNonStringCases,
            ...boolEmptyStringCases,
            ...boolBadStringCases,
            ...boolGoodStringCases,
        ];
        runTests('validateBoolean', booleanTestCases);

        // validate data palette object reference path
        (function () {
            const nonStringValues = [1, 0, -1, undefined, null, [], {}],
                nonStringCases = nonStringValues.map((value) => {
                    return {
                        title: 'non string - ' + value,
                        value: value,
                        options: {},
                        result: {
                            isValid: false,
                            errorMessage: 'value must be a string in data reference format',
                            diagnosis: Constants.DIAGNOSIS.INVALID,
                        },
                    };
                }),
                emptyStringValues = ['', ' ', '\t'],
                emptyStringCases = emptyStringValues
                    .map((value, idx) => {
                        return {
                            title: 'empty string type ' + (idx + 1) + ' - required',
                            value: value,
                            options: { required: true },
                            result: {
                                isValid: false,
                                errorMessage: 'value is required',
                                diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                            },
                        };
                    })
                    .concat(
                        emptyStringValues.map((value, idx) => {
                            return {
                                title: 'empty string type ' + (idx + 1) + ' - not required',
                                value: value,
                                options: { required: false },
                                result: {
                                    isValid: true,
                                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                                },
                            };
                        })
                    ),
                badStringValues = ['wat', '123/45/6/7', '123/456/789;123', '123/456/7;123/45/6/7'],
                badStringCases = badStringValues.map((value) => {
                    return {
                        title: 'bad string - ' + value,
                        value: value,
                        options: {},
                        result: {
                            isValid: false,
                            diagnosis: Constants.DIAGNOSIS.INVALID,
                            errorMessage:
                                'Invalid object reference path -  ( should be #/#/#;#/#/#;...)',
                        },
                    };
                }),
                goodStringValues = [
                    '1/2/3',
                    '123/45/678',
                    '1234567890123/4576894876498756/192387129837198237198273',
                    '1/2/3;4/5/6',
                    '1/2;4/5/6',
                    '1/2;3/4;5/6',
                    '1/2/3;4/5/6;7/8/9',
                ],
                goodStringCases = goodStringValues.map((value) => {
                    return {
                        title: 'good string - ' + value,
                        value: value,
                        options: {},
                        result: {
                            isValid: true,
                            diagnosis: Constants.DIAGNOSIS.VALID,
                        },
                    };
                });

            const testCases = [
                ...nonStringCases,
                ...emptyStringCases,
                ...badStringCases,
                ...goodStringCases,
            ];
            runTests('validateWorkspaceDataPaletteRef', testCases);
        })();

        // Validate workspace object ref
        (function () {
            const nonStringValues = [1, 0, -1, undefined, null, [], {}],
                nonStringCases = nonStringValues.map((value) => {
                    return {
                        title: 'non string - ' + value,
                        value: value,
                        options: {},
                        result: {
                            isValid: false,
                            errorMessage:
                                'value must be a string in workspace object reference format',
                            diagnosis: Constants.DIAGNOSIS.INVALID,
                        },
                    };
                }),
                emptyStringValues = ['', ' ', '\t'],
                emptyStringCases = emptyStringValues
                    .map((value, idx) => {
                        return {
                            title: 'empty string type ' + (idx + 1) + ' - required',
                            value: value,
                            options: { required: true },
                            result: {
                                isValid: false,
                                errorMessage: 'value is required',
                                diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                            },
                        };
                    })
                    .concat(
                        emptyStringValues.map((value, idx) => {
                            return {
                                title: 'empty string type ' + (idx + 1) + ' - not required',
                                value: value,
                                options: { required: false },
                                result: {
                                    isValid: true,
                                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                                },
                            };
                        })
                    ),
                badStringValues = [
                    'wat',
                    '123/45/6/7',
                    '123/456/789;123',
                    '123/456/7;123/45/6/7',
                    'foo/bar/baz',
                ],
                badStringCases = badStringValues.map((value) => {
                    return {
                        title: 'bad string - ' + value,
                        value: value,
                        options: {},
                        result: {
                            isValid: false,
                            diagnosis: Constants.DIAGNOSIS.INVALID,
                            errorMessage: 'Invalid object reference format, should be #/#/#',
                        },
                    };
                }),
                goodStringValues = [
                    '1/2/3',
                    '123/45/678',
                    '1234567890123/4576894876498756/192387129837198237198273',
                ],
                goodStringCases = goodStringValues.map((value) => {
                    return {
                        title: 'good string - ' + value,
                        value: value,
                        options: {},
                        result: {
                            isValid: true,
                            diagnosis: Constants.DIAGNOSIS.VALID,
                        },
                    };
                });

            const testCases = [
                ...nonStringCases,
                ...emptyStringCases,
                ...badStringCases,
                ...goodStringCases,
            ];
            runTests('validateWorkspaceObjectRef', testCases);
        })();

        // validate workspace object name string -- a case of validateText/validateTextString
        (function () {
            const nonStringValues = [1, 0, -1, undefined, [], {}],
                nonStringCases = nonStringValues.map((value) => {
                    return {
                        title: 'non string - ' + value,
                        value: value,
                        options: { type: 'WorkspaceObjectName' },
                        result: {
                            isValid: false,
                            errorMessage: 'value must be a string in workspace object name format',
                            diagnosis: Constants.DIAGNOSIS.INVALID,
                        },
                    };
                }),
                emptyStringValues = ['', ' ', '\t'],
                emptyStringCases = emptyStringValues
                    .map((value, idx) => {
                        return {
                            title: 'empty string type ' + (idx + 1) + ' - required',
                            value: value,
                            options: { required: true, type: 'WorkspaceObjectName' },
                            result: {
                                isValid: false,
                                errorMessage: 'value is required',
                                diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                            },
                        };
                    })
                    .concat(
                        emptyStringValues.map((value, idx) => {
                            return {
                                title: 'empty string type ' + (idx + 1) + ' - not required',
                                value: value,
                                options: { required: false, type: 'WorkspaceObjectName' },
                                result: {
                                    isValid: true,
                                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                                },
                            };
                        })
                    ),
                spacedStringValues = ['foo bar', 'foo bar baz'],
                spacedStringCases = spacedStringValues.map((value) => {
                    return {
                        title: 'spaced string - ' + value,
                        value: value,
                        options: { type: 'WorkspaceObjectName' },
                        result: {
                            isValid: false,
                            diagnosis: Constants.DIAGNOSIS.INVALID,
                            messageId: 'obj-name-no-spaces',
                            errorMessage: 'an object name may not contain a space',
                        },
                    };
                }),
                intStringValues = ['1', '23', '-5', '123456789012345678901234567890'],
                intStringCases = intStringValues.map((value) => {
                    return {
                        title: 'int string - ' + value,
                        value: value,
                        options: { type: 'WorkspaceObjectName' },
                        result: {
                            isValid: false,
                            diagnosis: Constants.DIAGNOSIS.INVALID,
                            messageId: 'obj-name-not-integer',
                            errorMessage: 'an object name may not be in the form of an integer',
                        },
                    };
                }),
                invalidCharValues = ['foo!', 'bar@baz', 'a#a', '1$1', '%', '!@#$%^&*('],
                invalidCharCases = invalidCharValues.map((value) => {
                    return {
                        title: 'invalid char string - ' + value,
                        value: value,
                        options: { type: 'WorkspaceObjectName' },
                        result: {
                            isValid: false,
                            diagnosis: Constants.DIAGNOSIS.INVALID,
                            messageId: 'obj-name-invalid-characters',
                            errorMessage:
                                'one or more invalid characters detected; an object name may only include alphabetic characters, numbers, and the symbols "_",  "-",  ".",  and "|"',
                        },
                    };
                }),
                tooLongCase = [
                    {
                        title: 'string too long',
                        value: Array(256).fill('a').join(''),
                        options: { type: 'WorkspaceObjectName' },
                        result: {
                            isValid: false,
                            diagnosis: Constants.DIAGNOSIS.INVALID,
                            messageId: 'obj-name-too-long',
                            errorMessage: 'an object name may not exceed 255 characters in length',
                        },
                    },
                ],
                goodStringValues = [
                    'AGenome',
                    'Some_Object',
                    'another.object',
                    '-foo',
                    'bar-',
                    'da5id',
                    '3dog',
                    '  foobar  ',
                ],
                goodStringCases = goodStringValues.map((value) => {
                    return {
                        title: 'good string - ' + value,
                        value: value,
                        options: { type: 'WorkspaceObjectName' },
                        result: {
                            isValid: true,
                            diagnosis: Constants.DIAGNOSIS.VALID,
                            parsedValue: value.trim(),
                        },
                    };
                });

            const testCases = [
                ...nonStringCases,
                ...emptyStringCases,
                ...spacedStringCases,
                ...intStringCases,
                ...invalidCharCases,
                ...tooLongCase,
                ...goodStringCases,
            ];
            runTests('validateTextString', testCases);
            runTests('validateWorkspaceObjectName', testCases); // covers all but the case where we have to see if the object exists
        })();

        // text string / string set
        (function () {
            const emptySets = [null, [], [''], [' '], ['\t', '', '  ']],
                emptySetCases = emptySets
                    .map((set) => {
                        return {
                            title: 'empty set - ' + JSON.stringify(set) + ' - not required',
                            value: set,
                            options: { required: false },
                            result: {
                                isValid: true,
                                diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                                messageId: undefined,
                            },
                        };
                    })
                    .concat(
                        emptySets.map((set) => {
                            return {
                                title: 'empty set' + JSON.stringify(set) + ' - required',
                                value: set,
                                options: { required: true },
                                result: {
                                    isValid: false,
                                    diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                                    messageId: Constants.MESSAGE_IDS.REQUIRED_MISSING,
                                    errorMessage: 'value is required',
                                },
                            };
                        })
                    ),
                populatedSets = [['a', 'b'], ['a'], [1, 2]],
                populatedOkCases = populatedSets.map((set) => {
                    return {
                        title: 'set ok - ' + JSON.stringify(set),
                        value: set,
                        options: { values: ['a', 'b', 'c', 1, 2, 3] },
                        result: {
                            isValid: true,
                            diagnosis: Constants.DIAGNOSIS.VALID,
                            messageId: undefined,
                        },
                    };
                }),
                populatedFailCases = populatedSets.map((set) => {
                    return {
                        title: 'set not ok - ' + JSON.stringify(set),
                        value: set,
                        options: { values: ['b', 'd', 1, 4] },
                        result: {
                            isValid: false,
                            diagnosis: Constants.DIAGNOSIS.INVALID,
                            errorMessage: 'Value not in the set',
                            messageId: Constants.MESSAGE_IDS.VALUE_NOT_FOUND,
                        },
                    };
                }),
                populatedNoopCase = [
                    {
                        title: 'set with no test',
                        value: ['a', 'b', 'c'],
                        options: {},
                        result: {
                            isValid: true,
                            diagnosis: Constants.DIAGNOSIS.VALID,
                            messageId: undefined,
                        },
                    },
                ],
                notArraySets = [undefined, 'foo', 1, {}],
                notArrayCases = notArraySets.map((set) => {
                    return {
                        title: 'not an array - ' + set,
                        value: set,
                        options: {},
                        result: {
                            isValid: false,
                            diagnosis: Constants.DIAGNOSIS.INVALID,
                            errorMessage: 'value must be an array',
                            messageId: Constants.MESSAGE_IDS.VALUE_NOT_ARRAY,
                        },
                    };
                });

            const testCases = [
                ...emptySetCases,
                ...populatedOkCases,
                ...populatedFailCases,
                ...populatedNoopCase,
                ...notArrayCases,
            ];
            runTests('validateTextSet', testCases);
            runTests('validateStringSet', testCases);
        })();
    });

    describe('String import functions', () => {
        it('importTextString - plain strings are unchanged', () => {
            ['a', 'bb', 'ccc', '  ', ''].forEach((str) => {
                expect(Validation.importTextString(str)).toEqual(str);
            });
        });

        it('importTextString - undefined and null are nullified', () => {
            [undefined, null].forEach((val) => {
                expect(Validation.importTextString(val)).toBeNull();
            });
        });

        const empties = [undefined, null, '', '  '];
        empties.forEach((val) => {
            it(`importIntString - ${val} - should be null`, () => {
                expect(Validation.importIntString(val)).toBeNull();
            });
            it(`importFloatString - ${val} - should be null`, () => {
                expect(Validation.importFloatString(val)).toBeNull();
            });
        });

        const nonStrings = [[], {}, 123, new Set()];
        nonStrings.forEach((val) => {
            it(`importIntString - ${val} - should throw an error`, () => {
                expect(() => Validation.importIntString(val)).toThrowError(
                    `value must be a string (it is of type "${typeof val}")`
                );
            });
            it(`importFloatString - ${val} - should throw an error`, () => {
                expect(() => Validation.importFloatString(val)).toThrowError(
                    `value must be a string (it is of type "${typeof val}")`
                );
            });
        });

        ['a', '1 2 3', '1.1', '-1.2'].forEach((val) => {
            [true, false].forEach((withErr) => {
                it(`importIntString - ${val} - should fail with${
                    !withErr ? 'out' : ''
                } a custom error`, () => {
                    const errStr = 'so totally not an int!';
                    if (withErr) {
                        expect(() => Validation.importIntString(val, errStr)).toThrowError(errStr);
                    } else {
                        try {
                            Validation.importIntString(val);
                        } catch (err) {
                            expect(err).not.toEqual(errStr);
                        }
                    }
                });
            });
        });

        ['a', '1 2 3', 'not a number at all!'].forEach((val) => {
            [true, false].forEach((withErr) => {
                it(`importFloatString - ${val} - should fail with${
                    !withErr ? 'out' : ''
                } a custom error`, () => {
                    const errStr = 'so totally not a number!';
                    if (withErr) {
                        expect(() => Validation.importFloatString(val, errStr)).toThrowError(
                            errStr
                        );
                    } else {
                        try {
                            Validation.importFloatString(val);
                        } catch (err) {
                            expect(err).not.toEqual(errStr);
                        }
                    }
                });
            });
        });
    });

    describe('validateFalse', () => {
        // very simple, but with a few cases to test
        const value = 'val';
        const simpleResult = {
            isValid: false,
            diagnosis: Constants.DIAGNOSIS.INVALID,
            errorMessage: 'error',
            value,
        };

        [undefined, 1, null, 'foobar'].forEach((badDiag) => {
            it(`should default to "invalid" for with a given diagnosis of ${badDiag}`, () => {
                expect(Validation.validateFalse(value, badDiag)).toEqual(simpleResult);
            });
        });

        it('should return an "invalid" diagnosis by default', () => {
            expect(Validation.validateFalse(value)).toEqual(simpleResult);
        });

        ['ERROR', 'SUSPECT', 'REQUIRED_MISSING'].forEach((diag) => {
            it(`should show a ${diag} diagnosis`, () => {
                const expectation = TestUtil.JSONcopy(simpleResult);
                expectation.diagnosis = Constants.DIAGNOSIS[diag];
                expect(Validation.validateFalse(value, expectation.diagnosis)).toEqual(expectation);
            });
        });
    });
});
