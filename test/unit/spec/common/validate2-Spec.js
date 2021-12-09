define([
    'bluebird',
    'common/validation',
    'widgets/appWidgets2/validators/int',
    'widgets/appWidgets2/validators/resolver',
    'testUtil',
], (Promise, Validation, IntValidation, ValidationResolver, TestUtil) => {
    'use strict';

    describe('Validator2 core functions', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
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

        it('Validate a simple string without constraints', (done) => {
            wrap(Validation.validateTextString('test', {})).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('Validate a simple string required and supplied', (done) => {
            wrap(
                Validation.validateTextString('test', {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('Validate a simple string, required, empty string', (done) => {
            wrap(
                Validation.validateTextString('', {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('Validate a simple string, required, null', (done) => {
            wrap(
                Validation.validateTextString(null, {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('Validate a simple string, min and max length, within range', (done) => {
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
        it('Validate a simple string, min and max length, below', (done) => {
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
        it('Validate a simple string, min and max length, above range', (done) => {
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

        // INTEGER
        it('Validate an integer without constraints', (done) => {
            const spec = {
                data: {
                    constraints: {},
                },
            };
            wrap(IntValidation.validate(42, spec)).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('Validate an integer, required, valid value', (done) => {
            const spec = {
                data: {
                    constraints: {
                        required: true,
                    },
                },
            };
            wrap(IntValidation.validate(42, spec)).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('Validate an integer, required, empty string value', (done) => {
            const spec = {
                data: {
                    constraints: {
                        required: true,
                    },
                },
            };
            wrap(IntValidation.validate('', spec)).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('Validate an integer, required, null value', (done) => {
            const spec = {
                data: {
                    constraints: {
                        required: true,
                    },
                },
            };
            wrap(IntValidation.validate(null, spec)).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('Validate an integer, required, NaN value', (done) => {
            const spec = {
                data: {
                    constraints: {
                        required: true,
                    },
                },
            };
            wrap(IntValidation.validate(0 / 0, spec)).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('Validate an integer, required, float value', (done) => {
            const spec = {
                data: {
                    constraints: {
                        required: true,
                    },
                },
            };
            wrap(IntValidation.validate(1.23, spec)).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('Validate an integer, required, range given, within range', (done) => {
            const spec = {
                data: {
                    constraints: {
                        required: true,
                        min_int: 5,
                        max_int: 10,
                    },
                },
            };
            wrap(IntValidation.validate(7, spec)).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('Validate an integer, required, range given, below range', (done) => {
            const spec = {
                data: {
                    constraints: {
                        required: true,
                        min_int: 5,
                        max_int: 10,
                    },
                },
            };
            wrap(IntValidation.validate(3, spec)).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('Validate an integer, required, range given, above range', (done) => {
            const spec = {
                data: {
                    constraints: {
                        required: true,
                        min_int: 5,
                        max_int: 10,
                    },
                },
            };
            wrap(IntValidation.validate(24, spec)).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('Validate an integer, required, range given, wrong type (date)', (done) => {
            const spec = {
                data: {
                    constraints: {
                        required: true,
                        min_int: 5,
                        max_int: 10,
                    },
                },
            };
            wrap(IntValidation.validate(new Date(), spec)).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });

        // FLOAT
        it('Validate a float without constraints', (done) => {
            wrap(Validation.validateFloatString('42.12', {})).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('Validate a bad without constraints', (done) => {
            wrap(Validation.validateFloatString('x', {})).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('Validate an empty without constraints', (done) => {
            wrap(Validation.validateFloatString('', {})).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('Validate a float string, required', (done) => {
            wrap(
                Validation.validateFloatString('42.12', {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(true);
                done();
            });
        });
        it('Validate an empty string, required', (done) => {
            wrap(
                Validation.validateFloatString('', {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('Validate an empty string, required', (done) => {
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
        it('Validate an undefined, required', (done) => {
            wrap(
                Validation.validateFloatString(undefined, {
                    required: true,
                })
            ).then((result) => {
                expect(result.isValid).toEqual(false);
                done();
            });
        });
        it('Validate an array, required', (done) => {
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
                    it(test.title, (done) => {
                        ValidationResolver.validate(test.value, test.spec).then((result) => {
                            Object.keys(test.result).forEach((key) => {
                                expect(result[key]).toEqual(test.result[key]);
                            });
                            done();
                        });
                    });
                });
            });
        }

        // INTS
        (function () {
            const emptyValues = [
                    {
                        title: 'empty string',
                        value: null,
                        spec: {
                            data: {
                                type: 'int',
                                constraints: {
                                    required: false,
                                },
                            },
                        },
                        result: {
                            isValid: true,
                            diagnosis: 'optional-empty',
                            errorMessage: undefined,
                        },
                    },
                ],
                acceptableFormatTests = [
                    {
                        title: 'integer format',
                        value: 42,
                        spec: {
                            data: {
                                type: 'int',
                                constraints: {
                                    required: false,
                                },
                            },
                        },
                        result: {
                            isValid: true,
                            diagnosis: 'valid',
                            errorMessage: undefined,
                        },
                    },
                ],
                badValueTests = [
                    {
                        title: 'string of chars',
                        value: 'abc',
                        spec: {
                            data: {
                                type: 'int',
                                constraints: {
                                    required: false,
                                },
                            },
                        },
                        result: {
                            isValid: false,
                            diagnosis: 'invalid',
                            errorMessage: 'value must be numeric',
                        },
                    },
                ],
                tests = [emptyValues, acceptableFormatTests, badValueTests];

            runTests('validateIntString', tests);
        })();
    });
});
