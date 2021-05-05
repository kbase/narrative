define(['common/html', 'common/jobs', 'common/ui', 'util/string'], (html, Jobs, UI, String) => {
    'use strict';

    const div = html.tag('div'),
        p = html.tag('p'),
        jobCommand = {
            cancel: 'request-job-cancellation',
            retry: 'request-job-retry',
        };

    class JobManager {
        /**
         * Initialise the job manager
         *
         * @param {object} config with keys
         *  {object}    model: cell model, including job information under `exec.jobs`
         *  {object}    bus: the bus for communicating messages to the kernel
         *  {function}  viewResultsFunction: function to display the results of a job
         *
         * @returns {object} the initialised job manager
         */
        constructor(config) {
            ['bus', 'model', 'viewResultsFunction'].forEach((key) => {
                if (!config[key]) {
                    throw new Error(
                        'cannot initialise job manager widget without params "bus", "model", and "viewResultsFunction"'
                    );
                }
                this[key] = config[key];
            });
            this.handlers = {};
        }

        /**
         * Add one or more update handlers to the job manager; these are executed when
         * a job is updated in the model or when `runUpdateHandlers` is executed.
         * They should take two arguments, the cell model and an array of jobs.
         *
         * @param {object} handlerObject with the handler name as keys and the handler function as values
         */

        addUpdateHandler(handlerObject) {
            if (
                !handlerObject ||
                Object.prototype.toString.call(handlerObject) !== '[object Object]'
            ) {
                throw new Error('Arguments to addUpdateHandler must be of type object');
            }
            const errors = [];
            for (const [name, handlerFn] of Object.entries(handlerObject)) {
                if (typeof handlerFn !== 'function') {
                    errors.push(name);
                } else {
                    this.handlers[name] = handlerFn;
                }
            }
            if (errors.length) {
                throw new Error(
                    `Handlers must be of type function. Recheck these handlers: ${errors
                        .sort()
                        .join(', ')}`
                );
            }
        }

        /**
         * Remove an update handler
         *
         * @param {string} handlerName
         */
        removeUpdateHandler(handlerName) {
            const handlerFunction = this.handlers[handlerName];
            delete this.handlers[handlerName];
            return handlerFunction;
        }

        /**
         * Trigger the update handlers alphabetically by name.
         *
         * @param {array} jobArray -- array of pertinent jobs
         */
        runUpdateHandlers(jobArray) {
            Object.keys(this.handlers)
                .sort()
                .forEach((name) => {
                    try {
                        this.handlers[name](this.model, jobArray);
                    } catch (err) {
                        console.warn(`Error executing handler ${name}:`, err);
                    }
                });
        }

        /**
         * Execute a function to view job results.
         */
        viewResults() {
            return this.viewResultsFunction ? this.viewResultsFunction() : null;
        }

        /* JOB MANAGEMENT */

        /**
         * Get the IDs of jobs with a certain status
         *
         * @param {array} statusList - array of statuses to find
         * @param {array} validStates - array of valid statuses for this action (optional)
         * @returns {array} job IDs to perform the action upon
         */
        getJobIDsByStatus(statusList, validStates) {
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

            const jobsByStatus = this.model.getItem('exec.jobs.byStatus');
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

        _generateDialogArgs(action, statusList, jobList) {
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

        /**
         *
         * @param {object} args with keys
         *                 action: the action to perform -- cancel or retry
         *                 jobId: job to perform it on
         * @returns {boolean}
         */
        executeActionOnJobId(args) {
            const { action, jobId } = args;
            const jobState = this.model.getItem(`exec.jobs.byId.${jobId}`);

            if (jobState && Jobs.canDo(action, jobState)) {
                this.bus.emit(jobCommand[action], {
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
        async executeActionByJobStatus(args) {
            const { action, statusList, validStatuses } = args;

            const jobsList = this.getJobIDsByStatus(statusList, validStatuses);
            if (!jobsList || !jobsList.length) {
                return Promise.resolve(false);
            }

            await UI.showConfirmDialog(this._generateDialogArgs(action, statusList, jobsList)).then(
                (confirmed) => {
                    if (!confirmed) {
                        return false;
                    }
                    this.bus.emit(jobCommand[action], {
                        jobIdList: jobsList,
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
        cancelJob(jobId) {
            return this.executeActionOnJobId({ jobId, action: 'cancel' });
        }

        /**
         * Retry a single job from the batch
         *
         * @param {string} jobId
         */
        retryJob(jobId) {
            return this.executeActionOnJobId({ jobId, action: 'retry' });
        }

        /**
         * Cancel all jobs with the specified statuses
         *
         * @param {array} statusList - array of statuses to cancel
         */
        cancelJobsByStatus(statusList) {
            return this.executeActionByJobStatus({
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
        retryJobsByStatus(statusList) {
            return this.executeActionByJobStatus({
                action: 'retry',
                statusList: statusList,
                validStatuses: ['error', 'terminated'],
            });
        }

        /**
         * Update the model with the supplied jobState objects
         * @param {array} jobArray list of jobState objects to update the model with
         */
        updateModel(jobArray) {
            const jobIndex = this.model.getItem('exec.jobs');
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
            this.model.setItem('exec.jobs', jobIndex);
            this.runUpdateHandlers(jobArray);
            return this.model;
        }
    }

    return JobManager;
});
