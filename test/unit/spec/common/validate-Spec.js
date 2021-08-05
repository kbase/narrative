define(['bluebird', 'common/validation', 'testUtil'], (Promise, Validation, TestUtil) => {
    'use strict';

    describe('Validator functions', () => {
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
            wsObjMapping = {
                1: [null],
                2: [
                    [
                        1,
                        wsObjName,
                        wsObjType,
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
                        'SomeOtherModule.SomeOtherType',
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

            jasmine.Ajax.stubRequest(fakeWsUrl, /wsid.\s*:\s*1\s*,/).andReturn(
                (function () {
                    return {
                        status: 200,
                        statusText: 'HTTP/1.1 200 OK',
                        contentType: 'application/json',
                        responseText: JSON.stringify({ result: [wsObjMapping['1']] }),
                    };
                })()
            );
            jasmine.Ajax.stubRequest(fakeWsUrl, /wsid.\s*:\s*2\s*,/).andReturn({
                status: 200,
                statusText: 'HTTP/1.1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify({ result: [wsObjMapping['2']] }),
            });
            jasmine.Ajax.stubRequest(fakeWsUrl, /wsid.\s*:\s*3\s*,/).andReturn({
                status: 200,
                statusText: 'HTTP/1.1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify({ result: [wsObjMapping['3']] }),
            });
        });

        afterEach(() => {
            TestUtil.clearRuntime();
            jasmine.Ajax.uninstall();
        });

        it('validateWorkspaceObjectName - returns valid when they should not exist', (done) => {
            Validation.validateWorkspaceObjectName(wsObjName, {
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
                    diagnosis: 'valid',
                    value: wsObjName,
                    parsedValue: wsObjName,
                });
                done();
            });
        });

        it('validateWorkspaceObjectName - returns valid-ish when type exists of same type', (done) => {
            Validation.validateWorkspaceObjectName(wsObjName, {
                shouldNotExist: true,
                workspaceId: 2,
                workspaceServiceUrl: fakeWsUrl,
                types: [wsObjType],
            }).then((result) => {
                expect(result).toEqual({
                    isValid: true,
                    messageId: 'obj-overwrite-warning',
                    shortMessage: 'an object already exists with this name',
                    diagnosis: 'suspect',
                    errorMessage: undefined,
                    value: wsObjName,
                    parsedValue: wsObjName,
                });
                done();
            });
        });

        it('validateWorkspaceObjectName - returns invalid when type exists of different type', (done) => {
            Validation.validateWorkspaceObjectName(wsObjName, {
                shouldNotExist: true,
                workspaceId: 3,
                workspaceServiceUrl: fakeWsUrl,
                types: [wsObjType],
            }).then((result) => {
                expect(result).toEqual({
                    isValid: false,
                    messageId: 'obj-overwrite-diff-type',
                    errorMessage:
                        'an object already exists with this name and is not of the same type',
                    diagnosis: 'invalid',
                    shortMessage: undefined,
                    value: wsObjName,
                    parsedValue: wsObjName,
                });
                done();
            });
        });

        it('Can look up workspace names', (done) => {
            Validation.validateWorkspaceObjectName('somename', {
                shouldNotExist: true,
                workspaceId: 1,
                workspaceServiceUrl: 'https://test.kbase.us/services/ws',
                types: [wsObjType],
            }).then((result) => {
                expect(result).toEqual({
                    isValid: true,
                    messageId: undefined,
                    errorMessage: undefined,
                    diagnosis: 'valid',
                    shortMessage: undefined,
                    value: 'somename',
                    parsedValue: 'somename',
                });
                done();
            });
        });

        it('Is alive', () => {
            let alive;
            if (Validation) {
                alive = true;
            } else {
                alive = false;
            }
            expect(alive).toBeTruthy();
        });

        // STRING

        function wrap(val) {
            return Promise.try(() => {
                return val;
            });
        }
        it('validateTrue - should be an instant truthy no-op-ish response', () => {
            const value = 'foo';
            expect(Validation.validateTrue(value)).toEqual({
                isValid: true,
                errorMessage: null,
                diagnosis: 'valid',
                value: value,
                parsedValue: value,
            });
        });

        it('validateTextString - Validate a simple string without constraints', () => {
            expect(Validation.validateTextString('test', {}).isValid).toEqual(true);
        });

        it('validateTextString - Validate a simple string required and supplied', () => {
            const result = Validation.validateTextString('test', {
                required: true,
            });
            expect(result.isValid).toEqual(true);
        });
        it('validateTextString - Validate a simple string, required, empty string', (done) => {
            wrap(
                Validation.validateTextString('', {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('validateTextString - Validate a simple string, required, null', (done) => {
            wrap(
                Validation.validateTextString(null, {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('validateTextString - Validate a simple string, min and max length, within range', (done) => {
            wrap(
                Validation.validateTextString('hello', {
                    required: true,
                    min_length: 5,
                    max_length: 10,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('validateTextString - Validate a simple string, min and max length, below', (done) => {
            wrap(
                Validation.validateTextString('hi', {
                    required: true,
                    min_length: 5,
                    max_length: 10,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('validateTextString - Validate a simple string, min and max length, above range', (done) => {
            wrap(
                Validation.validateTextString('hello earthling', {
                    required: true,
                    min_length: 5,
                    max_length: 10,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('validateTextString - Validate a regexp with matching string', () => {
            const value = 'foobar';
            const options = {
                regexp_constraint: /^foo/,
            };
            const result = Validation.validateTextString(value, options);
            expect(result).toEqual({
                isValid: true,
                diagnosis: 'valid',
                value: value,
                parsedValue: value,
                errorMessage: undefined,
            });
        });
        it('validateTextString - Validate a regexp with non-matching string', () => {
            const value = 'barfoo';
            const options = {
                regexp_constraint: /^\d+$/,
            };
            expect(Validation.validateTextString(value, options)).toEqual({
                isValid: false,
                diagnosis: 'invalid',
                value: value,
                parsedValue: value,
                errorMessage:
                    'The text value did not match the regular expression constraint ' +
                    options.regexp_constraint,
            });
        });

        // INTEGER
        it('validateIntString - Validate an integer without constraints', (done) => {
            wrap(Validation.validateIntString('42', {})).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('validateIntString - Validate an integer, required', (done) => {
            wrap(
                Validation.validateIntString('42', {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('validateIntString - Validate an integer, required', (done) => {
            wrap(
                Validation.validateIntString('', {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('validateIntString - Validate an integer, required', (done) => {
            wrap(
                Validation.validateIntString(null, {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('validateIntString - Validate an integer, required', (done) => {
            wrap(
                Validation.validateIntString('7', {
                    required: true,
                    min_int: 5,
                    max_int: 10,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('validateIntString - Validate an integer, required', (done) => {
            wrap(
                Validation.validateIntString('3', {
                    required: true,
                    min_int: 5,
                    max_int: 10,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('validateIntString - Validate an integer, required', (done) => {
            wrap(
                Validation.validateIntString('42', {
                    required: true,
                    min_int: 5,
                    max_int: 10,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('validateIntString - Validate an integer, wront type (int)', (done) => {
            wrap(
                Validation.validateIntString(42, {
                    required: true,
                    min_int: 5,
                    max_int: 10,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });

        // FLOAT
        it('validateFloatString - Validate a float without constraints', (done) => {
            wrap(Validation.validateFloatString('42.12', {})).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('validateFloatString - Validate a bad without constraints', (done) => {
            wrap(Validation.validateFloatString('x', {})).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('validateFloatString - Validate an empty without constraints', (done) => {
            wrap(Validation.validateFloatString('', {})).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('validateFloatString - Validate a float string, required', (done) => {
            wrap(
                Validation.validateFloatString('42.12', {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('validateFloatString - Validate an empty string, required', (done) => {
            wrap(
                Validation.validateFloatString('', {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('validateFloatString - Validate an empty string, required', (done) => {
            wrap(
                Validation.validateFloatString(null, {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        // bad types
        it('validateFloatString - Validate an undefined, required', (done) => {
            wrap(
                Validation.validateFloatString(undefined, {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('validateFloatString - Validate an array, required', (done) => {
            wrap(
                Validation.validateFloatString([], {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });

        function runTests(method, tests) {
            tests.forEach((testSet) => {
                testSet.forEach((test) => {
                    if (test.options.required === undefined) {
                        [true, false].forEach((required) => {
                            it(method + ' - ' + test.title + ' - required: ' + required, (done) => {
                                Promise.try(() => {
                                    const options = test.options;
                                    options.required = required;
                                    return Validation[method](test.value, options);
                                }).then((result) => {
                                    Object.keys(test.result).forEach((key) => {
                                        expect(result[key]).toEqual(test.result[key]);
                                    });
                                    done();
                                });
                            });
                        });
                    } else {
                        it(method + ' - ' + test.title, (done) => {
                            Promise.try(() => {
                                return Validation[method](test.value, test.options);
                            }).then((result) => {
                                Object.keys(test.result).forEach((key) => {
                                    expect(result[key]).toEqual(test.result[key]);
                                });
                                done();
                            });
                        });
                    }
                });
            });
        }

        // FLOATS
        (function () {
            const emptyValues = [
                    {
                        title: 'empty string',
                        value: '',
                        options: { required: false },
                        result: {
                            isValid: true,
                            diagnosis: 'optional-empty',
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
                            diagnosis: 'optional-empty',
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
                            diagnosis: 'optional-empty',
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
                            diagnosis: 'required-missing',
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
                            diagnosis: 'required-missing',
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
                            diagnosis: 'required-missing',
                            errorMessage: 'value is required',
                            value: null,
                            parsedValue: undefined,
                        },
                    },
                ],
                acceptableFormatTests = [
                    {
                        title: 'integer format',
                        value: '42',
                        options: {},
                        result: {
                            isValid: true,
                            diagnosis: 'valid',
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
                            diagnosis: 'valid',
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
                            diagnosis: 'valid',
                            errorMessage: undefined,
                            value: '42e2',
                            parsedValue: 42e2,
                        },
                    },
                ],
                badValueTests = [
                    {
                        title: 'string of chars',
                        value: 'abc',
                        options: {},
                        result: {
                            isValid: false,
                            diagnosis: 'invalid',
                            errorMessage: 'value must be numeric',
                            value: 'abc',
                            parsedValue: undefined,
                        },
                    },
                ],
                typeTests = [
                    {
                        title: 'validate undefined',
                        value: undefined,
                        options: {},
                        result: {
                            isValid: false,
                            diagnosis: 'invalid',
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
                            diagnosis: 'invalid',
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
                            diagnosis: 'invalid',
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
                            diagnosis: 'invalid',
                            errorMessage: 'value must be a string (it is of type "object")',
                            value: new Date(0),
                            parsedValue: undefined,
                        },
                    },
                    // could go on..
                ],
                validateRangeTests = [
                    {
                        title: 'value over max',
                        value: '123.45',
                        options: {
                            max_float: 100,
                        },
                        result: {
                            isValid: false,
                            diagnosis: 'invalid',
                            errorMessage: 'the maximum value for this parameter is 100',
                            value: '123.45',
                            parsedValue: undefined,
                        },
                    },
                    {
                        title: 'value under min',
                        value: '5',
                        options: {
                            min_float: 10,
                        },
                        result: {
                            isValid: false,
                            diagnosis: 'invalid',
                            errorMessage: 'the minimum value for this parameter is 10',
                            value: '5',
                            parsedValue: undefined,
                        },
                    },
                    {
                        title: 'within range',
                        value: '5.5',
                        options: {
                            min_float: 0,
                            max_float: 10,
                        },
                        result: {
                            isValid: true,
                            diagnosis: 'valid',
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
                            diagnosis: 'invalid',
                            errorMessage: 'value must be a finite float',
                            value: 'Infinity',
                            parsedValue: undefined,
                        },
                    },
                ],
                tests = [
                    emptyValues,
                    acceptableFormatTests,
                    badValueTests,
                    typeTests,
                    validateRangeTests,
                ];

            runTests('validateFloatString', tests);
        })();

        // INTS
        (function () {
            const emptyValues = [
                    {
                        title: 'empty string',
                        value: '',
                        options: { required: false },
                        result: {
                            isValid: true,
                            diagnosis: 'optional-empty',
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
                            diagnosis: 'optional-empty',
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
                            diagnosis: 'optional-empty',
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
                            diagnosis: 'required-missing',
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
                            diagnosis: 'required-missing',
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
                            diagnosis: 'required-missing',
                            errorMessage: 'value is required',
                            value: null,
                            parsedValue: undefined,
                        },
                    },
                ],
                acceptableFormatTests = [
                    {
                        title: 'integer format',
                        value: '42',
                        options: {},
                        result: {
                            isValid: true,
                            diagnosis: 'valid',
                            errorMessage: undefined,
                            value: '42',
                            parsedValue: 42,
                        },
                    },
                ],
                badValueTests = [
                    {
                        title: 'string of chars',
                        value: 'abc',
                        options: {},
                        result: {
                            isValid: false,
                            diagnosis: 'invalid',
                            errorMessage: 'Invalid integer format',
                            value: 'abc',
                            parsedValue: undefined,
                        },
                    },
                    {
                        title: 'decmial format',
                        value: '42.12',
                        options: {},
                        result: {
                            isValid: false,
                            diagnosis: 'invalid',
                            errorMessage: 'Invalid integer format',
                            value: '42.12',
                            parsedValue: undefined,
                        },
                    },
                ],
                typeTests = [
                    {
                        title: 'validate undefined',
                        value: undefined,
                        options: {},
                        result: {
                            isValid: false,
                            diagnosis: 'invalid',
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
                            diagnosis: 'invalid',
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
                            diagnosis: 'invalid',
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
                            diagnosis: 'invalid',
                            errorMessage: 'value must be a string (it is of type "object")',
                            value: new Date(0),
                            parsedValue: undefined,
                        },
                    },
                    // could go on..
                ],
                tests = [emptyValues, acceptableFormatTests, badValueTests, typeTests];

            runTests('validateIntString', tests);
        })();

        // STRINGS
        (function () {
            const emptyValues = [
                    {
                        title: 'empty string',
                        value: '',
                        options: { required: false },
                        result: {
                            isValid: true,
                            diagnosis: 'optional-empty',
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
                            diagnosis: 'optional-empty',
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
                            diagnosis: 'optional-empty',
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
                            diagnosis: 'required-missing',
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
                            diagnosis: 'required-missing',
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
                            diagnosis: 'required-missing',
                            errorMessage: 'value is required',
                            value: null,
                            parsedValue: undefined,
                        },
                    },
                ],
                acceptableFormatTests = [
                    {
                        title: 'string format',
                        value: '42',
                        options: {},
                        result: {
                            isValid: true,
                            diagnosis: 'valid',
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
                            diagnosis: 'valid',
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
                            diagnosis: 'valid',
                            errorMessage: undefined,
                            value: 'uniîcodé',
                            parsedValue: 'uniîcodé',
                        },
                    },
                ],
                badValueTests = [],
                typeTests = [
                    {
                        title: 'validate undefined',
                        value: undefined,
                        options: {},
                        result: {
                            isValid: false,
                            diagnosis: 'invalid',
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
                            diagnosis: 'invalid',
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
                            diagnosis: 'invalid',
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
                            diagnosis: 'invalid',
                            errorMessage: 'value must be a string (it is of type "object")',
                            value: new Date(0),
                            parsedValue: undefined,
                        },
                    },
                    // could go on..
                ],
                tests = [emptyValues, acceptableFormatTests, badValueTests, typeTests];

            runTests('validateTextString', tests);
        })();

        // ObjectReferenceName

        // validateSet
        (function () {
            const testCases = [
                {
                    title: 'undefined all the way',
                    value: undefined,
                    options: {},
                    result: {
                        isValid: true,
                        diagnosis: 'optional-empty',
                    },
                },
                {
                    title: 'undefined, not required',
                    value: undefined,
                    options: { required: false },
                    result: {
                        isValid: true,
                        diagnosis: 'optional-empty',
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
                        diagnosis: 'required-missing',
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
                        diagnosis: 'invalid',
                    },
                },
            ];

            testCases.forEach((testCase) => {
                it('validateSet - ' + testCase.title, () => {
                    const result = Validation.validateSet(testCase.value, testCase.options);
                    Object.keys(testCase.result).forEach((key) => {
                        expect(testCase.result[key]).toEqual(result[key]);
                    });
                });
            });
        })();

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
                            diagnosis: 'invalid',
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
                                diagnosis: 'required-missing',
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
                                    diagnosis: 'optional-empty',
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
                            diagnosis: 'invalid',
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
                            diagnosis: 'valid',
                        },
                    };
                });

            const testCases = [nonStringCases, emptyStringCases, badStringCases, goodStringCases];
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
                            diagnosis: 'invalid',
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
                                diagnosis: 'required-missing',
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
                                    diagnosis: 'optional-empty',
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
                            diagnosis: 'invalid',
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
                            diagnosis: 'valid',
                        },
                    };
                });

            const testCases = [nonStringCases, emptyStringCases, badStringCases, goodStringCases];
            runTests('validateWorkspaceObjectRef', testCases);
        })();

        (function () {
            const nonStringValues = [1, 0, -1, undefined, [], {}],
                nonStringCases = nonStringValues.map((value) => {
                    return {
                        title: 'non string - ' + value,
                        value: value,
                        options: {},
                        result: {
                            isValid: false,
                            errorMessage:
                                'value must be a string (it is of type "' + typeof value + '")',
                            diagnosis: 'invalid',
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
                                diagnosis: 'required-missing',
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
                                    diagnosis: 'optional-empty',
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
                            diagnosis: 'invalid',
                        },
                    };
                }),
                goodStringValues = [
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
                goodStringCases = goodStringValues.map((value) => {
                    return {
                        title: 'good string - ' + value,
                        value: value,
                        options: {},
                        result: {
                            isValid: true,
                            diagnosis: 'valid',
                        },
                    };
                });

            const testCases = [nonStringCases, emptyStringCases, badStringCases, goodStringCases];
            runTests('validateBoolean', testCases);
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
                            diagnosis: 'invalid',
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
                                diagnosis: 'required-missing',
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
                                    diagnosis: 'optional-empty',
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
                            diagnosis: 'invalid',
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
                            diagnosis: 'invalid',
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
                            diagnosis: 'invalid',
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
                            diagnosis: 'invalid',
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
                            diagnosis: 'valid',
                            parsedValue: value.trim(),
                        },
                    };
                });

            const testCases = [
                nonStringCases,
                emptyStringCases,
                spacedStringCases,
                intStringCases,
                invalidCharCases,
                tooLongCase,
                goodStringCases,
            ];
            runTests('validateText', testCases);
            runTests('validateWorkspaceObjectName', testCases); // covers all but the case where we have to see if the object exists
        })();

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
                                diagnosis: 'optional-empty',
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
                                    diagnosis: 'required-missing',
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
                            diagnosis: 'valid',
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
                            diagnosis: 'invalid',
                            errorMessage: 'Value not in the set',
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
                            diagnosis: 'valid',
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
                            diagnosis: 'invalid',
                            errorMessage: 'value must be an array',
                        },
                    };
                });

            const testCases = [
                emptySetCases,
                populatedOkCases,
                populatedFailCases,
                populatedNoopCase,
                notArrayCases,
            ];
            runTests('validateTextSet', testCases);
            runTests('validateStringSet', testCases);
        })();
    });
});
