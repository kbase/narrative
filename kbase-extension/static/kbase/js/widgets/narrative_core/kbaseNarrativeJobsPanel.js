/*global define*/
/*jslint white: true*/
define ([
    'kbwidget',
    'bootstrap',
    'jquery',
    'narrativeConfig',
    'kbasePrompt',
    'kbaseNarrativeControlPanel',
    'util/bootstrapDialog',
    'util/timeFormat',
    'util/string',
    'base/js/namespace',
    'nbextensions/methodCell/runtime',
    'services/kernels/comm'
], function(
    KBWidget,
    bootstrap,
    $,
    Config,
    kbasePrompt,
    kbaseNarrativeControlPanel,
    BootstrapDialog,
    TimeFormat,
    StringUtil,
    Jupyter,
    Runtime,
    JupyterComm
) {
    'use strict';
    return KBWidget({
        name: 'kbaseNarrativeJobsPanel',
        parent : kbaseNarrativeControlPanel,
        version: '0.0.1',
        options: {
            loadingImage: Config.get('loading_gif'),
            autopopulate: true,
            title: 'Jobs',
        },
        $jobCountBadge: $('<span>')
                        .addClass('label label-danger'),
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

        refreshTimer: null,
        refreshInterval: 10000,
        comm: null,

        completedStatus: [ 'completed',
                           'done',
                           'deleted',
                           'suspend',
                           'not_found_error',
                           'unauthorized_error',
                           'awe_error' ],

        init: function(options) {
            this._super(options);

            this.title.append(this.$jobCountBadge);

            // $(document).on('registerMethod.Narrative', $.proxy(
            //     function(e, jobInfo) {
            //         this.registerJob(jobInfo, false);
            //     }, this)
            // );

            // $(document).on('registerApp.Narrative', $.proxy(
            //     function(e, jobInfo) {
            //         this.registerJob(jobInfo, true);
            //     }, this)
            // );

            // $(document).on('refreshJobs.Narrative', $.proxy(
            //     // function(e) {
            //     //     this.refresh();
            //     // }, this)
            // );

            $(document).on('cancelJobCell.Narrative', $.proxy(
                function(e, cellId, showPrompt, callback) {
                    // Find job based on cellId
                    var jobId = this.source2Job[cellId];

                    // If we can't find the job, then it's not being tracked, so we
                    // should just assume it's gone already and return true to the callback.
                    if (jobId === undefined && callback)
                        callback(true);
                    else if (jobId !== undefined) {
                        if (showPrompt)
                            this.openJobDeletePrompt(jobId, null, callback);
                        else
                            this.deleteJob(jobId, callback);
                    }
                }, this)
            );

            var $refreshBtn = $('<button>')
                              .addClass('btn btn-xs btn-default')
                              .append($('<span>')
                                      .addClass('glyphicon glyphicon-refresh'))
                              .tooltip({
                                    title : 'Refresh job status',
                                    container : 'body',
                                    delay: {
                                        show: Config.get('tooltip').showDelay,
                                        hide: Config.get('tooltip').hideDelay
                                    }
                              })
                              .click(function(event) {
                                  $refreshBtn.tooltip('hide');
                                  console.log('sending refresh signal');
                                  if (this.comm) {
                                      this.comm.send({target_name: 'KBaseJobs',
                                                      request_type: 'all_status'});
                                  }
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
                .click(function(event) {
                    this.jobsModal.hide();
                    this.removeId = null;
                }.bind(this)),

                $('<a type="button" class="btn btn-danger">')
                .append('Delete Job')
                .click(function(event) {
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
                // this.refresh();
            }

            return this;
        },

        updateCellRunStatus: function (msg) {
            var runtime = Runtime.make();
            // The global runtime bus is a catch all for proving messaging semantics across otherwise unconnected apps.
            // note that we need to copy the objects for the message bus since they will otherwise
            // be modified by incoming updates.
            function copyObject(obj) {
                return JSON.parse(JSON.stringify(obj));
            }
            runtime.bus().send({
                type: 'runstatus',
                data: copyObject(msg)
            });
        },

        handleCommMessages: function(msg) {
            var msgType = msg.content.data.msg_type;
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
                        if (status[jobId].finished === 1 && this.comm) {
                            this.comm.send({
                                target_name: 'KBaseJobs',
                                request_type: 'stop_job_update',
                                job_id: jobId
                            });
                        }
                    }
                    this.populateJobsPanel(status, info, content);
                    break;
                case 'run_status':
                    this.updateCellRunStatus(msg.content.data.content);
                    break;
                case 'job_err':
                    console.error('Job Error', msg);
                    break;
                case 'job_canceled':
                    var canceledId = msg.content.data.content.job_id;
                    console.info('Canceled job ' + canceledId);
                    break;
                default:
                    console.warn("Unhandled KBaseJobs message from kernel (type='" + msgType + "'):");
                    console.warn(msg);
            }
        },

        initCommChannel: function() {
            // init the listener channel.
            // console.info('Registering Job channel with kernel.');
            // console.info('Checking for existing channel?');

            this.comm = null;

            Jupyter.notebook.kernel.comm_info('KBaseJobs', function(msg) {
                // console.info(msg);
                if (msg.content && msg.content.comms) {
                    // console.info('Found an existing channel!');
                    // console.info(msg);
                    // skim the reply for the right id
                    for (var id in msg.content.comms) {
                        if (msg.content.comms[id].target_name === 'KBaseJobs') {
                            this.comm = new JupyterComm.Comm('KBaseJobs', id);
                            Jupyter.notebook.kernel.comm_manager.register_comm(this.comm);
                            this.comm.on_msg(this.handleCommMessages.bind(this));
                        }
                    }
                }
                if (this.comm === null) {
                    Jupyter.notebook.kernel.comm_manager.register_target('KBaseJobs', function(comm, msg) {
                        this.comm = comm;
                        comm.on_msg(this.handleCommMessages.bind(this));
                    }.bind(this));
                }
                // init the backend with existing jobs.
                if (this.jobStates === null)
                    this.initJobStates();

                var code = this.getJobInitCode();
                Jupyter.notebook.kernel.execute(code);
            }.bind(this));
        },

        getJobInitCode: function() {
            var jobTuples = [];
            for (var jobId in this.jobStates) {
                var jobInfo = this.jobStates[jobId];
                var source = 'None';
                if (jobInfo.source) {
                    source = jobInfo.source;
                }
                var inputs = {};
                if (jobInfo.inputs) {
                    inputs = jobInfo.inputs;
                }
                // else if (source !== 'None') {
                //     var cell = Jupyter.narrative.getCellByKbaseId(source);
                //     if (cell && cell.metadata && cell.metadata['kb-cell']) {
                //         var state = cell.metadata['kb-cell']['widget_state'];
                //         if (state.length > 0) {
                //             if (state[0].state.params) {
                //                 inputs = state[0].state.params;
                //                 //whew.
                //             }
                //         }
                //     }
                // }
                var tag = 'release';
                if (jobInfo.tag) {
                    tag = jobInfo.tag;
                }
                jobTuples.push("('" + jobId + "', '" + StringUtil.safeJSONStringify(inputs) + "', '" + tag + "', '" + source + "')");

            }
            return ["from biokbase.narrative.jobs import JobManager",
                    "JobManager().initialize_jobs([" + jobTuples.join(',') + "])"].join('\n');
        },

        setJobCounter: function(numJobs) {
            this.$jobCountBadge.empty();
            if (numJobs > 0)
                this.$jobCountBadge.append(numJobs);
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
        initJobStates: function() {
            if (this.jobStates === null)
                this.jobStates = {};
            if (Jupyter.notebook && Jupyter.notebook.metadata && Jupyter.notebook.metadata.job_ids) {
                // this is actually like: ['apps': [list of app jobs], 'methods':[list of method jobs]
                var jobIds = Jupyter.notebook.metadata.job_ids;
                for (var jobType in jobIds) {
                    if (!(jobIds[jobType] instanceof Array))
                        continue;
                    for (var i=0; i<jobIds[jobType].length; i++) {
                        var job = jobIds[jobType][i];
                        this.jobStates[job.id] = $.extend({}, { 'status' : null, '$elem' : null, 'id' : job.id }, job);
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
         * @param {function} callback - a callback to invoke when finished.
         */
        openJobDeletePrompt: function(jobId, jobState, callback) {
            if (!jobId)
                return;

            var removeText = "Deleting this job will remove it from your Narrative. Any already generated data will be retained. Continue?";
            var warningText = "";

            if (jobState) {
                jobState = jobState.toLowerCase();
                var jobState = jobState.toLowerCase();
                if (jobState === 'queued' || jobState === 'running' || jobState === 'in-progress') {
                    warningText = "This job is currently running on KBase servers! Removing it will attempt to stop the running job.";
                }
                else if (jobState === 'completed') {
                    warningText = "This job has completed running. You may safely remove it without affecting your Narrative.";
                }
            }
            this.jobsModal.setBody($('<div>').append(warningText + '<br><br>' + removeText));
            this.jobsModal.setTitle('Remove Job?');
            this.removeId = jobId;

            this.deleteCallback = callback;
            this.jobsModal.show();
        },

        /**
         * Attempts to delete a job in the backend (by making a kernel call - this lets the kernel decide
         * what kind of job it is and how to stop/delete it).
         * When it gets a response, it then clears the job from the Jobs list.
         */
        deleteJob: function(jobId, callback) {
            var deleteJobCmd = 'from biokbase.narrative.common.kbjob_manager import KBjobManager\n' +
                               'jm = KBjobManager()\n' +
                               'print jm.delete_jobs(["' + jobId + '"], as_json=True)\n';

            var self = this;
            var callbacks = {
                shell: {
                    reply: function(content) {
                        self.handleCallback('reply', content);
                    },
                    payload: {
                        set_next_input: function(content) {
                           self.handleCallback('set_next_input', content);
                       },
                    },
                },
                iopub: {
                    output: function(content) {
                        var response = self.deleteResponse(content.msg_type, content, jobId);
                        if (callback)
                            callback(response);
                    },
                    clear_output: function(content) {
                        self.handleCallback('clear_output', content);
                    },
                },
                input: function(content) {
                    self.handleCallback('input', content);
                }
            };

            var executeOptions = {
                silent: true,
                user_expressions: {},
                allow_stdin: false,
                store_history: false
            };

            Jupyter.notebook.kernel.execute(deleteJobCmd, callbacks, executeOptions);
        },

        /**
         * @method
         * When we get the deletion response from the kernel, we should delete the job.
         * We should *probably* just delete the job anyway, whether there's an error or not.
         */
        deleteResponse: function(msgType, content, jobId) {
            if (msgType != 'stream') {
                console.error('An error occurred while trying to delete a job');
                // this.refresh(false);
                return;
            }
            var result = content.data;
            try {
                result = JSON.parse(result);
            }
            catch(err) {
                // ignore and return. assume it failed.
                // I guess we don't really care if it fails, though, the user just wants that job to go away.
                // Comment this out for now, until we make some sensible error popup or something.
                // return false;
            }

            // first, wipe the metadata
            var appIds = Jupyter.notebook.metadata.job_ids.apps;
            appIds = appIds.filter(function(val) { return val.id !== jobId });
            Jupyter.notebook.metadata.job_ids.apps = appIds;

            // ...and from the method list
            var methodIds = Jupyter.notebook.metadata.job_ids.methods;
            methodIds = methodIds.filter(function(val) { return val.id !== jobId });
            Jupyter.notebook.metadata.job_ids.methods = methodIds;

            // remove it from the 'cache' in this jobs panel
            delete this.source2Job[this.jobStates[jobId].source];
            delete this.jobStates[jobId];

            // nuke the removeId
            this.removeId = null;

            // save the narrative!
            Jupyter.notebook.save_checkpoint();


            // this.refresh(false);
            return true;
        },

        /**
         * Shows a loading spinner or message on top of the panel.
         * @private
         */
        showMessage: function(message, loading) {
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
        showJobsPanel: function() {
            this.$errorPanel.hide();
            this.$loadingPanel.hide();
            this.$jobsPanel.show();
        },

        /**
         * @method
         * Similar to registerJob below, this registers a job that was started by the Kernel, then pushed over
         * the KBaseJobs comm channel. This expects the following elements (will be replaced with null if not present):
         * id - string, required - will fail if not present
         * method_id - string
         * tag - string
         * version - string
         * inputs - semi-random object - keys are the input values, values are, well, the inputs
         * cell_id - string, optional - the id of the KBase cell that started the job
         */
        registerKernelJob: function(jobInfo) {
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
            this.jobStates[jobInfo.id] = $.extend({}, jobInfo, {'status' : null});
            this.source2Job[jobInfo.source] = jobInfo.id;
            Jupyter.notebook.save_checkpoint();
        },

        /**
         * @method
         * @obsolete
         * Registers a job with the Narrative. This adds its job id and source of the job (the cell that started it) to
         * the narrative metadata. It also starts caching the state internally to the jobs panel. Once all this is done,
         * so the user doesn't accidentally lose the job, it triggers a narrative save.
         */
        registerJob: function(jobInfo, isApp) {
            // // Check to make sure the Narrative has been instantiated to begin with.
            // if (!Jupyter || !Jupyter.notebook || !Jupyter.notebook.kernel || !Jupyter.notebook.metadata)
            //     return;

            // // If the job ids hasn't been inited yet, or it was done in the old way (as an array) then do it.
            // if (!Jupyter.notebook.metadata.job_ids ||
            //     Object.prototype.toString.call(Jupyter.notebook.metadata.job_ids) === '[object Array]') {
            //     Jupyter.notebook.metadata.job_ids = {
            //         'methods' : [],
            //         'apps' : []
            //     };
            // }
            // // Double-check that it has the right properties
            // if (!Jupyter.notebook.metadata.job_ids['methods'])
            //     Jupyter.notebook.metadata.job_ids['methods'] = [];
            // if (!Jupyter.notebook.metadata.job_ids['apps'])
            //     Jupyter.notebook.metadata.job_ids['apps'] = [];

            // var type = isApp ? 'apps' : 'methods';
            // Jupyter.notebook.metadata.job_ids[type].push(jobInfo);
            // // put a stub in the job states
            // this.jobStates[jobInfo.id] = $.extend({}, jobInfo, {'status' : null, '$elem' : 'null'});
            // this.source2Job[jobInfo.source] = jobInfo.id;
            // // save the narrative!
            // Jupyter.notebook.save_checkpoint();

            // this.refresh();
        },

        /*
         * For now, ':' is the delimiter.
         * Anything before ':' is the job type.
         */
        jobTypeFromId: function(jobId) {
            if (jobId.indexOf(':') === -1)
                return 'ujs';
            else {
                var type = jobId.split(':')[0];
                return type.toLowerCase();
            }
        },

        /**
         * There are a few different status options that show a job is complete vs.
         * incomplete. We mark ones as "running" for our purpose if they do not
         * have any of these statuses.
         * @method
         * @private
         */
        jobIsIncomplete: function(status) {
            if (!status)
                return true;

            status = status.toLowerCase();
            // if status matches any of the possible cases in this.completedStatus,
            // return true
            for (var i=0; i<this.completedStatus.length; i++) {
                if (status.indexOf(this.completedStatus[i]) !== -1)
                    return false;
            }
            if (status === 'error')
                return false;
            return true;
        },

        /**
         * @method
         */
        // refresh: function(hideLoadingMessage, initStates) {
        //     // console.log('JOB PANEL: refresh');
        //     if (this.jobStates === null || initStates)
        //         this.initJobStates();

        //     // if there's no timer, set one up - this should only happen the first time.
        //     // if (this.refreshTimer === null) {
        //     //     this.refreshTimer = setInterval(
        //     //         $.proxy(function() { this.refresh(true, false); }, this),
        //     //         this.refreshInterval
        //     //     );
        //     // }

        //     // If none of the base Jupyter stuff shows up, then it's not inited yet.
        //     // Just return silently.
        //     if (!Jupyter || !Jupyter.notebook || !Jupyter.notebook.kernel ||
        //         !Jupyter.notebook.metadata || !Jupyter.notebook.kernel.is_connected())
        //         return;

        //     // If we don't have any job ids, or it's length is zero, just show a
        //     // message and return.
        //     if (!Jupyter.notebook.metadata.job_ids ||
        //         Jupyter.notebook.metadata.job_ids.length === 0 ||
        //         Object.keys(this.jobStates).length === 0) {
        //         this.populateJobsPanel();
        //         return;
        //     }

        //     // If we're in readonly mode, don't lookup job info.
        //     if (!Jupyter.narrative || Jupyter.narrative.readonly === true) {
        //         return;
        //     }

        //     if (!hideLoadingMessage)
        //         this.showLoadingMessage('Loading running jobs...');



        //     // console.log(['REFRESH: looking up ' + jobParamList.length]);
        //     // console.log(['REFRESH: jobstates:', this.jobStates]);
        //     this.startJobPoll();

        // },

        // startJobPoll: function () {
        //     // This contains all the job info like this:
        //     // { jobId: {spec: {}, state: {}} }
        //     var jobInfo = {};
        //     // This contains the list of lookup parameters for each job.
        //     // We pass back all specs/parameters so the back end can munge them into the right
        //     // output structures.
        //     var jobParamList = [];

        //     for (var jobId in this.jobStates) {
        //         var jobState = this.jobStates[jobId];
        //         // if the job's incomplete, we have to go get it.
        //         var jobIncomplete = this.jobIsIncomplete(jobState.status);

        //         // The type dictates what cell it came from and how to deal with the inputs.
        //         var jobType = this.jobTypeFromId(jobId);
        //         var specInfo = null;
        //         var $sourceCell = $('#' + jobState.source);
        //         if ($sourceCell.length > 0) {  // if the source cell is there (kind of a jQuery trick).
        //             // if it's an NJS job, then it's an App cell, so fetch all that info.
        //             if (jobType === "njs") {
        //                 specInfo = $sourceCell.kbaseNarrativeAppCell('getSpecAndParameterInfo');
        //                 if (specInfo && jobIncomplete) {
        //                     jobParamList.push("['" + jobId + "', " +
        //                                       "'" + StringUtil.safeJSONStringify(specInfo.appSpec) + "', " +
        //                                       "'" + StringUtil.safeJSONStringify(specInfo.methodSpecs) + "', " +
        //                                       "'" + StringUtil.safeJSONStringify(specInfo.parameterValues) + "']");
        //                 }
        //             }
        //             // otherwise, it's a method cell, so fetch info that way.
        //             else {
        //                 // console.log('JOB PANEL: looking up spec info for ' + jobState.source);
        //                 specInfo = $sourceCell.kbaseNarrativeMethodCell('getSpecAndParameterInfo');
        //                 // console.log('JOB PANEL: ', specInfo);
        //                 if (jobIncomplete) {
        //                     if (specInfo) {
        //                         jobParamList.push("['" + jobId + "', " +
        //                                           "'" + StringUtil.safeJSONStringify(specInfo.methodSpec) + "', " +
        //                                           "'" + StringUtil.safeJSONStringify(specInfo.parameterValues) + "']");
        //                     }
        //                     else {
        //                         jobParamList.push("['" + jobId + "']");
        //                     }
        //                 }
        //             }
        //             jobInfo[jobId] = { 'spec': specInfo };
        //         }
        //         else
        //             this.jobStates[jobId].status = 'error';
        //     }

        //     var pollJobsCommand = 'from biokbase.narrative.common.kbjob_manager import KBjobManager\n' +
        //                           'job_manager = KBjobManager()\n' +
        //                           'print job_manager.poll_jobs([' + jobParamList + '], as_json=True)\n';

        //     var self = this;
        //     var callbacks = {
        //         shell: {
        //             reply: function(content) {
        //                 self.handleCallback('reply', content);
        //             },
        //             payload: {
        //                 set_next_input: function(content) {
        //                    self.handleCallback('set_next_input', content);
        //                },
        //             },
        //         },
        //         iopub: {
        //             output: function(content) {
        //                 self.parseKernelResponse(content, jobInfo);
        //             },
        //             clear_output: function(content) {
        //                 self.handleCallback('clear_output', content);
        //             },
        //         },
        //         input: function(content) {
        //             self.handleCallback('input', content);
        //         }
        //     };

        //     var executeOptions = {
        //         silent: true,
        //         user_expressions: {},
        //         allow_stdin: false,
        //         store_history: false
        //     };

        //     // console.log('JOB PANEL: calling kernel about jobs');

        //     if (Jupyter.notebook.kernel.is_connected())
        //         Jupyter.notebook.kernel.execute(pollJobsCommand, callbacks, executeOptions);
        //     else {
        //         console.log('Not looking up jobs - kernel is not connected.')
        //     }
        // },

        /**
         * @method
         * Get the kernel response and render it if it's valid.
         */
        // parseKernelResponse: function(content, jobInfo) {
        //     // if it's not a datastream, display some kind of error, and return.
        //     if (content.msg_type !== 'stream') {
        //         this.showError('Sorry, an error occurred while loading the job list.');
        //         return;
        //     }
        //     var buffer = content.content.text;
        //     if (buffer.length > 0) {
        //         var jobStatus = JSON.parse(buffer);
        //         this.populateJobsPanel(jobStatus, jobInfo);
        //     }
        //     this.$loadingPanel.hide();
        //     this.$jobsPanel.show();
        // },

        /**
         * @method
         * Generic callback handler for the Jupyter kernel.
         */
        handleCallback: function(call, content) {
            if (content.status === 'error') {
                this.showError(content);
            }
            else {
                // commented out for now
                // console.debug('kbaseJobManagerPanel.' + call);
                // console.debug(content);
            }
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
        populateJobsPanel: function(fetchedJobStatus, jobInfo, jobs) {
            if (!this.jobStates || Object.keys(this.jobStates).length === 0) {
                this.showMessage('No running jobs!');
                this.setJobCounter(0);
                return;
            }

            // Instantiate a shiny new panel to hold job info.
            // var $jobsList = $('<div>').addClass('kb-jobs-items');

            // If we don't have any running jobs, just leave a message.
            if (Object.keys(this.jobStates).length === 0) {
                this.$jobsList.empty().append($('<div class="kb-data-loading">').append('No jobs exist for this Narrative!'));
            }
            else {
                // sort our set of jobs.
                var sortedJobs = Object.keys(this.jobStates);
                sortedJobs.sort(function(a, b) {
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
                for (var i=0; i<sortedJobs.length; i++) {
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
                        this.updateCell(jobId, jobInfo[jobId], jobs[jobId]);
                    }
                    // updating the given state first allows us to just pass the id and the status set to
                    // the renderer. If the status set doesn't exist (e.g. we didn't look it up in the
                    // kernel), then that's just undefined and the renderer can deal.
                    if (this.jobWidgets[jobId]) {
                        this.jobWidgets[jobId].remove();
                    }
                    this.jobWidgets[jobId] = this.renderJob(jobId, jobInfo[jobId]);
                    this.$jobsList.append(this.jobWidgets[jobId]);
                    // $jobsList.append(this.renderJob(jobId, jobInfo[jobId]));
                }
                this.setJobCounter(stillRunning);
            }
            // hide any showing tooltips, otherwise they just sit there stagnant forever.
            this.$jobsPanel.find('span[data-toggle="tooltip"]').tooltip('hide');
            // this.$jobsPanel.empty().append($jobsList);
            this.showJobsPanel();
        },

        renderJob: function(jobId, jobInfo) {
            var getStepSpec = function(id, spec) {
                for (var i=0; i<spec.steps.length; i++) {
                    if (id === spec.steps[i].step_id)
                        return spec.steps[i];
                }
                return null;
            };

            // get the state from this.jobStates[jobInfo.]
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
            var jobType = this.jobTypeFromId(jobId);

            var $jobDiv = $('<div>')
                          .addClass('kb-data-list-obj-row');
            // jobinfo: {
            //     state: { id, source, target, timestamp, $elem, status },
            //     spec: { appSpec?, methodSpec?, methodSpecs?, parameterValues }
            //     type=njs: appSpec, methodSpecs
            //     type=method: methodSpec
            // }
            var specType = null;
            switch(jobType) {
                case 'njs':
                    specType = 'appSpec';
                    break;
                case 'method':
                    specType = 'methodSpec';
                    break;
                default:
                    specType = 'methodSpec';
                    break;
            }

            // get the job's name from its spec
            var jobName = "Unknown " + ((jobType === 'njs') ? "App" : "Method");
            if (jobInfo && jobInfo.spec && jobInfo.spec[specType] && jobInfo.spec[specType].info)
                jobName = jobInfo.spec[specType].info.name;

            var $jobInfoDiv = $('<div class="kb-data-list-name kb-data-list-job-name">')
                               .append(jobName);
            var $jobControlDiv = $('<span class="pull-right">')
                                 .append(this.makeJobClearButton(jobId, jobState.status))
                                 .append('<br>')
                                 .append(this.makeScrollToButton(jobState.source));
            $jobInfoDiv.append($jobControlDiv)
                       .append($('<div style="font-size:75%">')
                               .append(jobId));

            var status = "Unknown";
            if (jobState) {
                // console.log('JOBSTATE', jobState);
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
            if (jobState.state) {
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
            switch(status) {
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
                    status = this.makeJobErrorButton(jobId, jobInfo, 'Network Error');
                    break;
                default:
                    break;
            }
            if (errorType !== null) {
                status = this.makeJobErrorButton(jobId, jobInfo, errorType);
                $jobDiv.addClass('kb-jobs-error');
            }
            // else if (jobState.state && jobState.state.step_errors && Object.keys(jobState.state.step_errors).length !== 0) {
            //     var $errBtn = this.makeJobErrorButton(jobId, jobInfo);
            //     status = $('<span>').append(status + ' ')
            //                         .append($errBtn);
            // }
            else {
                if (jobType === "njs" && jobState.state) {
                    var stepId = jobState.state.running_step_id;
                    if (stepId) {
                        var stepSpec = getStepSpec(stepId, jobInfo.spec.appSpec);
                        task = jobInfo.spec.methodSpecs[stepSpec.method_id].info.name;
                    }
                }
                if (jobState.state && jobState.state.position !== undefined && jobState.state.position !== null && jobState.state.position > 0)
                    position = jobState.state.position;
                if (completedTime)
                    status += ' ' + completedTime;
            }

            var $infoTable = $('<table class="kb-jobs-info-table">')
                             .append(this.makeInfoRow('Status', status));
            if (task !== null)
                $infoTable.append(this.makeInfoRow('Task', task));
            if (position !== null && status.toLowerCase().indexOf('queue') != -1)
                $infoTable.append(this.makeInfoRow('Queue Position', position));

            if (runTime) {
                $infoTable.append(this.makeInfoRow('Run Time', runTime));
            }
            if (jobState.state && jobState.state.creation_time) {
                started = $(TimeFormat.prettyTimestamp(jobState.state.creation_time));
                started.tooltip({
                    container: 'body',
                    placement: 'right',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay
                    }
                });
                $infoTable.append(this.makeInfoRow('Started', started));
            }

            $jobDiv.append($jobInfoDiv)
                   .append($infoTable);
            return $jobDiv;
        },

        /**
         * @method
         * Updates the status of the cell the given job is associated with. This figures out
         * which cell type it needs to talk to, then sends a message to that cell.
         * 'job' = the response from the server about the job. Contains info from the job service
         * 'jobInfo' = the info we know about the running job: its id, associated cell, etc.
         */
        updateCell: function(jobId, jobInfo, job) {
            var jobState = this.jobStates[jobId];
            var source = jobState.source;
            var jobType = this.jobTypeFromId(jobId);

            // console.log(['UPDATE_CELL', jobId, jobInfo]);
            var status = '';
            if (jobState.status)
                status = jobState.status.toLowerCase();

            // don't do anything if we don't know the source cell. it might have been deleted.
            if (!source) {
                // console.error("Unknown input cell for job id " + jobId + "! Exiting.");
                return;
            }

            // The job "source" is the permanent cell id.
            var runtime = Runtime.make();
            // The global runtime bus is a catch all for proving messaging semantics across otherwise unconnected apps.
            // note that we need to copy the objects for the message bus since they will otherwise
            // be modified by incoming updates.
            function copyObject(obj) {
                return JSON.parse(JSON.stringify(obj));
            }
            runtime.bus().send({
                type: 'jobstatus',
                jobId: jobId,
                jobInfo: jobInfo,
                job: job,
                jobState: copyObject(jobState)
            });
            return;

            // // if it's running and an NJS job, then it's in an app cell
            // if (jobState.state.running_step_id && jobType === 'njs') {
            //     $cell.kbaseNarrativeAppCell('setRunningStep', jobState.state.running_step_id);
            // }
            // // if it's a ujs or method job, then it's a method cell
            // else if (jobType === 'ujs' || jobType === 'method') {
            //     // assume we have 'in-progress' or 'running' vs. 'complete' or 'done'
            //     var submitState = 'complete';
            //     if (status.indexOf('run') != -1 || status.indexOf('progress') != -1 || status.indexOf('started') != -1)
            //         submitState = 'running';
            //     else if (status.indexOf('queue') != -1 || status.indexOf('submit') != -1)
            //         submitState = 'submitted';
            //     $cell.kbaseNarrativeMethodCell('changeState', submitState,
            //             {'job_id': jobId, 'job_state': jobState, 'job_info': jobInfo});
            // }
            // // if we have outputs, those need to be passed along
            // if (jobState.state.widget_outputs && Object.keys(jobState.state.widget_outputs).length > 0) {
            //     if (jobType === 'njs') {
            //         for (var key in jobState.state.widget_outputs) {
            //             if (jobState.state.widget_outputs.hasOwnProperty(key)) {
            //                 try {
            //                     $cell.kbaseNarrativeAppCell('setStepOutput', key, jobState.state.widget_outputs[key]);
            //                 }
            //                 catch (err) {
            //                     console.log(["ERROR'D APP OUTPUT", err]);
            //                 }
            //             }
            //         }
            //     }
            //     else {
            //         try {
            //             // console.log('setting method cell output for ', source, jobState.state.widget_outputs);
            //             $cell.kbaseNarrativeMethodCell('setOutput', { 'cellId' : source, 'result' : jobState.state.widget_outputs });
            //         }
            //         catch (err) {
            //             console.log(["ERROR'D METHOD OUTPUT", err]);
            //         }
            //     }
            // }
            // // if it's an error, then we need to signal the cell
            // if (status === "error" || status === "suspend") { // || (jobState.state.step_errors && Object.keys(jobState.state.step_errors).length !== 0)) {
            //     if (jobType === 'njs') {
            //         $cell.kbaseNarrativeAppCell('setRunningState', 'error');
            //     }
            //     else {
            //         $cell.kbaseNarrativeMethodCell('changeState', 'error',
            //                 {'job_id': jobId, 'job_state': jobState, 'job_info': jobInfo});
            //     }
            //     this.completeJob(jobId, this.jobStates[jobId]);
            // }
            // // ...and if it's done, we need to signal that, too. Note that it can be both (i.e. done with errors)
            // if (status.indexOf('complete') !== -1 || status.indexOf('done') !== -1) {
            //     if (jobType === 'njs') {
            //         $cell.kbaseNarrativeAppCell('setRunningState', 'complete');
            //     }
            //     this.completeJob(jobId, this.jobStates[jobId]);
            // }

            // other statuses - network_error, not_found_error, unauthorized_error, etc. - are ignored for now.
        },

        /**
         * Internally "completes" a job by serializing its final state in the job metadata
         * and updating the total queue time and run time that it went through.
         * This'll have to make its way to the object metadata on save, as well.
         * Maybe it should trigger a save?
         */
        completeJob: function(jobId, jobState) {
            // from the jobState, need 3 things:
            // jobState.state.complete_time
            // jobState.state.start_time
            // jobState.state.submit_time

            // these are all a little off (due to clock skew)
            // from the click time. so don't use that.
            var state = jobState.state;
            if (state) {
                var compTime = null;
                var startTime = null;
                var subTime = null;

                if (state.ujs_info) {
                    if (state.ujs_info[5])
                        compTime = state.ujs_info[5];
                    if (state.ujs_info[3])
                        startTime = state.ujs_info[3];
                }
                else {
                    if (state.complete_time)
                        compTime = state.complete_time;
                    if (state.start_time)
                        startTime = state.start_time;
                    if (state.submit_time)
                        subTime = state.submit_time;
                }

                var queueTime = 0;
                var runTime = 0;
                // 1. calc total queue time
                if (startTime && subTime) {
                    queueTime = new Date(startTime) - new Date(subTime);
                }
                if (compTime && startTime) {
                    runTime = new Date(compTime) - new Date(startTime);
                }
                if (Jupyter.notebook.metadata.job_ids.job_usage) {
                    Jupyter.notebook.metadata.job_ids.job_usage.run_time += runTime;
                    Jupyter.notebook.metadata.job_ids.job_usage.queue_time += queueTime;
                }
                else {
                    Jupyter.notebook.metadata.job_ids.job_usage = {
                        run_time : runTime,
                        queue_time : queueTime
                    };
                }
                // I kinda hate how I did this to begin with, but here's the least-resistant path.
                // We basically have to search. Lame.
                for (var i=0; i<Jupyter.notebook.metadata.job_ids.apps.length; i++) {
                    if (Jupyter.notebook.metadata.job_ids.apps[i].id === jobId)
                        Jupyter.notebook.metadata.job_ids.apps[i] = jobState;
                }
                for (var i=0; i<Jupyter.notebook.metadata.job_ids.methods.length; i++) {
                    if (Jupyter.notebook.metadata.job_ids.methods[i].id === jobId)
                        Jupyter.notebook.metadata.job_ids.methods[i] = jobState;
                }
            }
        },

        /**
         * @method
         * Dummy convenience method to make a little table row.
         */
        makeInfoRow: function(heading, info) {
            return $('<tr>').append($('<th>')
                                    .append(heading + ':'))
                            .append($('<td>')
                                    .append(info));
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
        makeJobErrorButton: function(jobId, jobInfo, btnText) {
            var jobState = this.jobStates[jobId];
            var removeText = "Deleting this job will remove it from your Narrative. Any generated data will be retained. Continue?";
            var headText = "An error has been detected in this job!";
            var errorText = "The KBase servers are reporting an error for this job:";
            var errorType = "Unknown";

            var $errBtn = $('<div>')
                          .addClass('btn btn-danger btn-xs kb-jobs-error-btn')
                          .append('<span class="fa fa-warning" style="color:white"></span>');
            if (btnText)
                $errBtn.append(' ' + btnText);
            $errBtn.click($.proxy(function(e) {
                this.removeId = jobId;
                /* 1. jobState.source doesn't exist = not pointed at a cell
                 * 2. $('#jobState.source') doesn't exist = cell is missing
                 * 3. jobstate.state.error is a string.
                 * 4. jobstate.state is missing.
                 */
                if (!jobState || !jobState.source) {
                    errorText = "This job is not associated with a Running Cell.";
                    errorType = "Unknown Cell";
                }
                else if ($('#' + jobState.source).length === 0) {
                    errorText = "The App Cell associated with this job can no longer be found in your Narrative.";
                    errorType = "Missing Cell";
                }
                else if (btnText === 'Deleted') {
                    errorText = "This job has already been deleted from KBase Servers.";
                    errorType = "Invalid Job";
                }
                else if (btnText === 'Job Not Found') {
                    errorText = "This job was not found to be running on KBase Servers. It may have been deleted, or may not be started yet.";
                    errorType = "Invalid Job";
                }
                else if (btnText === 'Unauthorized') {
                    errorText = "You do not have permission to view information about this job.";
                    errorType = "Unauthorized";
                }
                else if (btnText === 'Network Error') {
                    errorText = "An error occurred while looking up job information. Please refresh the jobs panel to try again.";
                    errorType = "Network";
                }
                else if (jobState.state.error) {
                    errorText = $('<div class="kb-jobs-error-modal">').append(jobState.state.error);
                    errorType = "Runtime";
                    if (jobState.state.error === 'awe_error')
                        errorType = 'AWE Error';
                }

                /* error types:
                 * 1. jobState.state.error is a real string. Just cough it up.
                 * 2. jobState.state is missing
                 * 3. jobInfo is partly missing (e.g., lost the cell that it should point to)
                 * 4. jobInfo is still partly missing (e.g., dont' know what cell it should point to)
                 */
                else if (Object.keys(jobState.state.step_errors).length !== 0) {
                    errorType = "Runtime";
                    errorText = $('<div class="kb-jobs-error-modal">');
                    for (var stepId in jobState.state.step_errors) {
                        if (jobState.state.step_errors.hasOwnProperty(stepId)) {
                            // contort that into the method name
                            // gotta search for it in the spec for the method id, first.
                            var methodName = "Unknown method: " + stepId;
                            if (this.jobTypeFromId(jobId) === "njs") {
                                var methodId = null;
                                for (var i=0; i<jobInfo.spec.appSpec.steps.length; i++) {
                                    if (stepId === jobInfo.spec.appSpec.steps[i].step_id) {
                                        methodId = jobInfo.spec.appSpec.steps[i].method_id;
                                        break;
                                    }
                                }
                                if (methodId)
                                    methodName = jobInfo.spec.methodSpecs[methodId].info.name;
                            }
                            else {
                                methodName = jobInfo.spec.methodSpec.info.name;
                            }
                            errorText.append($('<b>').append('In ' + methodName + ':<br>'))
                                     .append(jobState.state.step_errors[stepId] + '<br><br>');
                        }
                    }
                }

                var $errorTable = $('<table class="table table-bordered">')
                                  .append(this.makeInfoRow('Id', jobId))
                                  .append(this.makeInfoRow('Type', errorType))
                                  .append(this.makeInfoRow('Error', errorText));

                this.jobsModal.setTitle('Job Error');
                var $modalBody = $('<div>').append(headText)
                                           .append($errorTable);
                if (jobState.state.traceback) {
                    var $tb = $('<div>');
                     new kbaseAccordion($tb, {
                        elements: [{
                            title: 'Detailed Error Information',
                            body: $('<pre style="max-height:300px; overflow-y: auto">').append(jobState.state.traceback)
                        }]
                    });
                    // this.$jobsModalBody.append($tb);
                    $modalBody.append($tb);
                }

                $modalBody.append($('<div>').append(removeText));
                this.jobsModal.setBody($modalBody);
                this.jobsModal.show();

            }, this));
            return $errBtn;
        },


        /**
         * @method
         * @private
         * Makes a little 'x' button to delete a job.
         * @param {string} jobId
         * @param {string} jobStatus
         */
        makeJobClearButton: function(jobId, jobStatus) {
            return $('<span data-toggle="tooltip" title="Remove Job" data-placement="left">')
                   .addClass('btn-xs kb-data-list-more-btn pull-right fa fa-times')
                   .css({'cursor':'pointer'})
                   .click($.proxy(function() {
                       this.openJobDeletePrompt(jobId, jobStatus);
                   }, this))
                   .tooltip();
        },

        /**
         * @method
         * @private
         * Makes a little arrow button to scroll from a job to the associated app/method cell
         */
        makeScrollToButton: function(sourceId) {
            return $('<span data-toggle="tooltip" title="Scroll To App" data-placement="left">')
                   .addClass('btn-xs kb-data-list-more-btn pull-right fa fa-location-arrow')
                   .css({'cursor':'pointer'})
                   .click(function(e) {
                       if (sourceId) {
                           var cell = Jupyter.narrative.getCellByKbaseId(sourceId);
                           Jupyter.narrative.scrollToCell(cell, true);
                       }
                   })
                   .tooltip();
        },

        /**
         * Shows an error text message on top of the panel. All other pieces are hidden.
         * @param {string} error - the text of the error message
         * @private
         */
        showError: function(error) {
            var $errorHeader = $('<div>')
                               .addClass('alert alert-danger')
                               .append('<b>Sorry, an error occurred while loading KBase jobs.</b><br>Please contact the KBase team at <a href="mailto:help@kbase.us?subject=Narrative%20jobs20loading%20error">help@kbase.us</a> with the information below.');

            this.$errorPanel.empty();
            this.$errorPanel.append($errorHeader);

            // If it's a string, just dump the string.
            if (typeof error === 'string') {
                this.$errorPanel.append($('<div>').append(error));
            }

            // If it's an object, expect an error object as returned by the execute_reply callback from the Jupyter kernel.
            else if (typeof error === 'object') {
                var $details = $('<div>');
                $details.append($('<div>').append('<b>Type:</b> ' + error.ename))
                        .append($('<div>').append('<b>Value:</b> ' + error.evalue));

                var $tracebackDiv = $('<div>')
                                 .addClass('kb-function-error-traceback');
                for (var i=0; i<error.traceback.length; i++) {
                    error.traceback[i] = error.traceback[i].replace(/\[\d(;\d+)?m/g, '');
                    $tracebackDiv.append(error.traceback[i] + "<br>");
                }

                var $tracebackPanel = $('<div>');
                var tracebackAccordion = [{'title' : 'Traceback', 'body' : $tracebackDiv}];

                this.$errorPanel.append($details)
                                .append($tracebackPanel);
                 new kbaseAccordion($tracebackPanel, { elements : tracebackAccordion });
            }
            if (this.refreshTimer)
                clearTimeout(this.refreshTimer);

            this.$jobsPanel.hide();
            this.$loadingPanel.hide();
            this.$errorPanel.show();
        },

    });
});
