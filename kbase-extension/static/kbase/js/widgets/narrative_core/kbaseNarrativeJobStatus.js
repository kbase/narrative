define([
    'jquery',
    'kbwidget',
    'bootstrap',
    'narrativeConfig',
    'base/js/namespace',
    'util/string',
    'handlebars',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'kbaseViewLiveRunLog',
    'kbaseReportView'
], function (
    $,
    KBWidget,
    bootstrap,
    Config,
    Jupyter,
    StringUtil,
    Handlebars,
    KBaseAuthenticatedWidget,
    KBaseTabs,
    KBaseViewLiveRunLog,
    KBaseReportView
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

        init: function(options) {
            this._super(options);

            // this.makeJobStatusPanel(this.jobId, statusText);
            this.$elem.append(this.options.jobId);

            return this;
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
    });
});