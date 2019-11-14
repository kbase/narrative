/*global define,describe,it,expect*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'common/validation'
], function (Promise, Validation) {
    'use strict';

    describe('Props core functions', function () {
        it('Is alive', function () {
            var alive;
            if (Validation) {
                alive = true;
            } else {
                alive = false;
            }
            expect(alive).toBeTruthy();
        });

        // STRING

        function wrap(val) {
            return Promise.try(function () {
                return val;
            });
        }
        it('validateTextString - Validate a simple string without constraints', function () {
            expect(Validation.validateTextString('test', {}).isValid).toEqual(true);
        });

        it('validateTextString - Validate a simple string required and supplied', function () {
            const result = Validation.validateTextString('test', {
                required: true
            });
            expect(result.isValid).toEqual(true);
        });
        it('validateTextString - Validate a simple string, required, empty string', function (done) {
            wrap(Validation.validateTextString('', {
                required: true
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('validateTextString - Validate a simple string, required, null', function (done) {
            wrap(Validation.validateTextString(null, {
                required: true
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('validateTextString - Validate a simple string, min and max length, within range', function (done) {
            wrap(Validation.validateTextString('hello', {
                required: true,
                min_length: 5,
                max_length: 10
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('validateTextString - Validate a simple string, min and max length, below', function (done) {
            wrap(Validation.validateTextString('hi', {
                required: true,
                min_length: 5,
                max_length: 10
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('validateTextString - Validate a simple string, min and max length, above range', function (done) {
            wrap(Validation.validateTextString('hello earthling', {
                required: true,
                min_length: 5,
                max_length: 10
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });

        // INTEGER
        it('validateIntString - Validate an integer without constraints', function (done) {
            wrap(Validation.validateIntString('42', {}))
                .then(function (result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('validateIntString - Validate an integer, required', function (done) {
            wrap(Validation.validateIntString('42', {
                required: true
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('validateIntString - Validate an integer, required', function (done) {
            wrap(Validation.validateIntString('', {
                required: true
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('validateIntString - Validate an integer, required', function (done) {
            wrap(Validation.validateIntString(null, {
                required: true
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('validateIntString - Validate an integer, required', function (done) {
            wrap(Validation.validateIntString('7', {
                required: true,
                min_int: 5,
                max_int: 10
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('validateIntString - Validate an integer, required', function (done) {
            wrap(Validation.validateIntString('3', {
                required: true,
                min_int: 5,
                max_int: 10
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('validateIntString - Validate an integer, required', function (done) {
            wrap(Validation.validateIntString('42', {
                required: true,
                min_int: 5,
                max_int: 10
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('validateIntString - Validate an integer, wront type (int)', function (done) {
            wrap(Validation.validateIntString(42, {
                required: true,
                min_int: 5,
                max_int: 10
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });


        // FLOAT
        it('validateFloatString - Validate a float without constraints', function (done) {
            wrap(Validation.validateFloatString('42.12', {}))
                .then(function (result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('validateFloatString - Validate a bad without constraints', function (done) {
            wrap(Validation.validateFloatString('x', {}))
                .then(function (result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('validateFloatString - Validate an empty without constraints', function (done) {
            wrap(Validation.validateFloatString('', {}))
                .then(function (result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('validateFloatString - Validate a float string, required', function (done) {
            wrap(Validation.validateFloatString('42.12', {
                required: true
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('validateFloatString - Validate an empty string, required', function (done) {
            wrap(Validation.validateFloatString('', {
                required: true
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('validateFloatString - Validate an empty string, required', function (done) {
            wrap(Validation.validateFloatString(null, {
                required: true
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        // bad types
        it('validateFloatString - Validate an undefined, required', function (done) {
            wrap(Validation.validateFloatString(undefined, {
                required: true
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('validateFloatString - Validate an array, required', function (done) {
            wrap(Validation.validateFloatString([], {
                required: true
            }))
                .then(function (result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });

        function runTests(method, tests) {
            tests.forEach(function (testSet) {
                testSet.forEach(function (test) {
                    if (test.options.required === undefined) {
                        [true, false].forEach(function (required) {
                            it(method + ' - ' + test.title, function (done) {
                                Promise.try(function () {
                                    return Validation[method](test.value, {required: required});
                                })
                                    .then(function (result) {
                                        // console.log(result);
                                        Object.keys(test.result).forEach(function (key) {
                                            expect(result[key]).toEqual(test.result[key]);
                                        });
                                        done();
                                    });
                            });
                        });
                    } else {
                        it(method + ' - ' + test.title, function (done) {
                            Promise.try(function () {
                                return Validation[method](test.value, {required: test.options.required});
                            })
                                .then(function (result) {
                                    // console.log(result);
                                    Object.keys(test.result).forEach(function (key) {
                                        // console.log(key, result[key], test.result[key]);
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
            var emptyValues = [
                {
                    title: 'empty string',
                    value: '',
                    options: {required: false},
                    result: {
                        isValid: true,
                        diagnosis: 'optional-empty',
                        errorMessage: undefined,
                        value: '',
                        parsedValue: undefined
                    }
                },
                {
                    title: 'string of just spaces same as empty',
                    value: '   ',
                    options: {required: false},
                    result: {
                        isValid: true,
                        diagnosis: 'optional-empty',
                        errorMessage: undefined,
                        value: '   ',
                        parsedValue: undefined
                    }
                },
                {
                    title: 'null',
                    value: null,
                    options: {required: false},
                    result: {
                        isValid: true,
                        diagnosis: 'optional-empty',
                        errorMessage: undefined,
                        value: null,
                        parsedValue: undefined
                    }
                },
                {
                    title: 'empty string, required',
                    value: '',
                    options: {required: true},
                    result: {
                        isValid: false,
                        diagnosis: 'required-missing',
                        errorMessage: 'value is required',
                        value: '',
                        parsedValue: undefined
                    }
                },
                {
                    title: 'string of empty spaces, required',
                    value: '   ',
                    options: {required: true},
                    result: {
                        isValid: false,
                        diagnosis: 'required-missing',
                        errorMessage: 'value is required',
                        value: '   ',
                        parsedValue: undefined
                    }
                },
                {
                    title: 'null, required',
                    value: null,
                    options: {required: true},
                    result: {
                        isValid: false,
                        diagnosis: 'required-missing',
                        errorMessage: 'value is required',
                        value: null,
                        parsedValue: undefined
                    }
                }

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
                            parsedValue: 42
                        }
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
                            parsedValue: 42.12
                        }
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
                            parsedValue: 42e2
                        }
                    }
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
                            parsedValue: undefined
                                // message: 'value must be a string (it is of type "undefined")'
                        }
                    }
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
                            pasedValue: undefined
                        }
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
                            parsedValue: undefined
                        }
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
                            parsedValue: undefined
                        }
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
                            parsedValue: undefined
                        }
                    }
                    // could go on..
                ],
                tests = [
                    emptyValues,
                    acceptableFormatTests,
                    badValueTests,
                    typeTests
                ];

            runTests('validateFloatString', tests);
        }());

        // INTS
        (function () {
            var emptyValues = [
                {
                    title: 'empty string',
                    value: '',
                    options: {required: false},
                    result: {
                        isValid: true,
                        diagnosis: 'optional-empty',
                        errorMessage: undefined,
                        value: '',
                        parsedValue: undefined
                    }
                },
                {
                    title: 'string of just spaces same as empty',
                    value: '   ',
                    options: {required: false},
                    result: {
                        isValid: true,
                        diagnosis: 'optional-empty',
                        errorMessage: undefined,
                        value: '   ',
                        parsedValue: undefined
                    }
                },
                {
                    title: 'null',
                    value: null,
                    options: {required: false},
                    result: {
                        isValid: true,
                        diagnosis: 'optional-empty',
                        errorMessage: undefined,
                        value: null,
                        parsedValue: undefined
                    }
                },
                {
                    title: 'empty string, required',
                    value: '',
                    options: {required: true},
                    result: {
                        isValid: false,
                        diagnosis: 'required-missing',
                        errorMessage: 'value is required',
                        value: '',
                        parsedValue: undefined
                    }
                },
                {
                    title: 'string of empty spaces, required',
                    value: '   ',
                    options: {required: true},
                    result: {
                        isValid: false,
                        diagnosis: 'required-missing',
                        errorMessage: 'value is required',
                        value: '   ',
                        parsedValue: undefined
                    }
                },
                {
                    title: 'null, required',
                    value: null,
                    options: {required: true},
                    result: {
                        isValid: false,
                        diagnosis: 'required-missing',
                        errorMessage: 'value is required',
                        value: null,
                        parsedValue: undefined
                    }
                }

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
                            parsedValue: 42
                        }
                    }
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
                            parsedValue: undefined
                                // message: 'value must be a string (it is of type "undefined")'
                        }
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
                            parsedValue: undefined
                        }
                    }
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
                            pasedValue: undefined
                        }
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
                            parsedValue: undefined
                        }
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
                            parsedValue: undefined
                        }
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
                            parsedValue: undefined
                        }
                    }
                    // could go on..
                ],
                tests = [
                    emptyValues,
                    acceptableFormatTests,
                    badValueTests,
                    typeTests
                ];

            runTests('validateIntString', tests);
        }());

        // STRINGS
        (function () {
            var emptyValues = [
                {
                    title: 'empty string',
                    value: '',
                    options: {required: false},
                    result: {
                        isValid: true,
                        diagnosis: 'optional-empty',
                        errorMessage: undefined,
                        value: '',
                        parsedValue: undefined
                    }
                },
                {
                    title: 'string of just spaces same as empty',
                    value: '   ',
                    options: {required: false},
                    result: {
                        isValid: true,
                        diagnosis: 'optional-empty',
                        errorMessage: undefined,
                        value: '   ',
                        parsedValue: undefined
                    }
                },
                {
                    title: 'null',
                    value: null,
                    options: {required: false},
                    result: {
                        isValid: true,
                        diagnosis: 'optional-empty',
                        errorMessage: undefined,
                        value: null,
                        parsedValue: undefined
                    }
                },
                {
                    title: 'empty string, required',
                    value: '',
                    options: {required: true},
                    result: {
                        isValid: false,
                        diagnosis: 'required-missing',
                        errorMessage: 'value is required',
                        value: '',
                        parsedValue: undefined
                    }
                },
                {
                    title: 'string of empty spaces, required',
                    value: '   ',
                    options: {required: true},
                    result: {
                        isValid: false,
                        diagnosis: 'required-missing',
                        errorMessage: 'value is required',
                        value: '   ',
                        parsedValue: undefined
                    }
                },
                {
                    title: 'null, required',
                    value: null,
                    options: {required: true},
                    result: {
                        isValid: false,
                        diagnosis: 'required-missing',
                        errorMessage: 'value is required',
                        value: null,
                        parsedValue: undefined
                    }
                }

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
                            parsedValue: '42'
                        }
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
                            parsedValue: 'abc'
                        }
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
                            parsedValue: 'uniîcodé'
                        }
                    }
                ],
                badValueTests = [
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
                            pasedValue: undefined
                        }
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
                            parsedValue: undefined
                        }
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
                            parsedValue: undefined
                        }
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
                            parsedValue: undefined
                        }
                    }
                    // could go on..
                ],
                tests = [
                    emptyValues,
                    acceptableFormatTests,
                    badValueTests,
                    typeTests
                ];

            runTests('validateTextString', tests);
        }());

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
                        diagnosis: 'optional-empty'
                    }
                },
                {
                    title: 'undefined, not required',
                    value: undefined,
                    options: {required: false},
                    result: {
                        isValid: true,
                        diagnosis: 'optional-empty',
                        parsedValue: undefined,
                        errorMessage: undefined,
                        value: undefined
                    },
                },
                {
                    title: 'undefined, required',
                    value: undefined,
                    options: {required: true},
                    result: {
                        isValid: false,
                        diagnosis: 'required-missing',
                        parsedValue: undefined,
                        errorMessage: 'value is required',
                        value: undefined
                    }
                },
                {
                    title: 'boolean, required, ok',
                    value: true,
                    options: {required: true, values: [true, false]},
                    result: {
                        isValid: true,
                        parsedValue: true,
                        value: true
                    }
                },
                {
                    title: 'boolean, not required, ok',
                    value: true,
                    options: {required: false, values: [true, false]},
                    result: {
                        isValid: true,
                        parsedValue: true,
                        value: true
                    }
                },
                {
                    title: 'value not present',
                    value: 'a',
                    options: {required: false, values: ['b', 'c']},
                    result: {
                        isValid: false,
                        errorMessage: 'Value not in the set',
                        parsedValue: 'a',
                        value: 'a',
                        diagnosis: 'invalid'
                    }
                }

            ];

            testCases.forEach(function (testCase) {
                it('validateSet - ' + testCase.title, () => {
                    const result = Validation.validateSet(testCase.value, testCase.options);
                    Object.keys(testCase.result).forEach(key => {
                        expect(testCase.result[key]).toEqual(result[key]);
                    });
                });
            });
        }());

        // validate data palette object reference path
        (function () {
            const nonStringValues = [1, 0, -1, undefined, null, [], {}],
                nonStringCases = nonStringValues.map(value => {
                    return {
                        title: 'non string - ' + value,
                        value: value,
                        options: {},
                        result: {
                            isValid: false,
                            errorMessage: 'value must be a string in data reference format',
                            diagnosis: 'invalid'
                        }
                    };
                }),
                emptyStringValues = ['', ' ', '\t'],
                emptyStringCases = emptyStringValues.map((value, idx) => {
                    return {
                        title: 'empty string type ' + (idx+1) + ' - required',
                        value: value,
                        options: {required: true},
                        result: {
                            isValid: false,
                            errorMessage: 'value is required',
                            diagnosis: 'required-missing'
                        }
                    }
                }).concat(emptyStringValues.map((value, idx) => {
                    return {
                        title: 'empty string type ' + (idx+1) + ' - not required',
                        value: value,
                        options: {required: false},
                        result: {
                            isValid: true,
                            diagnosis: 'optional-empty'
                        }
                    }
                })),
                badStringValues = ['wat', '123/45/6/7', '123/456/789;123', '123/456/7;123/45/6/7'],
                badStringCases = badStringValues.map(value => {
                    return {
                        title: 'bad string - ' + value,
                        value: value,
                        options: {},
                        result: {
                            isValid: false,
                            diagnosis: 'invalid',
                            errorMessage: 'Invalid object reference path -  ( should be #/#/#;#/#/#;...)'
                        }
                    };
                }),
                goodStringValues = [
                    '1/2/3', '123/45/678', '1234567890123/4576894876498756/192387129837198237198273',
                    '1/2/3;4/5/6', '1/2;4/5/6', '1/2;3/4;5/6', '1/2/3;4/5/6;7/8/9'
                ],
                goodStringCases = goodStringValues.map(value => {
                    return {
                        title: 'good string - ' + value,
                        value: value,
                        options: {},
                        result: {
                            isValid: true,
                            diagnosis: 'valid'
                        }
                    };
                });

            const testCases = [
                nonStringCases,
                emptyStringCases,
                badStringCases,
                goodStringCases
            ];
            runTests('validateWorkspaceDataPaletteRef', testCases);
        }());

        // Set of Strings

        // Set of Ints

        // Set of Floats

    });


});
