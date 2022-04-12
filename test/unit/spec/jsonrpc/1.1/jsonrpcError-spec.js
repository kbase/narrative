define(['jsonrpc/1.1/jsonrpcErrors', './helpers'], (jsonrpcErrors, helpers) => {
    'use strict';

    const {
        JSONRPCError,
        JSONRPCParseError,
        JSONRPCInvalidRequestError,
        JSONRPCMethodNotFoundError,
        JSONRPCInvalidParamsError,
        JSONRPCInternalError,
        JSONRPCServerError,
        JSONRPCApplicationError,
        JSONRPCUnknownError,
        responseError,
    } = jsonrpcErrors;

    const { expectJSONRPCErrorBehavior } = helpers;

    describe('In the JSONR-RPC 1.1 jsonrpceErrors module', () => {
        it('a JSONRPCError instance should be constructable, contain the provided properties, and create valid JSON', () => {
            expectJSONRPCErrorBehavior(JSONRPCError, 'JSONRPCError', 123, {
                error: {
                    code: 123,
                    message: 'an error message',
                    error: 'error detail',
                },

                url: 'a url',
                method: 'a method',
                params: { some: 'param' },
            });
        });

        it('a JSONRPCParseError instance should be constructable, contain the provided properties, and create valid JSON', () => {
            expectJSONRPCErrorBehavior(JSONRPCParseError, 'JSONRPCParseError', -32700, {
                error: {
                    message: 'an error message',
                    error: 'error detail',
                },

                url: 'a url',
                method: 'a method',
                params: { some: 'param' },
            });
        });
        it('a JSONRPCInvalidRequestError instance should be constructable, contain the provided properties, and create valid JSON', () => {
            expectJSONRPCErrorBehavior(
                JSONRPCInvalidRequestError,
                'JSONRPCInvalidRequestError',
                -32600,
                {
                    error: {
                        message: 'an error message',
                        error: 'error detail',
                    },

                    url: 'a url',
                    method: 'a method',
                    params: { some: 'param' },
                }
            );
        });
        it('a JSONRPCMethodNotFoundError instance should be constructable, contain the provided properties, and create valid JSON', () => {
            expectJSONRPCErrorBehavior(
                JSONRPCMethodNotFoundError,
                'JSONRPCMethodNotFoundError',
                -32601,
                {
                    error: {
                        message: 'an error message',
                        error: 'error detail',
                    },

                    url: 'a url',
                    method: 'a method',
                    params: { some: 'param' },
                }
            );
        });
        it('a JSONRPCInvalidParamsError instance should be constructable, contain the provided properties, and create valid JSON', () => {
            expectJSONRPCErrorBehavior(
                JSONRPCInvalidParamsError,
                'JSONRPCInvalidParamsError',
                -32602,
                {
                    error: {
                        message: 'an error message',
                        error: 'error detail',
                    },

                    url: 'a url',
                    method: 'a method',
                    params: { some: 'param' },
                }
            );
        });
        it('a JSONRPCInternalError instance should be constructable, contain the provided properties, and create valid JSON', () => {
            expectJSONRPCErrorBehavior(JSONRPCInternalError, 'JSONRPCInternalError', -32603, {
                error: {
                    message: 'an error message',
                    error: 'error detail',
                },

                url: 'a url',
                method: 'a method',
                params: { some: 'param' },
            });
        });
        it('a JSONRPCServerError instance should be constructable, contain the provided properties, and create valid JSON', () => {
            expectJSONRPCErrorBehavior(JSONRPCServerError, 'JSONRPCServerError', -32000, {
                error: {
                    code: -32000,
                    message: 'an error message',
                    error: 'error detail',
                },

                url: 'a url',
                method: 'a method',
                params: { some: 'param' },
            });
        });
        it('a JSONRPCApplicationError instance should be constructable, contain the provided properties, and create valid JSON', () => {
            expectJSONRPCErrorBehavior(JSONRPCApplicationError, 'JSONRPCApplicationError', 100, {
                error: {
                    code: 100,
                    message: 'an error message',
                    error: 'error detail',
                },

                url: 'a url',
                method: 'a method',
                params: { some: 'param' },
            });
        });
        it('a JSONRPCApplicationError instance should be constructable, contain the provided properties, and create valid JSON', () => {
            expectJSONRPCErrorBehavior(JSONRPCApplicationError, 'JSONRPCApplicationError', 100, {
                error: {
                    code: 100,
                    message: 'an error message',
                    error: 'error detail',
                },

                url: 'a url',
                method: 'a method',
                params: { some: 'param' },
            });
        });
        it('a JSONRPCUnknownError instance should be constructable, contain the provided properties, and create valid JSON', () => {
            expectJSONRPCErrorBehavior(JSONRPCUnknownError, 'JSONRPCUnknownError', -32701, {
                error: {
                    code: -32701,
                    message: 'an error message',
                    error: 'error detail',
                },

                url: 'a url',
                method: 'a method',
                params: { some: 'param' },
            });
        });

        it('a JSONRPCUnknownError instance should be constructable if error.code is valid', () => {
            const goodCodes = [
                -32100, // on the upper range
                -32101, // one below the upper range
                -32768, // on the lower range
                -32767, // one above the lower range
            ];
            const constructorPropsTemplate = {
                error: {
                    code: null,
                    message: 'an error',
                },

                method: 'a method',
                url: 'https://foo.boo.com',
            };
            for (const goodCode of goodCodes) {
                const constructorProps = Object.assign({}, constructorPropsTemplate);
                constructorProps.error.code = goodCode;
                expectJSONRPCErrorBehavior(
                    JSONRPCUnknownError,
                    'JSONRPCUnknownError',
                    goodCode,
                    constructorProps
                );
            }
        });

        // Now we turn to the "responseError" utility function, which converts a JSON-RPC error response into the
        // corresponding exception.

        it('can construct the correct error for a given JSON-RPC error response', () => {
            const response = {
                version: '1.1',
                error: {
                    message: 'An Error',
                    error: 'the error detail',
                },
            };
            const info = {
                url: 'a url',
                method: 'a method',
                params: { some: 'param' },
            };
            const testCases = [
                {
                    codes: [-32700],
                    classObject: JSONRPCParseError,
                    name: 'JSONRPCParseError',
                },
                {
                    codes: [-32600],
                    classObject: JSONRPCInvalidRequestError,
                    name: 'JSONRPCInvalidRequestError',
                },
                {
                    codes: [-32601],
                    classObject: JSONRPCMethodNotFoundError,
                    name: 'JSONRPCMethodNotFoundError',
                },
                {
                    codes: [-32602],
                    classObject: JSONRPCInvalidParamsError,
                    name: 'JSONRPCInvalidParamsError',
                },
                {
                    codes: [-32603],
                    classObject: JSONRPCInternalError,
                    name: 'JSONRPCInternalError',
                },
                {
                    codes: [
                        -32000, // on the upper bound
                        -32001, // one less than the upper bound
                        -32099, // on the lower bound
                        -32098, // one greater than the lower bound
                    ],
                    classObject: JSONRPCServerError,
                    name: 'JSONRPCServerError',
                },
                {
                    codes: [
                        -31999, // one greater than the upper bound
                        -31998, // two greater than the upper bound
                        -32769, // one less than the lower bound
                        -32770, // two less than the lower bound
                    ],
                    classObject: JSONRPCApplicationError,
                    name: 'JSONRPCApplicationError',
                },
                {
                    codes: [
                        -32100, // on the upper bound
                        -32101, // one less than the upper bound
                        -32768, // on the lower bound
                        -32767, // one greater than the lower bound
                    ],
                    classObject: JSONRPCUnknownError,
                    name: 'JSONRPCUnknownError',
                },
            ];

            for (const { codes, classObject, name } of testCases) {
                const thisResponse = Object.assign({}, response);
                for (const code of codes) {
                    thisResponse.error.code = code;
                    const errorObject = responseError(response, info);
                    expect(errorObject.error.code).toEqual(code);
                    expect(errorObject).toBeInstanceOf(classObject);
                    expect(errorObject.name).toEqual(name);
                }
            }
        });

        // Errors

        // Constructor errors

        // Test missing required Constructor parameters.

        it('should throw if constructed without a "url"', () => {
            function noURL() {
                new JSONRPCError('Test Message', {
                    error: {
                        code: 123,
                        message: 'an error message',
                    },

                    method: 'a method',
                });
            }
            expect(noURL).toThrow();
        });

        it('should throw if constructed without a "method"', () => {
            function noMethod() {
                new JSONRPCError('Test Message', {
                    error: {
                        code: 123,
                        message: 'an error message',
                    },

                    url: 'https://foo.boo.com',
                });
            }
            expect(noMethod).toThrow();
        });

        it('should throw if constructed without a "code"', () => {
            function noMethod() {
                new JSONRPCError('Test Message', {
                    error: {
                        message: 'an error message',
                    },

                    method: 'a method',
                    url: 'https://foo.boo.com',
                });
            }
            expect(noMethod).toThrow();
        });

        it('should throw if constructed without a "message"', () => {
            function noMethod() {
                new JSONRPCError('Test Message', {
                    error: {
                        code: 123,
                    },

                    method: 'a method',
                    url: 'https://foo.boo.com',
                });
            }
            expect(noMethod).toThrow();
        });

        // Test present but optional constructor params (missing optional above.)
        it('should have the "name" if in the error response', () => {
            const errorName = 'JSONRPCError';
            const errorObject = new JSONRPCError('Test Message', {
                error: {
                    name: errorName,
                    code: 123,
                    message: 'an error',
                },

                method: 'a method',
                url: 'https://foo.boo.com',
            });
            expect(errorObject.error.name).toEqual(errorName);
        });

        it('should have the "error" if in the error response', () => {
            const errorErrors = [
                'an\nerror',
                1,
                null,
                true,
                false,
                ['an', 'error'],
                { an: 'error' },
            ];
            for (const errorError of errorErrors) {
                const errorObject = new JSONRPCError('Test Message', {
                    error: {
                        error: errorError,
                        code: 123,
                        message: 'an error',
                    },

                    method: 'a method',
                    url: 'https://foo.boo.com',
                });
                expect(errorObject.error.error).toEqual(errorError);
            }
        });

        // Error conditions involving using the wrong error code for those
        // exceptions (modeling JSON-RPC error code classes) which operate over
        // a range.
        it('should throw if error.code not inclusively between -32000 and -32099', () => {
            const badCodes = [
                -31999, // One under the upper bound -32000
                -31998, // two under the upper bound -32000
                -32100, // one over the lower  bound -32099
                -32101, // two over the lower bound -32099
            ];
            for (const badCode of badCodes) {
                const shouldThrow = () => {
                    new JSONRPCServerError('Test Message', {
                        error: {
                            code: badCode,
                            message: 'an error',
                        },

                        method: 'a method',
                        url: 'https://foo.boo.com',
                    });
                };

                expect(shouldThrow).toThrowError(
                    TypeError,
                    'the "code" constructor property must be between -32000 and -32099'
                );
            }
        });

        // Poke the error code boundaries for "JSONRPCUnknownError", which captures errors in the valid
        // range of JSON-RPC 2.0/1.1 error codes, but not specifically handled.

        it('should throw if error.code inclusively between -32000 and -32768, and also reserved by the spec', () => {
            const badCodes = [
                -32700, // reserved codes
                -32600,
                -32601,
                -32602,
                -32603,
            ];
            for (const badCode of badCodes) {
                const shouldThrow = () => {
                    new JSONRPCUnknownError('Test Message', {
                        error: {
                            code: badCode,
                            message: 'an error',
                        },

                        method: 'a method',
                        url: 'https://foo.boo.com',
                    });
                };

                expect(shouldThrow).toThrowError(
                    TypeError,
                    'the "code" constructor property must be not be a reserved JSON-RPC error code'
                );
            }
        });

        it('should throw if error.code not inclusively between -32000 and -32768', () => {
            const badCodes = [
                -31999, // One under the upper bound -32000
                -31998, // two under the upper bound -32000
                -32769, // one over the lower  bound -32768
                -32770, // two over the lower bound -32768
            ];
            for (const badCode of badCodes) {
                const shouldThrow = () => {
                    new JSONRPCUnknownError('Test Message', {
                        error: {
                            code: badCode,
                            message: 'an error',
                        },

                        method: 'a method',
                        url: 'https://foo.boo.com',
                    });
                };

                expect(shouldThrow).toThrowError(
                    TypeError,
                    'the "code" constructor property must be between -32000 and -32768'
                );
            }
        });

        // Poke JSONRPCApplicationError error code boundaries; they must fall outside of the
        // range -32000 and -32768.

        it('should throw if error.code not inclusively between -32000 and -32768', () => {
            const badCodes = [
                -32000, // on the upper bound
                -32001, // one under the upper bound
                -32768, // one on the lower bound
                -32766, // one above the lower bound
            ];
            for (const badCode of badCodes) {
                const shouldThrow = () => {
                    new JSONRPCApplicationError('Test Message', {
                        error: {
                            code: badCode,
                            message: 'an error',
                        },

                        method: 'a method',
                        url: 'https://foo.boo.com',
                    });
                };

                expect(shouldThrow).toThrowError(
                    TypeError,
                    'the "code" constructor property must not be within the reserved inclusive range -32000 to -32768'
                );
            }
        });
    });
});
