'use strict';
const { login } = require('../wdioUtils');
const env = process.env.ENV || 'ci';
const testData = require('./narrative_basic_data.json');
const testCases = testData.envs[env];

describe('Narrative tree page with login', () => {
    beforeEach(async () => {
        await browser.setTimeout({ pageLoad: 30000 });
        await browser.reloadSession();
        await login();
    });

    afterEach(async () => {
        await browser.deleteCookies();
    });

    it('opens a narrative', async () => {
        await browser.url(`/narrative/${testCases.CASE_1.narrativeId}`);
        const loadingBlocker = await $('#kb-loading-blocker');
        const loadingText = await loadingBlocker.getText();
        await expect(loadingText).toContain('Connecting to KBase services...');
    });
});
