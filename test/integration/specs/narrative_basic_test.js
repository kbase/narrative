'use strict';
const Utils = require('../wdioUtils');

const env = process.env.ENV || 'ci';

const allTestCases = {
    ci: {
        CASE1: {
            narrativeId: 31932
        }

    },
    'narrative-dev': {
        CASE1: {
            narrativeId: 78050
        }
    }
};

const testCases = allTestCases[env];

describe('Narrative tree page with login', () => {
    beforeEach(async () => await Utils.login());

    it('opens a narrative', async () => {
        await browser.url(Utils.makeURL(`narrative/${testCases.CASE1.narrativeId}`));
        const loadingBlocker = await $('#kb-loading-blocker');
        const loadingText = await loadingBlocker.getText();
        expect(loadingText).toContain('Connecting to KBase services...');
    });
});
