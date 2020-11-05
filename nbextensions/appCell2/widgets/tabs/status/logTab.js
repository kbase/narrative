/*global define*/
/*jslint white:true,browser:true,nomen:true*/

/**
 * This is the entrypoint module for the job status / log viewer tab of the app cell.
 */
define([
    'bluebird',
    'kb_common/html',
    'common/ui',
    'common/runtime',
    'util/jobLogViewer',
    './jobStateViewer',
    './jobStateList',
    './jobInputParams'
], function (
    Promise,
    html,
    UI,
    Runtime,
    LogViewer,
    JobStateViewer,
    JobStateList,
    JobInputParams
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function factory(config) {
        // The top level node used by this widget.
        let container;

        // The handy UI module interface to this container.
        let ui;

        // A cheap widget collection.
        let widgets = {},
            queueListener,
            model = config.model,
            selectedJobId = config.jobId;

        /**
         * Used only if we're in Batch mode.
         */
        function batchLayout() {
            var list = div({ class: 'col-md-3 batch-mode-col', dataElement: 'kb-job-list-wrapper' }, [
                ui.buildPanel({
                    title: 'Job Batch',
                    name: 'subjobs',
                    classes: [
                        'kb-panel-light'
                    ]
                })
            ]);

            var jobStatus = div({ class: 'col-md-9 batch-mode-col',  dataElement: 'kb-job-status-wrapper' },[
                ui.buildCollapsiblePanel({
                    title: 'Job Params',
                    name: 'job-params-section-toggle',
                    hidden: false,
                    type: 'default',
                    classes: ['kb-panel-container'],
                    body: div({ }, [
                        ui.buildPanel({
                            name: 'params',
                            classes: [
                                'kb-panel-light'
                            ]
                        })
                    ])
                }),
                ui.buildCollapsiblePanel({
                    title: 'Job Status',
                    name: 'job-status-section-toggle',
                    hidden: false,
                    type: 'default',
                    collapsed: true,
                    classes: ['kb-panel-container'],
                    body: div({ }, [
                        ui.buildPanel({
                            name: 'jobState',
                            classes: [
                                'kb-panel-light'
                            ]
                        })
                    ])
                }),
                ui.buildCollapsiblePanel({
                    title: 'Job Log',
                    name: 'job-log-section-toggle',
                    hidden: false,
                    type: 'default',
                    collapsed: true,
                    classes: ['kb-panel-container'],
                    body: div({}, [
                        ui.buildPanel({
                            name: 'log',
                            classes: [
                                'kb-panel-light'
                            ]
                        })
                    ])
                })
            ]);
            return div({}, [list, jobStatus]);
        }

        function queueLayout() {
            return div({
                dataElement: 'kb-job-status-wrapper'
            }, [
                'This job is currently queued for execution and will start running soon.'
            ]);
        }

        function singleLayout() {
            return div({}, [
                ui.buildPanel({
                    title: 'Job Status',
                    name: 'jobState',
                    classes: [
                        'kb-panel-light'
                    ]
                }),
                ui.buildPanel({
                    title: 'Job Log',
                    name: 'log',
                    classes: [
                        'kb-panel-light'
                    ]
                })
            ]);
        }

        function getSelectedJobId() {
            return config.clickedId;
        }

        function startBatch(arg) {
            return Promise.try(function() {
                container.innerHTML = batchLayout();

                //display widgets
                widgets.params = JobInputParams.make({
                    model: model
                });
                widgets.log = LogViewer.make();
                widgets.jobState = JobStateViewer.make({
                    model: model
                });

                //rows as widgets to get live update
                widgets.stateList = JobStateList.make({
                    model: model
                });

                let childJobs = model.getItem('exec.jobState.child_jobs');
                if (childJobs.length > 0) {
                    selectedJobId = childJobs.job_id;
                }
                startDetails({
                    jobId: selectedJobId,
                    isParentJob: true
                });

                function startDetails(arg) {
                    var selectedJobId = arg.jobId ? arg.jobId : model.getItem('exec.jobState.job_id');
                    config.clickedId = selectedJobId;
                    return Promise.all([
                        widgets.params.start({
                            node: ui.getElement('params.body'),
                            jobId: selectedJobId,
                            parentJobId: model.getItem('exec.jobState.job_id'),
                            isParentJob: arg.isParentJob
                        }),
                        widgets.log.start({
                            node: ui.getElement('log.body'),
                            jobId: selectedJobId,
                            parentJobId: model.getItem('exec.jobState.job_id')
                        }),
                        widgets.jobState.start({
                            node: ui.getElement('jobState.body'),
                            jobId: selectedJobId,
                            parentJobId: model.getItem('exec.jobState.job_id')
                        })
                    ]);
                }
                return Promise.all([
                    widgets.stateList.start({
                        node: ui.getElement('subjobs.body'),
                        childJobs: model.getItem('exec.jobState.child_jobs'),
                        clickFunction: startDetails,
                        parentJobId: model.getItem('exec.jobState.job_id'),
                        batchSize: model.getItem('exec.jobState.batch_size')
                    })
                ]);
            });
        }

        /**
         * Can start in 2 modes.
         * 1. If the app is running, or has ever been running (so, )
         * @param {object} arg
         *  - node - the node to attach this tab to
         *  -
         */
        function start(arg) {
            container = arg.node.appendChild(document.createElement('div'));
            ui = UI.make({
                node: container
            });

            if (model.getItem('exec.jobState.status') === 'queued') {
                container.innerHTML = queueLayout();
                queueListener = Runtime.make().bus().listen({
                    channel: {
                        jobId: model.getItem('exec.jobState.job_id')
                    },
                    key: {
                        type: 'job-status'
                    },
                    handle: (message) => {
                        if (message.jobState.status !== 'queued') {
                            container.innerHTML = '';
                            Runtime.make().bus().removeListener(queueListener);
                            startNonQueued(arg);
                        }
                    }
                });
            }
            else {
                startNonQueued(arg);
            }
        }

        function startNonQueued(arg) {
            let childJobs = model.getItem('exec.jobState.child_jobs');
            if ((childJobs && childJobs.length > 0) || model.getItem('user-settings.batchMode')) {
                startBatch(arg);
            }
            else {
                startSingle(arg);
            }
        }

        function startSingle(arg) {
            return Promise.try(function () {
                container.innerHTML = singleLayout();
                widgets.log = LogViewer.make();
                widgets.jobState = JobStateViewer.make({
                    model: model
                });
                return Promise.all([
                    widgets.log.start({
                        node: ui.getElement('log.body'),
                        jobId: model.getItem('exec.jobState.job_id')
                    }),
                    widgets.jobState.start({
                        node: ui.getElement('jobState.body'),
                        jobId: model.getItem('exec.jobState.job_id')
                    })
                ]);
            });
        }

        function stop() {
            return Promise.try(function () {
                if (widgets) {
                    return Promise.all(Object.keys(widgets).map(function (key) {
                        return widgets[key].stop();
                    }));
                }
            });
        }

        return {
            start: start,
            stop: stop,
            getSelectedJobId: getSelectedJobId
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});
