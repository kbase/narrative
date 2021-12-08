/**
 * This is the Communication Channel that handles talking between the front end and the kernel.
 * It's used by creating a new JobCommChannel(), then running initCommChannel() on it.
 *
 * i.e.
 * let channel = new JobCommChannel();
 * channel.initCommChannel();
 *
 * This creates a handle on a Jupyter Kernel Comm channel object and holds it.
 * Note that this should only be run once the Kernel is ready (see kbaseNarrative.js for
 * implementation).
 *
 * Communication can flow in two directions. From the front end to the back, that goes
 * like this:
 * 1. An App Cell (or other controller) sends a message over the global bus with some
 *    request.
 * 2. This gets captured by one of the callbacks in handleBusMessages()
 * 3. These all invoke sendCommMessage(). This builds a message packet and sends it across the
 *    comm channel where it gets heard by a capturing function in biokbase.narrative.jobmanager.
 * ...that's it. These messages are asynchronous by design. They're meant to be requests that
 * get responses eventually.
 *
 * From the back end to the front, the flow is slightly different. On Comm channel creation time,
 * the handleCommMessages function is set up as the callback for anything that comes across the
 * channel to the front end. Each of these has a message type associated with it.
 * 1. The type is interepreted (a big ol' switch statement) and responded to.
 * 2. Most responses (job status updates, log messages) are parceled out to the App Cells that
 *    invoked them. Or, really, anything listening on the appropriate channel (either the cell,
 *    or the job id)
 */
