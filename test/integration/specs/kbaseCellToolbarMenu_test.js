/*global describe, it, browser, afterEach, beforeEach*/
/* eslint {strict: ['error', 'global']} */
'use strict';

const {login, openNarrative, clickWhenReady} = require('../wdioUtils.js');

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
    all: {
        TEST_CASE1: {
            cellIndex: 1,
            title: 'Narrative Cell Toolbar Testing'
        },
        TEST_CASE2: {
            cellIndex: 2,
            title: 'Cell 1'
        },
        TEST_CASE3: {
            cellIndex: 3,
            title: 'Cell 2'
        },
        TEST_CASE4: {
            cellIndex: 3,
            title: 'Cell 2'
        },
        TEST_CASE5: {
            cellIndex: 4,
            body: 'Cell 3'
        }
    },
    ci: {
        TEST_CASE1: {
            narrativeId: 58675,
        },
        TEST_CASE2: {
            narrativeId: 58675,
        },
        TEST_CASE3: {
            narrativeId: 58675,
        },
        TEST_CASE4: {
            narrativeId: 58675,
        },
        TEST_CASE5: {
            narrativeId: 58675,
        }
    },
    'narrative-dev': {
        TEST_CASE1: {
            narrativeId: 80970,
        },
        TEST_CASE2: {
            narrativeId: 80970,
        },
        TEST_CASE3: {
            narrativeId: 80970,
        },
        TEST_CASE4: {
            narrativeId: 80970,
        },
        TEST_CASE5: {
            narrativeId: 80970,
        }
    }
};

const testCases = mergeObjects([testData[browser.config.testParams.ENV], testData.all]);

