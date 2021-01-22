/*global describe, it, browser, afterEach, beforeEach*/
/* eslint {strict: ['error', 'global']} */
'use strict';

// const {
//     login, openNarrative, clickWhenReady, getCaseData,
//     waitForCellWithTitle, selectCell, waitForCellWithBody,
// } = require('../wdioUtils.js');

const { NarrativeTesting } = require('../NarrativeTesting.js');
const { login, clickWhenReady } = require('../wdioUtils.js');


/*
Notes:

The test narrative has 5 markdown cells. The first cell has summary text, the remaining 4 contain the text "Cell #".
The first three cells are collapsed, the last two are expanded.

Tests currently cover common cases of cell movement; additional cases can be added, e.g. try to move 
past the end, or before the beginning, try moving the same cell multiple times, inspect the state
of all cells after a movement.

This test suite could be expanded to cover all usage of the cell toolbar (kbaseCellToolbarMenu.js), or they
could be in separate files.

*/

const testData = {
    common: {
        unselectedBorder: '1px 1px 1px 5px solid rgb(204, 204, 204)',
        selectedBorder: '1px 1px 1px 5px solid rgb(75, 184, 86)',
    },
    cases: {
        TEST_CASE_1: {
            cellIndex: 1,
            title: 'Narrative Cell Toolbar Testing'
        },
        TEST_CASE_2: {
            cellIndex: 2,
            title: 'Cell 1'
        },
        TEST_CASE_3: {
            cellIndex: 3,
            title: 'Cell 2'
        },
        TEST_CASE_4: {
            cellIndex: 3,
            title: 'Cell 2'
        },
        TEST_CASE_5: {
            cellIndex: 4,
            body: 'Cell 3'
        }
    },
    ci: {
        defaults: {
            narrativeId: 58675
        },
        TEST_CASE_1: {
        },
        TEST_CASE_2: {
        },
        TEST_CASE_3: {
        },
        TEST_CASE_4: {
        },
        TEST_CASE_5: {
        }
    },
    'narrative-dev': {
        defaults: {
            narrativeId: 80970
        },
        TEST_CASE_1: {
        },
        TEST_CASE_2: {
        },
        TEST_CASE_3: {
        },
        TEST_CASE_4: {
        },
        TEST_CASE_5: {
        }
    }
};

const TIMEOUT = 60000;

