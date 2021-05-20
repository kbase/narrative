define([
    '../../../../../../narrative/nbextensions/bulkImportCell/bulkImportCell',
    'base/js/namespace',
    'common/runtime',
    'narrativeMocks',
    'testUtil',
    '/test/data/testAppObj',
    'common/ui',
    'json!/test/data/NarrativeTest.test_input_params.spec.json',
], (BulkImportCell, Jupyter, Runtime, Mocks, TestUtil, TestAppObj, UI, TestAppSpec) => {
    'use strict';
    const fakeInputs = {
        dataType: {
            files: ['some_file'],
            appId: 'someApp',
        },
    };
    const fakeSpecs = {
        someApp: TestAppSpec,
    };

    describe('test the bulk import cell module', () => {
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterEach(() => {
            window.kbaseRuntime = null;
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        it('should construct a bulk import cell class', () => {
            const cell = Mocks.buildMockCell('code');
            expect(cell.getIcon).not.toBeDefined();
            expect(cell.renderIcon).not.toBeDefined();
            const cellWidget = BulkImportCell.make({
                cell,
                importData: fakeInputs,
                specs: fakeSpecs,
                initialize: true,
            });
            expect(cellWidget).toBeDefined();
            ['getIcon', 'renderIcon', 'maximize', 'minimize'].forEach((method) => {
                expect(cell[method]).toBeDefined();
            });
            expect(cell.metadata.kbase).toBeDefined();
            for (const prop of ['id', 'status', 'created', 'title', 'subtitle']) {
                expect(cell.metadata.kbase.attributes[prop]).toBeDefined();
            }
            expect(cell.metadata.kbase.type).toBe('app-bulk-import');
            expect(cell.metadata.kbase.bulkImportCell).toBeDefined();
            expect(cell.metadata.kbase.bulkImportCell.state).toEqual({
                state: 'editingIncomplete',
                selectedTab: 'configure',
                selectedFileType: 'dataType',
                params: {
                    dataType: 'incomplete',
                },
            });
        });

        it('should have a cell that can render its icon', () => {
            const cell = Mocks.buildMockCell('code');
            const cellWidget = BulkImportCell.make({
                cell,
                importData: fakeInputs,
                specs: fakeSpecs,
                initialize: true,
            });
            expect(cell).toBe(cellWidget.cell);
            expect(cell.getIcon()).toContain('fa-stack');
            cell.renderIcon();
            expect(cell.element.find('[data-element="icon"]').html()).toContain('fa-stack');
        });

        it('should fail to make a bulk import cell if the cell is not a code cell', () => {
            const cell = Mocks.buildMockCell('markdown');
            expect(() => BulkImportCell.make({ cell })).toThrow();
        });

        it('can tell whether a cell is bulk import cell with a static function', () => {
            const codeCell = Mocks.buildMockCell('code');
            expect(BulkImportCell.isBulkImportCell(codeCell)).toBeFalsy();
            BulkImportCell.make({
                cell: codeCell,
                importData: fakeInputs,
                specs: fakeSpecs,
                initialize: true,
            });
            expect(BulkImportCell.isBulkImportCell(codeCell)).toBeTruthy();
        });

        it('should fail to set up a cell that is not a bulk import cell (has been initialized)', () => {
            const cell = Mocks.buildMockCell('code');
            expect(() =>
                BulkImportCell({
                    cell,
                    importData: fakeInputs,
                    specs: fakeSpecs,
                    initialize: false,
                })
            ).toThrow();
        });

        it('should be able to delete its cell', () => {
            const cell = Mocks.buildMockCell('code');
            Jupyter.notebook = Mocks.buildMockNotebook();
            spyOn(Jupyter.notebook, 'delete_cell');
            const cellWidget = BulkImportCell.make({
                cell,
                importData: fakeInputs,
                specs: fakeSpecs,
                initialize: true,
            });

            cellWidget.deleteCell();
            expect(Jupyter.notebook.delete_cell).toHaveBeenCalled();
        });

        it('responds to a delete-cell bus message', () => {
            const runtime = Runtime.make();
            const cell = Mocks.buildMockCell('code');
            return new Promise((resolve) => {
                Jupyter.notebook = Mocks.buildMockNotebook({
                    deleteCallback: () => {
                        expect(Jupyter.notebook.delete_cell).toHaveBeenCalled();
                        resolve();
                    },
                });
                spyOn(Jupyter.notebook, 'delete_cell').and.callThrough();
                BulkImportCell.make({
                    cell,
                    importData: fakeInputs,
                    specs: fakeSpecs,
                    initialize: true,
                });
                runtime.bus().send(
                    {},
                    {
                        channel: {
                            cell: cell.metadata.kbase.attributes.id,
                        },
                        key: {
                            type: 'delete-cell',
                        },
                    }
                );
            });
        });

        [
            {
                msgEvent: 'error',
                updatedState: 'appError',
                msgData: {
                    message: 'app startup error',
                    stacktrace: 'doom\nDoom\nDOOOM',
                    code: '-1',
                    source: 'app manager',
                    method: 'AppManager.run_job_bulk',
                    exceptionType: 'ValueError',
                },
                testSelector: '.kb-rcp__action-button-container .-rerun',
                testState: (elem) => !elem.classList.contains('hidden'),
                enabledTabs: ['viewConfigure', 'info', 'jobStatus', 'results', 'error'],
                selectedTab: 'error',
            },
            {
                msgEvent: 'launched_job_batch',
                msgData: {
                    child_job_ids: ['foo'],
                },
                updatedState: 'queued',
                testSelector: '.kb-rcp__btn-toolbar button[data-button="jobStatus"]',
                testState: (elem) => !elem.classList.contains('disabled'),
            },
            {
                msgEvent: 'some-unknown-event',
                updatedState: 'generalError',
                testSelector: '.kb-rcp__action-button-container .-reset',
                testState: (elem) => !elem.classList.contains('hidden'),
            },
        ].forEach((testCase) => {
            it(`responds to run-status bus messages with ${testCase.msgEvent} event`, async () => {
                const runtime = Runtime.make();
                const cell = Mocks.buildMockCell('code');
                cell.execute = () => {};
                // add dummy metadata so we can make a cell that's in the ready-to-run state.
                const state = {
                    state: {
                        state: 'editingComplete',
                        selectedFileType: 'fastq_reads',
                        selectedTab: 'configure',
                        param: {
                            fastq_reads: 'complete',
                        },
                    },
                };
                cell.metadata = {
                    kbase: {
                        bulkImportCell: Object.assign({}, state, TestAppObj),
                        type: 'app-bulk-import',
                        attributes: {
                            id: 'some-fake-bulk-import-cell',
                        },
                    },
                };
                BulkImportCell.make({ cell });
                const testElem = cell.element[0].querySelector(testCase.testSelector);
                // wait for the actionButton to get initialized as hidden,
                // then send the message to put it in rerun state, and wait for the button to show,
                // then we can verify both the button and state in the cell metadata.
                const runButton = cell.element[0].querySelector(
                    '.kb-rcp__action-button-container .-run'
                );
                const cancelButton = cell.element[0].querySelector(
                    '.kb-rcp__action-button-container .-cancel'
                );
                await TestUtil.waitForElementState(cancelButton, () => {
                    return (
                        !runButton.classList.contains('disabled') &&
                        cancelButton.classList.contains('hidden')
                    );
                });
                runButton.click();
                await TestUtil.waitForElementState(
                    testElem,
                    () => {
                        return testCase.testState(testElem);
                    },
                    () => {
                        const message = Object.assign(
                            {
                                event: testCase.msgEvent,
                            },
                            testCase.msgData ? testCase.msgData : {}
                        );
                        runtime.bus().send(message, {
                            channel: {
                                cell: cell.metadata.kbase.attributes.id,
                            },
                            key: {
                                type: 'run-status',
                            },
                        });
                    }
                );
                expect(cell.metadata.kbase.bulkImportCell.state.state).toBe(testCase.updatedState);
                if (testCase.selectedTab) {
                    expect(cell.metadata.kbase.bulkImportCell.state.selectedTab).toBe(
                        testCase.selectedTab
                    );
                    const tab = cell.element[0].querySelector(
                        `.kb-rcp__tab-button[data-button="${testCase.selectedTab}"]`
                    );
                    expect(tab.classList.contains('active')).toBeTrue();
                }
            });
        });

        ['launching', 'queued', 'running'].forEach((testCase) => {
            it(`should cancel the ${testCase} state and return to a previous state`, () => {
                // init cell with the test case state and jobs (they're all run-related)
                // wait for the cancel button to appear and be ready, and for the run button to disappear
                // click it
                // wait for it to reset so the run button is visible
                // expect the state to be editingComplete
                const cell = Mocks.buildMockCell('code');
                // mock the Jupyter execute function.
                cell.execute = () => {};
                // kind of a cheat, but waiting on the dialogs to show up is really really inconsistent.
                // I'm guessing it's a jquery fadeIn event thing.
                spyOn(UI, 'showConfirmDialog').and.resolveTo(true);
                // add dummy metadata so we can make a cell that's in the ready-to-run state.
                const state = {
                    state: {
                        state: testCase,
                        selectedFileType: 'fastq_reads',
                        selectedTab: 'configure',
                        params: {
                            fastq_reads: 'complete',
                        },
                    },
                };
                cell.metadata = {
                    kbase: {
                        bulkImportCell: Object.assign({}, state, TestAppObj),
                        type: 'app-bulk-import',
                        attributes: {
                            id: 'some-fake-bulk-import-cell',
                        },
                    },
                };
                BulkImportCell.make({ cell });
                const cancelButton = cell.element[0].querySelector(
                    '.kb-rcp__action-button-container .-cancel'
                );
                const runButton = cell.element[0].querySelector(
                    '.kb-rcp__action-button-container .-run'
                );
                // wait for the cancel button to appear and the run button to disappear
                return TestUtil.waitForElementState(cancelButton, () => {
                    return (
                        !cancelButton.classList.contains('hidden') &&
                        !cancelButton.classList.contains('disabled') &&
                        runButton.classList.contains('hidden')
                    );
                })
                    .then(() => {
                        return TestUtil.waitForElementState(
                            runButton,
                            () => {
                                return (
                                    !runButton.classList.contains('hidden') &&
                                    !runButton.classList.contains('disabled')
                                );
                            },
                            () => {
                                cancelButton.click();
                            }
                        );
                    })
                    .then(() => {
                        expect(cell.metadata.kbase.bulkImportCell.state.state).toBe(
                            'editingComplete'
                        );
                    });
            });
        });
    });
});
