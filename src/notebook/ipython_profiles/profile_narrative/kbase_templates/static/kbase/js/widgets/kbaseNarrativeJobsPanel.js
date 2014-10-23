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
        init: function(options) {
            this._super(options);

            $(document).on('registerJob.Narrative', $.proxy(
                function(e, jobInfo) {
                    this.registerJob(jobInfo);
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

            this.addButton($refreshBtn);

            this.body().append(this.$jobsPanel)
                       .append(this.$loadingPanel)
                       .append(this.$errorPanel);

            // this.body().append($('<div>')
            //                   .addClass('panel panel-primary kb-data-main-panel')
            //                   .append($('<div>')
            //                           .addClass('panel-heading')
            //                           .append($('<div>')
            //                                   .addClass('panel-title')
            //                                   .css({'text-align': 'center'})
            //                                   .append($headerDiv)))
            //                   .append($('<div>')
            //                           .addClass('panel-body kb-narr-panel-body')
            //                           .append(this.$jobsPanel)
            //                           .append(this.$loadingPanel)
            //                           .append(this.$errorPanel)));

            this.refresh();

            if (this.options.autopopulate === true) {
                this.refresh();
            }

            return this;
        },

        // render: function() {
        //     if (this.options.jobInfo) {
        //         this.refresh(this.options.jobInfo);
        //     }
        //     else
        //         this.$elem.html('Job Watching!');
        // },

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

        registerJob: function(jobInfo) {
            if (!IPython || !IPython.notebook || !IPython.notebook.kernel || !IPython.notebook.metadata)
                return;
            if (!IPython.notebook.metadata.job_ids)
                IPython.notebook.metadata.job_ids = [];

            IPython.notebook.metadata.job_ids.push(jobInfo);
            this.refresh();
        },

        /**
         * @method
         */
        refresh: function() {
            if (!IPython || !IPython.notebook || !IPython.notebook.kernel || 
                !IPython.notebook.metadata)
                return;

            if (!IPython.notebook.metadata.job_ids) {
                this.showMessage('No running jobs!');
                return;
            }

            this.showLoadingMessage('Loading running jobs...');

            var narrJobs = IPython.notebook.metadata.job_ids;
            var uniqueJobs = {};
            var jobList = [];
            for (var i=0; i<narrJobs.length; i++) {
                if (uniqueJobs.hasOwnProperty(narrJobs[i].id))
                    continue;
                uniqueJobs[narrJobs[i].id] = narrJobs[i];
                jobList.push("'" + narrJobs[i].id + "'");
            }

            if (jobList.length === 0) {
                // no jobs! skip the kernel noise and cut to the rendering!
                this.populateJobsPanel();
                return;
            }

            // Command to load and fetch all functions from the kernel
            var pollJobsCommand = 'from biokbase.narrative.common.kbjob_manager import KBjobManager\n' +
                                  'j = KBjobManager()\n' +
                                  'print j.poll_jobs([' + jobList + '], as_json=True)\n';

            var callbacks = {
                'output' : $.proxy(function(msgType, content) { 
                    this.parseKernelResponse(msgType, content); 
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

            var msgid = IPython.notebook.kernel.execute(pollJobsCommand, callbacks, {silent: false});            

        },

        parseKernelResponse: function(msgType, content) {
            // if it's not a datastream, display some kind of error, and return.
            if (msgType != 'stream') {
                this.showError('Sorry, an error occurred while loading the job list.');
                return;
            }
            var buffer = content.data;
            if (buffer.length > 0) {
                var jobList = JSON.parse(buffer);
                this.populateJobsPanel(jobList);
            }
            this.$loadingPanel.hide();
            this.$jobsPanel.show();
        },

        handleCallback: function(call, content) {
            if (content.status === 'error') {
                this.showError(content);
            }
            else {
                console.debug('kbaseJobManagerPanel.' + call);
                console.debug(content);
            }
        },

        populateJobsPanel: function(jobs) {
            if (!jobs || jobs.length === 0) {
                this.showMessage('No running jobs!');
                return;
            }
            var $jobTable = $('<div class="kb-jobs-items">');
            for (var i=0; i<jobs.length; i++) {
                $jobTable.append(this.renderJob(jobs[i]));
            }
            this.$jobsPanel.empty().append($jobTable);
        },

        renderJob: function(job) {
            var $row = $('<div class="kb-jobs-item">');
            if (!job || job.length < 12) {
                return $row;
            }
            $row.append($('<div class="kb-jobs-title">').append(job[1]).append(this.makeJobDetailButton(job)));
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

        makeJobDetailButton: function(job) {
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

            var sourceId = "";
            // fuck, looping through for now.
            var jobs = IPython.notebook.metadata.job_ids;
            for (var i=0; i<jobs.length; i++) {
                if (jobs[i].id === job[0])
                    sourceId = jobs[i].source;
            }

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

            var timeHtml = '<div href="#" data-toggle="tooltip" title="' + parsedTime + '" millis="' + timeMillis + '" class="kbujs-timestamp">' + timediff + '</div>';
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
                    $tracebackDiv.append(error.traceback[i] + "<br>");
                }

                var $tracebackPanel = $('<div>');
                var tracebackAccordion = [{'title' : 'Traceback', 'body' : $tracebackDiv}];

                this.$errorPanel.append($details)
                                .append($tracebackPanel);
                $tracebackPanel.kbaseAccordion({ elements : tracebackAccordion });
            }

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
            var t = time.split(/[^0-9]/);
            while (t.length < 7) {
                t.append(0);
            }
            var d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5], t[6]);
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
        },
    });

})( jQuery );