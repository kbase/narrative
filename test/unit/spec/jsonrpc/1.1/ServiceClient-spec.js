define(['../../util/mswUtils', 'jsonrpc/1.1/ServiceClient', './helpers'], (
    mswUtils,
    ServiceClient,
    helpers
) => {
    'use strict';

    const { MockWorker, waitFor } = mswUtils;
    const { makeErrorResponse, URL } = helpers;

    function makeSDKResponse(rpc, result) {
        const defaultResult = [
            {
                bar: 'foo',
            },
        ];
        return {
            version: '1.1',
            id: rpc.id,
            result: result || defaultResult,
        };
    }

    describe('The ServiceClient', () => {
        it('should be constructable without crashing', () => {
            // this should crash, fix it!
            const client = new ServiceClient({
                url: 'foo',
                module: 'bar',
                timeout: 1,
            });
            expect(client).toBeDefined();
        });

        // Happy Paths

        // call normal service endpoint, params, success
        it('should be able to make a request with a token and get a response', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (req, _res, rpc) => {
                if (req.headers.get('authorization') !== 'token') {
                    return makeErrorResponse(req, {
                        code: 100,
                        message: 'No authorization',
                    });
                }
                return makeSDKResponse(rpc);
            });

            const constructorParams = {
                url: URL,
                module: 'Module',
                timeout: 1000,
                token: 'token',
            };
            const params = {
                param1: 'value',
            };
            const client = new ServiceClient(constructorParams);
            const result = await client.callFunc('function', { params });
            expect(result).toEqual({ bar: 'foo' });
            mock.done();
        });

        // call normal service endpoint, params, success
        it('should be able to make a request and get a response', async () => {
            // We need to set up the listener for the RPC sub-layer.
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeSDKResponse(rpc);
            });

            const constructorParams = {
                url: URL,
                module: 'Module',
                timeout: 1000,
            };
            const params = {
                param1: 'value',
            };
            const client = new ServiceClient(constructorParams);
            const result = await client.callFunc('function', { params });

            expect(result).toEqual({ bar: 'foo' });
            mock.stop();
        });

        // call parameter-less service endpoint
        it('should be able to make a request without params and get a response', async () => {
            // We need to set up the listener for the RPC sub-layer.
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeSDKResponse(rpc);
            });

            const constructorParams = {
                url: URL,
                module: 'Module',
                timeout: 1000,
            };

            const client = new ServiceClient(constructorParams);
            const result = await client.callFunc('function');
            expect(result).toEqual({ bar: 'foo' });
            mock.stop();
        });

        // call endpoint which returns error
        it('a response with an error should throw', async () => {
            // We need to set up the listener for the RPC sub-layer.
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return makeErrorResponse(rpc, {
                    code: 123,
                    message: 'Error message',
                });
            });

            const constructorParams = {
                url: URL,
                module: 'Module',
                timeout: 1000,
            };

            const client = new ServiceClient(constructorParams);
            const shouldThrow = () => {
                return client.callFunc('function');
            };

            await expectAsync(shouldThrow()).toBeRejected();
            await mock.done();
        });

        // Errors

        // construct without url
        it('making a client without a "url" constructor param should throw an error', () => {
            const constructorParams = {
                module: 'Module',
                timeout: 1000,
            };
            function noURL() {
                return new ServiceClient(constructorParams);
            }
            expect(noURL).toThrow();
        });

        // construct without module
        it('making a client without a "module" constructor param should throw an error', () => {
            const constructorParams = {
                url: 'foo',
                timeout: 1000,
            };
            function noURL() {
                return new ServiceClient(constructorParams);
            }
            expect(noURL).toThrow();
        });

        // construct without timeout
        it('making a client without a "timeout" constructor param should throw an error', () => {
            const constructorParams = {
                url: 'foo',
                module: 'Module',
            };
            function noURL() {
                return new ServiceClient(constructorParams);
            }
            expect(noURL).toThrow();
        });

        // Usage exceptions

        it('a timeout should trigger an exception', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, async (_req, _res, rpc) => {
                await waitFor(2000);
                return makeSDKResponse(rpc);
            });

            const constructorParams = {
                url: URL,
                module: 'Module',
                timeout: 1000,
            };

            const client = new ServiceClient(constructorParams);
            const shouldTimeout = () => {
                return client.callFunc('function');
            };

            await expectAsync(shouldTimeout()).toBeRejected();
            mock.done();
        });

        it('aborting before timeout should trigger an exception', async () => {
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, async (_req, _res, rpc) => {
                await waitFor(2000);
                return makeSDKResponse(rpc);
            });

            const constructorParams = {
                url: URL,
                module: 'Module',
                timeout: 1000,
            };

            const client = new ServiceClient(constructorParams);
            const shouldAbort = () => {
                const [responsePromise, cancel] = client.callFuncCancellable('function');
                cancel();
                return responsePromise;
            };

            await expectAsync(shouldAbort()).toBeRejected();
            mock.done();
        });

        // call normal service endpoint, params, success
        it('returning a non-array should throw', async () => {
            // We need to set up the listener for the RPC sub-layer.
            const mock = await new MockWorker().start();
            mock.useJSONResponder(URL, (_req, _res, rpc) => {
                return {
                    version: '1.1',
                    id: rpc.id,
                    result: 'foo',
                };
            });

            const constructorParams = {
                url: URL,
                module: 'Module',
                timeout: 1000,
            };
            const params = {
                param1: 'value',
            };
            const client = new ServiceClient(constructorParams);

            const shouldThrow = () => {
                return client.callFunc('function', { params });
            };

            await expectAsync(shouldThrow()).toBeRejected();

            mock.stop();
        });
    });
});
