define(['common/errorDisplay', 'common/format', 'common/html', 'common/ui', 'util/util'], (
    ErrorDisplay,
    Format,
    html,
    UI,
    Utils
) => {
    'use strict';

    const t = html.tag,
        span = t('span');

    const JOB_STATUSES = [
            'created',
            'estimating',
            'queued',
            'running',
            'completed',
            'error',
            'terminated',
            'does_not_exist',
        ],
        JOB = {};
    // JOB is an object with keys job status and values the string for that status
    JOB_STATUSES.forEach((status) => {
        JOB[status] = status;
    });

    const cssBaseClass = 'kb-job-status',
        jobNotFound = [
            'This job was not found, or may not have been registered with this narrative.',
            'You will not be able to inspect the job status or view the job log.',
        ],
        jobStatusUnknown = ['Awaiting job data...'],
        validJobStatuses = JOB_STATUSES,
        // job states where there will be no more updates
        terminalStates = [JOB.completed, JOB.error, JOB.terminated, JOB.does_not_exist];

    const jobStrings = {
        does_not_exist: {
            action: null,
            nice: 'does not exist',
            status: 'not found',
            statusBatch: 'not found',
        },

        queued: {
            action: 'cancel',
            nice: 'queued',
            status: 'queued',
            statusBatch: 'queued',
        },

        running: {
            action: 'cancel',
            nice: 'running',
            status: 'running',
            statusBatch: 'running',
        },

        completed: {
            action: 'go to results',
            nice: 'success',
            status: 'success',
            statusBatch: 'successes',
        },

        error: {
            action: 'retry',
            nice: 'error',
            status: 'failed',
            statusBatch: 'failed',
        },

        terminated: {
            action: 'retry',
            nice: 'cancellation',
            status: 'cancelled',
            statusBatch: 'cancelled',
        },
    };
    jobStrings.created = jobStrings.queued;
    jobStrings.estimating = jobStrings.queued;

    function isTerminalStatus(status) {
        return !!(status && terminalStates.includes(status));
    }

    function getJobString(jobState, stringType) {
        if (!jobState || !stringType) {
            throw new Error('Please supply a job state object and a string type');
        }

        const validStringTypes = ['action', 'status', 'statusBatch', 'nice'];
        if (!validStringTypes.includes(stringType)) {
            throw new Error(`${stringType} is not a valid string type`);
        }

        const status =
            jobState.status && isValidJobStatus(jobState.status)
                ? jobState.status
                : JOB.does_not_exist;

        return jobStrings[status][stringType];
    }

    /**
     * Job-related errors are returned in the following format:
     *
     * {
     *      job_id:     str
     *      error:      str
     * }
     *
     * Job status, info, retries, and log requests all return data in this format
     * @param {object} jobError
     */
    function isValidJobErrorObject(jobError) {
        const required = ['job_id', 'error'];

        return !!(
            jobError !== null &&
            Utils.objectToString(jobError) === 'Object' &&
            required.every((prop) => prop in jobError)
        );
    }

    /**
     * A job state object should have the minimal structure
     *
     * {
     *      job_id:     str
     *      status:     str -- one of the validJobStatuses
     *      created:    int -- if the status is NOT 'does_not_exist'
     * }
     *
     * There are other required fields, but these checks are sufficient for the UI.
     *
     * See execution_engine2/lib/execution_engine2/db/models/models.py in the
     * execution_engine2 repo for the full job spec.
     *
     * This function should be updated to stay in sync with ee2's output.
     *
     * @param {object} jobState
     * @returns {boolean} true|false
     */
    function isValidJobStateObject(jobState) {
        const required = ['job_id', 'status'];
        return !!(
            jobState !== null &&
            Utils.objectToString(jobState) === 'Object' &&
            required.every((prop) => prop in jobState) &&
            validJobStatuses.includes(jobState.status) &&
            // require the 'created' key if the status is not 'does_not_exist'
            (jobState.status === JOB.does_not_exist
                ? true
                : Object.prototype.hasOwnProperty.call(jobState, JOB.created))
        );
    }

    /**
     * Takes as input the object received from a backend 'job_status' call
     * Ensures that the jobState key is present and that the contents are a valid jobState object
     *
     * @param {object} backendJobState
     * @returns {boolean} true|false
     */
    function isValidBackendJobStateObject(backendJobState) {
        const required = ['jobState'];
        if (
            backendJobState &&
            Utils.objectToString(backendJobState) === 'Object' &&
            required.every((prop) => prop in backendJobState) &&
            backendJobState.jobState &&
            isValidJobStateObject(backendJobState.jobState)
        ) {
            return true;
        }
        return isValidJobErrorObject(backendJobState);
    }

    /**
     * Given a job status string, ensure that it is valid
     *
     * @param {*} status
     * @returns {boolean} true|false
     */
    function isValidJobStatus(status) {
        return status && validJobStatuses.includes(status);
    }

    /**
     * A job info object should have the minimal structure
     *
     * {
     *      job_id:     str
     *      app_id:     str
     *      app_name:   str
     *      batch_id:   str
     *      job_params: [] or [
     *          {
     *              param_one: 'value one',
     *              param_two: 'value two',
     *              ...
     *          }
     *      ]
     * }
     *
     * This function should be updated to stay in sync with ee2's output.
     *
     * @param {object} jobInfo
     * @returns {boolean} true|false
     */
    function isValidJobInfoObject(jobInfo) {
        const required = ['app_id', 'app_name', 'batch_id', 'job_id', 'job_params'];
        try {
            if (
                jobInfo !== null &&
                Utils.objectToString(jobInfo) === 'Object' &&
                required.every((key) => key in jobInfo) &&
                // batch job: job params is null
                (jobInfo.job_params === null ||
                    (Utils.objectToString(jobInfo.job_params) === 'Array' &&
                        // job_params is empty
                        (jobInfo.job_params.length === 0 ||
                            // job params is populated with an object
                            Utils.objectToString(jobInfo.job_params[0]) === 'Object')))
            ) {
                return true;
            }
            // eslint-disable-next-line no-empty
        } catch (err) {}
        return isValidJobErrorObject(jobInfo);
    }

    /**
     * A job retry object should have the minimal structure
     * {
     *      job: {
     *          jobState: { ... },
     *      },
     *      retry: {
     *          jobState: { ... },
     *      }
     * }
     *
     * This function should be updated to stay in sync with ee2's output.
     *
     * @param {object} jobLogs
     * @returns {boolean} true|false
     */
    function isValidJobRetryObject(jobRetry) {
        const required = ['job_id', 'job'],
            oneOf = ['retry', 'error'];
        try {
            if (
                jobRetry !== null &&
                Utils.objectToString(jobRetry) === 'Object' &&
                required.every((key) => key in jobRetry) &&
                oneOf.some((key) => key in jobRetry) &&
                isValidBackendJobStateObject(jobRetry.job)
            ) {
                if (jobRetry.retry) {
                    return isValidBackendJobStateObject(jobRetry.retry);
                }
                return true;
            }
            // eslint-disable-next-line no-empty
        } catch (err) {}
        return isValidJobErrorObject(jobRetry);
    }

    /**
     * A job log object should have the structure
     *
     * {
     *      job_id:     str
     *      batch_id:   str
     *      first:      int
     *      latest:     bool
     *      max_lines:  int
     *      lines: [
     *          { line: ..., is_error: bool },
     *          { line: ..., is_error: bool },
     *          ...
     *      ]
     * }
     *
     * If there is an error (e.g. logs not found), the job log object will look like this:
     *
     * {
     *      job_id:     str
     *      error:      str
     * }
     *
     * This function should be updated to stay in sync with ee2's output.
     *
     * N.b. this function checks for the presence of keys, but does not check their type
     *
     * @param {object} jobLogs
     * @returns {boolean} true|false
     */

    function isValidJobLogsObject(jobLogs) {
        const required = ['job_id', 'batch_id', 'first', 'latest', 'max_lines', 'lines'];

        try {
            if (
                jobLogs !== null &&
                Utils.objectToString(jobLogs) === 'Object' &&
                required.every((key) => key in jobLogs) &&
                Utils.objectToString(jobLogs.lines) === 'Array'
            ) {
                return true;
            }
            // eslint-disable-next-line no-empty
        } catch (err) {}
        return isValidJobErrorObject(jobLogs);
    }

    /**
     * Given a job state, return the appropriate action to offer in the UI
     *
     * @param {object} jobState
     * @returns {string} label
     */

    function jobAction(jobState) {
        return getJobString(jobState, 'action');
    }

    const validStatusesForAction = {
        cancel: [JOB.created, JOB.estimating, JOB.queued, JOB.running],
        retry: [JOB.created, JOB.estimating, JOB.queued, JOB.running, JOB.error, JOB.terminated],
    };

    /**
     * Given a job state object and an action, return a boolean indicating whether the job can perform that action
     *
     * @param {string} action
     * @param {object} jobState
     * @returns {boolean} whether or not the job can do the action
     */
    function canDo(action, jobState) {
        return (
            isValidJobStateObject(jobState) &&
            validStatusesForAction[action].includes(jobState.status) &&
            !(action === 'retry' && jobState.batch_job)
        );
    }

    /**
     * Given a job state object, return a boolean indicating whether the job can be cancelled
     *
     * A job in a non-terminal state can be cancelled.
     *
     * @param {object} jobState
     * @returns {boolean} whether or not the job can be cancelled
     */
    function canCancel(jobState) {
        return canDo('cancel', jobState);
    }

    /**
     * Given a job state object, return a boolean indicating whether the job can be retried
     *
     * As the job data held by the front end may be out of date, any job not in state 'completed'
     * can be retried
     *
     * @param {object} jobState
     * @returns {boolean} whether or not the job can be retried
     */
    function canRetry(jobState) {
        return canDo('retry', jobState);
    }

    /**
     * Convert a job state into a short string to present in the UI
     *
     * @param {object} jobState
     * @param {boolean} includeError  // whether or not to include error info
     * @returns {string} label
     */

    function jobLabel(jobState, includeError = false) {
        const jobString = getJobString(jobState, 'status');
        if (includeError && jobState.status && jobState.status === JOB.error) {
            return (
                `${jobString}: ` + ErrorDisplay.normaliseErrorObject({ jobState: jobState }).type
            );
        }
        return jobString;
    }

    /**
     * Translate from EE2's job status (or other job state strings interpreted by the app cell)
     * to a presentable string. This returns a span with the text colored and bolded, and the
     * "nice" readable state string.
     *
     * Translated strings = completed, error, terminated, and does_not_exist. Those all get
     * different colors. Other strings are rendered black.
     * @param {string} jobStatus
     */

    function niceState(jobStatus) {
        if (!isValidJobStatus(jobStatus)) {
            jobStatus = 'invalid';
        }

        let label = jobStatus,
            cssClass = `--${jobStatus}`;
        switch (jobStatus) {
            case JOB.does_not_exist:
                label = 'does not exist';
                break;
            case JOB.completed:
                label = 'success';
                break;
            case JOB.error:
                break;
            case JOB.terminated:
                label = 'cancellation';
                break;
            default:
                cssClass = '';
        }

        return span(
            {
                class: `${cssBaseClass}__summary${cssClass}`,
            },
            label
        );
    }

    /**
     * Use the app cell FSM mode and stage data to generate the appropriate job status summary
     * @param {string} mode
     * @param {string} stage
     * @returns {string} HTML string with a single word status
     */

    function createJobStatusFromFsm(mode, stage) {
        let label, cssClass;
        switch (mode) {
            case 'success':
                label = 'success';
                cssClass = 'completed';
                break;
            case 'error':
            case 'internal-error':
                label = 'error';
                cssClass = 'error';
                break;
            case 'canceled':
            case 'canceling':
                label = 'canceled';
                cssClass = 'terminated';
                break;
            case 'processing':
                if (stage === 'running' || stage === 'queued') {
                    label = stage;
                    cssClass = stage;
                }
                break;
        }
        return _createJobStatus({ cssClass, label });
    }

    function createJobStatusFromBulkCellFsm(mode) {
        let label, cssClass;
        switch (mode) {
            case 'launching':
            case 'inProgress':
            case 'inProgressResultsAvailable':
                label = 'in progress';
                cssClass = 'running';
                break;
            // all jobs completed, none successfully
            case 'jobsFinished':
                label = 'jobs finished';
                cssClass = 'error';
                break;
            // all jobs complete, at least some successful
            case 'jobsFinishedResultsAvailable':
                label = 'jobs finished';
                cssClass = 'completed';
                break;
            case 'error':
                label = 'error';
                cssClass = 'error';
                break;
        }
        return _createJobStatus({ cssClass, label });
    }

    function _createJobStatus(args) {
        const { cssClass, label } = args;

        if (!cssClass || !label) {
            return '';
        }

        return span(
            {
                class: `${cssBaseClass}__cell_summary--${cssClass}`,
            },
            label
        );
    }

    /**
     * Add an array of jobs to a model
     *
     * @param {object} model - the model to add the jobs to
     * @param {array} jobArray - array of job state objects
     */
    function populateModelFromJobArray(model, jobArray = []) {
        if (!model) {
            throw new Error('Missing a model to populate');
        }
        const batchIds = new Set(),
            batchJobs = new Set();

        if (!jobArray.length) {
            model.deleteItem('exec.jobs');
            model.deleteItem('exec.jobState');
            return;
        }

        jobArray.forEach((job) => {
            if (job.batch_id) {
                batchIds.add(job.batch_id);
            }
            if (job.batch_job) {
                batchJobs.add(job);
            }
        });

        if (batchIds.size > 1) {
            // more than one batch present
            throw new Error('More than one batch ID found');
        }
        if (batchJobs.size > 1) {
            // more than one batch parent present
            throw new Error('More than one batch parent found');
        }

        model.setItem('exec.jobs', jobArrayToIndexedObject(jobArray));

        model.setItem('exec.jobState', Array.from(batchJobs)[0]);
        return model;
    }

    /**
     * Given an array of jobState objects, create an object with jobs indexed by ID
     *
     * @param {array} jobArray array of jobState objects
     * @returns {object} with indexed job data:
     *      byId        key: job_id, value: jobState object
     */

    function jobArrayToIndexedObject(jobArray = []) {
        const jobIx = {
            byId: {},
        };

        jobArray.forEach((job) => {
            jobIx.byId[job.job_id] = job;
        });
        return jobIx;
    }

    /**
     * Ensures that the child_jobs data is in the correct place in the jobState object
     *
     * This is a horrible hack to move job data from the old batch implementation
     * into the correct place
     *
     * @param {object} jobState
     * @return {object} jobState, possibly edited
     */
    function updateJobModel(jobState) {
        // current structure of jobs data -- child jobs are hidden under
        // jobState.job_output.result[0].batch_results.
        // Remap to be under jobState.child_jobs
        if (jobState.batch_size && jobState.child_jobs.length === 0) {
            try {
                jobState.child_jobs = Object.keys(jobState.job_output.result[0].batch_results).map(
                    (item) => {
                        return jobState.job_output.result[0].batch_results[item].final_job_state;
                    }
                );
            } catch (e) {
                // eslint-disable-next-line no-empty
            }
        }
        return jobState;
    }

    /**
     * createJobStatusLines
     * Record the current state of the job and its previous states, including time
     * spent in those states.
     *
     * The job execution engine records timestamps for certain job states; in
     * chronological order, these are:
     *      - created
     *      - queued
     *      - running
     *      - finished
     *
     * Go through job statuses in reverse order to get the most recent state,
     * and work backwards from that to generate the previous states.
     *
     * @param {object}  jobState       - object representing the current job state
     * @param {boolean} includeHistory - whether to generate a single line status (false), or
     *                               to include the history (e.g. how long the job queued for)
     *
     * @returns {array} jobLines       - an array of lines representing the current job status
     */

    function createJobStatusLines(jobState, includeHistory = false) {
        if (!isValidJobStateObject(jobState)) {
            return jobStatusUnknown;
        }

        if (jobState.status === JOB.does_not_exist) {
            return jobNotFound;
        }

        const jobLines = [];
        // Finished status
        if (jobState.finished) {
            // Amount of time it was in the queue
            jobLines.push(queueTime(jobState));

            if (jobState.running) {
                // how long it ran for (if it ran)
                jobLines.push(runTime(jobState));
            }

            jobLines.push(
                _finishString(jobState.status) +
                    ' at ' +
                    span(
                        {
                            class: 'kb-timestamp',
                        },
                        Format.niceTime(jobState.finished)
                    )
            );

            if (includeHistory) {
                return jobLines.reverse();
            }
            return [jobLines.pop()];
        }

        // the job is still running
        if (jobState.running) {
            // Amount of time it was in the queue
            jobLines.push(queueTime(jobState));
            // How long it has been running for
            jobLines.push(runTime(jobState));

            if (includeHistory) {
                return jobLines.reverse();
            }
            return [jobLines.pop()];
        }

        // the job is in the queue
        return [queueTime(jobState)];
    }

    function _finishString(status) {
        return `Finished with ${niceState(status)}`;
    }

    function runTime(jobState) {
        if (!jobState.finished) {
            return (
                UI.loading({ color: 'green' }) +
                ' Started running job at ' +
                span(
                    {
                        class: 'kb-timestamp',
                    },
                    Format.niceTime(jobState.running)
                ) +
                span({ class: 'runClock', dataElement: 'clock' })
            );
        }
        return (
            'Ran for ' +
            span(
                {
                    class: 'kb-elapsed-time',
                },
                Format.niceDuration(jobState.finished - jobState.running)
            )
        );
    }

    /**
     * In successful job execution, there should be 'running' and 'finished'
     * timestamps; the queue time is jobState.running - jobState.created.
     *
     * If the job was terminated before it left the queue, there will be no
     * running timestamp, and we use jobState.finished (the termination timestamp)
     * to calculate the queue time.
     *
     * @param {object} jobState
     * @returns {string} queueString - HTML text description of queue time
     */
    function queueTime(jobState) {
        const endTime = jobState.running || jobState.finished;
        if (endTime) {
            return (
                'Queued for ' +
                span(
                    {
                        class: 'kb-elapsed-time',
                    },
                    Format.niceDuration(endTime - jobState.created)
                )
            );
        }
        // job hasn't run or finished (yet)
        return (
            UI.loading({ color: 'orange' }) +
            ' In the queue since ' +
            span(
                {
                    class: 'kb-timestamp',
                },
                Format.niceTime(jobState.created)
            )
        );
    }

    /**
     *
     * @param {array} jobArray array of job objects
     * @param {object} jobsByRetryParent (optional) index, to be completed, with key retry_parent job IDs
     * and an array of retry job IDs as values
     * @returns {object} jobsByOriginalId object, with key retry_parent job and value job_id of most recent retry
     */
    function getCurrentJobs(jobArray, jobsByRetryParent = {}) {
        // group jobs by their retry parents
        jobArray.forEach((job) => {
            if (job.batch_job) {
                return;
            }
            const indexId = job.retry_parent || job.job_id;
            const jobIx = `${job.created || 0}__${job.job_id}`;
            if (!jobsByRetryParent[indexId]) {
                jobsByRetryParent[indexId] = {
                    job_id: indexId,
                    jobs: {},
                };
            }
            jobsByRetryParent[indexId].jobs[jobIx] = job;
        });

        // collect jobs that are not retries
        const jobsByOriginalId = {};
        // now take the most recent job from jobsByRetryParent
        Object.keys(jobsByRetryParent).forEach((indexId) => {
            const sortedJobs = Object.keys(jobsByRetryParent[indexId].jobs).sort(),
                lastJob = sortedJobs[sortedJobs.length - 1];
            jobsByOriginalId[indexId] = jobsByRetryParent[indexId].jobs[lastJob];
        });
        return jobsByOriginalId;
    }

    const batch = 'batch job';
    /**
     * create a summary string for a set of jobs
     *
     * @param {object} jobLabelFreq - an object with keys job labels and values their frequencies
     * @returns {string} - a string summarising the state of the batch job
     */
    function _createBatchSummaryState(jobLabelFreq) {
        // if at least one job is queued or running, the batch job is in progress
        if (jobLabelFreq.running || jobLabelFreq.queued) {
            return `${batch} in progress`;
        }

        if (Object.keys(jobLabelFreq).length === 1) {
            const status = Object.keys(jobLabelFreq)[0];
            if (status === JOB.does_not_exist) {
                return `${batch} finished with error`;
            }
            return `${batch} ${_finishString(status).toLowerCase()}`;
        }
        return `${batch} finished`;
    }

    /**
     * Get counts for jobs in each status
     * Squashes 'estimating' and 'created' job states into 'queued'
     *
     * @param {object} jobsByStatus
     * @returns {object} statuses with keys job status and values the number of jobs in that state
     */
    function _jobCountByStatus(jobsByStatus) {
        const statuses = {};
        Object.keys(jobsByStatus).forEach((status) => {
            const nJobs = jobsByStatus[status].size;
            // reduce down the queued states
            if (status === JOB.estimating || status === JOB.created) {
                status = JOB.queued;
            }
            if (statuses[status]) {
                statuses[status] += nJobs;
            } else {
                statuses[status] = nJobs;
            }
        });
        return statuses;
    }

    /**
     * group job IDs by job status
     *
     * @param {object} jobIx
     * @returns {object} jobsByStatus with keys job status and values Set object containing job IDs
     */
    function _groupJobsByStatus(jobIx) {
        // index by status
        const jobsByStatus = {};
        Object.values(jobIx).forEach((job) => {
            const { job_id, status } = job;
            if (!jobsByStatus[status]) {
                jobsByStatus[status] = new Set();
            }
            jobsByStatus[status].add(job_id);
        });
        return jobsByStatus;
    }

    /**
     * Classify current jobs by status and return counts for each status
     * 'created' and 'estimating' statuses are collapsed into 'queued'
     *
     * @param {object} jobsIndex jobs indexed by ID
     * @param {object} options extra options for the count; currently only 'withRetries' allowed
     * @returns {object} with keys job status and values number of jobs in that state
     */
    function getCurrentJobCounts(jobsIndex, options = {}) {
        if (
            !jobsIndex ||
            !Object.keys(jobsIndex).length ||
            !jobsIndex.byId ||
            !Object.keys(jobsIndex.byId).length
        ) {
            return {};
        }
        const jobsByRetryParent = {};
        const currentJobs = getCurrentJobs(Object.values(jobsIndex.byId), jobsByRetryParent);

        // get job count for each status
        const statuses = _jobCountByStatus(_groupJobsByStatus(currentJobs));

        if (options && options.withRetries) {
            // any retryParents in jobsByRetryParents with more than one child in jobs have been retried
            const nRetriedParents = Object.values(jobsByRetryParent)
                .filter((parent) => {
                    return Object.keys(parent.jobs).length > 1;
                })
                .map((job) => {
                    return job.job_id;
                }).length;
            if (nRetriedParents) {
                statuses.retried = nRetriedParents;
            }
        }
        return statuses;
    }

    /**
     * Given an object containing jobs indexed by ID, summarise the status of the jobs
     * @param {object} jobsIndex the index of job data, e.g. from retrieving `exec.jobs` in a batch cell
     * @returns {string} summary string
     */

    function createCombinedJobState(jobsIndex) {
        if (
            !jobsIndex ||
            !Object.keys(jobsIndex).length ||
            !jobsIndex.byId ||
            !Object.keys(jobsIndex.byId).length
        ) {
            return '';
        }

        // get job count for each status and retries
        const statuses = getCurrentJobCounts(jobsIndex, { withRetries: 1 });

        const textStatusSummary = _createBatchSummaryState(statuses);
        const orderedStatuses = [
            JOB.queued,
            JOB.running,
            JOB.completed,
            JOB.error,
            JOB.terminated,
            JOB.does_not_exist,
        ];
        let summaryHtml =
            `${textStatusSummary}: ` +
            orderedStatuses
                .filter((state) => {
                    return statuses[state];
                })
                .map((state) => {
                    const jobString = getJobString(
                        { status: state },
                        statuses[state] === 1 ? 'status' : 'statusBatch'
                    );

                    return (
                        `${statuses[state]} ` +
                        span(
                            {
                                class: `${cssBaseClass}__summary--${state}`,
                            },
                            jobString
                        )
                    );
                })
                .join(', ');

        if (statuses.retried) {
            summaryHtml += ` (${
                statuses.retried > 1 ? statuses.retried + ' jobs' : '1 job'
            } retried)`;
        }

        const jobSpan = document.createElement('span');
        jobSpan.innerHTML = summaryHtml;
        jobSpan.title = jobSpan.textContent;
        return jobSpan.outerHTML;
    }

    /**
     * Given an object containing jobs indexed by ID, create a summary for a collapsed cell
     * @param {object} jobsIndex the index of job data, e.g. from retrieving `exec.jobs` in a batch cell
     * @returns {string} summary string
     */

    function createCombinedJobStateSummary(jobsIndex) {
        if (
            !jobsIndex ||
            !Object.keys(jobsIndex).length ||
            !jobsIndex.byId ||
            !Object.keys(jobsIndex.byId).length
        ) {
            return '';
        }
        // get job count for each status and retries
        const statuses = getCurrentJobCounts(jobsIndex, { withRetries: 1 });
        if (statuses[JOB.running] || statuses[JOB.queued]) {
            if (!statuses[JOB.running]) {
                return _createJobStatus({
                    cssClass: 'queued',
                    label: 'queued',
                });
            }
            return _createJobStatus({ cssClass: 'running', label: 'running' });
        }
        if (statuses[JOB.error] || statuses[JOB.does_not_exist]) {
            return _createJobStatus({ cssClass: 'error', label: 'error' });
        }
        // no completed jobs => everything was terminated
        if (!statuses[JOB.completed]) {
            return _createJobStatus({ cssClass: 'terminated', label: 'canceled' });
        }
        return _createJobStatus({ cssClass: 'completed', label: 'success' });
    }

    /**
     * Get the FSM state for a bulk cell from the jobs
     *
     * @param {object} jobsIndex jobs index
     * @returns {string} FSM state
     */
    function getFsmStateFromJobs(jobsIndex) {
        if (
            !jobsIndex ||
            !Object.keys(jobsIndex).length ||
            !jobsIndex.byId ||
            !Object.keys(jobsIndex.byId).length
        ) {
            return null;
        }

        const statuses = getCurrentJobCounts(jobsIndex);
        // if at least one job is running or queued, the status is 'inProgress'; otherwise,
        // all jobs are in a terminal state, so the status is 'jobsFinished'
        const baseStatus = statuses.running || statuses.queued ? 'inProgress' : 'jobsFinished';
        // check whether or not any jobs ran successfully and hence whether results are available
        return statuses.completed ? `${baseStatus}ResultsAvailable` : baseStatus;
    }

    return {
        canCancel,
        canDo,
        canRetry,
        createCombinedJobState,
        createCombinedJobStateSummary,
        createJobStatusFromFsm,
        createJobStatusFromBulkCellFsm,
        createJobStatusLines,
        getCurrentJobCounts,
        getCurrentJobs,
        getFsmStateFromJobs,
        isTerminalStatus,
        isValidBackendJobStateObject,
        isValidJobStatus,
        isValidJobStateObject,
        isValidJobInfoObject,
        isValidJobLogsObject,
        isValidJobRetryObject,
        jobAction,
        jobArrayToIndexedObject,
        jobLabel,
        jobNotFound,
        jobStatusUnknown,
        jobStrings,
        niceState,
        populateModelFromJobArray,
        updateJobModel,
        validJobStatuses,
        validStatusesForAction,
    };
});
