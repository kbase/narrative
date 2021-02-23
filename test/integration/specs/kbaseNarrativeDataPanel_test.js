'use strict';

const { login, openNarrative, clickWhenReady, waitForClass } = require('../wdioUtils.js');

// Ideally the test data should be the same, except for narrative id, in each env.
// But currently CI and prod are indexed differently.

// Note that the narrativeIds used below must be owned or shared with full rights (at least edit) with the narrativetest user.
// Note that narrativetest is not yet set up in narrative-dev/prod.
const allTestCases = {
    common: {
        randomTabs: [
            1, 4, 3, 2, 0, 1, 0, 4, 1, 4, 0, 3,
            1, 3, 4, 3, 4, 0, 2, 0, 1, 3, 2, 0,
            2, 4, 3, 0, 4, 2, 3, 2, 0, 4, 1, 0,
            1, 3, 2, 1, 4, 3, 1, 4, 1, 2, 4, 1,
            2, 1, 2, 1, 4, 2, 4, 0, 1, 3, 4, 3,
            2, 1, 2, 3, 0, 3, 1, 2, 3, 0, 1, 4,
            1, 0, 4, 0, 1, 0, 1, 4, 2, 0, 3, 4
        ],
        tabs: [{
            name: 'mydata',
            label: 'My Data'
        }, {
            name: 'sharedwithme',
            label: "Shared With Me"
        }, {
            name: 'public',
            label: 'Public'
        }, {
            name: 'example',
            label: 'Example'
        }, {
            name: 'import',
            label: 'Import'
        }]
    },
    envs: {
        ci: {
            TEST_CASE_1: {
                narrativeId: 53983
            },
        },
        'narrative-dev': {
            TEST_CASE_1: {
                narrativeId: 78050,
            }
        }
    }
};

function getTestCase(name) {
    const envCases = allTestCases.envs[browser.config.testParams.ENV];
    return Object.assign({}, allTestCases.common, envCases[name]);
}

async function openDataSlideout() {
    // Open the data slideout by clicking it's toggle buttoon
    const button = await $('[data-test-id="data-slideout-button"]');
    await button.waitForExist();
    await clickWhenReady(button);

    const slideoutPanel = await $('[data-test-id="data-slideout-panel"]');
    await slideoutPanel.waitForExist();

    const tablist = await slideoutPanel.$('[role="tablist"]');
    await tablist.waitForExist();

    return slideoutPanel;
}

async function ensureTabIsActive(slideoutPanel, name) {
    // wait for tab to have the active class.
    const tab = await slideoutPanel.$(`[data-test-id="tab-${name}"]`);
    await waitForClass(tab, 'active');

    // and wait for the panel to have the active class too.
    const tabPanel = await slideoutPanel.$(`[data-test-id="panel-${name}"]`);
    await waitForClass(tabPanel, 'active');

    return [tab, tabPanel]
}

async function selectTab(slideoutPanel, name) {
    const tab = await slideoutPanel.$(`[data-test-id="tab-${name}"]`);
    await clickWhenReady(tab);
    return ensureTabIsActive(slideoutPanel, name);
}

async function selectTabByLabel(slideoutPanel, name, label) {
    const tabLabelElement = await slideoutPanel.$(`[data-test-id="tab-${name}"] [data-test-id="label"]`);
    const tabLabel = await tabLabelElement.getText();
    expect(tabLabel).toEqual(label);
    await clickWhenReady(tabLabelElement);
    return ensureTabIsActive(slideoutPanel, name);
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
        const testCase = getTestCase('TEST_CASE_1');
        await login();
        await openNarrative(testCase.narrativeId);

        const slideoutPanel = await openDataSlideout();

        const [, tabPanel] = await selectTab(slideoutPanel, 'sharedwithme');

        // Ensure the main elements of the shared tab have been rendered.
        await browser.waitUntil(async () => {
            const searchInput = await tabPanel.$('.kb-import-search');
            await searchInput.waitForExist();
            const placeholder = await searchInput.getAttribute('placeholder');
            return placeholder === 'Search data...';
        });
    });

    it('opens the "Public" tab', async () => {
        const testCase = getTestCase('TEST_CASE_1');
        await login();
        await openNarrative(testCase.narrativeId);

        const slideoutPanel = await openDataSlideout();

        const [, tabPanel] = await selectTab(slideoutPanel, 'public');

        // Ensure the main elements of the public data tab have been rendered.
        await browser.waitUntil(async () => {
            const resultContainer = await tabPanel.$('[data-test-id="result"]');
            const kids = await resultContainer.$$('div');
            return kids.length > 0;
        });
    });

    it('opens the "Example" tab', async () => {
        const testCase = getTestCase('TEST_CASE_1');
        await login();
        await openNarrative(testCase.narrativeId);

        const slideoutPanel = await openDataSlideout();

        const [, tabPanel] = await selectTab(slideoutPanel, 'example');

        // Make sure the main elements of the example tab have been rendered.
        await browser.waitUntil(async () => {
            const resultContainer = await tabPanel.$('[data-test-id="example-data-objects"]');
            const kids = await resultContainer.$$('[data-test-id="type-container"]');
            return kids.length > 0;
        });
    });

    it('opens the "Import" tab', async () => {
        const testCase = getTestCase('TEST_CASE_1');
        await login();
        await openNarrative(testCase.narrativeId);

        const slideoutPanel = await openDataSlideout();

        const [, tabPanel] = await selectTab(slideoutPanel, 'import');

        // Make sure the main elements of the import tab have been rendered.
        const fileDropZone = await tabPanel.$('.kb-dropzone');
        await fileDropZone.waitForExist();
        const fileListContainer = await tabPanel.$('#kb-data-staging-table_wrapper');
        await fileListContainer.waitForExist();
    });

    it('Switches between all tabs in sequence', async () => {
        const testCase = getTestCase('TEST_CASE_1');
        await login();
        await openNarrative(testCase.narrativeId);

        const slideoutPanel = await openDataSlideout();

        for (const { name } of testCase.tabs) {
            await selectTab(slideoutPanel, name);
        }
    });

    it('Ensures tabs are in the expected order', async () => {
        const testCase = getTestCase('TEST_CASE_1');
        await login();
        await openNarrative(testCase.narrativeId);

        const slideoutPanel = await openDataSlideout();

        const tabs = await slideoutPanel.$$(`[role="tablist"] > [role="tab"]`);

        for (const [index, tab] of tabs.entries()) {
            const { name, label } = testCase.tabs[index];
            await browser.waitUntil(async () => {
                const testId = await tab.getAttribute('data-test-id');
                const testLabel = await tab.getText();
                return testId === `tab-${name}` && testLabel === label;
            });
        }
    });

    it('Switches between many tabs randomly', async () => {
        const testCase = getTestCase('TEST_CASE_1');
        await login();
        await openNarrative(testCase.narrativeId);

        const slideoutPanel = await openDataSlideout();

        for (const tabIndex of testCase.randomTabs) {
            const { name } = testCase.tabs[tabIndex]
            await selectTab(slideoutPanel, name);
        }
    });

    it('Switches between many tab labels randomly by clicking on the label', async () => {
        const testCase = getTestCase('TEST_CASE_1');
        await login();
        await openNarrative(testCase.narrativeId);

        const slideoutPanel = await openDataSlideout();

        for (const tabIndex of testCase.randomTabs) {
            const { name, label } = testCase.tabs[tabIndex]
            await selectTabByLabel(slideoutPanel, name, label);
        }
    });
});
