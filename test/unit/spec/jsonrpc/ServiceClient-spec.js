/*global describe, it, expect*/
/*jslint white: true*/
define([
    'jsonrpc/ServiceClient',
    'narrativeConfig',
    'testUtil',
], (
    ServiceClient,
    NarrativeConfig,
    // testUtil
) => {
    'use strict';
    describe('Test ServiceClient', () => {
        it('Creates a minimal client, does not call it', () => {
            const url = NarrativeConfig.config.urls.catalog;
            const client = new ServiceClient({
                url,
                module: 'Catalog',
                version: null,
                timeout: 1000
            });
            expect(client).toBeDefined();
        });
    });


});