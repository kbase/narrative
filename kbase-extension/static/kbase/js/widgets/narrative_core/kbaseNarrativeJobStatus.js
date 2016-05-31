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
    'text!kbase/templates/job_status_table.html',
    'text!kbase/templates/job_status_header.html'
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
    HeaderTemplate
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
                    console.log('handling a message', msg);
                    this.handleJobStatus(msg);
                }.bind(this)
            });
            console.log(this.runtime.bus());
            // render up the panel's view layer.
            this.initializeView();
            this.updateView();
            // wire up the comm channel and turn it loose.
            this.initCommChannel();

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
            var $tabDiv = $('<div>');
            var tabs = new KBaseTabs($tabDiv, {
                tabs: [
                    {
                        tab: 'Status',
                        content: body,
                    },
                    {
                        tab: 'Console',
                        content: $('<div>').append('not done yet...')
                    }
                ]
            });
            this.$elem.append($tabDiv);
        },

        updateView: function() {
            console.log('updating view...');
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
            if (message.type !== 'job-status')
                return;
            this.state = message.data.jobState.state;
            this.setCellState();
            this.updateView();
        },

        showError: function(message) {
            this.$elem.append(message);
        },

        handleCommMessages: function(msg) {
            console.info("Job Message!", msg);
        },

        initCommChannel: function() {
            var commName = 'KBaseJob-' + this.jobId;
            Jupyter.notebook.kernel.comm_info(commName, function(msg) {
                if (msg.content && msg.content.comms) {
                    // skim the reply for the right id
                    for (var id in msg.content.comms) {
                        if (msg.content.comms[id].target_name === commName) {
                            this.comm = new JupyterComm.Comm(commName, id);
                            console.info("Job Widget Comm inited!", this.comm);
                            Jupyter.notebook.kernel.comm_manager.register_comm(this.comm);
                            this.comm.on_msg(this.handleCommMessages.bind(this));
                        }
                    }
                }
                if (this.comm === null) {
                    this.comm = new JupyterComm.Comm(commName);
                    Jupyter.notebook.kernel.comm_manager.register_comm(this.comm);
                    console.info("Job Widget Comm inited manually:", this.comm);
                    this.comm.on_msg(this.handleCommMessages.bind(this));
                }
            }.bind(this));
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

            // var tableInfo = {
            //     jobId: this.jobId,
            // }

            // function makeInfoRow(heading, info) {
            //     return $('<tr>').append($('<th>')
            //             .append(heading + ':'))
            //             .append($('<td>')
            //             .append(info));
            // }

            // var $infoTable = $('<table class="table table-bordered">')
            //         .append(makeInfoRow('Job Id', jobId))
            //         .append(makeInfoRow('Status', statusText));
            // if (jobState && jobState.state) {
            //     var state = jobState.state;
            //     var creationTime = state.start_timestamp;
            //     var execStartTime = null;
            //     var finishTime = null;
            //     var posInQueue = null;
            //     // console.log(state.step_stats);
            //     if (state.step_stats) {
            //         for (var key in state.step_stats) {
            //             if (state.step_stats.hasOwnProperty(key)) {
            //                 var stats = state.step_stats[key];
            //                 // console.log(key, stats);
            //                 if (stats['creation_time'])
            //                     creationTime = stats['creation_time'];
            //                 execStartTime = stats['exec_start_time'];
            //                 finishTime = stats['finish_time'];
            //                 posInQueue = stats['pos_in_queue'];
            //             }
            //         }
            //     }
            //     if (creationTime)
            //         $infoTable.append(makeInfoRow('Submitted', this.readableTimestamp(creationTime)));
            //     if (creationTime && execStartTime)
            //         $infoTable.append(makeInfoRow('Time in queue', ((execStartTime - creationTime) / 1000.0) + " sec."));
            //     if (posInQueue)
            //         $infoTable.append(makeInfoRow('Position in queue', posInQueue));
            //     if (execStartTime)
            //         $infoTable.append(makeInfoRow('Execution Started', this.readableTimestamp(execStartTime)));
            //     if (finishTime)
            //         $infoTable.append(makeInfoRow('Execution Finished', this.readableTimestamp(finishTime)));
            //     if (execStartTime && finishTime)
            //         $infoTable.append(makeInfoRow('Execution Time', ((finishTime - execStartTime) / 1000.0) + " sec."));
            // }

            // return $infoTable;
        },
    });
});