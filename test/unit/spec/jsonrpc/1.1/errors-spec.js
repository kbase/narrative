define(['jsonrpc/1.1/errors'], (errors) => {
    'use strict';

    const {
        JSONRPCError,
        JSONRPCRequestError,
        JSONRPCTimeoutError,
        JSONRPCResponseError,
        JSONRPCMethodError,
    } = errors;

    describe('The JSONR-RPC 1.1 errors', () => {
        // JSONRPCError

        it('should be constructable without crashing', () => {
            // this should crash, fix it!
            const error = new JSONRPCError('Test Message', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
            });
            expect(error).toBeDefined();
        });

        it('a JSONRPCError instance should be able to produce a JSON-compatible simple object', () => {
            // this should crash, fix it!
            const error = new JSONRPCError('Test Message', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
            });
            const json = error.toJSON();
            expect(json).toBeDefined();
            for (const key of ['url', 'method', 'originalMessage']) {
                expect(json[key]).toEqual(error[key]);
            }
        });

        // JSONRPCRequestError

        it('should be able to construct a general JSONRPCRequestError', () => {
            // this should crash, fix it!
            const error = new JSONRPCRequestError('Test Message', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
            });
            expect(error).toBeDefined();
            expect(error.name).toEqual('JSONRPCRequestError');
        });

        // JSONRPCTimeoutError

        it('should be able to construct a JSONRPCTimeoutError', () => {
            // this should crash, fix it!
            const error = new JSONRPCTimeoutError('Test Message', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
                timeout: 1,
                elapsed: 2,
            });
            expect(error).toBeDefined();
            expect(error.name).toEqual('JSONRPCRequestError');
        });

        it('a JSONRPCTimeoutError instance should be able to produce a JSON-compatible simple object', () => {
            // this should crash, fix it!
            const error = new JSONRPCTimeoutError('Test Message', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
                timeout: 1,
                elapsed: 2,
            });
            const json = error.toJSON();
            expect(json).toBeDefined();
            for (const key of ['url', 'method', 'originalMessage', 'timeout', 'elapsed']) {
                expect(json[key]).toEqual(error[key]);
            }
        });

        // JSONRPCResponseError

        it('should be able to construct a JSONRPCResponseError', () => {
            // this should crash, fix it!
            const error = new JSONRPCResponseError('Test Message', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
                statusCode: 200,
            });
            expect(error).toBeDefined();
            expect(error.name).toEqual('JSONRPCResponseError');
        });

        it('a JSONRPCResponseError instance should be able to produce a JSON-compatible simple object', () => {
            // this should crash, fix it!
            const error = new JSONRPCResponseError('Test Message', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
                statusCode: 200,
            });
            const json = error.toJSON();
            expect(json).toBeDefined();
            for (const key of ['url', 'method', 'originalMessage', 'statusCode']) {
                expect(json[key]).toEqual(error[key]);
            }
        });

        // JSONRPCMethodError

        it('should be able to construct a JSONRPCMethodError', () => {
            // this should crash, fix it!
            const error = new JSONRPCMethodError('Test Message', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
                statusCode: 200,
                error: {
                    name: 'JSONRPCError',
                    message: 'service error',
                    code: 123,
                    error: 'an error string',
                },
            });
            expect(error).toBeDefined();
            expect(error.name).toEqual('JSONRPCMethodError');
        });

        it('a JSONRPCMethodError instance should be able to produce a JSON-compatible simple object', () => {
            // this should crash, fix it!
            const error = new JSONRPCMethodError('Test Message', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
                statusCode: 200,
                error: {
                    name: 'JSONRPCError',
                    message: 'service error',
                    code: 123,
                    error: 'an error string',
                },
            });
            const json = error.toJSON();
            expect(json).toBeDefined();
            for (const key of ['url', 'method', 'originalMessage', 'statusCode', 'error']) {
                expect(json[key]).toEqual(error[key]);
            }
            for (const key of ['name', 'message', 'code', 'error']) {
                expect(json.error[key]).toEqual(error.error[key]);
            }
        });

        // Errors

        // Construction errors
        it('should throw if constructed without a url', () => {
            // this should crash, fix it!
            function noURL() {
                new JSONRPCError('Test Message', {
                    method: 'method',
                    params: { param1: 'value1' },
                    originalMessage: 'original message',
                });
            }
            expect(noURL).toThrow();
        });

        it('should throw if constructed without a method', () => {
            // this should crash, fix it!
            function noURL() {
                new JSONRPCError('Test Message', {
                    url: 'https://foo.boo.com',
                    params: { param1: 'value1' },
                    originalMessage: 'original message',
                });
            }
            expect(noURL).toThrow();
        });

        it('should throw if constructed without a "timeout" parameter', () => {
            // this should crash, fix it!
            function noURL() {
                new JSONRPCTimeoutError('Test Message', {
                    url: 'https://foo.boo.com',
                    method: 'method',
                    params: { param1: 'value1' },
                    originalMessage: 'original message',
                    elapsed: 2,
                });
            }
            expect(noURL).toThrow();
        });

        it('should throw if constructed without an "elapsed" parameter', () => {
            // this should crash, fix it!
            function noElapsed() {
                new JSONRPCTimeoutError('Test Message', {
                    url: 'https://foo.boo.com',
                    method: 'method',
                    params: { param1: 'value1' },
                    originalMessage: 'original message',
                    timeout: 1,
                });
            }
            expect(noElapsed).toThrow();
        });

        it('should throw if constructed without an "statusCode" parameter', () => {
            // this should crash, fix it!
            function noStatusCode() {
                new JSONRPCResponseError('Test Message', {
                    url: 'https://foo.boo.com',
                    method: 'method',
                    params: { param1: 'value1' },
                    originalMessage: 'original message',
                });
            }
            expect(noStatusCode).toThrow();
        });

        it('should throw if constructed without an "error" parameter', () => {
            // this should crash, fix it!
            function noError() {
                new JSONRPCMethodError('Test Message', {
                    url: 'https://foo.boo.com',
                    method: 'method',
                    params: { param1: 'value1' },
                    originalMessage: 'original message',
                    statusCode: 200,
                });
            }
            expect(noError).toThrow();
        });

        it('should throw if constructed with a bad "error" parameter', () => {
            // this should crash, fix it!
            function noError() {
                new JSONRPCMethodError('Test Message', {
                    url: 'https://foo.boo.com',
                    method: 'method',
                    params: { param1: 'value1' },
                    originalMessage: 'original message',
                    statusCode: 200,
                    error: false,
                });
            }
            expect(noError).toThrow();
        });

        it('should throw if constructed with properties missing from the "error" parameter', () => {
            // this should crash, fix it!
            const params = {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
                statusCode: 200,
            };
            const error = {
                name: 'JSONRPCError',
                message: 'service error',
                code: 123,
                error: 'an error string',
            };
            const keys = Object.keys(error);

            function errorMissingKey(removeKey) {
                return () => {
                    const newParams = Object.assign({}, params);
                    const newError = Object.assign({}, keys);
                    delete newError[removeKey];
                    newParams.error = newError;
                    new JSONRPCMethodError('Test Message', newParams);
                };
            }
            for (const key of keys) {
                expect(errorMissingKey(key)).toThrow();
            }
        });
    });
});
