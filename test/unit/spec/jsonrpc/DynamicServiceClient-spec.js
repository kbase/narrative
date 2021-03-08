/*jslint white: true*/
define(['jsonrpc/DynamicServiceClient', 'narrativeConfig'], (
    DynamicServiceClient,
    NarrativeConfig
) => {
    'use strict';
    describe('Test DynamicServiceClient', () => {
        it('Creates a minimal client, does not call it', () => {
            const url = NarrativeConfig.config.urls.catalog;
            const client = new DynamicServiceClient({
                url,
                module: 'Catalog',
                version: null,
                timeout: 1000,
            });
            expect(client).toBeDefined();
        });
    });
});
