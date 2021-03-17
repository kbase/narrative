define(['common/html', 'common/format', 'common/ui', 'common/errorDisplay'], (
    html,
    format,
    UI,
    ErrorDisplay
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
        ];

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
        const jobStatus = jobState.status || 'does_not_exist';
        const cancel = 'Cancel',
            // statuses not listed here are 'error', 'terminated', and 'does_not_exist'
            // the action for all those should be 'Retry'
            statusToAction = {
                completed: 'Go to results',
                created: cancel,
                estimating: cancel,
                queued: cancel,
                running: cancel,
            };
        return statusToAction[jobStatus] || 'Retry';
    }

    /**
     * Convert a job state into a short string to present in the UI
     *
     * @param {object} jobState
     * @returns {string} label
     */

    function jobLabel(jobState) {
        const jobStatus = jobState.status || 'does_not_exist';
        // covers 'does_not_exist' or invalid job states
        let label = 'Job not found';
        switch (jobStatus) {
            case 'created':
            case 'estimating':
            case 'queued':
                label = 'Queued';
                break;
            case 'running':
                label = 'Running';
                break;
            case 'completed':
                label = 'Success';
                break;
            case 'error':
                label = 'Failed: ' + ErrorDisplay.normaliseErrorObject({ jobState: jobState }).type;
                break;
            case 'terminated':
                label = 'Cancelled';
                break;
        }
        return label;
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
                'Finished with ' +
                    niceState(jobState.status) +
                    ' at ' +
                    span(
                        {
                            class: 'kb-timestamp',
                        },
                        format.niceTime(jobState.finished)
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

    function runTime(jobState) {
        if (!jobState.finished) {
            return (
                UI.loading({ color: 'green' }) +
                ' Started running job at ' +
                span(
                    {
                        class: 'kb-timestamp',
                    },
                    format.niceTime(jobState.running)
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
                format.niceDuration(jobState.finished - jobState.running)
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
                    format.niceDuration(endTime - jobState.created)
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
                format.niceTime(jobState.created)
            );

        return queueString;
    }

    return {
        createJobStatusLines: createJobStatusLines,
        isValidJobStatus: isValidJobStatus,
        isValidJobStateObject: isValidJobStateObject,
        isValidJobInfoObject: isValidJobInfoObject,
        jobAction: jobAction,
        jobLabel: jobLabel,
        jobNotFound: jobNotFound,
        jobStatusUnknown: jobStatusUnknown,
        niceState: niceState,
        updateJobModel: updateJobModel,
        validJobStates: validJobStates,
    };
});
