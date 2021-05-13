define([
    '../../../../../../narrative/nbextensions/bulkImportCell/bulkImportCell',
    'base/js/namespace',
    'common/runtime',
    'narrativeMocks',
    'testUtil',
    'json!/test/data/NarrativeTest.test_input_params.spec.json',
], (BulkImportCell, Jupyter, Runtime, Mocks, TestUtil, TestAppSpec) => {
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
                availableButton: 'rerun',
                initialState: 'hidden',
            },
            {
                msgEvent: 'launched_job_batch',
                updatedState: 'queued',
                availableButton: 'cancel',
                initialState: 'hidden',
            },
            {
                msgEvent: 'some-unknown-event',
                updatedState: 'generalError',
                availableButton: 'reset',
                initialState: 'hidden',
            },
        ].forEach((testCase) => {
            it(`responds to run-status bus messages with ${testCase.msgEvent} event`, () => {
                const runtime = Runtime.make();
                const cell = Mocks.buildMockCell('code');
                BulkImportCell.make({
                    cell,
                    importData: fakeInputs,
                    specs: fakeSpecs,
                    initialize: true,
                });
                const actionButton = cell.element[0].querySelector(
                    `.kb-rcp__action-button-container .-${testCase.availableButton}`
                );
                // wait for the actionButton to get initialized as hidden,
                // then send the message to put it in rerun state, and wait for the button to show,
                // then we can verify both the button and state in the cell metadata.
                return TestUtil.waitForElementState(actionButton, () => {
                    return actionButton.classList.contains(testCase.initialState);
                })
                    .then(() => {
                        return TestUtil.waitForElementState(
                            actionButton,
                            () => {
                                return !actionButton.classList.contains(testCase.initialState);
                            },
                            () => {
                                runtime.bus().send(
                                    {
                                        event: testCase.msgEvent,
                                    },
                                    {
                                        channel: {
                                            cell: cell.metadata.kbase.attributes.id,
                                        },
                                        key: {
                                            type: 'run-status',
                                        },
                                    }
                                );
                            }
                        );
                    })
                    .then(() => {
                        expect(actionButton).not.toHaveClass('hidden');
                        expect(cell.metadata.kbase.bulkImportCell.state.state).toBe(
                            testCase.updatedState
                        );
                    });
            });
        });
    });
});