function mergeObjects(listOfObjects) {
    const simpleObjectPrototype = Object.getPrototypeOf({});

    function isSimpleObject(obj) {
        return Object.getPrototypeOf(obj) === simpleObjectPrototype;
    }

    function merge(obj1, obj2, keyStack) {
        Object.keys(obj2).forEach(function (key) {
            const obj1Value = obj1[key];
            const obj2Value = obj2[key];
            const obj1Type = typeof obj1Value;
            // var obj2Type = typeof obj2Value;
            if (obj1Type === 'undefined') {
                obj1[key] = obj2[key];
            } else if (isSimpleObject(obj1Value) && isSimpleObject(obj2Value)) {
                keyStack.push(key);
                merge(obj1Value, obj2Value, keyStack);
                keyStack.pop();
            } else {
                console.error('UNMERGABLE', obj1Type, obj1Value);
                throw new Error('Unmergable at ' + keyStack.join('.') + ':' + key);
            }
        });
    }

    const base = JSON.parse(JSON.stringify(listOfObjects[0]));
    for (let i = 1; i < listOfObjects.length; i += 1) {
        merge(base, listOfObjects[i], []);
    }
    return base;
}

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
    });

    afterEach(async () => {
        await browser.deleteCookies();
    });

    it('moves a minimized selected cell down', async () => {
        const testCase = testCases.TEST_CASE1;
        await login();
        const narrativeContainer = await openNarrative(testCase.narrativeId);

        const cell = await waitForCellWithTitle(narrativeContainer, testCase.cellIndex, testCase.title);

        // Find and click the move-down button
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await waitForCellWithTitle(narrativeContainer, testCase.cellIndex + 1, testCase.title);
    });

    it('moves a minimized unselected cell down', async () => {
        const testCase = testCases.TEST_CASE2;
        await login();
        const narrativeContainer = await openNarrative(testCase.narrativeId);

        const cell = await waitForCellWithTitle(narrativeContainer, testCase.cellIndex, testCase.title);

        // Find and click the move-down button
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await waitForCellWithTitle(narrativeContainer, testCase.cellIndex + 1, testCase.title);
    });

    it('moves a minimized unselected cell up', async () => {
        const testCase = testCases.TEST_CASE3;
        await login();
        const narrativeContainer = await openNarrative(testCase.narrativeId);

        const cell = await waitForCellWithTitle(narrativeContainer, testCase.cellIndex, testCase.title);

        // Find and click the move-ups button
        const upButton = await cell.$('[data-test="cell-move-up"]');
        await clickWhenReady(upButton);
        await waitForCellWithTitle(narrativeContainer, testCase.cellIndex - 1, testCase.title);
    });

    // select cell
    it('selects a minimized cell', async () => {
        const testCase = testCases.TEST_CASE4;
        await login();
        const narrativeContainer = await openNarrative(testCase.narrativeId);
        await selectCell(narrativeContainer, testCase.cellIndex, testCase.title);
    });

    // select cell and move down
    it('selects a minimized cell and moves it down', async () => {
        const testCase = testCases.TEST_CASE4;
        await login();
        const narrativeContainer = await openNarrative(testCase.narrativeId);
        const cell = await selectCell(narrativeContainer, testCase.cellIndex, testCase.title);
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await waitForCellWithTitle(narrativeContainer, testCase.cellIndex + 1, testCase.title);
    });

    // select cell and move up
    it('selects a minimized cell and moves it up', async () => {
        const testCase = testCases.TEST_CASE4;
        await login();
        const narrativeContainer = await openNarrative(testCase.narrativeId);
        const cell = await selectCell(narrativeContainer, testCase.cellIndex, testCase.title);
        const upButton = await cell.$('[data-test="cell-move-up"]');
        await clickWhenReady(upButton);
        await waitForCellWithTitle(narrativeContainer, testCase.cellIndex - 1, testCase.title);
    });

    // Everything above, but cells are expanded.

    it('moves an expanded unselected cell down', async () => {
        const testCase = testCases.TEST_CASE5;
        await login();
        const narrativeContainer = await openNarrative(testCase.narrativeId);

        const cell = await waitForCellWithBody(narrativeContainer, testCase.cellIndex, testCase.body);

        // Find and click the move-down button
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await waitForCellWithBody(narrativeContainer, testCase.cellIndex + 1, testCase.body);
    });

    it('moves an expanded unselected cell up', async () => {
        const testCase = testCases.TEST_CASE5;
        await login();
        const narrativeContainer = await openNarrative(testCase.narrativeId);

        const cell = await waitForCellWithBody(narrativeContainer, testCase.cellIndex, testCase.body);

        // Find and click the move-down button
        const button = await cell.$('[data-test="cell-move-up"]');
        await clickWhenReady(button);
        await waitForCellWithBody(narrativeContainer, testCase.cellIndex - 1, testCase.body);
    });

    it('selects an expanded cell', async () => {
        const testCase = testCases.TEST_CASE5;
        await login();
        const narrativeContainer = await openNarrative(testCase.narrativeId);
        await selectCellWithBody(narrativeContainer, testCase.cellIndex, testCase.body);
    });

    // select cell and move down
    it('selects an expanded cell and moves it down', async () => {
        const testCase = testCases.TEST_CASE5;
        await login();
        const narrativeContainer = await openNarrative(testCase.narrativeId);
        const cell = await selectCellWithBody(narrativeContainer, testCase.cellIndex, testCase.body);
        const downButton = await cell.$('[data-test="cell-move-down"]');
        await clickWhenReady(downButton);
        await waitForCellWithBody(narrativeContainer, testCase.cellIndex + 1, testCase.body);
    });

    // select cell and move up
    it('selects an expanded cell and moves it up', async () => {
        const testCase = testCases.TEST_CASE5;
        await login();
        const narrativeContainer = await openNarrative(testCase.narrativeId);
        const cell = await selectCellWithBody(narrativeContainer, testCase.cellIndex, testCase.body);
        const upButton = await cell.$('[data-test="cell-move-up"]');
        await clickWhenReady(upButton);
        await waitForCellWithBody(narrativeContainer, testCase.cellIndex - 1, testCase.body);
    });
});
