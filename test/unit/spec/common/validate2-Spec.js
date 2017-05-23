/*global define,describe,it,expect*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'common/validation',
    'widgets/appWidgets2/validators/int',
    'widgets/appWidgets2/validators/resolver'
], function(Promise, Validation, IntValidation, ValidationResolver) {
    'use strict';

    describe('Props core functions', function() {
        it('Is alive', function() {
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
            return Promise.try(function() {
                return val;
            });
        }

        it('Validate a simple string without constraints', function(done) {
            wrap(Validation.validateTextString('test', {}))
                .then(function(result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('Validate a simple string required and supplied', function(done) {
            wrap(Validation.validateTextString('test', {
                    required: true
                }))
                .then(function(result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('Validate a simple string, required, empty string', function(done) {
            wrap(Validation.validateTextString('', {
                    required: true
                }))
                .then(function(result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('Validate a simple string, required, null', function(done) {
            wrap(Validation.validateTextString(null, {
                    required: true
                }))
                .then(function(result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('Validate a simple string, min and max length, within range', function(done) {
            wrap(Validation.validateTextString('hello', {
                    required: true,
                    min_length: 5,
                    max_length: 10
                }))
                .then(function(result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('Validate a simple string, min and max length, below', function(done) {
            wrap(Validation.validateTextString('hi', {
                    required: true,
                    min_length: 5,
                    max_length: 10
                }))
                .then(function(result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('Validate a simple string, min and max length, above range', function(done) {
            wrap(Validation.validateTextString('hello earthling', {
                    required: true,
                    min_length: 5,
                    max_length: 10
                }))
                .then(function(result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });

        // INTEGER 
        it('Validate an integer without constraints', function(done) {
            var spec = {
                data: {
                    constraints: {}
                }
            };
            wrap(IntValidation.validate(42, spec))
                .then(function(result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('Validate an integer, required, valid value', function(done) {
            var spec = {
                data: {
                    constraints: {
                        required: true
                    }
                }
            };
            wrap(IntValidation.validate(42, spec))
                .then(function(result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('Validate an integer, required, empty string value', function(done) {
            var spec = {
                data: {
                    constraints: {
                        required: true
                    }
                }
            };
            wrap(IntValidation.validate('', spec))
                .then(function(result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('Validate an integer, required, null value', function(done) {
            var spec = {
                data: {
                    constraints: {
                        required: true
                    }
                }
            };
            wrap(IntValidation.validate(null, spec))
                .then(function(result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('Validate an integer, required, NaN value', function(done) {
            var spec = {
                data: {
                    constraints: {
                        required: true
                    }
                }
            };
            wrap(IntValidation.validate(0 / 0, spec))
                .then(function(result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('Validate an integer, required, float value', function(done) {
            var spec = {
                data: {
                    constraints: {
                        required: true
                    }
                }
            };
            wrap(IntValidation.validate(1.23, spec))
                .then(function(result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('Validate an integer, required, range given, within range', function(done) {
            var spec = {
                data: {
                    constraints: {
                        required: true,
                        min_int: 5,
                        max_int: 10
                    }
                }
            };
            wrap(IntValidation.validate(7, spec))
                .then(function(result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('Validate an integer, required, range given, below range', function(done) {
            var spec = {
                data: {
                    constraints: {
                        required: true,
                        min_int: 5,
                        max_int: 10
                    }
                }
            };
            wrap(IntValidation.validate(3, spec))
                .then(function(result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('Validate an integer, required, range given, above range', function(done) {
            var spec = {
                data: {
                    constraints: {
                        required: true,
                        min_int: 5,
                        max_int: 10
                    }
                }
            };
            wrap(IntValidation.validate(24, spec))
                .then(function(result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('Validate an integer, required, range given, wrong type (date)', function(done) {
            var spec = {
                data: {
                    constraints: {
                        required: true,
                        min_int: 5,
                        max_int: 10
                    }
                }
            };
            wrap(IntValidation.validate(new Date(), spec))
                .then(function(result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });


        // FLOAT
        it('Validate a float without constraints', function(done) {
            wrap(Validation.validateFloatString('42.12', {}))
                .then(function(result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('Validate a bad without constraints', function(done) {
            wrap(Validation.validateFloatString('x', {}))
                .then(function(result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('Validate an empty without constraints', function(done) {
            wrap(Validation.validateFloatString('', {}))
                .then(function(result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('Validate a float string, required', function(done) {
            wrap(Validation.validateFloatString('42.12', {
                    required: true
                }))
                .then(function(result) {
                    expect(result.isValid).toEqual(true);
                    done();
                });
        });
        it('Validate an empty string, required', function(done) {
            wrap(Validation.validateFloatString('', {
                    required: true
                }))
                .then(function(result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('Validate an empty string, required', function(done) {
            wrap(Validation.validateFloatString(null, {
                    required: true
                }))
                .then(function(result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        // bad types
        it('Validate an undefined, required', function(done) {
            wrap(Validation.validateFloatString(undefined, {
                    required: true
                }))
                .then(function(result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });
        it('Validate an array, required', function(done) {
            wrap(Validation.validateFloatString([], {
                    required: true
                }))
                .then(function(result) {
                    expect(result.isValid).toEqual(false);
                    done();
                });
        });

        function runTests(method, tests) {
            tests.forEach(function(testSet) {
                testSet.forEach(function(test) {

                    it(test.title, function(done) {

                        ValidationResolver.validate(test.value, test.spec)
                            .then(function(result) {
                                Object.keys(test.result).forEach(function(key) {
                                    expect(result[key]).toEqual(test.result[key]);
                                });
                                done();
                            });
                    });
                });
            });
        }

        // function runTestsx(method, tests) {
        //     tests.forEach(function(testSet) {
        //         testSet.forEach(function(test) {




        //             if (test.options.required === undefined) {
        //                 [true, false].forEach(function(required) {
        //                     it(test.title, function(done) {
        //                         Promise.try(function() {
        //                                 return Validation[method](test.value, { required: required });
        //                             })
        //                             .then(function(result) {
        //                                 Object.keys(test.result).forEach(function(key) {
        //                                     expect(result[key]).toEqual(test.result[key]);
        //                                 });
        //                                 done();
        //                             });
        //                     });
        //                 });
        //             } else {
        //                 it(test.title, function(done) {
        //                     Promise.try(function() {
        //                             return Validation[method](test.value, { required: test.options.required });
        //                         })
        //                         .then(function(result) {
        //                             Object.keys(test.result).forEach(function(key) {
        //                                 expect(result[key]).toEqual(test.result[key]);
        //                             });
        //                             done();
        //                         });
        //                 });
        //             }
        //         });
        //     });
        // }

        // FLOATS        
        // (function() {
        //     var emptyValues = [{
        //                 title: 'empty string',
        //                 value: '',
        //                 options: { required: false },
        //                 result: {
        //                     isValid: true,
        //                     diagnosis: 'optional-empty',
        //                     errorMessage: undefined,
        //                     value: '',
        //                     parsedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'string of just spaces same as empty',
        //                 value: '   ',
        //                 options: { required: false },
        //                 result: {
        //                     isValid: true,
        //                     diagnosis: 'optional-empty',
        //                     errorMessage: undefined,
        //                     value: '   ',
        //                     parsedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'null',
        //                 value: null,
        //                 options: { required: false },
        //                 result: {
        //                     isValid: true,
        //                     diagnosis: 'optional-empty',
        //                     errorMessage: undefined,
        //                     value: null,
        //                     parsedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'empty string, required',
        //                 value: '',
        //                 options: { required: true },
        //                 result: {
        //                     isValid: false,
        //                     diagnosis: 'required-missing',
        //                     errorMessage: 'value is required',
        //                     value: '',
        //                     parsedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'string of empty spaces, required',
        //                 value: '   ',
        //                 options: { required: true },
        //                 result: {
        //                     isValid: false,
        //                     diagnosis: 'required-missing',
        //                     errorMessage: 'value is required',
        //                     value: '   ',
        //                     parsedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'null, required',
        //                 value: null,
        //                 options: { required: true },
        //                 result: {
        //                     isValid: false,
        //                     diagnosis: 'required-missing',
        //                     errorMessage: 'value is required',
        //                     value: null,
        //                     parsedValue: undefined
        //                 }
        //             }

        //         ],
        //         acceptableFormatTests = [{
        //                 title: 'integer format',
        //                 value: '42',
        //                 options: {},
        //                 result: {
        //                     isValid: true,
        //                     diagnosis: 'valid',
        //                     errorMessage: undefined,
        //                     value: '42',
        //                     parsedValue: 42
        //                 }
        //             },
        //             {
        //                 title: 'decmial format',
        //                 value: '42.12',
        //                 options: {},
        //                 result: {
        //                     isValid: true,
        //                     diagnosis: 'valid',
        //                     errorMessage: undefined,
        //                     value: '42.12',
        //                     parsedValue: 42.12
        //                 }
        //             },
        //             {
        //                 title: 'float exp format',
        //                 value: '42e2',
        //                 options: {},
        //                 result: {
        //                     isValid: true,
        //                     diagnosis: 'valid',
        //                     errorMessage: undefined,
        //                     value: '42e2',
        //                     parsedValue: 42e2
        //                 }
        //             }
        //         ],
        //         badValueTests = [{
        //             title: 'string of chars',
        //             value: 'abc',
        //             options: {},
        //             result: {
        //                 isValid: false,
        //                 diagnosis: 'invalid',
        //                 errorMessage: 'value must be numeric',
        //                 value: 'abc',
        //                 parsedValue: undefined
        //                     // message: 'value must be a string (it is of type "undefined")'
        //             }
        //         }],
        //         typeTests = [{
        //                 title: 'validate undefined',
        //                 value: undefined,
        //                 options: {},
        //                 result: {
        //                     isValid: false,
        //                     diagnosis: 'invalid',
        //                     errorMessage: 'value must be a string (it is of type "undefined")',
        //                     value: undefined,
        //                     pasedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'validate array',
        //                 value: [],
        //                 options: {},
        //                 result: {
        //                     isValid: false,
        //                     diagnosis: 'invalid',
        //                     errorMessage: 'value must be a string (it is of type "object")',
        //                     value: [],
        //                     parsedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'validate object',
        //                 value: {},
        //                 options: {},
        //                 result: {
        //                     isValid: false,
        //                     diagnosis: 'invalid',
        //                     errorMessage: 'value must be a string (it is of type "object")',
        //                     value: {},
        //                     parsedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'validate date',
        //                 value: new Date(0),
        //                 options: {},
        //                 result: {
        //                     isValid: false,
        //                     diagnosis: 'invalid',
        //                     errorMessage: 'value must be a string (it is of type "object")',
        //                     value: new Date(0),
        //                     parsedValue: undefined
        //                 }
        //             }
        //             // could go on..
        //         ],
        //         tests = [
        //             emptyValues,
        //             acceptableFormatTests,
        //             badValueTests,
        //             typeTests
        //         ];

        //     runTests('validateFloatString', tests);
        // }());

        // INTS
        (function() {
            var emptyValues = [{
                        title: 'empty string',
                        value: null,
                        spec: {
                            data: {
                                type: 'int',
                                constraints: {
                                    required: false
                                }
                            }
                        },
                        result: {
                            isValid: true,
                            diagnosis: 'optional-empty',
                            errorMessage: undefined
                        }
                    }
                    // {
                    //     title: 'string of just spaces same as empty',
                    //     value: '   ',
                    //     options: { required: false },
                    //     result: {
                    //         isValid: true,
                    //         diagnosis: 'optional-empty',
                    //         errorMessage: undefined,
                    //         value: '   ',
                    //         parsedValue: undefined
                    //     }
                    // },
                    // {
                    //     title: 'null',
                    //     value: null,
                    //     options: { required: false },
                    //     result: {
                    //         isValid: true,
                    //         diagnosis: 'optional-empty',
                    //         errorMessage: undefined,
                    //         value: null,
                    //         parsedValue: undefined
                    //     }
                    // },
                    // {
                    //     title: 'empty string, required',
                    //     value: '',
                    //     options: { required: true },
                    //     result: {
                    //         isValid: false,
                    //         diagnosis: 'required-missing',
                    //         errorMessage: 'value is required',
                    //         value: '',
                    //         parsedValue: undefined
                    //     }
                    // },
                    // {
                    //     title: 'string of empty spaces, required',
                    //     value: '   ',
                    //     options: { required: true },
                    //     result: {
                    //         isValid: false,
                    //         diagnosis: 'required-missing',
                    //         errorMessage: 'value is required',
                    //         value: '   ',
                    //         parsedValue: undefined
                    //     }
                    // },
                    // {
                    //     title: 'null, required',
                    //     value: null,
                    //     options: { required: true },
                    //     result: {
                    //         isValid: false,
                    //         diagnosis: 'required-missing',
                    //         errorMessage: 'value is required',
                    //         value: null,
                    //         parsedValue: undefined
                    //     }
                    // }

                ],
                acceptableFormatTests = [{
                    title: 'integer format',
                    value: 42,
                    spec: {
                        data: {
                            type: 'int',
                            constraints: {
                                required: false
                            }
                        }
                    },
                    result: {
                        isValid: true,
                        diagnosis: 'valid',
                        errorMessage: undefined
                    }
                }],
                badValueTests = [{
                    title: 'string of chars',
                    value: 'abc',
                    spec: {
                        data: {
                            type: 'int',
                            constraints: {
                                required: false
                            }
                        }
                    },
                    result: {
                        isValid: false,
                        diagnosis: 'invalid',
                        errorMessage: 'value must be numeric'
                    }
                }],
                // typeTests = [{
                //         title: 'validate undefined',
                //         value: undefined,
                //         options: {},
                //         result: {
                //             isValid: false,
                //             diagnosis: 'invalid',
                //             errorMessage: 'value must be a string (it is of type "undefined")',
                //             value: undefined,
                //             pasedValue: undefined
                //         }
                //     },
                //     {
                //         title: 'validate array',
                //         value: [],
                //         options: {},
                //         result: {
                //             isValid: false,
                //             diagnosis: 'invalid',
                //             errorMessage: 'value must be a string (it is of type "object")',
                //             value: [],
                //             parsedValue: undefined
                //         }
                //     },
                //     {
                //         title: 'validate object',
                //         value: {},
                //         options: {},
                //         result: {
                //             isValid: false,
                //             diagnosis: 'invalid',
                //             errorMessage: 'value must be a string (it is of type "object")',
                //             value: {},
                //             parsedValue: undefined
                //         }
                //     },
                //     {
                //         title: 'validate date',
                //         value: new Date(0),
                //         options: {},
                //         result: {
                //             isValid: false,
                //             diagnosis: 'invalid',
                //             errorMessage: 'value must be a string (it is of type "object")',
                //             value: new Date(0),
                //             parsedValue: undefined
                //         }
                //     }
                //     // could go on..
                // ],
                tests = [
                    emptyValues,
                    acceptableFormatTests,
                    badValueTests
                    // typeTests
                ];

            runTests('validateIntString', tests);
        }());

        // // STRINGS
        // (function() {
        //     var emptyValues = [{
        //                 title: 'empty string',
        //                 value: '',
        //                 options: { required: false },
        //                 result: {
        //                     isValid: true,
        //                     diagnosis: 'optional-empty',
        //                     errorMessage: undefined,
        //                     value: '',
        //                     parsedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'string of just spaces same as empty',
        //                 value: '   ',
        //                 options: { required: false },
        //                 result: {
        //                     isValid: true,
        //                     diagnosis: 'optional-empty',
        //                     errorMessage: undefined,
        //                     value: '   ',
        //                     parsedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'null',
        //                 value: null,
        //                 options: { required: false },
        //                 result: {
        //                     isValid: true,
        //                     diagnosis: 'optional-empty',
        //                     errorMessage: undefined,
        //                     value: null,
        //                     parsedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'empty string, required',
        //                 value: '',
        //                 options: { required: true },
        //                 result: {
        //                     isValid: false,
        //                     diagnosis: 'required-missing',
        //                     errorMessage: 'value is required',
        //                     value: '',
        //                     parsedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'string of empty spaces, required',
        //                 value: '   ',
        //                 options: { required: true },
        //                 result: {
        //                     isValid: false,
        //                     diagnosis: 'required-missing',
        //                     errorMessage: 'value is required',
        //                     value: '   ',
        //                     parsedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'null, required',
        //                 value: null,
        //                 options: { required: true },
        //                 result: {
        //                     isValid: false,
        //                     diagnosis: 'required-missing',
        //                     errorMessage: 'value is required',
        //                     value: null,
        //                     parsedValue: undefined
        //                 }
        //             }

        //         ],
        //         acceptableFormatTests = [{
        //                 title: 'string format',
        //                 value: '42',
        //                 options: {},
        //                 result: {
        //                     isValid: true,
        //                     diagnosis: 'valid',
        //                     errorMessage: undefined,
        //                     value: '42',
        //                     parsedValue: '42'
        //                 }
        //             },
        //             {
        //                 title: 'string format',
        //                 value: 'abc',
        //                 options: {},
        //                 result: {
        //                     isValid: true,
        //                     diagnosis: 'valid',
        //                     errorMessage: undefined,
        //                     value: 'abc',
        //                     parsedValue: 'abc'
        //                 }
        //             },
        //             {
        //                 title: 'string format',
        //                 value: 'uniîcodé',
        //                 options: {},
        //                 result: {
        //                     isValid: true,
        //                     diagnosis: 'valid',
        //                     errorMessage: undefined,
        //                     value: 'uniîcodé',
        //                     parsedValue: 'uniîcodé'
        //                 }
        //             }
        //         ],
        //         badValueTests = [],
        //         typeTests = [{
        //                 title: 'validate undefined',
        //                 value: undefined,
        //                 options: {},
        //                 result: {
        //                     isValid: false,
        //                     diagnosis: 'invalid',
        //                     errorMessage: 'value must be a string (it is of type "undefined")',
        //                     value: undefined,
        //                     pasedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'validate array',
        //                 value: [],
        //                 options: {},
        //                 result: {
        //                     isValid: false,
        //                     diagnosis: 'invalid',
        //                     errorMessage: 'value must be a string (it is of type "object")',
        //                     value: [],
        //                     parsedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'validate object',
        //                 value: {},
        //                 options: {},
        //                 result: {
        //                     isValid: false,
        //                     diagnosis: 'invalid',
        //                     errorMessage: 'value must be a string (it is of type "object")',
        //                     value: {},
        //                     parsedValue: undefined
        //                 }
        //             },
        //             {
        //                 title: 'validate date',
        //                 value: new Date(0),
        //                 options: {},
        //                 result: {
        //                     isValid: false,
        //                     diagnosis: 'invalid',
        //                     errorMessage: 'value must be a string (it is of type "object")',
        //                     value: new Date(0),
        //                     parsedValue: undefined
        //                 }
        //             }
        //             // could go on..
        //         ],
        //         tests = [
        //             emptyValues,
        //             acceptableFormatTests,
        //             badValueTests,
        //             typeTests
        //         ];

        //     runTests('validateTextString', tests);
        // }());

        // ObjectReferenceName

        // Set of Strings

        // Set of Ints

        // Set of Floats

    });


});