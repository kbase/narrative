/*global describe, it, browser, afterEach, beforeEach*/
/* eslint {strict: ['error', 'global']} */
'use strict';

const { NarrativeTesting } = require('../NarrativeTesting.js');
const { login, clickWhenReady } = require('../wdioUtils.js');

const TIMEOUT = 30000;

/*
Notes:

The test narrative has 5 markdown cells. The first cell has summary text, the remaining 4 contain the text "Cell #".
The first three cells are collapsed, the last two are expanded.

Tests currently cover moving cells up and down, in both selected and unselected state, and ensuring that the moved 
cell is in the expected position.

TODO: This test suite could be expanded to cover all usage of the cell toolbar (kbaseCellToolbarMenu.js), or such 
test cases can be could be in separate files.

*/

const testData = {
    common: {
        unselectedBorder: '1px 1px 1px 5px solid rgb(204, 204, 204)',
        selectedBorder: '1px 1px 1px 5px solid rgb(75, 184, 86)',
        cells: [
            {title: 'Narrative Cell Toolbar Testing'},
            {title: 'Cell 1'},
            {title: 'Cell 2'},
            {body: 'Cell 3'},
            {body: 'Cell 4'}
        ]
    },
    cases: {
        TEST_CASE_1: {
            cellIndex: 1,
            title: 'Narrative Cell Toolbar Testing',
            expect: {
                afterMove: {
                    up: {
                        cellOrder: [1, 2, 3, 4, 5]
                    },
                    down: {
                        cellOrder: [2, 1, 3, 4, 5]
                    }
                }
            }
        },
        TEST_CASE_2: {
            cellIndex: 2,
            title: 'Cell 1',
            expect: {
                afterMove: {
                    up: {
                        cellOrder: [2, 1, 3, 4, 5]
                    },
                    down: {
                        cellOrder: [1, 3, 2, 4, 5]
                    }
                }
            }
        },
        TEST_CASE_3: {
            cellIndex: 3,
            title: 'Cell 2',
            expect: {
                afterMove: {
                    up: {
                        cellOrder: [1, 3, 2, 4, 5]
                    },
                    down: {
                        cellOrder: [1, 2, 4, 3, 5]
                    }
                }
            }
        },
        TEST_CASE_4: {
            cellIndex: 4,
            body: 'Cell 3',
            expect: {
                afterMove: {
                    up: {
                        cellOrder: [1, 2, 4, 3, 5]
                    },
                    down: {
                        cellOrder: [1, 2, 3, 5, 4]
                    }
                }
            }
        },
        TEST_CASE_5: {
            cellIndex: 5,
            body: 'Cell 4',
            expect: {
                afterMove: {
                    up: {
                        cellOrder: [1, 2, 3, 5, 4]
                    },
                    down: {
                        cellOrder: [1, 2, 3, 4, 5]
                    }
                }
            }
        }
    },
    ci: {
        defaults: {
            narrativeId: 58675
        }
    },
    'narrative-dev': {
        defaults: {
            narrativeId: 80970
        }
    }
};

async function testCellMovement({caseLabel, selectCell, direction}) {
    const t = new NarrativeTesting({testData, timeout: TIMEOUT, caseLabel});
    const cellIndex = t.caseData.cellIndex;
    const cells = t.testData.common.cells;
    const narrativeContainer = await t.openNarrative(t.caseData.narrativeId);

    function waitForExpectedCell(targetCellIndex, expectedCell) {
        if (expectedCell.title) {
            return t.waitForCellWithTitle(narrativeContainer, targetCellIndex, expectedCell.title);
        } else if (expectedCell.body) {
            return t.waitForCellWithBody(narrativeContainer, targetCellIndex, expectedCell.body);
        } else {
            throw new Error('Either title or body must be specified for a cell movement test');
        }
    }

    // Select a cell by title or body text.
    // Each test case targets a cell for movement, and this step ensures
    // that we start with the right one.
    const cell = await waitForExpectedCell(cellIndex, t.caseData);

    // Optionally select the cell.
    // Since the bug which triggered this set of tests was for movement
    // of unselected cells, we want to ensure that we can test for cell
    // movement of both selected and unselected cells.
    if (selectCell) {
        await t.selectCell(cell);
    }

    // Click the appropriate cell movement button.
    const button = await cell.$(`[data-test="cell-move-${direction}"]`);
    await clickWhenReady(button);

    // Loop through all of the cells in the test Narrative, ensuring that they
    // are in the expected order.
    // This relies on the "cellOrder" array, which contains expected ordering
    // of cells, where each cell is identified by it's original cell position.
    const cellOrder = t.caseData.expect.afterMove[direction].cellOrder;
    await Promise.all(cellOrder.map((originalCellIndex, index) => {
        const actualCellIndex = index + 1;
        // Get the expected title or body for the cell at that position, based
        // on the master list of starting cells.
        const expected = cells[originalCellIndex - 1];

        return waitForExpectedCell(actualCellIndex, expected);
    }));
}

describe('Test kbaseCellToolbarMenu movement buttons', () => {
    beforeEach(async () => {
        await browser.setTimeout({ 'implicit': 30000 });
        await browser.reloadSession();
        await login();
    });

    afterEach(async () => {
        await browser.deleteCookies();
    });

    // Move first cell 

    it('moves a minimized selected first cell down', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_1',
            direction: 'up',
            selectCell: false
        });
    });

    it('moves a minimized selected first cell down', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_1',
            direction: 'down',
            selectCell: false
        });
    });

    // Move second cell, a regular minimized cell.

    it('moves a minimized selected second cell up', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_2',
            direction: 'up',
            selectCell: false
        });
    });

    it('moves a minimized selected second cell down', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_2',
            direction: 'down',
            selectCell: false
        });
    });

    // ... so select it and try again

    it('selects and moves a minimized selected second cell up', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_2',
            direction: 'up',
            selectCell: true
        });
    });

    it('selects and moves a minimized selected second cell down', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_2',
            direction: 'down',
            selectCell: true
        });
    });

    // Third cell is minimized.

    it('moves a minimized selected second cell up', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_3',
            direction: 'up',
            selectCell: false
        });
    });

    it('moves a minimized selected second cell down', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_3',
            direction: 'down',
            selectCell: false
        });
    });

    // ... so select it and try again.

    it('moves a minimized selected second cell up', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_3',
            direction: 'up',
            selectCell: true
        });
    });

    it('moves a minimized selected second cell down', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_3',
            direction: 'down',
            selectCell: true
        });
    });

    // Fourth cell is expanded

    it('moves an expanded selected fourth cell up', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_4',
            direction: 'up',
            selectCell: false
        });
    });

    it('moves an expanded unselected fourth cell down', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_4',
            direction: 'down',
            selectCell: false
        });
    });

    // ... so select it and try again.

    it('selects and moves an expanded unselected second cell up', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_4',
            direction: 'up',
            selectCell: true
        });
    });

    it('selects and moves an expanded selected second cell down', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_4',
            direction: 'down',
            selectCell: true
        });
    });

    // Fifth cell is expanded

    it('moves an expanded selected fourth cell up', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_5',
            direction: 'up',
            selectCell: false
        });
    });

    it('moves an expanded selected fourth cell down', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_5',
            direction: 'down',
            selectCell: false
        });
    });

    // ... so select it and try again.

    it('selects and moves an expanded last cell up', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_5',
            direction: 'up',
            selectCell: true
        });
    });

    it('selects and moves an expanded last cell down', async () => {
        await testCellMovement({
            caseLabel: 'TEST_CASE_5',
            direction: 'down',
            selectCell: true
        });
    });
});
