define([
    'bluebird',
    'common/jobStateViewer',
    'common/jobs',
    'common/jobCommMessages',
    'common/jobManager',
    'common/props',
    'common/runtime',
    '/test/data/jobsData',
    'testUtil',
], (
    Promise,
    JobStateViewerModule,
    Jobs,
    jcm,
    JobManagerModule,
    Props,
    Runtime,
    JobsData,
    TestUtil
) => {
    'use strict';

    const { cssBaseClass, JobStateViewer } = JobStateViewerModule;

    const { JobManager } = JobManagerModule;

    const BATCH_ID = JobsData.batchParentJob.batch_id;

    function createJobManager(context) {
        context.bus = Runtime.make().bus();
        context.model = Props.make({
            data: {},
        });
        Jobs.populateModelFromJobArray(
            context.model,
            TestUtil.JSONcopy(JobsData.allJobsWithBatchParent)
        );

        context.jobManager = new JobManager({
            bus: context.bus,
            model: context.model,
        });

        context.jobManager.addListener(
            jcm.MESSAGE_TYPE.STATUS,
            jcm.CHANNEL.JOB,
            JobsData.allJobsWithBatchParent.map((job) => {
                return job.job_id;
            })
        );
        context.jobManager.addListener(jcm.MESSAGE_TYPE.STATUS, jcm.CHANNEL.BATCH, BATCH_ID);

        return context.jobManager;
    }

    function createStateViewer(context, showHistory = false) {
        context.node = document.createElement('div');

        createJobManager(context);

        const args = { showHistory, jobManager: context.jobManager, devMode: true };
        context.jobStateViewerInstance = new JobStateViewer(args);
    }

    /**
     *
     * @param {object} context `this` context, including the node to search for the job status lines
     * @param {boolean} includeHistory whether or not history mode is on
     */

    function testJobStatus(context, includeHistory = false) {
        const statusNode = context.node.querySelector(`.${cssBaseClass}__container`);
        const errorNode = context.node.querySelector(`.${cssBaseClass}__error_container`);

        const statusLine = context.jobState
            ? context.jobState.meta.createJobStatusLines.line
            : Jobs.jobStatusUnknown[0];

        const errorLine = context.jobState ? context.jobState.meta.errorString || null : null;

        if (!statusNode) {
            fail('tests failed: status node not found');
            return;
        }
        expect(statusNode.textContent).toContain(statusLine);

        if (includeHistory) {
            const history = context.jobState
                ? context.jobState.meta.createJobStatusLines.history
                : Jobs.jobStatusUnknown;
            history.forEach((line) => {
                expect(statusNode.textContent).toContain(line);
            });
        }

        if (errorLine) {
            expect(errorNode.textContent).toContain(errorLine);
        } else {
            expect(errorNode.textContent).toBe('');
        }
    }

    function itHasJobStatus() {
        it('has job status', function () {
            testJobStatus(this);
        });
    }

    function itHasJobStatusHistory() {
        it('has job status history', function () {
            testJobStatus(this, true);
        });
    }

    describe('The job state viewer module', () => {
        it('Should load the module code successfully', () => {
            expect(JobStateViewer).toEqual(jasmine.any(Function));
        });

        it('Should have a css base class', () => {
            expect(cssBaseClass).toEqual(jasmine.any(String));
            expect(cssBaseClass).toEqual('kb-job-state-viewer');
        });
    });

    describe('The job state viewer instance', () => {
        beforeAll(() => {
            TestUtil.clearRuntime();
        });

        afterEach(() => {
            TestUtil.clearRuntime();
        });

        describe('starting and then stopping', () => {
            beforeEach(function () {
                createStateViewer(this);
            });

            it('should have methods defined', function () {
                ['start', 'stop'].forEach((fn) => {
                    expect(this.jobStateViewerInstance[fn]).toEqual(jasmine.any(Function));
                });
            });

            it('should fail to init without a job manager', () => {
                expect(() => {
                    new JobStateViewer();
                }).toThrowError(Error, 'Requires a valid JobManager for initialisation');
            });

            it('Should fail to start without a node', async () => {
                createJobManager(this);
                const jobStateViewerInstance = new JobStateViewer({
                    jobManager: this.jobManager,
                });
                await expectAsync(
                    jobStateViewerInstance.start({ jobId: 'fakeJob' })
                ).toBeRejectedWithError(/Requires a node to start/);
            });

            it('Should fail to start without a jobId', async function () {
                const jobStateViewerInstance = new JobStateViewer({
                    jobManager: this.jobManager,
                });
                await expectAsync(
                    jobStateViewerInstance.start({ node: this.node })
                ).toBeRejectedWithError(/Requires a job id to start/);
            });

            it('Should start as expected with inputs, and be stoppable', async function () {
                const arg = {
                    node: this.node,
                    jobId: 'test_job_start',
                };
                await this.jobStateViewerInstance.start(arg);
                expect(this.node.querySelector('div[data-element="status-line"]')).toBeDefined();
                this.jobStateViewerInstance.stop();
                expect(this.node.innerHTML).toBe('');
            });

            it('Should send bus messages requesting job status information at startup', async function () {
                const jobId = 'test_bus_request';
                const arg = {
                    node: this.node,
                    jobId,
                };
                await this.jobStateViewerInstance.start(arg);

                return new Promise((resolve) => {
                    this.bus.on(jcm.MESSAGE_TYPE.STATUS, (msg) => {
                        expect(msg).toEqual({ [jcm.PARAM.JOB_ID]: jobId });
                        resolve();
                    });
                });
            });
        });

        describe('initial widget state', () => {
            beforeEach(function () {
                createStateViewer(this);
            });

            describe('should be awaiting job data with no job object', () => {
                beforeEach(async function () {
                    await this.jobStateViewerInstance.start({
                        node: this.node,
                        jobId: 'no state set',
                    });
                });
                itHasJobStatus();
            });

            JobsData.allJobs.forEach((jobState) => {
                describe(`should create a string for status ${jobState.status}`, () => {
                    beforeEach(async function () {
                        this.jobState = jobState;
                        await this.jobStateViewerInstance.start({
                            node: this.node,
                            jobId: jobState.job_id,
                            jobState,
                        });
                    });
                    itHasJobStatus();
                });
            });
        });

        describe('initial state, history mode on', () => {
            beforeEach(function () {
                createStateViewer(this, true);
            });

            describe('should be awaiting job data with no job object', () => {
                beforeEach(async function () {
                    await this.jobStateViewerInstance.start({
                        node: this.node,
                        jobId: 'no state set, history',
                    });
                });
                itHasJobStatusHistory();
            });

            JobsData.allJobs.forEach((jobState) => {
                describe(`should create an array in history mode for status ${jobState.status}`, () => {
                    beforeEach(async function () {
                        this.jobState = jobState;
                        await this.jobStateViewerInstance.start({
                            node: this.node,
                            jobId: jobState.job_id,
                            jobState,
                        });
                    });
                    itHasJobStatusHistory();
                });
            });
        });

        const allJobStateMessages = JobsData.allJobs.reduce((acc, jobState) => {
            acc[jobState.job_id] = {
                [jcm.PARAM.JOB_ID]: jobState.job_id,
                jobState,
            };
            return acc;
        }, {});

        describe('response to update', () => {
            [true, false].forEach((mode) => {
                beforeEach(function () {
                    if (mode) {
                        createStateViewer(this, mode);
                    }
                });
                JobsData.allJobs.forEach((jobState) => {
                    const input = {
                        'by job ID': {
                            message: { [jobState.job_id]: allJobStateMessages[jobState.job_id] },
                            channelType: jcm.CHANNEL.JOB,
                            channelId: jobState.job_id,
                        },
                        'by batch ID': {
                            message: allJobStateMessages,
                            channelType: jcm.CHANNEL.BATCH,
                            channelId: BATCH_ID,
                        },
                    };

                    ['by job ID', 'by batch ID'].forEach((inputType) => {
                        it(`should create a string for status ${jobState.status}, history mode ${
                            mode ? 'on' : 'off'
                        }, ${inputType}`, async function () {
                            // remove the job data so the status viewer says 'Awaiting job information'
                            this.jobManager.model.setItem(`exec.jobs.byId.${jobState.job_id}`, {
                                job_id: jobState.job_id,
                            });
                            const { message, channelType, channelId } = input[inputType];
                            // test the status lines when the widget requests a status update (on start up)
                            this.bus.on(jcm.MESSAGE_TYPE.STATUS, (msg) => {
                                testJobStatus(this, mode);
                                expect(msg).toEqual({ [jcm.PARAM.JOB_ID]: jobState.job_id });
                                TestUtil.sendBusMessage({
                                    bus: this.bus,
                                    message,
                                    channelType,
                                    channelId,
                                    type: jcm.MESSAGE_TYPE.STATUS,
                                });
                            });

                            await this.jobStateViewerInstance.start({
                                node: this.node,
                                jobId: jobState.job_id,
                            });

                            await TestUtil.waitFor({
                                documentElement: this.node.querySelector(
                                    '[data-element="status-line"]'
                                ),
                                domStateFunction: (mutations) => {
                                    if (!mutations || !mutations.length) {
                                        return false;
                                    }
                                    const result = mutations.some((mut) => {
                                        return Array.from(mut.addedNodes).some((domEl) => {
                                            return (
                                                domEl.classList &&
                                                domEl.classList.contains(
                                                    `${cssBaseClass}__job_status_detail_container`
                                                )
                                            );
                                        });
                                    });
                                    return result ? true : false;
                                },
                                config: { childList: true },
                            });

                            this.jobState = jobState;
                            testJobStatus(this, mode);
                        });
                    });
                });
            });
        });
    });
});
