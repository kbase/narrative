/*global define*/
/*jslint white: true*/
define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'handlebars',
    'narrativeConfig',
    'kbasePrompt',
    'kbaseNarrativeControlPanel',
    'kbaseAccordion',
    'util/bootstrapDialog',
    'util/timeFormat',
    'util/string',
    'base/js/namespace',
    'common/runtime',
    'services/kernels/comm',
    'text!kbase/templates/job_panel/job_info.html',
    'text!kbase/templates/job_panel/job_error.html'
], function (
    KBWidget,
    bootstrap,
    $,
    Handlebars,
    Config,
    kbasePrompt,
    kbaseNarrativeControlPanel,
    kbaseAccordion,
    BootstrapDialog,
    TimeFormat,
    StringUtil,
    Jupyter,
    Runtime,
    JupyterComm,
    JobInfoTemplate,
    JobErrorTemplate
    ) {
    'use strict';
    return KBWidget({
        COMM_NAME: 'KBaseJobs',
        ALL_STATUS: 'all_status',
        JOB_STATUS: 'job_status',
        STOP_UPDATE_LOOP: 'stop_update_loop',
        START_UPDATE_LOOP: 'start_update_loop',
        STOP_JOB_UPDATE: 'stop_job_update',
        START_JOB_UPDATE: 'start_job_update',
        DELETE_JOB: 'delete_job',
        JOB_LOGS: 'job_logs',
        JOB_LOGS_LATEST: 'job_logs_latest',
        name: 'kbaseNarrativeJobsPanel',
        parent: kbaseNarrativeControlPanel,
        version: '0.0.1',
        options: {
            loadingImage: Config.get('loading_gif'),
            autopopulate: true,
            title: 'Jobs',
        },
        title: $('<span>Jobs </span>'),
        // these are the elements that contain running apps and methods
        $appsList: null,
        $methodsList: null,

        // has 'spec' and 'state' keys - populated from server.
        jobStates: {},
        comm: null,

        init: function (options) {
            this._super(options);
            this.$jobCountBadge = $('<span>').addClass('label label-danger'),
                this.title.append(this.$jobCountBadge);
            Handlebars.registerHelper('colorStatus', function(status) {
                var s = status.string.toLowerCase();
                switch(s) {
                    case "in-progress":
                        return "<b>" + status + "</b>";
                        break;
                    case "queued":
                        return "<b>" + status + "</b>";
                        break;
                    default:
                        return status;
                        break;
                }
            })
            this.jobInfoTmpl = Handlebars.compile(JobInfoTemplate);
            this.jobErrorTmpl = Handlebars.compile(JobErrorTemplate);
            this.runtime = Runtime.make();
            var $refreshBtn = $('<button>')
                .addClass('btn btn-xs btn-default')
                .append($('<span>')
                    .addClass('glyphicon glyphicon-refresh'))
                .tooltip({
                    title: 'Refresh job status',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                })
                .click(function (event) {
                    $refreshBtn.tooltip('hide');
                    this.sendCommMessage(this.ALL_STATUS);
                }.bind(this));

            this.$methodsList = $('<div>');
            this.$appsList = $('<div>');

            this.$jobsAccordion = $('<div>');
            // Make a function panel for everything to sit inside.
            this.$jobsPanel = $('<div>')
                .addClass('kb-function-body');
            this.$jobsList = $('<div>').addClass('kb-jobs-items');
            this.$jobsPanel.append(this.$jobsList);
            this.jobWidgets = {};

            // The 'loading' panel should just have a spinning gif in it.
            this.$loadingPanel = $('<div>')
                .addClass('kb-data-loading')
                .append('<img src="' + this.options.loadingImage + '">')
                .append($('<div>')
                    .attr('id', 'message'))
                .hide();

            // The error panel should be empty for now.
            this.$errorPanel = $('<div>')
                .addClass('kb-error')
                .hide();

            this.jobsModalTitle = 'Remove Job?';

            var modalButtons = [
                $('<a type="button" class="btn btn-default">')
                    .append('Cancel')
                    .click(function (event) {
                        this.jobsModal.hide();
                        this.removeId = null;
                    }.bind(this)),
                $('<a type="button" class="btn btn-danger">')
                    .append('Delete Job')
                    .click(function (event) {
                        if (this.removeId) {
                            this.deleteJob(this.removeId);
                        }
                        if (this.deleteCallback) {
                            this.deleteCallback(true);
                        }
                        this.deleteCallback = null;
                        this.jobsModal.hide();
                    }.bind(this))
            ];

            this.jobsModal = new BootstrapDialog({
                title: this.jobsModalTitle,
                body: $('<div>'),
                buttons: modalButtons
            });

            this.addButton($refreshBtn);

            this.body().append(this.$jobsPanel)
                .append(this.$loadingPanel)
                .append(this.$errorPanel);

            this.showMessage('Initializing...', true);
            this.handleBusMessages();

            return this;
        },
        sendJobMessage: function (msgType, jobId, message) {
            var jobChannelId = JSON.stringify({
                    jobId: jobId
                });
            this.runtime.bus().send(JSON.parse(JSON.stringify(message)), {
                channel: jobChannelId,
                key: {
                    type: msgType
                }
            });
        },
        /*
         * Messages sent directly to cells.
         */
        sendCellMessage: function (messageType, cellId, message) {
            // console.log('Sending cell message ', messageType, cellId);
            var channelId = JSON.stringify({
                    cell: cellId
                });
            this.runtime.bus().send(JSON.parse(JSON.stringify(message)), {
                channel: channelId,
                key: {
                    type: messageType
                }
            })
        },
        handleBusMessages: function (msg) {
            var bus = this.runtime.bus();

            bus.on('request-job-deletion', function (message) {
                this.deleteJob(message.jobId);
            }.bind(this));

            bus.on('request-job-removal', function (message) {
                this.removeJob(message.jobId);
            }.bind(this));

            bus.on('request-job-status', function (message) {
                this.sendCommMessage(this.JOB_STATUS, message.jobId);
            }.bind(this));

            bus.on('request-job-log', function (message) {
                this.sendCommMessage(this.JOB_LOGS, message.jobId, message.options);
            }.bind(this));

            bus.on('request-latest-job-log', function (message) {
                this.sendCommMessage(this.JOB_LOGS_LATEST, message.jobId, message.options);
            }.bind(this));
        },

        /**
         * Sends a comm message to the JobManager in the kernel.
         * If there's no comm channel ready, tries to set one up first.
         * @param msgType {string} - one of (prepend with this.)
         *   ALL_STATUS,
         *   STOP_UPDATE_LOOP,
         *   START_UPDATE_LOOP,
         *   STOP_JOB_UPDATE,
         *   START_JOB_UPDATE,
         *   DELETE_JOB,
         *   JOB_LOGS
         * @param jobId {string} - optional - a job id to send along with the
         * message, where appropriate.
         */
        sendCommMessage: function (msgType, jobId, options) {
            if (!this.comm) {
                this.initCommChannel(function () {
                    this.sendCommMessage(msgType, jobId, options);
                }.bind(this));
                return;
            }
            var msg = {
                target_name: this.COMM_NAME,
                request_type: msgType,
            };
            if (jobId) {
                msg.job_id = jobId;
            }
            if (options) {
                msg = $.extend({}, msg, options);
            }
            this.comm.send(msg);
        },
        handleCommMessages: function (msg) {
            var msgType = msg.content.data.msg_type,
                bus = this.runtime.bus();
            switch (msgType) {
                case 'new_job':
                    // this.registerKernelJob(msg.content.data.content);
                    Jupyter.notebook.save_checkpoint();
                    break;
                case 'job_status':
                    var status = {},
                        info = {},
                        content = msg.content.data.content;
                    for (var jobId in content) {

                        this.jobStates[jobId] = content[jobId];
                        //this.jobStates[jobId].state = content[jobId].state;
                        //this.jobStates[jobId].spec = content[jobId].spec;

                        // The job state includes both the job state info and the
                        // app spec. Not sure why...
                        // WJR - because the renderer needs info from the app spec
                        // like its name and such.
                        // EAP - what i mean was why it is sent with each job state
                        // message. I can see that given that job_status may be
                        // issued at any arbitrary front end state, and the spec
                        // will be useful on the first message received, it might 
                        // be better to just bite the bullet and require that any
                        // element which needs the app spec fetch that 
                        // independently, or rather perhaps the appmanager could
                        // arbitrate those requets.
                        this.sendJobMessage('job-status', jobId, {
                            jobId: jobId,
                            jobState: content[jobId].state
                        });
                    }
                    var jobsToDelete = [];
                    Object.keys(this.jobStates).forEach(function (jobId) {
                        var jobState = this.jobStates[jobId].state;
                        if (!content[jobState.job_id]) {
                            this.sendJobMessage('job-deleted', jobState.job_id, {
                                jobId: jobState.job_id
                            });
                            jobsToDelete.push(jobState.job_id);
                        }
                    }.bind(this));
                    jobsToDelete.forEach(function (jobId) {
                        delete this.jobStates[jobId];
                    }.bind(this));
                    this.populateJobsPanel(); //status, info, content);
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

                    // TODO: make sure we are catching these ... perhaps they need to be run-status...
                    // this.sendJobMessage('job-status', msg.content.data.content.job_id, msg.content.data.content);
                    console.log('have run status', msg.content.data.content);
                    this.sendCellMessage('run-status', msg.content.data.content.cell_id, msg.content.data.content);
                    break;
                case 'job_err':

                    this.sendJobMessage('job-error', msg.content.job_id, {
                        jobId: msg.content.job_id,
                        message: msg.content.message
                    });

                    console.error('Job Error', msg);
                    break;
                case 'job_deleted':
                    var deletedId = msg.content.data.content.job_id;
                    this.sendJobMessage('job-deleted', deletedId, {jobId: deletedId});
                    console.info('Deleted job ' + deletedId);
                    this.removeDeletedJob(deletedId);
                    break;
                case 'job_logs':
                    // console.log('GOT JOB LOGS', msg);
                    var jobId = msg.content.data.content.job_id;

                    this.sendJobMessage('job-logs', jobId, {
                        jobId: jobId,
                        logs: msg.content.data.content,
                        latest: msg.content.data.content.latest
                    });
                    break;
                case 'job_comm_error':
                    var content = msg.content.data.content;
                    if (content) {
                        switch (content.request_type) {
                            case 'delete_job':
                                alert('Job already deleted!');
                                break;
                            case 'job_logs':
                                this.sendJobMessage('job-log-deleted', content.job_id, {jobId: content.job_id});
                                break;
                            case 'job_logs_latest':
                                this.sendJobMessage('job-log-deleted', content.job_id, {jobId: content.job_id});
                                break;
                            case 'job_status':
                                this.sendJobMessage('job-status-error', content.job_id, {
                                    jobId: content.job_id,
                                    message: content.message
                                });
                                break;
                            default:
                                this.sendJobMessage('job-error', content.job_id, {
                                    jobId: content.job_id,
                                    message: content.message,
                                    request: content.requestType
                                });
                                break;
                        }
                        if (content.request_type === 'delete_job') {
                            alert('Job already deleted!');
                        }
                    }
                    console.error('Error from job comm:', msg);
                    break;
                default:
                    console.warn("Unhandled KBaseJobs message from kernel (type='" + msgType + "'):");
                    console.warn(msg);
            }
        },
        /**
         * Initializes the comm channel to the back end.
         * Takes a callback to be executed once the channel's up, since the Jupyter
         * async kernel methods don't seem to play well with Promises.
         * (At least, I couldn't get them to work - Bill 5/27/2016)
         */
        initCommChannel: function (callback) {
            this.comm = null;
            // init the backend with existing jobs.
            // if (this.jobStates === null)
            //     this.initJobStates();

            console.info('Jobs Panel: looking up comm info');
            Jupyter.notebook.kernel.comm_info(this.COMM_NAME, function (msg) {
                console.info('Jobs Panel: got info');
                // console.info(msg);
                if (msg.content && msg.content.comms) {
                    // skim the reply for the right id
                    for (var id in msg.content.comms) {
                        if (msg.content.comms[id].target_name === this.COMM_NAME) {
                            console.info('Jobs Panel: Found an existing channel!');
                            console.info(msg);
                            this.comm = new JupyterComm.Comm(this.COMM_NAME, id);
                            Jupyter.notebook.kernel.comm_manager.register_comm(this.comm);
                            this.comm.on_msg(this.handleCommMessages.bind(this));
                        }
                    }
                }
                if (this.comm === null) {
                    console.info('Jobs Panel: setting up a new channel - ' + this.COMM_NAME);
                    Jupyter.notebook.kernel.comm_manager.register_target(this.COMM_NAME, function (comm, msg) {
                        console.info('Jobs Panel: new channel set up - ', comm);
                        this.comm = comm;
                        comm.on_msg(this.handleCommMessages.bind(this));
                    }.bind(this));
                }
                Jupyter.notebook.kernel.execute(this.getJobInitCode());
                if (callback) {
                    callback();
                }
            }.bind(this));
        },

        getJobInitCode: function () {
            return ["from biokbase.narrative.jobs import JobManager",
                    "JobManager().initialize_jobs()"].join('\n');
        },

        setJobCounter: function (numJobs) {
            this.$jobCountBadge.html(numJobs > 0 ? numJobs : '');
        },

        /**
         * @method
         * Opens a delete prompt for this job, with a 'Delete' and 'Cancel' button.
         * If the user clicks 'Cancel', then it shouldn't do anything besides close.
         * If the user clicks 'Delete', then it tries to delete the job through the backend,
         * then clears the job info from the front end and refreshes.
         *
         * Under the covers, since we're using kbasePrompt and those buttons are a little
         * disconnected from everything else, this sets widget variables 'removeId' and 'deleteCallback'.
         * The 'removeId' is the id of the job to delete, and 'deleteCallback' is invoked
         * after the deletion is done.
         *
         * @param {object} jobId
         * @param {object} jobState
         */
        openJobDeletePrompt: function (jobId, jobState) {
            if (!jobId)
                return;

            var removeText = "Deleting this job will remove it from your Narrative. Any already generated data will be retained. Continue?";
            var warningText = "";

            if (jobState) {
                jobState = jobState.toLowerCase();
                if (jobState === 'queued' || jobState === 'running' || jobState === 'in-progress') {
                    warningText = "This job is currently running on KBase servers! Removing it will attempt to stop the running job.";
                } else if (jobState === 'completed') {
                    warningText = "This job has completed running. You may safely remove it without affecting your Narrative.";
                }
            }
            this.jobsModal.setBody($('<div>').append(warningText + '<br><br>' + removeText));
            this.jobsModal.setTitle('Remove Job?');
            this.removeId = jobId;

            this.jobsModal.show();
        },
        /**
         * Deletes a job with two steps.
         * 1. Sends a comm message to the job manager to delete the job.
         * 2. Removes the job info from the Narrative's metadata.
         * 3. Removes the little job widget from the job panel.
         * 4. Sends a bus message that the job's been deleted to whatever's listening.
         */
        deleteJob: function (jobId) {
            if (!jobId) {
                return;
            }
            // send the comm message.
            this.sendCommMessage(this.DELETE_JOB, jobId);
        },
        removeJob: function (jobId) {
            if (!jobId) {
                return;
            }
            // send the comm message.
            this.sendCommMessage(this.REMOVE_JOB, jobId);
            this.removeDeletedJob(jobId);
        },
        removeDeletedJob: function (jobId) {
            // remove the view widget
            if (this.jobWidgets[jobId]) {
                this.jobWidgets[jobId].remove();
            }

            // clean the metadata storage
            var methodIds = Jupyter.notebook.metadata.job_ids.methods;
            methodIds = methodIds.filter(function (val) {
                return val.id !== jobId;
            });
            Jupyter.notebook.metadata.job_ids.methods = methodIds;

            // clean this widget's internal state
            if (this.jobStates[jobId]) {
                // if it wasn't complete, we likely have an invalid number in the badge.
                if (this.jobIsIncomplete(this.jobStates[jobId].status)) {
                    this.setJobCounter(Number(this.$jobCountBadge.html()) - 1);
                }
                // delete this.source2Job[this.jobStates[jobId].source];
                delete this.jobStates[jobId];
            }
            this.removeId = null;

            // save the narrative.
            Jupyter.narrative.saveNarrative();
        },
        /**
         * Shows a loading spinner or message on top of the panel.
         * @private
         */
        showMessage: function (message, loading) {
            this.$loadingPanel.find('#message').empty();
            if (message)
                this.$loadingPanel.find('#message').html(message);
            if (loading)
                this.$loadingPanel.find('img').show();
            else
                this.$loadingPanel.find('img').hide();
            this.$jobsPanel.hide();
            this.$errorPanel.hide();
            this.$loadingPanel.show();
        },
        /**
         * Shows the main jobs panel, hiding all others.
         * @private
         */
        showJobsPanel: function () {
            this.$errorPanel.hide();
            this.$loadingPanel.hide();
            this.$jobsPanel.show();
        },

        /**
         * There are a few different status options that show a job is complete vs.
         * incomplete. We mark ones as "running" for our purpose if they do not
         * have any of these statuses.
         * @method
         * @private
         */
        jobIsIncomplete: function (status) {
            status = status.toLowerCase();
            return (status === 'in-progress' || status === 'queued');
        },
        /**
         * @method
         * Here we go, the first part of the rendering routine.
         * @param {object} fetchedJobStatus - the results of the jobs looked up through the kernel. This has the job status objects from NJS, etc.
         * @param {object} jobInfo - the specs (and status) of ALL jobs, not just those looked up through the kernel.
         * The specs and state are used to decorate both the job renderings and the cells with results, etc.
         *
         * Here's the flow:
         * 1. Get a sorted list of *all* jobs from the this.jobStates buffer
         * 2. All of those are getting rendered one way or another. Iterate on through.
         * 3. When we get to one that has an update from the server, then we need to update this.jobStates, render that job info, and update the cell
         * (possibly).
         * 4. That's it. All should be refreshed! Update the DOM node that holds all job info.
         *
         * XXX - it would probably be faster to re-render all jobs in place iff they need it (e.g., probably just the time since start field).
         * But it's Friday night at 8:30 before the big build meeting, so that might not happen yet. In all reality, I have a hard time seeing a
         * case where there's more than, say, 20 job elements at once in any given Narrative.
         * We should also expire jobs in a reasonable time, at least from the Narrative.
         */
        populateJobsPanel: function () {
            // 1. Check if we have any existing jobs, or drop a message.
            // if (Object.keys(fetchedJobs).length + Object.keys(this.jobWidgets).length === 0) {
            //     // this.$jobsList.empty().append($('<div class="kb-data-loading">').append('No jobs exist for this Narrative!'));
            // }
            // 2. Do update with given jobs.
            // else {
                // If there are any jobs that aren't part of sortedJobs, add them in - means they're new.
                // This will also happen on initialization.
//                for (var jobId in fetchedJobs) {
//                    if (fetchedJobs.hasOwnProperty(jobId) && !this.jobStates[jobId]) {
//                        this.jobStates[jobId] = fetchedJobs[jobId];
//                    }
//                }
                var sortedJobIds = Object.keys(this.jobStates);
                sortedJobIds.sort(function (a, b) {
                    var aTime = this.jobStates[a].state.creation_time;
                    var bTime = this.jobStates[b].state.creation_time;
                    // if we have timestamps for both, compare them
                    return aTime - bTime;
                }.bind(this));
                var stillRunning = 0;
                for (var i = 0; i < sortedJobIds.length; i++) {
                    var jobId = sortedJobIds[i];

                    // if the id shows up in the "render me!" list:
                    // only those we fetched might still be running.
                    if (this.jobStates[jobId] && this.jobStates[jobId].state) {
                        if (this.jobIsIncomplete(this.jobStates[jobId].state.job_state))
                            stillRunning++;

                          // this message is already sent in the core code which
                          // catches the jupyter job message.
//                        this.sendJobMessage('job-status', jobId, {
//                            jobId: jobId,
//                            jobInfo: fetchedJobs[jobId].spec,      //jobInfo[jobId],        // the spec
//                            job: fetchedJobs[jobId],               // jo
//                            jobState: fetchedJobs[jobId].state     //this.jobStates[jobId] // just the state
//                        });

                        // updating the given state first allows us to just pass the id and the status set to
                        // the renderer. If the status set doesn't exist (e.g. we didn't look it up in the
                        // kernel), then that's just undefined and the renderer can deal.
                        if (this.jobWidgets[jobId]) {
                            this.jobWidgets[jobId].remove();
                        }
                        this.jobWidgets[jobId] = this.renderJob(jobId); //, jobInfo[jobId]);
                        this.$jobsList.prepend(this.jobWidgets[jobId]);
                    }
                }
                this.setJobCounter(stillRunning);
            // }
            // hide any showing tooltips, otherwise they just sit there stagnant forever.
            this.$jobsPanel.find('span[data-toggle="tooltip"]').tooltip('hide');
            // this.$jobsPanel.empty().append($jobsList);
            this.showJobsPanel();
        },
        renderJob: function (jobId) { //, jobInfo) {
            // var jobState = this.jobStates[jobId];

            /* {
             *     spec: the method spec
             *     state: the current state
             * }
             */
            var job = this.jobStates[jobId];

            /* Cases:
             * 1. have job, have info
             *    a. job has 'error' property
             *        - render as an error'd job!
             *        - include delete btn
             *    b. job looks normal, not complete
             *        - show status as usual
             *    c. job is completed
             *        - show delete btn
             * 2. have job, no info
             *    - probably an error - missing app cell or something
             *        - show an error, option to delete.
             * 3. have no job
             *    - just return null. nothing invokes this like that, anyway
             */

            // get the job's name from its spec
            var jobName = "Unknown App";
            if (job.spec && job.spec.info && job.spec.info.name) {
            // if (jobInfo && jobInfo.spec && jobInfo.spec.methodSpec && jobInfo.spec.methodSpec.info) {
                jobName = job.spec.info.name;
            }

            var status = "Unknown";
            // if (jobState && jobState.status) {
            if (job.state.job_state) {
                status = job.state.job_state;
                status = status.charAt(0).toUpperCase() +
                         status.substring(1);
            }
            var started = "Unknown";
            var position = null;
            var task = null;

            /* (Update 5/24/2016)
             * Okay, new version of state from backend.
             * keys:
             * app_id, cell_id, id, inputs, state, status, tag, version
             * app_id/tag/version = all about that app.
             * cell_id = cell that inited it.
             * id = job id
             * inputs = the actual inputs to run_app
             * state = the state from njs.check_job - this is the important part.
             *   - creation_time, exec_start_time, finish_time = all in ms since epoch
             *   - error (if present)
             *       - code, message, name (message is the imp't part)
             *   - finished = 0 or 1
             *   - job_state = mirror of status
             *   - position = position in job queue (if present)
             */

            // Calculate run time if applicable
            var completedTime = null;
            var runTime = null;
            var startedTime = null;
            if (job.state.creation_time) {
                startedTime = TimeFormat.prettyTimestamp(job.state.creation_time);
            }
            if (job.state.finish_time) {
                completedTime = TimeFormat.prettyTimestamp(job.state.finish_time);
                if (job.state.creation_time) {
                    runTime = TimeFormat.calcTimeDifference(new Date(job.state.exec_start_time), new Date(job.state.finish_time));
                }
            }

            /* Lots of cases for status:
             * suspend, error, unknown, awe_error - do the usual blocked error thing.
             * deleted - treat job as deleted
             * not_found_error - job's not there, so say so.
             * unauthorized_error - not allowed to see it
             * network_error - a (hopefully transient) error response based on network issues. refreshing should fix it.
             * jobstate has step_errors - then at least one step has an error, so we should show them
             * otherwise, no errors, so render their status happily.
             */
            var errorType = null;
            var netError = false;
            switch (status) {
                case 'Suspend':
                    errorType = 'Error';
                    break;
                case 'Error':
                    errorType = 'Error';
                    break;
                case 'Unknown':
                    errorType = 'Error';
                    break;
                case 'Awe_error':
                    errorType = 'Error';
                    break;
                case 'Deleted':
                    errorType = 'Deleted';
                    break;
                case 'Not_found_error':
                    errorType = 'Job Not Found';
                    break;
                case 'Unauthorized_error':
                    errorType = 'Unauthorized';
                    break;
                case 'Network_error':
                    errorType = 'Network Error';
                    break;
                default:
                    break;
            }
            if (job.state.position !== undefined &&
                job.state.position !== null &&
                job.state.position > 0) {
                position = job.state.position;
            }

            var jobRenderObj = {
                name: jobName,
                hasCell: job.state.cell_id,
                jobId: jobId,
                status: new Handlebars.SafeString(status),
                runTime: runTime,
                position: position,
                startedTime: startedTime ? new Handlebars.SafeString(startedTime) : null,
                completedTime: completedTime ? new Handlebars.SafeString(completedTime) : null,
                error: errorType,
            };
            var $jobDiv = $(this.jobInfoTmpl(jobRenderObj));
            $jobDiv.find('[data-toggle="tooltip"]').tooltip({
                container: 'body',
                placement: 'right',
                delay: {
                    show: Config.get('tooltip').showDelay,
                    hide: Config.get('tooltip').hideDelay
                }
            });
            if (errorType) {
                $jobDiv.find('.kb-jobs-error-btn').click(function (e) {
                    this.triggerJobErrorButton(jobId, errorType);
                }.bind(this));
            }
            if (job.state.cell_id) {
                $jobDiv.find('span.fa-location-arrow').click(function (e) {
                    var cell = Jupyter.narrative.getCellByKbaseId(job.state.cell_id);
                    Jupyter.narrative.scrollToCell(cell, true);
                });
            }
            $jobDiv.find('span.fa-times').click(function (e) {
                this.openJobDeletePrompt(jobId, status);
            }.bind(this));
            return $jobDiv;
        },
        /**
         * @method
         * @private
         * Makes an error button for a job.
         * This invokes the JobPanel's popup error modal, so most of the logic here is figuring out what
         * should appear in that modal.
         * @param {string} jobId - the id of the job to be used to fetch its state and info
         * @param {string} errorType - the text of the button. If empty or null, the button just gets a /!\ icon.
         */
        triggerJobErrorButton: function (jobId, errorType) {
            var jobState = this.jobStates[jobId];
            var removeText = "Deleting this job will remove it from your Narrative. Any generated data will be retained. Continue?";
            var headText = "An error has been detected in this job!";
            var errorText = "The KBase servers are reporting an error for this job:";
            var errorType = "Unknown";

            this.removeId = jobId;
            if (errorType === 'Deleted') {
                errorText = "This job has already been deleted from KBase Servers.";
                errorType = "Invalid Job";
            } else if (errorType === 'Job Not Found') {
                errorText = "This job was not found to be running on KBase Servers. It may have been deleted, or may not be started yet.";
                errorType = "Invalid Job";
            } else if (errorType === 'Unauthorized') {
                errorText = "You do not have permission to view information about this job.";
            } else if (errorType === 'Network Error') {
                errorText = "An error occurred while looking up job information. Please refresh the jobs panel to try again.";
            } else if (jobState.error) {
                errorText = new Handlebars.SafeString('<div class="kb-jobs-error-modal">' + jobState.error.message + '</div>');
                errorType = jobState.error.name;
                // if (jobState.state.error === 'awe_error')
                //     errorType = 'AWE Error';
            }

            var $modalBody = $(this.jobErrorTmpl({
                jobId: jobId,
                errorType: errorType,
                errorText: errorText,
                hasTraceback: jobState.error.error ? true : false
            }));

            if (jobState.error.error) {
                new kbaseAccordion($modalBody.find('div#kb-job-err-trace'), {
                    elements: [{
                        title: 'Detailed Error Information',
                        body: $('<pre style="max-height:300px; overflow-y: auto">').append(jobState.error.error)
                    }]
                });
            }
            this.jobsModal.setBody($modalBody);
            this.jobsModal.show();
        }
    });
});