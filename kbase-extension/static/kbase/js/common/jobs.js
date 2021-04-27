define(['common/errorDisplay', 'common/format', 'common/html', 'common/props', 'common/ui'], (
    ErrorDisplay,
    Format,
    html,
    Props,
    UI
) => {
    'use strict';

    const t = html.tag,
        span = t('span');

    const cssBaseClass = 'kb-job-status',
        jobNotFound = [
            'This job was not found, or may not have been registered with this narrative.',
            'You will not be able to inspect the job status or view the job log.',
        ],
        jobStatusUnknown = ['Determining job state...'],
        // valid job states from ee2, plus 'does_not_exist'
        validJobStates = [
            'created',
            'estimating',
            'queued',
            'running',
            'completed',
            'error',
            'terminated',
            'does_not_exist',
        ],
        // job states where there will be no more updates
        terminalStates = ['completed', 'error', 'terminated', 'does_not_exist'];

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
                : 'does_not_exist';

        return jobStrings[status][stringType];
    }

    /**
     * A jobState object is deemed valid if
     * 1. It's an object (not an array or atomic type)
     * 2. It has a 'created' key
     * 3. It has a 'job_id' key
     * 4. It has a 'status' key, which appears in the array validJobStates
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
        const requiredProperties = ['job_id', 'created', 'status'];
        return (
            jobState !== null &&
            typeof jobState === 'object' &&
            requiredProperties.every((prop) => prop in jobState) &&
            validJobStates.includes(jobState.status)
        );
    }

    /**
     * Given a job status string, ensure that it is valid
     *
     * @param {*} status
     * @returns {boolean} true|false
     */
    function isValidJobStatus(status) {
        return status && validJobStates.includes(status);
    }

    /**
     * A jobInfo object should have the minimal structure
     *
     * {
     *      job_id: ...
     *      job_params: [
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
        try {
            if (
                'job_id' in jobInfo &&
                Object.prototype.toString.call(jobInfo.job_params[0]) === '[object Object]' &&
                Object.keys(jobInfo.job_params[0]).length > 0
            ) {
                return true;
            }
            // eslint-disable-next-line no-empty
        } catch (err) {}
        return false;
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

    /**
     * Given a job state object, return a boolean indicating whether the job can be cancelled
     *
     * Jobs that are queued or running can be cancelled.
     *
     * @param {object} jobState
     * @returns {boolean} whether or not the job can be cancelled
     */
    function canCancel(jobState) {
        return isValidJobStateObject(jobState) && getJobString(jobState, 'action') === 'cancel';
    }

    /**
     * Given a job state object, return a boolean indicating whether the job can be retried
     *
     * To be retried, the job must have failed or been cancelled
     *
     * @param {object} jobState
     * @returns {boolean} whether or not the job can be retried
     */
    function canRetry(jobState) {
        return isValidJobStateObject(jobState) && getJobString(jobState, 'action') === 'retry';
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
        if (includeError && jobState.status && jobState.status === 'error') {
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
            case 'does_not_exist':
                label = 'does not exist';
                break;
            case 'completed':
                label = 'success';
                break;
            case 'error':
                break;
            case 'terminated':
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
     * Use the FSM mode and stage data to generate the appropriate job status summary
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

        if (!label || !cssClass) {
            return '';
        }

        return span(
            {
                class: `${cssBaseClass}__cell_summary--${cssClass}`,
                dataElement: 'job-status',
            },
            label
        );
    }

    /**
     * Given an array of jobState objects, create an object with jobs indexed by ID and by status
     *
     * @param {array} jobArray array of jobState objects
     * @returns {object} with indexed job data:
     *      byId        key: job_id, value: jobState object
     *      byStatus    key: status, value: object whose keys are the job IDs
     *                      of jobs with that status
     */

    function jobArrayToIndexedObject(jobArray = []) {
        return {
            // save job status info under job ID
            byId: jobArray.reduce((acc, curr) => {
                acc[curr.job_id] = curr;
                return acc;
            }, {}),
            // save job IDs grouped by status
            byStatus: jobArray.reduce((acc, curr) => {
                if (!acc[curr.status]) {
                    acc[curr.status] = {};
                }
                acc[curr.status][curr.job_id] = true;
                return acc;
            }, {}),
        };
    }

    /**
     * Ensures that the child_jobs data is in the correct place in the jobState object
     *
     * It should be possible to remove this function after migrating to ee 2.5
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
            // check whether EE2 sent { job_state: 'does_not_exist' }
            // TODO: coerce the { job_state: 'does_not_exist' } into a standard format
            if (jobState && jobState.job_state && jobState.job_state === 'does_not_exist') {
                return jobNotFound;
            }
            return jobStatusUnknown;
        }

        if (jobState.status === 'does_not_exist') {
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
        const queueString =
            UI.loading({ color: 'orange' }) +
            ' In the queue since ' +
            span(
                {
                    class: 'kb-timestamp',
                },
                Format.niceTime(jobState.created)
            );

        return queueString;
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
            if (status === 'does_not_exist') {
                return `${batch} finished with error`;
            }
            return `${batch} ${_finishString(status).toLowerCase()}`;
        }
        return `${batch} finished`;
    }

    /**
     * Given an object containing job IDs indexed by status, summarise the status of the jobs
     * @param {object} jobsByStatus job IDs indexed by status
     * @returns {string} summary string
     */

    function createCombinedJobState(jobsByStatus) {
        if (!jobsByStatus || !Object.keys(jobsByStatus).length) {
            return '';
        }

        const statuses = {};
        Object.keys(jobsByStatus).forEach((status) => {
            const nJobs = Object.keys(jobsByStatus[status]).length;
            // reduce down the queued states
            if (status === 'estimating' || status === 'created') {
                status = 'queued';
            }
            statuses[status] ? (statuses[status] += nJobs) : (statuses[status] = nJobs);
        });

        const textStatusSummary = _createBatchSummaryState(statuses);
        const orderedStatuses = [
            'queued',
            'running',
            'completed',
            'error',
            'terminated',
            'does_not_exist',
        ];
        const summaryHtml =
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

        const jobSpan = document.createElement('span');
        jobSpan.innerHTML = summaryHtml;
        jobSpan.title = jobSpan.textContent;
        return jobSpan.outerHTML;
    }

    return {
        canCancel,
        canRetry,
        createCombinedJobState,
        createJobStatusFromFsm,
        createJobStatusLines,
        isTerminalStatus,
        isValidJobStatus,
        isValidJobStateObject,
        isValidJobInfoObject,
        jobAction,
        jobArrayToIndexedObject,
        jobLabel,
        jobNotFound,
        jobStatusUnknown,
        jobStrings,
        niceState,
        updateJobModel,
        validJobStates,
    };
});
