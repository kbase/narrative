/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    'jquery',
    'underscore',
    'kbwidget',
    'narrativeConfig',
    'kbase-client-api',
    'base/js/namespace',
    'util/timeFormat',
    'handlebars',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'kbaseViewLiveRunLog',
    'kbaseReportView',
    'common/runtime',
    'text!kbase/templates/job_status/status_table.html',
    'text!kbase/templates/job_status/header.html',
    'text!kbase/templates/job_status/log_panel.html',
    'text!kbase/templates/job_status/log_line.html',
    'text!kbase/templates/job_status/new_objects.html',
    'css!kbase/css/kbaseJobLog.css',
    'bootstrap'
], function (
    Promise,
    $,
    _,
    KBWidget,
    Config,
    KBaseClientApi,
    Jupyter,
    TimeFormat,
    Handlebars,
    KBaseAuthenticatedWidget,
    KBaseTabs,
    KBaseViewLiveRunLog,
    KBaseReportView,
    Runtime,
    JobStatusTableTemplate,
    HeaderTemplate,
    LogPanelTemplate,
    LogLineTemplate,
    NewObjectsTemplate
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
            this.outputWidgetInfo = this.options.outputWidgetInfo;
            // expects:
            // name, id, version for appInfo
            this.appInfo = this.options.info;

            var cellNode = this.$elem.closest('.cell').get(0);
            function findCell() {
                var cells = Jupyter.notebook.get_cell_elements().toArray().filter(function (element) {
                    if (element === cellNode) {
                        return true;
                    }
                    return false;
                });
                if (cells.length === 1) {
                    return $(cells[0]).data('cell');
                }
                throw new Error('Cannot find the cell node!', cellNode, cells);

            }

            this.cell = findCell();

            // this.cell = Jupyter.narrative.getCellByKbaseId(this.$elem.attr('id'));
            //console.log('initializing with job id = ' + this.jobId);
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


            var bus = this.runtime.bus();

            bus.listen({
                channel: {
                    jobId: this.jobId
                },
                key: {
                    type: 'job-status'
                },
                handle: function (message) {
                    this.handleJobStatus(message);
                }.bind(this)
            });


            bus.listen({
                channel: {
                    jobId: this.jobId
                },
                key: {
                    type: 'job-logs'
                },
                handle: function (message) {
                    this.handleJobLogs(message);
                }.bind(this)
            });

            bus.listen({
                channel: {
                    jobId: this.jobId
                },
                key: {
                    type: 'job-log-deleted'
                },
                handle: function (message) {
                    this.handleJobLogDeleted(message);
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
            this.reportView = this.makeReportPanel();
            this.newDataView = this.makeNewDataView();
            var $tabDiv = $('<div>');
            this.tabController = new KBaseTabs($tabDiv, {
                tabs: [
                    {
                        tab: 'Status',
                        content: body,
                    },
                    {
                        tab: 'Logs',
                        content: this.logsView
                    },
                    // {
                    //     tab: 'Report',
                    //     content: this.reportView
                    // },
                    // {
                    //     tab: 'New Data Objects',
                    //     content: this.newDataView
                    // }
                ]
            });
            this.$elem.append($tabDiv);
        },

        updateView: function() {
            // Update status panel (always)
            this.view.statusPanel.remove();
            this.view.statusPanel = this.updateJobStatusPanel();
            this.view.body.append($(this.view.statusPanel));

            if (this.state.job_state === 'completed') {
                // If job's complete, and we have a report, show that.
                if (this.outputWidgetInfo && this.outputWidgetInfo.params &&
                    this.outputWidgetInfo.params.report_ref && !this.showingReport) {
                    this.showReport();
                }

                // If job's complete, and we have newly generated objects, show them.
                if (this.state.result && !this.showingNewObjects) {
                    this.showNewObjects();
                }
            }

        },

        showNewObjects: function() {
            if (!this.showingNewObjects) {
                // If we have a report ref, show that widget.
                if (this.outputWidgetInfo && this.outputWidgetInfo.params &&
                    this.outputWidgetInfo.params.report_ref) {
                    this.tabController.addTab({tab: 'New Data Objects', showContentCallback: function() {
                        var params = this.outputWidgetInfo.params;
                        params.showReportText = false;
                        params.showCreatedObjects = true;
                        var $newObjDiv = $('<div>');
                        new KBaseReportView($newObjDiv, params);
                        return $newObjDiv;
                    }.bind(this)});
                }
                // If not, try to guess what we've got?
                else {
                    var results = this.state.result;
                    var refs = this.guessReferences(results);
                    if (refs && refs.length > 0) {
                        var objRefs = [];
                        refs.forEach(function(ref) {
                            objRefs.push({ref: ref});
                        });
                        var newObjTmpl = Handlebars.compile(NewObjectsTemplate);
                        var wsClient = new Workspace(Config.url('workspace'), {token: this.runtime.authToken()});
                        Promise.resolve(wsClient.get_object_info_new({objects: objRefs}))
                        .then(function(objInfo) {
                            this.tabController.addTab({tab: 'New Data Objects', showContentCallback: function() {
                                var renderedInfo = [];
                                var $div = $('<div>');
                                objInfo.forEach(function(obj) {
                                    renderedInfo.push({
                                        'name': obj[1],
                                        'type': obj[2].split('-')[0].split('.')[1],
                                        'fullType': obj[2]
                                        // 'description': objsCreated[k].description ? objsCreated[k].description : '',
                                        // 'ws_info': objI[k]
                                    });
                                });
                                var $objTable = $(newObjTmpl(renderedInfo));
                                for (var i=0; i<objInfo.length; i++) {
                                    var info = objInfo[0];
                                    $objTable.find('#' + objInfo[i][1]).click(function() {
                                        this.openViewerCell(this.createInfoObject(info));
                                    }.bind(this));
                                }
                                $div.append($objTable);
                                return $div;
                            }.bind(this)});
                        }.bind(this))
                        .catch(function(error) {
                            //die silently.
                        });
                    }
                }
                this.showingNewObjects = true;
            }
        },

        openViewerCell: function (info) {
            var cell = Jupyter.notebook.get_selected_cell();
            var near_idx = 0;
            if (cell) {
                near_idx = Jupyter.notebook.find_cell_index(cell);
                $(cell.element).off('dblclick');
                $(cell.element).off('keydown');
            }
            this.trigger('createViewerCell.Narrative', {
                'nearCellIdx': near_idx,
                'widget': 'kbaseNarrativeDataCell',
                'info': info
            });
        },

        createInfoObject: function (info) {
            return _.object(['id', 'name', 'type', 'save_date', 'version',
                'saved_by', 'ws_id', 'ws_name', 'chsum', 'size',
                'meta'], info);
        },

        /**
         * Given any object, if there are references in it, those get returned as an Array.
         * Does not search keys for Objects, just values.
         * Handles whether it's a string, array, or object.
         * Scans recursively, too. Fun!
         */
        guessReferences: function(obj) {
            /* 3 cases.
             * 1. obj == string
             * - test for xxx/yyy/zzz format. if so == ref
             * 2. obj == object
             * - scan all values with guessReferences
             * 3. obj == Array
             * - scan all elements with guessReferences
             */
            var type = Object.prototype.toString.call(obj);
            switch(type) {
                case '[object String]':
                    if (obj.match(/^[^\/]+\/[^\/]+(\/[^\/]+)?$/)) {
                        return [obj];
                    }
                    else {
                        return null;
                    }

                case '[object Array]':
                    var ret = [];
                    obj.forEach(function (elem) {
                        var refs = this.guessReferences(elem);
                        if (refs) {
                            ret = ret.concat(refs);
                        }
                    }.bind(this));
                    return ret;

                case '[object Object]':
                    var ret = [];
                    Object.keys(obj).forEach(function(key) {
                        var refs = this.guessReferences(obj[key]);
                        if (refs) {
                            ret = ret.concat(refs);
                        }
                    }.bind(this));
                    return ret;

                default:
                    return null;
            }
        },

        makeNewDataView: function() {
            return $('<div>');
        },

        showReport: function() {
            if (!this.showingReport) {
                this.tabController.addTab({tab: 'Report', showContentCallback: function() {
                    var params = this.outputWidgetInfo.params;
                    params.showReportText = true;
                    params.showCreatedObjects = false;
                    var $reportDiv = $('<div>');
                    new KBaseReportView($reportDiv, params);
                    return $reportDiv;
                }.bind(this)});
                this.showingReport = true;
            }
        },

        makeReportPanel: function() {
            return $('<div>');
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

        handleJobStatus: function (message) {
            // console.log('HANDLE JOB STATUS', message);
            this.state = message.jobState;
            this.outputWidgetInfo = message.outputWidgetInfo;
            this.setCellState();
            this.updateView();
        },

        handleJobLogs: function (message) {
            if (this.pendingLogRequest &&
                (this.pendingLogLine === message.logs.first ||
                    this.pendingLogLine === 'latest' &&
                    message.logs.latest)) {
                this.updateLogs(message.logs);
            }
        },

        handleJobLogDeleted: function (message) {
            this.showLogMessage('Job has been deleted. No log available.');
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
                this.logsView.find('#kblog-spinner').hide();
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
            this.logsView.find('#kblog-spinner').show();
            this.pendingLogRequest = true;
            this.pendingLogLine = firstLine;
            if (typeof firstLine === 'string' && firstLine === 'latest') {
                this.runtime.bus().emit('request-latest-job-log', {
                    jobId: this.jobId,
                    options: {
                        num_lines: this.maxLineRequest
                    }
                });
            }
            else {
                this.runtime.bus().emit('request-job-log', {
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
