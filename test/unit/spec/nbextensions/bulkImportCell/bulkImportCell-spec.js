define([
    '../../../../../../narrative/nbextensions/bulkImportCell/bulkImportCell',
    'base/js/namespace',
    'common/dialogMessages',
    'common/runtime',
    'narrativeMocks',
    'testUtil',
    '/test/data/jobsData',
    '/test/data/testBulkImportObj',
    'common/ui',
    'narrativeConfig',
], (
    BulkImportCell,
    Jupyter,
    DialogMessages,
    Runtime,
    Mocks,
    TestUtil,
    JobsData,
    TestBulkImportObject,
    UI,
    Config
) => {
    'use strict';
    const fakeInputs = {
            dataType: {
                files: ['some_file'],
                appId: 'someApp',
            },
        },
        fakeSpecs = {
            someApp:
                TestBulkImportObject.app.specs[
                    'kb_uploadmethods/import_fastq_sra_as_reads_from_staging'
                ],
        },
        devMode = true;

    const selectors = {
        cancel: '.kb-rcp__action-button-container .-cancel',
        reset: '.kb-rcp__action-button-container .-reset',
        run: '.kb-rcp__action-button-container .-run',
    };

    /**
     *
     * @param {object} cell - cell object to be queried for tab structures
     * @param {object} tabStatus - object with keys
     *          {array} enabledTabs - names of enabled tabs
     *          {array} visibleTabs - names of visible tabs
     */
    function checkTabState(cell, tabStatus) {
        const { enabledTabs, visibleTabs } = tabStatus;
        const allTabs = cell.element[0].querySelectorAll('.kb-rcp__tab-button');
        allTabs.forEach((tab) => {
            const dataButton = tab.getAttribute('data-button');
            // check whether the tab is hidden or disabled
            const disabled = !enabledTabs.includes(dataButton);
            const hidden = !visibleTabs.includes(dataButton);
            expect(tab.classList.contains('disabled')).toBe(disabled);
            expect(tab.classList.contains('hidden')).toBe(hidden);
        });
    }

    fdescribe('The bulk import cell module', () => {
        let runtime;
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest(Config.url('workspace')).andReturn({
                status: 200,
                statusText: 'HTTP/1.1 200 OK',
                contentType: 'application/json',
                responseText: '',
            });
        });

        beforeEach(() => {
            runtime = Runtime.make();
        });

        afterEach(() => {
            runtime.destroy();
            TestUtil.clearRuntime();
        });

        afterAll(() => {
            Jupyter.narrative = null;
            jasmine.Ajax.requests.reset();
            jasmine.Ajax.uninstall();
        });

        describe('construction', () => {
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
                const cell = Mocks.buildMockCell('code');
                expect(BulkImportCell.isBulkImportCell(cell)).toBeFalsy();
                BulkImportCell.make({
                    cell,
                    importData: fakeInputs,
                    specs: fakeSpecs,
                    initialize: true,
                });
                expect(BulkImportCell.isBulkImportCell(cell)).toBeTruthy();
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
        });

        describe('deletion', () => {
            it('should be able to delete its cell', async () => {
                const cell = Mocks.buildMockCell('code');
                Jupyter.notebook = Mocks.buildMockNotebook();
                spyOn(Jupyter.notebook, 'delete_cell');
                // when the dialog comes up, mimic a "yes" response
                spyOn(DialogMessages, 'showDialog').and.resolveTo(true);

                const cellWidget = BulkImportCell.make({
                    cell,
                    importData: fakeInputs,
                    specs: fakeSpecs,
                    initialize: true,
                });
                await cellWidget.deleteCell();
                expect(Jupyter.notebook.delete_cell).toHaveBeenCalled();
            });

            it('will not delete its cell if the user says no', async () => {
                const cell = Mocks.buildMockCell('code');
                Jupyter.notebook = Mocks.buildMockNotebook();
                spyOn(Jupyter.notebook, 'delete_cell');
                // mimic a "no" response
                spyOn(DialogMessages, 'showDialog').and.resolveTo(false);

                const cellWidget = BulkImportCell.make({
                    cell,
                    importData: fakeInputs,
                    specs: fakeSpecs,
                    initialize: true,
                });
                await cellWidget.deleteCell();
                expect(Jupyter.notebook.delete_cell).not.toHaveBeenCalled();
            });

            it('responds to a delete-cell bus message', () => {
                const cell = Mocks.buildMockCell('code');
                return new Promise((resolve) => {
                    Jupyter.notebook = Mocks.buildMockNotebook({
                        deleteCallback: () => {
                            expect(Jupyter.notebook.delete_cell).toHaveBeenCalled();
                            resolve();
                        },
                    });
                    spyOn(Jupyter.notebook, 'delete_cell').and.callThrough();
                    spyOn(DialogMessages, 'showDialog').and.resolveTo(true);
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
        });

        describe('state changes', () => {
            [
                {
                    msgEvent: 'error',
                    msgData: {
                        message: 'app startup error',
                        stacktrace: 'doom\nDoom\nDOOOM',
                        code: '-1',
                        source: 'app manager',
                        method: 'AppManager.run_job_bulk',
                        exceptionType: 'ValueError',
                    },
                    updatedState: 'error',
                    testSelector: selectors.reset,
                    testState: (elem) => !elem.classList.contains('hidden'),
                    enabledTabs: ['viewConfigure', 'info', 'jobStatus', 'error'],
                    visibleTabs: ['viewConfigure', 'info', 'jobStatus', 'error'],
                    selectedTab: 'error',
                },
                {
                    msgEvent: 'launched_job_batch',
                    msgData: {
                        batch_id: 'bar',
                        child_job_ids: ['foo'],
                    },
                    updatedState: 'inProgress',
                    testSelector: '.kb-rcp__btn-toolbar button[data-button="jobStatus"]',
                    testState: (elem) => !elem.classList.contains('disabled'),
                    enabledTabs: ['viewConfigure', 'info', 'jobStatus'],
                    visibleTabs: ['viewConfigure', 'info', 'jobStatus', 'results'],
                },
                {
                    msgEvent: 'some-unknown-event',
                    updatedState: 'error',
                    testSelector: selectors.reset,
                    testState: (elem) => !elem.classList.contains('hidden'),
                    enabledTabs: ['viewConfigure', 'info', 'jobStatus', 'error'],
                    visibleTabs: ['viewConfigure', 'info', 'jobStatus', 'error'],
                    selectedTab: 'error',
                },
            ].forEach((testCase) => {
                it(`responds to run-status bus messages with ${testCase.msgEvent} event`, async () => {
                    const cell = Mocks.buildMockCell('code');
                    cell.execute = () => {
                        console.error('running execute!');
                    };
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
                            bulkImportCell: Object.assign(
                                {},
                                state,
                                TestUtil.JSONcopy(TestBulkImportObject)
                            ),
                            type: 'app-bulk-import',
                            attributes: {
                                id: `${testCase.msgEvent}-test-cell`,
                            },
                        },
                    };
                    // remove job data
                    delete cell.metadata.kbase.bulkImportCell.exec;
                    BulkImportCell.make({ cell, devMode });
                    const testElem = cell.element[0].querySelector(testCase.testSelector);
                    // wait for the actionButton to get initialized as hidden
                    // send the message to put it in the run state, and wait for the button to show,
                    // then we can verify both the button and state in the cell metadata.
                    const runButton = cell.element[0].querySelector(selectors.run);
                    const cancelButton = cell.element[0].querySelector(selectors.cancel);
                    spyOn(console, 'error');
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
                            // make sure the cell is in the 'launching' state
                            // TODO: uncomment this test once tab states are fixed
                            // checkTabState(cell, {
                            //     enabledTabs: ['viewConfigure', 'info'],
                            //     visibleTabs: ['viewConfigure', 'info', 'jobStatus', 'results'],
                            // });
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
                    expect(console.error.calls.allArgs()).toEqual([['running execute!']]);
                    expect(cell.metadata.kbase.bulkImportCell.state.state).toBe(
                        testCase.updatedState
                    );
                    if (testCase.selectedTab) {
                        expect(cell.metadata.kbase.bulkImportCell.state.selectedTab).toBe(
                            testCase.selectedTab
                        );
                        const tab = cell.element[0].querySelector(
                            `.kb-rcp__tab-button[data-button="${testCase.selectedTab}"]`
                        );
                        expect(tab.classList.contains('active')).toBeTrue();
                    }
                    checkTabState(cell, testCase);
                });
            });

            // FIXME: this test fails as the input does not validate. Fix the input to
            // pass validation and reenable this test.
            xit('Should start up in "editingComplete" state when initialized with proper data', async () => {
                const cell = Mocks.buildMockCell('code');
                Jupyter.notebook = Mocks.buildMockNotebook();
                BulkImportCell.make({
                    cell,
                    importData: fakeInputs,
                    specs: fakeSpecs,
                    initialize: true,
                });
                const runButton = cell.element[0].querySelector(selectors.run);
                const cancelButton = cell.element[0].querySelector(selectors.cancel);
                const resetButton = cell.element[0].querySelector(selectors.reset);
                await TestUtil.waitForElementState(cell.element[0], () => {
                    return (
                        !runButton.classList.contains('hidden') &&
                        !runButton.classList.contains('disabled') &&
                        cancelButton.classList.contains('hidden') &&
                        cancelButton.classList.contains('disabled') &&
                        resetButton.classList.contains('hidden')
                    );
                });
                expect(cell.metadata.kbase.bulkImportCell.state.state).toBe('editingComplete');
            });
        });

        describe('cancel', () => {
            ['launching', 'inProgress', 'inProgressResultsAvailable'].forEach((testCase) => {
                it(`should cancel the ${testCase} state and return to a previous state`, () => {
                    // init cell with the test case state and jobs (they're all run-related)
                    // wait for the cancel button to appear and be ready, and for the run button to disappear
                    // click it
                    // wait for it to reset so the run button is visible
                    // expect the state to be editingComplete
                    const cell = Mocks.buildMockCell('code');
                    // mock the Jupyter execute function.
                    cell.execute = () => {};
                    Jupyter.notebook = Mocks.buildMockNotebook();
                    // kind of a cheat, but waiting on the dialogs to show up is really really inconsistent.
                    // I'm guessing it's a jquery fadeIn event thing.
                    spyOn(UI, 'showConfirmDialog').and.resolveTo(true);
                    spyOn(Jupyter.notebook, 'save_checkpoint');
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
                            bulkImportCell: Object.assign(
                                {},
                                state,
                                TestUtil.JSONcopy(TestBulkImportObject)
                            ),
                            type: 'app-bulk-import',
                            attributes: {
                                id: `${testCase}-state-test-cell`,
                            },
                        },
                    };
                    const bulkImportCellInstance = BulkImportCell.make({ cell, devMode });
                    const cancelButton = cell.element[0].querySelector(selectors.cancel);
                    const runButton = cell.element[0].querySelector(selectors.run);
                    // wait for the cancel button to appear and the run button to disappear
                    return TestUtil.waitForElementState(cancelButton, () => {
                        return (
                            !cancelButton.classList.contains('hidden') &&
                            !cancelButton.classList.contains('disabled') &&
                            runButton.classList.contains('hidden')
                        );
                    })
                        .then(() => {
                            const jobsById = bulkImportCellInstance.jobManager.model.getItem(
                                'exec.jobs.byId'
                            );
                            expect(Object.keys(jobsById).length).toEqual(
                                JobsData.allJobsWithBatchParent.length
                            );
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
                            // jobs should have been reset and listeners removed
                            expect(bulkImportCellInstance.jobManager.model.getItem('exec')).toEqual(
                                undefined
                            );
                            expect(bulkImportCellInstance.jobManager.listeners).toEqual({});
                            expect(Jupyter.notebook.save_checkpoint.calls.allArgs()).toEqual([[]]);
                        });
                });
            });

            it('should cancel jobs between the batch job being submitted and the server response being returned', async () => {
                const cell = Mocks.buildMockCell('code');
                Jupyter.notebook = Mocks.buildMockNotebook();
                spyOn(Jupyter.notebook, 'save_checkpoint');
                cell.execute = () => {
                    // do nothing
                };
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
                        bulkImportCell: Object.assign(
                            {},
                            state,
                            TestUtil.JSONcopy(TestBulkImportObject)
                        ),
                        type: 'app-bulk-import',
                        attributes: {
                            id: `cancel-no-run-status-test-cell`,
                        },
                    },
                };
                // remove job data
                delete cell.metadata.kbase.bulkImportCell.exec;
                const bulkImportCellInstance = BulkImportCell.make({ cell, devMode });
                spyOn(UI, 'showConfirmDialog').and.resolveTo(true);
                spyOn(bulkImportCellInstance.jobManager, 'initBatchJob').and.callThrough();
                spyOn(bulkImportCellInstance.jobManager.bus, 'emit');
                const cancelButton = cell.element[0].querySelector(selectors.cancel);
                const runButton = cell.element[0].querySelector(selectors.run);

                // wait until the cell is set up to run
                await TestUtil.waitForElementState(runButton, () => {
                    return (
                        !runButton.classList.contains('hidden') &&
                        !runButton.classList.contains('disabled') &&
                        cancelButton.classList.contains('hidden')
                    );
                });

                // this puts the cell into the 'launching' state
                runButton.click();
                // wait for the cancel button to appear and the run button to disappear
                await TestUtil.waitForElementState(cancelButton, () => {
                    return (
                        !cancelButton.classList.contains('hidden') &&
                        !cancelButton.classList.contains('disabled') &&
                        runButton.classList.contains('hidden')
                    );
                });

                // no jobs yet
                const jobsById = bulkImportCellInstance.jobManager.model.getItem('exec.jobs.byId');
                expect(jobsById).toEqual(undefined);

                await TestUtil.waitForElementState(
                    cell.element[0],
                    () => {
                        return (
                            cell.element[0].querySelector('.kb-rcp-status__container')
                                .textContent === 'Canceling...'
                        );
                    },
                    () => {
                        // click the cancel button before the message about the
                        // new jobs comes back
                        cancelButton.click();
                    }
                );

                await TestUtil.waitForElementState(
                    cell.element[0],
                    () => {
                        // run button is active again
                        return (
                            !runButton.classList.contains('hidden') &&
                            !runButton.classList.contains('disabled') &&
                            cancelButton.classList.contains('hidden')
                        );
                    },
                    () => {
                        // send the message with the new job info
                        runtime.bus().send(
                            {
                                event: 'launched_job_batch',
                                batch_id: JobsData.batchParentJob.job_id,
                                child_job_ids: JobsData.allJobs.map((job) => {
                                    return job.job_id;
                                }),
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
                // batch job data should have been received and processed
                expect(bulkImportCellInstance.jobManager.initBatchJob).toHaveBeenCalledTimes(1);
                const batchId = JobsData.batchParentJob.job_id;
                // bus calls to init jobs, request info, cancel jobs, and stop updates
                const callArgs = JobsData.allJobsWithBatchParent
                    .map((jobState) => {
                        return ['request-job-updates-start', { jobId: jobState.job_id }];
                    })
                    .concat(
                        [['request-job-status', { batchId }]],
                        [['request-job-info', { batchId }]],
                        [['request-job-cancel', { jobIdList: [batchId] }]]
                    )
                    .concat(
                        JobsData.allJobsWithBatchParent.map((jobState) => {
                            return ['request-job-updates-stop', { jobId: jobState.job_id }];
                        })
                    );

                expect(Jupyter.notebook.save_checkpoint.calls.allArgs()).toEqual([[]]);
                expect(bulkImportCellInstance.jobManager.bus.emit.calls.allArgs()).toEqual(
                    jasmine.arrayWithExactContents(callArgs)
                );

                expect(cell.metadata.kbase.bulkImportCell.state.state).toBe('editingComplete');
                // jobs should have been reset and listeners removed
                expect(bulkImportCellInstance.jobManager.model.getItem('exec')).toEqual(undefined);
                expect(bulkImportCellInstance.jobManager.listeners).toEqual({});
                checkTabState(cell, {
                    enabledTabs: ['configure', 'info'],
                    visibleTabs: ['configure', 'info', 'jobStatus', 'results'],
                });
            });
        });
    });
});
