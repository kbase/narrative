/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    'jquery',
    'underscore',
    'handlebars',
    'kbwidget',
    'narrativeConfig',
    'kbase-client-api',
    'base/js/namespace',
    'util/timeFormat',
    'kb_service/client/workspace',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'kbaseReportView',
    'common/runtime',
    'common/semaphore',
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
    Handlebars,
    KBWidget,
    Config,
    KBaseClientApi,
    Jupyter,
    TimeFormat,
    Workspace,
    KBaseAuthenticatedWidget,
    KBaseTabs,
    KBaseReportView,
    Runtime,
    Semaphore,
    JobStatusTableTemplate,
    HeaderTemplate,
    LogPanelTemplate,
    LogLineTemplate,
    NewObjectsTemplate
) {
    'use strict';

    function VirtualSlice(config) {
        var maxSize = config.max  || 100;
        var startPos;
        var theSlice;
        var trimEnd = config.trimEnd || 'auto';
        
        if (config.value) {
            theSlice = config.value;
            if (theSlice.length > maxSize) {
                theSlice = theSlice.slice(0, maxSize);
            }
            startPos = config.start;
        } else {
            theSlice = [];
            startPos = 0;
        }

        /*
            Adds array items to the slice, starting at virtual position start.
        */
        function trim(thisTrimEnd) {
            var chop = theSlice.length - maxSize;
            if (chop <= 0) {
                return;
            }
            if (trimEnd !== 'auto') {
                thisTrimEnd = trimEnd;
            }
            if (thisTrimEnd === 'end') {
                theSlice = theSlice.slice(0, theSlice.length - chop);
            } else {
                theSlice = theSlice.slice(chop);
                startPos = startPos + chop;
            }
        }
        function grow(log) {
            // handle cases in which the new entires are discontiguous.
            if (log.start + log.lines.length < startPos) {
                replace(log);
                return;
            }
            if (log.start > startPos + theSlice.length) {
                replace(log);
                return;
            }
            var growLength, growLines, growAtBegin = false, growAtEnd = false;
            if (log.first < startPos) {
                growLength = log.first + log.lines.length - startPos;
                growLines = log.lines.slice(0, log.lines.length - growLength);
                theSlice = growLines.concat(theSlice);
                startPos = startPos - growLines.length;
                growAtBegin = true;
            }
            if (log.first + log.lines.length > startPos + theSlice.length) {
                growLength = startPos + theSlice.length - log.first;
                growLines = log.lines.slice(growLength);
                theSlice = theSlice.concat(growLines);
                growAtEnd = true;
            }
            if (growAtBegin) {
                if (growAtEnd) {
                    trim();
                } else {
                    trim('end');
                }
            } else {
                if (growAtEnd) {
                    trim('begin');
                } 
            }
        }

        function replace(log) {
            startPos = log.first;
            theSlice = log.lines;
            trim();
        }
        function update(log) {
            if (log.first === null || log.first === undefined || !log.lines) {
                return;
            }

            if (theSlice.length === 0) {
                replace(log);
                return;
            }

            grow(log);
        }

        function get() {
            return {
                start: startPos,
                end: startPos + theSlice.length,
                items: theSlice
            };
        }

        function getStart() {
            return startPos;
        }
        function getEnd() {
            return startPos + theSlice.length;
        }
        function getLength() {
            return theSlice.length;
        }
        function trimAt(newEnd) {
            trimEnd = newEnd;
        }

        return {
            trimAt: trimAt,
            update: update,
            get: get,
            getStart: getStart,
            getEnd: getEnd,
            getLength: getLength
        };
    }

    return new KBWidget({
        name: 'kbaseNarrativeJobStatus',
        parent: KBaseAuthenticatedWidget,
        version: '0.0.1',
        options: {
            jobId: null,
            jobInfo: null,
            statusText: null
        },
        // CONFIG (const)
        maxLogLines: 200, // num lines before we start trimming
        maxLineRequest: 100, // max number of lines to request
        autoplayInterval: 2000, // when on autoplay, how long to pause before the next log request
        // VARIABLES
        pendingLogStart: 0, // pending top line number we're expecting.
        pendingLogRequest: false, // got a log request pending? (used for keeping log instances separate)
        maxLogLine: 0, // max log lines available (as of last push)

        init: function (options) {
            this._super(options);
            this.jobId = this.options.jobId;
            this.state = this.options.state;
            this.outputWidgetInfo = this.options.outputWidgetInfo;
            // expects:
            // name, id, version for appInfo
            this.appInfo = this.options.info;

            this.virtualLog = VirtualSlice({
                max: this.maxLogLines
            });

            var cellNode = this.$elem.closest('.cell').get(0);

            // Flag to support initialization logic for job status 
            // messages.
            this.firstTime = true;

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
            this.cell.element.trigger('hideCodeArea.cell');
            if (!this.jobId) {
                this.showError('No Job id provided!');
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

            this.busConnection = this.runtime.bus().connect();
            this.channel = this.busConnection.channel('default');

           
            // TODO: can we introduce a stop method for kbwidget?
            // We need to disconnect these listeners when this widget is removed.

            // render up the panel's view layer.
            this.initializeView();
            this.updateView();

            //The job has not started yet. When it has started running, the log will be displayed in this area.

            this.showLogMessage('Loading the log viewer...');

            Semaphore.make().when('comm', 'ready', Config.get('comm_wait_timeout'))
                .then(function () {
                    this.busConnection.listen({
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

                    this.busConnection.listen({
                        channel: {
                            jobId: this.jobId
                        },
                        key: {
                            type: 'job-logs'
                        },
                        handle: function (message) {
                            this.handleJobLog(message);
                        }.bind(this)
                    });

                    this.busConnection.listen({
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

                    this.channel.emit('request-job-status', {
                        jobId: this.jobId
                    });
                }.bind(this))
                .catch(function (err) {
                    console.error('Jobs Comm channel not available', err);
                });


            return this;
        },

        initializeView: function () {
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
            this.logView = this.makeLogPanel();
            this.reportView = this.makeReportPanel();
            this.newDataView = this.makeNewDataView();
            var $tabDiv = $('<div>');
            this.tabController = new KBaseTabs($tabDiv, {
                tabs: [{
                    tab: 'Status',
                    content: body,
                },
                {
                    tab: 'Log',
                    content: this.logView
                }
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

        updateView: function () {
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

        showNewObjects: function () {
            if (!this.showingNewObjects) {
                // If we have a report ref, show that widget.
                if (this.outputWidgetInfo && this.outputWidgetInfo.params &&
                    this.outputWidgetInfo.params.report_ref) {
                    this.tabController.addTab({
                        tab: 'New Data Objects',
                        showContentCallback: function () {
                            var params = this.outputWidgetInfo.params;
                            params.showReportText = false;
                            params.showCreatedObjects = true;
                            var $newObjDiv = $('<div>');
                            new KBaseReportView($newObjDiv, params);
                            return $newObjDiv;
                        }.bind(this)
                    });
                }
                // If not, try to guess what we've got?
                else {
                    var results = this.state.result;
                    var refs = this.guessReferences(results);
                    if (refs && refs.length > 0) {
                        var objRefs = [];
                        refs.forEach(function (ref) {
                            objRefs.push({ ref: ref });
                        });
                        var newObjTmpl = Handlebars.compile(NewObjectsTemplate);
                        var wsClient = new Workspace(Config.url('workspace'), { token: this.runtime.authToken() });
                        Promise.resolve(wsClient.get_object_info_new({ objects: objRefs }))
                            .then(function (objInfo) {
                                this.tabController.addTab({
                                    tab: 'New Data Objects',
                                    showContentCallback: function () {
                                        var renderedInfo = [];
                                        var $div = $('<div>');
                                        objInfo.forEach(function (obj) {
                                            renderedInfo.push({
                                                'name': obj[1],
                                                'type': obj[2].split('-')[0].split('.')[1],
                                                'fullType': obj[2]
                                                    // 'description': objsCreated[k].description ? objsCreated[k].description : '',
                                                    // 'ws_info': objI[k]
                                            });
                                        });
                                        var $objTable = $(newObjTmpl(renderedInfo));
                                        for (var i = 0; i < objInfo.length; i++) {
                                            var info = objInfo[0];
                                            $objTable.find('#' + objInfo[i][1]).click(function () {
                                                this.openViewerCell(this.createInfoObject(info));
                                            }.bind(this));
                                        }
                                        $div.append($objTable);
                                        return $div;
                                    }.bind(this)
                                });
                            }.bind(this))
                            .catch(function (error) {
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
                'meta'
            ], info);
        },

        /**
         * Given any object, if there are references in it, those get returned as an Array.
         * Does not search keys for Objects, just values.
         * Handles whether it's a string, array, or object.
         * Scans recursively, too. Fun!
         */
        guessReferences: function (obj) {
            /* 3 cases.
             * 1. obj == string
             * - test for xxx/yyy/zzz format. if so == ref
             * 2. obj == object
             * - scan all values with guessReferences
             * 3. obj == Array
             * - scan all elements with guessReferences
             */
            var type = Object.prototype.toString.call(obj);
            switch (type) {
            case '[object String]':
                if (obj.match(/^[^\/]+\/[^\/]+(\/[^\/]+)?$/)) {
                    return [obj];
                } else {
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
                Object.keys(obj).forEach(function (key) {
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

        makeNewDataView: function () {
            return $('<div>');
        },

        showReport: function () {
            if (!this.showingReport) {
                this.tabController.addTab({
                    tab: 'Report',
                    showContentCallback: function () {
                        var params = this.outputWidgetInfo.params;
                        params.showReportText = true;
                        params.showCreatedObjects = false;
                        var $reportDiv = $('<div>');
                        new KBaseReportView($reportDiv, params);
                        return $reportDiv;
                    }.bind(this)
                });
                this.showingReport = true;
            }
        },

        makeReportPanel: function () {
            return $('<div>');
        },

        makeBody: function () {
            return $('<div>');
        },

        makeHeader: function () {
            var tmpl = Handlebars.compile(HeaderTemplate);
            return $(tmpl(this.appInfo));
        },

        getCellState: function () {
            var metadata = this.cell.metadata;
            if (metadata.kbase && metadata.kbase.state) {
                return metadata.kbase.state;
            } else {
                return null;
            }
        },

        setCellState: function () {
            var metadata = this.cell.metadata;
            metadata['kbase'] = {
                type: 'output',
                jobId: this.jobId,
                state: this.state
            };
            this.cell.metadata = metadata;
        },

        handleJobStatus: function (message) {
            /* Main states:
               1. initial - first job state message received. For any queued issue message, 
                  in progress start auto fetch loop, otherwise show the end of the log
               2. autoplay - if the play button has been pressed or the user has not interacted
                  with the buttons (this.userEngaged), play the log when in-progress.
               3. userEngaged - if at end of log, same as autoplay?
            */
            switch (message.jobState.job_state) {
            case 'canceled':
            case 'suspend':
            case 'completed':
                this.showLogMessage('');
                if (this.requestedUpdates) {
                    this.requestedUpdates = false;
                    this.channel.emit('request-job-completion', {
                        jobId: this.jobId
                    });
                }
                this.logView.find('#kblog-play').prop('disabled', true);
                if (this.firstTime) {
                    this.logView.find('#kblog-bottom').trigger('click');
                }
                // TODO: we need to remove all of the job listeners at this point, but 
                // the busConnection also has the job log listeners, which may be used at any time.
                // What we need to do is move these into separate widgets which can be stopped and started
                // as the tabs are activated, and control their own bus connections.
                // this.busConnection.stop();
                break;
            case 'queued':
                this.showLogMessage('The job is queued. When it has started running, the log will be displayed below.');
                if (this.firstTime) {
                    this.logView.find('#kblog-play').trigger('click');
                }
                this.requestedUpdates = true;
                this.channel.emit('request-job-status', {
                    jobId: this.jobId
                });
                break;
            case 'in-progress':
                // If the user has not used the navigation yet, should go into "play" mode;
                this.requestedUpdates = true;
                this.channel.emit('request-job-status', {
                    jobId: this.jobId
                });
                if (this.firstTime) {
                    this.logView.find('#kblog-play').trigger('click');
                }
            }
            this.firstTime = false;
            this.state = message.jobState;
            this.outputWidgetInfo = message.outputWidgetInfo;
            this.setCellState();
            this.updateView();
        },

        handleJobLog: function (message) {
            if (this.pendingLogRequest &&
                (this.pendingLogLine === message.logs.first ||
                    this.pendingLogLine === 'latest' &&
                    message.logs.latest)) {
                this.updateLog(message.logs);
            }
        },

        handleJobLogDeleted: function (message) {
            this.showLogMessage('Job has been deleted. No log available.');
        },

        showError: function (message) {
            this.$elem.append(message);
        },

        updateJobStatusPanel: function () {
            var elapsedQueueTime;
            var elapsedRunTime;

            if (!this.state.creation_time) {
                elapsedQueueTime = '-';
                elapsedRunTime = '-';
            } else {
                if (!this.state.exec_start_time) {
                    elapsedQueueTime = TimeFormat.calcTimeDifference(this.state.creation_time, new Date().getTime());
                    elapsedRunTime = '-';
                } else {
                    elapsedQueueTime = TimeFormat.calcTimeDifference(this.state.creation_time, this.state.exec_start_time);
                    if (!this.state.finish_time) {
                        // 
                        elapsedRunTime = TimeFormat.calcTimeDifference(this.state.exec_start_time, new Date().getTime());
                    } else {
                        elapsedRunTime = TimeFormat.calcTimeDifference(this.state.exec_start_time, this.state.finish_time);
                    }
                }
            }

            var info = {
                jobId: this.jobId,
                status: this.state.job_state,
                creationTime: TimeFormat.readableTimestamp(this.state.creation_time),
                queueTime: elapsedQueueTime,
                queuePos: this.state.position ? this.state.position : null,
                runTime: elapsedRunTime
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

        makeJobStatusPanel: function () {
            this.statusTableTmpl = Handlebars.compile(JobStatusTableTemplate);
            return this.updateJobStatusPanel();
        },

        makeLogPanel: function () {
            var logPanelTmpl = Handlebars.compile(LogPanelTemplate);
            this.logLineTmpl = Handlebars.compile(LogLineTemplate);
            var $logPanel = $(logPanelTmpl());
            $logPanel.find('#kblog-play').click(function () {
                this.sendLogRequest('latest');
                $logPanel.find('button[id!="kblog-stop"]').prop('disabled', true);
                $logPanel.find('#kblog-stop').prop('disabled', false);
                this.doLogLoop = true;
                this.userEngaged = false;
            }.bind(this));
            $logPanel.find('#kblog-stop').click(function () {
                if (this.looper)
                    clearTimeout(this.looper);
                $logPanel.find('button[id!="kblog-stop"]').prop('disabled', false);
                $logPanel.find('#kblog-stop').prop('disabled', true);
                this.logView.find('#kblog-spinner').hide();
                this.doLogLoop = false;
                this.userEngaged = true;
            }.bind(this));
            $logPanel.find('#kblog-top').click(function () {
                // go to beginning.
                this.userEngaged = true;
                this.sendLogRequest(0);
            }.bind(this));
            $logPanel.find('#kblog-back').click(function () {
                // go back a chunk.
                this.sendLogRequest(Math.max(this.virtualLog.getStart() - this.maxLineRequest, 0));
                this.userEngaged = true;
            }.bind(this));
            $logPanel.find('#kblog-forward').click(function () {
                // go forward a chunk.
                this.sendLogRequest(this.virtualLog.getEnd());
                this.userEngaged = true;
            }.bind(this));
            $logPanel.find('#kblog-bottom').click(function () {
                // go to end.
                this.sendLogRequest('latest');
                this.userEngaged = true;
            }.bind(this));
            $logPanel.find('#kblog-spinner').hide();
            // $logPanel.find('#kblog-panel').scroll(function(e) {
            //     console.log('scrolling happened!');
            // });
            $logPanel.find('#kblog-header')
                .children()
                .tooltip()
                .on('click', function (e) { 
                    $(e.currentTarget).tooltip('hide'); });
            return $logPanel;
        },

        sendLogRequest: function (firstLine) {
            this.logView.find('#kblog-spinner').show();
            this.pendingLogRequest = true;
            this.pendingLogLine = firstLine;
            if (firstLine === 'latest') {
                this.runtime.bus().emit('request-latest-job-log', {
                    jobId: this.jobId,
                    options: {
                        num_lines: this.maxLineRequest
                    }
                });
            } else {
                this.runtime.bus().emit('request-job-log', {
                    jobId: this.jobId,
                    options: {
                        first_line: this.pendingLogLine,
                        num_lines: this.maxLineRequest
                    }
                });
            }
        },

        showLogMessage: function (message) {
            this.logView.find('#kblog-msg').html(message);
        },

        logButton: function(name) {
            return this.logView.find('#kblog-' + name);
        },

        updateLog: function (log) {
            this.pendingLogRequest = false;
            this.logView.find('#kblog-spinner').hide();

            if (log.lines.length === 0) {
                return;
            }

            if (log.latest) {
                this.virtualLog.trimAt('begin');
            }
            this.virtualLog.update(log);
            this.virtualLog.trimAt('auto');

            var vl = this.virtualLog.get();
            this.showLogMessage('Showing lines ' + (vl.start + 1) + ' to ' + (vl.start + vl.items.length) + ' of ' + log.max_lines);

            // render them;
            this.logView.find('#kblog-panel').empty();
            vl.items.forEach(function (line, index) {
                this.logView.find('#kblog-panel').append($(this.logLineTmpl({
                    lineNum: (vl.start + index + 1),
                    log: line
                })));
            }.bind(this));

            // Twiddle the buttons based on where we are in the log view.
            if (vl.start === 0) {
                this.logButton('top').prop('disabled', true);
                this.logButton('back').prop('disabled', true);
            } else {
                this.logButton('top').prop('disabled', false);
                this.logButton('back').prop('disabled', false);
            }

            if (this.doLogLoop) {
                // don't bother looping if we're complete.
                if (this.state.job_state === 'suspend' || this.state.job_state === 'completed' || this.state.job_state === 'canceled') {
                    this.logView.find('#kblog-stop').click();
                    this.logView.find('#kblog-play').prop('disabled', true);
                    this.logView.find('#kblog-stop').prop('disabled', true);
                } else {
                    this.looper = window.setTimeout(function () { 
                        this.sendLogRequest('latest', true); 
                    }.bind(this), this.autoplayInterval);
                }
            }
        }
    });
});