/*global describe, it, browser, expect, afterEach, beforeEach*/
const {login} = require('../wdioUtils.js');
const {NarrativeTesting} = require('../NarrativeTesting');
const testData = require('./kbaseFeatureSet_data.json');
const TIMEOUT = 30000;

describe('Test kbaseFeatureSet', () => {
    'use strict';

    beforeEach(async () => {
        await browser.setTimeout({ 'implicit': 30000 });
        await browser.reloadSession();
        await login();
    });

    afterEach(async () => {
        await browser.deleteCookies();
    });

    // sync version
    it('opens a narrative which should have a sample set', async () => {
        const t = new NarrativeTesting({testData, timeout: TIMEOUT, caseLabel: 'CASE_1'});

        const notebookContainer = await t.openNarrative(t.caseData.narrativeId);

        for (const cellCase of t.caseData.cells) {
            const cell = await t.waitForCell(notebookContainer, cellCase.cell);

            // Test description display.
            const description = await cell.$('[test-id="description"] > [test-id="value"]');
            await expect(description).toHaveText(cellCase.description);

            // Test the 3rd row of the table.
            const tableBody = await cell.$('[role="grid"] > tbody');

            const rows = await tableBody.$$('[role="row"');
            await expect(rows.length).toEqual(cellCase.rowCount);
            const cols = await rows[cellCase.row - 1].$$('td');

            await expect(cols.length).toEqual(cellCase.cols.length);

            for (let colIndex = 0; colIndex < cols.length; colIndex += 1) {
                const colElement = cols[colIndex];
                const colDef = cellCase.cols[colIndex];
                const elementToInspect = await (async () => {
                    if (colDef.selector) {
                        return await colElement.$(colDef.selector);
                    }
                    return colElement;
                })();
                if (colDef.attrs) {
                    for (const {key, value, regex} of colDef.attrs) {
                        if (value) {
                            await expect(elementToInspect).toHaveAttribute(key, value);
                        } else if (regex) {
                            const attributeValue = await elementToInspect.getAttribute(key);
                            const compiledRegex = new RegExp(regex);
                            await expect(compiledRegex.test(attributeValue)).toBeTruthy();
                        } else {
                            throw new Error('Either value or regex required for attrs');
                        }
                    }
                }
                if (colDef.text) {
                    await expect(elementToInspect).toHaveText(colDef.text);
                }
            }
        }
    });

    it('does nothing important (but triggers lost sessions if there are async errors above)', async () => {
        await expect(true).toEqual(true);
    });
});