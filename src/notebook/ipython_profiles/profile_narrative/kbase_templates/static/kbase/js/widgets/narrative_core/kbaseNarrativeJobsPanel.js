"use strict";

(function( $, undefined ) {
    $.KBWidget({
        name: 'kbaseNarrativeJobsPanel',
        parent: 'kbaseNarrativeControlPanel',
        version: '0.0.1',
        options: {
            loadingImage: 'static/kbase/images/ajax-loader.gif',
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

        completedStatus: [ 'completed', 'done', 'deleted', 'suspend', 'not_found_error', 'unauthorized_error', 'awe_error' ],

        init: function(options) {
            this._super(options);
            this.title.append(this.$jobCountBadge);
            $(document).on('registerMethod.Narrative', $.proxy(
                function(e, jobInfo) {
                    this.registerJob(jobInfo, false);
                }, this)
            );

            $(document).on('registerApp.Narrative', $.proxy(
                function(e, jobInfo) {
                    this.registerJob(jobInfo, true);
                }, this)
            );

            $(document).on('refreshJobs.Narrative', $.proxy(
                function(e) {
                    this.refresh();
                }, this)
            );

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
                              .click($.proxy(function(event) { this.refresh(); }, this))
                              .append($('<span>')
                                      .addClass('glyphicon glyphicon-refresh'));

            var $headerDiv = $('<div>')
                              .append('Jobs')
                              .append($('<button>')
                                      .addClass('btn btn-xs btn-default kb-ws-refresh-btn')
                                      .css({'margin-top': '-4px',
                                            'margin-right': '4px'})
                                      .click($.proxy(function(event) { this.refresh(); }, this))
                                      .append($('<span>')
                                              .addClass('glyphicon glyphicon-refresh')));

            this.$methodsList = $('<div>');
            this.$appsList = $('<div>');

            this.$jobsAccordion = $('<div>');
            // Make a function panel for everything to sit inside.
            this.$jobsPanel = $('<div>')
                              .addClass('kb-function-body');

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

            this.$jobsModalBody = $('<div>');
            this.$jobsModalTitle = $('<div>').html('Remove Job?');

            var buttonList = [
                {
                    name : 'Cancel',
                    type : 'default',
                    callback : function(e, $prompt) {
                        $prompt.closePrompt();
                        this.removeId = null;
                    },
                },
                {
                    name : 'Delete Job',
                    type : 'danger',
                    callback : $.proxy(function(e, $prompt) {
                        if (this.removeId) {
                            this.deleteJob(this.removeId);
                        }
                        if (this.deleteCallback)
                            this.deleteCallback(true);
                        this.deleteCallback = null;
                        $prompt.closePrompt();
                    }, this)
                }
            ];
            this.$jobsModal = $('<div>').kbasePrompt({
                title : this.$jobsModalTitle,
                body : this.$jobsModalBody,
                controls : buttonList
            });

            this.addButton($refreshBtn);

            this.body().append(this.$jobsPanel)
                       .append(this.$loadingPanel)
                       .append(this.$errorPanel);

            if (this.options.autopopulate) {
                this.initJobStates();
                this.refresh();
            }


            return this;
        },

        setJobCounter: function(numJobs) {
            this.$jobCountBadge.empty();
            if (numJobs > 0)
                this.$jobCountBadge.append(numJobs);
        },

        /**
         * @method
         * Initializes the jobStates object that the panel knows about.
         * We treat the IPython.notebook.metadata.job_ids as a (more or less) read-only 
         * object for the purposes of loading and refreshing.
         * 
         * At load time, that gets adapted into the jobStates object, which is used to
         * keep track of the job state.
         */
        initJobStates: function() {
            if (this.jobStates === null)
                this.jobStates = {};
            if (IPython.notebook && IPython.notebook.metadata && IPython.notebook.metadata.job_ids) {
                // this is actually like: ['apps': [list of app jobs], 'methods':[list of method jobs]
                var jobIds = IPython.notebook.metadata.job_ids;
                for (var jobType in jobIds) {
                    if (!(jobIds[jobType] instanceof Array))
                        continue;
                    for (var i=0; i<jobIds[jobType].length; i++) {
                        var job = jobIds[jobType][i];
                        this.jobStates[job.id] = $.extend({}, job, { 'status' : null, '$elem' : null, 'id' : job.id });
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
            this.$jobsModalBody.empty().append(warningText + '<br><br>' + removeText);
            this.$jobsModalTitle.empty().html('Remove Job?');
            this.removeId = jobId;

            this.deleteCallback = callback;
            this.$jobsModal.openPrompt();
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

            var callbacks = {
                'output' : $.proxy(function(msgType, content) {
                    var response = this.deleteResponse(msgType, content, jobId);
                    if (callback)
                        callback(response);
                }, this),
                'execute_reply' : $.proxy(function(content) { 
                    this.handleCallback('execute_reply', content); 
                }, this),
                'clear_output' : $.proxy(function(content) { 
                    this.handleCallback('clear_output', content); 
                }, this),
                'set_next_input' : $.proxy(function(content) { 
                    this.handleCallback('set_next_input', content); 
                }, this),
                'input_request' : $.proxy(function(content) { 
                    this.handleCallback('input_request', content); 
                }, this)
            };

            IPython.notebook.kernel.execute(deleteJobCmd, callbacks, {store_history: false, silent: true});
        },

        /**
         * @method
         * When we get the deletion response from the kernel, we should delete the job.
         * We should *probably* just delete the job anyway, whether there's an error or not.
         */
        deleteResponse: function(msgType, content, jobId) {
            if (msgType != 'stream') {
                console.error('An error occurred while trying to delete a job');
                this.refresh(false);
                return;
            }
            var result = content.data;
            try {
                result = JSON.parse(result);
            }
            catch(err) {
                // ignore and return. assume it failed.
                // I guess we don't really care if it fails, though, the user just wants that job to be outro'd.
                // Comment this out for now, until we make some sensible error popup or something.
                // return false;
            }

            // first, wipe the metadata
            var appIds = IPython.notebook.metadata.job_ids.apps;
            appIds = appIds.filter(function(val) { return val.id !== jobId });
            IPython.notebook.metadata.job_ids.apps = appIds;

            // ...and from the method list
            var methodIds = IPython.notebook.metadata.job_ids.methods;
            methodIds = methodIds.filter(function(val) { return val.id !== jobId });
            IPython.notebook.metadata.job_ids.methods = methodIds;

            // remove it from the 'cache' in this jobs panel
            delete this.source2Job[this.jobStates[jobId].source];
            delete this.jobStates[jobId];

            // nuke the removeId
            this.removeId = null;
            
            // save the narrative!
            IPython.notebook.save_checkpoint();


            this.refresh(false);
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

        showLoadingMessage: function(message) {
            this.showMessage(message, true);
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
         * Registers a job with the Narrative. This adds its job id and source of the job (the cell that started it) to 
         * the narrative metadata. It also starts caching the state internally to the jobs panel. Once all this is done,
         * so the user doesn't accidentally lose the job, it triggers a narrative save.
         */
        registerJob: function(jobInfo, isApp) {
            // Check to make sure the Narrative has been instantiated to begin with.
            if (!IPython || !IPython.notebook || !IPython.notebook.kernel || !IPython.notebook.metadata)
                return;

            // If the job ids hasn't been inited yet, or it was done in the old way (as an array) then do it.
            if (!IPython.notebook.metadata.job_ids || 
                Object.prototype.toString.call(IPython.notebook.metadata.job_ids) === '[object Array]') {
                IPython.notebook.metadata.job_ids = {
                    'methods' : [],
                    'apps' : []
                };
            }
            // Double-check that it has the right properties
            if (!IPython.notebook.metadata.job_ids['methods'])
                IPython.notebook.metadata.job_ids['methods'] = [];
            if (!IPython.notebook.metadata.job_ids['apps'])
                IPython.notebook.metadata.job_ids['apps'] = [];

            var type = isApp ? 'apps' : 'methods';
            IPython.notebook.metadata.job_ids[type].push(jobInfo);
            // put a stub in the job states
            this.jobStates[jobInfo.id] = $.extend({}, jobInfo, {'status' : null, '$elem' : 'null'});
            this.source2Job[jobInfo.source] = jobInfo.id;
            // save the narrative!
            IPython.notebook.save_checkpoint();

            this.refresh();
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
        refresh: function(hideLoadingMessage, initStates) {
            if (this.jobStates === null || initStates)
                this.initJobStates();

            // if there's no timer, set one up - this should only happen the first time.
            if (this.refreshTimer === null) {
                this.refreshTimer = setInterval(
                    $.proxy(function() { this.refresh(true, false); }, this),
                    this.refreshInterval
                );
            }

            // If none of the base IPython stuff shows up, then it's not inited yet.
            // Just return silently.
            if (!IPython || !IPython.notebook || !IPython.notebook.kernel || 
                !IPython.notebook.metadata)
                return;

            // If we don't have any job ids, or it's length is zero, just show a 
            // message and return.
            if (!IPython.notebook.metadata.job_ids || 
                IPython.notebook.metadata.job_ids.length === 0 ||
                Object.keys(this.jobStates).length === 0) {
                this.populateJobsPanel();
                return;
            }

            if (!hideLoadingMessage)
                this.showLoadingMessage('Loading running jobs...');

            // This contains all the job info like this:
            // { jobId: {spec: {}, state: {}}}
            var jobInfo = {};
            // This contains the list of lookup parameters for each job.
            // We pass back all specs/parameters so the back end can munge them into the right 
            // output structures.
            var jobParamList = [];

            for (var jobId in this.jobStates) {
                var jobState = this.jobStates[jobId];
                // if the job's incomplete, we have to go get it.
                var jobIncomplete = this.jobIsIncomplete(jobState.status);

                // The type dictates what cell it came from and how to deal with the inputs.
                var jobType = this.jobTypeFromId(jobId);
                var specInfo = null;
                var $sourceCell = $('#' + jobState.source);
                if ($sourceCell.length > 0) {  // if the source cell is there (kind of a jQuery trick).
                    // if it's an NJS job, then it's an App cell, so fetch all that info.
                    if (jobType === "njs") {
                        specInfo = $sourceCell.kbaseNarrativeAppCell('getSpecAndParameterInfo');
                        if (specInfo && jobIncomplete) {
                            jobParamList.push("['" + jobId + "', " +
                                              "'" + this.safeJSONStringify(specInfo.appSpec) + "', " +
                                              "'" + this.safeJSONStringify(specInfo.methodSpecs) + "', " +
                                              "'" + this.safeJSONStringify(specInfo.parameterValues) + "']");
                        }
                    }
                    // otherwise, it's a method cell, so fetch info that way.
                    else {
                        specInfo = $sourceCell.kbaseNarrativeMethodCell('getSpecAndParameterInfo');
                        if (jobIncomplete) {
                            if (specInfo) {
                                jobParamList.push("['" + jobId + "', " +
                                                  "'" + this.safeJSONStringify(specInfo.methodSpec) + "', " +
                                                  "'" + this.safeJSONStringify(specInfo.parameterValues) + "']");
                            }
                            else {
                                jobParamList.push("['" + jobId + "']");
                            }
                        }
                    }
                    jobInfo[jobId] = { 'spec': specInfo };
                }
                else
                    this.jobStates[jobId].status = 'error';
            }

            // console.log(['REFRESH: looking up ' + jobParamList.length]);
            // console.log(['REFRESH: jobstates:', this.jobStates]);

            var pollJobsCommand = 'from biokbase.narrative.common.kbjob_manager import KBjobManager\n' +
                                  'job_manager = KBjobManager()\n' +
                                  'print job_manager.poll_jobs([' + jobParamList + '], as_json=True)\n';
            var callbacks = {
                'output' : $.proxy(function(msgType, content) { 
                    this.parseKernelResponse(msgType, content, jobInfo); 
                }, this),
                'execute_reply' : $.proxy(function(content) { 
                    this.handleCallback('execute_reply', content); 
                }, this),
                'clear_output' : $.proxy(function(content) { 
                    this.handleCallback('clear_output', content); 
                }, this),
                'set_next_input' : $.proxy(function(content) { 
                    this.handleCallback('set_next_input', content); 
                }, this),
                'input_request' : $.proxy(function(content) { 
                    this.handleCallback('input_request', content); 
                }, this),
            };

            var msgid = IPython.notebook.kernel.execute(pollJobsCommand, callbacks, {silent: true, store_history: false});
        },

        /**
         * @method
         * convenience to stringify a structure while escaping everything that needs it.
         * @private
         */
        safeJSONStringify: function(method) {
            var esc = function(s) { 
                return s.replace(/'/g, "&apos;")
                        .replace(/"/g, "&quot;");
            };
            return JSON.stringify(method, function(key, value) {
                return (typeof(value) === 'string') ? esc(value) : value;
            });
        },

        /**
         * @method
         * Get the kernel response and render it if it's valid.
         */
        parseKernelResponse: function(msgType, content, jobInfo) {
            // if it's not a datastream, display some kind of error, and return.
            if (msgType != 'stream') {
                this.showError('Sorry, an error occurred while loading the job list.');
                return;
            }
            var buffer = content.data;
            if (buffer.length > 0) {
                var jobStatus = JSON.parse(buffer);
                this.populateJobsPanel(jobStatus, jobInfo);
            }
            this.$loadingPanel.hide();
            this.$jobsPanel.show();
        },

        /** 
         * @method
         * Generic callback handler for the IPython kernel.
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
        populateJobsPanel: function(fetchedJobStatus, jobInfo) {
            if (!this.jobStates || Object.keys(this.jobStates).length === 0) {
                this.showMessage('No running jobs!');
                this.setJobCounter(0);
                return;
            }

            // Instantiate a shiny new panel to hold job info.
            var $jobsList = $('<div>').addClass('kb-jobs-items');

            // If we don't have any running jobs, just leave a message.
            if (Object.keys(this.jobStates).length === 0) {
                $jobsList.append($('<div class="kb-data-loading">').append('No running jobs!'));
            }
            else {
                // sort our set of jobs.
                var sortedJobs = Object.keys(this.jobStates);
                sortedJobs.sort($.proxy(function(a, b) {
                    var aTime = this.jobStates[a].timestamp;
                    var bTime = this.jobStates[b].timestamp;
                    // if we have timestamps for both, compare them
                    if (aTime && bTime)
                        return (new Date(aTime) < new Date(bTime)) ? 1 : -1;
                    else if (aTime) // if we only have one for a, sort for a
                        return 1;
                    else            // if aTime is null, but bTime isn't, (OR they're both null), then put b first
                        return -1;
                }, this));

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
                        this.updateCell(jobId, jobInfo[jobId]);
                    }
                    // updating the given state first allows us to just pass the id and the status set to
                    // the renderer. If the status set doesn't exist (e.g. we didn't look it up in the 
                    // kernel), then that's just undefined and the renderer can deal.
                    $jobsList.append(this.renderJob(jobId, jobInfo[jobId]));
                }
                this.setJobCounter(stillRunning);
            }
            this.$jobsPanel.empty().append($jobsList);
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

            var $jobInfoDiv = $('<div class="kb-data-list-name">')
                               .append(jobName);
            var $jobControlDiv = $('<span class="pull-right">')
                                 .append(this.makeJobClearButton(jobId, jobState.status))
                                 .append('<br>')
                                 .append(this.makeScrollToButton(jobState.source));
            $jobInfoDiv.append($jobControlDiv)
                       .append($('<div style="font-size:75%">')
                               .append(jobId));

            var status = "Unknown";
            if (jobState)
                status = jobState.status.charAt(0).toUpperCase() + 
                         jobState.status.substring(1);
            var started = "Unknown";
            var position = null;
            var task = null;

            /* Lots of cases for status:
             * suspend, error, unknown, awe_error - do the usual blocked error thing.
             * deleted - treat job as deleted
             * not_found_error - job's not there, so say so.
             * unauthorized_error - not allowed to see it
             * network_error - a (hopefully transient) error response based on network issues. refreshing should fix it.
             * jobstate has step_errors - then at least one step has an error, so we should show them
             * otherwise, no errors, so render their status happily.
             */
            if (status === 'Suspend' || status === 'Error' || status === 'Unknown' || status === 'Awe_error') {
                status = this.makeJobErrorButton(jobId, jobInfo, 'Error');
                $jobDiv.addClass('kb-jobs-error');
            }
            else if (status === 'Deleted') {
                status = this.makeJobErrorButton(jobId, jobInfo, 'Deleted');
                $jobDiv.addClass('kb-jobs-error');                
            }
            else if (status === 'Not_found_error') {
                status = this.makeJobErrorButton(jobId, jobInfo, 'Job Not Found');
                $jobDiv.addClass('kb-jobs-error');
            }
            else if (status === 'Unauthorized_error') {
                status = this.makeJobErrorButton(jobId, jobInfo, 'Unauthorized');
                $jobDiv.addClass('kb-jobs-error');
            }
            else if (status === 'Network_error') {
                status = this.makeJobErrorButton(jobId, jobInfo, 'Network Error');
            }
            else if (jobState.state.step_errors && Object.keys(jobState.state.step_errors).length !== 0) {
                var $errBtn = this.makeJobErrorButton(jobId, jobInfo);
                status = $('<span>').append(status + ' ')
                                    .append($errBtn);
            }
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
            }
            if (jobState.timestamp) {
                started = this.makePrettyTimestamp(jobState.timestamp);
            }
            var $infoTable = $('<table class="kb-jobs-info-table">')
                             .append(this.makeInfoRow('Status', status));
            if (task !== null)
                $infoTable.append(this.makeInfoRow('Task', task));
            if (position !== null)
                $infoTable.append(this.makeInfoRow('Queue Position', position));
            $infoTable.append(this.makeInfoRow('Started', started));

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
        updateCell: function(jobId, jobInfo) {
            var jobState = this.jobStates[jobId];
            var source = jobState.source;
            var jobType = this.jobTypeFromId(jobId);

            // console.log(['UPDATE_CELL', job, jobInfo]);
            var status = '';
            if (jobState.status)
                status = jobState.status.toLowerCase();
            
            // don't do anything if we don't know the source cell. it might have been deleted.
            if (!source)
                return;

            var $cell = $('#' + source);
            // don't do anything if we know what the source should be, but we can't find it.
            if (!$cell)
                return;

            // if it's running and an NJS job, then it's in an app cell
            if (jobState.state.running_step_id && jobType === 'njs') {
                $cell.kbaseNarrativeAppCell('setRunningStep', jobState.state.running_step_id);
            }
            // if it's a ujs or method job, then it's a method cell
            else if (jobType === 'ujs' || jobType === 'method') {
                // assume we have 'in-progress' or 'running' vs. 'complete' or 'done'
                var submitState = 'complete';
                if (status.indexOf('run') != -1 || status.indexOf('progress') != -1 || status.indexOf('started') != -1)
                    submitState = 'running';
                else if (status.indexOf('queue') != -1 || status.indexOf('submit') != -1)
                    submitState = 'submitted';
                $cell.kbaseNarrativeMethodCell('changeState', submitState);
            }
            // if we have outputs, those need to be passed along
            if (jobState.state.widget_outputs && Object.keys(jobState.state.widget_outputs).length > 0) {
                if (jobType === 'njs') {
                    for (var key in jobState.state.widget_outputs) {
                        if (jobState.state.widget_outputs.hasOwnProperty(key)) {
                            try {
                                $cell.kbaseNarrativeAppCell('setStepOutput', key, jobState.state.widget_outputs[key]);
                            }
                            catch (err) {
                                console.log(["ERROR'D APP OUTPUT", err]);
                            }
                        }
                    }
                }
                else {
                    try {
                        $cell.kbaseNarrativeMethodCell('setOutput', { 'cellId' : source, 'result' : jobState.state.widget_outputs });
                    }
                    catch (err) {
                        console.log(["ERROR'D METHOD OUTPUT", err]);
                    }
                }
            }
            // if it's an error, then we need to signal the cell
            if (status === "error" || (jobState.state.step_errors && Object.keys(jobState.state.step_errors).length !== 0)) {
                if (jobType === 'njs') {
                    $cell.kbaseNarrativeAppCell('setRunningState', 'error');
                }
                else {
                    $cell.kbaseNarrativeMethodCell('changeState', 'error');
                }
            }
            // ...and if it's done, we need to signal that, too. Note that it can be both (i.e. done with errors)
            if (status.indexOf('complete') !== -1 || status.indexOf('done') !== -1) {
                if (jobType === 'njs') {
                    $cell.kbaseNarrativeAppCell('setRunningState', 'complete');
                }
            }

            // other statuses - network_error, not_found_error, unauthorized_error, etc. - are ignored for now.
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
                this.$jobsModalTitle.html('Job Error');
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

                this.$jobsModalBody.empty();
                this.$jobsModalBody.append($('<div>').append(headText))
                                   .append($errorTable);
                if (jobState.state.traceback) {
                    var $tb = $('<div>');
                    $tb.kbaseAccordion({
                        elements: [{
                            title: 'Detailed Error Information',
                            body: $('<pre style="max-height:300px; overflow-y: auto">').append(jobState.state.traceback)
                        }]
                    });
                    this.$jobsModalBody.append($tb);
                }

                this.$jobsModalBody.append($('<div>').append(removeText));
                this.$jobsModal.openPrompt();
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
                           $('html, body').animate({ scrollTop: $('#' + sourceId).offset().top-85 }, 1000);
                           $('#' + sourceId).click();
                       }
                   })
                   .tooltip();
        },

        /**
         * @method makePrettyTimestamp
         * Makes a div containing the 'started time' in units of time ago, with a Bootstrap 3 tooltip
         * that gives the exact time.
         *
         * Note that this tooltip needs to be activated with the $().tooltip() method before it'll function.
         *
         * @param timestamp the timestamp to calculate this div around. Should be in a Date.parse() parseable format.
         * @param suffix an optional suffix for the time element. e.g. "ago" or "from now".
         * @return a div element with the timestamp calculated to be in terms of how long ago, with a tooltip containing the exact time.
         * @private
         */
        makePrettyTimestamp: function(timestamp, suffix) {
            var d = this.parseDate(timestamp);

            var parsedTime = this.parseTimestamp(null, d);
            var timediff = this.calcTimeDifference(null, d);
            var timeMillis = d ? d.getTime() : "";

            var timeHtml = '<div href="#" data-toggle="tooltip" title="' + parsedTime + '" millis="' + timeMillis + '" >' + timediff + '</div>';
            return timeHtml;
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

            // If it's an object, expect an error object as returned by the execute_reply callback from the IPython kernel.
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
                $tracebackPanel.kbaseAccordion({ elements : tracebackAccordion });
            }
            if (this.refreshTimer)
                clearTimeout(this.refreshTimer);

            this.$jobsPanel.hide();
            this.$loadingPanel.hide();
            this.$errorPanel.show();
        },

        /**
         * @method parseTimestamp
         * Parses the user_and_job_state timestamp and returns it as a user-
         * readable string in the UTC time.
         *
         * This assumes that the timestamp string is in the following format:
         * 
         * YYYY-MM-DDThh:mm:ssZ, where Z is the difference
         * in time to UTC in the format +/-HHMM, eg:
         *   2012-12-17T23:24:06-0500 (EST time)
         *   2013-04-03T08:56:32+0000 (UTC time)
         * 
         * If the string is not in that format, this method returns the unchanged
         * timestamp.
         *        
         * @param {String} timestamp - the timestamp string returned by the service
         * @returns {String} a parsed timestamp in the format "YYYY-MM-DD HH:MM:SS" in the browser's local time.
         * @private
         */
        parseTimestamp: function(timestamp, dateObj) {
            var d = null;
            if (timestamp)
                d = this.parseDate(timestamp);
            else if(dateObj)
                d = dateObj;

            if (d === null)
                return timestamp;

            var addLeadingZeroes = function(value) {
                value = String(value);
                if (value.length === 1)
                    return '0' + value;
                return value;
            };

            return d.getFullYear() + '-' + 
                   addLeadingZeroes((d.getMonth() + 1)) + '-' + 
                   addLeadingZeroes(d.getDate()) + ' ' + 
                   addLeadingZeroes(d.getHours()) + ':' + 
                   addLeadingZeroes(d.getMinutes()) + ':' + 
                   addLeadingZeroes(d.getSeconds());
        },

        /**
         * @method calcTimeDifference
         * From two timestamps (i.e. Date.parse() parseable), calculate the
         * time difference and return it as a human readable string.
         *
         * @param {String} time - the timestamp to calculate a difference from
         * @returns {String} - a string representing the time difference between the two parameter strings
         */
        calcTimeDifference: function(timestamp, dateObj) {
            var now = new Date();
            var time = null;

            if (timestamp)
                time = this.parseDate(timestamp);
            else if(dateObj)
                time = dateObj;

            if (time === null)
                return 'Unknown time';

            // start with seconds
            var timeRem = Math.abs((time - now) / 1000 );
            var unit = ' sec';

            // if > 60 seconds, go to minutes.
            if (timeRem >= 60) {
                timeRem /= 60;
                unit = ' min';

                // if > 60 minutes, go to hours.
                if (timeRem >= 60) {
                    timeRem /= 60;
                    unit = ' hrs';

                    // if > 24 hours, go to days
                    if (timeRem >= 24) {
                        timeRem /= 24;
                        unit = ' days';
                    }

                    // now we're in days. if > 364.25, go to years)
                    if (timeRem >= 364.25) {
                        timeRem /= 364.25;
                        unit = ' yrs';

                        // now we're in years. just for fun, if we're over a century, do that too.
                        if (timeRem >= 100) {
                            timeRem /= 100;
                            unit = ' centuries';

                            // ok, fine, i'll do millennia, too.
                            if (timeRem >= 10) {
                                timeRem /= 10;
                                unit = ' millennia';
                            }
                        }
                    }
                }
            }


            var timediff = '~' + timeRem.toFixed(1) + unit;
            if (time > now)
                timediff += ' from now';
            else
                timediff += ' ago';

            return timediff;
        },

        /**
         * VERY simple date parser.
         * Returns a valid Date object if that time stamp's real. 
         * Returns null otherwise.
         * @param {String} time - the timestamp to convert to a Date
         * @returns {Object} - a Date object or null if the timestamp's invalid.
         */
        parseDate: function(time) {
            var d = new Date(time);
            // if that doesn't work, then split it apart.
            if (Object.prototype.toString.call(d) !== '[object Date]') {
                var t = time.split(/[^0-9]/);
                while (t.length < 7) {
                    t.append(0);
                }
                d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5], t[6]);
                if (Object.prototype.toString.call(d) === '[object Date]') {
                    if (isNaN(d.getTime())) {
                        return null;
                    }
                    else {
                        d.setFullYear(t[0]);
                        return d;
                    }
                }
                return null;
            }
            else {
                return d;
            }
        },
    });
})( jQuery );