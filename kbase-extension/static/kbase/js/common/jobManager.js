define(['common/html', 'common/jobs', 'common/ui', 'util/string'], (html, Jobs, UI, String) => {
    'use strict';

    const div = html.tag('div'),
        p = html.tag('p');

    /**
     * Initialise the job manager
     *
     * @param {object} config with keys
     *  {object}    model: cell model, including job information under `exec.jobs`
     *  {object}    bus: the bus for communicating messages to the kernel
     *  {function}  viewResultsFunction: function to display the results of a job
     *  {object}    controlPanel: object with function `setExecMessage` for updating the cell job status (opt)
     *              the controlPanel object can also be added later using the `setControlPanel` function
     *
     * @returns {object} the initialised job manager
     */
    function JobManager(config) {
        const { model, bus, viewResultsFunction } = config;
        if (!model || !bus || !viewResultsFunction) {
            throw new Error(
                'cannot initialise job manager widget without params "bus", "model", and "viewResultsFunction"'
            );
        }
        let controlPanel = config.controlPanel || null;

        function setControlPanel(panel) {
            controlPanel = panel;
        }

        /**
         * Update the execMessage panel with details of the active jobs
         */
        function updateToolbarJobStatus() {
            if (!controlPanel) {
                console.warn('controlPanel has not been initialised');
                return;
            }
            controlPanel.setExecMessage(
                Jobs.createCombinedJobState(model.getItem('exec.jobs.byStatus'))
            );
        }

        /**
         * Execute a function to view job results.
         */
        function viewResults() {
            return viewResultsFunction ? viewResultsFunction() : null;
        }

        /* JOB MANAGEMENT */

        /**
         * Get the IDs of jobs with a certain status
         *
         * @param {array} statusList - array of statuses to find
         * @param {array} validStates - array of valid statuses for this action (optional)
         * @returns {array} job IDs to perform the action upon
         */
        function getJobIDsByStatus(statusList, validStates) {
            if (validStates && validStates.length) {
                const allInTheList = statusList.every((status) => {
                    return validStates.includes(status);
                });
                if (!allInTheList) {
                    console.error(
                        `Invalid status supplied! Valid statuses: ${validStates.join(
                            '; '
                        )}; supplied: ${statusList.join('; ')}.`
                    );
                    return null;
                }
            }

            const jobsByStatus = model.getItem('exec.jobs.byStatus');
            return statusList
                .map((status) => {
                    return jobsByStatus[status] ? Object.keys(jobsByStatus[status]) : [];
                })
                .flat();
        }

        /**
         *
         * @param {string} action - what action is to occur (cancel or retry)
         * @param {array} statusList - array of statuses that the action applies to
         * @param {array} jobList - array of job IDs
         * @returns {object} arguments to create a modal to confirm or cancel the action
         */

        function _generateDialogArgs(action, statusList, jobList) {
            const statusIx = statusList.reduce((acc, curr) => {
                acc[curr] = 1;
                return acc;
            }, {});

            // for presentation, created and estimating jobs are listed as 'queued'
            ['created', 'estimating'].forEach((status) => {
                if (statusIx[status]) {
                    delete statusIx[status];
                    statusIx.queued = 1;
                }
            });

            const jobLabelString = String.arrayToEnglish(
                Object.keys(statusIx)
                    .sort()
                    .map((status) => Jobs.jobLabel({ status: status }))
            );
            const jobString = jobList.length === 1 ? '1 job' : jobList.length + ' jobs';
            const ucfirstAction = String.capitalize(action);
            return {
                title: `${ucfirstAction} ${jobLabelString} jobs`,
                body: div([
                    p([
                        `${ucfirstAction}ing all ${jobLabelString} jobs will terminate the processing of ${jobString}. `,
                        'Any output objects already created will remain in your narrative and can be removed from the Data panel.',
                    ]),
                    statusList.includes('error')
                        ? p(
                              'Please note that jobs are rerun using the same parameters. Any jobs that failed due to issues with the input, such as misconfigured parameters or corrupted input data, are likely to throw the same errors when run again.'
                          )
                        : '',
                    p(`${ucfirstAction} all ${jobLabelString} jobs?`),
                ]),
            };
        }

        const jobCommand = {
            cancel: 'request-job-cancellation',
            retry: 'request-job-rerun',
        };

        /**
         *
         * @param {object} args with keys
         *                 action: the action to perform -- cancel or retry
         *                 jobId: job to perform it on
         * @returns {boolean}
         */
        function executeActionOnJobId(args) {
            const { action, jobId } = args;
            const jobState = model.getItem(`exec.jobs.byId.${jobId}`);

            if (jobState && Jobs.canDo(action, jobState)) {
                bus.emit(jobCommand[action], {
                    jobId: jobId,
                });
                return true;
            }
            return false;
        }

        /**
         *
         * @param {object} args with keys
         *      action:        {string} action to perform (cancel or retry)
         *      statusList:    {array}  list of statuses to perform it on
         *      validStatuses: {array}  list of statuses that it is valid to perform the action on
         *
         * @returns {Promise} that resolves to false if there is some error with the input or
         * if the user cancels the batch action. If the users confirms the action, the appropriate
         * message will be emitted by the bus.
         */
        async function executeActionByJobStatus(args) {
            const { action, statusList, validStatuses } = args;

            const jobsList = getJobIDsByStatus(statusList, validStatuses);
            if (!jobsList || !jobsList.length) {
                return Promise.resolve(false);
            }

            await UI.showConfirmDialog(_generateDialogArgs(action, statusList, jobsList)).then(
                (confirmed) => {
                    if (!confirmed) {
                        return false;
                    }
                    // TODO: when ee2 adds endpoints to allow submission of multiple jobs to cancel,
                    // this can be rewritten
                    jobsList.forEach((jobId) => {
                        bus.emit(jobCommand[action], {
                            jobId: jobId,
                        });
                    });
                    return true;
                }
            );
        }

        /**
         * Cancel a single job from the batch
         *
         * @param {string} jobId
         */
        function cancelJob(jobId) {
            return executeActionOnJobId({ jobId, action: 'cancel' });
        }

        /**
         * Retry a single job from the batch
         *
         * @param {string} jobId
         */
        function retryJob(jobId) {
            return executeActionOnJobId({ jobId, action: 'retry' });
        }

        /**
         * Cancel all jobs with the specified statuses
         *
         * @param {array} statusList - array of statuses to cancel
         */
        function cancelJobsByStatus(statusList) {
            return executeActionByJobStatus({
                action: 'cancel',
                statusList: statusList,
                validStatuses: ['created', 'estimating', 'queued', 'running'],
            });
        }

        /**
         * Retry all jobs that ended with the specified status(es)
         *
         * @param {array} statusList - array of statuses to retry
         */
        function retryJobsByStatus(statusList) {
            return executeActionByJobStatus({
                action: 'retry',
                statusList: statusList,
                validStatuses: ['error', 'terminated'],
            });
        }

        /**
         * Update the model with the supplied jobState objects
         * @param {array} jobArray list of jobState objects to update the model with
         */
        function updateModel(jobArray) {
            const jobIndex = model.getItem('exec.jobs');
            jobArray.forEach((jobState) => {
                const status = jobState.status,
                    jobId = jobState.job_id,
                    oldJob = jobIndex.byId[jobId];

                // update the job object
                jobIndex.byId[jobId] = jobState;
                if (!jobIndex.byStatus[status]) {
                    jobIndex.byStatus[status] = {};
                }
                jobIndex.byStatus[status][jobId] = true;

                if (oldJob && status !== oldJob.status) {
                    const oldStatus = oldJob.status;
                    delete jobIndex.byStatus[oldStatus][jobId];
                    if (!Object.keys(jobIndex.byStatus[oldStatus]).length) {
                        delete jobIndex.byStatus[oldStatus];
                    }
                }
            });
            model.setItem('exec.jobs', jobIndex);
            return model;
        }

        return {
            cancelJob,
            cancelJobsByStatus,
            retryJob,
            retryJobsByStatus,
            updateToolbarJobStatus,
            updateModel,
            viewResults,
            setControlPanel,
        };
    }
    return {
        make: (config) => {
            return JobManager(config);
        },
    };
});
