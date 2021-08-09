define(['jsonrpc/1.1/errors', './helpers'], (errors, helpers) => {
    'use strict';

    const {
        ClientError,
        ClientRequestError,
        ClientParseError,
        ClientAbortError,
        ClientResponseError,
    } = errors;

    const { expectErrorBehavior } = helpers;

    describe('In the JSONR-RPC 1.1 errors module', () => {
        it('a ClientError instance should be constructable, contain the provided properties, and create valid JSON', () => {
            expectErrorBehavior(ClientError, 'ClientError', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
            });
        });

        // ClientRequestError

        it('a ClientRequestError instance should be constructable, contain the provided properties, and create valid JSON', () => {
            expectErrorBehavior(ClientRequestError, 'ClientRequestError', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
            });
        });

        // Parse error

        it('should be able to construct a ClientParseError', () => {
            expectErrorBehavior(ClientParseError, 'ClientParseError', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
                responseCode: 123,
                responseText: 'foo',
            });
        });

        // ClientTimeoutError

        it('should be able to construct a ClientAbortError', () => {
            expectErrorBehavior(ClientAbortError, 'ClientAbortError', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
                timeout: 1,
                elapsed: 2,
                status: 'none',
            });
        });

        // ClientResponseError

        it('should be able to construct a ClientResponseError', () => {
            const error = new ClientResponseError('Test Message', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
                responseCode: 200,
            });
            expect(error).toBeDefined();
            expect(error.name).toEqual('ClientResponseError');
        });

        it('a ClientResponseError instance should be able to produce a JSON-compatible simple object', () => {
            const error = new ClientResponseError('Test Message', {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
                responseCode: 200,
            });
            const json = error.toJSON();
            expect(json).toBeDefined();
            for (const key of ['url', 'method', 'originalMessage', 'responseCode']) {
                expect(json[key]).toEqual(error[key]);
            }
        });

        // ClientParseError

        it('should be able to construct a ClientParseError', () => {
            const props = {
                url: 'https://foo.boo.com',
                method: 'method',
                params: { param1: 'value1' },
                originalMessage: 'original message',
                responseCode: 200,
                responseText: 'some bad response',
            };
            const error = new ClientParseError('Test Message', props);
            expect(error).toBeDefined();
            expect(error.name).toEqual('ClientParseError');
            for (const [key, value] of Object.entries(props)) {
                expect(error[key]).toEqual(value);
            }
        });

        // ClientMethodError

        // Errors

        // Construction errors

        // ClientError

        it('should throw if constructed without a "url"', () => {
            function noURL() {
                new ClientError('Test Message', {
                    method: 'method',
                });
            }
            expect(noURL).toThrowError(
                TypeError,
                'the "url" property is required in the second constructor argument'
            );
        });

        it('should throw if constructed without a "method"', () => {
            function noMethod() {
                new ClientError('Test Message', {
                    url: 'https://foo.boo.com',
                });
            }
            expect(noMethod).toThrowError(
                TypeError,
                'the "method" property is required in the second constructor argument'
            );
        });

        // ClientTimeoutError

        it('should throw if constructed without a "timeout" parameter', () => {
            function noTimeout() {
                new ClientAbortError('Test Message', {
                    url: 'https://foo.boo.com',
                    method: 'method',
                    params: { param1: 'value1' },
                    originalMessage: 'original message',
                    elapsed: 2,
                    status: 'none',
                });
            }
            expect(noTimeout).toThrowError(
                TypeError,
                'the "timeout" property is required in the second constructor argument'
            );
        });

        it('should throw if constructed without an "elapsed" parameter', () => {
            function noElapsed() {
                new ClientAbortError('Test Message', {
                    url: 'https://foo.boo.com',
                    method: 'method',
                    params: { param1: 'value1' },
                    originalMessage: 'original message',
                    timeout: 1,
                    status: 'none',
                });
            }
            expect(noElapsed).toThrowError(
                TypeError,
                'the "elapsed" property is required in the second constructor argument'
            );
        });

        it('should throw if constructed without a "status" parameter', () => {
            function noElapsed() {
                new ClientAbortError('Test Message', {
                    url: 'https://foo.boo.com',
                    method: 'method',
                    params: { param1: 'value1' },
                    originalMessage: 'original message',
                    timeout: 1,
                    elapsed: 2,
                });
            }
            expect(noElapsed).toThrowError(
                TypeError,
                'the "status" property is required in the second constructor argument'
            );
        });

        // ClientResponseError

        it('should throw if constructed without an "responseCode" parameter', () => {
            function noResponseCode() {
                new ClientResponseError('Test Message', {
                    url: 'https://foo.boo.com',
                    method: 'method',
                    params: { param1: 'value1' },
                    originalMessage: 'original message',
                });
            }
            expect(noResponseCode).toThrowError(
                TypeError,
                'the "responseCode" property is required in the second constructor argument'
            );
        });

        // ClientParseError

        it('should throw if constructed without an "responseText" parameter', () => {
            function noResponseCode() {
                new ClientParseError('Test Message', {
                    url: 'https://foo.boo.com',
                    method: 'method',
                    params: { param1: 'value1' },
                    originalMessage: 'original message',
                    responseCode: 400,
                });
            }
            expect(noResponseCode).toThrowError(
                TypeError,
                'the "responseText" property is required in the second constructor argument'
            );
        });
    });
});
