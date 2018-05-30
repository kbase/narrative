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
    'util/string',
    'kb_service/client/workspace',
    'kb_service/utils',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'kbaseReportView',
    'common/runtime',
    'common/semaphore',
    'common/utils',
    'nbextensions/appCell2/widgets/tabs/jobLogViewer',
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
    StringUtil,
    Workspace,
    ServiceUtils,
    KBaseAuthenticatedWidget,
    KBaseTabs,
    KBaseReportView,
    Runtime,
    Semaphore,
    utils,
    JobViewer,
    JobStatusTableTemplate,
    HeaderTemplate,
    LogPanelTemplate,
    LogLineTemplate,
    NewObjectsTemplate,
    Alert
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
        // CONFIG (const)
        statusRequestInterval: 5000, // how often to request job status updates

        init: function (options) {
            this._super(options);
            this.jobId = this.options.jobId;
            this.state = this.options.state;
            this.outputWidgetInfo = this.options.outputWidgetInfo;
            this.widgets = {};
            this.widgets.jobViewer = JobViewer.make({});

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
            //raw object
            var cellMeta = this.getCellState();
            // When this is initially inserted into the Narrative, the cell metadata will not be fully populated.
            // In this case, the job state that is passed to the widget will be used, otherwise the job state
            // stored in the metadata will be used.
            if (utils.getCellMeta(this.cell, 'kbase.codeCell.jobInfo.state.jobId') === this.jobId) {
                this.state = utils.getCellMeta(this.cell, 'kbase.codeCell.jobInfo.state');
            }

            // if (cellMeta && cellMeta.codeCell && cellMeta.codeCell && cellMeta.codeCell.jobInfo.state.jobId === this.jobId) {
            //     // use this and not the state input.
            //     this.state = cellMeta.codeCell.jobInfo.state;
            // }
            if (cellMeta && cellMeta.attributes && cellMeta.attributes.id) {
                this.cellId = cellMeta.attributes.id;
            } else {
                this.cellId = StringUtil.uuid();
            }

            this.busConnection = this.runtime.bus().connect();
            this.channel = this.busConnection.channel('default');


            // TODO: can we introduce a stop method for kbwidget?
            // We need to disconnect these listeners when this widget is removed.

            // render up the panel's view layer.
            this.initializeView();
            this.updateView();

            Semaphore.make().when('comm', 'ready', Config.get('comm_wait_timeout'))
                .then(function () {
                    this.busConnection.listen({
                        channel: {
                            jobId: this.jobId
                        },
                        key: {
                            type: 'job-info'
                        },
                        handle: function (message) {
                            this.handleJobInfo(message);
                        }.bind(this)
                    });

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
                            type: 'job-does-not-exist'
                        },
                        handle: function (message) {
                            // this.handleJobStatus(message);
                            console.warn('job does not exist? ', message);
                        }.bind(this)
                    });

                    this.channel.emit('request-job-info', {
                        jobId: this.jobId
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

        handleJobInfo: function (info) {
            if (utils.getCellMeta(this.cell, 'kbase.attributes.title') !== info.jobInfo.app_name) {
                var metadata = this.cell.metadata;
                if (metadata.kbase && metadata.kbase.attributes) {
                    metadata.kbase.attributes.title = info.jobInfo.app_name;
                    metadata.kbase.attributes.subtitle = 'App Status';
                    metadata.kbase.attributes.icon = 'code';
                }
                this.cell.metadata = metadata;
            }
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
            this.reportView = this.makeReportPanel();
            this.newDataView = this.makeNewDataView();
            var $tabDiv = $('<div>');
            var $jobLogDiv = $('<div>');
            this.tabController = new KBaseTabs($tabDiv, {
                tabs: [{
                    tab: 'Status',
                    canDelete: false,
                    content: body,
                },
                {
                    tab: 'Log',
                    canDelete: false,
                    content: $jobLogDiv,
                    showContentCallback: this.initLogView.bind(this)
                }
                ]
            });
            this.widgets.jobViewer.start({
                node: $jobLogDiv[0],
                jobId: this.jobId
            });
            this.$elem.append($tabDiv);
        },

        initLogView: function () {
            // only initialize on first view.
            // essentially, click the 'play' button.
            this.logView.find('#kblog-bottom').trigger('click');
            return this.logView;
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
                                            $objTable.find('[data-object-name="' + objInfo[i][1] + '"]').click(function (e) {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                if (Jupyter.narrative.readonly) {
                                                    new Alert({
                                                        type: 'warning',
                                                        title: 'Warning: Read-only Narrative',
                                                        body: 'You cannot insert a data viewer cell into this Narrative because it is read-only'
                                                    });
                                                    return;
                                                }
                                                Jupyter.narrative.addViewerCell(info);
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
            // This is altogether the wrong place to do this sort of
            // cell repair...
            if (metadata.kbase) {
                if (metadata.kbase.state) {
                    // Copied from the codeCell extension
                    var newKbaseMeta = {
                        type: 'code',
                        attributes: {
                            id: StringUtil.uuid(),
                            status: 'new',
                            created: new Date().toGMTString(),
                            lastLoaded: new Date().toGMTString(),
                            icon: 'code',
                            title: 'Import Job Cell',
                            subtitle: ''
                        },
                        codeCell: {
                            userSettings: {
                                showCodeInputArea: true
                            },
                            jobInfo: {
                                jobId: metadata.kbase.jobId,
                                state: metadata.kbase.state
                            }
                        }
                    };
                        // fix up the metadata.
                        // The old metadata just wrote over the kbase property
                        // kbase.jobId
                        // kbase.state
                        // Originally it was set up as an output cell, but
                        // did not match an output cell metadata, so would fail
                        // we need to fix that here...
                    this.cell.metadata.kbase = newKbaseMeta;
                    this.cell.metadata = this.cell.metadata;
                }
                return metadata.kbase;
            } else {
                return null;
            }
        },

        setCellState: function () {
            var metadata = this.cell.metadata;
            metadata.kbase.codeCell.jobInfo = {
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
                if (this.requestedUpdates) {
                    this.requestedUpdates = false;
                    this.channel.emit('request-job-completion', {
                        jobId: this.jobId
                    });
                }
                // TODO: we need to remove all of the job listeners at this point, but
                // the busConnection also has the job log listeners, which may be used at any time.
                // What we need to do is move these into separate widgets which can be stopped and started
                // as the tabs are activated, and control their own bus connections.
                // this.busConnection.stop();
                break;
            case 'queued':
                this.requestedUpdates = true;
                this.requestJobStatus();
                break;
            case 'in-progress':
                this.requestedUpdates = true;
                this.requestJobStatus();
                break;
            }

            this.state = message.jobState;
            this.outputWidgetInfo = message.outputWidgetInfo;
            this.setCellState();
            this.updateView();
        },

        requestJobInfo: function () {
            this.channel.emit('request-job-info', {
                jobId: this.jobId
            });
        },

        requestJobStatus: function () {
            window.setTimeout(function () {
                this.channel.emit('request-job-status', {
                    jobId: this.jobId
                });
            }.bind(this), this.statusRequestInterval);
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
                status: this.state.job_state === 'suspend' ? 'error' : this.state.job_state,
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
        }
    });
});
