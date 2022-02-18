define([
    'underscore',
    'common/dialogMessages',
    'common/jobCommMessages',
    'common/jobs',
    'common/looper',
    'util/util',
], (_, DialogMessages, jcm, Jobs, Looper, Utils) => {
    'use strict';

    const validOutgoingMessageTypes = Object.values(jcm.RESPONSES);

    const jobCommand = {
        cancel: jcm.MESSAGE_TYPE.CANCEL,
        retry: jcm.MESSAGE_TYPE.RETRY,
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
            // bus listeners, indexed by channel ID then message msgType
            this.listeners = {};
        }

        _isValidEvent(event) {
            return event && validOutgoingMessageTypes.concat('modelUpdate').includes(event);
        }

        _isValidMessage(msgType, message) {
            switch (msgType) {
                case jcm.MESSAGE_TYPE.RUN_STATUS:
                    return Jobs.isValidRunStatusObject(message);
                case jcm.MESSAGE_TYPE.STATUS:
                    return Object.values(message).every((val) => {
                        return Jobs.isValidBackendJobStateObject(val);
                    });
                case jcm.MESSAGE_TYPE.INFO:
                    return Object.values(message).every((val) => {
                        return Jobs.isValidJobInfoObject(val);
                    });
                case jcm.MESSAGE_TYPE.LOGS:
                    return Object.values(message).every((val) => {
                        return Jobs.isValidJobLogsObject(val);
                    });
                case jcm.MESSAGE_TYPE.RETRY:
                    return Object.values(message).every((val) => {
                        return Jobs.isValidJobRetryObject(val);
                    });
                case msgType.indexOf('job') !== -1:
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
         * jm.addEventListener(jcm.MESSAGE_TYPE.STATUS, {
         *      handlerA: () => {}, // this function gets added to the job manager
         *      handlerB: null,     // this handler function is expected to exist
         * })
         * // handlers assumed to already exist:
         * jm.addEventListener(jcm.MESSAGE_TYPE.ERROR, ['handlerA', 'handlerB']);
         */

        addEventHandler(event, handlers) {
            if (!this._isValidEvent(event)) {
                throw new Error(`addEventHandler: invalid event ${event} supplied`);
            }

            const handlersType = Utils.objectToString(handlers) || null;

            if (!handlers || (handlersType !== 'Array' && handlersType !== 'Object')) {
                throw new Error(
                    'addEventHandler: invalid handlers supplied (must be of type array or object)'
                );
            }

            if (handlersType === 'Array') {
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
         *              `handlerFn` will replace the existing function. If the existing
         *              function can be used, `null` can be supplied.
         *
         * Example:
         *
         * jm.addEventListener(jcm.MESSAGE_TYPE.STATUS, {
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
                // this handler can be used unchanged
                if (handlerFn === null) {
                    return;
                }
                // otherwise, replace the handler
                console.warn(`Replaced existing ${handlerName} handler`);
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
            const ctx = this;
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
                        this.handlers[event][handlerName](ctx, ...args);
                    } catch (err) {
                        console.warn(`Error executing handler ${handlerName}:`, err);
                    }
                });
        }

        /* LISTENERS */

        _encodeChannel(channelType, channelId) {
            return JSON.stringify({ [channelType]: channelId });
        }

        _decodeChannel(channel) {
            const decoded = JSON.parse(channel);
            return {
                channelType: Object.keys(decoded)[0],
                channelId: Object.values(decoded)[0],
            };
        }

        /**
         * Add a bus listener for ${event} messages
         *
         * @param {string} msgType - a valid message type to listen for (see validOutgoingMessageTypes)
         * @param {string} channelType - the channel type to listen to (one of the values in jcm.CHANNEL)
         * @param {array}  channelList - array of channels (job or cell IDs) to apply the listener to
         * @param {object} handlerObject (optional) - object with key(s) handler name and value(s) function to execute on receiving a message
         */
        addListener(msgType, channelType, channelList, handlerObject) {
            if (!validOutgoingMessageTypes.includes(msgType)) {
                throw new Error(`addListener: invalid listener ${msgType} supplied`);
            }

            if (!Object.values(jcm.CHANNEL).includes(channelType)) {
                throw new Error(`addListener: invalid channel type ${channelType} supplied`);
            }

            if (Utils.objectToString(channelList) !== 'Array') {
                channelList = [channelList];
            }

            channelList
                .filter((channelId) => {
                    return channelId && channelId.length > 0 ? 1 : 0;
                })
                .forEach((channelId) => {
                    const channelString = this._encodeChannel(channelType, channelId);

                    if (!this.listeners[channelString]) {
                        this.listeners[channelString] = {};
                    }
                    if (!this.listeners[channelString][msgType]) {
                        const channelObject = { [channelType]: channelId };

                        // listen for job-related bus messages
                        this.listeners[channelString][msgType] = this.bus.listen({
                            channel: channelObject,
                            key: {
                                type: msgType,
                            },
                            handle: (message) => {
                                if (!this._isValidMessage(msgType, message)) {
                                    console.warn('invalid message', msgType, message);
                                    return;
                                }
                                this.runHandler(msgType, message, {
                                    channelType,
                                    channelId,
                                });
                            },
                        });
                    }
                });

            // add the handler -- the message type is used as the event
            if (handlerObject) {
                this.addEventHandler(msgType, handlerObject);
            }
        }

        /**
         * Remove the listener for ${msgType} messages for a channel
         *
         * @param {string} channelType
         * @param {string} channelId
         * @param {string} msgType - the msgType of the listener
         */
        removeListener(channelType, channelId, msgType) {
            const channelString = this._encodeChannel(channelType, channelId);
            try {
                this.bus.removeListener(this.listeners[channelString][msgType]);
                delete this.listeners[channelString][msgType];
            } catch (err) {
                // do nothing
            }
        }

        /**
         * Remove all listeners associated with a certain channel ID
         * @param {string} channelType
         * @param {string} channelId
         */
        removeChannelListeners(channelType, channelId) {
            const channelString = this._encodeChannel(channelType, channelId);
            if (
                this.listeners[channelString] &&
                Object.keys(this.listeners[channelString]).length
            ) {
                Object.keys(this.listeners[channelString]).forEach((msgType) => {
                    this.removeListener(channelType, channelId, msgType);
                });
                delete this.listeners[channelString];
            }
        }

        /**
         * Remove all listeners!
         */

        removeAllListeners() {
            Object.keys(this.listeners).forEach((channelString) => {
                const { channelType, channelId } = this._decodeChannel(channelString);
                this.removeChannelListeners(channelType, channelId);
            });
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
                    toAdd[`__default_${jcm.MESSAGE_TYPE[event]}`] = defaultHandlers[event];
                    this.addEventHandler(jcm.MESSAGE_TYPE[event], toAdd);
                }, this);
            }

            /**
             * parse job info and update the appropriate part of the model
             *
             * @param {object} message
             */
            handleJobInfo(self, message, addressArgs) {
                Object.values(message).forEach((jobInfoMessage) => {
                    if (!jobInfoMessage.error) {
                        const jobId = jobInfoMessage.job_id;
                        self.model.setItem(`exec.jobs.info.${jobId}`, jobInfoMessage);
                        if (addressArgs.channelType === jcm.CHANNEL.JOB) {
                            self.removeListener(jcm.CHANNEL.JOB, jobId, jcm.MESSAGE_TYPE.INFO);
                        }
                    }
                });
            }

            /**
             * update the model with job retry information
             *
             * @param {object} message
             */
            handleJobRetry(self, message, addressArgs) {
                const toUpdate = [],
                    newRetry = [];
                Object.values(message).forEach((jobRetryMessage) => {
                    if (!jobRetryMessage.error) {
                        const { job, retry, retry_id } = jobRetryMessage;
                        if (retry_id) {
                            newRetry.push(retry_id);
                        }
                        [job, retry].forEach((val) => {
                            if (val) {
                                toUpdate.push(val.jobState);
                            }
                        });
                    }
                });
                if (newRetry.length) {
                    // request job updates for the new job
                    self.bus.emit(jcm.MESSAGE_TYPE.STATUS, {
                        [jcm.PARAM.JOB_ID_LIST]: newRetry,
                    });
                    if (addressArgs.channelType === jcm.CHANNEL.JOB) {
                        ['STATUS', 'ERROR'].forEach((msgType) => {
                            self.addListener(jcm.MESSAGE_TYPE[msgType], jcm.CHANNEL.JOB, newRetry);
                        });
                    }
                }
                if (toUpdate.length) {
                    self.updateModel(toUpdate);
                }
            }

            /**
             * @param {Object} message
             */
            handleJobStatus(self, message, addressArgs) {
                const updated = [];
                Object.values(message).forEach((jobStatusMessage) => {
                    if (!jobStatusMessage.error) {
                        updated.push(self._handleJobStatus(jobStatusMessage, addressArgs));
                    }
                });
                // update the state as appropriate
                const toUpdate = updated.filter((job) => {
                    return !!job;
                });
                if (toUpdate.length) {
                    self.updateModel(toUpdate);
                }
            }

            _handleJobStatus(message, addressArgs) {
                const { jobState } = message,
                    { status } = jobState,
                    jobId = jobState.job_id;

                // check if the job object has changed since we last saved it
                const savedState = this.model.getItem(`exec.jobs.byId.${jobId}`);
                if (savedState && _.isEqual(savedState, jobState)) {
                    // return nothing if the state does not need to be updated
                    return;
                }

                // if the job is in a terminal state and cannot be retried,
                // stop listening for updates
                if (Jobs.isTerminalStatus(status) && !Jobs.canRetry(jobState)) {
                    if (addressArgs.channelType === jcm.CHANNEL.JOB) {
                        this.removeListener(jcm.CHANNEL.JOB, jobId, jcm.MESSAGE_TYPE.STATUS);
                        if (status === 'does_not_exist') {
                            this.removeChannelListeners(jcm.CHANNEL.JOB, jobId);
                        }
                    }
                    return jobState;
                }

                if (jobState.batch_job) {
                    const missingJobIds = [];
                    // do we have all the children?
                    jobState.child_jobs.forEach((job_id) => {
                        if (!this.model.getItem(`exec.jobs.byId.${job_id}`)) {
                            missingJobIds.push(job_id);
                        }
                    });
                    if (missingJobIds.length) {
                        if (addressArgs.channelType === jcm.CHANNEL.JOB) {
                            ['STATUS', 'ERROR', 'INFO'].forEach((msgType) => {
                                this.addListener(
                                    jcm.MESSAGE_TYPE[msgType],
                                    jcm.CHANNEL.JOB,
                                    missingJobIds
                                );
                            });
                        }
                        this.bus.emit(jcm.MESSAGE_TYPE.STATUS, {
                            [jcm.PARAM.JOB_ID_LIST]: missingJobIds,
                        });
                    }
                }
                return jobState;
            }
        };

    const JobActionsMixin = (Base) =>
        class extends Base {
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
                        return (
                            statusList.includes(currentJobs[job_id].status) && job_id !== batchId
                        );
                    })
                    .map((job_id) => {
                        return currentJobs[job_id];
                    });
            }

            /* JOB ACTIONS */

            /**
             * Cancel or retry a list of jobs. It is expected that any validation of the job IDs has already been done.
             *
             * @param {string} action - either 'cancel' or 'retry'
             * @param {array} jobIdList
             */
            doJobAction(action, jobIdList) {
                this.bus.emit(jobCommand[action], { [jcm.PARAM.JOB_ID_LIST]: jobIdList });
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
        };

    const BatchMixin = (Base) =>
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
                    Utils.objectToString(child_job_ids) !== 'Array' ||
                    !child_job_ids.length
                ) {
                    throw new Error('Batch job must have a batch ID and at least one child job ID');
                }
                // create the child jobs
                const allJobs = child_job_ids.map((job_id) => {
                    return {
                        job_id,
                        batch_id,
                        status: 'created',
                        created: 0,
                    };
                });

                // add the parent job
                allJobs.push({
                    job_id: batch_id,
                    batch_id,
                    batch_job: true,
                    child_jobs: [],
                    status: 'created',
                    created: 0,
                });

                Jobs.populateModelFromJobArray(this.model, Object.values(allJobs));
                this._initJobs({ batchId: batch_id });
            }

            _initJobs(args) {
                const { batchId } = args;
                if (!batchId) {
                    throw new Error('Cannot init jobs without a batch ID');
                }

                const self = this;
                ['ERROR', 'INFO', 'LOGS', 'RETRY', 'STATUS'].forEach((msgType) => {
                    this.addListener(jcm.MESSAGE_TYPE[msgType], jcm.CHANNEL.BATCH, batchId);
                });

                if (!this.looper) {
                    this.looper = new Looper();
                }

                // set up repeated requests for batch status
                // on receiving a job status message, this handler will set
                // up a delayed request to request a status update for the batch.
                this.addEventHandler(jcm.MESSAGE_TYPE.STATUS, {
                    batchStatus: () => {
                        self.looper.scheduleRequest(self.requestBatchStatus.bind(self));
                    },
                });
                this.bus.emit(jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.BATCH_ID]: batchId });
                this.requestBatchInfo();
            }

            restoreFromSaved() {
                const batchJob = this.model.getItem('exec.jobState'),
                    allJobs = this.model.getItem('exec.jobs.byId');
                if (!batchJob || !allJobs) {
                    return;
                }

                this._initJobs({
                    batchId: batchJob.job_id,
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

            /**
             * send a message requesting status updates for all
             * non-terminal jobs in the batch
             */
            requestBatchStatus() {
                const jobsById = this.model.getItem('exec.jobs.byId'),
                    batchJob = this.model.getItem('exec.jobState');

                // no stored jobs
                if (!jobsById || !batchJob || !Object.keys(jobsById).length) {
                    return;
                }
                // terminal batch job ==> no updates to child jobs
                if (Jobs.isTerminalStatus(batchJob.status)) {
                    return;
                }

                const batchId = batchJob.job_id;
                // ensure jobsById contains the batch job
                if (!jobsById[batchId]) {
                    jobsById[batchId] = batchJob;
                }

                const jobsToUpdate = Object.values(jobsById)
                    .filter((job) => {
                        return !Jobs.isTerminalStatus(job.status);
                    })
                    .map((job) => {
                        return job.job_id;
                    });

                if (jobsToUpdate.length) {
                    // if the only job to update is the batch job, skip the request
                    if (jobsToUpdate.length === 1 && jobsToUpdate[0] === batchId) {
                        return;
                    }
                    const args = {
                        [jcm.PARAM.JOB_ID_LIST]: jobsToUpdate,
                    };
                    if (this.lastUpdate) {
                        args.timestamp = this.lastUpdate;
                    }
                    this.bus.emit(jcm.MESSAGE_TYPE.STATUS, args);
                }
            }

            /**
             * request job information for any jobs lacking it
             */
            requestBatchInfo() {
                const batchId = this.model.getItem('exec.jobState.job_id'),
                    jobInfo = this.model.getItem('exec.jobs.info');
                if (!jobInfo || !Object.keys(jobInfo).length) {
                    return this.bus.emit(jcm.MESSAGE_TYPE.INFO, { [jcm.PARAM.BATCH_ID]: batchId });
                }

                const jobInfoIds = new Set(Object.keys(jobInfo));
                const missingJobIds = Object.keys(this.model.getItem('exec.jobs.byId')).filter(
                    (jobId) => {
                        return !jobInfoIds.has(jobId);
                    }
                );
                if (missingJobIds.length) {
                    this.bus.emit(jcm.MESSAGE_TYPE.INFO, {
                        [jcm.PARAM.JOB_ID_LIST]: missingJobIds,
                    });
                }
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
                    this.bus.emit(jcm.MESSAGE_TYPE.CANCEL, { [jcm.PARAM.JOB_ID_LIST]: [batchId] });
                    if (this.looper) {
                        this.looper.clearRequest();
                    }
                }
            }

            /**
             * Reset the job manager, removing all listeners and stored job data
             */
            resetJobs() {
                // remove all listeners and cancel any pending job requests
                if (this.looper) {
                    this.looper.clearRequest();
                }
                this.removeAllListeners();
                this.model.deleteItem('exec');
                // emit the reset-cell call
                if (this.cellId) {
                    this.bus.emit('reset-cell', {
                        cellId: this.cellId,
                        ts: Date.now(),
                    });
                }
            }
        };

    class JobManager extends BatchMixin(JobActionsMixin(DefaultHandlerMixin(JobManagerCore))) {}

    return {
        JobManagerCore,
        DefaultHandlerMixin,
        JobActionsMixin,
        BatchMixin,
        JobManager,
    };
});
