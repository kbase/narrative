'use strict';

const { login, openNarrative, clickWhenReady } = require('../wdioUtils.js');

// Ideally the test data should be the same, except for narrative id, in each env.
// But currently CI and prod are indexed differently.

// Note that the narrativeIds used below must be owned or shared with full rights (at least edit) with the narrativetest user.
// Note that narrativetest is not yet set up in narrative-dev/prod.
const allTestCases = {
    common: {},
    envs: {
        ci: {
            TEST_CASE_1: {
                narrativeId: 53983,
            },
        },
        'narrative-dev': {
            TEST_CASE_1: {
                narrativeId: 78050,
            },
        },
    },
};

function getTestCase(name) {
    const envCases = allTestCases.envs[browser.config.testParams.ENV];
    return Object.assign({}, allTestCases.common, envCases[name]);
}

async function clickSlideoutButton(slideout) {
    // Open a slideout by clicking it's toggle button
    const button = await $(`[data-test-id="${slideout}-slideout-button"]`);
    await button.waitForDisplayed();
    await clickWhenReady(button);
}

async function clickAddDataButton() {
    // Open a slideout by clicking its toggle button
    const button = await $('[data-test-id="add-data-button"]');
    await button.waitForDisplayed();
    await clickWhenReady(button);
}

async function clickOverlayDimmer() {
    const dimmer = await $('.kb-overlay-dimmer');
    const slideoutPanel = await $('[data-test-id="data-slideout-panel"]');

    // First just fetch all the dimensions
    const { x: spx, y: spy } = await slideoutPanel.getLocation();
    const { width: spw, height: sph } = await slideoutPanel.getSize();

    const { x: dx, y: dy } = await dimmer.getLocation();
    const { width: dw, height: dh } = await dimmer.getSize();

    // I find that bottom and right are just easier to reason
    // about when doing comparisons.
    const spBottom = spy + sph;
    const dBottom = dy + dh;
    const spRight = spx + spw;
    const dRight = dx + dw;

    // We'll try to click below the side panel or to the right.
    // Note that the point of reference for "click" is the
    // mid point of the element.

    if (dBottom > spBottom) {
        // Below
        const clickOptions = {
            x: 0, // midpoint
            y: Math.round(dh / 2) - 1, // this should be the last pixel (length - 1)
        };
        await dimmer.click(clickOptions);
    } else if (dRight > spRight) {
        // To the right
        const clickOptions = {
            x: Math.round(dw / 2) - 1, // this should be the last pixel (length - 1)
            y: 0, // midpoint
        };
        await dimmer.click(clickOptions);
    } else {
        throw new Error('No clickable areas');
    }
}

async function getSlideoutContainer() {
    const slideoutContainer = await $('[data-test-id="side-overlay-container"]');
    await slideoutContainer.waitForExist();
    return slideoutContainer;
}

async function slideoutToBe(state) {
    const slideoutContainer = await $('[data-test-id="side-overlay-container"]');
    await slideoutContainer.waitForDisplayed({ reverse: state === 'closed' });
    return slideoutContainer;
}

async function slideoutPanelToBe(slideout, state) {
    // Open the data slideout by clicking it's toggle button
    const direction = state === 'open' ? 'left' : 'right';
    const button = await $(`[data-test-id="${slideout}-slideout-button"] .fa-arrow-${direction}`);
    await button.waitForDisplayed();

    if (state === 'closed') {
        // slideout  could be open or closed; if open, ensure  not displayed.
        const slideoutContainer = await getSlideoutContainer();
        if (await slideoutContainer.isDisplayed()) {
            await browser.waitUntil(async () => {
                const slideoutPanel = await slideoutContainer.$(
                    `[data-test-id="${slideout}-slideout-panel"]`
                );
                const isDisplayed = await slideoutPanel.isDisplayed();
                return !isDisplayed;
            });
        }
    } else {
        const slideoutContainer = await slideoutToBe('open');
        const slideoutPanel = await slideoutContainer.$(
            `[data-test-id="${slideout}-slideout-panel"]`
        );
        await slideoutPanel.waitForDisplayed();
    }
}