define([
    'bluebird',
    'jquery',
    'handlebars',
    'kbaseAccordion',
    'util/bootstrapDialog',
    'util/developerMode',
    'util/util',
    'base/js/namespace',
    'common/runtime',
    'common/jobs',
    'services/kernels/comm',
    'common/semaphore',
    'text!kbase/templates/job_panel/job_init_error.html',
], (
    Promise,
    $,
    Handlebars,
    kbaseAccordion,
    BootstrapDialog,
    devMode,
    Utils,
    Jupyter,
    Runtime,
    Jobs,
    JupyterComm,
    Semaphore,
    JobInitErrorTemplate
) => {
    'use strict';

    const COMM_NAME = 'KBaseJobs',
        CELL = 'cell',
        JOB = 'jobId',
        JOB_ID = 'job_id',
        JOB_ID_LIST = 'job_id_list',
        // commands
        CANCEL = 'cancel_job',
        CELL_JOB_STATUS = 'cell_job_status',
        ERROR = 'job_error',
        INFO = 'job_info',
        LOGS = 'job_logs',
        RETRY = 'retry_job',
        RUN_STATUS = 'run_status',
        START_UPDATE = 'start_job_update',
        STATUS = 'job_status',
        STATUS_ALL = 'job_status_all',
        STOP_UPDATE = 'stop_job_update',
        // messages to be sent to backend for job request types
        REQUESTS = {
            // cancels the job
            CANCEL: 'request-job-cancel',

            // Requests status of all jobs in a cell or list of cells
            CELL_JOB_STATUS,

            // Fetches info (not state) about a job, including the app id, name, and inputs.
            INFO: 'request-job-info',

            // Fetches job logs from kernel.
            LOGS: 'request-job-log',

            // retries the job
            RETRY: 'request-job-retry',

            // Request regular job status updates for a job or list of jobs
            START_UPDATE: 'request-job-updates-start',

            // Fetches job status from kernel.
            STATUS: 'request-job-status',

            // Tells kernel to stop including a job in the regular job status updates
            STOP_UPDATE: 'request-job-updates-stop',
        },
        BACKEND_REQUESTS = {
            CANCEL,
            CELL_JOB_STATUS,
            INFO,
            LOGS,
            RETRY,
            START_UPDATE,
            STATUS,
            STOP_UPDATE,
        },
        BACKEND_RESPONSES = {
            CELL_JOB_STATUS,
            ERROR,
            INFO,
            LOGS,
            RETRY,
            RUN_STATUS,
            STATUS,
            STATUS_ALL,
        },
        RESPONSES = {
            CELL_JOB_STATUS,
            ERROR: 'job-error',
            INFO: 'job-info',
            LOGS: 'job-logs',
            RETRY: 'job-retry-response',
            RUN_STATUS: 'run-status',
            STATUS: 'job-status',
        },
        // these job request types also have a 'batch' version
        batchRequests = ['INFO', 'STATUS', 'START_UPDATE', 'STOP_UPDATE'],
        BATCH_BACKEND_REQUESTS = {};
    // the batch version of BACKEND_REQUESTS[type]
    batchRequests.forEach((type) => {
        BATCH_BACKEND_REQUESTS[BACKEND_REQUESTS[type]] = BACKEND_REQUESTS[type] + '_batch';
    });

    // Conversion of the message type of an incoming message
    // to the type used for the message to be sent to the backend
    const requestTranslation = {};

    Object.keys(REQUESTS).forEach((type) => {
        requestTranslation[REQUESTS[type]] = BACKEND_REQUESTS[type];
    });

    const JobCommMessages = {
        validIncomingMessageTypes: function () {
            return Object.values(REQUESTS);
        },
        validOutgoingMessageTypes: function () {
            return Object.values(RESPONSES);
        },
        RESPONSES,
        REQUESTS,
        BACKEND_REQUESTS,
        BACKEND_RESPONSES,
    };

    class JobCommChannel {
        /**
         * Grabs the runtime, inits the set of job states, and registers callbacks against the
         * main Bus.
         */
        constructor(config = {}) {
            this.runtime = Runtime.make();
            this.handleBusMessages();
            this.devMode = config.devMode || devMode.mode;
            this.debug = this.devMode
                ? (...args) => {
                      // eslint-disable-next-line no-console
                      console.log(...args);
                  }
                : () => {
                      /* no op */
                  };

            this.messageQueue = [];
            this.ERROR_COMM_CHANNEL_NOT_INIT = 'Comm channel not initialized, not sending message.';

            // set up validators for incoming backend job messages
            this.validationFn = {};
            this.validationFn[BACKEND_RESPONSES.INFO] = Jobs.isValidJobInfoObject;
            this.validationFn[BACKEND_RESPONSES.LOGS] = Jobs.isValidJobLogsObject;
            this.validationFn[BACKEND_RESPONSES.STATUS] = Jobs.isValidBackendJobStateObject;
            this.validationFn[BACKEND_RESPONSES.STATUS_ALL] = Jobs.isValidBackendJobStateObject;
            this.validationFn[BACKEND_RESPONSES.RETRY] = Jobs.isValidJobRetryObject;
        }

        /**
         * Sends a message over the bus. The channel should have a single key of either
         * cell or jobId.
         * @param {string} channelName - either CELL or JOB
         * @param {string} channelId - id for the channel
         * @param {string} msgType - one of the msg types
         * @param {any} message
         */
        sendBusMessage(channelName, channelId, msgType, message) {
            const channel = {};
            channel[channelName] = channelId;
            this.runtime.bus().send(JSON.parse(JSON.stringify(message)), {
                channel,
                key: {
                    type: msgType,
                },
            });
            this.debug(`sending bus message: ${channelName} ${channelId} ${msgType}`);
        }

        /**
         * Registers callbacks for handling bus messages. This listens to the global runtime bus.
         * Mostly, it relays bus messages into comm channel requests that are satisfied by the
         * kernel.
         */
        handleBusMessages() {
            const bus = this.runtime.bus();

            Object.values(REQUESTS).forEach((msgType) => {
                bus.on(msgType, (msgData) => {
                    this.sendCommMessage(msgType, msgData);
                });
            });
        }

        /**
         * transform a message received from the frontend to the format
         * expected by the backend
         * @param {object} rawMessage with key/values:
         *
         *      {string} msgType
         *      {object} msgData
         */
        _transformMessage(rawMessage) {
            const { msgType, msgData } = rawMessage;

            if (!requestTranslation[msgType]) {
                throw new Error(`Ignoring unknown message type "${msgType}"`);
            }

            const transformedMsg = {
                target_name: COMM_NAME,
                request_type: requestTranslation[msgType],
            };

            const translations = {
                // backend uses `job_id` instead of `batch_id`
                batchId: JOB_ID,
                batch_id: JOB_ID,
                jobId: JOB_ID,
                jobIdList: JOB_ID_LIST,
            };

            for (const [key, value] of Object.entries(msgData)) {
                const msgKey = translations[key] || key;
                transformedMsg[msgKey] = value;
                // convert to the batch form of the request
                if (
                    (key === 'batchId' || key === 'batch_id') &&
                    BATCH_BACKEND_REQUESTS[transformedMsg.request_type]
                ) {
                    transformedMsg.request_type =
                        BATCH_BACKEND_REQUESTS[transformedMsg.request_type];
                }
            }

            return transformedMsg;
        }

        /**
         * Sends the messages in this.messageQueue to the JobManager in the kernel.
         * If there's no comm channel ready, the message will be added to the
         * message queue.
         *
         * If no arguments are supplied to sendCommMessage, the stored messages (if any)
         * will be sent.
         *
         * @param {string} msgType - message type; will be one of the
         *                 values in the REQUESTS object (optional)
         *
         * @param {object} msgData - additional parameters for the request,
         *                 such as jobId or jobIdList, or an 'options' object (optional)
         */
        sendCommMessage(msgType, msgData) {
            if (msgType && msgData) {
                this.messageQueue.push({ msgType, msgData });
            }
            return this._sendCommMessages();
        }

        /**
         * Sends the messages in this.messageQueue to the JobManager in the kernel.
         * If there's no comm channel ready, the message will be added to the
         * message queue.
         *
         * If no arguments are supplied to sendCommMessage, the stored messages (if any)
         * will be sent.
         */

        _sendCommMessages() {
            let topMessage;
            return Promise.try(() => {
                if (!this.comm) {
                    // TODO: try to init comm channel here
                    throw new Error('Comm channel not initialized, not sending message.');
                }
                while (this.messageQueue.length) {
                    topMessage = this.messageQueue.shift();
                    this.comm.send(this._transformMessage(topMessage));
                    this.debug(`sending comm message: ${COMM_NAME} ${topMessage.msgType}`);
                }
            }).catch((err) => {
                console.error('ERROR sending comm message', err.message, err, topMessage);
                throw new Error('ERROR sending comm message: ' + err.message);
            });
        }

        /**
         * Callback attached to the comm channel. This gets called with the message when
         * a message is passed.
         * The message is expected to have the following structure (at a minimum):
         * {
         *   content: {
         *     data: {
         *       msg_type: string,
         *       content: object
         *     }
         *   }
         * }
         * Where msg_type is one of:
         * start, new_job, job_status, job_status_all, job_comm_err, job_init_err, job_init_lookup_err,
         * or any of the values of BACKEND_RESPONSES
         *
         * @param {object} msg
         */
        handleCommMessages(msg) {
            const msgType = msg.content.data.msg_type;
            const msgData = msg.content.data.content;
            const msgDataType = Utils.objectToString(msgData);

            // message data should be an object
            if (msgDataType !== 'Object') {
                return this.reportCommMessageError({ msgType, msgData });
            }

            let msgTypeToSend = null;
            this.debug(`received ${msgType} from backend`);
            switch (msgType) {
                case 'start':
                    break;

                case 'new_job':
                    Jupyter.narrative.saveNarrative();
                    break;

                // CELL messages
                case BACKEND_RESPONSES.RUN_STATUS:
                    this.sendBusMessage(CELL, msgData.cell_id, RESPONSES.RUN_STATUS, msgData);
                    break;

                // JOB messages
                // Send job-related notifications on the default channel,
                // with a key on the message type and the job id.
                // This allows widgets which are interested in the job
                // to subscribe to just that job, and nothing else.
                // If there is a need for a generic broadcast message, we
                // can either send a second message or implement key
                // filtering.
                //
                // errors
                case BACKEND_RESPONSES.ERROR:
                    console.error('Error from job comm:', msg);
                    if (!msgData) {
                        break;
                    }
                    // treat messages relating to single jobs as if they were for a job list
                    // eslint-disable-next-line no-case-declarations
                    const jobIdList = msgData[JOB_ID] ? [msgData[JOB_ID]] : msgData[JOB_ID_LIST];
                    if (msgData.source === BACKEND_REQUESTS.LOGS) {
                        msgTypeToSend = RESPONSES.LOGS;
                    } else {
                        msgTypeToSend = RESPONSES.ERROR;
                    }

                    jobIdList.forEach((_jobId) => {
                        this.sendBusMessage(JOB, _jobId, msgTypeToSend, {
                            jobId: _jobId,
                            error: msgData,
                            request: msgData.source,
                        });
                    });
                    break;

                case 'job_init_err':
                case 'job_init_lookup_err':
                    this.displayJobError(msgData);
                    console.error('Error from job comm:', msg);
                    break;

                // job information for one or more jobs
                case BACKEND_RESPONSES.INFO:
                    Object.keys(msgData).forEach((_jobId) => {
                        const jobData = msgData[_jobId];
                        if (this.validationFn[msgType](jobData)) {
                            this.sendBusMessage(JOB, _jobId, RESPONSES.INFO, jobData);
                        } else {
                            this.reportCommMessageError({ msgType, msgData: jobData });
                        }
                    });
                    break;

                case BACKEND_RESPONSES.LOGS:
                    Object.keys(msgData).forEach((_jobId) => {
                        const jobData = msgData[_jobId];
                        if (this.validationFn[msgType](jobData)) {
                            this.sendBusMessage(JOB, _jobId, RESPONSES.LOGS, jobData);
                        } else {
                            this.reportCommMessageError({ msgType, msgData: jobData });
                        }
                    });
                    break;

                case BACKEND_RESPONSES.RETRY:
                    Object.keys(msgData).forEach((_jobId) => {
                        const jobData = msgData[_jobId];
                        if (this.validationFn[msgType](jobData)) {
                            this.sendBusMessage(JOB, _jobId, RESPONSES.RETRY, jobData);
                        } else {
                            this.reportCommMessageError({ msgType, msgData: jobData });
                        }
                    });
                    break;

                /*
                 * The job status for one or more jobs.
                 * The job_status_all message covers all active jobs.
                 *
                 * data structure: object with key jobId and value
                 * { jobState: job.jobState, outputWidgetInfo: job.outputWidgetInfo }
                 */
                case BACKEND_RESPONSES.STATUS:
                case BACKEND_RESPONSES.STATUS_ALL:
                    Object.keys(msgData).forEach((_jobId) => {
                        const jobData = msgData[_jobId];
                        if (this.validationFn[msgType](jobData)) {
                            this.sendBusMessage(JOB, _jobId, RESPONSES.STATUS, jobData);
                        } else {
                            this.reportCommMessageError({ msgType, msgData: jobData });
                        }
                    });
                    break;

                default:
                    console.warn(
                        `Unhandled KBaseJobs message from kernel (type='${msgType}'):`,
                        msg
                    );
            }
        }

        reportCommMessageError(message) {
            const { msgType, msgData } = message;
            console.error(
                'Invalid message data error',
                `message type ${msgType} with data`,
                msgData
            );
        }

        displayJobError(msgData) {
            // code, error, job_id (opt), message, name, source
            const $modalBody = $(Handlebars.compile(JobInitErrorTemplate)(msgData));
            const modal = new BootstrapDialog({
                title: 'Job Initialization Error',
                body: $modalBody,
                buttons: [
                    $('<a type="button" class="btn btn-default kb-job-err-dialog__button">')
                        .append('OK')
                        .click(() => {
                            modal.hide();
                        }),
                ],
            });
            new kbaseAccordion($modalBody.find('div#kb-job-err-trace'), {
                elements: [
                    {
                        title: 'Detailed Error Information',
                        body: $(
                            '<table class="table table-bordered"><tr><th>code:</th><td>' +
                                msgData.code +
                                '</td></tr>' +
                                '<tr><th>error:</th><td>' +
                                msgData.message +
                                '</td></tr>' +
                                (function () {
                                    if (msgData.service) {
                                        return (
                                            '<tr><th>service:</th><td>' +
                                            msgData.service +
                                            '</td></tr>'
                                        );
                                    }
                                    return '';
                                })() +
                                '<tr><th>type:</th><td>' +
                                msgData.name +
                                '</td></tr>' +
                                '<tr><th>source:</th><td>' +
                                msgData.source +
                                '</td></tr></table>'
                        ),
                    },
                ],
            });

            $modalBody.find('button#kb-job-err-report').click(() => {
                // no action
            });
            modal.getElement().on('hidden.bs.modal', () => {
                modal.destroy();
            });
            modal.show();
        }

        /**
         * Initializes the comm channel to the back end. Stores the generated
         * channel in this.comm.
         * Returns a Promise that should resolve when the channel's ready. But
         * the nature of setting these up means that a nested Promise gets made by
         * the Jupyter kernel front-end and not necessarily returned.
         *
         * Thus, it uses a semaphore lock. When the semaphore becomes ready, it
         * gets signaled.
         *
         * Once ready, this starts a kernel call (over the main channel, not the
         * new comm) to initialize the JobManager and have it fetch the set of
         * running jobs from the execution engine. If it's already running, this
         * overwrites everything.
         */
        initCommChannel() {
            const _this = this;
            _this.comm = null;
            const commSemaphore = Semaphore.make();
            commSemaphore.add('comm', false);
            return new Promise((resolve) => {
                // First we check to see if our comm channel already
                // exists. If so, we do some funny business to create a
                // new client side for it, register it, and set up our
                // handler on it.
                Jupyter.notebook.kernel.comm_info(COMM_NAME, (msg) => {
                    if (msg.content && msg.content.comms) {
                        // skim the reply for the right id
                        for (const id in msg.content.comms) {
                            if (msg.content.comms[id].target_name === COMM_NAME) {
                                _this.comm = new JupyterComm.Comm(COMM_NAME, id);
                                Jupyter.notebook.kernel.comm_manager.register_comm(_this.comm);
                                _this.comm.on_msg(_this.handleCommMessages.bind(_this));
                            }
                        }
                    }
                    resolve();
                });
            })
                .then(() => {
                    // If no existing comm channel could be hooked up to, we have an alternative
                    // strategy, apparently. We register our channel endpoint, even though there is
                    // no back end yet, and our next call to utilize it below will create it.
                    if (_this.comm) {
                        commSemaphore.set('comm', 'ready');
                        return;
                    }
                    return Promise.try(() => {
                        Jupyter.notebook.kernel.comm_manager.register_target(COMM_NAME, (comm) => {
                            _this.comm = comm;
                            comm.on_msg(_this.handleCommMessages.bind(_this));
                            commSemaphore.set('comm', 'ready');
                        });
                    });
                })
                .then(() => {
                    return new Promise((resolve, reject) => {
                        const callbacks = {
                            shell: {
                                reply: function (reply) {
                                    if (!reply.content.error) {
                                        return resolve();
                                    }
                                    console.error('ERROR executing jobInit', reply);
                                    commSemaphore.set('comm', 'error');
                                    reject(
                                        new Error(reply.content.name + ': ' + reply.content.evalue)
                                    );
                                },
                            },
                        };
                        Jupyter.notebook.kernel.execute(_this.getJobInitCode(), callbacks);
                        if (_this.messageQueue.length) {
                            _this.sendCommMessage();
                        }
                    });
                });
        }

        getJobInitCode() {
            const currentCells = Jupyter.notebook
                .get_cells()
                .map((cell) => {
                    try {
                        return cell.metadata.kbase.attributes.id;
                    } catch (e) {
                        // do nothing
                    }

                    return null;
                })
                .filter((cellId) => !!cellId);

            return [
                'from biokbase.narrative.jobs.jobcomm import JobComm',
                'cell_list = ' + JSON.stringify(currentCells),
                // DATAUP-575: temporarily removing cell_list
                'JobComm().start_job_status_loop(cell_list=cell_list, init_jobs=True)',
            ].join('\n');
        }
    }

    return { JobCommChannel, JobCommMessages };
});
