define([
    'testUtils/mswUtils',
    'jsonrpc/1.1/JSONRPCClient',
    'jsonrpc/1.1/errors',
    'jsonrpc/1.1/jsonrpcErrors',
    './helpers',
], (mswUtils, JSONRPCClient, errors, jsonrpcErrors, helpers) => {
    'use strict';
    const { MockWorker } = mswUtils;
    const { makeJSONRPCClient, makeResponse, makeErrorResponse, URL } = helpers;

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
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeResponse(rpc, {
                    bar: 'foo',
                });
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
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeResponse(rpc, rpcResult);
            });

            const client = makeJSONRPCClient();
            const result = await client.request({ method: 'function', params });
            expect(result).toEqual(rpcResult);
            mock.done();
        });

        it('should be able to make a request with no params', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeResponse(rpc, {
                    bar: 'foo',
                });
            });

            const client = makeJSONRPCClient();
            const result = await client.request({ method: 'function' });
            expect(result).toEqual({ bar: 'foo' });
            mock.done();
        });

        it('should be able to make a request with authorization', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (req, _res, rpc) => {
                if (req.headers.get('authorization') !== 'token') {
                    return makeErrorResponse(rpc, {
                        code: 100,
                        message: 'No authorization',
                    });
                }

                return makeResponse(rpc, {
                    bar: 'foo',
                });
            });

            const client = makeJSONRPCClient({
                extraArgs: [['authorization', 'token']],
            });
            const result = await client.request({
                method: 'function',
            });
            expect(result).toEqual({ bar: 'foo' });
            mock.done();
        });

        // // Handle errors

        it('making a client without a "timeout" constructor param should throw an error', () => {
            function noTimeout() {
                return makeJSONRPCClient({ extraArgs: ['timeout'] });
            }

            expect(noTimeout).toThrow();
        });

        it('making a client without a "url" constructor param should throw an error', () => {
            function noURL() {
                return makeJSONRPCClient({ extraArgs: ['url'] });
            }

            expect(noURL).toThrow();
        });

        it('making a request without a method should throw', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeResponse(rpc, {
                    bar: 'foo',
                });
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
            mock.useJSONResponder(
                URL,
                (_req, _res, rpc) => {
                    return makeResponse(rpc, {
                        bar: 'foo',
                    });
                },
                {
                    delay: 100,
                }
            );

            const client = makeJSONRPCClient({ extraArgs: { timeout: 1 } });

            function shouldTimeout() {
                return client.request({ method: 'function' });
            }

            await expectAsync(shouldTimeout()).toBeRejected();
            mock.done();
        });

        it('aborting before timeout should trigger an exception', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(
                URL,
                (_req, _res, rpc) => {
                    return makeResponse(rpc, {
                        bar: 'foo',
                    });
                },
                {
                    delay: 200,
                }
            );

            const client = makeJSONRPCClient({ extraArgs: { timeout: 3000 } });

            function shouldAbort() {
                const responsePromise = client.request({ method: 'function' });
                client.cancelPending();
                return responsePromise;
            }

            await expectAsync(shouldAbort()).toBeRejected();
            mock.done();
        });

        // Simulate network disconnection?

        it('a network error should trigger an exception', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (_req, res) => {
                return res.networkError('Failed to connect');
            });

            const client = makeJSONRPCClient();

            function shouldFail() {
                return client.request({ method: 'function' });
            }

            try {
                await shouldFail();
                fail('Expected to fail');
            } catch (ex) {
                expect(ex).toBeInstanceOf(errors.ClientRequestError);
                expect(ex.message).toEqual('Network error');
                // Can't predict what the original error message was,
                // it does not appear to be documented in the fetch standard.
            }
        });

        // Other error conditions

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
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeResponse(
                    rpc,
                    {
                        bar: 'foo',
                    },
                    { replace: ['id'] }
                );
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
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeResponse(
                    rpc,
                    {
                        bar: 'foo',
                    },
                    { replace: [['id', 'abc']] }
                );
            });

            const client = makeJSONRPCClient({ extraArgs: { strict: true } });

            function noMethod() {
                return client.request({ method: 'foo' });
            }

            await expectAsync(noMethod()).toBeRejected();
            mock.done();
        });

        it('no version in the response should throw', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeResponse(
                    rpc,
                    {
                        bar: 'foo',
                    },
                    { replace: ['version'] }
                );
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
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeResponse(
                    rpc,
                    {
                        bar: 'foo',
                    },
                    { replace: [['version', '1.0']] }
                );
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
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeErrorResponse(rpc, {
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
                    if (ex instanceof jsonrpcErrors.JSONRPCApplicationError) {
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

        it('a plain text response should throw a parse error', async () => {
            const mock = await new MockWorker().start();
            mock.useTextResponder(URL, () => {
                return 'foo';
            });

            const client = makeJSONRPCClient({ extraArgs: { strict: true } });

            function noID() {
                return client.request({ method: 'foo' });
            }

            await expectAsync(noID()).toBeRejectedWithError(
                errors.ClientParseError,
                'Error parsing response'
            );
            mock.done();
        });

        it('neither a result or a error should throw', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeResponse(
                    rpc,
                    {
                        bar: 'foo',
                    },
                    { replace: ['result'] }
                );
            });

            const client = makeJSONRPCClient();

            function noResultOrError() {
                return client.request({ method: 'foo' });
            }

            await expectAsync(noResultOrError()).toBeRejectedWithError(
                jsonrpcErrors.JSONRPCResponseError,
                '"result" or "error" property required in response'
            );
            mock.done();
        });

        it('both a result and an error should throw', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeResponse(
                    rpc,
                    {
                        bar: 'foo',
                    },
                    { replace: [['error', 'foo']] }
                );
            });

            const client = makeJSONRPCClient();

            function noResultOrError() {
                return client.request({ method: 'foo' });
            }

            await expectAsync(noResultOrError()).toBeRejectedWithError(
                jsonrpcErrors.JSONRPCResponseError,
                'only one of "result" or "error" property may be provided in the response'
            );
            mock.done();
        });

        // Client errors
        it('a response without an id but an id is in the request should return an error', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeResponse(
                    rpc,
                    {
                        bar: 'foo',
                    },
                    { replace: ['id'] }
                );
            });

            const client = makeJSONRPCClient({ extraArgs: { strict: true } });

            function noID() {
                return client.request({ bar: 'foo' });
            }

            await expectAsync(noID()).toBeRejectedWithError(
                jsonrpcErrors.JSONRPCResponseError,
                '"id" missing in response'
            );
            mock.done();
        });

        it('a response without an id yet the error is parse error should not return an error', async () => {
            const codes = [
                [-32700], // Parse error
                [-32600], // Invalid request error
            ];
            const client = makeJSONRPCClient({ extraArgs: { strict: true } });
            const expectedResult = { method: 'foo' };
            function noID() {
                return client.request(expectedResult);
            }
            for (const [code] of codes) {
                const mock = await new MockWorker().start();
                mock.useJSONResponder(URL, (_req, _res, rpc) => {
                    return makeErrorResponse(
                        rpc,
                        {
                            name: 'JSONRPCError',
                            code,
                            message: 'Some error',
                        },
                        { replace: ['id'] }
                    );
                });

                await expectAsync(noID()).toBeRejected();

                mock.done();
            }
        });

        it('a response without an id but not in strict mode should not return an error', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeResponse(
                    rpc,
                    {
                        bar: 'foo',
                    },
                    { replace: ['id'] }
                );
            });

            const client = makeJSONRPCClient({ extraArgs: { strict: false } });

            function noID() {
                return client.request({ method: 'foo' });
            }

            await expectAsync(noID()).toBeResolved();
            mock.done();
        });

        it('a response without an id and an id is absent the request should not return an error', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeResponse(
                    rpc,
                    {
                        bar: 'foo',
                    },
                    { replace: ['id'] }
                );
            });

            const client = makeJSONRPCClient({ extraArgs: { strict: true } });

            function noID() {
                return client.request({ method: 'foo', omitId: true });
            }

            await expectAsync(noID()).toBeResolved();
            mock.done();
        });
    });
});
