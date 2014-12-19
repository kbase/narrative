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
        // these are the elements that contain running apps and methods
        $appsList: null,
        $methodsList: null,

        refreshTimer: null,
        refreshInterval: 10000,

        init: function(options) {
            this._super(options);

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

            // DOM structure setup here.
            // After this, just need to update the function list

            /* There's a few bits here.
             * 1. It's all in a Bootstrap Panel scaffold.
             * 2. The panel-body section contains the core of the widget:
             *    a. loading panel (just a blank thing with a spinning gif)
             *    b. error panel
             *    c. actual function widget setup.
             *
             * So, initialize the scaffold, bind the three core pieces in the
             * panel-body, make sure the right one is being shown at the start,
             * and off we go.
             */

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
                        var removeId = this.removeId;
                        if (removeId) {
                            var appIds = IPython.notebook.metadata.job_ids.apps;
                            appIds = appIds.filter(function(val) { return val.id !== removeId });
                            IPython.notebook.metadata.job_ids.apps = appIds;
                            this.refresh(false);
                            this.removeId = null;
                        }
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

            this.refresh();

            if (this.options.autopopulate === true) {
                this.refresh();
            }

            return this;
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
            this.refresh();
            IPython.notebook.save_checkpoint();
        },

        /**
         * @method
         */
        refresh: function(hideLoadingMessage) {
            // if there's no timer, set one up - this should only happen the first time.
            if (this.refreshTimer === null) {
                this.refreshTimer = setInterval(
                    $.proxy(function() { this.refresh(true); }, this),
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
            if (!IPython.notebook.metadata.job_ids || IPython.notebook.metadata.job_ids.length === 0) {
                this.populateJobsPanel();
                return;
            }

            if (!hideLoadingMessage)
                this.showLoadingMessage('Loading running jobs...');

            // Get a unique list of jobs
            // XXX - this'll change to method vs. app jobs, soonish.
            var jobs = IPython.notebook.metadata.job_ids;
            var uniqueJobs = {};

            // set up methods
            var methJobList = [];
            for (var i=0; i<jobs.methods.length; i++) {
                if (uniqueJobs.hasOwnProperty(jobs.methods[i].id))
                    continue;
                uniqueJobs[jobs.methods[i].id] = jobs.methods[i];
                methJobList.push("'" + jobs.methods[i].id + "'");
            }

            // set up apps
            var appJobList = [];
            for (var i=0; i<jobs.apps.length; i++) {
                var app = jobs.apps[i];
                if (uniqueJobs.hasOwnProperty(app.id))
                    continue;
                if (!app.source || app.source.length === 0)
                    continue;

                var info = null; //{ appSpec : {}, methodSpecs: {}, parameterValues: {} };
                var $appCell = $('#' + app.source);
                if ($appCell.length > 0)
                    info = $appCell.kbaseNarrativeAppCell('getSpecAndParameterInfo');

                if (info) {
                    // from the source, we need to get its containing app cell object.
                    appJobList.push("['" + app.id + "', " +
                                    "'" + this.safeJSONStringify(info.appSpec) + "', " +
                                    "'" + this.safeJSONStringify(info.methodSpecs) + "', " + 
                                    "'" + this.safeJSONStringify(info.parameterValues) + "']");                    
                }

                uniqueJobs[app.id] = {'app' : app, 'info' : info};
            }

            if (jobs.apps.length === 0 && jobs.methods.length === 0) {
                // no jobs! skip the kernel noise and cut to the rendering!
                this.populateJobsPanel();
                return;
            }

            var pollJobsCommand = 'from biokbase.narrative.common.kbjob_manager import KBjobManager\n' +
                                  'job_manager = KBjobManager()\n' +
                                  'print job_manager.poll_jobs(meth_jobs=[' + methJobList + '], app_jobs=[' + appJobList + '], as_json=True)\n';

            var callbacks = {
                'output' : $.proxy(function(msgType, content) { 
                    this.parseKernelResponse(msgType, content, uniqueJobs); 
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

            //console.debug('JOBS PANEL: refresh');
            var msgid = IPython.notebook.kernel.execute(pollJobsCommand, callbacks, {silent: true, store_history: false});
        },

        safeJSONStringify: function(method) {
            var esc = function(s) { 
                return s.replace(/'/g, "&apos;")
                        .replace(/"/g, "&quot;");
            };
            return JSON.stringify(method, function(key, value) {
                return (typeof(value) === 'string') ? esc(value) : value;
            });
        },

        parseKernelResponse: function(msgType, content, jobRef) {
            // if it's not a datastream, display some kind of error, and return.
            // console.debug('JOBS PANEL: parseKernelResponse');
            if (msgType != 'stream') {
                this.showError('Sorry, an error occurred while loading the job list.');
                return;
            }
            var buffer = content.data;
            if (buffer.length > 0) {
                var jobInfo = JSON.parse(buffer);
                this.populateJobsPanel(jobInfo, jobRef);
            }
            this.$loadingPanel.hide();
            this.$jobsPanel.show();
        },

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

        populateJobsPanel: function(jobs, jobInfo) {
            if (!jobs || jobs.length === 0) {
                this.showMessage('No running jobs!');
                return;
            }

            var storedAppIds = {};
            for (var i=0; i<IPython.notebook.metadata.job_ids.apps.length; i++) {
                storedAppIds[IPython.notebook.metadata.job_ids.apps[i].id] = IPython.notebook.metadata.job_ids.apps[i];
            };
            var storedIds = IPython.notebook.metadata.job_ids;

            var $jobsList = $('<div>').addClass('kb-jobs-items');

            if (jobs.methods.length === 0 && storedIds.methods.length === 0 &&
                jobs.apps.length === 0 && storedIds.apps.length === 0) {
                $jobsList.append($('<div class="kb-data-loading">').append('No running jobs!'));
            }

            else {
                // do all methods
                for (var i=0; i<jobs.methods.length; i++) {
                    $jobsList.append(this.renderMethod(jobs.methods[i], jobInfo[jobs.methods[i][0]]));
                }

                // do all apps
                // have a checklist of apps (from the storedIds list)
                // render 'em all, pop one out when it's done.

                for (var i=0; i<jobs.apps.length; i++) {
                    var app = jobs.apps[i];
                    var appInfo = jobInfo[app.job_id];
                    $jobsList.append(this.renderApp(app, appInfo));
                    this.updateAppCell(app, appInfo);
                    delete storedAppIds[app.job_id];
                }
                for (var missingId in storedAppIds) {
                    if (storedAppIds.hasOwnProperty(missingId)) {
                        $jobsList.append(this.renderApp(null, {'app': storedAppIds[missingId]}));
                    }
                }
            }
            this.$jobsPanel.empty().append($jobsList);
        },

        updateAppCell: function(app, appInfo) {
            var source = appInfo.app.source;
            if (!source)
                return; // don't do anything if we can't find the cell. it might have been deleted.

            var $appCell = $('#' + source);
            if (!$appCell)
                return; // don't do anything if we can't find the app cell, either.

            if (app.running_step_id) {
                $appCell.kbaseNarrativeAppCell('setRunningStep', app.running_step_id);
            }
            if (app.widget_outputs && Object.keys(app.widget_outputs).length > 0) {
                for (var key in app.widget_outputs) {
                    if (app.widget_outputs.hasOwnProperty(key))
                        $appCell.kbaseNarrativeAppCell('setStepOutput', key, app.widget_outputs[key]);
                }
            }
        },

        renderAppError: function(app) {
            var $appErr = $('<div>')
                          .addClass('kb-jobs-item kb-jobs-error')
                          .append($('<div>')
                                  .addClass('kb-jobs-title')
                                  .append('Error')
                                  .append(this.makeAppClearButton(app)))
                          .append($('<div>')
                                  .addClass('kb-jobs-descr')
                                  .append('Unable to find job info. The associated app may have been removed. Click the X to delete this job'));

            return $appErr;
        },

        makeInfoRow: function(heading, info) {
            return $('<tr>').append($('<th>')
                                    .append(heading + ':'))
                            .append($('<td>')
                                    .append(info));
        },

        renderApp: function(appJob, appInfo) {
            var getStepSpec = function(id, appSpec) {
                for (var i=0; i<appSpec.steps.length; i++) {
                    if (id === appSpec.steps[i].step_id)
                        return appSpec.steps[i];
                }
                return null;
            };


            // console.log([appJob, appInfo]);

            /* Cases:
             * 1. have appJob, have appInfo
             *    a. appJob has 'error' property
             *        - render as an error'd job!
             *        - include delete btn
             *    b. appJob looks normal, not complete
             *        - show status as usual
             *    c. appJob is completed
             *        - show delete btn
             * 2. have appJob, no appInfo
             *    - probably an error - missing app cell or something
             *        - show an error, option to delete.
             * 3. have no appJob
             *    - just return null. nothing invokes this like that, anyway
             */

            var $app = $('<div>')
                       .addClass('kb-data-list-obj-row');

            var appName = "Unknown App";
            var appId = "Unknown Job Id";
            if (appInfo && appInfo.info && appInfo.info.appSpec && appInfo.info.appSpec.info)
                appName = appInfo.info.appSpec.info.name;
            if (appInfo && appInfo.app && appInfo.app.id)
                appId = appInfo.app.id;

            var $appInfoDiv = $('<div class="kb-data-list-name">')
                               .append(appName);
            var $appControlDiv = $('<span class="pull-right">')
                                 .append(this.makeAppClearButton(appJob, appInfo))
                                 .append('<br>')
                                 .append(this.makeScrollToButton(appJob, appInfo));
            $appInfoDiv.append($appControlDiv)
                       .append($('<div style="font-size:75%">')
                               .append(appId));


            var status = "Unknown";
            var started = "Unknown";
            var task = null;

            // don't know nothing about no job!
            if (!appJob || appJob.error) {
                status = this.makeAppErrorButton(appJob, appInfo, 'Error');
                $app.addClass('kb-jobs-error');
            }
            else if (Object.keys(appJob.step_errors).length !== 0) {
                var $errBtn = this.makeAppErrorButton(appJob, appInfo);
                status = $('<span>').append(appJob.job_state.charAt(0).toUpperCase() + appJob.job_state.substring(1) + ' ')
                                    .append($errBtn);
            }
            else {
                if (appJob.job_state) {
                    status = appJob.job_state.charAt(0).toUpperCase() + appJob.job_state.substring(1);
                }
                var stepId = appJob.running_step_id;
                if (stepId) {
                    var stepSpec = getStepSpec(stepId, appInfo.info.appSpec);
                    task = appInfo.info.methodSpecs[stepSpec.method_id].info.name;
                }
            }
            if (appInfo && appInfo.app && appInfo.app.timestamp) {
                started = this.makePrettyTimestamp(appInfo.app.timestamp);
            }
            var $infoTable = $('<table class="kb-jobs-info-table">')
                             .append(this.makeInfoRow('Status', status));
            if (task !== null)
                $infoTable.append(this.makeInfoRow('Task', task));
            $infoTable.append(this.makeInfoRow('Started', started));


            $app.append($appInfoDiv)
                .append($infoTable);
            // $appInfoDiv.append($infoTable).append($appControlDiv);
            // $app.append($appInfoDiv);
            return $app;
        },

        renderMethod: function(job, jobInfo) {
            var $row = $('<div class="kb-jobs-item">');
            if (!job || job.length < 12) {
                return $row;
            }
            $row.append($('<div class="kb-jobs-title">').append(job[1]).append(this.makeJobDetailButton(job, jobInfo)));
            $row.append($('<div class="kb-jobs-descr">').append(job[12]));

            var $itemTable = $('<table class="kb-jobs-info-table">');
            var $statusRow = $('<tr>').append($('<th>').append('Status:'));
            $statusRow.append($('<td>').append(this.makeStatusElement(job)));
            $itemTable.append($statusRow);
            if (job[9] != null) {
                var $startedRow = $('<tr>').append($('<th>').append('Est. Finish:'));
                var $startedCell = $('<td>');
                $startedCell.append(this.makePrettyTimestamp(job[9], ' remaining'));
                $startedRow.append($startedCell);
                $itemTable.append($startedRow);
            }
            
            $row.append($itemTable);
            return $row;
        },

        makeAppErrorButton: function(appJob, appInfo, btnText) {
            var removeText = "Deleting this job will remove it from your Narrative. Any generated data will be retained. Continue?";
            var headText = "An error has been detected in this job!";
            var errorText = "The KBase servers are reporting an error for this job:";
            var errorType = "Unknown";

            var $errBtn = $('<div>');
            $errBtn.addClass('btn btn-danger btn-xs kb-data-list-more-btn fa fa-warning');
            if (btnText)
                $errBtn.append(' ' + btnText);
            $errBtn.click($.proxy(function(e) {
                       this.removeId = appInfo.app.id;
                       this.$jobsModalTitle.html('Job Error');
                       /* error types:
                        * 1. appJob.error is a real string. Just cough it up.
                        * 2. appJob is missing
                        * 3. appInfo is partly missing (e.g., lost the cell that it should point to)
                        * 4. appInfo is still partly missing (e.g., dont' know what cell it should point to)
                        */
                       if (!appJob && appInfo) {
                           if (!appInfo.app.source) {
                               errorText = "This job is not associated with an App Cell.";
                               errorType = "Unknown App Cell";
                           }
                           else if ($('#' + appInfo.app.source).length === 0) {
                               errorText = "The App Cell associated with this job can no longer be found in your Narrative.";
                               errorType = "Missing App Cell";
                           }
                       }
                       else if (appJob.error) {
                           errorText = appJob.error;
                           errorType = "Runtime";
                       }
                       else if (Object.keys(appJob.step_errors).length !== 0) {
                           errorType = "Runtime";
                           errorText = $('<div>');
                           for (var stepId in appJob.step_errors) {
                               if (appJob.step_errors.hasOwnProperty(stepId)) {
                                   // contort that into the method name
                                   // gotta search for it in the spec for the method id, first.
                                   var methodId = null;
                                   for (var i=0; i<appInfo.info.appSpec.steps.length; i++) {
                                       if (stepId === appInfo.info.appSpec.steps[i].step_id) {
                                           methodId = appInfo.info.appSpec.steps[i].method_id;
                                           break;
                                       }
                                   }
                                   var methodName = "Unknown method: " + stepId;
                                   if (methodId)
                                       methodName = appInfo.info.methodSpecs[methodId].info.name;
                                   errorText.append($('<b>').append('In ' + methodName + ':<br>'))
                                            .append(appJob.step_errors[stepId] + '<br><br>');
                               }
                           }
                       }

                       var $errorTable = $('<table class="table table-bordered">')
                                         .append(this.makeInfoRow('Id', appInfo.app.id))
                                         .append(this.makeInfoRow('Type', errorType))
                                         .append(this.makeInfoRow('Error', errorText));

                       this.$jobsModalBody.empty();
                       this.$jobsModalBody.append($('<div>').append(headText))
                                          .append($errorTable)
                                          .append($('<div>').append(removeText));
                       this.$jobsModal.openPrompt();
                   }, this));
            return $errBtn;
        },

        makeAppClearButton: function(appJob, appInfo) {
            var removeText = "Deleting this job will remove it from your Narrative. Any generated data will be retained. Continue?";
            var warningText = "This job appears to have fallen into an error state and is no longer running on KBase servers.";

            return $('<span data-toggle="tooltip" title="Remove Job" data-placement="left">')
                   .addClass('btn-xs kb-data-list-more-btn pull-right fa fa-times')
                   .css({'cursor':'pointer'})
                   .click($.proxy(function() {
                       /* cases for communication!
                        * 1. we don't know what the job's linked to - either appJob is null, or appInfo is 
                        *    missing things.
                        * 2. the job is well formed, and complete.
                        * 3. the job is in an error state.
                        * 4. the job is running
                        */
                       var id = appInfo.app.id;
                       if (appJob && appJob.job_state) {
                           var status = appJob.job_state.toLowerCase();
                           if (status === 'queued' || status === 'running' || status === 'in-progress') {
                               warningText = "This job is currently running on KBase servers! Removing it will prevent your App from updating, though data is currently being generated and may still appear in your Narrative.";
                           }
                           else if (status === 'completed') {
                               warningText = "This job has completed running. You may safely remove it without affecting your Narrative.";
                           }
                       }
                       this.$jobsModalBody.empty().append(warningText + '<br><br>' + removeText);
                       this.$jobsModalTitle.empty().html('Remove Job?');
                       this.removeId = id;

                       this.$jobsModal.openPrompt();
                   }, this))
                   .tooltip();
        },

        makeScrollToButton: function(app, appInfo) {
            return $('<span data-toggle="tooltip" title="Scroll To App" data-placement="left">')
                   .addClass('btn-xs kb-data-list-more-btn pull-right fa fa-location-arrow')
                   .css({'cursor':'pointer'})
                   .click(function(e) {
                       var sourceId = appInfo.app.source;
                       if (sourceId) {
                           $('html, body').animate({ scrollTop: $('#' + sourceId).offset().top-85 }, 1000);
                           $('#' + sourceId).click();
                       }
                   })
                   .tooltip();
        },

        makeJobDetailButton: function(job, jobInfo) {
            var showDetailModal = function(job, sourceId) {
                var $modalBody = $('<div>');
                var buttonList = [
                    {
                        name : 'Close',
                        type : 'primary',
                        callback : function(e, $prompt) {
                            $prompt.closePrompt();
                        },
                    }
                ];

                if (sourceId) {
                    buttonList.push({
                        name : 'Scroll To',
                        type : 'primary',
                        callback : function(e, $prompt) {
                            $prompt.closePrompt();
                            $('#' + sourceId).click();
                            $('html, body').animate({ scrollTop: $('#' + sourceId).offset().top-160 }, 1000);
                        }
                    });
                }
                else {
                    buttonList.push({
                        name : 'Unknown source',
                        type : 'default disabled'
                    });
                }
                $('<div>').kbasePrompt(
                    {
                        title : 'Job Details',
                        body : $modalBody,
                        controls : buttonList
                    }
                ).openPrompt();
                $modalBody.kbaseJobWatcher({ jobInfo : job });
            };

            var sourceId = jobInfo.source ? jobInfo.source : "";

            var $btn = $('<span>')
                       .addClass('glyphicon glyphicon-info-sign kb-function-help')
                       .click(function(e) {
                           showDetailModal(job, sourceId);
                       });

            return $btn;
        },

        /**
         * @method makeStatusElement
         * Builds the HTML for a Status element based on the given job object.
         * Cases:
         * 1. Job complete - return 'complete + status message'
         * 2. Error - return 'error' as a clickable link - opens a modal with the error message.
         * 3. not complete OR error = in progress.
         *    Show 3 rows. First = status + progress text ('x / y' or 'z%'). Second = progress bar. Bottom = time remaining div.
         *
         * This is all returned wrapped in a div element.
         * @param job - the job to build a status element around.
         * @return a div element containing the job's status.
         * @private
         */
        makeStatusElement: function(job) {
            var status = '<div job-id="' + job[0] + '">';
            var deleteSpan = '<span class="pull-right glyphicon glyphicon-remove kbujs-delete-job" data-toggle="tooltip" title="Delete Job"></span>';

            if (job[11] === 1)
                status += '<span class="kbujs-error-cell kbujs-error" error-job-id="' + job[0] + '">' +
                              '<span class="glyphicon glyphicon-exclamation-sign"></span>' +
                              '&nbsp;Error: ' +
                              job[4] +
                          '</span>' +
                          deleteSpan;
            else if (job[10] === 1)
                status += '<span>Complete: ' + job[4] + '</span>' + deleteSpan;
            else {
                status = '<div>' + job[4];
                var progressType = job[8].toLowerCase();
                var progress = job[6];
                var max = job[7];

                if (progressType === 'percent') {
                    status += ' (' + progress + '%)</div>';
                }
                if (progressType === 'task') {
                    status += ' (' + progress + ' / ' + max + ')</div>';
                }
                if (progressType !== 'none') {
                    status +=  '<div class="pull-right" style="width: 75%">' + this.makeProgressBarElement(job, false) + '</div></div>';
                }
            }
            return status + '</div>';
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

        parseStage: function(stage) {
            if (stage.toLowerCase() === 'error') {
                var $btn = $('<span/>')
                           .addClass('kbujs-error')
                           .append($('<span/>')
                                   .addClass('glyphicon glyphicon-exclamation-sign'))
                           .append(' Error');

                return $('<div>')
                       .addClass('kbujs-error-cell')
                       .append($btn);
            }
            return stage;
        },

        /**
         * @method makeProgressBarElement
         * Makes a Bootstrap 3 Progress bar from the given job object.
         *
         * @param job - the job object
         * @param showNumber - if truthy, includes the numberical portion of what's being shown in the progressbar, separately.
         * @return A div containing a Bootstrap 3 progressbar, and, optionally, text describing the numbers in progress.
         * @private
         */
        makeProgressBarElement: function(job, showNumber) {
            var type = job[8].toLowerCase();
            var max = job[7] || 0;
            var progress = job[6] || 0;

            if (type === 'percent') {
                var bar = '';
                if (showNumber)
                    bar += progress + '%';

                return bar + '<div class="progress" style="margin-bottom: 0; pull-right;">' + 
                               '<div class="progress-bar" role="progressbar" aria-valuenow="' + 
                                 progress + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + 
                                 progress + '%;">' +
                                 '<span class="sr-only">' + progress + '% Complete</span>' +
                               '</div>' +
                             '</div>';
            }
            else {
                var bar = '';
                if (showNumber)
                    bar += progress + ' / ' + max;
                return bar + '<div class="progress" style="margin-bottom: 0">' + 
                           '<div class="progress-bar" role="progressbar" aria-valuenow="' + 
                           progress + '" aria-valuemin="0" aria-valuemax="' + max + '" style="width: ' + 
                           (progress / max * 100) + '%;">' +
                               '<span class="sr-only">' + progress + ' / ' + max + '</span>' +
                           '</div>' +
                       '</div>';
            }
            return '<div></div>';
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