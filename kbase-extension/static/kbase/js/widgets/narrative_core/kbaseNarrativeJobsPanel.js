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
        /* when populated, should have the structure:
         * {
         *    jobId: { id: <str>,
         status : <str>,
         source : <id of source cell>,
         $elem : element of rendered job info,
         timestamp: <str> }
         * }
         */
        jobStates: null,
        /* when populated should have structure:
         * {
         *    sourceId : jobId
         * }
         */
        source2Job: {},
        comm: null,
        // completedStatus: [ 'completed',
        //                    'done',
        //                    'deleted',
        //                    'suspend',
        //                    'not_found_error',
        //                    'unauthorized_error',
        //                    'awe_error' ],

        init: function (options) {
            this._super(options);
            this.$jobCountBadge = $('<span>').addClass('label label-danger'),
                this.title.append(this.$jobCountBadge);
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

            if (this.options.autopopulate) {
                this.initJobStates();
            }
            this.handleBusMessages();

            return this;
        },
        sendJobMessage: function (msgType, jobId, message) {
            var jobChannelId = JSON.stringify({
                    jobId: jobId
                });
            console.log('sending job message', msgType, jobId, jobChannelId, message);
            this.runtime.bus().send(JSON.parse(JSON.stringify(message)), {
                channel: jobChannelId,
                key: {
                    type: msgType
                }
            });


//            this.runtime.bus().emit(msgType, {
//                data: JSON.parse(JSON.stringify(message))
//            });
        },
        /*
         * Messages sent directly to cells.
         */
        sendCellMessage: function (messageType, cellId, message) {
            console.log('Sending cell message ', messageType, cellId);
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
//        handleBusMessages: function(msg) {
//            this.runtime.bus().listen({
//                test: function(msg) {
//                    return (msg.jobId ? true : false);
//                }.bind(this),
//                handle: function(msg) {
//                    switch(msg.type) {
//                        case 'request-job-deletion':
//                            this.deleteJob(msg.jobId);
//                            break;
//                        case 'request-job-status':
//                            this.sendCommMessage(this.JOB_STATUS, msg.jobId);
//                            break;
//                        case 'request-job-log':
//                            this.sendCommMessage(this.JOB_LOGS, msg.jobId, msg.options);
//                            break;
//                        case 'request-latest-job-log':
//                            this.sendCommMessage(this.JOB_LOGS_LATEST, msg.jobId, msg.options);
//                    }
//                }.bind(this)
//            });
//        },

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
                    this.registerKernelJob(msg.content.data.content);
                    break;
                case 'job_status':
                    var status = {},
                        info = {},
                        content = msg.content.data.content;
                    for (var jobId in content) {
                        status[jobId] = content[jobId].state;
                        info[jobId] = {
                            spec: {
                                methodSpec: content[jobId].spec
                            }
                        };
                        if (status[jobId].finished === 1) {
                            this.sendCommMessage(this.STOP_JOB_UPDATE, jobId);
                        }
                        this.sendJobMessage('job-status', jobId, {
                            jobId: jobId,
                            jobInfo: info[jobId],
                            job: content[jobId],
                            jobState: this.jobStates[jobId]
                        });
                    }
                    this.populateJobsPanel(status, info, content);
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

                    // quick fix:

//                    bus.send({
//                        jobId: msg.content.job_id,
//                        message: msg.content.message
//                    }, {
//                        key: {
//                            type: 'job-error',
//                            jobId: msg.content.job_id
//                        }
//                    });

//                    this.sendBusMessage('job-error', {
//                        jobId: msg.content.job_id,
//                        message: msg.content.message
//                    });

//                    var runtime = Runtime.make();
//
//                    runtime.bus().send({
//                        jobId: msg.content.job_id,
//                        message: msg.content.message
//                    }, {
//                        channel: {
//                            cell: msg.cell_id
//                        },
//                        key: {
//                            type: 'jobstatus'
//                        }
//                    });

                    //runtime.bus().emit('jobstatus', {
                    //    jobId: msg.content.job_id,
                    //    message: msg.content.message
                    //});

                    console.error('Job Error', msg);
                    break;
                case 'job_deleted':
                    var deletedId = msg.content.data.content.job_id;

//                    bus.send({
//                        jobId: deletedId
//                    }, {
//                        key: {
//                            type: 'job-deleted',
//                            jobId: msg.content.job_id
//                        }
//                    });


                    this.sendJobMessage('job-deleted', deletedId, {jobId: deletedId});
                    console.info('Deleted job ' + deletedId);
                    this.removeDeletedJob(deletedId);
                    break;
                case 'job_logs':
                    console.log('GOT JOB LOGS', msg);
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
            if (this.jobStates === null)
                this.initJobStates();

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
                        console.info('Jobs Panel: new channel set up - ', comm)
                        this.comm = comm;
                        comm.on_msg(this.handleCommMessages.bind(this));
                    }.bind(this));
                }
                var code = this.getJobInitCode();
                Jupyter.notebook.kernel.execute(code);
                if (callback) {
                    callback();
                }
            }.bind(this));
        },
        getJobInitCode: function () {
            var jobTuples = [];
            for (var jobId in this.jobStates) {
                var jobInfo = this.jobStates[jobId];
                var source = 'None';
                if (jobInfo.source) {
                    source = jobInfo.source;
                }
                var appId = jobInfo.app_id;
                var tag = 'release';
                if (jobInfo.tag) {
                    tag = jobInfo.tag;
                }
                jobTuples.push("('" + jobId + "', '" + appId + "', '" + tag + "', '" + source + "')");
            }
            return ["from biokbase.narrative.jobs import JobManager",
                "JobManager().initialize_jobs([" + jobTuples.join(',') + "])"].join('\n');
        },
        setJobCounter: function (numJobs) {
            this.$jobCountBadge.html(numJobs > 0 ? numJobs : '');
        },
        /**
         * @method
         * Initializes the jobStates object that the panel knows about.
         * We treat the Jupyter.notebook.metadata.job_ids as a (more or less) read-only
         * object for the purposes of loading and refreshing.
         *
         * At load time, that gets adapted into the jobStates object, which is used to
         * keep track of the job state.
         */
        initJobStates: function () {
            if (this.jobStates === null)
                this.jobStates = {};
            if (Jupyter.notebook && Jupyter.notebook.metadata && Jupyter.notebook.metadata.job_ids) {
                // this is actually like: ['apps': [list of app jobs], 'methods':[list of method jobs]
                var jobIds = Jupyter.notebook.metadata.job_ids;
                for (var jobType in jobIds) {
                    if (!(jobIds[jobType] instanceof Array))
                        continue;
                    for (var i = 0; i < jobIds[jobType].length; i++) {
                        var job = jobIds[jobType][i];
                        this.jobStates[job.id] = $.extend({}, {'status': null, '$elem': null, 'id': job.id}, job);
                        this.source2Job[job.source] = job.id;
                    }
                }
            }
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
                delete this.source2Job[this.jobStates[jobId].source];
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
         * @method
         * This registers a job that was started by the Kernel, then pushed over the KBaseJobs comm channel.
         * This expects the following elements (will be replaced with null if not present):
         * id - string, required - will fail if not present
         * method_id - string
         * tag - string
         * version - string
         * inputs - semi-random object - keys are the input values, values are, well, the inputs
         * cell_id - string, optional - the id of the KBase cell that started the job
         */
        registerKernelJob: function (jobInfo) {
            if (!Jupyter.notebook || !jobInfo.id)
                return;
            if (!Jupyter.notebook.metadata.job_ids) {
                Jupyter.notebook.metadata.job_ids = {
                    'methods': []
                };
            }
            if (jobInfo.cell_id) {
                jobInfo.source = jobInfo.cell_id;
            }
            Jupyter.notebook.metadata.job_ids['methods'].push(jobInfo);
            this.jobStates[jobInfo.id] = $.extend({}, jobInfo, {'status': null});
            this.source2Job[jobInfo.source] = jobInfo.id;
            Jupyter.notebook.save_checkpoint();
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
        populateJobsPanel: function (fetchedJobStatus, jobInfo, jobs) {
            if (!this.jobStates || Object.keys(this.jobStates).length === 0) {
                this.showMessage('No running jobs!');
                this.setJobCounter(0);
                return;
            }

            // If we don't have any running jobs, just leave a message.
            if (Object.keys(this.jobStates).length === 0) {
                this.$jobsList.empty().append($('<div class="kb-data-loading">').append('No jobs exist for this Narrative!'));
            } else {
                // sort our set of jobs.
                var sortedJobs = Object.keys(this.jobStates);
                sortedJobs.sort(function (a, b) {
                    var aTime = this.jobStates[a].timestamp;
                    var bTime = this.jobStates[b].timestamp;
                    // if we have timestamps for both, compare them
                    if (aTime && bTime)
                        return (new Date(aTime) < new Date(bTime)) ? 1 : -1;
                    else if (aTime) // if we only have one for a, sort for a
                        return 1;
                    else            // if aTime is null, but bTime isn't, (OR they're both null), then put b first
                        return -1;
                }.bind(this));

                var stillRunning = 0;
                for (var i = 0; i < sortedJobs.length; i++) {
                    var jobId = sortedJobs[i];
                    var info = jobInfo[jobId];

                    // if the id shows up in the "render me!" list:
                    // only those we fetched might still be running.
                    if (fetchedJobStatus[jobId]) {
                        // update the state and cell
                        this.jobStates[jobId].status = fetchedJobStatus[jobId].job_state;
                        if (this.jobIsIncomplete(this.jobStates[jobId].status))
                            stillRunning++;
                        this.jobStates[jobId].state = fetchedJobStatus[jobId];


                        this.sendJobMessage('job-status', jobId, {
                            jobId: jobId,
                            jobInfo: jobInfo[jobId],
                            job: jobs[jobId],
                            jobState: this.jobStates[jobId]
                        });

//                        this.sendBusMessage('job-status', {
//                            jobId: jobId,
//                            jobInfo: jobInfo[jobId],
//                            job: jobs[jobId],
//                            jobState: this.jobStates[jobId]
//                        });

                        // updating the given state first allows us to just pass the id and the status set to
                        // the renderer. If the status set doesn't exist (e.g. we didn't look it up in the
                        // kernel), then that's just undefined and the renderer can deal.
                        if (this.jobWidgets[jobId]) {
                            this.jobWidgets[jobId].remove();
                        }
                        this.jobWidgets[jobId] = this.renderJob(jobId, jobInfo[jobId]);
                        this.$jobsList.append(this.jobWidgets[jobId]);
                    }
                }
                this.setJobCounter(stillRunning);
            }
            // hide any showing tooltips, otherwise they just sit there stagnant forever.
            this.$jobsPanel.find('span[data-toggle="tooltip"]').tooltip('hide');
            // this.$jobsPanel.empty().append($jobsList);
            this.showJobsPanel();
        },
        renderJob: function (jobId, jobInfo) {
            var jobState = this.jobStates[jobId];

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
            if (jobInfo && jobInfo.spec && jobInfo.spec.methodSpec && jobInfo.spec.methodSpec.info) {
                jobName = jobInfo.spec.methodSpec.info.name;
            }

            var status = "Unknown";
            if (jobState && jobState.status) {
                status = jobState.status.charAt(0).toUpperCase() +
                    jobState.status.substring(1);
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
            if (jobState.state) {
                if (jobState.state.creation_time) {
                    startedTime = TimeFormat.prettyTimestamp(jobState.state.creation_time);
                }
                if (jobState.state.finish_time) {
                    completedTime = TimeFormat.prettyTimestamp(jobState.state.finish_time);
                    if (jobState.state.creation_time) {
                        runTime = TimeFormat.calcTimeDifference(new Date(jobState.state.exec_start_time), new Date(jobState.state.finish_time));
                    }
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
            if (jobState.state &&
                jobState.state.position !== undefined &&
                jobState.state.position !== null &&
                jobState.state.position > 0) {
                position = jobState.state.position;
            }

            var jobRenderObj = {
                name: jobName,
                hasCell: jobState.cell_id,
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
                    this.triggerJobErrorButton(jobId, jobInfo, errorType);
                }.bind(this));
            }
            if (jobState.cell_id) {
                $jobDiv.find('span.fa-location-arrow').click(function (e) {
                    var cell = Jupyter.narrative.getCellByKbaseId(jobState.cell_id);
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
         * @param {object} jobStatus - the job status object
         * @param {object} jobInfo - the job info object - main keys are 'state' and 'specs'
         * @param {string} btnText - the text of the button. If empty or null, the button just gets a /!\ icon.
         */
        triggerJobErrorButton: function (jobId, jobInfo, errorType) {
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
            } else if (jobState.state.error) {
                errorText = new Handlebars.SafeString('<div class="kb-jobs-error-modal">' + jobState.state.error.message + '</div>');
                errorType = jobState.state.error.name;
                // if (jobState.state.error === 'awe_error')
                //     errorType = 'AWE Error';
            }

            var $modalBody = $(this.jobErrorTmpl({
                jobId: jobId,
                errorType: errorType,
                errorText: errorText,
                hasTraceback: jobState.state.error.error ? true : false
            }));

            if (jobState.state.error.error) {
                new kbaseAccordion($modalBody.find('div#kb-job-err-trace'), {
                    elements: [{
                            title: 'Detailed Error Information',
                            body: $('<pre style="max-height:300px; overflow-y: auto">').append(jobState.state.error.error)
                        }]
                });
            }

            this.jobsModal.setBody($modalBody);
            this.jobsModal.show();
        }
    });
});
