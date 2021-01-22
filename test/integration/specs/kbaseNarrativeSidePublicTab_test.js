/*global describe, it, browser, expect, $, afterEach, beforeEach*/
/* eslint {strict: ['error', 'global']} */
'use strict';

const {login, sendString, clickWhenReady} = require('../wdioUtils.js');
const { NarrativeTesting } = require('../NarrativeTesting.js');
const testData = require('./kbaseNarrativeSidePublicTab_data.json');

const TIMEOUT = 30000;

async function testField({container, id, label, value}) {
    const lineageLabel = await container.$(`[role="row"][data-test-id="${id}"] [data-test-id="label"]`);
    expect(lineageLabel).toHaveText(label);
    const lineageValue = await container.$(`[role="row"][data-test-id="${id}"] [data-test-id="value"]`);
    expect(lineageValue).toHaveText(value);
}

async function waitForRows(panel, count){
    await browser.waitUntil(async () => {
        const rows = await panel.$$('[role="table"][data-test-id="result"] > div > [role="row"]');
        return rows.length >= count;
    });
    return await panel.$$('[role="table"][data-test-id="result"] > div > [role="row"]');
}

async function openPublicData() {
    // Open the data slideout
    const button = await $('[data-test-id="data-slideout-button"]');
    await button.waitForExist();
    await clickWhenReady(button);

    // Here we locate the public data tab, move the mouse cursor to it, and then
    // click on its container, which should open the public data panel.
    // The reason for this roundabout approach is that the click handler is on the
    // container, not the individual tabs. 
    const panel = await $('[data-test-id="data-slideout-panel"]');
    await panel.waitForExist();

    const tablist = await panel.$('[role="tablist"]');
    await tablist.waitForExist();

    const publicTab = await panel.$('[data-test-id="tab-public"]');
    await publicTab.waitForExist();

    await clickWhenReady(publicTab);

    const publicPanel = await panel.$('[data-test-id="panel-public"]');
    await publicPanel.waitForExist();

    // get rows
    // When using roles, we sometimes need to be very specific in our queries.
    // Maybe roles are not suitable for integration tests, then.
    
    const rows = await waitForRows(publicPanel, 20);
    expect(rows.length).toEqual(20);
    return publicPanel;
}

describe('Test kbaseNarrativeSidePublicTab', () => {
    beforeEach(async () => {
        await browser.setTimeout({ 'implicit': TIMEOUT });
        await browser.reloadSession();
        await login();
    });

    afterEach(async () => {
        await browser.deleteCookies();
    });

    it('opens the public data search tab, should show default results', async () => {
        const t = new NarrativeTesting({testData, caseLabel: 'TEST_CASE_1', timeout: TIMEOUT});
        
        await t.openNarrative(t.caseData.narrativeId);

        const publicPanel = await openPublicData();
        const rows = await waitForRows(publicPanel, t.caseData.row);

        expect(rows.length).toBeGreaterThanOrEqual(t.caseData.row);
        const row = rows[t.caseData.row - 1];
        expect(row).toBeDefined();

        const nameCell = await row.$('[role="cell"][data-test-id="name"]');
        expect(nameCell).toHaveText(t.caseData.name);

        // Confirm the metadata fields.
        for (const {id, label, value} of t.caseData.metadata) {
            await testField({
                container: row, 
                id, 
                label, 
                value
            });
        }
    });

    it('opens the public data search tab, should show default results, scroll to desired row', async () => {
        const t = new NarrativeTesting({testData, caseLabel: 'TEST_CASE_2', timeout: TIMEOUT});

        await t.openNarrative(t.caseData.narrativeId);

        const publicPanel = await openPublicData();
        const rows = await waitForRows(publicPanel, t.caseData.row);

        // Look at the row - it should already be in view.
        const row = rows[t.caseData.row - 1];
        await row.scrollIntoView();

        const nameCell = await row.$('[role="cell"][data-test-id="name"]');
        expect(nameCell).toHaveText(t.caseData.name);

        // Confirm the metadata fields.
        for (const {id, label, value} of t.caseData.metadata) {
            await testField({
                container: row, 
                id, 
                label, 
                value
            });
        }
    });

    it('opens the public data search tab, searches for a term, should find an expected row', async () => {
        const t = new NarrativeTesting({testData, caseLabel: 'TEST_CASE_3', timeout: TIMEOUT});

        await t.openNarrative(t.caseData.narrativeId);

        const publicPanel = await openPublicData();

        // Select search input and input a search term
        const searchInput = await publicPanel.$('[data-test-id="search-input"]');
        await clickWhenReady(searchInput);
        await sendString(t.caseData.searchFor);
        await browser.keys('Enter');

        const foundCount = await publicPanel.$('[data-test-id="found-count"]');
        expect(foundCount).toHaveText(t.caseData.foundCount);

        // get rows
        // When using roles, we sometimes need to be very specific in our queries.
        // Maybe roles are not suitable for integration tests, then.
        const rows = await waitForRows(publicPanel, t.caseData.row);

        expect(rows.length).toBeGreaterThanOrEqual(t.caseData.row);

        // Look at the row - it should already be in view.
        const row = rows[t.caseData.row - 1];
        await row.scrollIntoView();
        const nameCell = await row.$('[role="cell"][data-test-id="name"]');
        expect(nameCell).toHaveText(t.caseData.name);

        // Confirm the metadata fields.
        for (const {id, label, value} of t.caseData.metadata) {
            await testField({
                container: row, 
                id, 
                label, 
                value
            });
        }
    });

    it('opens the public data search tab, searches for a term which should not be found', async () => {
        const t = new NarrativeTesting({testData, caseLabel: 'TEST_CASE_4', timeout: TIMEOUT});

        await t.openNarrative(t.caseData.narrativeId);

        const publicPanel = await openPublicData();

        // Select search input and input a search term
        const searchInput = await publicPanel.$('[data-test-id="search-input"]');
        await clickWhenReady(searchInput);
        await sendString(t.caseData.searchFor);
        await browser.keys('Enter');

        await browser.waitUntil(async () => {
            const foundCountElement = await publicPanel.$('[data-test-id="found-count"]');
            
            if (await foundCountElement.isDisplayed()) {
                const text = await foundCountElement.getText();
                return text === t.caseData.foundCount;
            } else {
                return false;
            }
        });
        
        const foundCount = await publicPanel.$('[data-test-id="found-count"]');
        expect(foundCount).toHaveText(t.caseData.foundCount);
    });

    it('opens the public data search tab, should show default results, scroll to desired row', async () => {
        const t = new NarrativeTesting({testData, caseLabel: 'TEST_CASE_5', timeout: TIMEOUT});

        await t.openNarrative(t.caseData.narrativeId);

        // Open the data slideout
        const publicPanel = await openPublicData();

        // get rows
        // When using roles, we sometimes need to be very specific in our queries.
        // Maybe roles are not suitable for integration tests, then.
        for (const scrollRow of t.caseData.scrolls) {
            const rowElements = await waitForRows(publicPanel, scrollRow);
            const rowElement = rowElements[scrollRow - 1];
            await rowElement.scrollIntoView();
        }

        // ensure we have all of the rows.
        const rows = await waitForRows(publicPanel, t.caseData.row);
        const row = rows[t.caseData.row - 1];
        await row.scrollIntoView();
        const nameCell = await row.$('[role="cell"][data-test-id="name"]');
        expect(nameCell).toHaveText(t.caseData.name);

        // Confirm the metadata fields.
        for (const {id, label, value} of t.caseData.metadata) {
            await testField({
                container: row, 
                id, 
                label, 
                value
            });
        }
    });
});
