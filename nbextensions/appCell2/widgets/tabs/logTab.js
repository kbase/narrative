/*global define*/
/*jslint white:true,browser:true,nomen:true*/

define([
    'bluebird',
    'kb_common/html',
    'common/ui',
    './jobLogViewer',
    './jobStateViewer',
    './jobStateList',
    './jobInputParams'
], function (
    Promise,
    html,
    UI,
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
        var container;
            
        // The handy UI module interface to this container.
        var ui;
            
        // A cheap widget collection.
        var widgets = {};

        var model = config.model;
        var selectedJobId = config.jobId;
        function layout() {
            var list = div({ class: 'col-md-4', dataElement: 'kb-job-list-wrapper'}, [
                ui.buildPanel({
                    title: 'Sub Jobs',
                    name: 'subjobs',
                    classes: [
                        'kb-panel-light'
                    ]
                })
            ]);

            var jobStatus = div({ class: 'col-md-8',  dataElement: 'kb-job-status-wrapper' },[
                ui.buildCollapsiblePanel({
                    title: 'Job Params',
                    name: 'job-params-section-toggle',
                    hidden: false,
                    type: 'default',
                    classes: ['kb-panel-container'],
                    body: div({ }, [
                        ui.buildPanel({
                            // title: 'Job Params',
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
                            // title: 'Job Status',
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
                            // title: 'Job Log',
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
        function getSelectedJobId (){
            return config.clickedId;
        }


        function start(arg) {
            return Promise.try(function () {
                container = arg.node.appendChild(document.createElement('div'));
                ui = UI.make({
                    node: container
                });
                container.innerHTML = layout();
                widgets.params = JobInputParams.make({
                    model: model
                });
                widgets.log = LogViewer.make();
                widgets.jobState = JobStateViewer.make({
                    model: model
                });
                widgets.jobList = JobStateList.make({
                    model: model
                });
                if (selectedJobId){
                    startDetails();
                }
                function startDetails() {
                    //will need to change for getting arrays
                    config.clickedId = model.getItem('exec.jobState.job_id');
                    return Promise.all([
                        widgets.params.start({
                            node: ui.getElement('params.body'),
                            params: model.getItem('params')
                        }),
                        widgets.log.start({
                            node: ui.getElement('log.body'),
                            jobId: model.getItem('exec.jobState.job_id')
                        }),
                        widgets.jobState.start({
                            node: ui.getElement('jobState.body'),
                            jobId: model.getItem('exec.jobState.job_id')
                        })
                    ]);
                }
                return Promise.all([
                    widgets.jobList.start({
                        node: ui.getElement('subjobs.body'),
                        jobId: model.getItem('exec.jobState.job_id'),
                        clickFunction : startDetails
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