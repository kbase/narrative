/*global describe, it, browser, expect, $*/
const Utils = require('../wdioUtils');

describe('Narrative tree page with login', () => {
    'use strict';

    it('opens a narrative', async () => {
        await Utils.login();
        await browser.url(Utils.makeURL('narrative/31932'));
        const loadingBlocker = await $('#kb-loading-blocker');
        const loadingText = await loadingBlocker.getText();
        expect(loadingText).toContain('Connecting to KBase services...');
    });
});
