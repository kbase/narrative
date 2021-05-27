/* eslint strict: ["error", "global"] */
'use strict';

const { makeURL, clickWhenReady } = require('./wdioUtils');

function mergeObjects(listOfObjects) {
    const simpleObjectPrototype = Object.getPrototypeOf({});

    function isSimpleObject(obj) {
        if (typeof obj !== 'object') {
            return false;
        }
        return Object.getPrototypeOf(obj) === simpleObjectPrototype;
    }

    function merge(targetObj, sourceObj) {
        // Copy target, so we don't stomp over original objects.
        // Note that the source object is not copied, since we don't care if
        // there is object sharing in the result, we just want to ensure that
        // we don't overwrite properties of shared objects.
        targetObj = JSON.parse(JSON.stringify(targetObj));

        Object.keys(sourceObj).forEach(function (key) {
            if (isSimpleObject(targetObj[key]) && isSimpleObject(sourceObj[key])) {
                targetObj[key] = merge(targetObj[key], sourceObj[key]);
            } else {
                targetObj[key] = sourceObj[key];
            }
        });

        return targetObj;
    }

    const objectsToMerge = listOfObjects.map((obj, index) => {
        if (typeof obj === 'undefined') {
            return {};
        }
        if (!isSimpleObject(obj)) {
            throw new Error(`Can only merge simple objects, object #${index} is a "${typeof obj}"`);
        } else {
            return JSON.parse(JSON.stringify(obj));
        }
    });
    let merged = objectsToMerge[0];
    for (let i = 1; i < objectsToMerge.length; i += 1) {
        merged = merge(merged, objectsToMerge[i]);
    }
    return merged;
}

class NarrativeTesting {
    constructor({ testData, caseLabel, timeout }) {
        this.testData = testData;
        this.caseLabel = caseLabel;
        this.timeout = timeout;
        this.caseData = this.getCaseData();
    }

    getCaseData() {
        if (this.caseData) {
            return this.caseData;
        }
        const env = browser.config.testParams.ENV;

        // Note, order is least specific to most specific, so that the more
        // specific can override the least.

        // Top level test cases provide defaults (non-env-specific) per-case
        // test data.
        const caseData = this.testData.cases[this.caseLabel];

        // Each env can establish defaults (e.g. narrative id)
        const envDefaults = this.testData[env].defaults;

        // Each test case is defined per environment as well, as the
        // state of services will be different.
        const envcaseData = this.testData[env][this.caseLabel];

        return mergeObjects([caseData, envDefaults, envcaseData]);
    }

    /**
     * Navigates the wdio browser to a workspace as given by its id, and waits until the
     * narrative container is visible.
     * @arg {number} The narrative's workspace id
     * @returns {Promise} The Promise value is ignored.
     */
    async openNarrative(workspaceId, timeoutOverride) {
        // Go to the narrative!
        const timeout = timeoutOverride || this.timeout;
        await browser.url(makeURL(`narrative/${workspaceId}`));

        // should experience loading blocker for a few seconds.
        const loadingBlocker = await $('#kb-loading-blocker');
        await loadingBlocker.waitForDisplayed({
            timeout,
            timeoutMsg: `Timeout after waiting ${timeout}ms for loading blocker to appear`,
        });

        // And then the loading blocker should disappear!
        await loadingBlocker.waitForDisplayed({
            timeout,
            timeoutMsg: `Timeout after waiting ${timeout}ms for loading blocker to disappear`,
            reverse: true,
        });

        // Ensure logged in
        const loginButton = await $('#signin-button > div > button');
        await loginButton.waitForDisplayed({
            timeout,
            timeoutMsg: `Timeout after waiting ${timeout}ms for login button to appear`,
        });

        await clickWhenReady(loginButton);

        const realnameElement = await $('[data-testid="realname"]');
        const usernameElement = await $('[data-testid="username"]');
        await browser.waitUntil(async () => {
            const text = await realnameElement.getText();
            return text && text.length > 0;
        });
        const realname = await realnameElement.getText();
        const username = await usernameElement.getText();
        console.warn(`Signed in as user "${realname}" (${username})`);
        await loginButton.click();

        // Ensure narrative notebook has displayed
        // TODO: more interesting waitUntil loop to signal the
        // failure reason (useful for debugging tests?)
        const container = await $('#notebook-container');
        await container.waitForDisplayed({
            timeout,
            timeoutMsg: `Timeout after waiting ${timeout}ms for narrative to appear`,
        });
        return container;
    }

    async waitForCell(notebookContainer, cellIndex) {
        return await browser.waitUntil(async () => {
            const cell = await notebookContainer.$(`.cell:nth-child(${cellIndex})`);
            return cell;
        });
    }

    async selectCell(cell) {
        // Make sure not selected.
        // We do this by inspecting the border.
        await browser.waitUntil(async () => {
            const borderStyle = await cell.getCSSProperty('border');
            return borderStyle.value === this.testData.common.unselectedBorder;
        });

        // Click on title area to select cell.
        const titleArea = await cell.$('.title-container');
        await clickWhenReady(titleArea);

        await browser.waitUntil(async () => {
            const borderStyle = await cell.getCSSProperty('border');
            return borderStyle.value === this.testData.common.selectedBorder;
        });

        return cell;
    }

    async waitForCellWithText(container, cellIndex, selector, text) {
        await browser.waitUntil(async () => {
            const cell = await this.waitForCell(container, cellIndex);
            const element = await cell.$(selector);
            const cellText = await element.getText();
            return text === cellText;
        });
        return await this.waitForCell(container, cellIndex);
    }

    async waitForCellWithTitle(container, cellIndex, titleText) {
        return await this.waitForCellWithText(
            container,
            cellIndex,
            '[data-element="title"]',
            titleText
        );
    }

    async waitForCellWithBody(container, cellIndex, bodyText) {
        return await this.waitForCellWithText(
            container,
            cellIndex,
            '.text_cell_render.rendered_html',
            bodyText
        );
    }
}

module.exports = {
    NarrativeTesting,
    mergeObjects,
};
