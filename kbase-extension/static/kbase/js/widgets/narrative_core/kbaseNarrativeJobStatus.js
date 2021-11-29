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
    'common/jobCommChannel',
    'common/runtime',
    'common/semaphore',
    'common/cellUtils',
    'util/jobLogViewer',
    'text!kbase/templates/job_status/status_table.html',
    'text!kbase/templates/job_status/header.html',
    'text!kbase/templates/job_status/new_objects.html',
    'bootstrap',
], (
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
    JobComms,
    Runtime,
    Semaphore,
    utils,
    JobLogViewerModule,
    JobStatusTableTemplate,
    HeaderTemplate,
    NewObjectsTemplate,
    Alert
) => {
    'use strict';

    const { JobLogViewer } = JobLogViewerModule,
        jcm = JobComms.JobCommMessages;

    return new KBWidget({
        name: 'kbaseNarrativeJobStatus',
        parent: KBaseAuthenticatedWidget,
        version: '0.0.1',
        options: {
            jobId: null,
            jobInfo: null,
            statusText: null,
        },
        // CONFIG (const)
        statusRequestInterval: 5000, // how often to request job status updates

        init: function (options) {
            this._super(options);
            this.jobId = this.options.jobId;
            this.state = this.options.state;
            this.outputWidgetInfo = this.options.outputWidgetInfo;
            this.widgets = {
                JobLogViewer: new JobLogViewer({ showHistory: true }),
            };

            // expects:
            // name, id, version for appInfo
            this.appInfo = this.options.info;

            const cellNode = this.$elem.closest('.cell').get(0);
            function findCell() {
                const cells = Jupyter.notebook
                    .get_cell_elements()
                    .toArray()
                    .filter((element) => {
                        if (element === cellNode) {
                            return true;
                        }
                        return false;
                    });
                if (cells.length === 1) {
                    return $(cells[0]).data('cell');
                }
                throw new Error(
                    'Cannot find the cell node: ' +
                        JSON.stringify({ cellNode: cellNode, cells: cells })
                );
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
            const cellMeta = this.getCellState();
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

            Semaphore.make()
                .when('comm', 'ready', Config.get('comm_wait_timeout'))
                .then(() => {
                    this.busConnection.listen({
                        channel: {
                            jobId: this.jobId,
                        },
                        key: {
                            type: jcm.RESPONSES.INFO,
                        },
                        handle: function (message) {
                            this.handleJobInfo(message);
                        }.bind(this),
                    });

                    this.busConnection.listen({
                        channel: {
                            jobId: this.jobId,
                        },
                        key: {
                            type: jcm.RESPONSES.STATUS,
                        },
                        handle: function (message) {
                            this.handleJobStatus(message);
                        }.bind(this),
                    });

                    this.channel.emit(jcm.REQUESTS.INFO, {
                        jobId: this.jobId,
                    });

                    this.channel.emit(jcm.REQUESTS.STATUS, {
                        jobId: this.jobId,
                    });
                })
                .catch((err) => {
                    console.error('Jobs Comm channel not available', err);
                });
            return this;
        },

        handleJobInfo: function (info) {
            if (utils.getCellMeta(this.cell, 'kbase.attributes.title') !== info.jobInfo.app_name) {
                const { metadata } = this.cell;
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
            const header = this.makeHeader();
            const body = this.makeBody();
            const statusPanel = this.makeJobStatusPanel();
            this.$elem.append(header);
            body.append(statusPanel);
            this.view = {
                header: header,
                statusPanel: statusPanel,
                body: body,
            };
            this.reportView = this.makeReportPanel();
            this.newDataView = this.makeNewDataView();
            const $tabDiv = $('<div>');
            const $jobLogDiv = $('<div>');
            this.tabController = new KBaseTabs($tabDiv, {
                tabs: [
                    {
                        tab: 'Status',
                        canDelete: false,
                        content: body,
                    },
                    {
                        tab: 'Log',
                        canDelete: false,
                        content: $jobLogDiv,
                        showContentCallback: this.initLogView.bind(this),
                    },
                ],
            });
            this.$elem.append($tabDiv);
            Promise.try(async () => {
                await this.widgets.JobLogViewer.start({
                    node: $jobLogDiv[0],
                    jobId: this.jobId,
                });
            });
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

            if (this.state.status === 'completed') {
                // If job's complete, and we have a report, show that.
                if (
                    this.outputWidgetInfo &&
                    this.outputWidgetInfo.params &&
                    this.outputWidgetInfo.params.report_ref &&
                    !this.showingReport
                ) {
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
                if (
                    this.outputWidgetInfo &&
                    this.outputWidgetInfo.params &&
                    this.outputWidgetInfo.params.report_ref
                ) {
                    this.tabController.addTab({
                        tab: 'New Data Objects',
                        showContentCallback: function () {
                            const { params } = this.outputWidgetInfo;
                            params.showReportText = false;
                            params.showCreatedObjects = true;
                            const $newObjDiv = $('<div>');
                            new KBaseReportView($newObjDiv, params);
                            return $newObjDiv;
                        }.bind(this),
                    });
                }
                // If not, try to guess what we've got?
                else {
                    const results = this.state.result;
                    const refs = this.guessReferences(results);
                    if (refs && refs.length > 0) {
                        const objRefs = [];
                        refs.forEach((ref) => {
                            objRefs.push({ ref: ref });
                        });
                        const newObjTmpl = Handlebars.compile(NewObjectsTemplate);
                        const wsClient = new Workspace(Config.url('workspace'), {
                            token: this.runtime.authToken(),
                        });
                        Promise.resolve(wsClient.get_object_info_new({ objects: objRefs }))
                            .then((objInfo) => {
                                this.tabController.addTab({
                                    tab: 'New Data Objects',
                                    showContentCallback: function () {
                                        const renderedInfo = [];
                                        const $div = $('<div>');
                                        objInfo.forEach((obj) => {
                                            renderedInfo.push({
                                                name: obj[1],
                                                type: obj[2].split('-')[0].split('.')[1],
                                                fullType: obj[2],
                                                // 'description': objsCreated[k].description ? objsCreated[k].description : '',
                                                // 'ws_info': objI[k]
                                            });
                                        });
                                        const $objTable = $(newObjTmpl(renderedInfo));
                                        for (let i = 0; i < objInfo.length; i++) {
                                            const info = objInfo[0];
                                            $objTable
                                                .find('[data-object-name="' + objInfo[i][1] + '"]')
                                                .click((e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    if (Jupyter.narrative.readonly) {
                                                        new Alert({
                                                            type: 'warning',
                                                            title: 'Warning: Read-only Narrative',
                                                            body: 'You cannot insert a data viewer cell into this Narrative because it is read-only',
                                                        });
                                                        return;
                                                    }
                                                    Jupyter.narrative.addViewerCell(info);
                                                });
                                        }
                                        $div.append($objTable);
                                        return $div;
                                    }.bind(this),
                                });
                            })
                            .catch(() => {
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
            const type = Object.prototype.toString.call(obj);
            let ret = [];
            switch (type) {
                case '[object String]':
                    if (obj.match(/^[^/]+\/[^/]+(\/[^/]+)?$/)) {
                        return [obj];
                    }
                    return null;

                case '[object Array]':
                    obj.forEach((elem) => {
                        const refs = this.guessReferences(elem);
                        if (refs) {
                            ret = ret.concat(refs);
                        }
                    });
                    return ret;

                case '[object Object]':
                    Object.keys(obj).forEach((key) => {
                        const refs = this.guessReferences(obj[key]);
                        if (refs) {
                            ret = ret.concat(refs);
                        }
                    });
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
                        const { params } = this.outputWidgetInfo;
                        params.showReportText = true;
                        params.showCreatedObjects = false;
                        const $reportDiv = $('<div>');
                        new KBaseReportView($reportDiv, params);
                        return $reportDiv;
                    }.bind(this),
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
            const tmpl = Handlebars.compile(HeaderTemplate);
            return $(tmpl(this.appInfo));
        },

        getCellState: function () {
            const { metadata } = this.cell;
            // This is altogether the wrong place to do this sort of
            // cell repair...
            if (metadata.kbase) {
                if (metadata.kbase.state) {
                    // Copied from the codeCell extension
                    const newKbaseMeta = {
                        type: 'code',
                        attributes: {
                            id: StringUtil.uuid(),
                            status: 'new',
                            created: new Date().toGMTString(),
                            lastLoaded: new Date().toGMTString(),
                            icon: 'code',
                            title: 'Import Job Cell',
                            subtitle: '',
                        },
                        codeCell: {
                            'user-settings': {
                                showCodeInputArea: true,
                            },
                            jobInfo: {
                                jobId: metadata.kbase.jobId,
                                state: metadata.kbase.state,
                            },
                        },
                    };
                    // fix up the metadata.
                    // The old metadata just wrote over the kbase property
                    // kbase.jobId
                    // kbase.state
                    // Originally it was set up as an output cell, but
                    // did not match an output cell metadata, so would fail
                    // we need to fix that here...
                    this.cell.metadata.kbase = newKbaseMeta;
                    // eslint-disable-next-line no-self-assign
                    this.cell.metadata = this.cell.metadata;
                }
                return metadata.kbase;
            } else {
                return null;
            }
        },

        setCellState: function () {
            const { metadata } = this.cell;
            metadata.kbase.codeCell.jobInfo = {
                jobId: this.jobId,
                state: this.state,
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
            switch (message.jobState.status) {
                case 'terminated':
                case 'completed':
                    if (this.requestedUpdates) {
                        this.requestedUpdates = false;
                        this.channel.emit(jcm.REQUESTS.STOP_UPDATE, {
                            jobId: this.jobId,
                        });
                    }
                    // TODO: we need to remove all of the job listeners at this point, but
                    // the busConnection also has the job log listeners, which may be used at any time.
                    // What we need to do is move these into separate widgets which can be stopped and started
                    // as the tabs are activated, and control their own bus connections.
                    // this.busConnection.stop();
                    break;
                case 'queued':
                case 'running':
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
            this.channel.emit(jcm.REQUESTS.INFO, {
                jobId: this.jobId,
            });
        },

        requestJobStatus: function () {
            window.setTimeout(() => {
                this.channel.emit(jcm.REQUESTS.STATUS, {
                    jobId: this.jobId,
                });
            }, this.statusRequestInterval);
        },

        showError: function (message) {
            this.$elem.append(message);
        },

        updateJobStatusPanel: function () {
            let elapsedQueueTime;
            let elapsedRunTime;

            if (!this.state.creation_time) {
                elapsedQueueTime = '-';
                elapsedRunTime = '-';
            } else {
                if (!this.state.exec_start_time) {
                    elapsedQueueTime = TimeFormat.calcTimeDifference(
                        this.state.creation_time,
                        new Date().getTime()
                    );
                    elapsedRunTime = '-';
                } else {
                    elapsedQueueTime = TimeFormat.calcTimeDifference(
                        this.state.creation_time,
                        this.state.exec_start_time
                    );
                    if (!this.state.finish_time) {
                        //
                        elapsedRunTime = TimeFormat.calcTimeDifference(
                            this.state.exec_start_time,
                            new Date().getTime()
                        );
                    } else {
                        elapsedRunTime = TimeFormat.calcTimeDifference(
                            this.state.exec_start_time,
                            this.state.finish_time
                        );
                    }
                }
            }

            const info = {
                jobId: this.jobId,
                status: this.state.status === 'suspend' ? 'error' : this.state.status,
                creationTime: TimeFormat.readableTimestamp(this.state.creation_time),
                queueTime: elapsedQueueTime,
                queuePos: this.state.position ? this.state.position : null,
                runTime: elapsedRunTime,
            };

            if (this.state.exec_start_time) {
                info.execStartTime = TimeFormat.readableTimestamp(this.state.exec_start_time);
            }
            if (this.state.finish_time) {
                info.execEndTime = TimeFormat.readableTimestamp(this.state.finish_time);
                info.execRunTime = TimeFormat.calcTimeDifference(
                    this.state.finish_time,
                    this.state.exec_start_time
                );
            }

            return $(this.statusTableTmpl(info));
        },

        makeJobStatusPanel: function () {
            this.statusTableTmpl = Handlebars.compile(JobStatusTableTemplate);
            return this.updateJobStatusPanel();
        },
    });
});
