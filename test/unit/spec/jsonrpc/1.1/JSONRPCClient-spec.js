define(['../../util/mswUtils', 'jsonrpc/1.1/JSONRPCClient', 'jsonrpc/1.1/errors'], (mswUtils, jsonrpc, errors) => {
    'use strict';

    const { setupListener, setupTextListener, waitFor } = mswUtils;
    const { JSONRPCClient } = jsonrpc;

    describe('The JSONRPCClient', () => {
        it('should be able to construct a minimal client', () => {
            // this should crash, fix it!
            const client = new JSONRPCClient({
                url: 'foo',
                module: 'bar',
                timeout: 1000,
            });
            expect(client).toBeDefined();
        });

        // This tests a simple request/response, not necessarily the form
        // that KBase uses ordinarily (which is more complex, so we leave
        // for later tests.)
        it('should be able to make a request and get a response', async () => {
            const url = '/services/Module';

            const listener = await setupListener(url, (req) => {
                return {
                    version: '1.1',
                    id: req.body.id,
                    result: {
                        bar: 'foo',
                    },
                };
            });

            const constructorParams = {
                url,
                timeout: 1000,
            };
            // worker.printHandlers();
            const params = [
                {
                    param1: 'value',
                },
            ];
            const client = new JSONRPCClient(constructorParams);
            const result = await client.request({
                method: 'function',
                params,
            });
            expect(result).toEqual({ bar: 'foo' });
            await listener.stop();
        });

        // More complex, KBase-style with all possible param types.
        it('should be able to perform a a KBase-style request', async () => {
            const url = '/services/Module';

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

            const worker = await setupListener(url, (req) => {
                return {
                    version: '1.1',
                    id: req.body.id,
                    result: rpcResult,
                };
            });

            const constructorParams = {
                url,
                timeout: 1000,
            };
            // worker.printHandlers();
            const client = new JSONRPCClient(constructorParams);
            const result = await client.request({ method: 'function', params });
            expect(result).toEqual(rpcResult);
            await worker.stop();
        });

        it('should be able to make a request with no params', async () => {
            const url = '/services/Module';

            const listener = await setupListener(url, (req) => {
                return {
                    version: '1.1',
                    id: req.body.id,
                    result: {
                        bar: 'foo',
                    },
                };
            });

            const constructorParams = {
                url,
                timeout: 1000,
            };
            const client = new JSONRPCClient(constructorParams);
            const result = await client.request({ method: 'function' });
            expect(result).toEqual({ bar: 'foo' });
            await listener.stop();
        });

        it('should be able to make a request with authorization', async () => {
            const url = '/services/Module';

            const listener = await setupListener(url, (req) => {
                if (req.headers.get('authorization') !== 'token') {
                    return {
                        version: '1.1',
                        id: req.body.id,
                        error: {
                            message: 'No authorization',
                        },
                    };
                }
                return {
                    version: '1.1',
                    id: req.body.id,
                    result: {
                        bar: 'foo',
                    },
                };
            });

            const constructorParams = {
                url,
                timeout: 1000,
                authorization: 'token',
            };
            const client = new JSONRPCClient(constructorParams);
            const result = await client.request({
                method: 'function',
            });
            expect(result).toEqual({ bar: 'foo' });
            await listener.stop();
        });

        // // Handle errors

        it('making a client without a "timeout" constructor param should throw an error', () => {
            function noTimeout() {
                return new JSONRPCClient({
                    url: 'https://mock.kbase.us/services/Module/function',
                });
            }
            expect(noTimeout).toThrow();
        });

        it('making a client without a "url" constructor param should throw an error', () => {
            function noURL() {
                return new JSONRPCClient({
                    timeout: 1000,
                });
            }
            expect(noURL).toThrow();
        });

        it('making a request without a method should throw', async () => {
            const url = '/services/Module';

            const listener = await setupListener(url, (req) => {
                return {
                    version: '1.1',
                    id: req.body.id,
                    result: {
                        bar: 'foo',
                    },
                };
            });

            const constructorParams = {
                url,
                timeout: 1000,
            };
            const client = new JSONRPCClient(constructorParams);
            function noMethod() {
                return client.request({});
            }
            await expectAsync(noMethod()).toBeRejected();
            await listener.stop();
        });

        // Timeout
        it('a timeout should trigger an exception', async () => {
            const url = '/services/Module';

            const listener = await setupListener(url, async (req) => {
                await waitFor(2000);
                return {
                    version: '1.1',
                    id: req.body.id,
                    result: {
                        bar: 'foo',
                    },
                };
            });

            const constructorParams = {
                url,
                timeout: 1000,
            };
            const client = new JSONRPCClient(constructorParams);
            function shouldTimeout() {
                return client.request({ method: 'function' });
            }
            await expectAsync(shouldTimeout()).toBeRejected();
            await listener.stop();
        });

        it('aborting before timeout should trigger an exception', async () => {
            const url = '/services/Module';

            const listener = await setupListener(url, async (req) => {
                await waitFor(2000);
                return {
                    version: '1.1',
                    id: req.body.id,
                    result: {
                        bar: 'foo',
                    },
                };
            });

            const constructorParams = {
                url,
                timeout: 1000,
            };
            const client = new JSONRPCClient(constructorParams);
            function shouldAbort() {
                const responsePromise = client.request({ method: 'function' });
                client.cancelPending();
                return responsePromise;
            }
            await expectAsync(shouldAbort()).toBeRejected();
            await listener.stop();
        });

        it('returning non-json response should throw', async () => {
            const url = '/services/Module';

            const listener = await setupTextListener(url, () => {
                return 'foobar';
            });

            const constructorParams = {
                url,
                timeout: 1000,
            };
            const client = new JSONRPCClient(constructorParams);
            function shouldAbort() {
                return client.request({ method: 'function' }).catch((err) => {
                    throw err;
                });
            }
            await expectAsync(shouldAbort()).toBeRejected();
            await listener.stop();
        });

        it('no id in response in strict mode should throw', async () => {
            const url = '/services/Module';

            const listener = await setupListener(url, () => {
                return {
                    version: '1.1',
                    result: {
                        bar: 'foo',
                    },
                };
            });

            const constructorParams = {
                url,
                timeout: 1000,
            };
            const client = new JSONRPCClient(constructorParams);
            function noMethod() {
                return client.request({ method: 'foo' });
            }
            await expectAsync(noMethod()).toBeRejected();
            await listener.stop();
        });

        it('mismatching id in response in strict mode should throw', async () => {
            const url = '/services/Module';

            const listener = await setupListener(url, () => {
                return {
                    version: '1.1',
                    id: 'abc',
                    result: {
                        bar: 'foo',
                    },
                };
            });

            const constructorParams = {
                url,
                timeout: 1000,
            };
            const client = new JSONRPCClient(constructorParams);
            function noMethod() {
                return client.request({ method: 'foo' });
            }
            await expectAsync(noMethod()).toBeRejected();
            await listener.stop();
        });

        it('no version in the response should throw', async () => {
            const url = '/services/Module';

            const listener = await setupListener(url, (req) => {
                return {
                    id: req.body.id,
                    result: {
                        bar: 'foo',
                    },
                };
            });

            const constructorParams = {
                url,
                timeout: 1000,
            };
            const client = new JSONRPCClient(constructorParams);
            function noMethod() {
                return client.request({ method: 'foo' });
            }
            await expectAsync(noMethod()).toBeRejected();
            await listener.stop();
        });

        it('a version other than "1.1" in the response should throw', async () => {
            const url = '/services/Module';

            const listener = await setupListener(url, (req) => {
                return {
                    version: '1.0',
                    id: req.body.id,
                    result: {
                        bar: 'foo',
                    },
                };
            });

            const constructorParams = {
                url,
                timeout: 1000,
            };
            const client = new JSONRPCClient(constructorParams);
            function noMethod() {
                return client.request({ method: 'foo' });
            }
            await expectAsync(noMethod()).toBeRejected();
            await listener.stop();
        });

        // Actual JSON RPC error conditions.
        it('method returning an error should throw', async () => {
            const url = '/services/Module';

            const listener = await setupListener(url, (req) => {
                return {
                    version: '1.1',
                    id: req.body.id,
                    error: {
                        name: 'JSONRPCError',
                        code: 123,
                        message: 'Error message',
                        error: 'some stack trace'
                    },
                };
            });

            const constructorParams = {
                url,
                timeout: 1000,
            };
            const client = new JSONRPCClient(constructorParams);

            async function returnsError() {
                try {
                    await client.request({ method: 'foo' });
                } catch (ex) {
                    if (ex instanceof errors.JSONRPCMethodError) {
                        if (ex.error.message !== 'Error message') {
                            return false;
                        }
                        if (ex.error.code !== 123) {
                            return false;
                        }

                        return true;
                    }
                }
                return false;
            }

            await expectAsync(returnsError()).toBeResolvedTo(true);

            await listener.stop();
        });

        it('neither a result or a error should throw', async () => {
            const url = '/services/Module';

            const listener = await setupListener(url, (req) => {
                return {
                    version: '1.1',
                    id: req.body.id,
                };
            });

            const constructorParams = {
                url,
                timeout: 1000,
            };
            const client = new JSONRPCClient(constructorParams);
            function noResultOrError() {
                return client.request({ method: 'foo' });
            }
            await expectAsync(noResultOrError()).toBeRejectedWithError(
                errors.JSONRPCResponseError,
                '"result" or "error" property required in response'
            );
            await listener.stop();
        });

        it('both a result and a error should throw', async () => {
            const url = '/services/Module';

            const listener = await setupListener(url, (req) => {
                return {
                    version: '1.1',
                    id: req.body.id,
                    result: 'foo',
                    error: 'bar',
                };
            });

            const constructorParams = {
                url,
                timeout: 1000,
            };
            const client = new JSONRPCClient(constructorParams);
            function noResultOrError() {
                return client.request({ method: 'foo' });
            }
            await expectAsync(noResultOrError()).toBeRejectedWithError(
                errors.JSONRPCResponseError,
                'only one of "result" or "error" property may be provided in the response'
            );
            await listener.stop();
        });
    });
});
