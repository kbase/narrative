define([
    'common/format',
    'common/jobCommMessages',
    '/narrative/nbextensions/appCell2/widgets/appCellWidget-fsm',
    'testUtil',
    'json!/src/biokbase/narrative/tests/data/response_data.json',
], (format, jcm, AppStates, TestUtil, ResponseData) => {
    'use strict';
    const t = {
        created: 1610065000000,
        queued: 1610065200000,
        running: 1610065500000,
        finished: 1610065800000,
    };

    const fsmStates = AppStates.STATE;

    const TEST_JOB_ID = 'someJob',
        SOME_VALUE = 'some unimportant value',
        BATCH_ID = 'BATCH_PARENT';

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

    const JOB = {
        CREATED: 'JOB_CREATED',
        ESTIMATING: 'JOB_ESTIMATING',
        QUEUED: 'JOB_QUEUED',
        TERMINATED_WHILST_QUEUED: 'JOB_TERMINATED_WHILST_QUEUED',
        DIED_WHILST_QUEUED: 'JOB_DIED_WHILST_QUEUED',
        RUNNING: 'JOB_RUNNING',
        TERMINATED_WHILST_RUNNING: 'JOB_TERMINATED_WHILST_RUNNING',
        DIED_WHILST_RUNNING: 'JOB_DIED_WHILST_RUNNING',
        COMPLETED: 'JOB_COMPLETED',
        UNKNOWN: 'JOB_UNKNOWN',
        BATCH_PARENT: BATCH_ID,
    };

    /*
        The following are valid job state objects as would be received from ee2.

        The `meta` key can be used to store test-related data about the job states, such as the expected return from various functions. It is suggested these are indexed by the function name.

    */

    const validJobs = [
        {
            job_id: JOB.CREATED,
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
                appCellFsm: fsmStates.PROCESSING_QUEUED,
            },
        },
        {
            job_id: JOB.ESTIMATING,
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
                appCellFsm: fsmStates.PROCESSING_QUEUED,
            },
        },
        {
            job_id: JOB.QUEUED,
            status: 'queued',
            created: t.created,
            queued: t.queued,
            updated: t.queued,
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
                appCellFsm: fsmStates.PROCESSING_QUEUED,
            },
        },
        {
            job_id: JOB.TERMINATED_WHILST_QUEUED,
            status: 'terminated',
            created: t.created,
            finished: t.finished,
            queued: t.queued,
            updated: t.finished,
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
                appCellFsm: fsmStates.TERMINATED,
            },
        },
        {
            job_id: JOB.DIED_WHILST_QUEUED,
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
            updated: t.finished,
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
                appCellFsm: fsmStates.RUNTIME_ERROR,
            },
        },
        {
            job_id: JOB.RUNNING,
            status: 'running',
            created: t.created,
            queued: t.queued,
            running: t.running,
            updated: t.running,
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
                appCellFsm: fsmStates.PROCESSING_RUNNING,
            },
        },
        {
            job_id: JOB.TERMINATED_WHILST_RUNNING,
            status: 'terminated',
            created: t.created,
            finished: t.finished,
            queued: t.queued,
            running: t.running,
            updated: t.finished,
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
                appCellFsm: fsmStates.TERMINATED,
            },
        },
        {
            job_id: JOB.DIED_WHILST_RUNNING,
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
            updated: t.finished,
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
                appCellFsm: fsmStates.RUNTIME_ERROR,
            },
        },
        {
            job_id: JOB.COMPLETED,
            status: 'completed',
            created: t.created,
            finished: t.finished,
            queued: t.queued,
            running: t.running,
            updated: t.finished,
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
                appCellFsm: fsmStates.COMPLETED,
            },
            job_output: {
                id: 'JOB_COMPLETED',
                result: [
                    {
                        report_name: 'kb_megahit_report_33c8f76d-0aaa-4b27-a0f9-4569b69fef3e',
                        report_ref: '57373/16/1',
                    },
                ],
                version: '1.1',
            },
        },
    ];

    const unknownJob = {
        job_id: JOB.UNKNOWN,
        status: 'does_not_exist',
        other: 'key',
        another: 'key',
        meta: {
            canCancel: false,
            canRetry: false,
            createJobStatusLines: {
                summary: 'Job not found',
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
            appCellFsm: fsmStates.RUNTIME_ERROR,
        },
    };

    const batchParentJob = {
        job_id: BATCH_ID,
        batch_id: BATCH_ID,
        batch_job: true,
        child_jobs: [unknownJob.job_id].concat(
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
        job.batch_id = BATCH_ID;
        job.batch_job = false;
    });

    const allJobs = JSON.parse(JSON.stringify([...validJobs, unknownJob]));
    const allJobsWithBatchParent = JSON.parse(JSON.stringify([batchParentJob].concat(allJobs)));

    function generateMissingKeys(dataStructure) {
        return Object.keys(dataStructure).map((key) => {
            const newStructure = TestUtil.JSONcopy(dataStructure);
            delete newStructure[key];
            return newStructure;
        });
    }

    const invalidTypes = [null, undefined, 1, 'foo', [], ['a', 'list'], {}];

    const validJobStates = allJobsWithBatchParent.concat([
        {
            job_id: 'zero_created',
            created: 0,
            status: 'created',
        },
        {
            job_id: 'does_not_exist',
            status: 'does_not_exist',
        },
    ]);

    const invalidJobStates = [
        ...invalidTypes,
        {
            job_id: TEST_JOB_ID,
            other: 'key',
        },
        {
            created: 'at_some_point',
            other: 'key',
        },
        {
            job_id: TEST_JOB_ID,
            create: 12345,
        },
        {
            job_id: TEST_JOB_ID,
            status: 'running',
        },
        {
            job_id: TEST_JOB_ID,
            created: 12345678,
            status: 'who cares?',
        },
    ];

    const validBackendJobStates = Object.values(ResponseData[jcm.MESSAGE_TYPE.STATUS]);

    const invalidBackendJobStates = [
        ...invalidJobStates,
        ...invalidJobStates.map((item) => {
            return { jobState: item };
        }),
        {
            jobState: validJobStates[0],
        },
        {
            jobState: validJobStates[1],
            outputWidgetInfo: null,
        },
    ];

    const validInfo = Object.values(ResponseData[jcm.MESSAGE_TYPE.INFO]);

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
            job_params: 12345,
        },
    ];

    const validLogs = Object.values(ResponseData[jcm.MESSAGE_TYPE.LOGS]);

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

    const validRetry = Object.values(ResponseData[jcm.MESSAGE_TYPE.RETRY]);

    const invalidRetry = [
        ...invalidTypes,
        // no jobState
        { job: validJobStates[3], retry: validJobStates[4] },
        // no jobState for the retry
        { job: { jobState: validJobStates[5] }, retry: validJobStates[6] },
        { job: { jobState: validJobStates[7] } },
    ];

    const runStatusCore = { event_at: SOME_VALUE, cell_id: SOME_VALUE, run_id: SOME_VALUE };
    const extraKeys = {
        error: ['code', 'message', 'source', 'stacktrace', 'type'].map((key) => {
            return `error_${key}`;
        }),
        launched_job: ['cell_id', 'run_id', 'job_id'],
        launched_job_batch: ['cell_id', 'run_id', 'batch_id', 'child_job_ids'],
        success: ['cell_id', 'run_id'],
    };

    const runStatusMessages = {
        success: { ...runStatusCore, event: 'success' },
        launched_job: {
            ...runStatusCore,
            event: 'launched_job',
            job_id: SOME_VALUE,
        },
        launched_job_batch: {
            ...runStatusCore,
            event: 'launched_job_batch',
            batch_id: SOME_VALUE,
            child_job_ids: [SOME_VALUE],
        },
        error: {
            ...runStatusCore,
            event: 'error',
            error_code: SOME_VALUE,
            error_message: SOME_VALUE,
            error_source: SOME_VALUE,
            error_stacktrace: SOME_VALUE,
            error_type: SOME_VALUE,
        },
    };
    const validRunStatus = Object.values(runStatusMessages);
    const invalidRunStatus = [
        ...invalidTypes,
        // no event
        { job_id: TEST_JOB_ID },
        // invalid event
        { event: '', event_at: 'string' },
        { event: 'launch_job', ...runStatusCore, job_id: SOME_VALUE },
    ];

    // add invalid run status messages with one key missing
    for (const eventType in extraKeys) {
        for (const key of extraKeys[eventType]) {
            const dupe = TestUtil.JSONcopy(runStatusMessages[eventType]);
            delete dupe[key];
            invalidRunStatus.push(dupe);
        }
    }

    const jobsByStatus = allJobs.reduce((acc, curr) => {
        if (!acc[curr.status]) {
            acc[curr.status] = [];
        }
        acc[curr.status].push(curr);
        return acc;
    }, {});

    const jobsById = allJobsWithBatchParent.reduce((acc, curr) => {
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
     * batch parent:
     *
     * initial children:
     * JOB.CREATED  --> can cancel, can retry
     * JOB.QUEUED   --> can cancel, can retry
     * JOB.DIED_WHILST_QUEUED
     * JOB.TERMINATED_WHILST_QUEUED
     * JOB.TERMINATED_WHILST_RUNNING
     *
     * job retries:
     * JOB.TERMINATED_WHILST_QUEUED
     *  - retry 1: JOB.RUNNING --> can cancel, can retry
     *
     * JOB.TERMINATED_WHILST_RUNNING
     *  - retry 1: JOB.COMPLETED --> cannot cancel or retry
     *
     * JOB.DIED_WHILST_QUEUED
     *  - retry 1: JOB.DIED_WHILST_RUNNING
     *  - retry 2: JOB.ESTIMATING (most recent retry) --> can cancel, can retry
     *
     * Extra metadata for batch jobs:
     * meta.currentJob: true/false -- this is the most recent job (including retries)
     * meta.originalJob: true/false -- this is one of the original jobs in the batch
     */

    function createBatchJob() {
        const jobsWithRetries = TestUtil.JSONcopy(validJobs);
        const jobIdIndex = {};

        let thisJob, parentJob;
        jobsWithRetries.forEach((job) => {
            job.batch_id = BATCH_ID;
            job.batch_job = false;
            jobIdIndex[job.job_id] = job;
        });

        // batch parent
        const batchParent = TestUtil.JSONcopy(batchParentJob);
        batchParent.child_jobs = validJobs.map((job) => {
            return job.job_id;
        });
        // add the batchParent under the index BATCH_ID and delete the old key
        jobIdIndex[BATCH_ID] = batchParent;

        // no retries of JOB.QUEUED or JOB.CREATED
        [JOB.QUEUED, JOB.CREATED].forEach((jobId) => {
            convertToRetryParent(jobIdIndex[jobId]);
            jobIdIndex[jobId].meta.currentJob = true;
        });

        // these jobs have been retried

        // retries of JOB.TERMINATED_WHILST_QUEUED
        parentJob = JOB.TERMINATED_WHILST_QUEUED;
        convertToRetryParent(jobIdIndex[parentJob], [JOB.RUNNING]);

        thisJob = JOB.RUNNING;
        convertToRetry(jobIdIndex[thisJob], parentJob);
        jobIdIndex[thisJob].meta.currentJob = true;
        passTime(jobIdIndex[thisJob], 15);

        // retries of JOB.TERMINATED_WHILST_RUNNING
        parentJob = JOB.TERMINATED_WHILST_RUNNING;
        convertToRetryParent(jobIdIndex[parentJob], [JOB.TERMINATED_WHILST_RUNNING]);

        thisJob = JOB.COMPLETED;
        convertToRetry(jobIdIndex[thisJob], parentJob);
        jobIdIndex[thisJob].meta.currentJob = true;
        passTime(jobIdIndex[thisJob], 20);

        // two retries of JOB.DIED_WHILST_QUEUED
        parentJob = JOB.DIED_WHILST_QUEUED;
        convertToRetryParent(jobIdIndex[parentJob], [JOB.DIED_WHILST_RUNNING, JOB.ESTIMATING]);

        thisJob = JOB.DIED_WHILST_RUNNING;
        convertToRetry(jobIdIndex[thisJob], parentJob);
        passTime(jobIdIndex[thisJob], 5);

        thisJob = JOB.ESTIMATING;
        convertToRetry(jobIdIndex[thisJob], parentJob);
        jobIdIndex[thisJob].meta.currentJob = true;
        passTime(jobIdIndex[thisJob], 10);

        const originalJobIds = [
                JOB.CREATED,
                JOB.QUEUED,
                JOB.TERMINATED_WHILST_QUEUED,
                JOB.TERMINATED_WHILST_RUNNING,
                JOB.DIED_WHILST_QUEUED,
            ],
            currentJobIds = [JOB.CREATED, JOB.QUEUED, JOB.RUNNING, JOB.COMPLETED, JOB.ESTIMATING];

        // the original jobs prior to any updates
        const originalJobsNoRetryData = {
            [BATCH_ID]: TestUtil.JSONcopy(batchParentJob),
        };
        // update the child jobs
        originalJobsNoRetryData[BATCH_ID].child_jobs = originalJobIds;

        // original jobs
        const originalJobs = originalJobIds.reduce((acc, jobId) => {
                originalJobsNoRetryData[jobId] = TestUtil.JSONcopy(jobsById[jobId]);
                acc[jobId] = jobIdIndex[jobId];
                return acc;
            }, {}),
            // current jobs, minus batch parent
            currentJobs = currentJobIds.reduce((acc, jobId) => {
                acc[jobId] = jobIdIndex[jobId];
                return acc;
            }, {});

        function generateStatusMessage(childJobIds) {
            const jobStates = {
                [BATCH_ID]: {
                    [jcm.PARAM.JOB_ID]: BATCH_ID,
                    jobState: TestUtil.JSONcopy(batchParent),
                },
            };
            // replace the existing child_jobs with the current array
            jobStates[BATCH_ID].jobState.child_jobs = TestUtil.JSONcopy(childJobIds);
            // add job states for the child jobs
            childJobIds.forEach((jobId) => {
                jobStates[jobId] = {
                    [jcm.PARAM.JOB_ID]: jobId,
                    jobState: jobIdIndex[jobId],
                };
            });
            return {
                type: jcm.MESSAGE_TYPE.STATUS,
                msg: jobStates,
                allJobIds: [BATCH_ID].concat(TestUtil.JSONcopy(childJobIds)),
            };
        }

        function generateRetryMessage(retryList, childJobIds) {
            const msg = {};
            retryList.forEach((item) => {
                const { retry, retryParent } = item;
                childJobIds.push(retry);
                msg[retryParent] = {
                    [jcm.PARAM.JOB_ID]: retryParent,
                    job: {
                        [jcm.PARAM.JOB_ID]: retryParent,
                        jobState: jobIdIndex[retryParent],
                    },
                    retry_id: retry,
                    retry: {
                        [jcm.PARAM.JOB_ID]: retry,
                        jobState: jobIdIndex[retry],
                    },
                };
            });
            return {
                type: jcm.MESSAGE_TYPE.RETRY,
                msg,
                allJobIds: [BATCH_ID].concat(TestUtil.JSONcopy(childJobIds)),
            };
        }

        function generateUpdateSeries() {
            // this maintains an array containing all the child IDs
            const childJobIds = [...originalJobIds];

            // create a series of job messages that mimic running a batch job and
            // retrying some of the jobs in the batch
            const jobUpdateSeries = [
                // start with run status for the original jobs
                {
                    type: jcm.MESSAGE_TYPE.RUN_STATUS,
                    msg: {
                        ...runStatusCore,
                        event: 'launched_job_batch',
                        batch_id: BATCH_ID,
                        child_job_ids: TestUtil.JSONcopy(childJobIds),
                    },
                    allJobIds: [BATCH_ID].concat(TestUtil.JSONcopy(childJobIds)),
                },
            ];

            // status update for the current jobs
            jobUpdateSeries.push(generateStatusMessage(childJobIds));

            // retry of 'JOB_CANCELLED-WHILST-IN-THE-QUEUE'
            let retry = JOB.RUNNING,
                retryParent = JOB.TERMINATED_WHILST_QUEUED;
            jobUpdateSeries.push(generateRetryMessage([{ retry, retryParent }], childJobIds));

            // status message
            jobUpdateSeries.push(generateStatusMessage(childJobIds));

            // retry 1 of JOB.DIED_WHILST_QUEUED
            retry = JOB.DIED_WHILST_RUNNING;
            retryParent = JOB.DIED_WHILST_QUEUED;
            jobUpdateSeries.push(generateRetryMessage([{ retry, retryParent }], childJobIds));

            // status message
            jobUpdateSeries.push(generateStatusMessage(childJobIds));

            // two retries at once
            // retry of JOB.TERMINATED_WHILST_RUNNING
            // retry 2 of JOB.DIED_WHILST_QUEUED
            jobUpdateSeries.push(
                generateRetryMessage(
                    [
                        {
                            retry: JOB.COMPLETED,
                            retryParent: JOB.TERMINATED_WHILST_RUNNING,
                        },
                        { retry: JOB.ESTIMATING, retryParent: JOB.DIED_WHILST_QUEUED },
                    ],
                    childJobIds
                )
            );

            // status message
            jobUpdateSeries.push(generateStatusMessage(childJobIds));

            // status message
            jobUpdateSeries.push(generateStatusMessage(childJobIds));

            return jobUpdateSeries;
        }

        const retryMessages = generateRetryMessage(
            [
                {
                    retry: JOB.RUNNING,
                    retryParent: JOB.TERMINATED_WHILST_QUEUED,
                },
                {
                    retry: JOB.COMPLETED,
                    retryParent: JOB.TERMINATED_WHILST_RUNNING,
                },
                {
                    retry: JOB.ESTIMATING,
                    retryParent: JOB.DIED_WHILST_QUEUED,
                },
            ],
            []
        );

        return {
            jobArray: Object.values(jobIdIndex),
            jobsById: jobIdIndex,
            jobsWithRetries: [
                JOB.TERMINATED_WHILST_QUEUED,
                JOB.TERMINATED_WHILST_RUNNING,
                JOB.DIED_WHILST_QUEUED,
            ],
            originalJobIds,
            currentJobIds,
            originalJobs,
            currentJobs,
            originalJobsNoRetryData,
            jobUpdateSeries: generateUpdateSeries(),
            retryMessages: retryMessages.msg,
            batchId: BATCH_ID,
            expectedButtonState: [
                ['.dropdown [data-action="cancel"]', false],
                ['.dropdown [data-action="retry"]', true],
            ],
        };
    }

    const example = {
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
        RunStatus: {
            valid: validRunStatus,
            invalid: invalidRunStatus,
        },
    };

    example.STATUS = example.BackendJobState;
    example.INFO = example.Info;
    example.RETRY = example.Retry;
    example.LOGS = example.Logs;
    example.RUN_STATUS = example.RunStatus;

    function makeJobProgression() {
        return [
            {
                ...jobsById[JOB.CREATED],
                job_id: JOB.CREATED,
            },
            {
                ...jobsById[JOB.ESTIMATING],
                job_id: JOB.CREATED,
            },
            {
                ...jobsById[JOB.QUEUED],
                job_id: JOB.CREATED,
            },
            {
                ...jobsById[JOB.RUNNING],
                job_id: JOB.CREATED,
            },
            {
                ...jobsById[JOB.COMPLETED],
                job_id: JOB.CREATED,
            },
        ];
    }

    return {
        TEST_JOB_ID,
        JOB_NAMES: JOB,
        validJobs,
        unknownJob,
        batchParentJob,
        allJobs,
        allJobsWithBatchParent,
        batchJob: createBatchJob(),
        jobsByStatus,
        jobsById,
        jobStrings,
        jobProgression: makeJobProgression(),
        example,
    };
});
