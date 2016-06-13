define([
    'jquery',
    'kbwidget',
    'bluebird',
    'bootstrap',
    'narrativeConfig',
    'base/js/namespace',
    'services/kernels/comm',
    'util/string',
    'handlebars',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'kbaseViewLiveRunLog',
    'kbaseReportView',
    'common/runtime',
    'text!kbase/templates/job_status_table.html'
], function (
    $,
    KBWidget,
    Promise,
    bootstrap,
    Config,
    Jupyter,
    JupyterComm,
    StringUtil,
    Handlebars,
    KBaseAuthenticatedWidget,
    KBaseTabs,
    KBaseViewLiveRunLog,
    KBaseReportView,
    Runtime,
    JobStatusTableTemplate
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
                    return (msg.jobId === this.jobId);
                }.bind(this),
                handle: function(msg) {
                    // console.log('handling a message', msg);
                    this.handleJobStatus(msg);
                }.bind(this)
            });
            // console.log(this.runtime.bus());
            // render up the panel's view layer.
            this.makeJobStatusPanel();
            // wire up the comm channel and turn it loose.
            this.initCommChannel();

            return this;
        },

        getCellState: function() {
            var metadata = this.cell.metadata;
            if (this.cell.metadata.kbase) {
                return cell.metadata.kbase;
            }
            else {
                return null;
            }
        },

        setCellState: function() {
            this.cell.metadata.kbase = {
                type: 'output',
                jobId: this.jobId,
                state: this.state
            };
        },

        handleJobStatus: function(message) {
            if (message.type !== 'jobstatus')
                return;
            this.state = message.jobState.state;
            this.setCellState();
            this.updateJobStatusPanel();
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

                    // Jupyter.notebook.kernel.comm_manager.register_target(commName, function(comm, msg) {
                    //     this.comm = comm;
                    //     console.info("Job Widget Comm inited!", this.comm);
                    //     comm.on_msg(this.handleCommMessages.bind(this));
                    // }.bind(this));
                }
            }.bind(this));
        },

        updateJobStatusPanel: function() {
            var info = {
                jobId: this.jobId,
                status: this.state.job_state,
                creationTime: this.state.creation_time,
                queueTime: this.state.exec_start_time - this.state.creation_time,
                queuePos: this.state.position ? this.state.position : null,
                execStartTime: this.state.exec_start_time,
                execEndTime: this.state.finish_time,
                execRunTime: this.state.finish_time - this.state.execStartTime
            };
            this.$elem.empty().append(this.statusTableTmpl(info));

        },

        makeJobStatusPanel: function() {
            this.statusTableTmpl = Handlebars.compile(JobStatusTableTemplate);
            this.updateJobStatusPanel();

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