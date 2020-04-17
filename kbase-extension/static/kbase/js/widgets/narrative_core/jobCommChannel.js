/*global define*/
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
    'base/js/namespace',
    'common/runtime',
    'services/kernels/comm',
    'common/semaphore',
    'text!kbase/templates/job_panel/job_init_error.html'
], function (
    Promise,
    $,
    Handlebars,
    kbaseAccordion,
    BootstrapDialog,
    Jupyter,
    Runtime,
    JupyterComm,
    Semaphore,
    JobInitErrorTemplate
) {
    'use strict';

    const COMM_NAME = 'KBaseJobs',
        ALL_STATUS = 'all_status',
        JOB_STATUS = 'job_status',
        STOP_UPDATE_LOOP = 'stop_update_loop',
        START_UPDATE_LOOP = 'start_update_loop',
        STOP_JOB_UPDATE = 'stop_job_update',
        START_JOB_UPDATE = 'start_job_update',
        CANCEL_JOB = 'cancel_job',
        JOB_LOGS = 'job_logs',
        JOB_LOGS_LATEST = 'job_logs_latest',
        JOB_INFO = 'job_info',
        JOB = 'jobId',
        CELL = 'cell';

    class JobCommChannel {

        /**
         * Grabs the runtime, inits the set of job states, and registers callbacks against the
         * main Bus.
         */
        constructor() {
            this.runtime = Runtime.make();
            this.jobStates = {};
            this.handleBusMessages();
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
            let channel = {};
            channel[channelName] = channelId;
            this.runtime.bus().send(JSON.parse(JSON.stringify(message)), {
                channel: channel,
                key: {
                    type: msgType
                }
            });
        }

        /**
         * Registers callbacks for handling bus messages. This listens to the global runtime bus.
         * Mostly, it relays bus messages into comm channel requests that are satisfied by the
         * kernel.
         */
        handleBusMessages() {
            let bus = this.runtime.bus();

            bus.on('ping-comm-channel', (message) => {
                this.sendCommMessage('ping', null, {
                    ping_id: message.pingId
                });
            });

            // Cancels the job.
            bus.on('request-job-cancellation', (message) => {
                this.sendCommMessage(CANCEL_JOB, message.jobId);
            });

            // Fetches job status from kernel.
            bus.on('request-job-status', (message) => {
                // console.log('requesting job status for ' + message.jobId);
                this.sendCommMessage(JOB_STATUS, message.jobId, { parent_job_id: message.parentJobId });
            });

            // Requests job status updates for this job via the job channel, and also
            // ensures that job polling is running.
            bus.on('request-job-update', (message) => {
                // console.log('requesting job updates for ' + message.jobId);
                this.sendCommMessage(START_JOB_UPDATE, message.jobId, { parent_job_id: message.parentJobId });
            });

            // Tells kernel to stop including a job in the lookup loop.
            bus.on('request-job-completion', (message) => {
                // console.log('cancelling job updates for ' + message.jobId);
                this.sendCommMessage(STOP_JOB_UPDATE, message.jobId, { parent_job_id: message.parentJobId });
            });

            // Fetches job logs from kernel.
            bus.on('request-job-log', (message) => {
                this.sendCommMessage(JOB_LOGS, message.jobId, message.options);
            });

            // Fetches most recent job logs from kernel.
            bus.on('request-latest-job-log', (message) => {
                this.sendCommMessage(JOB_LOGS_LATEST, message.jobId, message.options);
            });

            // Fetches info (not state) about a job. Like the app id, name, and inputs.
            bus.on('request-job-info', (message) => {
                this.sendCommMessage(JOB_INFO, message.jobId, { parent_job_id: message.parentJobId });
            });
        }

        /**
         * Sends a comm message to the JobManager in the kernel.
         * If there's no comm channel ready, tries to set one up first.
         * @param msgType {string} - one of (prepend with this.)
         *   ALL_STATUS,
         *   STOP_UPDATE_LOOP,
         *   START_UPDATE_LOOP,
         *   STOP_JOB_UPDATE,
         *   START_JOB_UPDATE,
         *   JOB_LOGS
         * @param jobId {string} - optional - a job id to send along with the
         * message, where appropriate.
         */
        sendCommMessage(msgType, jobId, options) {
            return new Promise((resolve, reject) => {
                // TODO: send specific error so that client can retry.
                if (!this.comm) {
                    console.error('Comm channel not initialized, not sending message.');
                    reject(new Error('Comm channel not initialized, not sending message.'));
                }

                var msg = {
                    target_name: COMM_NAME,
                    request_type: msgType
                };
                if (jobId) {
                    msg.job_id = jobId;
                }
                if (options) {
                    msg = $.extend({}, msg, options);
                }
                this.comm.send(msg);
                resolve();
            })
            .catch((err) => {
                console.error('ERROR sending comm message', err, msgType, jobId, options);
                throw new Error('ERROR sending comm message', err, msgType, jobId, options);
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
            var msgType = msg.content.data.msg_type;
            var msgData = msg.content.data.content;
            var jobId = null;
            switch (msgType) {
            case 'start':
                // console.log('START', msgData.time);
                break;
            case 'new_job':
                Jupyter.notebook.save_checkpoint();
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
                    widgetParameters: msgData.widget_info
                };

                /*
                 * Notify the front end about the changed or new job
                 * states.
                 */
                this.sendBusMessage(JOB, jobId, 'job-status', {
                    jobId: jobId,
                    jobState: msgData.state,
                    outputWidgetInfo: msgData.widget_info
                });
                break;
                /*
                 * This message must carry all jobs linked to this narrative.
                 * The "job-deleted" logic, specifically, requires that the job
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
                        owner: jobStateMessage.owner
                    };

                    this.sendBusMessage(JOB, jobId, 'job-status', {
                        jobId: jobId,
                        jobState: jobStateMessage.state,
                        outputWidgetInfo: jobStateMessage.widget_info
                    });
                }

                Object.keys(this.jobStates).forEach((jobId) => {
                    if (!msgData[jobId]) {
                        // If this job is not found in the incoming list of all
                        // jobs, then we must both delete it locally, and
                        // notify any interested parties.
                        this.sendBusMessage(JOB, jobId, 'job-deleted', {
                            jobId: jobId,
                            via: 'no_longer_exists'
                        });
                        // it is safe to delete properties here
                        delete this.jobStates[jobId];
                    }
                });
                break;
            case 'job_info':
                jobId = msgData.job_id;
                this.sendBusMessage(JOB, jobId, 'job-info', {
                    jobId: jobId,
                    jobInfo: msgData
                });
                break;
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
            case 'job_canceled':
                var canceledId = msgData.job_id;
                this.sendBusMessage(JOB, canceledId, 'job-canceled',
                                    { jobId: canceledId, via: 'job_canceled' });
                break;

            case 'job_does_not_exist':
                this.sendBusMessage(JOB, msgData.job_id, 'job-does-not-exist',
                                    { jobId: msgData.job_id, source: msgData.source });
                break;

            case 'job_logs':
                jobId = msgData.job_id;
                this.sendBusMessage(JOB, jobId, 'job-logs', {
                    jobId: jobId,
                    logs: msgData,
                    latest: msgData.latest
                });
                break;

            case 'job_comm_error':
                if (msgData) {
                    jobId = msgData.job_id;
                    switch (msgData.request_type) {
                    case 'cancel_job':
                        this.sendBusMessage(JOB, jobId, 'job-cancel-error', {
                            jobId: jobId,
                            message: msgData.message
                        });
                        break;
                    case 'job_logs':
                    case 'job_logs_latest':
                        this.sendBusMessage(JOB, jobId, 'job-log-deleted', {
                            jobId: jobId,
                            message: msgData.message
                        });
                        break;
                    case 'job_status':
                        this.sendBusMessage(JOB, jobId, 'job-status-error', {
                            jobId: jobId,
                            message: msgData.message
                        });
                        break;
                    default:
                        this.sendBusMessage(JOB, jobId, 'job-error', {
                            jobId: jobId,
                            message: msgData.message,
                            request: msgData.request_type
                        });
                        break;
                    }
                }
                console.error('Error from job comm:', msg);
                break;

            case 'job_init_err':
            case 'job_init_lookup_err':
                /*
                 code, error, job_id (opt), message, name, source
                 */
                var $modalBody = $(Handlebars.compile(JobInitErrorTemplate)(msgData));
                var modal = new BootstrapDialog({
                    title: 'Job Initialization Error',
                    body: $modalBody,
                    buttons: [
                        $('<a type="button" class="btn btn-default">')
                        .append('OK')
                        .click(function (event) {
                            modal.hide();
                        })
                    ]
                });
                new kbaseAccordion($modalBody.find('div#kb-job-err-trace'), {
                    elements: [{
                        title: 'Detailed Error Information',
                        body: $('<table class="table table-bordered"><tr><th>code:</th><td>' + msgData.code + '</td></tr>' +
                            '<tr><th>error:</th><td>' + msgData.message + '</td></tr>' +
                            (function () {
                                if (msgData.service) {
                                    return '<tr><th>service:</th><td>' + msgData.service + '</td></tr>';
                                }
                                return '';
                            }()) +
                            '<tr><th>type:</th><td>' + msgData.name + '</td></tr>' +
                            '<tr><th>source:</th><td>' + msgData.source + '</td></tr></table>')
                    }]
                });

                $modalBody.find('button#kb-job-err-report').click(function (e) {

                });
                modal.getElement().on('hidden.bs.modal', function () {
                    modal.destroy();
                });
                modal.show();
                break;
            case 'result':
                this.sendBusMessage(CELL, msgData.address.cell_id, 'result', msgData);
                break;
            default:
                console.warn('Unhandled KBaseJobs message from kernel (type=\'' + msgType + '\'):');
                console.warn(msg);
            }
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
            let commSemaphore = Semaphore.make();
            commSemaphore.add('comm', false);
            return new Promise((resolve, reject) => {
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
                    Jupyter.notebook.kernel.comm_manager.register_target(COMM_NAME, (comm, msg) => {
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
                                    reject(new Error(reply.content.name + ':' + reply.content.evalue));
                                } else {
                                    resolve();
                                }
                            }
                        }
                    };
                    Jupyter.notebook.kernel.execute(_this.getJobInitCode(), callbacks);
                });
            });
        }

        getJobInitCode() {
            return [
                'from biokbase.narrative.jobs.jobcomm import JobComm',
                'JobComm().start_job_status_loop(init_jobs=True)'
            ].join('\n');
        }
    }

    return JobCommChannel;
});