describe('Test kbaseCellToolbarMenu', () => {
    beforeEach(async () => {
        await browser.setTimeout({ 'implicit': 30000 });
        await browser.reloadSession();
        await login();
    });

    afterEach(async () => {
        await browser.deleteCookies();
    });

    it('moves a minimized selected cell down', async () => {
        const t = new NarrativeTesting({testData, caseLabel: 'TEST_CASE_1'});
        const narrativeContainer = await t.openNarrative(t.testCase.narrativeId);

        const cell = await t.waitForCellWithTitle(narrativeContainer, t.testCase.cellIndex, t.testCase.title);

        // Find and click the move-down button
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await t.waitForCellWithTitle(narrativeContainer, t.testCase.cellIndex + 1, t.testCase.title);
    });

    it('moves a minimized unselected cell down', async () => {
        const t = new NarrativeTesting({testData, caseLabel: 'TEST_CASE_2'});

        const narrativeContainer = await t.openNarrative(t.testCase.narrativeId);

        const cell = await t.waitForCellWithTitle(narrativeContainer, t.testCase.cellIndex, t.testCase.title);

        // Find and click the move-down button
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await t.waitForCellWithTitle(narrativeContainer, t.testCase.cellIndex + 1, t.testCase.title);
    });

    it('moves a minimized unselected cell up', async () => {
        const t = new NarrativeTesting({testData, caseLabel: 'TEST_CASE_3'});

        const narrativeContainer = await t.openNarrative(t.testCase.narrativeId);

        const cell = await t.waitForCellWithTitle(narrativeContainer, t.testCase.cellIndex, t.testCase.title);

        // Find and click the move-ups button
        const upButton = await cell.$('[data-test="cell-move-up"]');
        await clickWhenReady(upButton);
        await t.waitForCellWithTitle(narrativeContainer, t.testCase.cellIndex - 1, t.testCase.title);
    });

    // select cell
    it('selects a minimized cell', async () => {
        const t = new NarrativeTesting({testData, caseLabel: 'TEST_CASE_4'});

        const narrativeContainer = await t.openNarrative(t.testCase.narrativeId);
        await t.selectCell(narrativeContainer, t.testCase.cellIndex, t.testCase.title);
    });

    // select cell and move down
    it('selects a minimized cell and moves it down', async () => {
        const t = new NarrativeTesting({testData, timeout: TIMEOUT, caseLabel: 'TEST_CASE_4'});

        const narrativeContainer = await t.openNarrative(t.testCase.narrativeId);
        const cell = await t.selectCell(narrativeContainer, t.testCase.cellIndex, t.testCase.title);
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await t.waitForCellWithTitle(narrativeContainer, t.testCase.cellIndex + 1, t.testCase.title);
    });

    // select cell and move up
    it('selects a minimized cell and moves it up', async () => {
        const t = new NarrativeTesting({testData, caseLabel: 'TEST_CASE_4'});

        const narrativeContainer = await t.openNarrative(t.testCase.narrativeId);
        const cell = await t.selectCell(narrativeContainer, t.testCase.cellIndex, t.testCase.title);
        const upButton = await cell.$('[data-test="cell-move-up"]');
        await clickWhenReady(upButton);
        await t.waitForCellWithTitle(narrativeContainer, t.testCase.cellIndex - 1, t.testCase.title);
    });

    // Everything above, but cells are expanded.

    it('moves an expanded unselected cell down', async () => {
        const t = new NarrativeTesting({testData, caseLabel: 'TEST_CASE_5'});

        const narrativeContainer = await t.openNarrative(t.testCase.narrativeId);

        const cell = await t.waitForCellWithBody(narrativeContainer, t.testCase.cellIndex, t.testCase.body);

        // Find and click the move-down button
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await t.waitForCellWithBody(narrativeContainer, t.testCase.cellIndex + 1, t.testCase.body);
    });

    it('moves an expanded unselected cell up', async () => {
        const t = new NarrativeTesting({testData, caseLabel: 'TEST_CASE_5'});

        const narrativeContainer = await t.openNarrative(t.testCase.narrativeId);

        const cell = await t.waitForCellWithBody(narrativeContainer, t.testCase.cellIndex, t.testCase.body);

        // Find and click the move-down button
        const button = await cell.$('[data-test="cell-move-up"]');
        await clickWhenReady(button);
        await t.waitForCellWithBody(narrativeContainer, t.testCase.cellIndex - 1, t.testCase.body);
    });

    it('selects an expanded cell', async () => {
        const t = new NarrativeTesting({testData, timeout: TIMEOUT, caseLabel: 'TEST_CASE_5'});

        const narrativeContainer = await t.openNarrative(t.testCase.narrativeId);
        await t.selectCellWithBody(narrativeContainer, t.testCase.cellIndex, t.testCase.body);
    });

    // select cell and move down
    it('selects an expanded cell and moves it down', async () => {
        const t = new NarrativeTesting({testData, timeout: TIMEOUT, caseLabel: 'TEST_CASE_5'});

        const narrativeContainer = await t.openNarrative(t.testCase.narrativeId);
        const cell = await t.selectCellWithBody(narrativeContainer, t.testCase.cellIndex, t.testCase.body);
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await t.waitForCellWithBody(narrativeContainer, t.testCase.cellIndex + 1, t.testCase.body);
    });

    // select cell and move up
    it('selects an expanded cell and moves it up', async () => {
        const t = new NarrativeTesting({testData, timeout: TIMEOUT, caseLabel: 'TEST_CASE_5'});

        const narrativeContainer = await t.openNarrative(t.testCase.narrativeId);
        const cell = await t.selectCellWithBody(narrativeContainer, t.testCase.cellIndex, t.testCase.body);
        const upButton = await cell.$('[data-test="cell-move-up"]');
        await clickWhenReady(upButton);
        await t.waitForCellWithBody(narrativeContainer, t.testCase.cellIndex - 1, t.testCase.body);
    });
});
