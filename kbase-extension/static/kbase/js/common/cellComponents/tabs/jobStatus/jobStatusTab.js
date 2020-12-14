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
            model = config.model;

        function renderLayout() {
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

        function getSelectedJobId() {
            return config.clickedId;
        }

        function startJobStatus() {
            return Promise.try(function() {
                container.innerHTML = renderLayout();

                //display widgets
                widgets.log = LogViewer.make();

                //rows as widgets to get live update
                widgets.stateList = JobStateList.make({
                    model: model
                });

                return Promise.all([
                    widgets.stateList.start({
                        node: ui.getElement('subjobs.body'),
                        childJobs: model.getItem('exec.jobState.child_jobs'),
                        parentJobId: model.getItem('exec.jobState.job_id')
                    })
                ]);
            });
        }

        function start(arg) {
            container = arg.node.appendChild(document.createElement('div'));
            ui = UI.make({
                node: container
            });

            startJobStatus();
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
