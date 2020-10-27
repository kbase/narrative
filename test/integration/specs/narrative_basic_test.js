/*global describe, it, browser, expect, beforeEach $*/
const Utils = require('../wdioUtils');

describe('Narrative tree page with login', () => {
    'use strict';

    beforeEach(async () => await Utils.login());

    it('opens a narrative', async () => {
        await browser.url(Utils.makeURL('narrative/31932'));
        const loadingBlocker = await $('#kb-loading-blockerxxx');
        const loadingText = await loadingBlocker.getText();
        expect(loadingText).toContain('Connecting to KBase services...');
    });
});
