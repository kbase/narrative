define(['common/dialogMessages', 'common/jobs', 'common/jobCommChannel'], (
    DialogMessages,
    Jobs,
    JobComms
) => {
    'use strict';

    const jcm = JobComms.JobCommMessages;

    const validOutgoingMessageTypes = jcm.validOutgoingMessageTypes();

    const jobCommand = {
        cancel: {
            command: jcm.REQUESTS.CANCEL,
            listener: jcm.RESPONSES.STATUS,
        },
        retry: {
            command: jcm.REQUESTS.RETRY,
            listener: jcm.RESPONSES.RETRY,
        },
    };

    class JobManagerCore {
        /**
         * Initialise the job manager
         *
         * @param {object} config with keys
         *  {object}    model: cell model, including job information under `exec.jobs`
         *  {object}    bus: the bus for communicating messages to the kernel
         *
         * @returns {object} the initialised job manager
         */
        constructor(config) {
            ['bus', 'model'].forEach((key) => {
                if (!config[key]) {
                    throw new Error(
                        'cannot initialise Job Manager without params "bus" and "model"'
                    );
                }
                this[key] = config[key];
            });
            // kbase cell ID
            this.cellId = null;
            if (config.cell) {
                try {
                    this.cellId = config.cell.metadata.kbase.attributes.id;
                } catch (error) {
                    throw new Error('cannot initialise Job Manager with invalid cell metadata');
                }
            }
            // handler function store
            this.__handlerFns = {};
            // an object containing event handlers, categorised by event name
            this.handlers = {};
            // bus listeners, indexed by job ID then message type
            this.listeners = {};
        }

        _isValidEvent(event) {
            return event && validOutgoingMessageTypes.concat('modelUpdate').includes(event);
        }

        _isValidMessage(type, message) {
            switch (type) {
                case jcm.RESPONSES.STATUS:
                    return message.jobId && Jobs.isValidJobStateObject(message.jobState);
                case jcm.RESPONSES.INFO:
                    return message.jobId && Jobs.isValidJobInfoObject(message.jobInfo);
                case type.indexOf('job') !== -1:
                    return !!message.jobId;
                default:
                    return true;
            }
        }

        /**
         * Add one or more handlers to the job manager; these are executed when one of the
         * valid job-related events occurs (job-related message received, model updated)
         * or when `runHandler` is executed.
         *
         * By default, the handler functions receive the jobManager context as
         * first argument and any additional arguments passed in by the caller
         * (e.g. the message and job ID in the case of job listeners)
         *
         * @param {string} event - event that triggers the handler
         * @param {object|array} handlers
         *              object: handlers has handler name as keys and the handler function as values
         *              if the handler function is already installed on the job manager,
         *              'null' can be supplied in place of the function
         *              array: handlers is a list of handler names; these are assumed to be installed
         *              on the job manager already
         * Example:
         *
         * jm.addEventListener(jcm.RESPONSES.STATUS, {
         *      handlerA: () => {}, // this function gets added to the job manager
         *      handlerB: null,     // this handler function is expected to exist
         * })
         * // handlers assumed to already exist:
         * jm.addEventListener(jcm.RESPONSES.ERROR, ['handlerA', 'handlerB']);
         */

        addEventHandler(event, handlers) {
            if (!this._isValidEvent(event)) {
                throw new Error(`addEventHandler: invalid event ${event} supplied`);
            }

            const handlersType = Object.prototype.toString.call(handlers) || null;

            if (
                !handlers ||
                (handlersType !== '[object Array]' && handlersType !== '[object Object]')
            ) {
                throw new Error(
                    'addEventHandler: invalid handlers supplied (must be of type array or object)'
                );
            }

            if (handlersType === '[object Array]') {
                const handlerObj = {};
                handlers.forEach((h) => {
                    handlerObj[h] = null;
                });
                handlers = handlerObj;
            }

            if (!Object.keys(handlers).length) {
                throw new Error('addEventHandler: no handlers supplied');
            }

            if (!this.handlers[event]) {
                this.handlers[event] = {};
            }
            const errors = [];
            for (const [handlerName, handlerFn] of Object.entries(handlers)) {
                const typeError = this.addHandlerFunction({ handlerName, handlerFn });
                if (typeError) {
                    errors.push(typeError);
                } else {
                    this.handlers[event][handlerName] = this.__handlerFns[handlerName];
                }
            }

            if (errors.length) {
                throw new Error(
                    `addEventHandler: handlers must be of type function. Recheck these handlers: ${errors
                        .sort()
                        .join(', ')}`
                );
            }
        }

        /**
         * Add one or more handler functions
         * @param {object} handlerObject - object with keys
         *  {string}    handlerName - the name of the handler to add
         *  {function}  handlerFn - the function to be performed
         *              if the handler function is already installed on the job manager,
         *              'null' can be supplied in place of the function
         *
         * Example:
         *
         * jm.addEventListener(jcm.RESPONSES.STATUS, {
         *      handlerA: () => {}, // this function gets added to the job manager
         *      handlerB: null,     // this handler function is expected to exist
         * })
         *
         */
        addHandlerFunction(handlerArgs) {
            const { handlerName, handlerFn } = handlerArgs;

            if (typeof handlerName !== 'string') {
                return handlerName;
            } else if (this.__handlerFns[handlerName]) {
                // a function with this name already exists
                if (handlerFn !== null) {
                    console.warn(`A handler with the name ${handlerName} already exists`);
                }
                return;
            } else if (handlerFn === null && !this.__handlerFns[handlerName]) {
                // expected the handler to exist already, but it does not
                console.error(`No handler function supplied for ${handlerName}`);
                return handlerName;
            } else if (typeof handlerFn !== 'function') {
                return handlerName;
            }

            this.__handlerFns[handlerName] = handlerFn;
        }

        /**
         * Remove a handler from an event
         *
         * @param {string} event
         * @param {string} handlerName
         * @returns {function} handlerFunction
         */
        removeEventHandler(event, handlerName) {
            if (this.handlers[event]) {
                const handlerFunction = this.handlers[event][handlerName];
                delete this.handlers[event][handlerName];
                return handlerFunction;
            }
        }

        /**
         * Remove a handler function completely
         * @param {string} handlerName
         */
        removeHandlerFunction(handlerName) {
            const handlerFunction = this.__handlerFns[handlerName];
            Object.keys(this.handlers).forEach((event) => {
                delete this.handlers[event][handlerName];
            });
            delete this.__handlerFns[handlerName];
            return handlerFunction;
        }

        /**
         * Trigger the ${event} handlers. Event handlers are executed alphabetically by name.
         *
         * By default, the handler functions receive the jobManager context as
         * first argument and any additional arguments passed in by the caller
         * (e.g. the message and job ID in the case of job listeners)
         *
         * @param {string} event
         * @param  {...any} args
         */
        runHandler(event, ...args) {
            if (
                !this._isValidEvent(event) ||
                !this.handlers[event] ||
                !Object.keys(this.handlers[event])
            ) {
                return;
            }

            Object.keys(this.handlers[event])
                .sort()
                .forEach((handlerName) => {
                    try {
                        this.handlers[event][handlerName](this, ...args);
                    } catch (err) {
                        console.warn(`Error executing handler ${handlerName}:`, err);
                    }
                });
        }

        /* LISTENERS */

        /**
         * Add a bus listener for ${event} messages
         *
         * @param {string} type - a valid message type to listen for (see validOutgoingMessageTypes)
         * @param {array}  channelList - array of channels (job or cell IDs) to apply the listener to
         * @param {object} handlerObject (optional) - object with key(s) handler name and value(s) function to execute on receiving a message
         */
        addListener(type, channelList, handlerObject) {
            if (!validOutgoingMessageTypes.includes(type)) {
                throw new Error(`addListener: invalid listener ${type} supplied`);
            }

            if (Object.prototype.toString.call(channelList) !== '[object Array]') {
                channelList = [channelList];
            }

            channelList
                .filter((channel) => {
                    return channel && channel.length > 0 ? 1 : 0;
                })
                .forEach((channel) => {
                    if (!this.listeners[channel]) {
                        this.listeners[channel] = {};
                    }
                    if (!this.listeners[channel][type]) {
                        let channelObject = { jobId: channel };
                        if (type === jcm.RESPONSES.CELL_JOB_STATUS) {
                            channelObject = { cell: channel };
                        }

                        this.listeners[channel][type] = this.bus.listen({
                            channel: channelObject,
                            key: {
                                type,
                            },
                            handle: (message) => {
                                if (!this._isValidMessage(type, message)) {
                                    return;
                                }
                                this.runHandler(type, message, channel);
                            },
                        });
                    }
                });

            // add the handler -- the message type is used as the event
            if (handlerObject) {
                this.addEventHandler(type, handlerObject);
            }
        }

        /**
         * Remove the listener for ${type} messages for a channel
         *
         * @param {string} channel
         * @param {string} type - the type of the listener
         */
        removeListener(channel, type) {
            try {
                this.bus.removeListener(this.listeners[channel][type]);
                delete this.listeners[channel][type];
            } catch (err) {
                // do nothing
            }
        }

        /**
         * Remove all listeners associated with a certain channel ID
         * @param {string} channel
         */
        removeJobListeners(channel) {
            if (this.listeners[channel] && Object.keys(this.listeners[channel]).length) {
                Object.keys(this.listeners[channel]).forEach((type) => {
                    this.removeListener(channel, type);
                });
                delete this.listeners[channel];
            }
        }

        /**
         * Update the model with the supplied jobState objects
         * @param {array} jobArray list of jobState objects to update the model with
         */
        updateModel(jobArray) {
            const jobIndex = this.model.getItem('exec.jobs');
            const batchId = this.model.getItem('exec.jobState.job_id');
            let batchJob;
            jobArray.forEach((jobState) => {
                // update the job object
                jobIndex.byId[jobState.job_id] = jobState;
                if (jobState.job_id === batchId) {
                    batchJob = jobState;
                }
            });
            this.model.setItem('exec.jobs', jobIndex);
            // check whether the batch parent needs updating
            if (batchJob) {
                this.model.setItem('exec.jobState', batchJob);
            }
            this.runHandler('modelUpdate', jobArray);
            return this.model;
        }

        /* UTIL FUNCTIONS */

        _checkStates(statusList, validStates) {
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
            return statusList;
        }

        /**
         * Get jobs with a certain status, excluding the batch parent job
         *
         * @param {array} statusList - array of statuses to find
         * @param {array} validStates - array of valid statuses for this action (optional)
         * @returns {array} job IDs
         */
        getCurrentJobIDsByStatus(rawStatusList, validStates) {
            return this.getCurrentJobsByStatus(rawStatusList, validStates).map((job) => {
                return job.job_id;
            });
        }

        /**
         * Get jobs with a certain status, excluding the batch parent job
         *
         * @param {array} statusList - array of statuses to find
         * @param {array} validStates - array of valid statuses for this action (optional)
         * @returns {array} job objects
         */
        getCurrentJobsByStatus(rawStatusList, validStates) {
            const statusList = this._checkStates(rawStatusList, validStates);
            const jobsById = this.model.getItem('exec.jobs.byId');
            if (!statusList || !jobsById || !Object.keys(jobsById).length) {
                return [];
            }
            const batchId = this.model.getItem('exec.jobState.job_id');

            // this should only use current jobs
            const currentJobs = Jobs.getCurrentJobs(Object.values(jobsById));

            // return only jobs with the appropriate status and that are not the batch parent
            return Object.keys(currentJobs)
                .filter((job_id) => {
                    return statusList.includes(currentJobs[job_id].status) && job_id !== batchId;
                })
                .map((job_id) => {
                    return currentJobs[job_id];
                });
        }
    }

    /**
     * A set of generic message handlers
     *
     * @param {class} Base
     * @returns
     */
    const DefaultHandlerMixin = (Base) =>
        class extends Base {
            constructor(config) {
                // run the constructor for the base class
                super(config);
                this.addDefaultHandlers();
            }

            addDefaultHandlers() {
                const defaultHandlers = {
                    INFO: this.handleJobInfo,
                    RETRY: this.handleJobRetry,
                    STATUS: this.handleJobStatus,
                };

                Object.keys(defaultHandlers).forEach((event) => {
                    const toAdd = {};
                    toAdd[`__default_${jcm.RESPONSES[event]}`] = defaultHandlers[event];
                    this.addEventHandler(jcm.RESPONSES[event], toAdd);
                }, this);
            }

            /**
             * parse job info and update the appropriate part of the model
             *
             * @param {object} message
             */
            handleJobInfo(self, message) {
                const { jobInfo, error } = message;
                if (error) {
                    return;
                }
                self.model.setItem(`exec.jobs.info.${jobInfo.job_id}`, jobInfo);
                self.removeListener(jobInfo.job_id, jcm.RESPONSES.INFO);
            }

            handleJobRetry(self, message) {
                const { job, retry, error } = message;
                if (error) {
                    return;
                }

                // request job updates for the new job
                ['status', 'error'].forEach((type) => {
                    self.addListener(`job-${type}`, [retry.jobState.job_id]);
                });
                self.bus.emit(jcm.REQUESTS.START_UPDATE, {
                    jobId: retry.jobState.job_id,
                });
                // update the model with the job data
                self.updateModel(
                    [job, retry].map((j) => {
                        return j.jobState;
                    })
                );
            }

            /**
             * @param {Object} message
             */
            handleJobStatus(self, message) {
                const { jobState } = message,
                    { status, updated } = jobState,
                    jobId = jobState.job_id;

                // if the job is in a terminal state and cannot be retried,
                // stop listening for updates
                if (Jobs.isTerminalStatus(status) && !Jobs.canRetry(jobState)) {
                    self.removeListener(jobId, jcm.RESPONSES.STATUS);
                    if (status === 'does_not_exist') {
                        self.removeJobListeners(jobId);
                    }
                    self.bus.emit(jcm.REQUESTS.STOP_UPDATE, {
                        jobId,
                    });
                    self.updateModel([jobState]);
                    return;
                }

                // check if the job object has been updated since we last saved it
                const previousUpdate = self.model.getItem(`exec.jobs.byId.${jobId}.updated`);
                if (updated && previousUpdate === updated) {
                    return;
                }

                if (jobState.batch_job) {
                    const missingJobIds = [];
                    // do we have all the children?
                    jobState.child_jobs.forEach((job_id) => {
                        if (!self.model.getItem(`exec.jobs.byId.${job_id}`)) {
                            missingJobIds.push(job_id);
                        }
                    });
                    if (missingJobIds.length) {
                        ['status', 'error', 'info'].forEach((type) => {
                            self.addListener(`job-${type}`, missingJobIds);
                        });
                        self.bus.emit(jcm.REQUESTS.START_UPDATE, {
                            jobIdList: missingJobIds,
                        });
                    }
                }

                // otherwise, update the state
                self.updateModel([jobState]);
            }
        };

    const JobShortcutsMixin = (Base) =>
        class extends Base {
            /* JOB SHORTCUTS */

            /**
             * Request job info and add message listeners
             * @param {array[string]} jobIdList
             */
            requestJobInfo(jobIdList) {
                this.addListener(jcm.RESPONSES.INFO, jobIdList);
                this.bus.emit(jcm.REQUESTS.INFO, { jobIdList });
            }

            /**
             * Request job status and add message listeners
             * @param {array[string]} jobIdList
             */
            requestJobStatus(jobIdList) {
                this.addListener(jcm.RESPONSES.STATUS, jobIdList);
                this.bus.emit(jcm.REQUESTS.STATUS, { jobIdList });
            }
        };

    const JobActionsMixin = (Base) =>
        class extends Base {
            /* JOB ACTIONS */

            /**
             * Cancel or retry a list of jobs
             *
             * @param {string} action - either 'cancel' or 'retry'
             * @param {array} jobIdList
             */
            doJobAction(action, jobIdList) {
                this.bus.emit(jobCommand[action].command, {
                    jobIdList,
                });
                // add the appropriate listener
                this.addListener(jobCommand[action].listener, jobIdList);
            }

            /**
             *
             * @param {object} args with keys
             *      action  {string} the action to perform -- cancel or retry
             *      jobId   {string} job to perform it on
             *
             * @returns {boolean}
             */
            executeActionOnJobId(args) {
                const { action, jobId } = args;
                const jobState = this.model.getItem(`exec.jobs.byId.${jobId}`);
                if (jobState && Jobs.canDo(action, jobState)) {
                    const actionJobId =
                        action === 'retry' && jobState.retry_parent ? jobState.retry_parent : jobId;
                    this.doJobAction(action, [actionJobId]);
                    return true;
                }
                return false;
            }

            /**
             *
             * @param {object} args with keys
             *      action:        {string} action to perform (cancel or retry)
             *      statusList:    {array}  list of statuses to perform it on
             *
             * @returns {Promise} that resolves to false if there is some error with the input or
             * if the user cancels the batch action. If the users confirms the action, the appropriate
             * message will be emitted by the bus.
             */
            executeActionByJobStatus(args) {
                const { action, statusList } = args;
                // valid actions: cancel or retry
                if (!['cancel', 'retry'].includes(action)) {
                    return Promise.resolve(false);
                }

                const jobList = this.getCurrentJobsByStatus(
                    statusList,
                    Jobs.validStatusesForAction[action]
                );
                if (!jobList || !jobList.length) {
                    return Promise.resolve(false);
                }

                return DialogMessages.showDialog({
                    action: `${action}Jobs`,
                    statusList,
                    jobList,
                }).then((confirmed) => {
                    if (confirmed) {
                        const jobIdList =
                            action === 'retry'
                                ? jobList.map((job) => {
                                      // return the retry_parent (if available)
                                      return job.retry_parent || job.job_id;
                                  })
                                : jobList.map((job) => {
                                      return job.job_id;
                                  });
                        this.doJobAction(action, jobIdList);
                    }
                    return Promise.resolve(confirmed);
                });
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
                    statusList,
                    validStatuses: Jobs.validStatusesForAction.cancel,
                });
            }

            /**
             * Retry all jobs that ended with the specified status(es)
             * Although only jobs in status 'error' or 'terminated' can be retried,
             * the frontend job status may be out of date, so it is left to ee2 to
             * verify whether a job can be retried or not.
             *
             * @param {array} statusList - array of statuses to retry
             */
            retryJobsByStatus(statusList) {
                return this.executeActionByJobStatus({
                    action: 'retry',
                    statusList,
                    validStatuses: Jobs.validStatusesForAction.retry,
                });
            }

            /**
             * Cancel a batch job by submitting a cancel request for the batch job container
             *
             * This action is triggered by hitting the 'Cancel' button at the top right of the
             * bulk cell
             */
            cancelBatchJob() {
                const batchId = this.model.getItem('exec.jobState.job_id');
                if (batchId) {
                    this.doJobAction('cancel', [batchId]);
                }
                this.resetJobs();
            }

            /**
             * Reset the job manager, removing all listeners and stored job data
             */
            resetJobs() {
                const allJobs = this.model.getItem('exec.jobs.byId'),
                    batchJob = this.model.getItem('exec.jobState');
                if (!allJobs || !Object.keys(allJobs).length) {
                    this.model.deleteItem('exec');
                    return;
                }

                if (batchJob && !allJobs[batchJob.job_id]) {
                    allJobs[batchJob.job_id] = batchJob;
                }

                this.bus.emit(jcm.REQUESTS.STOP_UPDATE, {
                    batchId: batchJob.job_id,
                });

                // ensure that job updates are turned off and listeners removed
                Object.keys(allJobs).forEach((jobId) => {
                    this.removeJobListeners(jobId);
                });

                this.model.deleteItem('exec');
            }
        };

    const BatchInitMixin = (Base) =>
        class extends Base {
            /**
             * set up the job manager to handle a batch job
             *
             * @param {object} batchJob - with keys
             *        {string} batch_id
             *        {array}  child_job_ids
             */
            initBatchJob(batchJob) {
                const { batch_id, child_job_ids } = batchJob;

                if (
                    !batch_id ||
                    !child_job_ids ||
                    Object.prototype.toString.call(child_job_ids) !== '[object Array]' ||
                    !child_job_ids.length
                ) {
                    throw new Error('Batch job must have a batch ID and at least one child job ID');
                }
                const allJobIds = [batch_id].concat(child_job_ids),
                    // create the child jobs
                    allJobs = child_job_ids.map((job_id) => {
                        return {
                            job_id: job_id,
                            batch_id: batch_id,
                            status: 'created',
                            created: 0,
                        };
                    });

                // add the parent job
                allJobs.push({
                    job_id: batch_id,
                    batch_id: batch_id,
                    batch_job: true,
                    child_jobs: [],
                    status: 'created',
                    created: 0,
                });

                Jobs.populateModelFromJobArray(this.model, Object.values(allJobs));

                this._initJobs({ allJobIds, batchId: batch_id });

                // request job info
                this.addListener(jcm.RESPONSES.INFO, allJobIds);
                this.bus.emit(jcm.REQUESTS.INFO, { batchId: batch_id });
            }

            _initJobs(args) {
                const { allJobIds, batchId } = args;

                ['status', 'error'].forEach((type) => {
                    this.addListener(`job-${type}`, allJobIds);
                });
                // request job updates
                this.bus.emit(jcm.REQUESTS.START_UPDATE, { batchId });
            }

            restoreFromSaved() {
                const batchJob = this.model.getItem('exec.jobState'),
                    allJobs = this.model.getItem('exec.jobs.byId');
                if (!batchJob || !allJobs) {
                    return;
                }

                // make sure that all the child jobs of batchJob are in allJobs
                if (batchJob.child_jobs && batchJob.child_jobs.length) {
                    batchJob.child_jobs.forEach((job_id) => {
                        if (!allJobs[job_id]) {
                            allJobs[job_id] = { job_id };
                        }
                    });
                }

                this._initJobs({
                    batchId: batchJob.job_id,
                    allJobIds: Object.keys(allJobs),
                });

                return this.getFsmStateFromJobs();
            }

            /**
             * Use the current jobs to work out the FSM state
             * @returns {string} bulk import cell FSM state
             */
            getFsmStateFromJobs() {
                return Jobs.getFsmStateFromJobs(this.model.getItem('exec.jobs'));
            }
        };

    class JobManager extends BatchInitMixin(
        JobActionsMixin(JobShortcutsMixin(DefaultHandlerMixin(JobManagerCore)))
    ) {}

    return {
        JobManagerCore,
        DefaultHandlerMixin,
        JobShortcutsMixin,
        JobActionsMixin,
        BatchInitMixin,
        JobManager,
    };
});
