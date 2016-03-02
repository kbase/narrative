/**
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 * This is a generalized class for an input cell that sits in an Jupyter markdown cell.
 * It handles all of its rendering here (no longer in HTML in markdown), and invokes
 * an input widget passed to it.
 *
 * This expects a method object passed to it, and expects that object to have the new
 * format from the narrative_method_store service.
 */

(function( $, undefined ) {
require(['jquery',
         'narrativeConfig',
         'util/string',
         'util/bootstrapDialog',
         'util/display',
         'handlebars', 
         'kbwidget', 
         'kbaseAuthenticatedWidget',
         'kbaseNarrativeCellMenu',
         'kbaseTabs',
         'kbaseViewLiveRunLog',
         'kbaseReportView'], 
function($, 
         Config,
         StringUtil,
         BootstrapDialog,
         Display,
         Handlebars) {
    'use strict';
    $.KBWidget({
        name: "kbaseNarrativeMethodCell",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        options: {
            method: null,
            cellId: null,
            methodHelpLink: '/#appcatalog/app/',
            methodStoreURL: Config.url('narrative_method_store')
        },
        IGNORE_VERSION: true,
        defaultInputWidget: 'kbaseNarrativeMethodInput',
        allowOutput: true,
        runState: 'input',

        // elements and variables needed for job details and tracking
        jobDetails: null,
        $jobProcessTabs: null,     // Use this tabs panel to add more tabs like Report widget
        $jobStatusDiv: null,       // Panel showing status + error details if any

        hasLogsPanelLoaded: false,
        hasResultLoaded: false,
        isJobStatusLoadedFromState: false,
        completedStatus: [ 'completed', 'done', 'deleted', 'suspend', 'error', 'not_found_error', 'unauthorized_error', 'awe_error' ],


        /**
         * @private
         * @method
         * Initialization is done by the KBase widget architecture itself.
         * This requires and assumes that a method and cellId are both present
         * as options
         * TODO: add checks and failures for this.
         */
        init: function(options) {
            this._super(options);

            this.options.method = this.options.method.replace(/\n/g, '');
            this.method = JSON.parse(this.options.method);
            this.cellId = this.options.cellId;

            this.$dynamicMethodSummary = $('<div>');

            this.errorDialog = new BootstrapDialog({
                title: 'Problems exist in your parameter settings.',
                buttons: [$('<button type="button" data-dismiss="modal">').addClass('btn btn-default').append('Dismiss')],
                closeButton: true
            });

            this.methClient = new NarrativeMethodStore(Config.url('narrative_method_store'));
            this.on('get_cell_subtitle.Narrative', function(e, callback) {
                callback(this.getSubtitle());
            }.bind(this));
            this.render();
            return this;
        },

        /**
         * Renders this cell and its contained input widget.
         */
        render: function() {
            self = this;
            this.$inputDiv = $('<div>');
            this.$submitted = $('<span>').addClass("kb-func-timestamp").hide();

            // These are the 'delete' and 'run' buttons for the cell
            this.$runButton = $('<button>')
                             .attr('id', this.cellId + '-run')
                             .attr('type', 'button')
                             .attr('value', 'Run')
                             .addClass('kb-method-run')
                             .append('Run');
            this.$runButton.click(
                $.proxy(function(event) {
                    console.log('** clicked' + (new Date()).getTime());

                    if (!this.checkMethodRun())
                        return;

                    this.submittedText = 'submitted on ' + this.readableTimestamp();
                    if(this.auth()) {
                        if(this.auth().user_id)
                            this.submittedText += ' by <a href="/#people/'+this.auth().user_id
                                +'" target="_blank">' + this.auth().user_id + "</a>";
                    }
                    console.log('** submitted' + (new Date()).getTime());
                    this.changeState('submitted');
                    // this.minimizeView();
                    this.trigger('runCell.Narrative', {
                        cell: Jupyter.narrative.getCellByKbaseId(this.cellId),
                        method: this.method,
                        parameters: this.getParameters(),
                        widget: this
                    });
                }, this)
            );

            this.$stopButton = $('<button>')
                              .attr('type', 'button')
                              .attr('value', 'Cancel')
                              .addClass('kb-app-run kb-app-cancel')
                              .append('Cancel')
                              .css({'margin-right':'5px'})
                              .click(
                                  $.proxy(function(event) {
                                      this.stopRunning();
                                  }, this)
                              )
                              .hide();

            this.$resetButton = $('<button>')
                                .attr('type', 'button')
                                .attr('value', 'Cancel')
                                .addClass('kb-app-run')
                                .append('Edit and Re-Run')
                                .css({'margin-right':'5px'})
                                .click(
                                    $.proxy(function(event) {
                                        this.stopRunning();
                                    }, this)
                                )
                                .hide();

            var $buttons = $('<div>')
                           .addClass('buttons pull-left')
                           .append(this.$runButton)
                           .append(this.$stopButton)
                           .append(this.$resetButton)
                           .append(this.$submitted);

            var $progressBar = $('<div>')
                               .attr('id', 'kb-func-progress')
                               .addClass('pull-left')
                               .css({'display' : 'none'})
                               .append($('<div>')
                                       .addClass('progress progress-striped active kb-cell-progressbar')
                                       .append($('<div>')
                                               .addClass('progress-bar progress-bar-success')
                                               .attr('role', 'progressbar')
                                               .attr('aria-valuenow', '0')
                                               .attr('aria-valuemin', '0')
                                               .attr('aria-valuemax', '100')
                                               .css({'width' : '0%'})))
                               .append($('<p>')
                                       .addClass('text-success'));

            var methodId = 'method-details-'+StringUtil.uuid();
            var buttonLabel = 'details';
            var methodDesc = this.method.info.tooltip;

            var link = this.options.methodHelpLink;
            if(this.method.info.module_name) {
                link = link + this.method.info.id; // TODO: add version here, but we don't have the info stored yet
            } else {
                link = link + 'l.m/' + this.method.info.id;
            }

            this.$header = $('<div>').css({'margin-top':'4px'})
                           .addClass('kb-func-desc');
            this.$methodDesc = $('<div>')
                               .attr('id', methodId)
                               .addClass('kb-method-subtitle')
                               .append(methodDesc + ' &nbsp;&nbsp;<a href="' + link + '" target="_blank">more...</a>');

            this.$header.append(this.$dynamicMethodSummary);

            // Controls (minimize)
            var $controlsSpan = $('<div>').addClass("pull-left");
            this.$minimizeControl = $("<span class='glyphicon glyphicon-chevron-down'>")
                                    .css({color: "#888", fontSize: "14pt",  cursor:'pointer',
                                          paddingTop: "7px", margin: "5px"});
            $controlsSpan.append(this.$minimizeControl);
            this.panel_minimized = false;

            this.$cellPanel = $('<div>')
                              .append(this.$methodDesc)
                              .append(this.$inputDiv)
                              .append($('<div>')
                                      .addClass('kb-method-footer')
                                      .css({'overflow': 'hidden'})
                                      .append($buttons));

            // this.$cellPanel = $('<div>')
            //                   .addClass('panel kb-func-panel kb-cell-run')
            //                   .append($controlsSpan)
            //                   .append($('<div>')
            //                           .addClass('panel-heading')
            //                           .append(this.$header))
            //                   .append($('<div>')
            //                           .addClass('panel-body')
            //                           .append(this.$inputDiv))
            //                   .append($('<div>')
            //                           .addClass('panel-footer')
            //                           .css({'overflow' : 'hidden'})
            //                           .append($buttons));

            this.$elem.append(this.$cellPanel);

            // Add minimize/restore actions.
            // These mess with the CSS on the cells!
            var self = this;
            $controlsSpan.click(function() {
                if (self.panel_minimized) {
                    self.maximizeView();
                } else {
                    self.minimizeView();
                }
            });

            var inputWidgetName = this.method.widgets.input;
            if (!inputWidgetName || inputWidgetName === 'null')
                inputWidgetName = this.defaultInputWidget;
            
                        
            this.$elem
                .closest('.cell')
                .trigger('set-title.cell', [self.method.info.name]); 
            
            var $logo = $('<div>');
            if(this.method.info.icon && this.method.info.icon.url) {
                var url = this.options.methodStoreURL.slice(0, -3) + this.method.info.icon.url;
                $logo.append( Display.getAppIcon({url: url}) );
            } else {
                $logo.append( Display.getAppIcon({}) );
            }

            this.$elem
                .closest('.cell')
                .trigger('set-icon.cell', [$logo.html()]);

            require([inputWidgetName], 
              $.proxy(function() {
                this.$inputWidget = this.$inputDiv[inputWidgetName]({ method: this.options.method });
              }, this),
              $.proxy(function() {
                console.error('Error while trying to load widget "' + inputWidgetName + '"');
              }));
        },

        /**
         * @method
         * Invoke this method- basically the API way to click on the run button.
         * @public
         */
        runMethod: function() {
            if(this.$runButton) {
                this.$runButton.click();
            } else {
                console.error('Attempting to run a method, but the method is not yet initialized/rendered.')
            }
        },

        /**
         * @method
         * Returns parameters from the contained input widget
         * @public
         */
        getParameters: function() {
            if (this.$inputWidget)
                return this.$inputWidget.getParameters();
            return null;
        },

        /**
         * @method
         * Returns parameters from the contained input widget as a map designed for display
         * @public
         */
        getParameterMapForReplacementText: function() {
            if (this.$inputWidget) {
                var paramMap = {};
                var paramList = this.$inputWidget.getParameters();
                for(var k=0; k<this.method.parameters.length; k++) {
                    if(k<paramList.length) {
                        paramMap[this.method.parameters[k].id] = paramList[k];

                        // detect if it is a workspace object - if so we make things bold and linkable
                        if(typeof paramList[k] === 'string' &&
                            this.method.parameters[k].text_options) {
                          if(this.method.parameters[k].text_options.valid_ws_types) {
                            if(this.method.parameters[k].text_options.valid_ws_types.length>0) {
                              paramMap[this.method.parameters[k].id] = '<b><a style="cursor:default;">' + paramList[k] + '</a></b>';
                            }
                          }
                        }
                    }
                }
                return paramMap;
            }
            return null;
        },

        /**
         * @method
         * Returns the state as reported by the contained input widget.
         * @public
         */
        getState: function() {
            return {
                runningState : {
                    runState : this.runState,
                    submittedText : this.submittedText,
                    outputState : this.allowOutput
                },
                // hack for now to ignore state. this now gets managed outside the widget.
                // minimized : this.panel_minimized,
                params : this.$inputWidget.getState(),
                jobDetails: this.jobDetails
            };
        },

        /**
         * @method
         * Passes along the state to its contained input widget.
         * @public
         */
        loadState: function(state) {
            //console.log(state);
            // cases (for older ones)
            // 1. state looks like:
            // { params: {},
            //   runningState: {runState,
            //                  submittedText,
            //                  outputState}
            // }
            // That's new!
            // old one just has the state that should be passed to the input widget.
            // that'll be deprecated soonish.
            if (state.hasOwnProperty('params') 
              && state.hasOwnProperty('runningState')) {
                this.allowOutput = state.runningState.outputState;
                this.$inputWidget.loadState(state.params);
                this.submittedText = state.runningState.submittedText;
                if (state.hasOwnProperty('jobDetails')) {
                    this.jobDetails = state.jobDetails;
                    if (this.jobDetails['job_id'])
                        this.isJobStatusLoadedFromState = true;
                }
                this.changeState(state.runningState.runState);
                // if(state.minimized) {
                //     this.minimizeView(true); // true so that we don't show slide animation
                // }
            }
            else
                this.$inputWidget.loadState(state);
            this.$elem.closest('.cell').find('.button_container').kbaseNarrativeCellMenu('setSubtitle', this.getSubtitle());
        },

        /* Show/hide running icon */
        displayRunning: function(is_running, had_error) {
            var $cellMenu = this.$elem.closest('.cell').find('.button_container');
            if (is_running) {
                $cellMenu.trigger('runningIndicator.toolbar', {enabled: true});
                $cellMenu.trigger('errorIndicator.toolbar', {enabled: false});
            } else {
                $cellMenu.trigger('runningIndicator.toolbar', {enabled: false});
                if (had_error) {
                    $cellMenu.trigger('errorIndicator.toolbar', {enabled: true});                   
                } else {
                    $cellMenu.trigger('errorIndicator.toolbar', {enabled: false});

                }
            }
        },

        /**
         * @method
         * This sends a trigger to the jobs panel to stop any running jobs. If the callback is
         * truthy, this resets the cell to an input state.
         */
        stopRunning: function() {
            this.trigger('cancelJobCell.Narrative', [this.cellId, true, $.proxy(function(isCanceled) {
                if (isCanceled) {
                    if (this.$jobProcessTabs) {
                        this.$jobProcessTabs.remove();
                        this.$jobProcessTabs = null;
                        this.$jobStatusDiv = null;
                        this.hasLogsPanelLoaded = false;
                        this.hasResultLoaded = false;
                    }
                    if (this.jobDetails)
                        this.jobDetails = null;
                    this.changeState('input');
                }
            }, this)]);
        },
        /**
         * @method
         * Shows an associated error with a cell (if available)
         */
        showError: function() {
            this.trigger('showJobError.Narrative', [this.cellId, true, $.proxy(function(isCanceled) {
                if (isCanceled) {
                    this.changeState('input');
                }
            }, this)]);
        },

        /**
         * @method
         * Updates the method cell's state.
         * Currently supports "input", "submitted", "running", or "complete".
         */
        changeState: function(runState, jobDetails, result) {
            if (!this.$cellPanel)
                return;
            
            var $toolbar = this.$elem.find('.button_container');
            $toolbar.trigger('run-state.toolbar', {
                status: this.runState.toLowerCase()
            });
            
            if (this.runState !== runState) {
                this.runState = runState.toLowerCase();
                switch(this.runState) {
                    case 'submitted':
                        this.$cellPanel.removeClass('kb-app-step-running');
                        this.$elem.find('.kb-app-panel').removeClass('kb-app-error');
                        this.$submitted.html(this.submittedText).show();
                        this.$runButton.hide();
                        this.$stopButton.hide();
                        this.$resetButton.hide();
                        this.$inputWidget.lockInputs();
                        this.displayRunning(true);
                        this.allowOutput = true;
                        break;
                    case 'complete':
                        this.$cellPanel.removeClass('kb-app-step-running');
                        this.$elem.find('.kb-app-panel').removeClass('kb-app-error');
                        this.$submitted.html(this.submittedText).show();
                        this.$runButton.hide();
                        this.$stopButton.hide();
                        this.$resetButton.show();
                        this.$inputWidget.lockInputs();
                        this.displayRunning(false);
                        // maybe unlock? show a 'last run' box?
                        break;
                    case 'running':
                        this.$submitted.html(this.submittedText).show();
                        this.$elem.find('.kb-app-panel').removeClass('kb-app-error');
                        this.$cellPanel.addClass('kb-app-step-running');
                        this.$runButton.hide();
                        this.$stopButton.show();
                        this.$resetButton.hide();
                        this.$inputWidget.lockInputs();
                        this.displayRunning(true);
                        break;
                    case 'error':
                        this.$submitted.html(this.submittedText).show();
                        this.$cellPanel.addClass('kb-app-step-error');
                        this.$runButton.hide();
                        this.$stopButton.show();
                        this.$resetButton.hide();
                        this.$inputWidget.lockInputs();
                        this.$elem.find('.kb-app-panel').addClass('kb-app-error');
                        this.displayRunning(false, true);
                        break;
                    case 'queued':
                        this.$submitted.html(this.submittedText).show();
                        this.$elem.find('.kb-app-panel').removeClass('kb-app-error');
                        this.$cellPanel.addClass('kb-app-step-running');
                        this.$runButton.hide();
                        this.$stopButton.show();
                        this.$resetButton.hide();
                        this.$inputWidget.lockInputs();
                        this.displayRunning(true);
                        break;
                    default:
                        this.$cellPanel.removeClass('kb-app-step-running');
                        this.$elem.find('.kb-app-panel').removeClass('kb-app-error');
                        this.$cellPanel.removeClass('kb-app-step-error');
                        this.$submitted.hide();
                        this.$runButton.show();
                        this.$stopButton.hide();
                        this.$resetButton.hide();
                        this.$inputWidget.unlockInputs();
                        this.displayRunning(false);
                        break;
                }
            }
            


            if (jobDetails) {
                // Put this data into widget (with results) for next saveState operation
                if(result) { jobDetails['result'] = result; }
                this.jobDetails = jobDetails; 
                
            } else {
                if(result) { this.jobDetails['result'] = result; }
                jobDetails = this.jobDetails; // Get data from previously saved widget state (this is
                                              // necessary because job panel doesn't call this method for
                                              // finished jobs (it's called from init without UJS info)
            }
            
            if (jobDetails && jobDetails['job_id']) {
                var jobState = jobDetails['job_state'];
                var jobInfo = jobDetails['job_info'];
                var status = jobDetails['status'];
                if (!status)
                    status = jobState.status;
                if (!this.$jobProcessTabs) {
                    this.$jobProcessTabs = $('<div>').addClass('panel-body').addClass('kb-cell-output');
                    var targetPanel = this.$elem;
                    // console.log(this.isJobStatusLoadedFromState, status, jobState, jobInfo);
                    if (this.isJobStatusLoadedFromState && status) {
                        if ($.inArray(status.toLowerCase(), this.completedStatus) >= 0) {
                            // We move job status panel into cell panel rather than outside because when
                            // job is done (or finished with error) we want to be able to collapse this 
                            // panel as part of cell panel collapse.
                            targetPanel = this.$cellPanel;
                        }
                    }
                    targetPanel.append(this.$jobProcessTabs);
                    this.$jobProcessTabs.kbaseTabs({canDelete: false, tabs: []});
                    this.$jobStatusDiv = $('<div>');
                    this.$jobProcessTabs.kbaseTabs('addTab', {tab: 'Status', content: this.$jobStatusDiv, 
                        canDelete: false, show: true});
                }
                var jobId = jobDetails['job_id'];
                var fullJobId = jobId;
                if (jobId.indexOf(':') > 0)
                    jobId = jobId.split(':')[1];
                status = status.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
                if (status === 'Suspend' || status === 'Error' || status === 'Unknown' || status === 'Awe_error') {
                    status = this.makeJobErrorPanel(fullJobId, jobState, jobInfo, 'Error');
                } else if (status === 'Deleted') {
                    status = this.makeJobErrorPanel(fullJobId, jobState, jobInfo, 'Deleted');
                } else if (status === 'Not_found_error') {
                    status = this.makeJobErrorPanel(fullJobId, jobState, jobInfo, 'Job Not Found');
                } else if (status === 'Unauthorized_error') {
                    status = this.makeJobErrorPanel(fullJobId, jobState, jobInfo, 'Unauthorized');
                } else if (status === 'Network_error') {
                    status = this.makeJobErrorPanel(fullJobId, jobState, jobInfo, 'Network Error');
                } else {
                    status = this.makeJobStatusPanel(fullJobId, jobState, jobInfo, status);
                }
                this.$jobStatusDiv.empty();
                this.$jobStatusDiv.append(status);
                if (!this.hasLogsPanelLoaded) {
                    this.hasLogsPanelLoaded = true;
                    this.$jobProcessTabs.kbaseTabs('addTab', {tab: 'Console Log', showContentCallback: 
                        function() {
                            var $jobLogsPanel = $('<div>');
                            $jobLogsPanel.kbaseViewLiveRunLog({'job_id': jobId, 'show_loading_error': false});
                            return $jobLogsPanel;
                        }, 
                        canDelete: false, show: false});
                }
                if (jobDetails['result']) {
                    if(!this.hasResultLoaded) {
                        this.hasResultLoaded = true; // make sure we only display once
                        // Check if the job details gives a report, if so, then we can add two more tabs
                        if(jobDetails['result']['workspace_name'] && jobDetails['result']['report_name']) {

                            this.$jobProcessTabs.kbaseTabs('addTab', {tab: 'Report', showContentCallback: 
                                function() {
                                    var $reportPanel = $('<div>');
                                    var result = jobDetails.result;
                                    result['showReportText'] = true;
                                    result['showCreatedObjects'] = false;
                                    $reportPanel.kbaseReportView(result);
                                    return $reportPanel;
                                }, 
                                canDelete: false, show: true});

                            this.$jobProcessTabs.kbaseTabs('addTab', {tab: 'New Data Objects', showContentCallback: 
                                function() {
                                    var $reportPanel = $('<div>');
                                    var result = jobDetails.result;
                                    result['showReportText'] = false;
                                    result['showCreatedObjects'] = true;
                                    $reportPanel.kbaseReportView(result);
                                    return $reportPanel;
                                }, 
                                canDelete: false, show: false});
                        }
                    }
                }
            }
        },

        makeJobStatusPanel: function(jobId, jobState, jobInfo, statusText) {
            function makeInfoRow(heading, info) {
                return $('<tr>').append($('<th>')
                        .append(heading + ':'))
                        .append($('<td>')
                        .append(info));
            }
            
            var $infoTable = $('<table class="table table-bordered">')
                    .append(makeInfoRow('Job Id', jobId))
                    .append(makeInfoRow('Status', statusText));
            if (jobState && jobState.state) {
                var state = jobState.state;
                var creationTime = state.start_timestamp;
                var execStartTime = null;
                var finishTime = null;
                var posInQueue = null;
                // console.log(state.step_stats);
                if (state.step_stats) {
                    for (var key in state.step_stats) {
                        if (state.step_stats.hasOwnProperty(key)) {
                            var stats = state.step_stats[key];
                            // console.log(key, stats);
                            if (stats['creation_time'])
                                creationTime = stats['creation_time'];
                            execStartTime = stats['exec_start_time'];
                            finishTime = stats['finish_time'];
                            posInQueue = stats['pos_in_queue'];
                        }
                    }
                }
                if (creationTime)
                    $infoTable.append(makeInfoRow('Submitted', this.readableTimestamp(creationTime)));
                if (creationTime && execStartTime)
                    $infoTable.append(makeInfoRow('Time in queue', ((execStartTime - creationTime) / 1000.0) + " sec."));
                if (posInQueue)
                    $infoTable.append(makeInfoRow('Position in queue', posInQueue));
                if (execStartTime)
                    $infoTable.append(makeInfoRow('Execution Started', this.readableTimestamp(execStartTime)));
                if (finishTime)
                    $infoTable.append(makeInfoRow('Execution Finished', this.readableTimestamp(finishTime)));
                if (execStartTime && finishTime)
                    $infoTable.append(makeInfoRow('Execution Time', ((finishTime - execStartTime) / 1000.0) + " sec."));
            }
            

            return $infoTable;
        },
        
        makeJobErrorPanel: function(jobId, jobState, jobInfo, btnText) {
            var $errBtn = $('<div>')
                .addClass('btn btn-danger btn-xs kb-jobs-error-btn')
                .css('background-color', '#F44336')
                .append('<span class="fa fa-warning" style="color:white"></span>');
            if (btnText)
                $errBtn.append(' ' + btnText);
            var headText = $errBtn; //"An error has been detected in this job!";
            var errorText = "The KBase servers are reporting an error for this job:";
            var errorType = "Unknown";

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
                errorText = $('<div>');  // class="kb-jobs-error-modal">');
                for (var stepId in jobState.state.step_errors) {
                    if (jobState.state.step_errors.hasOwnProperty(stepId)) {
                        // contort that into the method name
                        // gotta search for it in the spec for the method id, first.
                        var methodName = "Unknown method: " + stepId;
                        if (jobId.indexOf("njs:") == 0) {
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
                                .append($('<pre style="max-height:250px; overflow-y: auto">').append(jobState.state.step_errors[stepId]))
                                .append('<br><br>');
                    }
                }
            }

            function makeInfoRow(heading, info) {
                return $('<tr>').append($('<th>')
                        .append(heading + ':'))
                        .append($('<td>')
                        .append(info));
            }
            
            var $errorTable = $('<table class="table table-bordered">')
                    .append(makeInfoRow('Job Id', jobId))
                    .append(makeInfoRow('Type', errorType))
                    .append(makeInfoRow('Error', errorText));

            var $modalBody = $('<div>').append(headText)
                    .append($errorTable);
            if (jobState && jobState.state && jobState.state.traceback) {
                var $tb = $('<div>');
                $tb.kbaseAccordion({
                    elements: [{
                        title: 'Detailed Error Information',
                        body: $('<pre style="max-height:300px; overflow-y: auto">').append(jobState.state.traceback)
                    }]
                });
                $modalBody.append($tb);
            }

            return $modalBody;
        },
        
        isAwaitingInput: function() {
            if(this.runState) {
                if(this.runState==='input') { return true; }
                return false;
            }
            return true;
        },


        getRunningState: function() {
            return this.runState;
        },

        /*
         * This function is invoked every time we run app. This is the difference between it
         * and getAllParameterValues/getParameterValue which could be invoked many times before running
         * (e.g. when widget is rendered).
         */
        prepareDataBeforeRun: function() {
            if (this.inputSteps) {
                for(var i=0; i<this.inputSteps.length; i++)
                    var v = this.inputSteps[i].widget.prepareDataBeforeRun();
            }
        },

        /* locks inputs and updates display properties to reflect the running state
            returns true if everything is valid and we can start, false if there were errors
        */
        checkMethodRun: function() {
            var v = this.$inputWidget.isValid();
            if (!v.isValid) {
                var $error = $('<div>');
                for (var i=0; i<v.errormssgs.length; i++) {
                    $error.append($('<div>').addClass("kb-app-step-error-mssg")
                                            .append('['+(i+1)+']: ' + v.errormssgs[i]));
                }
                this.errorDialog.setBody($error);
                this.errorDialog.show();
                return false;
            }

            return true;
        },

        /**
         * Refreshes the input widget according to its own method.
         */
        refresh: function() {
            if (this.$inputWidget)
                this.$inputWidget.refresh();
        },

        /* temp hack to deal with current state of NJS */
        getSpecAndParameterInfo: function() {
            return {
                methodSpec : this.method,
                parameterValues: this.getParameters()
            };
        },

        setOutput: function(data) {
            if (data.cellId && this.allowOutput) {
                this.allowOutput = false;
                // Show the 'next-steps' to take, if there are any
                this.getNextSteps(function(next_steps) {
                    data.next_steps = next_steps;
                    this.trigger('createOutputCell.Narrative', data);
                }.bind(this));
            }
            this.changeState('complete', null, data.result);
        },

        getSubtitle: function () {
            if (this.submittedText && !this.isAwaitingInput()) {
                return this.submittedText;
            }
            return "Not yet submitted.";
        },

        updateDynamicMethodSummaryHeader: function() {
            var self = this;
            self.$dynamicMethodSummary.empty();

            // First set the main text
            if(self.method.replacement_text && 
              self.submittedText && !self.isAwaitingInput()) {
                // If replacement text exists, and the method was submitted, use it
                var template = Handlebars.compile(self.method.replacement_text);
                self.$dynamicMethodSummary.append($('<h1>').html(template(self.getParameterMapForReplacementText())));
                self.$dynamicMethodSummary.append($('<h2>').append(self.submittedText));
            } else {
                self.$dynamicMethodSummary.append($('<h1>').append(self.method.info.name));
                if(self.submittedText && !self.isAwaitingInput()) {
                    self.$dynamicMethodSummary.append($('<h2>').append(self.submittedText));
                } else {
                    self.$dynamicMethodSummary.append($('<h2>').append('Not yet submitted.'));
                }
            }
        },


        minimizeView: function(noAnimation) {
            var self = this;
            var $mintarget = self.$cellPanel;

            // create the dynamic summary based on the run state
            self.updateDynamicMethodSummaryHeader()
            self.$dynamicMethodSummary.show();
            if(noAnimation) {
                $mintarget.find(".panel-footer").hide();
                $mintarget.find(".panel-body").hide();
            } else {
                $mintarget.find(".panel-footer").slideUp();
                $mintarget.find(".panel-body").slideUp();
            }
            self.$minimizeControl.removeClass("glyphicon-chevron-down")
                              .addClass("glyphicon-chevron-right");
            self.panel_minimized = true;
        },

        maximizeView: function() {
            var self = this;
            var $mintarget = self.$cellPanel;
            $mintarget.find(".panel-body").slideDown();
            $mintarget.find(".panel-footer").slideDown();
            self.$minimizeControl.removeClass("glyphicon-chevron-right")
                                .addClass("glyphicon-chevron-down");

            self.$dynamicMethodSummary.hide();
            self.panel_minimized = false;
        },


        /**
         * Get next steps, and invoke render_cb() with
         * the specs returned by the trigger:getFunctionSpecs.Narrative for
         * each of the possible apps/methods.
         */
        getNextSteps: function(render_cb) {
          // fetch full info, which contains suggested next steps
          var params = {ids: [this.method.info.id]};
          var result = {};
          var self = this;
          this.methClient.get_method_full_info(params,
            $.proxy(function(info_list) {
              var sugg = info_list[0].suggestions;
              var params = {apps: sugg.next_apps, methods: sugg.next_methods};
              this.trigger('getFunctionSpecs.Narrative', [params,
                function(specs) { render_cb(specs); }]);
            }, this),
            function(error) {
              console.error(error, "method=", self.method);
              KBError("kbaseNarrativeMethodCell.getNextSteps",
                       "Could not get full info for method: " + self.method.info.id);
              render_cb();
            });
        },

        /**
         * Converts a timestamp to a simple string.
         * Do this American style - HH:MM:SS MM/DD/YYYY
         *
         * @param {string} timestamp - a timestamp in number of milliseconds since the epoch.
         * @return {string} a human readable timestamp
         */
        readableTimestamp: function(timestamp) {
            var format = function(x) {
                if (x < 10)
                    x = '0' + x;
                return x;
            };

            var d = null;
            if (timestamp)
                d = new Date(timestamp);
            else
                d = new Date();
            var hours = format(d.getHours());
            var minutes = format(d.getMinutes());
            var seconds = format(d.getSeconds());
            var month = d.getMonth()+1;
            var day = format(d.getDate());
            var year = d.getFullYear();

            return hours + ":" + minutes + ":" + seconds + ", " + month + "/" + day + "/" + year;
        }
    });
  });
})( jQuery );
