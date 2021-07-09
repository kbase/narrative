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
    'base/js/namespace',
    'common/runtime',
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
    Jupyter,
    Runtime,
    JupyterComm,
    Semaphore,
    JobInitErrorTemplate
) => {
    'use strict';

    const COMM_NAME = 'KBaseJobs',
        JOB_STATUS = 'job_status',
        STOP_JOB_UPDATE = 'stop_job_update',
        START_JOB_UPDATE = 'start_job_update',
        CANCEL_JOB = 'cancel_job',
        RETRY_JOB = 'retry_job',
        JOB_LOGS = 'job_logs',
        JOB_INFO = 'job_info',
        JOB = 'jobId',
        CELL = 'cell';

    // Conversion of the message type of an incoming message
    // to the type used for the message to be sent to the backend
    const requestTranslation = {
        'ping-comm-channel': 'ping',

        // Fetches job status from kernel.
        'request-job-status': JOB_STATUS,

        // Requests job status updates for this job via the job channel, and also
        // ensures that job polling is running.
        'request-job-updates-start': START_JOB_UPDATE,
        // Tells kernel to stop including a job in the lookup loop.
        'request-job-updates-stop': STOP_JOB_UPDATE,

        // cancels the job
        'request-job-cancellation': CANCEL_JOB,
        // retries the job
        'request-job-retry': RETRY_JOB,

        // Fetches info (not state) about a job, including the app id, name, and inputs.
        'request-job-info': JOB_INFO,

        // Fetches job logs from kernel.
        'request-job-log': JOB_LOGS,
    };

    class JobCommChannel {
        /**
         * Grabs the runtime, inits the set of job states, and registers callbacks against the
         * main Bus.
         */
        constructor(config = {}) {
            this.runtime = Runtime.make();
            this.jobStates = {};
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
        }

        validIncomingMessageTypes() {
            return Object.keys(requestTranslation);
        }

        validOutgoingMessageTypes() {
            return [
                'job-cancel-error',
                'job-canceled',
                'job-does-not-exist',
                'job-error',
                'job-info',
                'job-log-deleted',
                'job-logs',
                'job-status',
                'result',
                'run-status',
            ];
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
                channel: channel,
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

            for (const [key, value] of Object.entries(requestTranslation)) {
                bus.on(key, (message) => {
                    this.sendCommMessage(value, message);
                });
            }
        }

        /**
         * Sends a comm message to the JobManager in the kernel.
         * If there's no comm channel ready, tries to set one up first.
         * @param msgType {string} - one of the values in the requestTranslation object
         *                           (see function handleBusMessages)
         *
         * @param message {object} - an object containing additional parameters for the request
         *                           such as jobId or jobIdList, or an 'options' object
         */
        sendCommMessage(msgType, message) {
            return new Promise((resolve, reject) => {
                // TODO: send specific error so that client can retry.
                if (!this.comm) {
                    console.error('Comm channel not initialized, not sending message.');
                    reject(new Error('Comm channel not initialized, not sending message.'));
                }

                let msg = {
                    target_name: COMM_NAME,
                    request_type: msgType,
                };

                const translations = {
                    jobId: 'job_id',
                    jobIdList: 'job_id_list',
                    pingId: 'ping_id',
                };

                for (const [key, value] of Object.entries(message)) {
                    if (key !== 'options') {
                        const msgKey = translations[key] || key;
                        msg[msgKey] = value;
                    }
                }

                if (message.options) {
                    msg = Object.assign({}, msg, message.options);
                }

                this.comm.send(msg);
                this.debug(`sending comm message: ${COMM_NAME} ${msgType}`);
                resolve();
            }).catch((err) => {
                console.error('ERROR sending comm message', err, msgType, message);
                throw new Error(
                    'ERROR sending comm message: ' +
                        JSON.stringify({
                            error: err,
                            msgType: msgType,
                            message: message,
                        })
                );
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
         * start, new_job, job_status, job_status_all, job_info, run_status, job_err, job_canceled,
         * job_does_not_exist, job_logs, job_comm_err, job_init_err, job_init_partial_err,
         * job_init_lookup_err, result.
         * @param {object} msg
         */
        handleCommMessages(msg) {
            const msgType = msg.content.data.msg_type;
            const msgData = msg.content.data.content;
            let jobId = null;
            switch (msgType) {
                case 'start':
                    break;

                case 'new_job':
                    Jupyter.notebook.save_checkpoint();
                    break;

                // CELL messages
                case 'run_status':
                    // Send job status notifications on the default channel,
                    // with a key on the message type and the job id, sending
                    // a copy of the original message.
                    // This allows widgets which are interested in the job
                    // to subscribe to just that job, and nothing else.
                    // If there is a need for a generic broadcast message, we
                    // can either send a second message or implement key
                    // filtering.
                    this.sendBusMessage(CELL, msgData.cell_id, 'run-status', msgData);
                    break;

                case 'result':
                    this.sendBusMessage(CELL, msgData.address.cell_id, 'result', msgData);
                    break;

                // JOB messages
                case 'job_comm_error':
                    console.error('Error from job comm:', msg);
                    if (!msgData) {
                        break;
                    }
                    jobId = msgData.job_id;
                    switch (msgData.source) {
                        case 'cancel_job':
                            this.sendBusMessage(JOB, jobId, 'job-cancel-error', {
                                jobId,
                                message: msgData.message,
                            });
                            this.sendBusMessage(JOB, jobId, 'job-canceled', {
                                jobId,
                                error: msgData.message,
                            });
                            break;
                        case 'job_logs':
                        case 'job_logs_latest':
                            this.sendBusMessage(JOB, jobId, 'job-log-deleted', {
                                jobId,
                                message: msgData.message,
                            });
                            this.sendBusMessage(JOB, jobId, 'job-logs', {
                                jobId,
                                error: msgData.message,
                            });
                            break;
                        case 'job_retried':
                            this.sendBusMessage(JOB, jobId, 'job-retry-response', {
                                jobId: jobId,
                                error: msgData.message,
                            });
                            break;
                        default:
                            this.sendBusMessage(JOB, jobId, 'job-error', {
                                jobId,
                                message: msgData.message,
                                request: msgData.source,
                            });
                            break;
                    }
                    break;

                case 'job_does_not_exist':
                    if (msgData.source === 'job_status') {
                        this.sendBusMessage(JOB, msgData.job_id, 'job-status', {
                            jobId: msgData.job_id,
                            jobState: {
                                job_id: msgData.job_id,
                                status: 'does_not_exist',
                            },
                        });
                        break;
                    }
                    this.sendBusMessage(JOB, msgData.job_id, 'job-does-not-exist', {
                        jobId: msgData.job_id,
                        source: msgData.source,
                    });
                    break;

                case 'job_info':
                    this.sendBusMessage(JOB, msgData.job_id, 'job-info', {
                        jobId: msgData.job_id,
                        jobInfo: msgData,
                    });
                    break;

                case 'job_init_err':
                case 'job_init_lookup_err':
                    this.displayJobError(msgData);
                    console.error('Error from job comm:', msg);
                    break;

                case 'job_logs':
                    this.sendBusMessage(JOB, msgData.job_id, 'job-logs', {
                        jobId: msgData.job_id,
                        logs: msgData,
                        latest: msgData.latest,
                    });
                    break;

                /*
                 * The job status for one or more jobs. See job_status_all
                 * for a message which covers all active jobs.
                 * Note that these messages are additive to the job panel
                 * cache, but the reverse logic does not apply.
                 */
                case 'job_status':
                    jobId = msgData.state.job_id;
                    // We could just copy the entire message into the job
                    // states cache, but referencing each individual property
                    // is more explicit about the structure.
                    this.jobStates[msgData.state.job_id] = {
                        state: msgData.state,
                        spec: msgData.spec,
                        widgetParameters: msgData.widget_info,
                    };

                    /*
                     * Notify the front end about the changed or new job
                     * states.
                     */
                    this.sendBusMessage(JOB, jobId, 'job-status', {
                        jobId,
                        jobState: msgData.state,
                        outputWidgetInfo: msgData.widget_info,
                    });
                    break;
                /*
                 * This message must carry all jobs linked to this narrative.
                 * The job deletion logic, specifically, requires that the job
                 * actually not exist in the job service.
                 * NB there is logic in the job management back end to allow
                 * job notification to be turned off per job -- this would
                 * be incompatible with the logic here and we should address
                 * that.
                 * E.g. if that behavior is allowed, then deletion detection
                 * would need to move to the back end, since that is the only
                 * place that would truly know about all jobs for this narrative.
                 */
                case 'job_status_all':
                    /*
                     * Ensure there is a locally cached copy of each job.
                     *
                     */
                    for (jobId in msgData) {
                        const jobStateMessage = msgData[jobId];
                        // We could just copy the entire message into the job
                        // states cache, but referencing each individual property
                        // is more explicit about the structure.
                        this.jobStates[jobId] = {
                            state: jobStateMessage.state,
                            spec: jobStateMessage.spec,
                            widgetParameters: jobStateMessage.widget_info,
                            owner: jobStateMessage.owner,
                        };

                        this.sendBusMessage(JOB, jobId, 'job-status', {
                            jobId: jobId,
                            jobState: jobStateMessage.state,
                            outputWidgetInfo: jobStateMessage.widget_info,
                        });
                    }

                    Object.keys(this.jobStates).forEach((_jobId) => {
                        if (!msgData[_jobId]) {
                            // If this job is not found in the incoming list of all
                            // jobs, then we must both delete it locally, and
                            // notify any interested parties.
                            this.sendBusMessage(JOB, _jobId, 'job-status', {
                                jobId: _jobId,
                                jobState: {
                                    job_id: _jobId,
                                    status: 'does_not_exist',
                                },
                            });

                            // it is safe to delete properties here
                            delete this.jobStates[_jobId];
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
                                    if (reply.content.error) {
                                        console.error('ERROR executing jobInit', reply);
                                        commSemaphore.set('comm', 'error');
                                        reject(
                                            new Error(
                                                reply.content.name + ':' + reply.content.evalue
                                            )
                                        );
                                    } else {
                                        resolve();
                                    }
                                },
                            },
                        };
                        Jupyter.notebook.kernel.execute(_this.getJobInitCode(), callbacks);
                    });
                });
        }

        getJobInitCode() {
            return [
                'from biokbase.narrative.jobs.jobcomm import JobComm',
                'JobComm().start_job_status_loop(init_jobs=True)',
            ].join('\n');
        }
    }

    return JobCommChannel;
});
