define(['jsonrpc/JSON-RPC_1.1', 'narrativeConfig', 'testUtil'], (
    JSONRPC,
    NarrativeConfig,
    testUtil
) => {
    'use strict';
    const { request, JSONRPCMethodError, JSONRPCError } = JSONRPC;
    describe('Test JSONRPCError', () => {
        it('Create an error object and inspect properties', () => {
            const error = new JSONRPCError('test error', {
                module: 'AModule',
                func: 'afunc',
                params: {
                    param1: 'value1',
                },
                url: 'a url',
                originalMessage: 'Original message',
            });
            expect(error.message).toEqual('test error');
            expect(error.module).toEqual('AModule');
            expect(error.func).toEqual('afunc');
            expect(error.url).toEqual('a url');
            expect(error.originalMessage).toEqual('Original message');
            expect(error.params).toEqual({
                param1: 'value1',
            });
        });
    });

    describe('Test JSONRPCMethodError', () => {
        it('Create an error object and inspect properties', () => {
            const error = new JSONRPCMethodError('test error', {
                module: 'AModule',
                func: 'afunc',
                params: {
                    param1: 'value1',
                },
                url: 'a url',
                originalMessage: 'Original message',
                error: {
                    anything: 'goes',
                    here: 123,
                },
            });
            expect(error.message).toEqual('test error');
            expect(error.module).toEqual('AModule');
            expect(error.func).toEqual('afunc');
            expect(error.url).toEqual('a url');
            expect(error.originalMessage).toEqual('Original message');
            expect(error.params).toEqual({
                param1: 'value1',
            });
            expect(error.error.anything).toEqual('goes');
            expect(error.error.here).toEqual(123);
        });
    });

    // Need to mock a jsonrpc endpoint first.
    // For now, call a well known service.
    /*
    Response from Catalog.status should be like:
    {
        "version": "1.1",
        "result": [
            {
                "state": "OK",
                "message": "",
                "version": "0.0.1",
                "git_url": "https://github.com/kbase/catalog",
                "git_commit_hash": "fda05a2962373163e4983dc5187b1c51cd1455b1"
            }
        ],
        "id": "123"
    }
    */
    describe('Test JSONRPC request function', () => {
        it('Call the status method of the Catalog service w/o options', async (done) => {
            // Get the catalog status.
            const url = NarrativeConfig.config.urls.catalog;
            try {
                const [result] = await request(url, 'Catalog', 'status', []);
                expect(result).toBeDefined();
                expect(result.state).toEqual('OK');
                expect(result.git_url).toEqual('https://github.com/kbase/catalog');
            } catch (ex) {
                expect(false).toBeTrue(
                    `Exception thrown: ${ex.message}: ${JSON.stringify(ex.toJSON())}`
                );
            } finally {
                done();
            }
        });

        it('Call the status method of the Catalog service, with token in options', async (done) => {
            // Get the catalog status.
            const url = NarrativeConfig.config.urls.catalog;
            try {
                const [result] = await request(url, 'Catalog', 'status', [], {
                    token: testUtil.getAuthToken(),
                });
                expect(result).toBeDefined();
                expect(result.state).toEqual('OK');
                expect(result.git_url).toEqual('https://github.com/kbase/catalog');
            } catch (ex) {
                expect(false).toBeTrue(
                    `Exception thrown: ${ex.message}: ${JSON.stringify(ex.toJSON())}`
                );
            } finally {
                done();
            }
        });
    });
});
