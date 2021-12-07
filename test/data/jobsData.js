define(['common/format', 'testUtil'], (format, TestUtil) => {
    'use strict';
    const t = {
        created: 1610065000000,
        queued: 1610065200000,
        running: 1610065500000,
        finished: 1610065800000,
    };

    const TEST_JOB_ID = 'someJob';

    const jobStrings = {
        unknown: 'Awaiting job data...',
        conn_error: 'Connection error',
        not_found: 'This job was not found, or may not have been registered with this narrative.',
        queued: 'In the queue since ' + format.niceTime(t.created),
        termination: 'Finished with cancellation at ' + format.niceTime(t.finished),
        running: 'Started running job at ' + format.niceTime(t.running),
        error: 'Finished with error at ' + format.niceTime(t.finished),
        success: 'Finished with success at ' + format.niceTime(t.finished),
        queueHistory: 'Queued for ' + format.niceDuration(t.running - t.created),
        queueHistoryNoRun: 'Queued for ' + format.niceDuration(t.finished - t.created),
        runHistory: 'Ran for ' + format.niceDuration(t.finished - t.running),
        action: {
            results: 'go to results',
            cancel: 'cancel',
            retry: 'retry',
        },
    };

    /*
        The following are valid job state objects as would be received from ee2.

        The `meta` key can be used to store test-related data about the job states, such as the expected return from various functions. It is suggested these are indexed by the function name.

    */

    const validJobs = [
        {
            job_id: 'job-created',
            status: 'created',
            created: t.created,
            updated: t.created,
            meta: {
                canCancel: true,
                canRetry: true,
                createJobStatusLines: {
                    line: jobStrings.queued,
                    history: [jobStrings.queued],
                },
                jobAction: jobStrings.action.cancel,
                jobLabel: 'queued',
                niceState: {
                    class: 'kb-job-status__summary',
                    label: 'created',
                },
                terminal: false,
                appCellFsm: { mode: 'processing', stage: 'queued' },
            },
        },
        {
            job_id: 'job-estimating',
            status: 'estimating',
            created: t.created,
            updated: t.created,
            meta: {
                canCancel: true,
                canRetry: true,
                createJobStatusLines: {
                    line: jobStrings.queued,
                    history: [jobStrings.queued],
                },
                jobAction: jobStrings.action.cancel,
                jobLabel: 'queued',
                niceState: {
                    class: 'kb-job-status__summary',
                    label: 'estimating',
                },
                terminal: false,
                appCellFsm: { mode: 'processing', stage: 'queued' },
            },
        },
        {
            job_id: 'job-in-the-queue',
            status: 'queued',
            created: t.created,
            queued: t.queued,
            updated: 12345678910,
            meta: {
                canCancel: true,
                canRetry: true,
                createJobStatusLines: {
                    line: jobStrings.queued,
                    history: [jobStrings.queued],
                },
                jobAction: jobStrings.action.cancel,
                jobLabel: 'queued',
                niceState: {
                    class: 'kb-job-status__summary',
                    label: 'queued',
                },
                terminal: false,
                appCellFsm: { mode: 'processing', stage: 'queued' },
            },
        },
        {
            job_id: 'job-cancelled-whilst-in-the-queue',
            status: 'terminated',
            created: t.created,
            finished: t.finished,
            queued: t.queued,
            updated: 12345678910,
            meta: {
                canCancel: false,
                canRetry: true,
                createJobStatusLines: {
                    line: jobStrings.termination,
                    history: [jobStrings.queueHistoryNoRun, jobStrings.termination],
                },
                jobAction: jobStrings.action.retry,
                jobLabel: 'cancelled',
                niceState: {
                    class: 'kb-job-status__summary--terminated',
                    label: 'cancellation',
                },
                terminal: true,
                appCellFsm: { mode: 'canceled' },
            },
        },
        {
            job_id: 'job-running',
            status: 'running',
            created: t.created,
            queued: t.queued,
            running: t.running,
            updated: 12345678910,
            meta: {
                canCancel: true,
                canRetry: true,
                createJobStatusLines: {
                    line: jobStrings.running,
                    history: [jobStrings.queueHistory, jobStrings.running],
                },
                jobAction: jobStrings.action.cancel,
                jobLabel: 'running',
                niceState: {
                    class: 'kb-job-status__summary',
                    label: 'running',
                },
                terminal: false,
                appCellFsm: { mode: 'processing', stage: 'running' },
            },
        },
        {
            job_id: 'job-cancelled-during-run',
            status: 'terminated',
            created: t.created,
            finished: t.finished,
            queued: t.queued,
            running: t.running,
            updated: 12345678910,
            meta: {
                canCancel: false,
                canRetry: true,
                createJobStatusLines: {
                    line: jobStrings.termination,
                    history: [
                        jobStrings.queueHistory,
                        jobStrings.runHistory,
                        jobStrings.termination,
                    ],
                },
                jobAction: jobStrings.action.retry,
                jobLabel: 'cancelled',
                niceState: {
                    class: 'kb-job-status__summary--terminated',
                    label: 'cancellation',
                },
                terminal: true,
                appCellFsm: { mode: 'canceled' },
            },
        },
        {
            job_id: 'job-died-whilst-queueing',
            status: 'error',
            error: {
                code: 666,
                name: 'Queue error',
                message: 'Job died in the queue',
            },
            error_code: 1,
            errormsg: 'Job did not know how to queue!',
            created: t.created,
            queued: t.queued,
            finished: t.finished,
            updated: 12345678910,
            meta: {
                canCancel: false,
                canRetry: true,
                createJobStatusLines: {
                    line: jobStrings.error,
                    history: [jobStrings.queueHistoryNoRun, jobStrings.error],
                },
                jobAction: jobStrings.action.retry,
                jobLabelIncludeError: 'failed: Queue error',
                jobLabel: 'failed',
                niceState: {
                    class: 'kb-job-status__summary--error',
                    label: 'error',
                },
                terminal: true,
                errorString: 'Queue error: Error code: 666',
                appCellFsm: { mode: 'error', stage: 'queued' },
            },
        },
        {
            job_id: 'job-died-with-error',
            status: 'error',
            error: {
                code: -32000,
                name: 'Server error',
                message: 'App woke up from its nap very cranky!',
            },
            error_code: 1,
            errormsg: 'Job output contains an error',
            created: t.created,
            finished: t.finished,
            queued: t.queued,
            running: t.running,
            updated: 12345678910,
            meta: {
                canCancel: false,
                canRetry: true,
                createJobStatusLines: {
                    line: jobStrings.error,
                    history: [jobStrings.queueHistory, jobStrings.runHistory, jobStrings.error],
                },
                jobAction: jobStrings.action.retry,
                jobLabelIncludeError: 'failed: Server error',
                jobLabel: 'failed',
                niceState: {
                    class: 'kb-job-status__summary--error',
                    label: 'error',
                },
                terminal: true,
                errorString: 'Server error: Error code: -32000',
                appCellFsm: { mode: 'error', stage: 'running' },
            },
        },
        {
            job_id: 'job-finished-with-success',
            status: 'completed',
            created: t.created,
            finished: t.finished,
            queued: t.queued,
            running: t.running,
            updated: 12345678910,
            meta: {
                canCancel: false,
                canRetry: false,
                createJobStatusLines: {
                    line: jobStrings.success,
                    history: [jobStrings.queueHistory, jobStrings.runHistory, jobStrings.success],
                },
                jobAction: jobStrings.action.results,
                jobLabel: 'success',
                niceState: {
                    class: 'kb-job-status__summary--completed',
                    label: 'success',
                },
                terminal: true,
                appCellFsm: { mode: 'success' },
            },
            job_output: {
                result: [
                    {
                        report_name: 'kb_megahit_report_33c8f76d-0aaa-4b27-a0f9-4569b69fef3e',
                        report_ref: '57373/16/1',
                    },
                ],
            },
        },
    ];

    const unknownJob = {
        job_id: 'unknown-job',
        status: 'does_not_exist',
        other: 'key',
        another: 'key',
        meta: {
            canCancel: false,
            canRetry: false,
            createJobStatusLines: {
                line: jobStrings.not_found,
                history: [jobStrings.not_found],
            },
            jobAction: null,
            jobLabel: 'not found',
            niceState: {
                class: 'kb-job-status__summary--does_not_exist',
                label: 'does not exist',
            },
            terminal: true,
        },
    };

    const ee2ErrorJob = {
        job_id: 'ee2-error',
        status: 'ee2_error',
        created: t.created,
        queued: t.queued,
        running: t.running,
        updated: 12345678910,
        meta: {
            canCancel: false,
            canRetry: false,
            createJobStatusLines: {
                line: jobStrings.conn_error,
                history: [jobStrings.queueHistory, jobStrings.conn_error],
            },
            jobAction: null,
            jobLabel: 'connection error',
            niceState: {
                class: 'kb-job-status__summary--ee2_error',
                label: 'connection error',
            },
            terminal: false,
        },
    };

    const batchParentJob = {
        job_id: 'batch-parent-job',
        batch_id: 'batch-parent-job',
        batch_job: true,
        child_jobs: ['unknown-job'].concat(
            validJobs.map((job) => {
                return job.job_id;
            })
        ),
        created: t.created,
        meta: {
            canCancel: true,
            canRetry: false,
            jobAction: jobStrings.action.cancel,
            terminal: false,
            // may want to reinstate these in the future
            // createJobStatusLines: {
            //     line: null,
            //     history: null,
            // },
            // jobLabel: null,
            // niceState: null,
        },
        status: 'created',
        updated: t.finished,
    };

    // add in the retryTarget
    validJobs.forEach((job) => {
        if (job.meta.canRetry) {
            job.meta.retryTarget = job.job_id;
        }
        job.batch_id = 'batch-parent-job';
        job.batch_job = false;
    });

    const allJobs = JSON.parse(JSON.stringify([...validJobs, unknownJob]));
    const allJobsWithBatchParent = JSON.parse(JSON.stringify([batchParentJob].concat(allJobs)));

    function generateMissingKeys(dataStructure) {
        return Object.keys(dataStructure).map((key) => {
            const newStructure = TestUtil.JSONcopy(dataStructure);
            delete newStructure[key];
        });
    }

    const invalidTypes = [null, undefined, 1, 'foo', [], ['a', 'list'], {}];

    const validJobStates = allJobsWithBatchParent.concat([
        ee2ErrorJob,
        {
            job_id: 'zero_created',
            created: 0,
            status: 'created',
        },
        {
            job_id: 'does_not_exist',
            status: 'does_not_exist',
        },
        {
            job_id: 'ee2_error',
            status: 'ee2_error',
        },
    ]);

    const invalidJobStates = [
        ...invalidTypes,
        {
            job_id: 'somejob',
            other: 'key',
        },
        {
            created: 'at_some_point',
            other: 'key',
        },
        {
            job_id: 'baz',
            create: 12345,
        },
        {
            job_id: 'whatever',
            status: 'running',
        },
        {
            job_id: 'invalid job status',
            created: 12345678,
            status: 'who cares?',
        },
    ];

    const validBackendJobStates = [
        {
            jobState: validJobStates[0],
        },
        {
            jobState: validJobStates[1],
            outputWidgetInfo: {},
        },
        {
            jobState: validJobStates[2],
            outputWidgetInfo: {
                ping: 'pong',
            },
        },
    ];

    const invalidBackendJobStates = [
        ...invalidJobStates,
        ...invalidJobStates.map((item) => {
            return { jobState: item };
        }),
    ];

    const validInfo = [
        {
            job_params: [{ this: 'that' }],
            job_id: 'job_with_single_param',
            app_id: 'NarrativeTest/app_sleep',
            app_name: 'App Sleep',
            batch_id: 'batch-parent-job',
        },
        {
            job_params: [{ tag_two: 'value two', tag_three: 'value three' }],
            job_id: 'job_with_multiple_params',
            batch_id: 'batch-parent-job',
            app_name: 'some app',
            app_id: 'some/app',
        },
        {
            job_id: 'batch-parent-job',
            batch_id: 'batch-parent-job',
            app_name: 'batch',
            app_id: 'batch',
            job_params: [],
        },
    ];

    const invalidInfo = [
        ...invalidTypes,
        ...generateMissingKeys(validInfo[0]),
        { job_params: [] },
        { job_params: [{ ping: 'pong' }] },
        {
            job_id: TEST_JOB_ID,
            batch_id: 'batch-parent-job',
            app_name: 'some app',
            app_id: 'some/app',
            params: [{ hello: 'world' }],
        },
        {
            job_id: TEST_JOB_ID,
            batch_id: 'batch-parent-job',
            app_name: 'some app',
            app_id: 'some/app',
            job_params: {},
        },
        {
            job_id: TEST_JOB_ID,
            batch_id: 'batch-parent-job',
            app_name: 'some app',
            app_id: 'some/app',
            job_params: ['hello world'],
        },
        {
            job_id: TEST_JOB_ID,
            batch_id: 'batch-parent-job',
            app_name: 'some app',
            app_id: 'some/app',
            job_params: [['hello world']],
        },
        {
            job_id: TEST_JOB_ID,
            batch_id: 'batch-parent-job',
            app_name: 'some app',
            app_id: 'some/app',
            job_params: [{}],
        },
    ];

    const validLogs = [
        {
            job_id: TEST_JOB_ID,
            batch_id: 'batch_parent_job',
            first: 0,
            latest: false,
            max_lines: 0,
            lines: [],
        },
        {
            job_id: TEST_JOB_ID,
            batch_id: 'batch_parent_job',
            first: 500,
            latest: true,
            max_lines: 500,
            lines: [],
        },
    ];

    const invalidLogs = [
        ...invalidTypes,
        ...generateMissingKeys(validLogs[0]),
        {
            job_id: TEST_JOB_ID,
            batch_id: 'batch_parent_job',
            first: 500,
            latest: true,
            max_lines: 500,
            lines: {},
        },
    ];

    const validRetry = [
        { job: { jobState: validJobStates[0] }, retry: { jobState: validJobStates[1] } },
        { job: { jobState: validJobStates[2] }, error: 'some error' },
    ];
    const invalidRetry = [
        ...invalidTypes,
        // no jobState
        { job: validJobStates[3], retry: validJobStates[4] },
        // no jobState for the retry
        { job: { jobState: validJobStates[5] }, retry: validJobStates[6] },
        { job: { jobState: validJobStates[7] } },
    ];

    const jobsByStatus = [ee2ErrorJob].concat(allJobs).reduce((acc, curr) => {
        if (!acc[curr.status]) {
            acc[curr.status] = [];
        }
        acc[curr.status].push(curr);
        return acc;
    }, {});

    const jobsById = allJobs.reduce((acc, curr) => {
        acc[curr.job_id] = curr;
        return acc;
    }, {});

    /**
     * Increment all timestamps in an object by ${time} seconds
     *
     * @param Object jobState
     * @param int time -- how much to increment any timestamps by
     */
    function passTime(jobState, time) {
        ['created', 'finished', 'queued', 'running', 'updated'].forEach((timePoint) => {
            if (jobState[timePoint]) {
                jobState[timePoint] += time;
            }
        });
    }

    // convert a job into one that can be (has been) retried
    function convertToRetryParent(jobState, retryArray = []) {
        jobState.meta.originalJob = true;
        addRetries(jobState, retryArray);
    }

    // convert a job into one that is a retry of ${retryParentId}
    function convertToRetry(jobState, retryParentId) {
        jobState.meta.retryTarget = retryParentId;
        jobState.retry_parent = retryParentId;
        addRetries(jobState, []);
    }

    function addRetries(jobState, retryArray = []) {
        jobState.retry_ids = retryArray;
        jobState.retry_count = retryArray.length;
    }
    /**
     * output of createBatchJob:
     *
     * batch parent: 'job-created'
     *
     * initial children:
     * 'job-cancelled-whilst-in-the-queue'
     * 'job-cancelled-during-run'
     * 'job-died-whilst-queueing'
     * 'job-in-the-queue' --> can cancel, can retry
     *
     * job retries:
     * 'job-cancelled-whilst-in-the-queue'
     *  - retry 1: 'job-running' --> can cancel, can retry
     *
     * 'job-cancelled-during-run'
     *  - retry 1: 'job-finished-with-success' --> cannot cancel or retry
     *
     * 'job-died-whilst-queueing'
     *  - retry 1: 'job-died-with-error'
     *  - retry 2: 'job-estimating' (most recent retry) --> can cancel, can retry
     *
     * Extra metadata for batch jobs:
     * meta.currentJob: true/false -- this is the most recent job (including retries)
     * meta.originalJob: true/false -- this is one of the original jobs in the batch
     */

    function createBatchJob() {
        const BATCH_ID = 'job-created';
        const jobsWithRetries = JSON.parse(JSON.stringify(validJobs));
        const jobIdIndex = {};
        let thisJob, parentJob;
        jobsWithRetries.forEach((job) => {
            job.batch_id = BATCH_ID;
            job.batch_job = false;
            jobIdIndex[job.job_id] = job;
        });

        // batch parent
        jobIdIndex[BATCH_ID].batch_job = true;
        jobIdIndex[BATCH_ID].child_jobs = Object.keys(jobIdIndex).filter(
            (job_id) => job_id !== BATCH_ID
        );
        jobIdIndex[BATCH_ID].meta.canRetry = false;
        delete jobIdIndex[BATCH_ID].meta.retryTarget;

        // no retries of 'job-in-the-queue'
        parentJob = 'job-in-the-queue';
        convertToRetryParent(jobIdIndex[parentJob]);
        jobIdIndex[parentJob].meta.currentJob = true;

        // these jobs have been retried

        // retries of 'job-cancelled-whilst-in-the-queue'
        parentJob = 'job-cancelled-whilst-in-the-queue';
        convertToRetryParent(jobIdIndex[parentJob], ['job-running']);

        thisJob = 'job-running';
        convertToRetry(jobIdIndex[thisJob], parentJob);
        jobIdIndex[thisJob].meta.currentJob = true;
        passTime(jobIdIndex[thisJob], 15);

        // retries of 'job-cancelled-during-run'
        parentJob = 'job-cancelled-during-run';
        convertToRetryParent(jobIdIndex[parentJob], ['job-cancelled-during-run']);

        thisJob = 'job-finished-with-success';
        convertToRetry(jobIdIndex[thisJob], parentJob);
        jobIdIndex[thisJob].meta.currentJob = true;
        passTime(jobIdIndex[thisJob], 20);

        // two retries of 'job-died-whilst-queueing'
        parentJob = 'job-died-whilst-queueing';
        convertToRetryParent(jobIdIndex[parentJob], ['job-died-with-error', 'job-estimating']);

        thisJob = 'job-died-with-error';
        convertToRetry(jobIdIndex[thisJob], parentJob);
        passTime(jobIdIndex[thisJob], 5);

        thisJob = 'job-estimating';
        convertToRetry(jobIdIndex[thisJob], parentJob);
        jobIdIndex[thisJob].meta.currentJob = true;
        passTime(jobIdIndex[thisJob], 10);

        return {
            jobArray: Object.values(jobIdIndex),
            jobsById: jobIdIndex,
            jobsWithRetries: [
                'job-cancelled-whilst-in-the-queue',
                'job-cancelled-during-run',
                'job-died-whilst-queueing',
            ],
            originalJobs: [
                'job-in-the-queue',
                'job-cancelled-whilst-in-the-queue',
                'job-cancelled-during-run',
                'job-died-whilst-queueing',
            ].reduce((acc, jobId) => {
                acc[jobId] = jobIdIndex[jobId];
                return acc;
            }, {}),
            currentJobs: [
                'job-in-the-queue',
                'job-running',
                'job-finished-with-success',
                'job-estimating',
            ].reduce((acc, jobId) => {
                acc[jobId] = jobIdIndex[jobId];
                return acc;
            }, {}),
            batchId: BATCH_ID,
            expectedButtonState: [
                ['.dropdown [data-action="cancel"]', false],
                ['.dropdown [data-action="retry"]', true],
            ],
        };
    }

    return {
        validJobs,
        unknownJob,
        ee2ErrorJob,
        batchParentJob,
        allJobs,
        allJobsWithBatchParent,
        batchJob: createBatchJob(),
        jobsByStatus,
        jobsById,
        jobStrings,
        example: {
            BackendJobState: {
                valid: validBackendJobStates,
                invalid: invalidBackendJobStates,
            },
            Info: {
                valid: validInfo,
                invalid: invalidInfo,
            },
            JobState: {
                valid: validJobStates,
                invalid: invalidJobStates,
            },
            Logs: {
                valid: validLogs,
                invalid: invalidLogs,
            },
            Retry: {
                valid: validRetry,
                invalid: invalidRetry,
            },
        },
        validJobStates,
        invalidJobStates,
        validInfo,
        invalidInfo,
        validRetry,
        invalidRetry,
        validLogs,
        invalidLogs,
    };
});
