/*global describe, it, browser, afterEach, beforeEach*/
/* eslint {strict: ['error', 'global']} */
'use strict';

const {login, openNarrative, clickWhenReady, getCaseData} = require('../wdioUtils.js');

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

async function waitForCell(notebookContainer, cellIndex){
    return await browser.waitUntil(async () => {
        const cell = await notebookContainer.$(`.cell:nth-child(${cellIndex})`);
        return cell;
    });
}

async function waitForCellWithTitle(container, cellIndex, title) {
    const cell = await waitForCell(container, cellIndex);
    await browser.waitUntil(async () => {
        const titleElement = await cell.$('[data-element="title"]');
        const text = await titleElement.getText();
        return text === title;
    });
    return cell;
}

async function waitForCellWithBody(container, cellIndex, bodyText) {
    const cell = await waitForCell(container, cellIndex);
    await browser.waitUntil(async () => {
        const element = await cell.$('.text_cell_render.rendered_html');
        const text = await element.getText();
        return text === bodyText;
    });
    return cell;
}

async function selectCell(container, cellIndex, title) {
    const cell = await waitForCellWithTitle(container, cellIndex, title);

    // Make sure not selected.
    // We do this by inspecting the border.
    await browser.waitUntil(async () => {
        const borderStyle = await cell.getCSSProperty('border');
        return borderStyle.value === testData.common.unselectedBorder;
    });

    // Click on title area to select cell.
    const titleArea = await cell.$('.title-container');
    await clickWhenReady(titleArea);

    await browser.waitUntil(async () => {
        const borderStyle = await cell.getCSSProperty('border');
        return borderStyle.value === testData.common.selectedBorder;
    });

    return cell;
}

async function selectCellWithBody(container, cellIndex, body) {
    const cell = await waitForCellWithBody(container, cellIndex, body);

    // Make sure not selected.
    // We do this by inspecting the border.
    await browser.waitUntil(async () => {
        const borderStyle = await cell.getCSSProperty('border');
        return borderStyle.value === testData.common.unselectedBorder;
    });


    // Click on title area to select cell.
    const bodyArea = await cell.$('.text_cell_render.rendered_html');
    await clickWhenReady(bodyArea);

    await browser.waitUntil(async () => {
        const borderStyle = await cell.getCSSProperty('border');
        return borderStyle.value === testData.common.selectedBorder;
    });

    return cell;
}

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
        const testCase = getCaseData(testData, 'TEST_CASE_1');
        const narrativeContainer = await openNarrative(testCase.narrativeId);

        const cell = await waitForCellWithTitle(narrativeContainer, testCase.cellIndex, testCase.title);

        // Find and click the move-down button
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await waitForCellWithTitle(narrativeContainer, testCase.cellIndex + 1, testCase.title);
    });

    it('moves a minimized unselected cell down', async () => {
        const testCase = getCaseData(testData, 'TEST_CASE_2');

        const narrativeContainer = await openNarrative(testCase.narrativeId);

        const cell = await waitForCellWithTitle(narrativeContainer, testCase.cellIndex, testCase.title);

        // Find and click the move-down button
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await waitForCellWithTitle(narrativeContainer, testCase.cellIndex + 1, testCase.title);
    });

    it('moves a minimized unselected cell up', async () => {
        const testCase = getCaseData(testData, 'TEST_CASE_3');

        const narrativeContainer = await openNarrative(testCase.narrativeId);

        const cell = await waitForCellWithTitle(narrativeContainer, testCase.cellIndex, testCase.title);

        // Find and click the move-ups button
        const upButton = await cell.$('[data-test="cell-move-up"]');
        await clickWhenReady(upButton);
        await waitForCellWithTitle(narrativeContainer, testCase.cellIndex - 1, testCase.title);
    });

    // select cell
    it('selects a minimized cell', async () => {
        const testCase = getCaseData(testData, 'TEST_CASE_4');

        const narrativeContainer = await openNarrative(testCase.narrativeId);
        await selectCell(narrativeContainer, testCase.cellIndex, testCase.title);
    });

    // select cell and move down
    it('selects a minimized cell and moves it down', async () => {
        const testCase = getCaseData(testData, 'TEST_CASE_4');

        const narrativeContainer = await openNarrative(testCase.narrativeId);
        const cell = await selectCell(narrativeContainer, testCase.cellIndex, testCase.title);
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await waitForCellWithTitle(narrativeContainer, testCase.cellIndex + 1, testCase.title);
    });

    // select cell and move up
    it('selects a minimized cell and moves it up', async () => {
        const testCase = getCaseData(testData, 'TEST_CASE_4');

        const narrativeContainer = await openNarrative(testCase.narrativeId);
        const cell = await selectCell(narrativeContainer, testCase.cellIndex, testCase.title);
        const upButton = await cell.$('[data-test="cell-move-up"]');
        await clickWhenReady(upButton);
        await waitForCellWithTitle(narrativeContainer, testCase.cellIndex - 1, testCase.title);
    });

    // Everything above, but cells are expanded.

    it('moves an expanded unselected cell down', async () => {
        const testCase = getCaseData(testData, 'TEST_CASE_5');

        const narrativeContainer = await openNarrative(testCase.narrativeId);

        const cell = await waitForCellWithBody(narrativeContainer, testCase.cellIndex, testCase.body);

        // Find and click the move-down button
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await waitForCellWithBody(narrativeContainer, testCase.cellIndex + 1, testCase.body);
    });

    it('moves an expanded unselected cell up', async () => {
        const testCase = getCaseData(testData, 'TEST_CASE_5');

        const narrativeContainer = await openNarrative(testCase.narrativeId);

        const cell = await waitForCellWithBody(narrativeContainer, testCase.cellIndex, testCase.body);

        // Find and click the move-down button
        const button = await cell.$('[data-test="cell-move-up"]');
        await clickWhenReady(button);
        await waitForCellWithBody(narrativeContainer, testCase.cellIndex - 1, testCase.body);
    });

    it('selects an expanded cell', async () => {
        const testCase = getCaseData(testData, 'TEST_CASE_5');

        const narrativeContainer = await openNarrative(testCase.narrativeId);
        await selectCellWithBody(narrativeContainer, testCase.cellIndex, testCase.body);
    });

    // select cell and move down
    it('selects an expanded cell and moves it down', async () => {
        const testCase = getCaseData(testData, 'TEST_CASE_5');

        const narrativeContainer = await openNarrative(testCase.narrativeId);
        const cell = await selectCellWithBody(narrativeContainer, testCase.cellIndex, testCase.body);
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await waitForCellWithBody(narrativeContainer, testCase.cellIndex + 1, testCase.body);
    });

    // select cell and move up
    it('selects an expanded cell and moves it up', async () => {
        const testCase = getCaseData(testData, 'TEST_CASE_5');

        const narrativeContainer = await openNarrative(testCase.narrativeId);
        const cell = await selectCellWithBody(narrativeContainer, testCase.cellIndex, testCase.body);
        const upButton = await cell.$('[data-test="cell-move-up"]');
        await clickWhenReady(upButton);
        await waitForCellWithBody(narrativeContainer, testCase.cellIndex - 1, testCase.body);
    });
});
