/*global define*/
/*jslint white:true,browser:true*/

define([
    'uuid',
    'jquery',
    'common/props',
    'common/utils',
    'common/jobs',
    'common/ui',
    'common/runtime',
    'common/events',
    'common/format',
    'kb_common/html',
    'kb_service/client/workspace',
    './jobLogViewer'
], function(Uuid, $, Props, utils, Jobs, UI, Runtime, Events, format, html, Workspace, LogViewer) {
    'use strict';

    var t = html.tag,
        tabsId,
        div = t('div'),
        span = t('span'),
        table = t('table'),
        tr = t('tr'),
        td = t('td'),
        th = t('th'),
        textarea = t('textarea'),
        ul = t('ul'),
        li = t('li');

    function factory(config) {
        var api,
            runtime = Runtime.make(),
            bus = runtime.bus().makeChannelBus({ description: 'Bus for exec widget' }),
            cellBus = config.bus,
            container,
            listeners = [],
            model,
            ui,
            widgets = {},
            execStateListeners = {};

        // Sugar

        function on(event, handler) {
            listeners.push(cellBus.on(event, handler));
        }

        // RENDER

        // VIEW BUILDING

        function renderJobReport() {
            return ui.buildPanel({
                title: 'Job Report',
                name: 'job-report',
                hidden: false,
                type: 'primary',
                classes: 'kb-panel-light',
                body: table({ class: 'table table-striped' }, [
                    tr([th('Objects Created'), td({ dataElement: 'objects-created' })]),
                    tr([th('Message'), td({ dataElement: 'message' })]),
                    tr([th('Warnings'), td({ dataElement: 'warnings' })])
                ])
            });
        }

        function renderJobResult() {
            return ui.buildPanel({
                title: 'Job Result',
                name: 'job-result',
                hidden: false,
                type: 'primary',
                classes: 'kb-panel-light',
                body: div({ style: { fontFamily: 'monospace', whiteSpace: 'pre' }, dataElement: 'content' })
            });
        }

        function renderJobResultIcon() {
            var result = model.getItem('runState.success.result');
            if (result) {
                return ui.buildIcon({
                    name: 'thumbs-up',
                    color: 'green'
                });
            }

            var error = model.getItem('runState.error');
            if (error) {
                var x = ui.buildIcon({
                    name: 'thumbs-down',
                    color: 'red'
                });
                return x;
            }
        }

        function renderJobLog() {
            return ui.buildPanel({
                // title: 'Job Log',
                name: 'job-log',
                hidden: false,
                type: 'primary',
                classes: 'kb-panel-light',
                xbody: [
                    textarea({ class: 'form-control', dataElement: 'logs' })
                ],
                body: div({ dataElement: 'mount' })
            });
        }

        /*
         * The execution status, or summary, area ctonains basic stats on a
         * running job, indication the current state, the time running in the
         * current and previous stats, and whether or not there is a final
         * result.
         *
         * This rendered content serves as a placeholder for the run status
         * as it is updated. See showExecStatus() for that.
         *
         */
        function renderExecStats() {
            var labelStyle = {
                    textAlign: 'right',
                    border: '1px transparent solid',
                    padding: '4px'
                },
                dataStyle = {
                    border: '1px silver solid',
                    padding: '4px',
                    display: 'inline-block',
                    minWidth: '20px',
                    backgroundColor: '#EEE',
                    color: '#000'
                };
            return ui.buildPanel({
                // title: 'Execution Status',
                name: 'execStatus',
                hidden: false,
                type: 'primary',
                classes: ['kb-panel-light'],
                body: div({ style: { paddingTop: '6px' } }, [
                    div({ class: 'row', dataElement: 'last-updated' }, [
                        div({ class: 'col-md-2', style: labelStyle }, span({ dataElement: 'label' }, 'Last updated')),
                        div({ class: 'col-md-2', style: dataStyle }, span({ dataElement: 'elapsed', class: 'kb-elapsed-time' })),
                        div({ class: 'col-md-2', style: dataStyle }, span({ dataElement: 'time' }))
                    ]),
                    //                    div({class: 'row', dataElement: 'launch'}, [
                    //                        div({class: 'col-md-2', style: labelStyle}, span({dataElement: 'label'}, 'Launch')),
                    //                        div({class: 'col-md-2', style: dataStyle}, span({dataElement: 'elapsed', class: 'kb-elapsed-time'}))
                    //                    ]),
                    div({ class: 'row', dataElement: 'queue' }, [
                        div({ class: 'col-md-2', style: labelStyle }, span({ dataElement: 'label' }, 'Queue')),
                        div({ class: 'col-md-2', style: dataStyle }, span({ dataElement: 'elapsed', class: 'kb-elapsed-time' })),
                        div({ class: 'col-md-2', style: labelStyle }, 'Position'),
                        div({ class: 'col-md-2', style: dataStyle }, span({ dataElement: 'position' }))
                    ]),
                    div({ class: 'row', dataElement: 'run' }, [
                        div({ class: 'col-md-2', style: labelStyle }, span({ dataElement: 'label' }, 'Run')),
                        div({ class: 'col-md-2', style: dataStyle }, span({ dataElement: 'elapsed', class: 'kb-elapsed-time' }))
                    ]),
                    div({ class: 'row', dataElement: 'finish' }, [
                        div({ class: 'col-md-2', style: labelStyle }, 'Finish'),
                        div({ class: 'col-md-2', style: dataStyle }, span({ dataElement: 'state' })),
                        div({ class: 'col-md-2', style: labelStyle }, 'When'),
                        div({ class: 'col-md-2', style: dataStyle }, span({ dataElement: 'finishedAt' }))
                    ])
                ])
            });
        }

        function showExecStats() {
            var state = model.getItem('runState');

            if (!state) {
                return;
            }

            // UPDATED
            if (model.getItem('runStateLastUpdatedTime')) {
                (function() {
                    var now = new Date().getTime(),
                        then = model.getItem('runStateLastUpdatedTime', now);
                    ui.setContent(['execStatus', 'last-updated', 'elapsed'], format.elapsedTime(now - then));
                    ui.setContent(['execStatus', 'last-updated', 'time'], format.niceElapsedTime(then));
                }());
            }

            // LAUNCH
            //            if (state.elapsedLaunchTime) {
            //                (function () {
            //                    var label;
            //                    if (state.temporalState === 'launching') {
            //                        label = 'Launching';
            //                        ui.addClass(['execStatus', 'launch', 'elapsed'], '-active');
            //                    } else {
            //                        label = 'Launched in';
            //                        ui.removeClass(['execStatus', 'launch', 'elapsed'], '-active');
            //                    }
            //                    ui.setContent(['execStatus', 'launch', 'label'], label);
            //                    ui.setContent(['execStatus', 'launch', 'elapsed'], format.elapsedTime(state.elapsedLaunchTime) || '');
            //                }());
            //            } else {
            //                ui.setContent(['execStatus', 'launch', 'elapsed'], '-');
            //            }

            // QUEUE
            if (state.elapsedQueueTime) {
                (function() {
                    var label;
                    if (state.elapsedRunTime) {
                        ui.removeClass(['execStatus', 'queue', 'elapsed'], '-active');
                        label = 'Queued for';
                    } else {
                        ui.addClass(['execStatus', 'queue', 'elapsed'], '-active');
                        label = 'In Queue';
                    }
                    if (state.jobState.position !== undefined) {
                        ui.setContent(['execStatus', 'queue', 'position'], state.jobState.position);
                    } else {
                        ui.setContent(['execStatus', 'queue', 'position'], '-');
                    }
                    ui.setContent(['execStatus', 'queue', 'label'], label);
                    ui.setContent(['execStatus', 'queue', 'elapsed'], format.elapsedTime(state.elapsedQueueTime) || '');
                }());
            } else {
                ui.setContent(['execStatus', 'queue', 'position'], '-');
                ui.setContent(['execStatus', 'queue', 'elapsed'], '-');
            }

            // RUN
            if (state.elapsedRunTime) {
                (function() {
                    var label;
                    if (state.completedTime) {
                        ui.removeClass(['execStatus', 'run', 'elapsed'], '-active');
                        label = 'Ran In';
                    } else {
                        ui.addClass(['execStatus', 'run', 'elapsed'], '-active');
                        label = 'Running For';
                    }
                    ui.setContent(['execStatus', 'run', 'label'], label);
                    ui.setContent(['execStatus', 'run', 'elapsed'], format.elapsedTime(state.elapsedRunTime) || '');
                }());
            } else {
                ui.setContent(['execStatus', 'run', 'elapsed'], '-');
            }

            if (state.temporalState === 'finished') {
                switch (state.executionState) {
                    case 'success':
                        ui.setContent(['execStatus', 'finish', 'state'], 'success');
                        ui.setContent(['execStatus', 'finish', 'finishedAt'], format.niceElapsedTime(state.completedTime));
                        // ui.showElement('job-report');
                        // showJobReport();
                        // showJobResult();
                        break;
                    case 'error':
                        if (state.completedTime) {
                            ui.setContent(['execStatus', 'finish', 'finishedAt'], format.niceElapsedTime(state.completedTime));
                        }
                        ui.setContent(['execStatus', 'finish', 'state'], 'error');
                        ui.showElement(['run-error']);
                        ui.setContent(['run-error', 'location'], state.error.location);
                        ui.setContent(['run-error', 'type'], state.error.type);
                        ui.setContent(['run-error', 'message'], state.error.message);
                        ui.setContent(['run-error', 'detail'], state.error.detail);
                        break;
                    case 'canceled':
                        ui.setContent(['execStatus', 'finish', 'state'], 'canceled');
                        ui.setContent(['execStatus', 'finish', 'finishedAt'], format.niceElapsedTime(state.completedTime));
                        break;
                    default:
                        ui.setContent(['execStatus', 'finish', 'state'], '-');
                        ui.setContent(['execStatus', 'finish', 'finishedAt'], '-');
                }
            } else {
                ui.setContent(['execStatus', 'finish', 'state'], '-');
                ui.setContent(['execStatus', 'finish', 'finishedAt'], '-');
            }
        }

        /*
         * The job details view essentially showsthe current job state, with little or
         * no reformatting or interpretation.
         *
         * It is updated by showJobDetails(), which is itself driven by
         * job events.
         */
        function renderJobDetails() {
            return ui.buildPanel({
                // title: 'Job Details',
                name: 'job-details',
                hidden: false,
                type: 'primary',
                classes: ['kb-panel-light'],
                body: [
                    table({ class: 'table table-striped' }, [
                        tr([th('Job Id'), td({ dataElement: 'id' })]),
                        tr([th('Status'), td({ dataElement: 'status' })]),
                        tr([th('Submitted'), td({ dataElement: 'submitted' })]),
                        tr([th('Started'), td({ dataElement: 'started' })]),
                        tr([th('Completed'), td({ dataElement: 'completed' })])
                    ])
                ]
            });
        }

        function updateJobDetails() {
            var jobState = model.getItem('jobState'),
                details = {
                    id: jobState.job_id,
                    status: jobState.job_state,
                    submitted: format.niceTime(jobState.creation_time ? new Date(jobState.creation_time) : null),
                    started: format.niceTime(jobState.exec_start_time ? new Date(jobState.exec_start_time) : null),
                    completed: format.niceTime(jobState.finish_time ? new Date(jobState.finish_time) : null),
                };
            model.setItem('jobDetails', details);
        }

        function showJobDetails() {
            //if (showToggleElement('job-details')) {
            updateJobDetails();
            var details = model.getItem('jobDetails');
            if (details) {
                Object.keys(details).forEach(function(key) {
                    var value = details[key],
                        el = ui.getElement(['job-details', key]);
                    if (el) {
                        el.innerHTML = value || '';
                    }
                });
            }
            // }
        }

        function renderRawJobState() {
            return ui.buildPanel({
                name: 'raw-job-state',
                hidden: false,
                type: 'primary',
                classes: ['kb-panel-light'],
                body: div({ dataElement: 'content', style: { whiteSpace: 'pre', fontFamily: 'monospace' } })
            });
        }

        function showRawJobState() {
            var content = JSON.stringify(model.getItem('jobState'), null, 3);
            ui.setContent('raw-job-state.content', content);
        }

        // VIEW UPDATERS


        function showJobReport() {
            var report = model.getItem('jobReport'),
                objectsCreated, warnings;
            if (!report) {
                return;
            }

            if (report.objects_created.length === 0) {
                objectsCreated = 'no objects created';
            } else {
                objectsCreated = ul(report.objects_created.map(function(object) {
                    return li(object);
                }).join('\n'));
            }
            ui.getElement(['job-report', 'objects-created']).innerHTML = objectsCreated;

            ui.getElement(['job-report', 'message']).innerHTML = report.text_message || ' no message';

            if (report.warnings.length === 0) {
                warnings = 'no warnings';
            } else {
                warnings = ul(report.warnings.map(function(object) {
                    return li(object);
                }).join('\n'));
            }
            ui.getElement(['job-report', 'warnings']).innerHTML = warnings;
        }

        function showJobSuccess(args) {
            var result = model.getItem('runState.success.result');
            if (!result) {
                return;
            }

            args.node.innerHTML = ui.buildPanel({
                title: 'Result Value',
                classes: ['kb-panel-light'],
                body: div({ dataElement: 'content' })
            });

            return ui.jsonBlockWidget.make().start({
                node: args.node.querySelector('[data-element="content"]'),
                obj: result
            });
        }

        function renderJobError(args) {
            var error = model.getItem('runState.error');

            if (!error) {
                return;
            }

            // TODO: show error style in the tab and tab panel

            var content = ui.buildPanel({
                title: 'Error',
                type: 'danger',
                classes: ['kb-panel-light'],
                body: table({ class: 'table table-striped', style: { tableLayout: 'fixed' } }, [
                    tr([th({ style: { width: '15%' } }, 'Error in'), td({ style: { width: '85%' } }, error.location)]),
                    tr([th('Type'), td(error.type)]),
                    tr([th('Message'), td(error.message)]),
                    tr([th('Detail'), td([div({ style: { overflowX: 'scroll', whiteSpace: 'pre' } }, error.detail)])])
                ])
            });

            args.node.innerHTML = content;
        }

        /*
         * When the job is finished, we show the final result through this
         * mini widget.
         */

        function showJobResult(args) {
            var success = model.getItem('runState.success.result'),
                error = model.getItem('runState.error');
            if (success) {
                showJobSuccess(args);
            } else if (error) {
                renderJobError(args);
            } else {
                args.node.innerHTML = ui.buildPanel({
                    title: 'Unfinished',
                    classes: ['kb-panel-light'],
                    body: 'Job not finished yet'
                });
            }
        }



        // Job Logs

        function showJobLog(args) {
            var logViewer = LogViewer.make();
            widgets.logViewer = logViewer;
            logViewer.start()
                .then(function() {
                    logViewer.bus.emit('run', {
                        node: args.node,
                        jobId: model.getItem('runState.jobId')
                    });
                });
        }

        function hideJobLog(args) {
            if (widgets.logViewer) {
                widgets.logViewer.bus.emit('stop');
                delete widgets.logViewer;
            }
            args.node.innerHTML = '';
        }

        /*
         * These functions will be called when a run or job event comes in (or the app is started with initial job state).
         * Add and remove listeners as tabs or other widgets become visible.
         * A map to make adding and removing easier...
         */

        function renderSummaryWidget() {
            return div({
                style: {
                    border: '1px silver solid',
                    padding: '4px'
                }
            }, [
                'summary widget here'
            ]);
        }


        function render() {
            tabsId = html.genId();
            var events = Events.make({ node: container }),
                tabs = ui.buildTabs({
                    id: tabsId,
                    fade: true,
                    style: {
                        padding: '10px 0 0 0'
                    },
                    tabs: [{
                            name: 'stats',
                            label: 'Stats',
                            content: renderExecStats(),
                            icon: 'clock-o',
                            events: [{
                                    type: 'shown',
                                    handler: function(e) {
                                        execStateListeners.stats = showExecStats;
                                        showExecState();
                                    }
                                },
                                {
                                    type: 'hidden',
                                    handler: function(e) {
                                        delete execStateListeners.stats;
                                    }
                                }
                            ]
                        },
                        ui.ifAdvanced(function() {
                            return {
                                label: 'Details',
                                content: renderJobDetails(),
                                events: [{
                                        type: 'shown',
                                        handler: function(e) {
                                            execStateListeners.detail = showJobDetails;
                                            showExecState();
                                        }
                                    },
                                    {
                                        type: 'hidden',
                                        handler: function(e) {
                                            delete execStateListeners.detail;
                                        }
                                    }
                                ]
                            };
                        }),
                        ui.ifAdvanced(function() {
                            return {
                                label: 'Raw',
                                content: renderRawJobState(),
                                events: [{
                                        type: 'shown',
                                        handler: function(e) {
                                            execStateListeners.detail = showRawJobState;
                                            showExecState();
                                        }
                                    },
                                    {
                                        type: 'hidden',
                                        handler: function(e) {
                                            delete execStateListeners.detail;
                                        }
                                    }
                                ]
                            };
                        }),
                        {
                            label: 'Log',
                            content: renderJobLog(),
                            icon: 'list',
                            events: [{
                                    type: 'shown',
                                    handler: function(e) {
                                        var panelId = e.target.getAttribute('data-panel-id'),
                                            panel = document.getElementById(panelId);
                                        showJobLog({ node: panel });
                                        // execStateListeners.log = showJobLog;
                                        // showExecState();
                                    }
                                },
                                {
                                    type: 'hidden',
                                    handler: function(e) {
                                        var panelId = e.target.getAttribute('data-panel-id'),
                                            panel = document.getElementById(panelId);
                                        hideJobLog({ node: panel });
                                        // delete execStateListeners.log;
                                    }
                                }
                            ]
                        },
                        {
                            label: 'Result',
                            name: 'result',
                            content: renderJobResult(),
                            // icon: renderJobResultIcon(),
                            icon: 'question',
                            events: [{
                                    type: 'shown',
                                    handler: function(e) {
                                        var panelId = e.target.getAttribute('data-panel-id'),
                                            panel = document.getElementById(panelId);
                                        execStateListeners.result = function() {
                                            showJobResult({ node: panel });
                                        };
                                        showJobResult({ node: panel });
                                    }
                                },
                                {
                                    type: 'hidden',
                                    handler: function(e) {
                                        var panelId = e.target.getAttribute('data-panel-id'),
                                            panel = document.getElementById(panelId);
                                        panel.innerHTML = '';
                                        delete execStateListeners.result;
                                    }
                                }
                            ]
                        }
                    ]
                });

            container.innerHTML = div({}, [
                //div({style: {marginBottom: '4px'}}, [
                //    renderSummaryWidget()
                //]),
                tabs.content
            ]);
            tabs.events.forEach(function(event) {
                events.addEvent(event);
            });
            events.attachEvents();
            $('#' + tabs.map.stats).tab('show');
        }

        // DATA FETCH

        // TODO: corral in the async requests! We don't want them to overlap,
        // that's for sure.
        function updateJobLog(data) {
            Jobs.getLogData(data.jobId, 0)
                .catch(function(err) {
                    console.error('Error getting log lines', err);
                    ui.getElement(['job-log', 'logs']).innerHTML = 'ERROR:\n' +
                        err.remoteStacktrace.join('\n');
                });
        }


        // DATA



        // VIEW UPDATE

        /*
         * Okay, the job report is buried in the job state.
         * In the job state is a "step_job_ids" a holdover from the app days
         * In it is one property, which represents the job for this app.
         * The key matches the outputs found in the step_outputs property.
         * The value for that the step_outputs property is a string, but it is a
         * tricky string, for it is a JSON string. We parse that to get the
         * final project ... the report_ref, which we can use to get the report!
         *
         */
        //        function updateJobReport(job) {
        //            /*
        //             * If the job has not completed, there will be not outputs, so we
        //             * can just bail.
        //             */
        //            if (!job.state.step_outputs || Object.keys(job.state.step_outputs).length === 0) {
        //                return;
        //            }
        //
        //            var stepJobIds = job.state.step_job_ids,
        //                stepKey = Object.keys(stepJobIds)[0],
        //                stepOutput = JSON.parse(job.state.step_outputs[stepKey]),
        //                reportRef = stepOutput[0].report_ref,
        //                workspace = new Workspace(runtime.config('services.workspace.url'), {
        //                    token: runtime.authToken()
        //                });
        //
        //            return workspace.get_objects([{
        //                    ref: reportRef
        //                }])
        //                .then(function (result) {
        //                    if (!result[0]) {
        //                        return;
        //                    }
        //                    var report = result[0].data;
        //                    // Store it in the metadata.
        //                    model.setItem('jobReport', JSON.parse(JSON.stringify(report)));
        //                })
        //                .catch(function (err) {
        //                    console.error('Error getting report', err);
        //                });
        //        }

        function getJobReport(reportRef) {
            var workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken()
            });

            return workspace.get_objects([{
                    ref: reportRef
                }])
                .then(function(result) {
                    if (!result[0]) {
                        return;
                    }
                    var report = result[0].data;
                    // Store it in the metadata.
                    return JSON.parse(JSON.stringify(report));
                })
                .catch(function(err) {
                    console.error('Error getting report', err);
                });
        }

        /*
         * Updates the job details model view. This model view is essentially
         * a parallel of the raw job state, but reformatted for display.
         */



        // RUN STATE UPDATERS

        /*
         * The "run state" is the combined state of all possible execution
         * states, including initial button click, back end launch management,
         * and actual job state.
         */

        function updateRunStateFromLaunchState(launchState) {
            var temporalState, executionState,
                error, now = new Date().getTime(),
                launchStartTime = launchState.startTime,
                elapsed = now - launchStartTime,
                newRunState,
                oldRunState = model.getItem('runState', {});

            switch (launchState.event) {
                case 'launched_job':
                    temporalState = 'launching';
                    executionState = 'processing';
                    break;
                case 'error':
                    temporalState = 'launching';
                    executionState = 'error';
                    error = {
                        location: 'launching',
                        type: launchState.error.type,
                        message: launchState.error.message,
                        detail: launchState.error.detail
                    };
                    break;
                default:
                    throw new Error('Invalid launch state ' + launchState.event);
            }

            newRunState = {
                runId: launchState.runId,
                jobId: launchState.jobId,
                temporalState: temporalState,
                executionState: executionState,
                jobState: null,
                elapsedLaunchTime: elapsed,
                elapsedQueueTime: null,
                elapsedRunTime: null,
                completedTime: null,
                error: error,
                success: null
            };

            model.setItem('runState', newRunState);
        }

        function updateRunStateFromJobState(source) {
            var jobState = model.getItem('jobState'),
                runState = model.getItem('runState', {}),
                now = new Date().getTime(),
                newRunState,
                temporalState,
                submitTime, startTime, completedTime,
                elapsedQueueTime, elapsedRunTime,
                position;


            if (!jobState) {
                return;
            }

            /*
             * All jobs can exist in three temporal zones which we can define
             * in the lifecycle of job execution.
             * - preparation: the job has not been processed yet, it is still being
             *     analyzed by the app job manager.
             * - queued: the job has been prepared and is queued for execution
             * - running: the job is currently executing
             * - completed: the job has completed
             * - error: the job has completed with error
             *
             * In addition, each of these states is associated with a set of
             * outcomes, either success or error. That is, they may progress from
             *   preparation -> queued -> running -> completed -> end
             * or any one may terminate with an error.
             *   preparation -> error
             *   preparation -> queued -> error
             *   preparation -> queued -> running -> error
             *
             * If an error is encountered, it places the job into the 'suspended' state
             * and sets an error message in a specific property (not described here, it is convoluted.)
             *
             * If an either queued, running, or completed states are entered a timestamp
             * is set, that is the signal we have that the state has been entered.
             * In the error state no timestamp has been set:
             *
             * TODO: we should request an error timestamp, as well as
             * an error structure (e.g. id, message, stacktrace, additional info)
             *
             * In the completed state as well there is a job report (not described here at the moment).
             *
             */

            /*
             * From the NJSWrapper spec:
             *
             job_id - id of job running app
             finished - indicates whether job is done (including error cases) or not,
             if the value is true then either of 'returned_data' or 'detailed_error'
             should be defined;
             ujs_url - url of UserAndJobState service used by job service
             status - tuple returned by UserAndJobState.get_job_status app
             result - keeps exact copy of what original server app puts
             in result block of JSON RPC response;
             error - keeps exact copy of what original server app puts
             in error block of JSON RPC response;
             job_state - 'queued', 'in-progress', 'completed', or 'suspend';
             position - position of the job in execution waiting queue;
             creation_time, exec_start_time and finish_time - time moments of submission, execution
             start and finish events in milliseconds since Unix Epoch.

             typedef structure {
             string job_id;
             boolean finished;
             string ujs_url;
             UnspecifiedObject status;
             UnspecifiedObject result;
             JsonRpcError error;
             string job_state;
             int position;
             int creation_time;
             int exec_start_time;
             int finish_time;
             } JobState;
             */


            /*
             * Determine temrporal state based on timestamps left behind.
             */
            if (jobState.creation_time) {
                submitTime = jobState.creation_time;

                // Need to adjust the launch time.
                //var launchState = model.getItem('launchState');
                //if (launchState && launchState.startTime) {
                //    runState.elapsedLaunchTime = submitTime - launchState.startTime;
                //} else {
                //    console.warn('STRANGE - no launchState', launchState);
                // }

                position = jobState.position;
                if (jobState.exec_start_time) {
                    startTime = jobState.exec_start_time;
                    elapsedQueueTime = startTime - submitTime;
                    if (jobState.finish_time) {
                        completedTime = jobState.finish_time;
                        elapsedRunTime = completedTime - startTime;
                    } else {
                        elapsedRunTime = now - startTime;
                        // we've been  using running, but maybe we should switch.
                        // temporalState = 'running';
                    }
                } else {
                    if (jobState.finish_time) {
                        completedTime = jobState.finish_time;
                        elapsedQueueTime = completedTime - submitTime;
                        // temporalState = 'completed';
                    } else {
                        elapsedQueueTime = now - submitTime;
                    }
                }
            } else {
                console.error('Job state without submission time', jobState);
                throw new Error('Job state without submission time?');
            }

            /*
             * Determine the state of the job execution outcome.
             */

            var executionState,
                error, success,
                result = jobState.result,
                errorInfo = jobState.error;


            /*
             * Setting up the run status structure.
             * This is a view model used to provide information to the user
             * as well as switches for controlling the user interface.
             *
             * state: a simple string describing the run state
             *
             * launch, queue, running times: elapsed times in those states.
             *
             *
             */

            // TODO: get the preparation time.
            // todo: can we store the initial execution time in the job record
            // stored in the narrative?
            switch (jobState.job_state) {
                case 'queued':
                    temporalState = 'queued';
                    executionState = 'processing';
                    break;
                case 'in-progress':
                    temporalState = 'running';
                    executionState = 'processing';
                    break;
                case 'suspend':
                case 'error':
                    temporalState = 'finished';
                    executionState = 'error';

                    /*
                     * Here we are simply creating a standardized error
                     * view object.
                     */
                    var errorId = new Uuid(4).format();
                    var errorType, errorMessage, errorDetail;
                    if (errorInfo.error) {
                        // Classic KBase rpc error message
                        errorType = errorInfo.name;
                        errorMessage = errorInfo.message;
                        errorDetail = errorInfo.error;
                    } else if (errorInfo.name) {
                        errorType = 'unknown';
                        errorMessage = errorInfo.name + ' (code: ' + String(errorInfo.code) + ')';
                        errorDetail = 'This error occurred during execution of the app job.';
                    } else {
                        errorType = 'unknown';
                        errorMessage = 'Unknown error (check console for ' + errorId + ')';
                        errorDetail = 'There is no further information about this error';
                    }

                    error = {
                        location: 'job execution',
                        type: errorType,
                        message: errorMessage,
                        detail: errorDetail
                    };

                    break;
                case 'canceled':
                    temporalState = 'finished';
                    executionState = 'canceled';
                    break;
                case 'completed':
                    temporalState = 'finished';
                    executionState = 'success';
                    success = {
                        result: result
                    };
                    break;
                default:
                    console.error('Invalid job state for finished job', jobState)
                    throw new Error('Invalid job state for finished job: ' + jobState.job_state);
            }

            var newRunState = {
                runId: runState.runId,
                jobId: jobState.job_id,
                temporalState: temporalState,
                executionState: executionState,
                jobState: jobState,
                elapsedLaunchTime: runState.elapsedLaunchTime,
                elapsedQueueTime: elapsedQueueTime,
                position: position,
                elapsedRunTime: elapsedRunTime,
                completedTime: completedTime,
                error: error,
                success: success
            };

            model.setItem('runState', newRunState);
        }

        /*
         * This is responsible for ensuring that the display (tabs) reflects
         * the best view of the current execution state.
         * While launching and running, the stats would be the normal display,
         * although in advanced mode the user may have selected details or raw.
         * When finished the Result tab will be selected
         */
        function showExecState() {
            Object.keys(execStateListeners).forEach(function(listenerKey) {
                var listener = execStateListeners[listenerKey];
                try {
                    listener();
                } catch (ex) {
                    console.error('ERROR running exec state listener', ex);
                }
            });
        }

        function processNewLaunchState(launchEvent) {
            // we don't have to handle duplicates.

            model.setItem('lastLaunchEvent', launchEvent);

            var launchState = model.getItem('launchState');
            if (!launchState) {
                // These are always set on the first event.
                launchState = {
                    runId: launchEvent.run_id,
                    startTime: new Date(launchEvent.event_at).getTime(),
                    cellId: launchEvent.cell_id
                };
            }
            // These will or may be updated with new events.
            launchState.event = launchEvent.event;
            // The job id will only be sent after the job is actually
            // started.
            if (!launchEvent.jobId) {
                launchState.jobId = launchEvent.job_id;
            }
            if (launchEvent.error_type) {
                launchState.error = {
                    type: launchEvent.error_type,
                    message: launchEvent.error_message,
                    detail: launchEvent.error_stacktrace
                };
            }
            model.setItem('launchState', launchState);

            updateRunStateFromLaunchState(launchState);
            renderRunState();
            showExecState();
        }

        function renderRunState() {
            var runState = model.getItem('runState');
            if (runState && runState.executionState) {
                switch (runState.executionState) {
                    case 'error':
                        // update the result tab?
                        ui.updateTab(tabsId, 'result', {
                            label: 'Error',
                            icon: 'exclamation',
                            color: 'red',
                            select: true
                        });

                        // flip to the result tab.

                        break;
                    case 'success':
                        // update the reslut tab
                        ui.updateTab(tabsId, 'result', {
                            label: 'Success',
                            icon: 'thumbs-up',
                            color: 'green',
                            select: true
                        });

                        // flip to the result tab
                        break;
                    case 'canceled':
                        // update the result tab
                        ui.updateTab(tabsId, 'result', {
                            label: 'Canceled',
                            icon: 'exclamation',
                            color: 'orange',
                            select: true
                        });

                        // flip to the result tab
                        break;
                    default:
                        // otherwise just roll along.
                }
            }


        }


        function processNewJobState(jobState) {
            // Only update the job state if the job state is different.
            // How can we tell? Well for now we simply look at the job_state
            // for the incoming job notification, and compare it to our copy
            // of the most recent one, if any.
            // TODO: the controller should meter this for us!
            model.setItem('runStateLastUpdatedTime', new Date().getTime());
            var currentJobState = model.getItem('jobState');
            //if (!currentJobState || currentJobState.job_state !== jobState.job_state) {
            model.setItem('runStateLastUpdatedTime', new Date().getTime());
            model.setItem('jobState', jobState);
            updateRunStateFromJobState('process new job state');

            /*
             * Handle job finalization changes here.
             */
            // TODO: it would be awfully nice to have this handled by an fsm.
            renderRunState();

            showExecState();
            //}
            // If any.
            // showJobError();
        }

        /*
         * Name is the selector and model property name
         */

        // LIFECYCLE API

        function setup() {
            var ev;

            // Reset the state in case we are being re-run.
            model.deleteItem('runState');

            // INTERNAL EVENTS

            ev = bus.on('show-job-report', function(message) {
                getJobReport(message.reportRef)
                    .then(function(jobReport) {
                        model.setItem('jobReport', jobReport);
                        showJobReport();
                    });
            });
            listeners.push(ev);

            // CELL EVENTS
            /*
             * These events are trapped by the app cell, and then issued on the
             * cell bus. This abstracts the "cell" from subwidgets, so that
             * subwidgets are just aware that an external bus, passed in,
             * will potentially have these events.
             *
             * Alternatively, we could pass these events through the exec
             * bus itself...
             */
            ev = cellBus.on('launch-status', function(message) {
                processNewLaunchState(message.launchState);
            });
            listeners.push(ev);


            /*
             * NB: The app cell listens for job updates, and issues job state
             * changes on type: job-state.
             * This was done, rather thanhave
             */
            ev = cellBus.on('job-state', function(message) {
                processNewJobState(message.jobState);
            });
            listeners.push(ev);
            // not sure if this is the wisest thing to do...

            ev = cellBus.on('job-state-updated', function(message) {
                model.setItem('runStateLastUpdatedTime', new Date().getTime());
            });
            listeners.push(ev);

            // GLOBAL EVENTS

            ev = runtime.bus().on('clock-tick', function() {
                // only update the ui on clock tick if we are currently running
                // a job. TODO: the clock should be disconnected.
                // disable for now ... need to find a better way of processing clock ticks...
                // return;
                var runState = model.getItem('runState');
                if (runState && runState.executionState === 'processing') {
                    updateRunStateFromJobState();
                }
                // renderRunState();
                showExecState();
            });
            listeners.push(ev);

        }

        function teardown() {
            listeners.forEach(function(listener) {
                runtime.bus().removeListener(listener);
            });
        }

        function start() {
            bus.on('run', function(message) {
                container = message.node;
                ui = UI.make({
                    node: container,
                    bus: bus
                });
                render();
                setup();
                // TODO: we need a "rolled up" version of launch state
                // for restoring.
                if (message.launchState) {
                    processNewLaunchState(message.launchState);
                }
                if (message.jobState) {
                    processNewJobState(message.jobState);
                }
                renderRunState();
                // renderRunState();
                showExecState();
            });
            bus.on('stop', function(message) {
                teardown();
            });
            bus.on('reset', function(message) {
                // console.log('I should reset right about now.');

            });
        }

        function stop() {
            listeners.forEach(function(listener) {
                // TODO: make this work
                runtime.bus().removeListener(listener);
            });
            listeners = [];
            // reset job state...
            model = Props.make({
                onUpdate: function() {
                    // render();
                }
            });
        }

        function getBus() {
            return bus;
        }

        api = {
            start: start,
            stop: stop,
            bus: getBus
        };

        // MAIN

        model = Props.make({
            onUpdate: function() {
                // render();
            }
        });

        return api;
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});
