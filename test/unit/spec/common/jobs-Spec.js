define(['common/jobs', '/test/data/jobsData', 'common/props', 'testUtil'], (Jobs, JobsData, Props, TestUtil) => {
    'use strict';

    function arrayToHTML(array) {
        return array.map((item) => `<div>${item}</div>`).join('\n');
    }

    const jobsModuleExports = [
        'canCancel',
        'canRetry',
        'createCombinedJobState',
        'createJobStatusFromFsm',
        'createJobStatusLines',
        'getCurrentJobCounts',
        'getCurrentJobs',
        'getFsmStateFromJobs',
        'isTerminalStatus',
        'isValidJobStateObject',
        'isValidJobInfoObject',
        'jobAction',
        'jobArrayToIndexedObject',
        'jobLabel',
        'jobNotFound',
        'jobStatusUnknown',
        'jobStrings',
        'niceState',
        'updateJobModel',
        'validJobStatuses',
        'validStatusesForAction',
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

        it('should return true if the job status is terminal', () => {
            ['completed', 'terminated', 'error', 'does_not_exist'].forEach((status) => {
                expect(Jobs.isTerminalStatus(status)).toBeTrue();
            });
        });
        it('should return false for jobs that are in progress', () => {
            ['created', 'estimating', 'queued', 'running'].forEach((status) => {
                expect(Jobs.isTerminalStatus(status)).toBeFalse();
            });
        });
        it('should return false for invalid job statuses', () => {
            badStates.forEach((status) => {
                expect(Jobs.isTerminalStatus(status)).toBeFalse();
            });
        });
    });

    describe('The isValidJobStateObject function', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('Should know how to tell good job states', () => {
            JobsData.allJobsWithBatchParent
                .concat([
                    {
                        job_id: 'zero_created',
                        created: 0,
                        status: 'created',
                    },
                    {
                        job_id: 'does_not_exist',
                        status: 'does_not_exist',
                    },
                ])
                .forEach((elem) => {
                    expect(Jobs.isValidJobStateObject(elem)).toBeTrue();
                });
        });

        it('Should know how to tell bad job states', () => {
            JobsData.invalidJobs.forEach((elem) => {
                expect(Jobs.isValidJobStateObject(elem)).toBeFalse();
            });
        });
    });

    describe('The isValidJobInfoObject function', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        JobsData.validInfo.forEach((elem) => {
            it(`passes ${JSON.stringify(elem)}`, () => {
                expect(Jobs.isValidJobInfoObject(elem)).toBeTrue();
            });
        });

        JobsData.invalidInfo.forEach((elem) => {
            it(`fails ${JSON.stringify(elem)}`, () => {
                expect(Jobs.isValidJobInfoObject(elem)).toBeFalse();
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

    describe('createJobStatusLines', () => {
        let container;
        beforeAll(() => {
            container = document.createElement('div');
        });

        afterEach(() => {
            TestUtil.clearRuntime();
        });

        afterAll(() => {
            container.remove();
        });
        const args = [false, true];
        JobsData.allJobs.forEach((state) => {
            it(`should create an appropriate status string for ${state.job_id}`, () => {
                const statusLines = Jobs.createJobStatusLines(state);
                container.innerHTML = arrayToHTML(statusLines);
                expect(container.textContent).toContain(state.meta.createJobStatusLines.line);
            });
        });
        JobsData.allJobs.forEach((state) => {
            it(`should create an appropriate array in history mode for ${state.job_id}`, () => {
                const statusLines = Jobs.createJobStatusLines(state, true);
                container.innerHTML = arrayToHTML(statusLines);
                state.meta.createJobStatusLines.history.forEach((historyLine) => {
                    expect(container.textContent).toContain(historyLine);
                });
            });
        });

        it('should return an appropriate string for dodgy jobStates', () => {
            JobsData.invalidJobs.forEach((state) => {
                args.forEach((arg) => {
                    const statusLines = Jobs.createJobStatusLines(state, arg);
                    container.innerHTML = arrayToHTML(statusLines);
                    expect(container.textContent).toContain(JobsData.jobStrings.unknown);
                });
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
        let container;
        beforeAll(() => {
            container = document.createElement('div');
        });
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        afterAll(() => {
            container.remove();
        });
        badStates.forEach((item) => {
            it(`should generate a nice state for the input ${item}`, () => {
                container.innerHTML = Jobs.niceState(item);
                const span = container.querySelector('span');
                expect(span).toHaveClass('kb-job-status__summary');
                expect(span.textContent).toContain('invalid');
            });
        });

        JobsData.allJobs.forEach((state) => {
            it(`should generate a nice state for ${state.status}`, () => {
                container.innerHTML = Jobs.niceState(state.status);
                const span = container.querySelector('span');
                expect(span).toHaveClass(state.meta.niceState.class);
                expect(span.textContent).toContain(state.meta.niceState.label);
            });
        });
    });

    describe('createJobStatusFromFsm', () => {
        let container;
        beforeAll(() => {
            container = document.createElement('div');
        });
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        afterAll(() => {
            container.remove();
        });

        const tests = [
            { mode: 'error', stage: '', text: 'error', cssClass: 'error' },
            { mode: 'internal-error', stage: '', text: 'error', cssClass: 'error' },
            { mode: 'canceling', stage: '', text: 'canceled', cssClass: 'terminated' },
            { mode: 'canceled', stage: '', text: 'canceled', cssClass: 'terminated' },
            { mode: 'processing', stage: 'running', text: 'running', cssClass: 'running' },
            { mode: 'processing', stage: 'queued', text: 'queued', cssClass: 'queued' },
            { mode: 'success', stage: '', text: 'success', cssClass: 'completed' },
            // invalid input
            { mode: 'processing', stage: 'unknown', noResult: true },
            { mode: '', stage: 'running', noResult: true },
        ];

        tests.forEach((test) => {
            if (test.noResult) {
                it(`should not produce a status span with input mode "${test.mode}" and stage "${test.stage}"`, () => {
                    expect(Jobs.createJobStatusFromFsm(test.mode, test.stage)).toBe('');
                });
            } else {
                it(`should output "${test.text}" with input mode "${test.mode}" and stage "${test.stage}"`, () => {
                    container.innerHTML = Jobs.createJobStatusFromFsm(test.mode, test.stage);
                    expect(
                        container.querySelector('[data-element="job-status"]').classList
                    ).toContain(`kb-job-status__cell_summary--${test.cssClass}`);
                    expect(container.querySelector('[data-element="job-status"]').textContent).toBe(
                        test.text
                    );
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
        return { byId: outputJobs };
    }

    describe('createCombinedJobState', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        const batch = 'batch job';
        const retryBatchId = JobsData.batchJob.batchId;
        const tests = [
            {
                desc: 'all jobs',
                jobs: { byId: JobsData.jobsById },
                expected: `${batch} in progress: 3 queued, 1 running, 1 success, 2 failed, 2 cancelled, 1 not found`,
                fsmState: 'inProgressResultsAvailable',
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
                jobs: { byId: JobsData.batchJob.jobsById },
                expected: `${batch} in progress: 2 queued, 1 running, 1 success (3 jobs retried)`,
                fsmState: 'inProgressResultsAvailable',
                statuses: { queued: 2, running: 1, completed: 1, retried: 3 },
            },
            {
                desc: 'jobs with retries, original jobs only',
                jobs: {
                    byId: {
                        ...JobsData.batchJob.originalJobs,
                        retryBatchId: JobsData.batchJob.jobsById[retryBatchId],
                    },
                },
                expected: `${batch} in progress: 1 queued, 1 failed, 2 cancelled`,
                fsmState: 'inProgress',
                statuses: { queued: 1, error: 1, terminated: 2 },
            },
            {
                desc: 'all jobs queued',
                jobs: generateJobs({ created: { a: 1 }, estimating: { b: 1 }, queued: { c: 1 } }),
                expected: `${batch} in progress: 3 queued`,
                fsmState: 'inProgress',
                statuses: { queued: 3 },
            },
            {
                desc: 'queued and running jobs',
                jobs: generateJobs({ estimating: { a: 1 }, running: { b: 1 } }),
                expected: `${batch} in progress: 1 queued, 1 running`,
                fsmState: 'inProgress',
                statuses: { queued: 1, running: 1 },
            },
            {
                desc: 'all running',
                jobs: generateJobs({ running: { a: 1 } }),
                expected: `${batch} in progress: 1 running`,
                fsmState: 'inProgress',
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
                statuses: { queued: 1, running: 1, completed: 1 },
            },
            {
                desc: 'all completed',
                jobs: generateJobs({ completed: { a: 1, b: 1, c: 1 } }),
                expected: `${batch} finished with success: 3 successes`,
                fsmState: 'jobsFinishedResultsAvailable',
                statuses: { completed: 3 },
            },
            {
                desc: 'all failed',
                jobs: generateJobs({ error: { a: 1, b: 1 } }),
                expected: `${batch} finished with error: 2 failed`,
                fsmState: 'jobsFinished',
                statuses: { error: 2 },
            },
            {
                desc: 'all terminated',
                jobs: generateJobs({ terminated: { a: 1, b: 1, c: 1 } }),
                expected: `${batch} finished with cancellation: 3 cancelled`,
                fsmState: 'jobsFinished',
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
                statuses: { terminated: 1, error: 3, completed: 1 },
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
                statuses: { queued: 1, running: 1, completed: 1, does_not_exist: 1 },
            },
            {
                desc: 'jobs do not exist',
                jobs: generateJobs({ does_not_exist: { a: 1, b: 1 } }),
                expected: `${batch} finished with error: 2 not found`,
                fsmState: 'jobsFinished',
                statuses: { does_not_exist: 2 },
            },
            {
                desc: 'no jobs',
                jobs: {},
                expected: '',
                fsmState: null,
                statuses: {},
            },
            {
                desc: 'null',
                jobs: null,
                expected: '',
                fsmState: null,
                statuses: {},
            },
            {
                desc: 'byId is empty',
                jobs: { byId: {} },
                expected: '',
                fsmState: null,
                statuses: {},
            },
            {
                desc: 'byId is null',
                jobs: { byId: null },
                expected: '',
                fsmState: null,
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
        });
    });

    describe('getCurrentJobs', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('current jobs, no retries', () => {
            const jobsByOriginalId = Jobs.getCurrentJobs(JobsData.allJobs);
            expect(jobsByOriginalId).toEqual(JobsData.jobsById);
        });

        it('can retrieve current jobs, with retries', () => {
            const jobsByRetryParent = {};
            const jobsByOriginalId = Jobs.getCurrentJobs(
                JobsData.batchJob.jobArray,
                jobsByRetryParent
            );
            expect(Object.keys(jobsByOriginalId).sort()).toEqual(
                Object.keys(JobsData.batchJob.originalJobs).sort()
            );
            expect(Object.keys(jobsByOriginalId).sort()).toEqual(
                Object.keys(jobsByRetryParent).sort()
            );
        });
    });

    describe('populateModelFromJobArray', () => {
        it('dies without a model', () => {
            expect(() => {
                Jobs.populateModelFromJobArray([]);
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
            Jobs.populateModelFromJobArray([], model);
            expect(model.getItem('exec')).toEqual({ limo: 'Rolls Royce' });
        });

        it('adds the expected structures to jobs and jobState, batch job', () => {
            const model = Props.make({
                    data: {},
                }),
                batchData = JobsData.batchJob;
            expect(model.getItem('exec')).toBeUndefined();
            Jobs.populateModelFromJobArray(batchData.jobArray, model);
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
            const idIndex = model.byId;
            expect(Object.keys(idIndex).sort()).toEqual(
                JobsData.allJobsWithBatchParent
                    .map((jobState) => {
                        return jobState.job_id;
                    })
                    .sort()
            );
        });

        it('creates an empty model with an empty jobs array', () => {
            const model = Jobs.jobArrayToIndexedObject([]);
            expect(model).toEqual({
                byId: {},
            });
            expect(model.byId).toEqual({});
        });
    });
});
