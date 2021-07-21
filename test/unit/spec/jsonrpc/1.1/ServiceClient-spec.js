define(['../../util/mswUtils', 'jsonrpc/1.1/ServiceClient'], (mswUtils, ServiceClient) => {
    'use strict';

    const { setupListener, waitFor } = mswUtils;

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
            const url = '/services/Module';

            // We need to set up the listener for the RPC sub-layer.
            const listener = await setupListener(url, (req) => {
                if (req.headers.get('authorization') !== 'token') {
                    return {
                        version: '1.1',
                        id: req.body.id,
                        error: {
                            message: 'Authorization required'
                        }
                    }
                }
                return {
                    version: '1.1',
                    id: req.body.id,
                    result: [
                        {
                            bar: 'foo',
                        },
                    ],
                };
            });

            const constructorParams = {
                url,
                module: 'Module',
                timeout: 1000,
                token: 'token'
            };
            // worker.printHandlers();
            const params = {
                param1: 'value',
            };
            const client = new ServiceClient(constructorParams);
            const result = await client.callFunc('function', {params});
            expect(result).toEqual({ bar: 'foo' });
            await listener.stop();
        });

        // call normal service endpoint, params, success
        it('should be able to make a request and get a response', async () => {
            const url = '/services/Module';

            // We need to set up the listener for the RPC sub-layer.
            const listener = await setupListener(url, (req) => {
                return {
                    version: '1.1',
                    id: req.body.id,
                    result: [
                        {
                            bar: 'foo',
                        },
                    ],
                };
            });

            const constructorParams = {
                url,
                module: 'Module',
                timeout: 1000,
            };
            // worker.printHandlers();
            const params = {
                param1: 'value',
            };
            const client = new ServiceClient(constructorParams);
            const result = await client.callFunc('function', {params});
            expect(result).toEqual({ bar: 'foo' });
            await listener.stop();
        });

        // call parameter-less service endpoint
        it('should be able to make a request without params and get a response', async () => {
            const url = '/services/Module';

            // We need to set up the listener for the RPC sub-layer.
            const listener = await setupListener(url, (req) => {
                return {
                    version: '1.1',
                    id: req.body.id,
                    result: [
                        {
                            bar: 'foo',
                        },
                    ],
                };
            });

            const constructorParams = {
                url,
                module: 'Module',
                timeout: 1000,
            };

            const client = new ServiceClient(constructorParams);
            const result = await client.callFunc('function');
            expect(result).toEqual({ bar: 'foo' });
            await listener.stop();
        });

        // call endpoint which returns error
        it('a response with an error should throw', async () => {
            const url = '/services/Module';

            // We need to set up the listener for the RPC sub-layer.
            const listener = await setupListener(url, (req) => {
                return {
                    version: '1.1',
                    id: req.body.id,
                    error: [
                        {
                            message: 'foo',
                        },
                    ],
                };
            });

            const constructorParams = {
                url,
                module: 'Module',
                timeout: 1000,
            };

            const client = new ServiceClient(constructorParams);
            const shouldThrow = () => {
                return client.callFunc('function');
            };
            
            await expectAsync(shouldThrow()).toBeRejected();
            await listener.stop();
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
                module: 'Module',
                timeout: 1000,
            };

            const client = new ServiceClient(constructorParams);
            const shouldTimeout = () => {
                return  client.callFunc('function');
            };
            
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
            await listener.stop();
        });

        // TODO: More error cases to cover.
        // - trigger and detect many internal JSON-RPC errors.
    });
});
