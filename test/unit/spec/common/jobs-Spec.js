define([
    'common/jobs',
    '/test/data/jobsData',
    'common/props',
    'common/jobCommMessages',
    'util/util',
    'testUtil',
    'json!/src/biokbase/narrative/tests/data/response_data.json',
], (Jobs, JobsData, Props, jcm, Utils, TestUtil, ResponseData) => {
    'use strict';

    function arrayToHTML(array) {
        return array.map((item) => `<div>${item}</div>`).join('\n');
    }

    const jobsModuleExports = [
        'canCancel',
        'canDo',
        'canRetry',
        'createCombinedJobState',
        'createCombinedJobStateSummary',
        'createJobStatusFromFsm',
        'createJobStatusFromBulkCellFsm',
        'createJobStatusLines',
        'createJobStatusSummary',
        'getCurrentJobCounts',
        'getCurrentJobs',
        'getFsmStateFromJobs',
        'isTerminalStatus',
        'isValidBackendJobStateObject',
        'isValidJobStatus',
        'isValidJobStateObject',
        'isValidJobInfoObject',
        'isValidJobLogsObject',
        'isValidJobRetryObject',
        'isValidRunStatusObject',
        'jobAction',
        'jobArrayToIndexedObject',
        'jobLabel',
        'jobNotFound',
        'jobStatusUnknown',
        'jobStrings',
        'niceState',
        'populateModelFromJobArray',
        'updateJobModel',
        'validateMessage',
        'validJobStatuses',
        'validStatusesForAction',
    ];

    const invalidTypes = [
        null,
        undefined,
        1,
        'foo',
        [],
        ['a', 'list'],
        () => {
            /* no op */
        },
    ];
    describe('Test Jobs module', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('Should be loaded with the right functions', () => {
            expect(Jobs).toBeDefined();
            jobsModuleExports.forEach((f) => {
                expect(Jobs[f]).toBeDefined();
            });
        });
    });

    const badStates = [undefined, null, 'Mary Poppins', 12345678];

    describe('the isTerminalStatus function', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });
        const terminalStatuses = ['completed', 'does_not_exist', 'error', 'terminated'];

        Jobs.validJobStatuses.forEach((status) => {
            const isTerminal = terminalStatuses.includes(status);
            it(`should return ${isTerminal} for status ${status}`, () => {
                expect(Jobs.isTerminalStatus(status)).toEqual(isTerminal);
            });
        });

        it('should return false for invalid job statuses', () => {
            badStates.forEach((status) => {
                expect(Jobs.isTerminalStatus(status)).toBeFalse();
            });
        });
    });

    describe('Job data validation', () => {
        ['BackendJobState', 'JobState', 'Info', 'Retry', 'Logs', 'RunStatus'].forEach((type) => {
            let fn;
            switch (type) {
                case 'BackendJobState':
                case 'JobState':
                case 'RunStatus':
                    fn = `isValid${type}Object`;
                    break;
                default:
                    fn = `isValidJob${type}Object`;
            }

            describe(`The ${fn} function`, () => {
                JobsData.example[type].valid.forEach((elem) => {
                    it(`passes ${JSON.stringify(elem)}`, () => {
                        expect(Jobs[fn](elem)).toBeTrue();
                    });
                });

                JobsData.example[type].invalid.forEach((elem) => {
                    it(`fails ${JSON.stringify(elem)}`, () => {
                        expect(Jobs[fn](elem)).toBeFalse();
                    });
                });
            });
        });

        describe('the validateMessage function', () => {
            Object.keys(ResponseData).forEach((respType) => {
                it(`should validate a multi-job ${respType} message`, () => {
                    expect(
                        Jobs.validateMessage({
                            message: ResponseData[respType],
                            type: respType,
                        })
                    ).toEqual({
                        valid: ResponseData[respType],
                    });
                });
            });

            ['job-status', 'greetings', 'error', 'NEW', jcm.MESSAGE_TYPE.CANCEL].forEach((type) => {
                it(`should reject invalid message type ${type}`, () => {
                    expect(Jobs.validateMessage({ message: null, type })).toEqual({
                        invalid: null,
                    });
                });
            });

            invalidTypes.forEach((dataType) => {
                it(`should reject message with an invalid data type ${Utils.objectToString(
                    dataType
                )}`, () => {
                    expect(
                        Jobs.validateMessage({ message: dataType, type: jcm.MESSAGE_TYPE.INFO })
                    ).toEqual({ invalid: dataType });
                });
            });

            const gotValidator = ['INFO', 'LOGS', 'RETRY', 'RUN_STATUS', 'STATUS', 'STATUS_ALL'];
            Object.keys(jcm.RESPONSES).forEach((type) => {
                if (!gotValidator.includes(type)) {
                    it(`should validate ${type} messages (no validator)`, () => {
                        expect(
                            Jobs.validateMessage({
                                message: {},
                                type: jcm.RESPONSES[type],
                            })
                        ).toEqual({
                            valid: {},
                        });
                    });
                }
            });

            ['INFO', 'LOGS', 'RETRY', 'STATUS'].forEach((type) => {
                // combine valid and invalid data type
                it(`should separate out valid and invalid ${type} data`, () => {
                    const dataBlob = {},
                        expected = {};
                    let i = 0;

                    ['valid', 'invalid'].forEach((validity) => {
                        expected[validity] = {};
                        JobsData.example[type][validity].forEach((elem) => {
                            dataBlob[`job_${i}`] = elem;
                            expected[validity][`job_${i}`] = elem;
                            i++;
                        });
                    });
                    expect(
                        Jobs.validateMessage({ message: dataBlob, type: jcm.MESSAGE_TYPE[type] })
                    ).toEqual(expected);
                });
            });
        });
    });

    ['canCancel', 'canRetry'].forEach((fn) => {
        const actions = {
            canCancel: 'cancel',
            canRetry: 'retry',
        };
        describe(`the ${fn} function`, () => {
            JobsData.allJobsWithBatchParent.forEach((jobState) => {
                it(`should respond ${jobState.meta[fn]} for ${jobState.job_id}`, () => {
                    expect(Jobs[fn](jobState)).toBe(jobState.meta[fn]);
                    expect(Jobs.canDo(actions[fn], jobState)).toBe(jobState.meta[fn]);
                });
            });
        });
    });

    describe('createJobStatusLines and createJobStatusSummary', () => {
        beforeEach(function () {
            this.container = document.createElement('div');
        });

        afterEach(() => {
            TestUtil.clearRuntime();
        });

        const args = [false, true];
        JobsData.allJobs.forEach((state) => {
            it(`should create an appropriate status string for ${state.job_id}`, function () {
                const statusLines = Jobs.createJobStatusLines(state);
                this.container.innerHTML = arrayToHTML(statusLines);
                expect(this.container.textContent).toContain(state.meta.createJobStatusLines.line);
            });
            it(`should create an appropriate summary string for ${state.job_id}`, function () {
                this.container.innerHTML = Jobs.createJobStatusSummary(state);
                const summary = state.meta.createJobStatusLines.summary
                    ? state.meta.createJobStatusLines.summary
                    : state.meta.createJobStatusLines.line;
                // queued and running jobs have a spinner, which adds a space at the beginning
                expect(this.container.textContent.trim()).toEqual(summary);
            });
        });
        JobsData.allJobs.forEach((state) => {
            it(`should create an appropriate array in history mode for ${state.job_id}`, function () {
                const statusLines = Jobs.createJobStatusLines(state, true);
                this.container.innerHTML = arrayToHTML(statusLines);
                state.meta.createJobStatusLines.history.forEach((historyLine) => {
                    expect(this.container.textContent).toContain(historyLine);
                });
            });
        });

        it('should return an appropriate string for dodgy jobStates', function () {
            JobsData.example.JobState.invalid.forEach((state) => {
                args.forEach((arg) => {
                    const statusLines = Jobs.createJobStatusLines(state, arg);
                    this.container.innerHTML = arrayToHTML(statusLines);
                    expect(this.container.textContent).toContain(JobsData.jobStrings.unknown);
                });
                this.container.innerHTML = Jobs.createJobStatusSummary(state);
                expect(this.container.textContent).toEqual(JobsData.jobStrings.unknown);
            });
        });
    });

    describe('jobLabel', () => {
        const labelToState = [
            ['Mary Poppins', 'not found'],
            [null, 'not found'],
            [undefined, 'not found'],
            ['does_not_exist', 'not found'],
            ['estimating', 'queued'],
            ['queued', 'queued'],
            ['error', 'failed'],
            ['terminated', 'cancelled'],
            ['running', 'running'],
        ];
        labelToState.forEach((entry) => {
            it(`should create an abbreviated label when given the job state ${entry[0]}`, () => {
                expect(Jobs.jobLabel({ status: entry[0] })).toEqual(entry[1]);
            });
        });
    });

    describe('jobAction', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        badStates.forEach((item) => {
            it(`should generate no action with the job state ${item}`, () => {
                expect(Jobs.jobAction({ status: item })).toEqual(null);
            });
        });
        JobsData.allJobsWithBatchParent.forEach((state) => {
            it(`should generate a job action with the job state ${state.status}`, () => {
                expect(Jobs.jobAction(state)).toEqual(state.meta.jobAction);
            });
        });
    });

    describe('jobLabel', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        badStates.forEach((item) => {
            it(`creates an appropriate label with the input ${JSON.stringify(item)}`, () => {
                expect(Jobs.jobLabel({ status: item })).toEqual('not found');
            });
        });
        JobsData.allJobs.forEach((state) => {
            it(`creates an appropriate label with input in state ${state.status}`, () => {
                // include extra error info
                expect(Jobs.jobLabel(state, true)).toEqual(
                    state.meta.jobLabelIncludeError || state.meta.jobLabel
                );
                // just the basic label
                expect(Jobs.jobLabel(state)).toEqual(state.meta.jobLabel);
            });
        });
    });

    describe('niceState', () => {
        beforeAll(function () {
            this.container = document.createElement('div');
        });
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        badStates.forEach((item) => {
            it(`should generate a nice state for the input ${item}`, function () {
                this.container.innerHTML = Jobs.niceState(item);
                const span = this.container.querySelector('span');
                expect(span).toHaveClass('kb-job-status__summary');
                expect(span.textContent).toContain('invalid');
            });
        });

        JobsData.allJobs.forEach((state) => {
            it(`should generate a nice state for ${state.status}`, function () {
                this.container.innerHTML = Jobs.niceState(state.status);
                const span = this.container.querySelector('span');
                expect(span).toHaveClass(state.meta.niceState.class);
                expect(span.textContent).toContain(state.meta.niceState.label);
            });
        });
    });

    describe('createJobStatusFromFsm', () => {
        beforeEach(function () {
            this.container = document.createElement('div');
        });
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        const tests = [
            // app cell states
            { mode: 'error', stage: '', text: 'error', cssClass: 'error' },
            { mode: 'error', stage: 'runtime', text: 'error', cssClass: 'error' },
            { mode: 'internal-error', stage: '', text: 'error', cssClass: 'error' },
            { mode: 'canceling', stage: '', text: 'canceled', cssClass: 'terminated' },
            { mode: 'canceled', stage: '', text: 'canceled', cssClass: 'terminated' },
            { mode: 'processing', stage: 'running', text: 'running', cssClass: 'running' },
            { mode: 'processing', stage: 'queued', text: 'queued', cssClass: 'queued' },
            { mode: 'success', stage: '', text: 'success', cssClass: 'completed' },
            // invalid input
            { mode: 'processing', stage: 'unknown', noResult: true },
            { mode: '', stage: 'running', noResult: true },
            // bulk cell states
            { state: 'editingIncomplete', noResult: true },
            { state: 'editingComplete', noResult: true },
            { state: 'launching', text: 'in progress', cssClass: 'running' },
            { state: 'inProgress', text: 'in progress', cssClass: 'running' },
            { state: 'inProgressResultsAvailable', text: 'in progress', cssClass: 'running' },
            { state: 'jobsFinished', text: 'jobs finished', cssClass: 'error' },
            { state: 'jobsFinishedResultsAvailable', text: 'jobs finished', cssClass: 'completed' },
            { state: 'error', text: 'error', cssClass: 'error' },
            // invalid
            { state: 'new', noResult: true },
            { state: null, noResult: true },
            { state: undefined, noResult: true },
        ];

        tests.forEach((test) => {
            let func, testString;
            if (test.mode || test.stage) {
                func = (t) => {
                    return Jobs.createJobStatusFromFsm(t.mode, t.stage);
                };
                testString = `mode "${test.mode}" and stage "${test.stage}"`;
            } else {
                func = (t) => {
                    return Jobs.createJobStatusFromBulkCellFsm(t.state);
                };
                testString = `state "${test.state}"`;
            }

            if (test.noResult) {
                it(`should not produce a status span with ${testString}`, () => {
                    expect(func(test)).toBe('');
                });
            } else {
                it(`should output "${test.text}" with ${testString}`, function () {
                    this.container.innerHTML = func(test);
                    expect(this.container.querySelector('span').classList).toContain(
                        `kb-job-status__cell_summary--${test.cssClass}`
                    );
                    expect(this.container.querySelector('span').textContent).toBe(test.text);
                });
            }
        });
    });

    function generateJobs(jobSpec) {
        const outputJobs = {};
        Object.keys(jobSpec).forEach((status) => {
            Object.keys(jobSpec[status]).forEach((jobId) => {
                outputJobs[jobId] = {
                    job_id: jobId,
                    status: status,
                };
            });
        });
        return outputJobs;
    }

    describe('createCombinedJobState', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        const summary = {
            queued: 'queued',
            running: 'running',
            error: 'error',
            success: 'success',
            terminated: 'canceled',
        };

        const batch = 'batch job';
        const retryBatchId = JobsData.batchJob.batchId;
        const tests = [
            {
                desc: 'all jobs',
                jobs: JobsData.jobsById,
                expected: `${batch} in progress: 3 queued, 1 running, 1 success, 2 failed, 2 cancelled, 1 not found`,
                fsmState: 'inProgressResultsAvailable',
                statusBarSummary: summary.running,
                statuses: {
                    queued: 3,
                    running: 1,
                    completed: 1,
                    error: 2,
                    terminated: 2,
                    does_not_exist: 1,
                },
            },
            {
                desc: 'jobs with retries',
                jobs: JobsData.batchJob.jobsById,
                expected: `${batch} in progress: 3 queued, 1 running, 1 success (3 jobs retried)`,
                fsmState: 'inProgressResultsAvailable',
                statusBarSummary: summary.running,
                statuses: { queued: 3, running: 1, completed: 1, retried: 3 },
            },
            {
                desc: 'jobs with retries, original jobs only',
                jobs: {
                    ...JobsData.batchJob.originalJobs,
                    retryBatchId: JobsData.batchJob.jobsById[retryBatchId],
                },
                expected: `${batch} in progress: 2 queued, 1 failed, 2 cancelled`,
                fsmState: 'inProgress',
                statusBarSummary: summary.queued,
                statuses: { queued: 2, error: 1, terminated: 2 },
            },
            {
                desc: 'all jobs queued',
                jobs: generateJobs({ created: { a: 1 }, estimating: { b: 1 }, queued: { c: 1 } }),
                expected: `${batch} in progress: 3 queued`,
                fsmState: 'inProgress',
                statusBarSummary: summary.queued,
                statuses: { queued: 3 },
            },
            {
                desc: 'queued and running jobs',
                jobs: generateJobs({ estimating: { a: 1 }, running: { b: 1 } }),
                expected: `${batch} in progress: 1 queued, 1 running`,
                fsmState: 'inProgress',
                statusBarSummary: summary.running,
                statuses: { queued: 1, running: 1 },
            },
            {
                desc: 'all running',
                jobs: generateJobs({ running: { a: 1 } }),
                expected: `${batch} in progress: 1 running`,
                fsmState: 'inProgress',
                statusBarSummary: summary.running,
                statuses: { running: 1 },
            },
            {
                desc: 'in progress and finished',
                jobs: generateJobs({
                    estimating: { a: 1 },
                    running: { b: 1 },
                    completed: { c: 1 },
                }),
                expected: `${batch} in progress: 1 queued, 1 running, 1 success`,
                fsmState: 'inProgressResultsAvailable',
                statusBarSummary: summary.running,
                statuses: { queued: 1, running: 1, completed: 1 },
            },
            {
                desc: 'all completed',
                jobs: generateJobs({ completed: { a: 1, b: 1, c: 1 } }),
                expected: `${batch} finished with success: 3 successes`,
                fsmState: 'jobsFinishedResultsAvailable',
                statusBarSummary: summary.success,
                statuses: { completed: 3 },
            },
            {
                desc: 'all failed',
                jobs: generateJobs({ error: { a: 1, b: 1 } }),
                expected: `${batch} finished with error: 2 failed`,
                fsmState: 'jobsFinished',
                statusBarSummary: summary.error,
                statuses: { error: 2 },
            },
            {
                desc: 'all terminated',
                jobs: generateJobs({ terminated: { a: 1, b: 1, c: 1 } }),
                expected: `${batch} finished with cancellation: 3 cancelled`,
                fsmState: 'jobsFinished',
                statusBarSummary: summary.terminated,
                statuses: { terminated: 3 },
            },
            {
                desc: 'mix of finish states',
                jobs: generateJobs({
                    terminated: { a: 1 },
                    error: { b: 1, c: 1, d: 1 },
                    completed: { e: 1 },
                }),
                expected: `${batch} finished: 1 success, 3 failed, 1 cancelled`,
                fsmState: 'jobsFinishedResultsAvailable',
                statusBarSummary: summary.error,
                statuses: { terminated: 1, error: 3, completed: 1 },
            },
            {
                desc: 'successful and cancelled jobs',
                jobs: generateJobs({
                    terminated: { a: 1, b: 1 },
                    completed: { e: 1 },
                }),
                expected: `${batch} finished: 1 success, 2 cancelled`,
                fsmState: 'jobsFinishedResultsAvailable',
                statusBarSummary: summary.success,
                statuses: { terminated: 2, completed: 1 },
            },
            {
                desc: 'success and error',
                jobs: generateJobs({
                    error: { b: 1, c: 1, d: 1 },
                    completed: { e: 1 },
                }),
                expected: `${batch} finished: 1 success, 3 failed`,
                fsmState: 'jobsFinishedResultsAvailable',
                statusBarSummary: summary.error,
                statuses: { error: 3, completed: 1 },
            },
            {
                desc: 'success and not found',
                jobs: generateJobs({
                    does_not_exist: { b: 1, c: 1, d: 1 },
                    completed: { e: 1 },
                }),
                expected: `${batch} finished: 1 success, 3 not found`,
                fsmState: 'jobsFinishedResultsAvailable',
                statusBarSummary: summary.error,
                statuses: { does_not_exist: 3, completed: 1 },
            },
            {
                desc: 'error and cancelled jobs',
                jobs: generateJobs({
                    terminated: { a: 1, b: 1 },
                    error: { e: 1 },
                }),
                expected: `${batch} finished: 1 failed, 2 cancelled`,
                fsmState: 'jobsFinished',
                statusBarSummary: summary.error,
                statuses: { terminated: 2, error: 1 },
            },
            {
                desc: 'in progress, finished, not found',
                jobs: generateJobs({
                    estimating: { a: 1 },
                    running: { b: 1 },
                    completed: { c: 1 },
                    does_not_exist: { d: 1 },
                }),
                expected: `${batch} in progress: 1 queued, 1 running, 1 success, 1 not found`,
                fsmState: 'inProgressResultsAvailable',
                statusBarSummary: summary.running,
                statuses: { queued: 1, running: 1, completed: 1, does_not_exist: 1 },
            },
            {
                desc: 'jobs do not exist',
                jobs: generateJobs({ does_not_exist: { a: 1, b: 1 } }),
                expected: `${batch} finished with error: 2 not found`,
                fsmState: 'jobsFinished',
                statusBarSummary: summary.error,
                statuses: { does_not_exist: 2 },
            },
            {
                desc: 'no jobs',
                jobs: {},
                expected: '',
                fsmState: null,
                statusBarSummary: '',
                statuses: {},
            },
            {
                desc: 'null',
                jobs: null,
                expected: '',
                fsmState: null,
                statusBarSummary: '',
                statuses: {},
            },
        ];

        tests.forEach((test) => {
            it(`summarises jobs: ${test.desc}`, () => {
                const div = document.createElement('div');
                div.innerHTML = Jobs.createCombinedJobState(test.jobs);
                expect(div.textContent).toBe(test.expected);
                if (test.expected.length) {
                    expect(div.firstChild.title).toBe(test.expected);
                } else {
                    expect(div.childNodes.length).toBe(0);
                }
            });

            it(`deduces FSM state: ${test.desc}`, () => {
                expect(Jobs.getFsmStateFromJobs(test.jobs)).toEqual(test.fsmState);
            });

            it(`gets job counts, ${test.desc}`, () => {
                const statuses = Jobs.getCurrentJobCounts(test.jobs, { withRetries: 1 });
                expect(statuses).toEqual(test.statuses);
            });

            it(`creates a status bar summary, ${test.desc}`, () => {
                const div = document.createElement('div');
                div.innerHTML = Jobs.createCombinedJobStateSummary(test.jobs);
                expect(div.textContent).toBe(test.statusBarSummary);
            });
        });
    });

    describe('getCurrentJobs', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('current jobs, no retries', () => {
            const jobsByOriginalId = Jobs.getCurrentJobs(JobsData.allJobsWithBatchParent);
            const expectedJobsById = TestUtil.JSONcopy(JobsData.jobsById);
            delete expectedJobsById[JobsData.batchParentJob.job_id];
            expect(jobsByOriginalId).toEqual(expectedJobsById);
        });

        it('can retrieve current jobs, with retries', () => {
            const jobsByRetryParent = {};
            const jobsByOriginalId = Jobs.getCurrentJobs(
                JobsData.batchJob.jobArray,
                jobsByRetryParent
            );
            expect(Object.keys(jobsByOriginalId)).toEqual(
                jasmine.arrayWithExactContents(Object.keys(JobsData.batchJob.originalJobs))
            );
            expect(Object.keys(jobsByOriginalId)).toEqual(
                jasmine.arrayWithExactContents(Object.keys(jobsByRetryParent))
            );
        });
    });

    describe('populateModelFromJobArray', () => {
        it('dies without a model', () => {
            expect(() => {
                Jobs.populateModelFromJobArray();
            }).toThrowError(/Missing a model to populate/);
        });
        it('create removes existing jobs and jobState data with an empty jobs array', () => {
            const model = Props.make({
                data: {
                    exec: {
                        jobs: {},
                        jobState: {},
                        limo: 'Rolls Royce',
                    },
                },
            });
            expect(model.getItem('exec')).toEqual({ jobs: {}, jobState: {}, limo: 'Rolls Royce' });
            Jobs.populateModelFromJobArray(model, []);
            expect(model.getItem('exec')).toEqual({ limo: 'Rolls Royce' });
        });

        it('adds the expected structures to jobs and jobState, batch job', () => {
            const model = Props.make({
                    data: {},
                }),
                batchData = JobsData.batchJob;
            expect(model.getItem('exec')).toBeUndefined();
            Jobs.populateModelFromJobArray(model, batchData.jobArray);
            expect(model.getItem('exec.jobState')).toEqual(batchData.jobsById[batchData.batchId]);
            expect(model.getItem('exec.jobs.byId')).toEqual(batchData.jobsById);
        });
    });

    describe('jobArrayToIndexedObject', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('creates a model with jobs indexed by ID', () => {
            const model = Jobs.jobArrayToIndexedObject(JobsData.allJobsWithBatchParent);
            expect(Object.keys(model)).toEqual(
                jasmine.arrayWithExactContents(
                    JobsData.allJobsWithBatchParent.map((job) => {
                        return job.job_id;
                    })
                )
            );
        });

        it('creates an empty model with an empty jobs array', () => {
            const model = Jobs.jobArrayToIndexedObject([]);
            expect(model).toEqual({});
        });
    });
});
