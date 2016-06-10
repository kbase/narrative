define([
    'jquery',
    'kbwidget',
    'bluebird',
    'bootstrap',
    'narrativeConfig',
    'base/js/namespace',
    'util/string',
    'util/timeFormat',
    'handlebars',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'kbaseViewLiveRunLog',
    'kbaseReportView',
    'nbextensions/methodCell/microBus',
    'nbextensions/methodCell/runtime',
    'text!kbase/templates/job_status/status_table.html',
    'text!kbase/templates/job_status/header.html',
    'text!kbase/templates/job_status/log_panel.html',
    'text!kbase/templates/job_status/log_line.html',
    'css!kbase/css/kbaseJobLog.css'
], function (
    $,
    KBWidget,
    Promise,
    bootstrap,
    Config,
    Jupyter,
    StringUtil,
    TimeFormat,
    Handlebars,
    KBaseAuthenticatedWidget,
    KBaseTabs,
    KBaseViewLiveRunLog,
    KBaseReportView,
    Bus,
    Runtime,
    JobStatusTableTemplate,
    HeaderTemplate,
    LogPanelTemplate,
    LogLineTemplate,
    JobLogCss
) {
    'use strict';
    return new KBWidget({
        name: 'kbaseNarrativeJobStatus',
        parent: KBaseAuthenticatedWidget,
        version: '0.0.1',
        options: {
            jobId: null,
            jobInfo: null,
            statusText: null
        },
        pendingLogRequest: false,   // got a log request pending? (used for keeping log instances separate)
        pendingLogStart: 0,         // pending top line number we're expecting.
        maxLineRequest: 100,        // max number of lines to request
        maxLogLine: 0,              // max log lines available (as of last push)
        currentLogStart: 0,         // current first line in viewer
        currentLogLength: 0,        // current number of lines
        maxLogLines: 200,           // num lines before we start trimming

        init: function(options) {
            this._super(options);
            this.jobId = this.options.jobId;
            this.state = this.options.state;
            // expects:
            // name, id, version for appInfo
            this.appInfo = this.options.info;
            this.cell = Jupyter.narrative.getCellByKbaseId(this.$elem.attr('id'));

            console.log('initializing with job id = ' + this.jobId);
            if (!this.jobId) {
                this.showError("No Job id provided!");
                return this;
            }
            this.runtime = Runtime.make();

            /**
             * Initial flow.
             * 1. Check cell for state. If state's job id matches this widget's then use it and ignore other inputs.
             * 2. If not, use inputs as initial state.
             * 3. Initialize layout, set up bus.
             */
            var cellState = this.getCellState();
            if (cellState && cellState.jobId === this.jobId) {
                // use this and not the state input.
                this.state = cellState;
            }

            this.runtime.bus().listen({
                test: function(msg) {
                    return (msg.data && msg.data.jobId === this.jobId);
                }.bind(this),
                handle: function(msg) {
                    this.handleJobStatus(msg);
                }.bind(this)
            });
            // render up the panel's view layer.
            this.initializeView();
            this.updateView();

            return this;
        },

        initializeView: function() {
            /* Tabs with 3 parts.
             * Initial = Status.
             * Second = Console.
             * Third = View Inputs
             */
            var header = this.makeHeader();
            var body = this.makeBody();
            var statusPanel = this.makeJobStatusPanel();
            this.$elem.append(header);
            body.append(statusPanel);
            this.view = {
                header: header,
                statusPanel: statusPanel,
                body: body
            };
            this.logsView = this.makeLogsPanel();
            var $tabDiv = $('<div>');
            var tabs = new KBaseTabs($tabDiv, {
                tabs: [
                    {
                        tab: 'Status',
                        content: body,
                    },
                    {
                        tab: 'Logs',
                        content: this.logsView
                    }
                ]
            });
            this.$elem.append($tabDiv);
        },

        updateView: function() {
            // console.log('updating view...');
            this.view.statusPanel.remove();
            this.view.statusPanel = this.updateJobStatusPanel();
            this.view.body.append($(this.view.statusPanel));
        },

        makeBody: function() {
            return $('<div>');
        },

        makeHeader: function() {
            var tmpl = Handlebars.compile(HeaderTemplate);
            return $(tmpl(this.appInfo));
        },

        getCellState: function() {
            var metadata = this.cell.metadata;
            if (metadata.kbase && metadata.kbase.state) {
                return metadata.kbase.state;
            }
            else {
                return null;
            }
        },

        setCellState: function() {
            var metadata = this.cell.metadata;
            metadata['kbase'] = {
                type: 'output',
                jobId: this.jobId,
                state: this.state
            };
            this.cell.metadata = metadata;
        },

        handleJobStatus: function(message) {
            switch (message.type) {
                case 'job-status':
                    this.state = message.data.jobState.state;
                    this.setCellState();
                    this.updateView();
                    break;
                case 'job-logs':
                    if (this.pendingLogRequest && (this.pendingLogLine === message.data.logs.first || this.pendingLogLine === 'latest' && message.data.logs.latest)) {
                        this.updateLogs(message.data.logs);
                    }
                    break;
                case 'job-log-deleted':
                    window.alert('Job has been deleted. No log available.');
                    break;
                default:
                    break;
            }
        },

        showError: function(message) {
            this.$elem.append(message);
        },

        updateJobStatusPanel: function() {
            var info = {
                jobId: this.jobId,
                status: this.state.job_state,
                creationTime: TimeFormat.readableTimestamp(this.state.creation_time),
                queueTime: TimeFormat.calcTimeDifference(this.state.creation_time, this.state.exec_start_time),
                queuePos: this.state.position ? this.state.position : null,
            };

            if (this.state.exec_start_time) {
                info.execStartTime = TimeFormat.readableTimestamp(this.state.exec_start_time);
            }
            if (this.state.finish_time) {
                info.execEndTime = TimeFormat.readableTimestamp(this.state.finish_time);
                info.execRunTime = TimeFormat.calcTimeDifference(this.state.finish_time, this.state.exec_start_time);
            }

            return $(this.statusTableTmpl(info));
        },

        makeJobStatusPanel: function() {
            this.statusTableTmpl = Handlebars.compile(JobStatusTableTemplate);
            return this.updateJobStatusPanel();
        },

        makeLogsPanel: function() {
            var logsPanelTmpl = Handlebars.compile(LogPanelTemplate);
            this.logLineTmpl = Handlebars.compile(LogLineTemplate);
            var $logsPanel = $(logsPanelTmpl());
            $logsPanel.find('#kblog-play').click(function() {
                this.sendLogRequest('latest');
                $logsPanel.find('button[id!="kblog-stop"]').prop('disabled', true);
                $logsPanel.find('#kblog-stop').prop('disabled', false);
                this.doLogLoop = true;
            }.bind(this));
            $logsPanel.find('#kblog-stop').click(function() {
                if (this.looper)
                    clearTimeout(this.looper);
                $logsPanel.find('button[id!="kblog-stop"]').prop('disabled', false);
                $logsPanel.find('#kblog-stop').prop('disabled', true);
                this.doLogLoop = false;
            }.bind(this));
            $logsPanel.find('#kblog-top').click(function() {
                // go to beginning.
                this.sendLogRequest(0);
            }.bind(this));
            $logsPanel.find('#kblog-back').click(function() {
                // go back a chunk.
                this.sendLogRequest(Math.max(this.currentLogStart - this.maxLineRequest, 0));
            }.bind(this));
            $logsPanel.find('#kblog-forward').click(function() {
                // go forward a chunk.
                this.sendLogRequest(this.currentLogStart + this.currentLogLength);
            }.bind(this));
            $logsPanel.find('#kblog-bottom').click(function() {
                // go to end.
                this.sendLogRequest('latest');
            }.bind(this));
            $logsPanel.find('#kblog-spinner').hide();
            // $logsPanel.find('#kblog-panel').scroll(function(e) {
            //     console.log('scrolling happened!');
            // });
            $logsPanel.find("#kblog-header")
                      .children()
                      .tooltip()
                      .on('click', function(e) { console.log(e); $(e.currentTarget).tooltip('hide'); });
            return $logsPanel;
        },

        sendLogRequest: function(firstLine) {
            console.log('sending ' + firstLine + ' request');
            this.logsView.find('#kblog-spinner').show();
            this.pendingLogRequest = true;
            this.pendingLogLine = firstLine;
            if (typeof firstLine === 'string' && firstLine === 'latest') {
                this.runtime.bus().send({
                    type: 'request-latest-job-log',
                    jobId: this.jobId,
                    options: {
                        num_lines: this.maxLineRequest
                    }
                });
            }
            else {
                this.runtime.bus().send({
                    type: 'request-job-log',
                    jobId: this.jobId,
                    options: {
                        first_line: this.pendingLogLine,
                        num_lines: this.maxLineRequest
                    }
                });
            }
        },

        showLogMessage: function(message) {
            this.logsView.find("#kblog-msg").html(message);
        },

        updateLogs: function(logs) {
            this.pendingLogRequest = false;
            if (logs.max_lines > this.maxLogLines) {
                this.showLogMessage("Showing lines " + (logs.first+1) + " to " + (logs.first + logs.lines.length) + " of " + logs.max_lines);
            }
            if (logs.first === null || logs.first === undefined || !logs.lines) {
                return;
            }
            this.logsView.find('#kblog-panel').empty();
            var firstLine = logs.first;
            for (var i=0; i<logs.lines.length; i++) {
                // logs.lines[i].line = logs.lines[i].line.trim().replace('\n', '');
                this.logsView.find('#kblog-panel').append($(this.logLineTmpl({lineNum: (firstLine+i+1), log: logs.lines[i]})));
            }
            this.maxLogLine = logs.maxLines;
            this.currentLogStart = logs.first;
            this.currentLogLength = logs.lines.length;
            this.logsView.find('#kblog-spinner').hide();
            if (this.doLogLoop) {
                // don't bother looping if we're complete.
                if (this.state.job_state === 'suspend' || this.state.job_state === 'completed') {
                    this.logsView.find('#kblog-stop').click();
                }
                else {
                    this.looper = setTimeout(function() { this.sendLogRequest('latest', true); }.bind(this), 2000);
                }
            }
            // var lastPos = this.logsView.find('#kblog-panel').children().last().
            // this.logsView.find('#kblog-panel').children().last().scrollTop=0;
        }
    });
});