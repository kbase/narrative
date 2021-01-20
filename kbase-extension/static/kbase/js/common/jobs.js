define([
    'common/html',
    'common/format',
    'common/ui',
], (
    html,
    format,
    UI,
) => {
    'use strict';

    const t = html.tag,
        span = t('span'),
        cssBaseClass = 'kb-job-state';

    /**
     * Convert a job state into a short string to present in the UI
     *
     * @param {string} jobState
     * @returns {string} label
     */

    function jobLabel(jobState) {
        // covers 'does_not_exist' or invalid job states
        let label = 'Job not found';
        switch (jobState) {
            case 'completed':
                label = 'Success';
                break;
            case 'created':
            case 'estimating':
            case 'queued':
                label = 'Queued';
                break;
            case 'running':
                label = 'Running';
                break;
            case 'error':
                label = 'Failed';
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
     * @param {string} jobState
     */

    function niceState(jobState) {
        let label,
            color;
        switch (jobState) {
            case 'completed':
                label = 'success';
                color = 'green';
                break;
            case 'error':
                label = 'error';
                color = 'red';
                break;
            case 'terminated':
                label = 'cancellation';
                color = 'orange';
                break;
            case 'does_not_exist':
                label = 'does_not_exist';
                color = 'orange';
                break;
            default:
                label = jobState;
                color = 'black';
        }

        return span({
            class: `${cssBaseClass}__niceState--${jobState}`,
            style: {
                color: color,
                fontWeight: 'bold'
            }
        }, label);
    }

    function jobNotFound() {
        return [
            'This job was not found, or may not have been registered with this Narrative.',
            'You will not be able to inspect the job status or view the job log'
        ];
    }

    function jobStatusUnknown() {
        return ['Determining job state...'];
    }

    /**
     *
     * @param {object}  jobState       - object representing the current job state
     * @param {boolean} includeHistory - whether to generate a single line status (false), or
     *                               to include the history (e.g. how long the job queued for)
     * @returns {array} jobLines       - an array of lines representing the current job status
     */

    function createJobStatusLines(jobState, includeHistory = false) {
        if (!isValidJobState(jobState)) {
            if (jobState && jobState.job_state && jobState.job_state === 'does_not_exist') {
                return jobNotFound();
            }
            return jobStatusUnknown();
        }

        // valid job state objects should have an 'updated' timestamp.
        if (!jobState.updated) {
            return jobStatusUnknown();
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
                'Finished with ' + niceState(jobState.status) + ' at '
                + span({
                    class: 'kb-timestamp'
                }, format.niceTime(jobState.finished))
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

    function runTime (jobState) {
        if (!jobState.finished) {
            return UI.loading({ color: 'green' })
                + ' Started running job at '
                + span({
                    class: 'kb-timestamp'
                }, format.niceTime(jobState.running))
                + span({ class: 'runClock', dataElement: 'clock' });
        }
        return 'Ran for '
            + span({
                class: 'kb-elapsed-time'
            }, format.niceDuration(jobState.finished - jobState.running));
    }

    function queueTime (jobState) {
        const endTime = jobState.running || jobState.finished;
        if (endTime) {
            return 'Queued for '
            + span({
                class: 'kb-elapsed-time'
            }, format.niceDuration(endTime - jobState.created));
        }
        // job hasn't run or finished (yet)
        const queueString = UI.loading({ color: 'orange' })
            + ' In the queue since '
            + span({
                class: 'kb-timestamp'
            }, format.niceTime(jobState.created));

        if (jobState.position) {
            return queueString + ', currently at position ' + jobState.position;
        }
        return queueString;
    }


    /**
     * A jobState is deemed valid if
     * 1. It's an object (not an array or atomic type)
     * 2. It has a created key
     * 3. It has a job_id key
     * 4. There's others that are necessary, but the top two are sufficient to judge if it's valid
     *    enough and up to date. This function should be updated as necessary.
     *
     * This is intended to be used to make sure that jobStates are of the latest version of the
     * execution engine.
     * @param {object} jobState
     */
    function isValidJobState(jobState) {
        const requiredProperties = ['job_id', 'created'];
        if (jobState !== null && typeof jobState === 'object') {
            let isValid = true;
            requiredProperties.forEach((prop) => {
                if (!(prop in jobState)) {
                    isValid = false;
                }
            });
            return isValid;
        }
        return false;
    }

    return {
        isValidJobState: isValidJobState,
        niceState: niceState,
        jobLabel: jobLabel,
        createJobStatusLines: createJobStatusLines,
    };
});
