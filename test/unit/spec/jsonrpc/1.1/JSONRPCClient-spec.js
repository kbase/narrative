define(['../../util/mswUtils', 'jsonrpc/1.1/JSONRPCClient', 'jsonrpc/1.1/errors', './helpers'], (
    mswUtils,
    JSONRPCClient,
    errors,
    helpers
) => {
    'use strict';
    const { MockWorker, waitFor } = mswUtils;
    const { makeJSONRPCClient, makeResponse, makeBadResponse, makeErrorResponse, URL } = helpers;

    describe('The JSONRPCClient', () => {
        it('should be able to construct a minimal client', () => {
            // this should crash, fix it!
            const client = makeJSONRPCClient();
            expect(client).toBeDefined();
        });

        // This tests a simple request/response, not necessarily the form
        // that KBase uses ordinarily (which is more complex, so we leave
        // for later tests.)
        it('should be able to make a request and get a response', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (req) => {
                return makeResponse(req);
            });
            const params = [
                {
                    param1: 'value',
                },
            ];
            const client = makeJSONRPCClient();
            const result = await client.request({
                method: 'function',
                params,
            });
            expect(result).toEqual({ bar: 'foo' });
            mock.done();
        });

        // More complex, KBase-style with all possible param types.
        it('should be able to perform a a KBase-style request', async () => {
            const params = [
                {
                    param1: 'value1',
                    param2: 1234,
                    param3: ['a', 2, { foo: 'bar' }],
                },
            ];

            const rpcResult = [
                {
                    bar: 'foo',
                    bee: 2,
                    baz: { name: 'test' },
                },
            ];

            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (req) => {
                return makeResponse(req, rpcResult);
            });

            const client = makeJSONRPCClient();
            const result = await client.request({ method: 'function', params });
            expect(result).toEqual(rpcResult);
            mock.done();
        });

        it('should be able to make a request with no params', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (req) => {
                return makeResponse(req);
            });

            const client = makeJSONRPCClient();
            const result = await client.request({ method: 'function' });
            expect(result).toEqual({ bar: 'foo' });
            mock.done();
        });

        it('should be able to make a request with authorization', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (req) => {
                if (req.headers.get('authorization') !== 'token') {
                    return makeErrorResponse(req, {
                        code: 100,
                        message: 'No authorization',
                    });
                }
                return makeResponse(req);
            });

            const client = makeJSONRPCClient([['authorization', 'token']]);
            const result = await client.request({
                method: 'function',
            });
            expect(result).toEqual({ bar: 'foo' });
            mock.done();
        });

        // // Handle errors

        it('making a client without a "timeout" constructor param should throw an error', () => {
            function noTimeout() {
                return makeJSONRPCClient(['timeout']);
            }

            expect(noTimeout).toThrow();
        });

        it('making a client without a "url" constructor param should throw an error', () => {
            function noURL() {
                return makeJSONRPCClient(['url']);
            }

            expect(noURL).toThrow();
        });

        it('making a request without a method should throw', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (req) => {
                return makeResponse(req);
            });

            const client = makeJSONRPCClient();

            function noMethod() {
                return client.request({});
            }

            await expectAsync(noMethod()).toBeRejected();
            mock.done();
        });

        // Timeout
        it('a timeout should trigger an exception', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, async (req) => {
                await waitFor(2000);
                return makeResponse(req);
            });

            const client = makeJSONRPCClient();

            function shouldTimeout() {
                return client.request({ method: 'function' });
            }

            await expectAsync(shouldTimeout()).toBeRejected();
            mock.done();
        });

        it('aborting before timeout should trigger an exception', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, async (req) => {
                await waitFor(2000);
                return makeResponse(req);
            });

            const client = makeJSONRPCClient();

            function shouldAbort() {
                const responsePromise = client.request({ method: 'function' });
                client.cancelPending();
                return responsePromise;
            }

            await expectAsync(shouldAbort()).toBeRejected();
            mock.done();
        });

        it('returning non-json response should throw', async () => {
            const mock = await new MockWorker().start();
            mock.useTextResponder(URL, () => {
                return 'foobar';
            });

            const client = makeJSONRPCClient();

            function shouldAbort() {
                return client.request({ method: 'function' }).catch((err) => {
                    throw err;
                });
            }

            await expectAsync(shouldAbort()).toBeRejected();
            mock.done();
        });

        it('no id in response in strict mode should throw', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (req) => {
                return makeBadResponse(req, { replace: ['id'] });
            });

            const client = makeJSONRPCClient();

            function noMethod() {
                return client.request({ method: 'foo' });
            }

            await expectAsync(noMethod()).toBeRejected();
            mock.done();
        });

        it('mismatching id in response in strict mode should throw', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (req) => {
                return makeBadResponse(req, { replace: [['id', 'abc']] });
            });

            const client = makeJSONRPCClient();

            function noMethod() {
                return client.request({ method: 'foo' });
            }

            await expectAsync(noMethod()).toBeRejected();
            mock.done();
        });

        it('no version in the response should throw', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (req) => {
                return makeBadResponse(req, { replace: ['version'] });
            });

            const client = makeJSONRPCClient();

            function noMethod() {
                return client.request({ method: 'foo' });
            }

            await expectAsync(noMethod()).toBeRejected();
            mock.done();
        });

        it('a version other than "1.1" in the response should throw', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (req) => {
                return makeBadResponse(req, { replace: [['version', '1.0']] });
            });

            const client = makeJSONRPCClient();

            function noMethod() {
                return client.request({ method: 'foo' });
            }

            await expectAsync(noMethod()).toBeRejected();
            mock.done();
        });

        // Actual JSON RPC error conditions.
        it('method returning an error should throw', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (req) => {
                return makeErrorResponse(req, {
                    name: 'JSONRPCError',
                    code: 123,
                    message: 'Error message',
                    error: 'some stack trace',
                });
            });

            const client = makeJSONRPCClient();

            async function returnsError() {
                try {
                    await client.request({ method: 'foo' });
                } catch (ex) {
                    if (ex instanceof errors.JSONRPCMethodError) {
                        if (ex.error.message !== 'Error message') {
                            return false;
                        }
                        return ex.error.code === 123;
                    }
                }
                return false;
            }

            await expectAsync(returnsError()).toBeResolvedTo(true);

            mock.done();
        });

        it('neither a result or a error should throw', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (req) => {
                return makeBadResponse(req, { replace: ['result'] });
            });

            const client = makeJSONRPCClient();

            function noResultOrError() {
                return client.request({ method: 'foo' });
            }

            await expectAsync(noResultOrError()).toBeRejectedWithError(
                errors.JSONRPCResponseError,
                '"result" or "error" property required in response'
            );
            mock.done();
        });

        it('both a result and an error should throw', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (req) => {
                return makeBadResponse(req, { replace: [['error', 'foo']] });
            });

            const client = makeJSONRPCClient();

            function noResultOrError() {
                return client.request({ method: 'foo' });
            }

            await expectAsync(noResultOrError()).toBeRejectedWithError(
                errors.JSONRPCResponseError,
                'only one of "result" or "error" property may be provided in the response'
            );
            mock.done();
        });
    });
});
