define([
    'bluebird',
    'kb_common/html',
    'common/ui',
    'common/runtime',
    'util/jobLogViewer',
    './jobStateList'
], function (
    Promise,
    html,
    UI,
    Runtime,
    LogViewer,
    JobStateList
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
            var list = div({
                class: 'col-md-6 batch-mode-col',
                dataElement: 'kb-job-list-wrapper'
            }, [
                ui.buildPanel({
                    name: 'subjobs',
                    classes: [
                        'kb-panel-light',
                        'kb-job-status'
                    ]
                })
            ]);

            var jobStatus = div({
                class: 'col-md-6 batch-mode-col',
                dataElement: 'kb-job-status-wrapper'
            },[
                ui.buildPanel({
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

        function getSelectedJobId() {
            return config.clickedId;
        }

        function startBatch() {
            return Promise.try(function() {
                container.innerHTML = batchLayout();

                //display widgets
                widgets.log = LogViewer.make();

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
                    var _selectedJobId = arg.jobId ? arg.jobId : model.getItem('exec.jobState.job_id');
                    config.clickedId = _selectedJobId;
                    return Promise.all([
                        widgets.log.start({
                            node: ui.getElement('log.body'),
                            jobId: _selectedJobId,
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
                        batchSize: model.getItem('exec.jobState.batch_size'),
                        // TODO this should be included in each of the child jobs information. This is a hack for now
                        // Need to talk to boris
                        name: model.getItem('params.name'),
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
                            startBatch();
                        }
                    }
                });
            }
            else {
                startBatch();
            }
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
