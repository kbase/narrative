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
], ($, Promise, JobStatusTable, Jobs, JobManager, Props, Runtime, TestUtil, JobsData) => {
    'use strict';

    const cssBaseClass = JobStatusTable.cssBaseClass;
    const jobArray = JobsData.allJobs;
    const model = makeModel(jobArray);
    const bus = Runtime.make().bus();

    function makeModel(jobs) {
        return Props.make({
            data: {
                exec: {
                    jobs: Jobs.jobArrayToIndexedObject(jobs),
                },
            },
        });
    }

    function createInstance(config = {}) {
        return JobStatusTable.make(
            Object.assign(
                {},
                {
                    jobManager: new JobManager({
                        model,
                        bus,
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
     * @param {object} job to put in the job status table
     */
    async function createJobStatusTableWithContext(context, job) {
        context.jobId = job.job_id;
        context.job = job;
        context.bus = Runtime.make().bus();
        context.container = document.createElement('div');
        context.model = makeModel([job]);
        context.jobManager = new JobManager({
            model: context.model,
            bus: context.bus,
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
        // status details cell
        const logViewEl = row.querySelector(`.${cssBaseClass}__cell--log-view`);
        expect(logViewEl.textContent).toContain('Status details');

        // object name
        const objectEl = row.querySelector(`.${cssBaseClass}__cell--object`);
        if (input.meta.paramsRegex) {
            expect(objectEl.textContent).toMatch(input.meta.paramsRegex);
        } else {
            expect(objectEl.textContent).toContain(job.job_id);
        }

        // action
        const actionEl = row.querySelector(`.${cssBaseClass}__cell--action`);
        expect(actionEl.textContent).toEqual(input.meta.jobAction ? input.meta.jobAction : '');

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
        ctx.bus.send(
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
        ctx.bus.send(
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

    describe('The job status table module', () => {
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

    describe('the job status table', () => {
        let container, jobStatusTableInstance;
        describe('The job status table instance', () => {
            beforeEach(function () {
                container = document.createElement('div');
                this.jobStatusTableInstance = createInstance();
            });

            afterEach(() => {
                container.remove();
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

        describe('the started job status table instance', () => {
            describe('structure and content', () => {
                beforeAll(async function () {
                    container = document.createElement('div');
                    this.jobStatusTableInstance = await createStartedInstance(container);
                });

                afterAll(async function () {
                    await this.jobStatusTableInstance.stop();
                    container.remove();
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
                    ).toEqual(Object.keys(jobArray).length);
                });
            });

            // make sure that the row contents are correct
            JobsData.allJobs.forEach((job) => {
                describe(`the job status table initial row structure and content for "${job.job_id}"`, () => {
                    beforeEach(async function () {
                        container = document.createElement('div');
                        this.job = job;
                        this.model = makeModel([job]);
                        this.jobManager = new JobManager({
                            model: this.model,
                            bus: Runtime.make().bus(),
                        });
                        this.jobStatusTableInstance = await createStartedInstance(container, {
                            jobManager: this.jobManager,
                        });
                        this.row = container.querySelector('tbody tr');
                    });

                    afterEach(async function () {
                        await this.jobStatusTableInstance.stop();
                        container.remove();
                    });

                    itHasRowStructure();
                });
            });

            describe('job status table row selection', () => {
                beforeEach(async function () {
                    container = document.createElement('div');
                    jobStatusTableInstance = await createStartedInstance(container);
                    this.jobStatusTableInstance = jobStatusTableInstance;
                });

                afterEach(async () => {
                    await jobStatusTableInstance.stop();
                    container.remove();
                });

                it('has no rows selected initially', () => {
                    expect(
                        container.querySelectorAll('tbody tr.odd, tbody tr.even').length
                    ).toEqual(jobArray.length);
                    expect(container.querySelectorAll('tbody tr').length).toEqual(jobArray.length);
                    expect(
                        container.querySelectorAll(`.${cssBaseClass}__row--selected`).length
                    ).toEqual(0);
                });

                it('can show and hide child rows', async () => {
                    const rows = container.querySelectorAll('tbody tr.odd, tbody tr.even');

                    let $currentRow = $(rows[2]);
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

                    // the current row should be selected and have the class 'vertical_collapse--open'
                    expect($currentRow[0]).toHaveClass('vertical_collapse--open');
                    expect($currentRow[0]).toHaveClass(`${cssBaseClass}__row--selected`);

                    // check for the job log viewer in the row underneath the row that was clicked
                    let $nextRow = $currentRow.next();
                    ['odd', 'even'].forEach((cls) => {
                        expect($nextRow[0]).not.toHaveClass(cls);
                    });
                    expect($nextRow.find('.kb-log__logs_title')[0].textContent).toContain('Logs');

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

                    // the current row should be selected and have the class 'vertical_collapse--open'
                    expect($currentRow[0]).toHaveClass('vertical_collapse--open');
                    expect($currentRow[0]).toHaveClass(`${cssBaseClass}__row--selected`);

                    // the next row is a log viewer row
                    $nextRow = $currentRow.next();
                    ['odd', 'even'].forEach((cls) => {
                        expect($nextRow[0]).not.toHaveClass(cls);
                    });
                    expect($nextRow.find('.kb-log__logs_title')[0].textContent).toContain('Logs');

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
                afterEach(() => {
                    container.remove();
                    window.kbaseRuntime = null;
                });

                describe('results button', () => {
                    beforeEach(async function () {
                        this.toggleTab = () => {
                            console.warn('running toggle tab!');
                        };

                        await createJobStatusTableWithContext(
                            this,
                            JSON.parse(
                                JSON.stringify(JobsData.jobsById['job-finished-with-success'])
                            )
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
                                JSON.parse(
                                    JSON.stringify(JobsData.jobsById[cancelRetryArgs[action]])
                                )
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
            beforeEach(async function () {
                await createJobStatusTableWithContext(this, {
                    job_id: 'job_update_test',
                    status: 'created',
                    created: 0,
                    meta: {
                        jobAction: 'cancel',
                        jobLabel: 'queued',
                    },
                });
            });

            afterEach(() => {
                window.kbaseRuntime = null;
            });
            describe('job state:', () => {
                describe(`valid jobState object`, () => {
                    JobsData.validJobs.forEach((state) => {
                        it(`with status ${state.status}`, async function () {
                            // this row can't be updated as it's the same as the input
                            if (state.status === 'created') {
                                expect(1).toBeTruthy();
                                return;
                            }

                            _checkRowStructure(this.row, this.job);
                            this.state = state;
                            this.input = Object.assign({}, this.state, { job_id: this.job.job_id });
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
                            if (Jobs.isTerminalStatus(this.input.status)) {
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

                describe('invalid job object', () => {
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
            });

            describe('job params', () => {
                const tests = [
                    {
                        input: {
                            job_params: [{ this: 'that' }],
                        },
                        regex: new RegExp('this: that'),
                    },
                    {
                        input: {
                            job_params: [{ tag_two: 'value two', tag_three: 'value three' }],
                        },
                        regex: new RegExp('tag_three: value three.*?tag_two: value two', 'ism'),
                    },
                ];

                tests.forEach((test) => {
                    describe('valid input params ' + JSON.stringify(test.input), () => {
                        it('will update the params', async function () {
                            _checkRowStructure(this.row, this.job);
                            // add in the correct jobId
                            test.input.job_id = this.jobId;
                            this.input = Object.assign(
                                {},
                                JSON.parse(JSON.stringify(this.job)),
                                test.input
                            );
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
                        });
                    });
                });

                describe('valid info, incorrect job ID', () => {
                    it('will not update with an incorrect jobID', function () {
                        _checkRowStructure(this.row, this.job);
                        const invalidId = 'a random and incorrect job ID';
                        spyOn(this.jobManager, 'removeListener').and.callThrough();
                        spyOn(this.jobManager, 'runHandler').and.callThrough();
                        updateInfo(
                            {
                                bus: this.bus,
                                jobId: invalidId,
                            },
                            {
                                job_id: invalidId,
                                job_params: [{ this: 'that' }],
                            }
                        );
                        expect(this.jobManager.runHandler).not.toHaveBeenCalled();
                        expect(this.jobManager.removeListener).not.toHaveBeenCalled();
                        _checkRowStructure(this.row, this.job);
                    });
                });

                describe('invalid jobInfo object', () => {
                    JobsData.invalidInfo.forEach((invalidInfo) => {
                        it('will ignore invalid info objects', async function () {
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
            });
        });
    });
});
