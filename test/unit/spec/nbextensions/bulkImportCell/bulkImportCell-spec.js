define([
    '/narrative/nbextensions/bulkImportCell/bulkImportCell',
    'util/appCellUtil',
    'base/js/namespace',
    'common/dialogMessages',
    'common/jobs',
    'common/runtime',
    'narrativeMocks',
    'testUtil',
    '/test/data/jobsData',
    '/test/data/testBulkImportObj',
    'common/ui',
    'narrativeConfig',
], (
    BulkImportCell,
    BulkImportUtil,
    Jupyter,
    DialogMessages,
    Jobs,
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
    const batchId = JobsData.batchParentJob.job_id;

    /**
     * Initialise a fake bulk import cell
     * @param {object} args with keys
     *      {string} state          -- FSM state (cell metadata)
     *      {string} selectedTab    -- selected tab (cell metadata)
     *      {string} cellId         -- the KBase cell ID (cell metadata); `state` is used if not present
     *      {bool}   deleteJobData  -- if true, will remove the `exec` key from the cell metadata
     * @returns {object} with keys `cell` and `bulkImportCellInstance`
     */
    function initCell(args) {
        if (!args.cellId) {
            args.cellId = args.state;
        }
        const cell = Mocks.buildMockCell('code');
        cell.execute = () => {
            console.error('running execute!');
        };
        // add dummy metadata so we can make a cell that's in the ready-to-run state.
        const state = {
            state: {
                state: args.state,
                selectedFileType: 'fastq_reads',
                selectedTab: args.selectedTab,
                params: {
                    fastq_reads: 'complete',
                },
            },
        };
        cell.metadata = {
            kbase: {
                bulkImportCell: Object.assign({}, state, TestUtil.JSONcopy(TestBulkImportObject)),
                type: 'app-bulk-import',
                attributes: {
                    id: `${args.cellId}-test-cell`,
                },
            },
        };
        if (args.deleteJobData) {
            // remove job data
            delete cell.metadata.kbase.bulkImportCell.exec;
            spyOn(BulkImportUtil, 'getMissingFiles').and.resolveTo([]);
            spyOn(BulkImportUtil, 'evaluateConfigReadyState').and.resolveTo({
                fastq_reads: 'complete',
            });
        }

        const bulkImportCellInstance = BulkImportCell.make({ cell, devMode });
        return { cell, bulkImportCellInstance };
    }

    /**
     *
     * @param {object} cell - cell object to be queried for tab structures
     * @param {object} tabStatus - object with keys
     *          {array} enabledTabs -  names of enabled tabs
     *          {array} visibleTabs -  names of visible tabs
     *          {string} selectedTab - the active tab
     */
    function checkTabState(cell, tabStatus) {
        const { enabledTabs, visibleTabs, selectedTab } = tabStatus;
        expect(cell.metadata.kbase.bulkImportCell.state.selectedTab).toBe(selectedTab);
        const allTabs = cell.element[0].querySelectorAll('.kb-rcp__tab-button');
        allTabs.forEach((tab) => {
            const dataButton = tab.getAttribute('data-button');
            // check whether the tab is hidden or disabled
            const disabled = !enabledTabs.includes(dataButton);
            const hidden = !visibleTabs.includes(dataButton);
            expect(tab.classList.contains('disabled')).toBe(disabled);
            expect(tab.classList.contains('hidden')).toBe(hidden);
            // whether or not this is the selected tab
            expect(tab.classList.contains('active')).toBe(dataButton === selectedTab);
        });
    }

    describe('The bulk import cell module', () => {
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
            const cellInitArgs = {
                devMode,
                importData: fakeInputs,
                specs: fakeSpecs,
                initialize: true,
            };
            it('should be able to delete its cell', async () => {
                const cell = Mocks.buildMockCell('code');
                Jupyter.notebook = Mocks.buildMockNotebook();
                spyOn(Jupyter.notebook, 'delete_cell');
                // when the dialog comes up, mimic a "yes" response
                spyOn(DialogMessages, 'showDialog').and.resolveTo(true);

                const cellWidget = BulkImportCell.make({ cell, ...cellInitArgs });
                spyOn(cellWidget.jobManager, 'cancelBatchJob');
                await cellWidget.deleteCell();
                expect(Jupyter.notebook.delete_cell).toHaveBeenCalled();
                expect(cellWidget.jobManager.cancelBatchJob).toHaveBeenCalled();
            });

            it('will not delete its cell if the user says no', async () => {
                const cell = Mocks.buildMockCell('code');
                Jupyter.notebook = Mocks.buildMockNotebook();
                spyOn(Jupyter.notebook, 'delete_cell');
                // mimic a "no" response
                spyOn(DialogMessages, 'showDialog').and.resolveTo(false);

                const cellWidget = BulkImportCell.make({ cell, ...cellInitArgs });
                spyOn(cellWidget.jobManager, 'cancelBatchJob');
                await cellWidget.deleteCell();
                expect(Jupyter.notebook.delete_cell).not.toHaveBeenCalled();
                expect(cellWidget.jobManager.cancelBatchJob).not.toHaveBeenCalled();
            });

            it('responds to a delete-cell bus message', () => {
                const cell = Mocks.buildMockCell('code');
                return new Promise((resolve) => {
                    Jupyter.notebook = Mocks.buildMockNotebook({
                        deleteCallback: () => {
                            expect(Jupyter.notebook.delete_cell).toHaveBeenCalled();
                            expect(cellWidget.jobManager.cancelBatchJob).toHaveBeenCalled();
                            resolve();
                        },
                    });
                    spyOn(Jupyter.notebook, 'delete_cell').and.callThrough();
                    spyOn(DialogMessages, 'showDialog').and.resolveTo(true);

                    const cellWidget = BulkImportCell.make({ cell, ...cellInitArgs });
                    spyOn(cellWidget.jobManager, 'cancelBatchJob');
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
                    selectedTab: 'jobStatus',
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
                    // start the cell in the editing complete state -- ready to run
                    const { cell } = initCell({
                        state: 'editingComplete',
                        selectedTab: 'configure',
                        deleteJobData: true,
                    });

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

                    // once the cell is in the 'launching' state, the cancel button will be shown
                    await TestUtil.waitForElementState(runButton, () => {
                        return !cancelButton.classList.contains('hidden');
                    });
                    checkTabState(cell, {
                        selectedTab: 'viewConfigure',
                        enabledTabs: ['viewConfigure', 'info'],
                        visibleTabs: ['viewConfigure', 'info', 'jobStatus', 'results'],
                    });

                    // wait for the cell to receive the run status message and transition
                    // to the next state
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
                    expect(console.error.calls.allArgs()).toEqual([['running execute!']]);
                    expect(cell.metadata.kbase.bulkImportCell.state.state).toBe(
                        testCase.updatedState
                    );
                    checkTabState(cell, testCase);
                });
            });

            it('should revert to editingComplete mode if it starts off in launching', async () => {
                // TODO: this should find what jobs are associated with the cell
                const { cell } = initCell({
                    state: 'launching',
                    selectedTab: 'info',
                    deleteJobData: true,
                });

                const runButton = cell.element[0].querySelector(selectors.run);
                const cancelButton = cell.element[0].querySelector(selectors.cancel);
                const resetButton = cell.element[0].querySelector(selectors.reset);
                await TestUtil.waitForElementState(cell.element[0], () => {
                    return (
                        !runButton.classList.contains('hidden') &&
                        !runButton.classList.contains('disabled') &&
                        cancelButton.classList.contains('hidden') &&
                        resetButton.classList.contains('hidden')
                    );
                });
                expect(cell.metadata.kbase.bulkImportCell.state.state).toBe('editingComplete');
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

            it('corrects the active tab if started with an invalid selection', async () => {
                const { cell } = initCell({
                    state: 'editingComplete',
                    selectedTab: 'jobStatus',
                    deleteJobData: true,
                });

                // the cell is ready to run, so wait for the appropriate buttons to appear
                const runButton = cell.element[0].querySelector(selectors.run);
                const cancelButton = cell.element[0].querySelector(selectors.cancel);
                await TestUtil.waitForElementState(cancelButton, () => {
                    return (
                        !runButton.classList.contains('disabled') &&
                        cancelButton.classList.contains('hidden')
                    );
                });
                checkTabState(cell, {
                    selectedTab: 'configure',
                    enabledTabs: ['configure', 'info'],
                    visibleTabs: ['configure', 'info', 'jobStatus', 'results'],
                });
            });
        });

        describe('cancel and reset', () => {
            const tests = [
                {
                    state: 'inProgressResultsAvailable',
                    action: 'cancel',
                    selectedTab: 'jobStatus',
                },
                {
                    state: 'inProgress',
                    action: 'cancel',
                    selectedTab: 'jobStatus',
                },
                {
                    state: 'launching',
                    action: 'cancel',
                    selectedTab: 'viewConfigure',
                },
                {
                    state: 'jobsFinished',
                    action: 'reset',
                    selectedTab: 'jobStatus',
                },
                {
                    state: 'jobsFinishedResultsAvailable',
                    action: 'reset',
                    selectedTab: 'results',
                },
                {
                    state: 'error',
                    action: 'reset',
                    selectedTab: 'error',
                },
            ];
            tests.forEach((testCase) => {
                it(`should ${testCase.action} the ${testCase.state} state and return to a previous state`, () => {
                    // init cell with the test case state and jobs (they're all run-related)
                    // wait for the cancel/reset button to appear and be ready for clicking
                    // click it
                    // wait for the cell to reset so the run button is visible
                    // expect the state to be editingComplete
                    Jupyter.notebook = Mocks.buildMockNotebook();
                    spyOn(Jupyter.notebook, 'save_checkpoint');
                    spyOn(Date, 'now').and.returnValue(1234567890);
                    testCase.cellId = `${testCase.state}-${testCase.action}`;
                    const { cell, bulkImportCellInstance } = initCell(testCase);

                    // kind of a cheat, but waiting on the dialogs to show up is really really inconsistent.
                    // I'm guessing it's a jquery fadeIn event thing.
                    spyOn(UI, 'showConfirmDialog').and.resolveTo(true);
                    spyOn(Jobs, 'getFsmStateFromJobs').and.returnValue(testCase.state);
                    spyOn(bulkImportCellInstance.jobManager.bus, 'emit');

                    const actionButton = cell.element[0].querySelector(selectors[testCase.action]);
                    const runButton = cell.element[0].querySelector(selectors.run);
                    // wait for the cancel/reset button to appear and the run button to disappear
                    return TestUtil.waitForElementState(actionButton, () => {
                        return (
                            !actionButton.classList.contains('hidden') &&
                            !actionButton.classList.contains('disabled') &&
                            runButton.classList.contains('hidden')
                        );
                    })
                        .then(() => {
                            const jobsById =
                                bulkImportCellInstance.jobManager.model.getItem('exec.jobs.byId');
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
                                    actionButton.click();
                                }
                            );
                        })
                        .then(() => {
                            expect(cell.metadata.kbase.bulkImportCell.state.state).toBe(
                                'editingComplete'
                            );
                            // check the tab state: all should have reverted to the 'configure' tab on reset
                            checkTabState(cell, {
                                selectedTab: 'configure',
                                enabledTabs: ['configure', 'info'],
                                visibleTabs: ['configure', 'info', 'jobStatus', 'results'],
                            });

                            // jobs should have been reset and listeners removed
                            expect(bulkImportCellInstance.jobManager.model.getItem('exec')).toEqual(
                                undefined
                            );
                            expect(bulkImportCellInstance.jobManager.listeners).toEqual({});
                            expect(Jupyter.notebook.save_checkpoint.calls.allArgs()).toEqual([[]]);
                            if (testCase.action === 'reset') {
                                const allEmissions =
                                    bulkImportCellInstance.jobManager.bus.emit.calls.allArgs();
                                expect([
                                    ['request-job-updates-start', { batchId }],
                                    ['request-job-cancel', { jobIdList: [batchId] }],
                                    ['request-job-updates-stop', { batchId }],
                                    [
                                        'reset-cell',
                                        { cellId: `${testCase.cellId}-test-cell`, ts: 1234567890 },
                                    ],
                                ]).toEqual(allEmissions);
                            }
                        });
                });
            });

            it('should cancel jobs between the batch job being submitted and the server response being returned', async () => {
                const cellId = 'cancelDuringSubmit';
                Jupyter.notebook = Mocks.buildMockNotebook();
                spyOn(Jupyter.notebook, 'save_checkpoint');
                spyOn(Date, 'now').and.returnValue(1234567890);
                const { cell, bulkImportCellInstance } = initCell({
                    cellId,
                    state: 'editingComplete',
                    selectedTab: 'configure',
                    deleteJobData: true,
                });

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
                // bus calls to init jobs, request info, cancel jobs, and stop updates
                const callArgs = [
                    ['request-job-updates-start', { batchId }],
                    ['request-job-info', { batchId }],
                    ['request-job-cancel', { jobIdList: [batchId] }],
                    ['request-job-updates-stop', { batchId }],
                    ['reset-cell', { cellId: `${cellId}-test-cell`, ts: 1234567890 }],
                ];
                expect(Jupyter.notebook.save_checkpoint.calls.allArgs()).toEqual([[]]);
                expect(bulkImportCellInstance.jobManager.bus.emit.calls.allArgs()).toEqual(
                    jasmine.arrayWithExactContents(callArgs)
                );

                expect(cell.metadata.kbase.bulkImportCell.state.state).toBe('editingComplete');
                // jobs should have been reset and listeners removed
                expect(bulkImportCellInstance.jobManager.model.getItem('exec')).toEqual(undefined);
                expect(bulkImportCellInstance.jobManager.listeners).toEqual({});
                checkTabState(cell, {
                    selectedTab: 'configure',
                    enabledTabs: ['configure', 'info'],
                    visibleTabs: ['configure', 'info', 'jobStatus', 'results'],
                });
            });
        });
    });
});
