define([
    'jquery',
    'bluebird',
    'common/simpleLogViewer',
    'common/jobs',
    'common/jobCommMessages',
    'common/jobManager',
    'common/props',
    'common/runtime',
    '/test/data/jobsData',
    'testUtil',
], (
    $,
    Promise,
    SimpleLogViewerModule,
    Jobs,
    jcm,
    JobManagerModule,
    Props,
    Runtime,
    JobsData,
    TestUtil
) => {
    'use strict';

    const TEST_POLL_INTERVAL = 10;
    const { cssBaseClass, SimpleLogViewer } = SimpleLogViewerModule;

    const { JobManager } = JobManagerModule;

    const jobsByStatus = JobsData.jobsByStatus;
    const BATCH_ID = JobsData.batchParentJob.batch_id;
    const TEST_JOB_ID = 'TEST_JOB_ID';
    const endStates = ['completed', 'error', 'terminated'];
    const queueStates = ['created', 'estimating', 'queued'];
    const allJobStateMessages = JobsData.allJobs.reduce((acc, jobState) => {
        acc[jobState.job_id] = {
            [jcm.PARAM.JOB_ID]: jobState.job_id,
            jobState,
        };
        return acc;
    }, {});

    const lotsOfLogLines = [];
    let n = 0;
    while (n < 10) {
        n++;
        lotsOfLogLines.push({
            is_error: 0,
            line: `log line ${n}`,
            linepos: n,
        });
    }

    function generateInput(jobId) {
        return {
            job: {
                message: { [jobId]: allJobStateMessages[jobId] },
                channelType: jcm.CHANNEL.JOB,
                channelId: jobId,
            },
            batch: {
                message: allJobStateMessages,
                channelType: jcm.CHANNEL.BATCH,
                channelId: BATCH_ID,
            },
        };
    }

    function createJobManager(context) {
        context.bus = Runtime.make().bus();
        context.model = Props.make({
            data: {},
        });
        Jobs.populateModelFromJobArray(
            context.model,
            TestUtil.JSONcopy(JobsData.allJobsWithBatchParent)
        );
        context.pollInterval = TEST_POLL_INTERVAL;
        context.jobManager = new JobManager(context);

        ['LOGS', 'STATUS'].forEach((type) => {
            context.jobManager.addListener(
                jcm.MESSAGE_TYPE[type],
                jcm.CHANNEL.JOB,
                JobsData.allJobsWithBatchParent.map((job) => {
                    return job.job_id;
                })
            );
            context.jobManager.addListener(jcm.MESSAGE_TYPE[type], jcm.CHANNEL.BATCH, BATCH_ID);
        });
        return context.jobManager;
    }

    function createLogViewer(context, logPollInterval = null) {
        context.node = document.createElement('div');

        createJobManager(context);

        const args = { jobManager: context.jobManager, devMode: true };
        if (logPollInterval) {
            args.logPollInterval = logPollInterval;
        }
        context.simpleLogViewerInstance = new SimpleLogViewer(args);
    }

    const logLines = [
        {
            is_error: 0,
            line: 'line 1 - log',
            linepos: 1,
            ts: 1234567891,
        },
        {
            is_error: 1,
            line: 'line 2 - error',
            linepos: 2,
            ts: 1234567892,
        },
        {
            is_error: 0,
            line: 'line 3 - more logs',
            linepos: 3,
            ts: 1234567893,
        },
        {
            is_error: 0,
            line: 'line 4 - last log',
            linepos: 4,
            ts: 1234567894,
        },
        {
            is_error: 1,
            line: 'line 5 - error',
            linepos: 5,
            ts: 1234567895,
        },
        {
            is_error: 1,
            line: 'line 6 - TOTAL BREAKDOWN!',
            linepos: 6,
            ts: 1234567896,
        },
    ];

    // lines to return each time there is a request for the latest logs
    const messageSeries = [
        {
            // expected model 'lines' content at the time of the request
            model: [],
            // expected request params
            request: {},
            // response: 0 log lines
            lines: [],
            first: 0,
            max_lines: 0,
        },
        {
            model: [],
            request: {},
            // two lines
            lines: logLines.slice(0, 3),
            first: 0,
            max_lines: 3,
        },
        {
            model: logLines.slice(0, 3),
            request: { first_line: 3 },
            // no new lines
            lines: logLines.slice(2, 3),
            first: 2,
            max_lines: 3,
        },
        {
            model: logLines.slice(0, 3),
            request: { first_line: 3 },
            // one new line
            lines: logLines.slice(1, 4),
            first: 1,
            max_lines: 4,
        },
        {
            model: logLines.slice(0, 4),
            request: { first_line: 4 },
            // the remaining lines
            lines: logLines.slice(2),
            first: 2,
            max_lines: logLines.length,
        },
    ];

    /**
     * Ensure that the log lines are as they should be
     * @param {object} ctx `this` context, including the log viewer instance and the DOM node
     * @param {array} accumulatedLogLines all log lines posted so far (not just the most recent lines)
     */

    function testJobLogs(ctx, accumulatedLogLines) {
        const node = ctx.node;

        const modelLogLines = ctx.simpleLogViewerInstance.model.getItem('lines');
        expect(modelLogLines).toEqual(accumulatedLogLines);

        if (!accumulatedLogLines.length) {
            // no log lines element
            expect(node.querySelector('[data-element="log-lines"]')).toBeNull();
            // no children of the log panel
            expect(node.querySelector('[data-element="log-panel"]').children.length).toEqual(0);
            expect(modelLogLines).toEqual([]);
            return;
        }

        const logLinesList = node.querySelector('[data-element="log-lines"]');
        try {
            expect(logLinesList.children.length).toEqual(accumulatedLogLines.length);
            Array.from(logLinesList.children).forEach((line, ix) => {
                const expectedClass = accumulatedLogLines[ix].is_error
                    ? `${cssBaseClass}__line_text--error`
                    : `${cssBaseClass}__line_text`;
                expect(line).toHaveClass(expectedClass);
                expect(line.textContent).toContain(accumulatedLogLines[ix].line);
            });
        } catch (error) {
            console.error('testJobLogs failed: ', error, 'logLinesList: ' + logLinesList.outerHTML);
            fail(error);
        }
    }

    // check that the log viewer is in the appropriate state for having made a log request
    function expectLogRequested(ctx) {
        expect(ctx.simpleLogViewerInstance.ui.getElement('spinner')).not.toHaveClass('hidden');
        expect(ctx.simpleLogViewerInstance.state.awaitingLog).toBeTrue();
    }

    // check that the log viewer is not waiting for a log message
    function expectNotAwaitingLog(ctx) {
        expect(ctx.simpleLogViewerInstance.ui.getElement('spinner')).toHaveClass('hidden');
        expect(ctx.simpleLogViewerInstance.state.awaitingLog).toBeFalse();
    }

    // expected layout when waiting for job data
    function expectAwaitingDataMessage(ctx) {
        expect(ctx.simpleLogViewerInstance.getLogPanel().textContent).toContain(
            ctx.simpleLogViewerInstance.messages.JOB_STATUS_UNKNOWN
        );
    }

    // expected layout when the job is queued
    function expectQueuedMessage(ctx) {
        expect(ctx.simpleLogViewerInstance.getLogPanel().textContent).toContain(
            ctx.simpleLogViewerInstance.messages.JOB_QUEUED
        );
    }

    // expected layout when the job is not found
    function expectJobNotFound(ctx) {
        expect(ctx.node.querySelector('[data-element="log-panel"]').textContent).toBe(
            ctx.simpleLogViewerInstance.messages.JOB_NOT_FOUND
        );
    }

    // check the state of the UI buttons is as expected
    function checkButtons(ctx, expectedState) {
        const buttonsExpected =
            ctx.simpleLogViewerInstance.buttonsByJobState[expectedState].buttons;
        const btns = ctx.node.querySelectorAll('div[data-element="header"] button');
        btns.forEach((btn) => {
            const action = btn.getAttribute('data-button');
            expect(buttonsExpected.disabled.includes(action)).toEqual(btn.disabled);
        });
    }

    describe('The simple log viewer module', () => {
        it('Should load the module code successfully', () => {
            expect(SimpleLogViewer).toEqual(jasmine.any(Function));
        });

        it('Should have a css base class', () => {
            expect(cssBaseClass).toEqual(jasmine.any(String));
            expect(cssBaseClass).toEqual('kb-log');
        });
    });

    describe('The simple log viewer instance', () => {
        beforeAll(() => {
            TestUtil.clearRuntime();
        });

        afterEach(() => {
            TestUtil.clearRuntime();
        });

        describe('starting and then stopping', () => {
            beforeEach(function () {
                createLogViewer(this);
            });

            it('should have methods defined', function () {
                ['start', 'stop'].forEach((fn) => {
                    expect(this.simpleLogViewerInstance[fn]).toEqual(jasmine.any(Function));
                });
            });

            it('should fail to init without a job manager', () => {
                expect(() => {
                    new SimpleLogViewer();
                }).toThrowError(Error, 'Requires a valid JobManager');
            });

            it('Should fail to start without a node', async () => {
                const simpleLogViewerInstance = new SimpleLogViewer({
                    jobManager: { bus: Runtime.make().bus(), model: {} },
                });
                await expectAsync(
                    simpleLogViewerInstance.start({ jobId: TEST_JOB_ID })
                ).toBeRejectedWithError('Requires a node to start');
            });

            it('Should fail to start without a jobId', async function () {
                const simpleLogViewerInstance = new SimpleLogViewer({
                    jobManager: { bus: Runtime.make().bus(), model: {} },
                });
                await expectAsync(
                    simpleLogViewerInstance.start({ node: this.node })
                ).toBeRejectedWithError('Requires a job ID to start');
            });

            it('Should start as expected with inputs, and be stoppable', async function () {
                const arg = {
                    node: this.node,
                    jobId: TEST_JOB_ID,
                };
                await this.simpleLogViewerInstance.start(arg);
                expect(this.node.querySelector('div[data-element="status-line"]')).toBeDefined();
                this.simpleLogViewerInstance.stop();
                expect(this.node.innerHTML).toBe('');
            });

            it('Should send bus messages requesting job status information at startup', async function () {
                const jobId = TEST_JOB_ID;
                const arg = {
                    node: this.node,
                    jobId,
                };
                spyOn(this.bus, 'emit');
                await this.simpleLogViewerInstance.start(arg);

                expect(this.bus.emit.calls.allArgs()).toEqual([
                    [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.JOB_ID]: jobId }],
                ]);
                expect(this.simpleLogViewerInstance.lastJobState).toEqual(null);
            });

            JobsData.allJobsWithBatchParent.forEach((jobState) => {
                const jobId = jobState.job_id,
                    { status } = jobState;
                it(`should use existing job data for job ${jobId}`, async function () {
                    const arg = {
                        node: this.node,
                        jobId,
                    };
                    spyOn(this.bus, 'emit');
                    await this.simpleLogViewerInstance.start(arg);
                    expect(this.simpleLogViewerInstance.lastJobState).toEqual(
                        JobsData.jobsById[jobId]
                    );

                    if (jobState.batch_job) {
                        expect(this.simpleLogViewerInstance.getLogPanel().textContent).toContain(
                            this.simpleLogViewerInstance.messages.BATCH_JOB
                        );
                        expect(this.bus.emit.calls.allArgs()).toEqual(
                            jasmine.arrayWithExactContents([
                                [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.JOB_ID]: jobId }],
                            ])
                        );
                        checkButtons(this, 'default');
                        return;
                    }

                    const mode = this.simpleLogViewerInstance._statusToMode(status);
                    switch (mode) {
                        case 'queued':
                            // queued: LOG_PANEL should contain a message
                            expectQueuedMessage(this);
                            expect(this.bus.emit.calls.allArgs()).toEqual(
                                jasmine.arrayWithExactContents([
                                    [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.JOB_ID]: jobId }],
                                ])
                            );
                            checkButtons(this, 'default');
                            break;

                        case 'running':
                        case 'terminal':
                            expect(this.bus.emit.calls.allArgs()).toEqual(
                                jasmine.arrayWithExactContents([
                                    [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.JOB_ID]: jobId }],
                                    [jcm.MESSAGE_TYPE.LOGS, { [jcm.PARAM.JOB_ID]: jobId }],
                                ])
                            );
                            break;

                        // job not found
                        default:
                            expect(
                                this.simpleLogViewerInstance.getLogPanel().textContent
                            ).toContain(this.simpleLogViewerInstance.messages.JOB_NOT_FOUND);
                            expect(this.bus.emit.calls.allArgs()).toEqual(
                                jasmine.arrayWithExactContents([
                                    [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.JOB_ID]: jobId }],
                                ])
                            );
                            checkButtons(this, 'default');
                            break;
                    }
                });
            });
            it('should render appropriately without job data in the job manager', async function () {
                const jobId = TEST_JOB_ID;
                const arg = {
                    node: this.node,
                    jobId,
                };
                spyOn(this.bus, 'emit');
                await this.simpleLogViewerInstance.start(arg);
                expectAwaitingDataMessage(this);
                expect(this.bus.emit.calls.allArgs()).toEqual(
                    jasmine.arrayWithExactContents([
                        [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.JOB_ID]: jobId }],
                    ])
                );
                checkButtons(this, 'default');
            });
        });

        describe('controls', () => {
            const jobState = jobsByStatus.running[0];
            const jobId = jobState.job_id;
            let jlv, container;

            beforeEach(async function () {
                createLogViewer(this);
                jlv = this.simpleLogViewerInstance;
                container = this.node;
                this.bus.on(jcm.MESSAGE_TYPE.STATUS, (msg) => {
                    expect(msg).toEqual({ [jcm.PARAM.JOB_ID]: jobId });
                    TestUtil.sendBusMessage({
                        bus: this.bus,
                        message: {
                            [jobId]: {
                                [jcm.PARAM.JOB_ID]: jobId,
                                jobState,
                            },
                        },
                        channelType: jcm.CHANNEL.JOB,
                        channelId: jobId,
                        type: jcm.MESSAGE_TYPE.STATUS,
                    });
                });

                this.bus.on(jcm.MESSAGE_TYPE.LOGS, (msg) => {
                    expect(msg).toEqual({ [jcm.PARAM.JOB_ID]: jobId });
                    TestUtil.sendBusMessage({
                        bus: this.bus,
                        message: {
                            [jobId]: {
                                [jcm.PARAM.JOB_ID]: jobId,
                                [jcm.PARAM.BATCH_ID]: jobState.batch_id,
                                lines: lotsOfLogLines,
                                first: 0,
                                latest: true,
                                max_lines: lotsOfLogLines.length,
                            },
                        },
                        channelType: jcm.CHANNEL.JOB,
                        channelId: jobId,
                        type: jcm.MESSAGE_TYPE.LOGS,
                    });
                });

                await this.simpleLogViewerInstance.start({
                    node: this.node,
                    jobId,
                });
                await TestUtil.waitForElementChange(
                    this.node.querySelector('[data-element="log-panel"]')
                );
                const logPanelTitle = this.node.querySelector(`.${cssBaseClass}__logs_title`);
                logPanelTitle.click();
            });

            afterEach(async () => {
                await jlv.stop();
                container.remove();
            });

            it('should have an expand button that toggles the log container class', function () {
                const standardClass = `.${cssBaseClass}__content`,
                    expandedClass = `${standardClass}--expanded`,
                    expandButton = this.node.querySelector(`.${cssBaseClass}__log_button--expand`);

                expect(this.node.querySelectorAll(standardClass).length).toEqual(1);
                expect(this.node.querySelectorAll(expandedClass).length).toEqual(0);

                expandButton.click();
                expect(this.node.querySelectorAll(standardClass).length).toEqual(0);
                expect(this.node.querySelectorAll(expandedClass).length).toEqual(1);

                expandButton.click();
                expect(this.node.querySelectorAll(standardClass).length).toEqual(1);
                expect(this.node.querySelectorAll(expandedClass).length).toEqual(0);
            });

            // the next two tests do not pass consistently when run by the test harness
            xit('Should have the top button go to the top', async function () {
                const logContent = this.node.querySelector('.kb-log__content'),
                    topButton = this.node.querySelector(`.${cssBaseClass}__log_button--top`);
                // set the scrollTop to the midway point
                logContent.scrollTop = logContent.clientHeight / 2;

                await TestUtil.waitForElementChange(logContent, () => {
                    topButton.click();
                });
                expect(logContent.scrollTop).toEqual(0);
            });

            xit('Should have the bottom button go to the end', async function () {
                const logContent = this.node.querySelector('.kb-log__content'),
                    bottomButton = this.node.querySelector(`.${cssBaseClass}__log_button--bottom`);
                // set the scrollTop to the midway point
                logContent.scrollTop = logContent.clientHeight / 2;

                await TestUtil.waitForElementChange(logContent, () => {
                    bottomButton.click();
                });
                expect(logContent.scrollTop).not.toEqual(0);
                expect(logContent.scrollTop).toEqual(
                    logContent.scrollHeight - logContent.clientHeight
                );
            });

            xit('should have stop and play buttons to turn logs off and on', () => {});
        });

        // the log display
        describe('log viewer', () => {
            beforeEach(function () {
                createLogViewer(this, TEST_POLL_INTERVAL);
            });
            afterEach(() => {
                TestUtil.clearRuntime();
            });

            // start off without a job state for the job ID
            ['job', 'batch'].forEach((inputType) => {
                // job not found: logs container is removed

                it(`should not render logs if the job is not found, ${inputType} channel`, async function () {
                    const jobState = jobsByStatus['does_not_exist'][0];
                    const jobId = jobState.job_id;
                    const input = generateInput(jobId);
                    this.jobManager.model.deleteItem(`exec.jobs.byId.${jobId}`);
                    this.bus.on(jcm.MESSAGE_TYPE.STATUS, (msg) => {
                        expect(msg).toEqual({ [jcm.PARAM.JOB_ID]: jobState.job_id });
                        // send the job message
                        TestUtil.sendBusMessage({
                            bus: this.bus,
                            type: jcm.MESSAGE_TYPE.STATUS,
                            ...input[inputType],
                        });
                    });

                    await this.simpleLogViewerInstance.start({
                        node: this.node,
                        jobId,
                    });

                    await TestUtil.waitForElementChange(
                        this.node.querySelector('[data-element="log-panel"]')
                    );
                    // the job log panel should have a message saying that the job does not exist
                    expectJobNotFound(this);
                    expectNotAwaitingLog(this);
                    checkButtons(this, 'default');
                });

                // queued jobs: message to say that the logs will be available when job runs
                queueStates.forEach((queueState) => {
                    it(`should render a queued message for "${queueState}" jobs, ${inputType} channel`, async function () {
                        const jobState = jobsByStatus[queueState][0];
                        const jobId = jobState.job_id;
                        const input = generateInput(jobId);
                        this.jobManager.model.deleteItem(`exec.jobs.byId.${jobId}`);

                        this.bus.on(jcm.MESSAGE_TYPE.STATUS, (msg) => {
                            expect(msg).toEqual({ [jcm.PARAM.JOB_ID]: jobState.job_id });
                            // send the job message
                            TestUtil.sendBusMessage({
                                bus: this.bus,
                                type: jcm.MESSAGE_TYPE.STATUS,
                                ...input[inputType],
                            });
                        });

                        await this.simpleLogViewerInstance.start({
                            node: this.node,
                            jobId,
                        });

                        await TestUtil.waitForElementChange(
                            this.node.querySelector('[data-element="log-panel"]')
                        );
                        expectQueuedMessage(this);
                        expectNotAwaitingLog(this);
                        checkButtons(this, 'default');
                    });
                });

                // running job: job logs are updated as they are received
                it(`Should render job logs whilst job is running, ${inputType} channel`, async function () {
                    const jobState = jobsByStatus['running'][0];
                    const jobId = jobState.job_id;
                    const input = generateInput(jobId),
                        { channelType, channelId } = input[inputType];

                    // lines to return each time there is a request for the latest logs
                    // first request - 0 lines; second: 2 log lines; third: same as second; last: all log lines.
                    const logMessages = [[], logLines.slice(0, 2), logLines.slice(0, 2), logLines]; //
                    let acc = 0;

                    spyOn(this.bus, 'emit').and.callFake((...args) => {
                        if (args[0] === jcm.MESSAGE_TYPE.STATUS) {
                            expect(args[1]).toEqual({ [jcm.PARAM.JOB_ID]: jobId });
                            TestUtil.sendBusMessage({
                                bus: this.bus,
                                type: jcm.MESSAGE_TYPE.STATUS,
                                ...input[inputType],
                            });
                        } else if (args[0] === jcm.MESSAGE_TYPE.LOGS) {
                            expectLogRequested(this);
                            const logUpdate = logMessages[acc];
                            // set up the mutation observer to watch for UI spinner changes
                            // the spinner is shown whenever the log viewer is waiting for logs
                            // and hidden whenever a log update comes in
                            // there are four job logs messages to check for, so once we have seen
                            // all four, resolve the promise and finish the test.
                            const observer = new MutationObserver(() => {
                                testJobLogs(this, logUpdate);
                                observer.disconnect();
                                if (logMessages.length === acc + 1) {
                                    return;
                                }
                            });
                            observer.observe(this.node.querySelector('[data-element="spinner"]'), {
                                attributes: true,
                                childList: true,
                                subtree: true,
                            });
                            TestUtil.sendBusMessage({
                                bus: this.bus,
                                message: {
                                    [jobId]: {
                                        [jcm.PARAM.JOB_ID]: jobId,
                                        [jcm.PARAM.BATCH_ID]: jobState.batch_id,
                                        lines: logUpdate,
                                        first: 0,
                                        latest: true,
                                        max_lines: logUpdate.length,
                                    },
                                },
                                channelType,
                                channelId,
                                type: jcm.MESSAGE_TYPE.LOGS,
                            });
                            acc++;
                        }
                    });

                    await this.simpleLogViewerInstance.start({
                        node: this.node,
                        jobId,
                    });

                    await TestUtil.waitForElementState(this.node, () => {
                        return (
                            this.node.querySelectorAll('.kb-log__log_line_container li').length ===
                            logLines.length
                        );
                    });
                    expectNotAwaitingLog(this);
                    checkButtons(this, 'running_scrolling');
                });

                // job running, job logs have been deleted
                it(`should render a message when logs are deleted, state running, ${inputType} channel`, async function () {
                    const jobState = jobsByStatus['running'][0];
                    const jobId = jobState.job_id;
                    const input = generateInput(jobId),
                        { channelType, channelId } = input[inputType];
                    this.jobManager.model.deleteItem(`exec.jobs.byId.${jobId}`);

                    this.bus.on(jcm.MESSAGE_TYPE.STATUS, (msg) => {
                        expect(msg).toEqual({ [jcm.PARAM.JOB_ID]: jobId });
                        TestUtil.sendBusMessage({
                            bus: this.bus,
                            type: jcm.MESSAGE_TYPE.STATUS,
                            ...input[inputType],
                        });
                    });

                    // this is called when the state is 'running'
                    this.bus.on(jcm.MESSAGE_TYPE.LOGS, (msg) => {
                        expect(msg).toEqual({ [jcm.PARAM.JOB_ID]: jobId });
                        TestUtil.sendBusMessage({
                            bus: this.bus,
                            message: {
                                [jobId]: {
                                    [jcm.PARAM.JOB_ID]: jobId,
                                    error: 'summat went wrong',
                                },
                            },
                            channelType,
                            channelId,
                            type: jcm.MESSAGE_TYPE.LOGS,
                        });
                    });

                    spyOn(console, 'error');
                    await this.simpleLogViewerInstance.start({
                        node: this.node,
                        jobId,
                    });

                    await TestUtil.waitForElementChange(
                        this.node.querySelector('[data-element="log-panel"]')
                    );

                    // await the second change, when the logs message is received
                    await TestUtil.waitForElementChange(
                        this.node.querySelector('[data-element="log-panel"]')
                    );

                    expect(this.node.querySelector('[data-element="log-panel"]').textContent).toBe(
                        'No log entries to show.'
                    );
                    expectNotAwaitingLog(this);
                    expect(this.simpleLogViewerInstance.state.looping).toBeFalse();

                    const allCalls = console.error.calls.allArgs();
                    expect(allCalls.length).toEqual(1);
                    expect(allCalls[0].length).toEqual(1);
                    expect(allCalls[0][0]).toMatch(
                        /Error retrieving log for JOB_.*?summat went wrong/
                    );
                });

                endStates.forEach((endState) => {
                    // completed statuses - should be one request for logs
                    it(`Should render all job logs if the job status is ${endState}, ${inputType} channel`, async function () {
                        const jobState = jobsByStatus[endState][0];
                        const jobId = jobState.job_id;
                        const input = generateInput(jobId),
                            { channelType, channelId } = input[inputType];
                        this.jobManager.model.deleteItem(`exec.jobs.byId.${jobId}`);

                        this.bus.on(jcm.MESSAGE_TYPE.STATUS, (msg) => {
                            expect(msg).toEqual({ [jcm.PARAM.JOB_ID]: jobId });
                            TestUtil.sendBusMessage({
                                bus: this.bus,
                                type: jcm.MESSAGE_TYPE.STATUS,
                                ...input[inputType],
                            });
                        });

                        this.bus.on(jcm.MESSAGE_TYPE.LOGS, (msg) => {
                            expectLogRequested(this);
                            expect(msg).toEqual({ [jcm.PARAM.JOB_ID]: jobId });
                            TestUtil.sendBusMessage({
                                bus: this.bus,
                                message: {
                                    [jobId]: {
                                        [jcm.PARAM.JOB_ID]: jobId,
                                        [jcm.PARAM.BATCH_ID]: jobState.batch_id,
                                        lines: logLines,
                                        first: 0,
                                        latest: true,
                                        max_lines: logLines.length,
                                    },
                                },
                                channelType,
                                channelId,
                                type: jcm.MESSAGE_TYPE.LOGS,
                            });
                        });

                        await this.simpleLogViewerInstance.start({
                            node: this.node,
                            jobId,
                        });

                        await TestUtil.waitForElementChange(
                            this.node.querySelector('[data-element="log-panel"]')
                        );
                        testJobLogs(this, logLines);
                        expectNotAwaitingLog(this);
                        checkButtons(this, 'terminal');
                    });

                    // logs deleted: 'No log entries to show' message
                    // create a mutation observer to watch for changes to the log-panel node; when those changes
                    // occur, `callback` will be run to test that the changes are as expected
                    it(`should render a message when logs are deleted, state ${endState}, ${inputType} channel`, async function () {
                        const jobState = jobsByStatus[endState][0];
                        const jobId = jobState.job_id;
                        const input = generateInput(jobId),
                            { channelType, channelId } = input[inputType];
                        this.jobManager.model.deleteItem(`exec.jobs.byId.${jobId}`);

                        this.bus.on(jcm.MESSAGE_TYPE.STATUS, (msg) => {
                            expect(msg).toEqual({ [jcm.PARAM.JOB_ID]: jobId });
                            TestUtil.sendBusMessage({
                                bus: this.bus,
                                type: jcm.MESSAGE_TYPE.STATUS,
                                ...input[inputType],
                            });
                        });

                        this.bus.on(jcm.MESSAGE_TYPE.LOGS, (msg) => {
                            expectLogRequested(this);
                            expect(msg).toEqual({ [jcm.PARAM.JOB_ID]: jobId });
                            TestUtil.sendBusMessage({
                                bus: this.bus,
                                message: {
                                    [jobId]: {
                                        error: 'DANGER!',
                                        [jcm.PARAM.JOB_ID]: jobId,
                                    },
                                },
                                channelType,
                                channelId,
                                type: jcm.MESSAGE_TYPE.LOGS,
                            });
                        });
                        spyOn(console, 'error');
                        await this.simpleLogViewerInstance.start({
                            node: this.node,
                            jobId,
                        });
                        await TestUtil.waitForElementChange(
                            this.node.querySelector('[data-element="log-panel"]')
                        );

                        expect(
                            this.node.querySelector('[data-element="log-panel"]').textContent
                        ).toBe('No log entries to show.');
                        expectNotAwaitingLog(this);
                        expect(this.simpleLogViewerInstance.state.looping).toBeFalse();
                        const allCalls = console.error.calls.allArgs();
                        expect(allCalls.length).toEqual(1);
                        expect(allCalls[0].length).toEqual(1);
                        expect(allCalls[0][0]).toMatch(/Error retrieving log for JOB_.*?DANGER!/);
                    });
                });
            });
        });

        describe('fetching logs', () => {
            beforeEach(function () {
                createLogViewer(this, TEST_POLL_INTERVAL);
            });
            afterEach(() => {
                TestUtil.clearRuntime();
            });

            ['job', 'batch'].forEach((inputType) => {
                it(`can intelligently deal with log updates, ${inputType} mode`, async function () {
                    const jobId = JobsData.JOB_NAMES.RUNNING,
                        runningJob = JobsData.jobsByStatus.running[0],
                        input = generateInput(jobId);
                    let acc = 0;

                    spyOn(this.simpleLogViewerInstance, 'handleJobStatus').and.callThrough();

                    spyOn(this.bus, 'emit').and.callFake((...args) => {
                        if (args[0] === jcm.MESSAGE_TYPE.STATUS) {
                            expect(args[1]).toEqual({ [jcm.PARAM.JOB_ID]: jobId });
                            TestUtil.sendBusMessage({
                                bus: this.bus,
                                type: jcm.MESSAGE_TYPE.STATUS,
                                ...input[inputType],
                                message: {
                                    [jobId]: {
                                        [jcm.PARAM.JOB_ID]: jobId,
                                        jobState: runningJob,
                                    },
                                },
                            });
                        } else if (args[0] === jcm.MESSAGE_TYPE.LOGS) {
                            expectLogRequested(this);
                            if (acc >= messageSeries.length) {
                                // finish the test
                                expect(this.simpleLogViewerInstance.model.getItem('lines')).toEqual(
                                    logLines
                                );
                                return;
                            }
                            const messageParams = messageSeries[acc];
                            expect(args[1]).toEqual({
                                [jcm.PARAM.JOB_ID]: jobId,
                                ...messageParams.request,
                            });
                            expect(this.simpleLogViewerInstance.model.getItem('lines')).toEqual(
                                messageParams.model
                            );
                            testJobLogs(this, messageParams.model);
                            TestUtil.sendBusMessage({
                                bus: this.bus,
                                type: jcm.MESSAGE_TYPE.LOGS,
                                ...input[inputType],
                                message: {
                                    [jobId]: {
                                        [jcm.PARAM.JOB_ID]: jobId,
                                        latest: true,
                                        batch_id: runningJob.batch_id,
                                        ...messageParams,
                                    },
                                },
                            });
                            acc++;
                        }
                    });

                    await this.simpleLogViewerInstance.start({
                        node: this.node,
                        jobId,
                    });

                    await TestUtil.waitForElementState(this.node, () => {
                        return (
                            this.node.querySelectorAll('.kb-log__log_line_container li').length >=
                            logLines.length
                        );
                    });
                    expect(this.simpleLogViewerInstance.model.getItem('lines')).toEqual(logLines);
                    expectNotAwaitingLog(this);
                });
            });
        });

        describe('life cycle tests', () => {
            beforeEach(function () {
                createLogViewer(this, TEST_POLL_INTERVAL);
            });
            afterEach(() => {
                TestUtil.clearRuntime();
            });

            ['job', 'batch'].forEach((inputType) => {
                it(`has a life cycle when receiving status messages in ${inputType} mode`, async function () {
                    const jobId = JobsData.JOB_NAMES.CREATED,
                        input = generateInput(jobId);
                    let acc = -1;

                    // // set the job manager's status request loop going
                    this.jobManager.restoreFromSaved();

                    // status updates
                    const jobStatusSeries = TestUtil.JSONcopy(JobsData.jobProgression);

                    // in batch mode, add a not found message to the end to allow our tests to finish
                    // this won't work in individual job mode as the listener will be removed
                    if (inputType === 'batch') {
                        jobStatusSeries.push({
                            job_id: JobsData.JOB_NAMES.CREATED,
                            status: 'does_not_exist',
                        });
                    }

                    spyOn(this.bus, 'emit').and.callFake((...args) => {
                        if (args[0] === jcm.MESSAGE_TYPE.STATUS) {
                            const jobIdList = args[1][jcm.PARAM.JOB_ID_LIST] || [
                                args[1][jcm.PARAM.JOB_ID],
                            ];
                            acc++;

                            if (acc < jobStatusSeries.length) {
                                const { status } = jobStatusSeries[acc];

                                // the final request will not contain CREATED as it has already completed
                                // but we added on the 'does_not_exist' message for fun
                                if (status === 'does_not_exist') {
                                    expect(jobIdList).not.toContain(JobsData.JOB_NAMES.CREATED);
                                } else {
                                    expect(jobIdList).toContain(JobsData.JOB_NAMES.CREATED);
                                }

                                TestUtil.sendBusMessage({
                                    bus: this.bus,
                                    type: jcm.MESSAGE_TYPE.STATUS,
                                    ...input[inputType],
                                    message: {
                                        ...input[inputType].message,
                                        [jobId]: {
                                            [jcm.PARAM.JOB_ID]: jobId,
                                            jobState: jobStatusSeries[acc],
                                        },
                                    },
                                });
                            } else {
                                // otherwise, the test is finished
                                expect(jobIdList).not.toContain(JobsData.JOB_NAMES.CREATED);
                                this.node.querySelector('[data-element="log-panel"]').textContent =
                                    'WORK COMPLETE!';
                            }
                        }
                    });

                    this.simpleLogViewerInstance.jobManager.addEventHandler(
                        jcm.MESSAGE_TYPE.STATUS,
                        {
                            zzz_test_handler: () => {
                                switch (jobStatusSeries[acc].status) {
                                    case 'created':
                                    case 'estimating':
                                    case 'queued':
                                        expectQueuedMessage(this);
                                        expectNotAwaitingLog(this);
                                        checkButtons(this, 'default');
                                        break;
                                    case 'running':
                                        expectLogRequested(this);
                                        expect(
                                            this.simpleLogViewerInstance.state.looping
                                        ).toBeTrue();
                                        checkButtons(this, 'running_scrolling');
                                        break;
                                    case 'completed':
                                        expectLogRequested(this);
                                        expect(
                                            this.simpleLogViewerInstance.state.looping
                                        ).toBeFalse();
                                        checkButtons(this, 'terminal');
                                        break;
                                    case 'does_not_exist':
                                        expectJobNotFound(this);
                                        expectNotAwaitingLog(this);
                                        checkButtons(this, 'default');
                                        break;
                                }
                            },
                        }
                    );

                    await this.simpleLogViewerInstance.start({
                        node: this.node,
                        jobId,
                    });

                    await TestUtil.waitForElementState(this.node, () => {
                        return (
                            this.node.querySelector('[data-element="log-panel"]').textContent ===
                            'WORK COMPLETE!'
                        );
                    });
                });
            });
        });
    });
});
