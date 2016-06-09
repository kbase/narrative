define([
    'jquery',
    'kbwidget',
    'bluebird',
    'bootstrap',
    'narrativeConfig',
    'base/js/namespace',
    'services/kernels/comm',
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
    JupyterComm,
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
    return KBWidget({
        name: 'kbaseNarrativeJobStatus',
        parent: KBaseAuthenticatedWidget,
        version: '0.0.1',
        options: {
            jobId: null,
            jobInfo: null,
            statusText: null
        },
        comm: null,

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
             * 3. Initialize layout, set up comm channel and bus.
             */
            var cellState = this.getCellState();
            if (cellState && cellState.jobId === this.jobId) {
                // use this and not the state input.
                this.state = cellState;
            }

            this.runtime.bus().listen({
                test: function(msg) {
                    // return true;
                    return (msg.data && msg.data.jobId === this.jobId);
                }.bind(this),
                handle: function(msg) {
                    // console.log('handling a message', msg);
                    this.handleJobStatus(msg);
                }.bind(this)
            });
            console.log(this.runtime.bus());
            // render up the panel's view layer.
            this.initializeView();
            this.updateView();
            // wire up the comm channel and turn it loose.
            // $([Jupyter.events]).on('kernel_ready.Kernel', function() {
            //     this.initCommChannel();
            // }.bind(this));
            // this.initCommChannel();

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
                    this.updateLogs(message.data.logs);
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

        updateLogs: function(logs) {
            var firstLine = logs.first;
            for (var i=0; i<logs.lines.length; i++) {
                this.logsView.find('#kblog-panel').append($(this.logLineTmpl({lineNum: (i+1), log: logs.lines[i]})));
            }
        },

        makeLogsPanel: function() {
            var logsPanelTmpl = Handlebars.compile(LogPanelTemplate);
            this.logLineTmpl = Handlebars.compile(LogLineTemplate);
            var $logsPanel = $(logsPanelTmpl());
            $logsPanel.find('#kblog-play').click(function() {
                this.runtime.bus().send({
                    type: 'request-job-log',
                    jobId: this.jobId,
                    options: {
                        first_line: 0
                    }
                })
            }.bind(this));
            return $logsPanel;
        }
    });
});