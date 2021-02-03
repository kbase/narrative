/*global describe, it, browser, expect, $, afterEach, beforeEach*/
/* eslint {strict: ['error', 'global']} */
'use strict';

const {login, openNarrative, clickWhenReady, waitForClass} = require('../wdioUtils.js');

// Ideally the test data should be the same, except for narrative id, in each env.
// But currently CI and prod are indexed differently.

// Note that the narrativeIds used below must be owned or shared with full rights (at least edit) with the narrativetest user.
// Note that narrativetest is not yet set up in narrative-dev/prod.
const allTestCases = {

    ci: {
        TEST_CASE_1: {
            narrativeId: 53983,
        }
    },
    'narrative-dev':  {
        TEST_CASE_1: {
            narrativeId: 78050,
        }
    }
};

const testCases = allTestCases[browser.config.testParams.ENV];


async function openDataSlideout() {
    // Open the data slideout
    const button = await $('[data-test-id="data-slideout-button"]');
    await button.waitForExist();
    await clickWhenReady(button);

    // Here we locate the public data tab, move the mouse cursor to it, and then
    // click on its container, which should open the public data panel.
    // The reason for this roundabout approach is that the click handler is on the
    // container, not the individual tabs. 
    const slideoutPanel = await $('[data-test-id="data-slideout-panel"]');
    await slideoutPanel.waitForExist();

    const tablist = await slideoutPanel.$('[role="tablist"]');
    await tablist.waitForExist();

    return slideoutPanel;
}

async function selectTab(slideoutPanel, name) {
    const tab = await slideoutPanel.$(`[data-test-id="tab-${name}"]`);
    await tab.waitForExist();
    await clickWhenReady(tab);
    // wait for tab to have the active class.
    await waitForClass(tab, 'active');



    const tabPanel = await slideoutPanel.$(`[data-test-id="panel-${name}"]`);
    await tabPanel.waitForExist();
    await waitForClass(tabPanel, 'active');
    // and wait for it to have the active class.

    return [tab, tabPanel]
}

async function selectTabByLabel(slideoutPanel, name) {
    const tab = await slideoutPanel.$(`[data-test-id="tab-${name}"]`);
    const tabLabel = await tab.$(`[data-test-id="label"]`);
    await tab.waitForExist();
    await clickWhenReady(tabLabel);
    // wait for tab to have the active class.
    await waitForClass(tab, 'active');


    const tabPanel = await slideoutPanel.$(`[data-test-id="panel-${name}"]`);
    await tabPanel.waitForExist();
    await waitForClass(tabPanel, 'active');
    // and wait for it to have the active class.

    return [tab, tabPanel]
}


describe('Tabbing within the data panel should work', () => {
    beforeEach(async () => {
        await browser.setTimeout({ 'implicit': 30000 });
        await browser.reloadSession();
    });

    afterEach(async () => {
        await browser.deleteCookies();
    });

    it('opens the "Shared With Me" tab', async () => {
        const testCase = testCases.TEST_CASE_1;
        await login();
        await openNarrative(testCase.narrativeId);
        
        const slideoutPanel = await openDataSlideout();

        const [tab, tabPanel] = await selectTab(slideoutPanel, 'sharedwithme');

        // TODO: make sure the panel content displayed correctly
    });

    it('opens the "Public" tab', async () => {
        const testCase = testCases.TEST_CASE_1;
        await login();
        await openNarrative(testCase.narrativeId);
        
        const slideoutPanel = await openDataSlideout();

        const [tab, tabPanel] = await selectTab(slideoutPanel, 'public');
        // TODO: make sure the panel content displayed correctly
    });

    it('opens the "Example" tab', async () => {
        const testCase = testCases.TEST_CASE_1;
        await login();
        await openNarrative(testCase.narrativeId);
        
        const slideoutPanel = await openDataSlideout();

        const [tab, tabPanel] = await selectTab(slideoutPanel, 'example');
        // TODO: make sure the panel content displayed correctly
    }); 

    it('opens the "Import" tab', async () => {
        const testCase = testCases.TEST_CASE_1;
        await login();
        await openNarrative(testCase.narrativeId);

        const slideoutPanel = await openDataSlideout();

        const [tab, tabPanel] = await selectTab(slideoutPanel, 'import');
        // TODO: make sure the panel content displayed correctly
    });

    it('Switches between all tabs in sequence', async () => {
        const testCase = testCases.TEST_CASE_1;
        await login();
        await openNarrative(testCase.narrativeId);

        const slideoutPanel = await openDataSlideout();

        const tabs = ['sharedwithme', 'public', 'example', 'import', 'mydata'];
        for (const tab of tabs) {
            console.log('selecting', tab);
            await selectTab(slideoutPanel, tab);
        }
    });

    it('Switches between many tabs randomly', async () => {
        const testCase = testCases.TEST_CASE_1;
        await login();
        await openNarrative(testCase.narrativeId);

        const slideoutPanel = await openDataSlideout();

        const tabs = ['sharedwithme', 'public', 'example', 'import', 'mydata'];
        for (let i = 0; i < 100; i += 1) {
            const tabIndex = Math.floor(Math.random() * tabs.length);
            await selectTab(slideoutPanel, tabs[tabIndex]);
        }
    });

    it('Switches between many tab labels randomly by clicking on the label', async () => {
        const testCase = testCases.TEST_CASE_1;
        await login();
        await openNarrative(testCase.narrativeId);

        const slideoutPanel = await openDataSlideout();

        const tabs = ['sharedwithme', 'public', 'example', 'import', 'mydata'];
        for (let i = 0; i < 100; i += 1) {
            const tabIndex = Math.floor(Math.random() * tabs.length);
            await selectTabByLabel(slideoutPanel, tabs[tabIndex]);
        }
    });

});
