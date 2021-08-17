define([
    'jquery',
    'bluebird',
    'common/cellComponents/tabs/jobStatus/jobStatusTable',
    'common/jobs',
    'common/jobManager',
    'common/props',
    'common/runtime',
    'testUtil',
    '/test/data/jobsData',
], ($, Promise, JobStatusTable, Jobs, JobManagerModule, Props, Runtime, TestUtil, JobsData) => {
    'use strict';
    const { JobManager } = JobManagerModule;

    const cssBaseClass = JobStatusTable.cssBaseClass;
    const allJobsWithBatchParent = JobsData.allJobsWithBatchParent;
    const allJobsNoBatchParent = JobsData.allJobs;
    const batchId = JobsData.batchParentJob.job_id;

    const paramTestsJobArray = [
            {
                job_id: 'job_update_test',
                status: 'created',
                created: 50,
                retry_parent: 'generic_retry_parent',
                batch_id: 'batch_job',
                meta: {
                    jobAction: 'cancel',
                    jobLabel: 'queued',
                    retryTarget: 'generic_retry_parent',
                    row_id: 'generic_retry_parent',
                },
            },
            {
                job_id: 'generic_retry_parent',
                status: 'terminated',
                batch_id: 'batch_job',
                created: 10,
            },
            {
                batch_id: 'batch_job',
                job_id: 'batch_job',
                batch_job: true,
                child_jobs: ['generic_retry_parent', 'job_update_test'],
            },
        ],
        paramTests = [
            {
                input: {
                    job_params: [{ this: 'that' }],
                },
                regex: /this: that/,
            },
            {
                input: {
                    job_params: [{ tag_two: 'value two', tag_three: 'value three' }],
                },
                regex: /tag_three: value three.*?tag_two: value two/ims,
            },
        ],
        jobUpdateTestJob = {
            job_id: 'job_update_test',
            status: 'created',
            created: 0,
            meta: {
                jobAction: 'cancel',
                jobLabel: 'queued',
                retryTarget: 'job_update_test',
            },
        };

    function JSONcopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function makeModel(jobs) {
        const tempModel = Props.make({
            data: {},
        });
        Jobs.populateModelFromJobArray(tempModel, jobs);
        return tempModel;
    }

    function createInstance(config = {}) {
        return JobStatusTable.make(
            Object.assign(
                {},
                {
                    jobManager: new JobManager({
                        model: makeModel(allJobsWithBatchParent),
                        bus: Runtime.make().bus(),
                    }),
                },
                config
            )
        );
    }

    function createStartedInstance(container, config = {}) {
        const instance = createInstance(config);
        return new Promise((resolve) => {
            instance.start({
                node: container,
            });
            resolve(instance);
        });
    }

    /**
     * Create a started job status table instance and populate the context
     *
     * @param {object} context - jasmine `this` context
     * @param {object} jobArray - array of jobs to put in the job status table.
     *                            the first job in the array is assigned as context.job
     */
    async function createJobStatusTableWithContext(context, jobArray) {
        if (!Array.isArray(jobArray)) {
            jobArray = [jobArray];
        }

        context.job = jobArray[0];
        context.jobId = context.job.job_id;
        context.container = document.createElement('div');
        context.jobManager = new JobManager({
            model: makeModel(jobArray),
            bus: Runtime.make().bus(),
        });
        context.jobStatusTableInstance = await createStartedInstance(context.container, {
            jobManager: context.jobManager,
            toggleTab: context.toggleTab || null,
        }).then(() => {
            context.row = context.container.querySelector('tbody tr');
            return context.jobStatusTableInstance;
        });
    }

    /**
     * itHasRowStructure expects `this` to be set up as follows:
     *
     * row: a row element from the job status table
     * job: the original job object used to create the table row
     *      it has extra data under the key 'meta'
     * input: an altered job object with extra data under the key 'meta'
     */

    function itHasRowStructure() {
        it(`has the correct row structure`, function () {
            const row = this.row;
            const job = this.job;
            const input = this.input || job;

            _checkRowStructure(row, job, input);
        });
    }

    /**
     *
     * @param {DOM element} row: the row in the job status table to be tested
     * @param {object} job: the original job object used to create the row
     * @param {object} input: the input used to update the row (if applicable)
     *
     * input and/or job should have validation data under the 'meta' key
     */
    function _checkRowStructure(row, job, input) {
        if (!input) {
            input = job;
        }

        // row ID: may be specified in job.meta.row_id, e.g. if the job is a retry
        expect(row.id).toEqual(`job_${job.meta && job.meta.row_id ? job.meta.row_id : job.job_id}`);

        // status details cell
        const logViewEl = row.querySelector(`.${cssBaseClass}__cell--log-view`);
        expect(logViewEl.textContent).toContain('Status details');

        // object name
        const objectEl = row.querySelector(`.${cssBaseClass}__cell--object`);
        if (input.meta.paramsRegex) {
            expect(objectEl.textContent).toMatch(input.meta.paramsRegex);
        } else {
            // for a retried job, this should be input.job_id
            expect(objectEl.textContent).toContain(input.job_id);
        }

        // action
        const actionEl = row.querySelector(`.${cssBaseClass}__cell--action`);
        expect(actionEl.textContent).toEqual(input.meta.jobAction ? input.meta.jobAction : '');

        const actionButton = actionEl.querySelector('button');
        if (actionButton) {
            const target = actionButton.getAttribute('data-target');
            if (actionEl.textContent === 'retry') {
                expect(target).toEqual(input.meta.retryTarget);
            } else {
                expect(target).toEqual(input.job_id);
            }
        }

        // status
        const statusEl = row.querySelector(`.${cssBaseClass}__cell--status`);
        expect(statusEl.textContent).toContain(input.meta.jobLabel);
    }

    /**
     *
     * @param {object} ctx - `this` context, containing keys
     *      {string} jobId - the job to be updated
     *      {object} input - the jobState object to be sent
     */
    function updateState(ctx) {
        const bus = ctx.bus || ctx.jobManager.bus;
        bus.send(
            {
                jobId: ctx.jobId,
                jobState: ctx.input,
            },
            {
                channel: {
                    jobId: ctx.jobId,
                },
                key: {
                    type: 'job-status',
                },
            }
        );
    }

    /**
     *
     * @param {object} ctx - `this` context, containing key jobId
     * @param {object} infoObj - the message to be sent
     */
    function updateInfo(ctx, infoObj) {
        const bus = ctx.bus || ctx.jobManager.bus;
        bus.send(
            {
                jobId: ctx.jobId,
                jobInfo: infoObj,
            },
            {
                channel: {
                    jobId: ctx.jobId,
                },
                key: {
                    type: 'job-info',
                },
            }
        );
    }

    /**
     * @param {object} ctx - `this` context, containing keys
     *      {object} retryParent    - the parent of the retried job
     *      {object} retry          - the new job
     *      {object} bus            - the bus to send the message on
     *      {string} channelId      - the channel ID; defaults to retryParent ID if not supplied
     */
    function retryResponse(ctx) {
        const { retryParent, retry } = ctx;
        // send the retry response and the update for the batch parent
        const bus = ctx.bus || ctx.jobManager.bus;
        bus.send(
            {
                job: {
                    jobState: retryParent,
                },
                retry: {
                    jobState: retry,
                },
            },
            {
                channel: {
                    jobId: ctx.channelId || retryParent.job_id,
                },
                key: {
                    type: 'job-retry-response',
                },
            }
        );
    }

    describe('The JobStatusTable module', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('loads', () => {
            expect(JobStatusTable).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(JobStatusTable.make).toEqual(jasmine.any(Function));
        });

        it('has a cssBaseClass variable', () => {
            expect(JobStatusTable.cssBaseClass).toEqual(jasmine.any(String));
            expect(JobStatusTable.cssBaseClass).toContain('kb-job-status');
        });
    });

    describe('The job status table', () => {
        let container, jobStatusTableInstance;
        afterEach(() => {
            TestUtil.clearRuntime();
            if (container) {
                if (container.querySelector('table')) {
                    $(container).find('table').DataTable().clear().destroy();
                }
                container.remove();
            }
        });

        describe('instance', () => {
            beforeEach(function () {
                container = document.createElement('div');
                this.jobStatusTableInstance = createInstance();
            });

            it('has a make function that returns an object', function () {
                expect(this.jobStatusTableInstance).not.toBe(null);
                expect(this.jobStatusTableInstance).toEqual(jasmine.any(Object));
            });

            it('has the required methods', function () {
                ['start', 'stop'].forEach((fn) => {
                    expect(this.jobStatusTableInstance[fn]).toBeDefined();
                    expect(this.jobStatusTableInstance[fn]).toEqual(jasmine.any(Function));
                }, this);
            });

            it('should start, and populate a node', async function () {
                expect(container.children.length).toBe(0);
                await this.jobStatusTableInstance.start({
                    node: container,
                });
                expect(container.children.length).toBeGreaterThan(0);
            });
        });

        function instantiateJobStatusTable(ctx) {
            container = document.createElement('div');
            ctx.jobManager = new JobManager({
                model: makeModel(allJobsWithBatchParent),
                bus: Runtime.make().bus(),
            });
            ctx.jobStatusTableInstance = createInstance({ jobManager: ctx.jobManager });
        }

        describe('job manager', () => {
            const handlers = [
                { event: 'modelUpdate', name: 'table' },
                { event: 'modelUpdate', name: 'dropdown' },
                { event: 'job-info', name: 'jobStatusTable_info' },
            ];

            [null, { byId: null }, { byId: {} }].forEach((execJobsObject) => {
                // for some reason this does not work if you use expectAsync
                it(`cannot start with "exec.jobs" set to ${JSON.stringify(
                    execJobsObject
                )}`, function () {
                    instantiateJobStatusTable(this);
                    this.jobManager.model.setItem('exec.jobs', execJobsObject);
                    expect(() => {
                        this.jobStatusTableInstance.start({ node: container });
                    }).toThrowError(/Must provide at least one job to show the job status table/);
                });
            });
            describe('handlers', () => {
                beforeEach(async function () {
                    instantiateJobStatusTable(this);
                    await this.jobStatusTableInstance.start({
                        node: container,
                    });
                });
                describe('set up', () => {
                    handlers.forEach((handler) => {
                        const { event, name } = handler;
                        it('sets up the appropriate handlers: ' + `${event}::${name}`, function () {
                            expect(this.jobManager.handlers[event][name]).toBeDefined();
                        });
                    });
                });

                describe('tear down', () => {
                    handlers.forEach((handler) => {
                        const { event, name } = handler;
                        it(
                            'tears down the appropriate handlers: ' + `${event}::${name}`,
                            async function () {
                                expect(this.jobManager.handlers[event][name]).toBeDefined();

                                await this.jobStatusTableInstance.stop();
                                expect(this.jobManager.handlers[event][name]).not.toBeDefined();
                            }
                        );
                    });
                });
            });

            it('only adds the necessary handlers', async function () {
                instantiateJobStatusTable(this);
                const jobData = this.jobManager.model.getItem('exec.jobs'),
                    jobIdList = Object.keys(jobData.byId);
                jobData.params = jobIdList.reduce((acc, curr) => {
                    acc[curr] = true;
                    return acc;
                }, {});
                this.jobManager.model.setItem('exec.jobs', jobData);
                spyOn(this.jobManager.bus, 'emit');

                await this.jobStatusTableInstance.start({
                    node: container,
                });
                // this table already has the params populated, so the 'jobStatusTable-info'
                // handler is not required
                handlers.forEach((handler) => {
                    const { event, name } = handler;
                    if (event === 'job-info') {
                        expect(this.jobManager.handlers[event][name]).not.toBeDefined();
                    } else {
                        expect(this.jobManager.handlers[event][name]).toBeDefined();
                    }
                });
                expect(this.jobManager.bus.emit.calls.allArgs()).toEqual([
                    // job status request for the full batch
                    ['request-job-status', { batchId }],
                ]);
            });
            it('requests info for jobs that do not have params defined', async function () {
                instantiateJobStatusTable(this);
                const jobData = this.jobManager.model.getItem('exec.jobs'),
                    jobIdList = Object.keys(jobData.byId),
                    missingJobIds = [];
                let bool = true;

                // populate some job params but not others
                jobData.params = jobIdList.reduce((acc, curr) => {
                    bool = !bool;
                    if (bool) {
                        acc[curr] = true;
                    } else if (curr !== batchId) {
                        missingJobIds.push(curr);
                    }
                    return acc;
                }, {});
                this.jobManager.model.setItem('exec.jobs', jobData);
                this.missingJobIds = missingJobIds;
                spyOn(this.jobManager.bus, 'emit');

                await this.jobStatusTableInstance.start({
                    node: container,
                });
                expect(this.jobManager.bus.emit.calls.allArgs()).toEqual([
                    // job info request for missing params
                    ['request-job-info', { jobIdList: this.missingJobIds }],
                    // job status request for the full batch
                    ['request-job-status', { batchId }],
                ]);
            });
        });

        describe('instance', () => {
            describe('structure and content', () => {
                beforeEach(async function () {
                    container = document.createElement('div');
                    this.jobStatusTableInstance = await createStartedInstance(container);
                });

                const classContents = [
                    `${cssBaseClass}__table`,
                    `${cssBaseClass}__table_head`,
                    `${cssBaseClass}__table_head_row`,
                    `${cssBaseClass}__table_body`,
                ];

                classContents.forEach((item) => {
                    it(`should have an element with class ${item}`, () => {
                        expect(container.querySelectorAll(`.${item}`).length).toBeGreaterThan(0);
                    });
                });

                const tableHeadCells = {
                    action: 'Action',
                    'log-view': 'Status details',
                    object: 'Object',
                    status: 'Status',
                };
                Object.keys(tableHeadCells).forEach((key) => {
                    it(`should generate appropriate table header cell for ${key}`, () => {
                        expect(
                            container.querySelectorAll(`.${cssBaseClass}__table_head_cell--${key}`)
                                .length
                        ).toEqual(1);
                        expect(
                            container.querySelector(`.${cssBaseClass}__table_head_cell--${key}`)
                                .textContent
                        ).toContain(tableHeadCells[key]);
                    });
                });

                it('should generate a row for each job', () => {
                    expect(
                        container.querySelectorAll('tbody tr.odd, tbody tr.even').length
                    ).toEqual(allJobsNoBatchParent.length);
                });
            });

            // make sure that the row contents are correct
            JobsData.allJobs.forEach((job) => {
                describe(`${job.job_id} row content`, () => {
                    beforeEach(async function () {
                        container = document.createElement('div');
                        this.job = job;
                        this.jobManager = new JobManager({
                            model: makeModel([job]),
                            bus: Runtime.make().bus(),
                        });
                        this.jobStatusTableInstance = await createStartedInstance(container, {
                            jobManager: this.jobManager,
                        });
                        this.row = container.querySelector('tbody tr');
                    });

                    itHasRowStructure();
                });
            });

            // ensure the table structure is correct for a batch job with retries
            describe('batch job with retries', () => {
                const batchJob = JobsData.batchJob;
                let allRows;

                describe('table init', () => {
                    beforeEach(async function () {
                        container = document.createElement('div');
                        this.jobManager = new JobManager({
                            model: makeModel(JobsData.batchJob.jobArray),
                            bus: Runtime.make().bus(),
                        });
                        this.jobStatusTableInstance = await createStartedInstance(container, {
                            jobManager: this.jobManager,
                        });
                    });

                    it('has the correct number of rows', () => {
                        allRows = container.querySelectorAll('tbody tr');
                        // data sanity check
                        expect(Object.keys(batchJob.currentJobs).length).toEqual(
                            Object.keys(batchJob.originalJobs).length
                        );
                        expect(Object.keys(batchJob.currentJobs).length).toEqual(allRows.length);
                    });

                    it('has the correct original rows', () => {
                        allRows = Array.from(container.querySelectorAll('tbody tr'));
                        // make sure all rows are present in batchJob.originalJobs
                        const allIds = allRows.map((row) => {
                            return row.id;
                        });
                        const expectedIds = Object.keys(batchJob.originalJobs).map((job_id) => {
                            return `job_${job_id}`;
                        });
                        expect(allIds).toEqual(jasmine.arrayWithExactContents(expectedIds));
                    });

                    Object.keys(batchJob.currentJobs).forEach((job_id) => {
                        it(`has the correct row content for job ${job_id}`, function () {
                            this.input = batchJob.jobsById[job_id];
                            this.job = this.input.retry_parent
                                ? batchJob.jobsById[this.input.retry_parent]
                                : batchJob.jobsById[job_id];
                            this.row = container.querySelector(`#job_${this.job.job_id}`);
                            // check the row content
                            _checkRowStructure(this.row, this.job, this.input);
                        });
                    });
                });
                describe('table init with job info', () => {
                    beforeEach(function () {
                        container = document.createElement('div');
                        this.job = JSONcopy(paramTestsJobArray[0]);
                        this.jobManager = new JobManager({
                            model: makeModel(paramTestsJobArray),
                            bus: Runtime.make().bus(),
                        });
                        this.jobManager.addListener('job-info', [
                            'job_update_test',
                            'generic_retry_parent',
                        ]);
                    });

                    async function runParamUpdateTest(ctx, test, jobParams) {
                        // add the job params
                        ctx.jobManager.model.setItem('exec.jobs.params', jobParams);
                        ctx.jobStatusTableInstance = await createStartedInstance(container, {
                            jobManager: ctx.jobManager,
                        });
                        ctx.job.meta.paramsRegex = test.regex;
                        ctx.row = container.querySelector('tbody tr');
                        _checkRowStructure(ctx.row, ctx.job);
                    }
                    paramTests.forEach((test) => {
                        it(
                            'initialises correctly using the job params: ' +
                                JSON.stringify(test.input),
                            async function () {
                                const jobParams = {
                                    job_update_test: test.input.job_params[0],
                                };
                                await runParamUpdateTest(this, test, jobParams);
                            }
                        );

                        // update to the retry parent info
                        it(
                            'initialises correctly using the retry parent params: ' +
                                JSON.stringify(test.input),
                            async function () {
                                const jobParams = {
                                    generic_retry_parent: test.input.job_params[0],
                                };
                                await runParamUpdateTest(this, test, jobParams);
                            }
                        );
                    });
                });
            });

            describe('row selection', () => {
                beforeEach(async function () {
                    container = document.createElement('div');
                    jobStatusTableInstance = await createStartedInstance(container);
                    this.jobStatusTableInstance = jobStatusTableInstance;
                });

                it('has no rows selected initially', () => {
                    const nRows = allJobsNoBatchParent.length;
                    expect(
                        container.querySelectorAll('tbody tr.odd, tbody tr.even').length
                    ).toEqual(nRows);
                    expect(container.querySelectorAll('tbody tr').length).toEqual(nRows);
                    expect(
                        container.querySelectorAll(`.${cssBaseClass}__row--selected`).length
                    ).toEqual(0);
                });

                function checkOpenRow($currentRow, $nextRow) {
                    // the current row should be selected and have the class 'vertical_collapse--open'
                    expect($currentRow[0]).toHaveClass('vertical_collapse--open');
                    expect($currentRow[0]).toHaveClass(`${cssBaseClass}__row--selected`);

                    // check for the job log viewer in the row underneath the row that was clicked
                    $nextRow = $currentRow.next();
                    ['odd', 'even'].forEach((cls) => {
                        expect($nextRow[0]).not.toHaveClass(cls);
                    });
                    expect($nextRow.find('.kb-log__logs_title')[0].textContent).toContain('Logs');
                }

                it('can show and hide child rows', async () => {
                    const rows = container.querySelectorAll('tbody tr.odd, tbody tr.even');

                    let $currentRow = $(rows[2]),
                        $nextRow;
                    await TestUtil.waitForElementState(
                        container.querySelector('tbody'),
                        () => {
                            return (
                                container.querySelectorAll('.vertical_collapse--open').length === 1
                            );
                        },
                        () => {
                            $currentRow.click();
                        }
                    );

                    // after clicking, there should be one extra row
                    expect(container.querySelectorAll('tbody tr').length).toEqual(rows.length + 1);
                    checkOpenRow($currentRow, $nextRow);

                    // click on another row
                    $currentRow = $(rows[5]);
                    await TestUtil.waitForElementState(
                        container.querySelector('tbody'),
                        () => {
                            return (
                                container.querySelectorAll('.vertical_collapse--open').length === 2
                            );
                        },
                        () => {
                            $currentRow.click();
                        }
                    );
                    expect(container.querySelectorAll('tbody tr').length).toEqual(rows.length + 2);
                    checkOpenRow($currentRow, $nextRow);

                    // click again to remove the row
                    await TestUtil.waitForElementState(
                        container.querySelector('tbody'),
                        () => {
                            return (
                                container.querySelectorAll('.vertical_collapse--open').length === 1
                            );
                        },
                        () => {
                            $currentRow.click();
                        }
                    );
                    expect(container.querySelectorAll('tbody tr').length).toEqual(rows.length + 1);

                    // the current row is still selected but does not have the class 'vertical_collapse--open'
                    expect($currentRow[0]).not.toHaveClass('vertical_collapse--open');
                    expect($currentRow[0]).toHaveClass(`${cssBaseClass}__row--selected`);
                    // the log viewer row has been removed, so the next row is a standard table row
                    if ($currentRow[0].classList.contains('even')) {
                        expect($currentRow.next()[0]).toHaveClass('odd');
                    } else {
                        expect($currentRow.next()[0]).toHaveClass('even');
                    }
                });
            });

            describe('table buttons', () => {
                describe('results button', () => {
                    beforeEach(async function () {
                        this.toggleTab = () => {
                            console.warn('running toggle tab!');
                        };

                        await createJobStatusTableWithContext(
                            this,
                            JSONcopy(JobsData.jobsById['job-finished-with-success'])
                        );
                        container = this.container;
                    });

                    it('clicking should trigger the toggleTab function', () => {
                        const button = container.querySelector('tbody tr button[data-target]');
                        expect(button.getAttribute('data-action')).toEqual('go-to-results');
                        spyOn(console, 'warn');
                        button.click();
                        expect(console.warn).toHaveBeenCalledOnceWith('running toggle tab!');
                    });
                });

                const cancelRetryArgs = {
                    cancel: 'job-in-the-queue',
                    retry: 'job-cancelled-during-run',
                };

                Object.keys(cancelRetryArgs).forEach((action) => {
                    describe(`${action} button`, () => {
                        it('clicking should trigger a job action', async function () {
                            await createJobStatusTableWithContext(
                                this,
                                JSONcopy(JobsData.jobsById[cancelRetryArgs[action]])
                            );
                            container = this.container;
                            const button = container.querySelector('tbody tr button[data-target]');
                            spyOn(this.jobManager, 'doJobAction');
                            await TestUtil.waitForElementState(
                                button,
                                () => {
                                    return button.disabled === true;
                                },
                                () => {
                                    button.click();
                                }
                            );
                            expect(this.jobManager.doJobAction).toHaveBeenCalled();
                            expect(this.jobManager.doJobAction.calls.allArgs()).toEqual([
                                [action, [this.jobId]],
                            ]);
                        });
                    });
                });
            });
        });

        describe('can update', () => {
            describe('job state:', () => {
                describe('valid', () => {
                    beforeEach(async function () {
                        await createJobStatusTableWithContext(this, jobUpdateTestJob);
                    });
                    JobsData.allJobs.forEach((state) => {
                        it(`with status ${state.status}`, async function () {
                            // this row can't be updated as it's the same as the input
                            if (state.status === 'created') {
                                expect(1).toBeTruthy();
                                return;
                            }

                            _checkRowStructure(this.row, this.job);
                            this.state = state;
                            this.input = JSONcopy(this.state);
                            this.input.job_id = this.job.job_id;
                            // make sure that the retryTarget is updated
                            this.input.meta.retryTarget = this.job.job_id;
                            spyOn(this.jobManager, 'updateModel').and.callThrough();
                            await TestUtil.waitForElementChange(this.row, () => {
                                updateState(this);
                            });

                            _checkRowStructure(this.row, this.job, this.input);
                            expect(this.jobManager.updateModel).toHaveBeenCalled();
                            expect(
                                this.jobManager.model.getItem(`exec.jobs.byId.${this.job.job_id}`)
                            ).toEqual(this.input);
                            // if it is a terminal job state, the listener should have been removed
                            // if the job cannot be retried and it is in a terminal state,
                            // we expect the job-status listener to be removed
                            if (this.input.status === 'does_not_exist') {
                                expect(this.jobManager.listeners).toEqual({});
                            } else if (
                                Jobs.isTerminalStatus(this.input.status) &&
                                !this.input.meta.canRetry
                            ) {
                                expect(
                                    this.jobManager.listeners[this.job.job_id]['job-status']
                                ).toBeUndefined();
                            } else {
                                expect(
                                    this.jobManager.listeners[this.job.job_id]['job-status']
                                ).toBeDefined();
                            }
                        });
                    });
                });

                describe('valid, retried job', () => {
                    beforeEach(async function () {
                        await createJobStatusTableWithContext(this, jobUpdateTestJob);
                    });
                    JobsData.validJobs.forEach((state) => {
                        it(`with status ${state.status}`, async function () {
                            _checkRowStructure(this.row, this.job);
                            this.state = state;
                            this.input = JSONcopy(this.state);
                            // make sure that the retry_parent is updated
                            this.input.retry_parent = this.job.job_id;
                            this.input.meta.retryTarget = this.job.job_id;
                            spyOn(this.jobManager, 'updateModel').and.callThrough();
                            await TestUtil.waitForElementChange(this.row, () => {
                                updateState(this);
                            });

                            _checkRowStructure(this.row, this.job, this.input);
                            expect(this.jobManager.updateModel).toHaveBeenCalled();
                            expect(
                                this.jobManager.model.getItem(`exec.jobs.byId.${this.input.job_id}`)
                            ).toEqual(this.input);
                        });
                    });
                });

                describe('invalid', () => {
                    beforeEach(async function () {
                        await createJobStatusTableWithContext(this, jobUpdateTestJob);
                    });
                    JobsData.invalidJobs.forEach((invalidJob) => {
                        it(`should not update with invalid job ${JSON.stringify(
                            invalidJob
                        )}`, async function () {
                            _checkRowStructure(this.row, this.job);
                            this.input = invalidJob;
                            spyOn(this.jobManager, 'updateModel').and.callThrough();
                            spyOn(this.jobManager, '_isValidMessage').and.callFake((...params) => {
                                expect(
                                    this.jobManager._isValidMessage.and.originalFn.call(
                                        this.jobManager,
                                        ...params
                                    )
                                ).toBeFalse();
                                this.row.classList.add('BOOP!');
                            });
                            await TestUtil.waitForElementChange(this.row, () => {
                                updateState(this);
                            });
                            expect(this.jobManager._isValidMessage).toHaveBeenCalled();
                            expect(this.jobManager.updateModel).not.toHaveBeenCalled();
                            _checkRowStructure(this.row, this.job);
                        });
                    });
                });

                describe('incorrect job ID', () => {
                    beforeEach(async function () {
                        await createJobStatusTableWithContext(this, jobUpdateTestJob);
                    });
                    JobsData.allJobs.forEach((state) => {
                        it('should not update with incorrect job ID', function () {
                            this.jobManager.addListener('job-status', state.job_id);
                            _checkRowStructure(this.row, this.job);
                            this.input = state;
                            spyOn(this.jobManager, 'updateModel').and.callThrough();
                            updateState(this);
                            _checkRowStructure(this.row, this.job);
                            expect(this.jobManager.updateModel).not.toHaveBeenCalled();
                        });
                    });
                });

                describe('batch with retries', () => {
                    const batchJob = JobsData.batchJob,
                        batchParentJob = batchJob.jobsById[batchJob.batchId];
                    let allRows;
                    beforeEach(async function () {
                        container = document.createElement('div');
                        // update the child jobs in the batch parent
                        batchParentJob.child_jobs = Object.keys(batchJob.originalJobs);
                        // create a table from the original jobs and the batch container
                        const originalJobsIds = Object.keys(batchJob.originalJobs).concat(
                            batchJob.batchId
                        );
                        const originalJobsData = originalJobsIds.map((jobId) => {
                            return batchJob.jobsById[jobId];
                        });
                        this.jobManager = new JobManager({
                            model: makeModel(originalJobsData),
                            bus: Runtime.make().bus(),
                        });
                        this.jobStatusTableInstance = await createStartedInstance(container, {
                            jobManager: this.jobManager,
                        });

                        this.jobManager.addListener('job-retry-response', originalJobsIds);
                    });

                    it('sets up a table correctly', function () {
                        // check initial table structure
                        allRows = container.querySelectorAll('tbody tr');
                        // data sanity check
                        expect(Object.keys(batchJob.originalJobs).length).toEqual(allRows.length);

                        // make sure all rows are present in batchJob.originalJobs
                        const allIds = Array.from(allRows)
                            .map((row) => {
                                return row.id;
                            })
                            .sort();
                        const expectedIds = Object.keys(batchJob.originalJobs)
                            .map((job_id) => {
                                return `job_${job_id}`;
                            })
                            .sort();
                        expect(allIds).toEqual(expectedIds);

                        Object.keys(batchJob.originalJobs).forEach((job_id) => {
                            this.job = batchJob.jobsById[job_id];
                            this.row = container.querySelector(`#job_${job_id}`);
                            // check the row content
                            _checkRowStructure(this.row, this.job);
                        });

                        const modelIds = Object.keys(
                            this.jobManager.model.getItem('exec.jobs.byId')
                        )
                            .map((job_id) => {
                                return `job_${job_id}`;
                            })
                            .sort();
                        // ensure that we have all the IDs plus the batch stored in the model
                        expect(modelIds).toEqual(
                            jasmine.arrayWithExactContents(allIds.concat(`job_${batchJob.batchId}`))
                        );
                    });

                    it('performs a series of updates correctly', async function () {
                        const indicator = document.createElement('div');
                        indicator.id = 'indicatorDiv';
                        container.append(indicator);

                        spyOn(this.jobManager, 'updateModel').and.callThrough();
                        this.jobManager.addHandler('modelUpdate', {
                            zzz_table_update: function (_, args) {
                                if (args[0].batch_job) {
                                    // for every batch job update, add a span element to the indicator div
                                    const sp = document.createElement('span');
                                    sp.classList.add('batchUpdate');
                                    sp.textContent = 'batch update';
                                    container.querySelector('#' + indicator.id).append(sp);
                                }
                            },
                        });

                        const estimatingUpdate = JSONcopy(batchJob.jobsById['job-estimating']);
                        estimatingUpdate.updated += 10;
                        estimatingUpdate.status = 'queued';

                        const jobDiedWithErrorUpdate = JSONcopy(
                            batchJob.jobsById['job-died-with-error']
                        );
                        jobDiedWithErrorUpdate.updated += 15;

                        const updates = [
                            {
                                // retry of 'job-cancelled-whilst-in-the-queue'
                                retry: batchJob.jobsById['job-running'],
                            },
                            {
                                // retry 1 of 'job-died-whilst-queueing'
                                retry: batchJob.jobsById['job-died-with-error'],
                            },
                            {
                                // retry of 'job-cancelled-during-run'
                                retry: batchJob.jobsById['job-finished-with-success'],
                            },
                            {
                                // retry 2 of 'job-died-whilst-queueing'
                                retry: batchJob.jobsById['job-estimating'],
                            },
                            {
                                // update of 'job-died-with-error'
                                // this job started before job-estimating
                                // so the table row will continue to show the job-estimating info
                                update: jobDiedWithErrorUpdate,
                                expectedRow: batchJob.jobsById['job-estimating'],
                            },
                            {
                                // update of 'job-estimating'
                                update: estimatingUpdate,
                            },
                        ];

                        const context = this;

                        const updateTableLoop = async function (index, ctx) {
                            const update = updates[index];
                            const updatedBatchJob = JSONcopy(batchParentJob);
                            updatedBatchJob.updated += 5 * index + 1;

                            const input = JSONcopy(update.retry || update.update);
                            const retryParent = batchJob.jobsById[input.retry_parent];
                            if (update.retry) {
                                updatedBatchJob.child_jobs.push(input.job_id);
                            }

                            await TestUtil.waitForElementChange(
                                container.querySelector('#' + indicator.id),
                                () => {
                                    if (update.retry) {
                                        // simulate a click to get the retry listener added
                                        container
                                            .querySelector(`[data-target="${input.retry_parent}"]`)
                                            .click();
                                        retryResponse({
                                            bus: ctx.jobManager.bus,
                                            retryParent,
                                            retry: input,
                                        });
                                    } else {
                                        updateState({
                                            bus: ctx.jobManager.bus,
                                            input,
                                            jobId: input.job_id,
                                        });
                                    }
                                    // send the update for the batch parent
                                    updateState({
                                        bus: ctx.jobManager.bus,
                                        input: updatedBatchJob,
                                        jobId: updatedBatchJob.job_id,
                                    });
                                }
                            );

                            index++;
                            // ensure the row displays correctly
                            const updatedRow = container.querySelector(
                                '#job_' + input.retry_parent
                            );
                            _checkRowStructure(
                                updatedRow,
                                retryParent,
                                update.expectedRow || input
                            );
                            // ensure that the job has been saved
                            expect(ctx.jobManager.updateModel).toHaveBeenCalled();
                            expect(
                                ctx.jobManager.model.getItem(`exec.jobs.byId.${input.job_id}`)
                            ).toEqual(input);
                            expect(container.querySelectorAll('.batchUpdate').length).toEqual(
                                index
                            );
                            return Promise.resolve(index);
                        };

                        const doUpdates = async function (startIndex, ctx) {
                            const ix = await updateTableLoop(startIndex, ctx);
                            if (ix < updates.length) {
                                return doUpdates(ix, ctx);
                            }
                            return Promise.resolve();
                        };

                        await doUpdates(0, context);
                    });
                });
            });

            describe('job params', () => {
                paramTests.forEach((test) => {
                    describe('valid', () => {
                        beforeEach(async function () {
                            await createJobStatusTableWithContext(this, jobUpdateTestJob);
                        });
                        it(
                            'will update the params' + JSON.stringify(test.input),
                            async function () {
                                _checkRowStructure(this.row, this.job);
                                // add in the correct jobId
                                test.input.job_id = this.jobId;
                                this.input = Object.assign({}, JSONcopy(this.job), test.input);
                                this.input.meta.paramsRegex = test.regex;

                                spyOn(this.jobManager, 'removeListener').and.callThrough();
                                spyOn(this.jobManager, 'runHandler').and.callThrough();
                                await TestUtil.waitForElementChange(this.row, () => {
                                    updateInfo(this, test.input);
                                });
                                expect(this.jobManager.removeListener).toHaveBeenCalledTimes(1);
                                expect(this.jobManager.removeListener.calls.allArgs()).toEqual([
                                    [this.jobId, 'job-info'],
                                ]);
                                expect(this.jobManager.runHandler).toHaveBeenCalled();
                                _checkRowStructure(this.row, this.job, this.input);
                            }
                        );
                    });
                });

                describe('incorrect job ID', () => {
                    beforeEach(async function () {
                        await createJobStatusTableWithContext(this, jobUpdateTestJob);
                    });
                    it('will not update', function () {
                        _checkRowStructure(this.row, this.job);
                        const invalidId = 'a random and incorrect job ID';
                        spyOn(this.jobManager, 'removeListener').and.callThrough();
                        spyOn(this.jobManager, 'runHandler').and.callThrough();
                        updateInfo({
                            bus: this.jobManager.bus,
                            jobId: invalidId,
                            jobInfo: {
                                job_id: invalidId,
                                job_params: [{ this: 'that' }],
                            },
                        });
                        expect(this.jobManager.runHandler).not.toHaveBeenCalled();
                        expect(this.jobManager.removeListener).not.toHaveBeenCalled();
                        _checkRowStructure(this.row, this.job);
                    });
                });

                describe('invalid', () => {
                    beforeEach(async function () {
                        await createJobStatusTableWithContext(this, jobUpdateTestJob);
                    });
                    JobsData.invalidInfo.forEach((invalidInfo) => {
                        it('will be ignored', async function () {
                            _checkRowStructure(this.row, this.job);
                            spyOn(this.jobManager, 'removeListener').and.callThrough();
                            spyOn(this.jobManager, '_isValidMessage').and.callFake((...params) => {
                                expect(
                                    this.jobManager._isValidMessage.and.originalFn.call(
                                        this.jobManager,
                                        ...params
                                    )
                                ).toBeFalse();
                                this.row.classList.add('BOOP!');
                            });
                            await TestUtil.waitForElementChange(this.row, () => {
                                updateInfo(this, {
                                    job_id: this.job.job_id,
                                    job_params: invalidInfo,
                                });
                            });
                            expect(this.jobManager._isValidMessage).toHaveBeenCalled();
                            expect(this.jobManager.removeListener).not.toHaveBeenCalled();
                            _checkRowStructure(this.row, this.job);
                        });
                    });
                });

                describe('retried job', () => {
                    const indicatorId = 'indicatorDiv';

                    function prepareForUpdate(ctx, test) {
                        _checkRowStructure(ctx.row, ctx.job);
                        expect(ctx.container.querySelectorAll('#' + indicatorId).length).toEqual(1);
                        // add in the correct jobId
                        test.input.job_id = ctx.jobId;
                        ctx.input = Object.assign({}, JSONcopy(ctx.job), test.input);
                        ctx.input.meta.paramsRegex = test.regex;

                        spyOn(ctx.jobManager, 'removeListener').and.callThrough();
                        spyOn(ctx.jobManager, 'runHandler').and.callThrough();
                    }

                    function postUpdateChecks(ctx, expectedCallArgs) {
                        expect(ctx.container.querySelectorAll('#' + indicatorId).length).toEqual(1);
                        expect(ctx.jobManager.removeListener).toHaveBeenCalledTimes(1);
                        expect(ctx.jobManager.removeListener.calls.allArgs()).toEqual([
                            [ctx.jobId, 'job-info'],
                        ]);
                        expect(ctx.jobManager.runHandler).toHaveBeenCalled();
                        const allCalls = ctx.jobManager.runHandler.calls.allArgs();
                        expect(allCalls).toEqual([expectedCallArgs]);
                        _checkRowStructure(ctx.row, ctx.job, ctx.input);
                    }

                    beforeEach(async function () {
                        await createJobStatusTableWithContext(this, paramTestsJobArray);
                        this.job = JSONcopy(paramTestsJobArray[0]);
                        this.jobManager.addListener('job-info', [
                            'job_update_test',
                            'generic_retry_parent',
                        ]);
                        this.indicatorDiv = document.createElement('div');
                        this.indicatorDiv.id = indicatorId;
                        this.container.append(this.indicatorDiv);
                        this.jobManager.addHandler('job-info', {
                            zzz_table_update: () => {
                                this.indicatorDiv.textContent = 'BOOM!';
                            },
                        });
                    });

                    paramTests.forEach((test) => {
                        it(
                            'will update using the job params: ' + JSON.stringify(test.input),
                            async function () {
                                prepareForUpdate(this, test);
                                await TestUtil.waitForElementChange(this.indicatorDiv, () => {
                                    updateInfo(this, test.input);
                                });
                                const expectedCallArgs = [
                                    'job-info',
                                    {
                                        jobId: 'job_update_test',
                                        jobInfo: { job_id: 'job_update_test', ...test.input },
                                    },
                                    'job_update_test',
                                ];
                                postUpdateChecks(this, expectedCallArgs);
                            }
                        );

                        // update to the retry parent info
                        it(
                            'will update using the retry parent params: ' +
                                JSON.stringify(test.input),
                            async function () {
                                prepareForUpdate(this, test);
                                await TestUtil.waitForElementChange(
                                    this.container.querySelector('#' + indicatorId),
                                    () => {
                                        this.jobManager.bus.send(
                                            {
                                                jobId: this.job.retry_parent,
                                                jobInfo: test.input,
                                            },
                                            {
                                                channel: {
                                                    jobId: this.job.retry_parent,
                                                },
                                                key: { type: 'job-info' },
                                            }
                                        );
                                    }
                                );

                                const expectedCallArgs = [
                                    'job-info',
                                    {
                                        jobId: this.job.retry_parent,
                                        jobInfo: {
                                            job_id: this.job.retry_parent,
                                            ...test.input,
                                        },
                                    },
                                    this.job.retry_parent,
                                ];
                                postUpdateChecks(this, expectedCallArgs);
                            }
                        );
                    });
                });
            });
        });
    });
});
