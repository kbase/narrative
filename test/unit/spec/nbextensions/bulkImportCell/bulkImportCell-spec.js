define([
    '../../../../../../narrative/nbextensions/bulkImportCell/bulkImportCell',
    'base/js/namespace',
    'common/runtime',
    'narrativeMocks',
    'testUtil',
    '/test/data/testAppObj',
    'json!/test/data/NarrativeTest.test_input_params.spec.json',
], (BulkImportCell, Jupyter, Runtime, Mocks, TestUtil, TestAppObj, TestAppSpec) => {
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
                testSelector: '.kb-rcp__action-button-container .-rerun',
                testState: (elem) => !elem.classList.contains('hidden'),
                enabledTabs: ['viewConfigure', 'info', 'jobStatus', 'results', 'error'],
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
            it(`responds to run-status bus messages with ${testCase.msgEvent} event`, () => {
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
                return TestUtil.waitForElementState(cancelButton, () => {
                    return (
                        !runButton.classList.contains('disabled') &&
                        cancelButton.classList.contains('hidden')
                    );
                })
                    .then(() => {
                        runButton.click();
                        return TestUtil.waitForElementState(
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
                    })
                    .then(() => {
                        // expect(actionButton).not.toHaveClass('hidden');
                        expect(cell.metadata.kbase.bulkImportCell.state.state).toBe(
                            testCase.updatedState
                        );
                    });
            });
        });

        // [{
        //     state: 'launching',
        //     jobs: [],
        // }, {
        //     state: 'queued',
        //     jobs: ['job1', 'job2'],
        // }, {
        //     state: 'running',
        //     jobs: ['job1', 'job2']
        // }]
        ['launching', 'queued', 'running'].forEach((testCase) => {
            it(`should cancel the ${testCase} state and return to a previous state`, () => {
                // init cell with the test case state and jobs (they're all run-related)
                // wait for the cancel button to appear and be ready
                // click it
                // wait for it to reset to editingComplete
                // expect the exec part of the cell metadata to be gone
                // const runtime = Runtime.make();
                const cell = Mocks.buildMockCell('code');
                cell.execute = () => {};
                // add dummy metadata so we can make a cell that's in the ready-to-run state.
                const state = {
                    state: {
                        state: testCase,
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
                        // click the button and wait for the dialog to pop up
                        // const dialogOkButton = document.querySelector(
                        const okBtnSelector =
                            '[data-element="kbase"] [data-element="modal"] .modal-footer button[data-element="ok"]';
                        return TestUtil.waitForElement(document.body, okBtnSelector, () => {
                            cancelButton.click();
                        });
                    })
                    .then((okButton) => {
                        return TestUtil.waitForElementState(
                            runButton,
                            () => {
                                return (
                                    !runButton.classList.contains('hidden') &&
                                    !runButton.classList.contains('disabled')
                                );
                            },
                            () => {
                                okButton.click();
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

        it('should toggle the active file type', () => {
            const cell = Mocks.buildMockCell('code');
            const importData = {
                fastq: {
                    files: ['file1', 'file2', 'file3'],
                    appId: 'someApp',
                },
                sra: {
                    files: ['file4', 'file5'],
                    appId: 'someApp',
                },
            };
            BulkImportCell.make({
                cell,
                initialize: true,
                specs: fakeSpecs,
                importData,
            });
            const elem = cell.element.find('[data-element="filetype-panel"] [data-element="sra"]'),
                before = elem[0].outerHTML;
            elem.click();
            expect(elem[0].outerHTML).not.toEqual(before);
        });
    });
});
