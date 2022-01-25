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
 *    comm channel where it gets heard by a capturing function in biokbase.narrative.jobs.jobcomm
 *
 * These messages are asynchronous by design. They're meant to be requests that get responses
 * eventually.
 *
 * From the back end to the front, the flow is slightly different. On Comm channel creation time,
 * the handleCommMessages function is set up as the callback for anything that comes across the
 * channel to the front end. Each of these has a message type associated with it.
 *
 * 1. The type is interpreted (a big ol' switch statement) and responded to.
 * 2. Responses (job status updates, log messages) are "addressed" using either a job or a cell
 *    ID and a message type. Any frontend component with a listener of the appropriate type on
 *    the appropriate channel can pick up and act upon the content of the messages.
 */
define([
    'bluebird',
    'util/developerMode',
    'util/util',
    'base/js/namespace',
    'common/runtime',
    'common/jobs',
    'common/jobCommMessages',
    'services/kernels/comm',
    'common/semaphore',
], (Promise, devMode, Utils, Jupyter, Runtime, Jobs, jcm, JupyterComm, Semaphore) => {
    'use strict';

    const COMM_NAME = 'KBaseJobs',
        { CHANNEL, PARAM, REQUESTS, RESPONSES } = jcm;

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
            this.validationFn = {
                [RESPONSES.INFO]: Jobs.isValidJobInfoObject,
                [RESPONSES.LOGS]: Jobs.isValidJobLogsObject,
                [RESPONSES.STATUS]: Jobs.isValidBackendJobStateObject,
                [RESPONSES.STATUS_ALL]: Jobs.isValidBackendJobStateObject,
                [RESPONSES.RETRY]: Jobs.isValidJobRetryObject,
            };
        }

        /**
         * Sends a message over the bus. The channel should have a single key of either
         * cell or job ID.
         * @param {string} channelType - either CELL or JOB
         * @param {string} channelId - id for the channel
         * @param {string} msgType - one of the msg types
         * @param {any} message
         */
        sendBusMessage(channelType, channelId, msgType, message) {
            const channel = {
                [channelType]: channelId,
            };
            this.runtime.bus().send(JSON.parse(JSON.stringify(message)), {
                channel,
                key: {
                    type: msgType,
                },
            });
            this.debug(`sending bus message: ${channelType} ${channelId} ${msgType}`);
        }

        /**
         * Registers callbacks for handling bus messages. This listens to the global runtime
         * bus, and relays requests from frontend components to the narrative backend to be
         * completed by the kernel.
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

            if (!Object.values(REQUESTS).includes(msgType)) {
                throw new Error(`Ignoring unknown message type "${msgType}"`);
            }

            return Object.assign(
                {},
                {
                    target_name: COMM_NAME,
                    request_type: msgType,
                },
                msgData
            );
        }

        /**
         * Sends the messages in this.messageQueue to the JobManager in the kernel.
         * If there's no comm channel ready, the message will be added to the
         * message queue.
         *
         * If no arguments are supplied to sendCommMessage, the stored messages (if any)
         * will be sent.
         *
         * @param {string}  msgType - message type; will be one of the
         *                  values in the jcm.REQUESTS object (optional)
         *
         * @param {object}  msgData - additional parameters for the request,
         *                  such as one of the values in the jcm.PARAM object or
         *                  a request-specific param (optional)
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
         * where msg_type is one of the values of jcm.RESPONSES
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

            this.debug(`received ${msgType} from backend`);
            switch (msgType) {
                case 'start':
                    break;

                case RESPONSES.NEW:
                    Jupyter.narrative.saveNarrative();
                    break;

                // CELL messages
                case RESPONSES.RUN_STATUS:
                    this.sendBusMessage(
                        CHANNEL.CELL,
                        msgData.cell_id,
                        RESPONSES.RUN_STATUS,
                        msgData
                    );
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
                case RESPONSES.ERROR:
                    console.error('Error from job comm:', msg);
                    if (!msgData) {
                        break;
                    }
                    // treat messages relating to single jobs as if they were for a job list
                    // eslint-disable-next-line no-case-declarations
                    const jobIdList = msgData[PARAM.JOB_ID]
                        ? [msgData[PARAM.JOB_ID]]
                        : msgData[PARAM.JOB_ID_LIST];

                    jobIdList.forEach((_jobId) => {
                        this.sendBusMessage(CHANNEL.JOB, _jobId, msgType, {
                            [PARAM.JOB_ID]: _jobId,
                            error: msgData,
                            request: msgData.source,
                        });
                    });
                    break;

                // job information for one or more jobs
                case RESPONSES.INFO:
                case RESPONSES.LOGS:
                case RESPONSES.RETRY:
                case RESPONSES.STATUS:
                case RESPONSES.STATUS_ALL:
                    Object.keys(msgData).forEach((_jobId) => {
                        const jobData = msgData[_jobId];
                        if (this.validationFn[msgType](jobData)) {
                            this.sendBusMessage(
                                CHANNEL.JOB,
                                _jobId,
                                // send out STATUS messages from a STATUS_ALL message
                                msgType === RESPONSES.STATUS_ALL ? RESPONSES.STATUS : msgType,
                                msgData[_jobId]
                            );
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

    return JobCommChannel;
});
