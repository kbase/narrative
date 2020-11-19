/*global describe, it, browser, expect, $, afterEach*/
const {login, openNarrative} = require('../wdioUtils.js');

const TEST_CASE1 = {
    narrativeId: 56638,
    cell: 6,
    description: 'merged feature set',
    rowCount: 6,
    row: 6,
    cols: [
        {
            selector: 'a',
            attrs: [
                {
                    key: 'href',
                    value: '/#dataview/56638/3/1?sub=Feature&subid=A4S02_RS00020'
                },
                {
                    key: 'target',
                    value: '_blank'
                }
            ],
            text: 'A4S02_RS00020'
        },
        {
            text: 'A4S02_00020, A4S02_RS00020, WP_082246712.1'
        },
        {
            selector: 'a',
            attrs: [
                {
                    key: 'href',
                    value: '/#dataview/56638/3/1'
                },
                {
                    key: 'target',
                    value: '_blank'
                }
            ],
            text: 'Acetobacter_ascendens'
        },
        {
            text: 'gene'
        },
        {
            text: 'IS5 family transposase'
        }
    ]
};

describe('Test kbaseFeatureSet', () => {
    'use strict';

    afterEach(async () => {
        await browser.deleteCookies();
    });

    async function narrativeContainer() {
        const container = await $('#notebook-container');
        return container;
    }

    async function narrativeCell(cellNumber) {
        const container = await narrativeContainer();
        const cells = await container.$$('.cell');
        expect(cells.length).toBeGreaterThanOrEqual(cellNumber);
        return cells[cellNumber - 1];
    }

    // sync version
    it('opens a narrative which should have a sample set', async () => {
        browser.setTimeout({ 'implicit': 30000 });
        await login();
        await openNarrative(TEST_CASE1.narrativeId);
        const cell = await narrativeCell(TEST_CASE1.cell);

        // Test description display.
        const description = await cell.$('[test-id="description"]');
        expect(description).toHaveText(TEST_CASE1.description);

        // Test the 3rd row of the table.
        const tableBody = await cell.$('[role="grid"] > tbody');

        const rows = await tableBody.$$('[role="row"');
        expect(rows.length).toEqual(TEST_CASE1.rowCount);
        const cols = await rows[TEST_CASE1.row - 1].$$('td');

        expect(cols.length).toEqual(TEST_CASE1.cols.length);

        cols.forEach((el, index) => {
            const colDef = TEST_CASE1.cols[index];
            if (colDef.selector) {
                el = el.$(colDef.selector);
            }
            if (colDef.attrs) {
                for (const {key, value} of colDef.attrs) {
                    expect(el).toHaveAttr(key, value);
                }
            }
            if (colDef.text) {
                expect(el).toHaveText(colDef.text);
            }
        });
    });
});