describe('Tabbing within the data panel should work', () => {
    beforeEach(async () => {
        await browser.setTimeout({ implicit: 30000 });
        await browser.reloadSession();
    });

    afterEach(async () => {
        await browser.deleteCookies();
    });

    it('Opens and closes the data slideout with the data panel button', async () => {
        const testCase = getTestCase('TEST_CASE_1');
        await login();
        await openNarrative(testCase.narrativeId);

        await slideoutToBe('closed');
        await slideoutPanelToBe('data', 'closed');
        await slideoutPanelToBe('app', 'closed');

        await clickSlideoutButton('data');
        await slideoutToBe('open');
        await slideoutPanelToBe('data', 'open');
        await slideoutPanelToBe('app', 'closed');

        await clickSlideoutButton('data');
        await slideoutToBe('closed');
        await slideoutPanelToBe('data', 'closed');
        await slideoutPanelToBe('app', 'closed');
    });

    it('Opens and closes the app slideout with the data panel button', async () => {
        const testCase = getTestCase('TEST_CASE_1');
        await login();
        await openNarrative(testCase.narrativeId);

        await slideoutToBe('closed');
        await slideoutPanelToBe('data', 'closed');
        await slideoutPanelToBe('app', 'closed');

        await clickSlideoutButton('app');
        await slideoutToBe('open');
        await slideoutPanelToBe('data', 'closed');
        await slideoutPanelToBe('app', 'open');

        await clickSlideoutButton('app');
        await slideoutToBe('closed');
        await slideoutPanelToBe('data', 'closed');
        await slideoutPanelToBe('app', 'closed');
    });

    it('Opens data panel, then open app panel', async () => {
        const testCase = getTestCase('TEST_CASE_1');
        await login();
        await openNarrative(testCase.narrativeId);

        await slideoutToBe('closed');
        await slideoutPanelToBe('data', 'closed');
        await slideoutPanelToBe('app', 'closed');

        await clickSlideoutButton('data');
        await slideoutToBe('open');
        await slideoutPanelToBe('data', 'open');
        await slideoutPanelToBe('app', 'closed');

        await clickSlideoutButton('app');
        await slideoutToBe('open');

        await slideoutPanelToBe('data', 'closed');
        await slideoutPanelToBe('app', 'open');
    });

    it('Opens app panel, then open data panel', async () => {
        const testCase = getTestCase('TEST_CASE_1');
        await login();
        await openNarrative(testCase.narrativeId);

        await slideoutToBe('closed');
        await slideoutPanelToBe('data', 'closed');
        await slideoutPanelToBe('app', 'closed');

        await clickSlideoutButton('app');
        await slideoutToBe('open');
        await slideoutPanelToBe('data', 'closed');
        await slideoutPanelToBe('app', 'open');

        await clickSlideoutButton('data');
        await slideoutToBe('open');
        await slideoutPanelToBe('data', 'open');
        await slideoutPanelToBe('app', 'closed');
    });

    // Test cases for open with "Add Data" button
    it('Opens and closes the data slideout with the "Add Data" button', async () => {
        const testCase = getTestCase('TEST_CASE_1');
        await login();
        await openNarrative(testCase.narrativeId);

        await slideoutToBe('closed');
        await slideoutPanelToBe('data', 'closed');
        await slideoutPanelToBe('app', 'closed');

        await clickAddDataButton();
        await slideoutToBe('open');
        await slideoutPanelToBe('data', 'open');
        await slideoutPanelToBe('app', 'closed');

        await clickAddDataButton();
        await slideoutToBe('closed');
        await slideoutPanelToBe('data', 'closed');
        await slideoutPanelToBe('app', 'closed');
    });

    // Open via button, close by clicking outside the slideout.
    it('Opens and closes the data slideout with the "Add Data" button', async () => {
        const testCase = getTestCase('TEST_CASE_1');
        await login();
        await openNarrative(testCase.narrativeId);

        await slideoutToBe('closed');
        await slideoutPanelToBe('data', 'closed');
        await slideoutPanelToBe('app', 'closed');

        await clickSlideoutButton('data');
        await slideoutToBe('open');
        await slideoutPanelToBe('data', 'open');
        await slideoutPanelToBe('app', 'closed');

        await clickOverlayDimmer();
        await slideoutToBe('closed');
        await slideoutPanelToBe('data', 'closed');
        await slideoutPanelToBe('app', 'closed');
    });
});
