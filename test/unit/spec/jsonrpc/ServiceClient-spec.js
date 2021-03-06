define(['jsonrpc/ServiceClient', 'narrativeConfig'], (ServiceClient, NarrativeConfig) => {
    'use strict';
    describe('Test ServiceClient', () => {
        it('Creates a minimal client, does not call it', () => {
            const url = NarrativeConfig.config.urls.catalog;
            const client = new ServiceClient({
                url,
                module: 'Catalog',
                version: null,
                timeout: 1000,
            });
            expect(client).toBeDefined();
        });
    });
});
