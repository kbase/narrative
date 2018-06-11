/*global define*/
/*jslint white:true,browser:true,nomen:true*/

define([
    'bluebird',
    'kb_common/html',
    'common/ui',
    'util/jobLogViewer',
    './jobStateViewer',
    './jobStateList',
    './jobInputParams',
    'css!kbase/css/batchMode'
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
        div = t('div'),
        table = t('table'),
        tr = t('tr'),
        td = t('td'),
        th = t('th');

    function factory(config) {
        // The top level node used by this widget.
        var container;
            
        // The handy UI module interface to this container.
        var ui;
            
        // A cheap widget collection.
        var widgets = {};

        var model = config.model;
        var selectedJobId = config.jobId;

        function batchLayout() {
            var list = div({ class: 'col-md-4 batch-mode-col', dataElement: 'kb-job-list-wrapper'}, [
                ui.buildPanel({
                    title: 'Sub Jobs',
                    name: 'subjobs',
                    classes: [
                        'kb-panel-light'
                    ]
                })
            ]);

            var jobStatus = div({ class: 'col-md-8 batch-mode-col',  dataElement: 'kb-job-status-wrapper' },[
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
        function layout() {
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
        function getSelectedJobId (){
            return config.clickedId;
        }

        function startBatch(arg){
            return Promise.try(function () {
                container = arg.node.appendChild(document.createElement('div'));
                ui = UI.make({
                    node: container
                });
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

                if (!selectedJobId) {
                    selectedJobId = model.getItem('exec.jobState.child_jobs')[0];
                } 
                startDetails(selectedJobId.job_id);

                function startDetails(jobId) {
                    var selectedJobId = jobId ? jobId : model.getItem('exec.jobState.job_id');
                    config.clickedId = selectedJobId;
                    return Promise.all([
                        widgets.params.start({
                            node: ui.getElement('params.body'),
                            params: model.getItem('params')
                        }),
                        widgets.log.start({
                            node: ui.getElement('log.body'),
                            jobId: selectedJobId
                        }),
                        widgets.jobState.start({
                            node: ui.getElement('jobState.body'),
                            jobId: selectedJobId
                        })
                    ]);
                }
                return Promise.all([
                    widgets.stateList.start({
                        node: ui.getElement('subjobs.body'),
                        childJobs: model.getItem('exec.jobState.child_jobs'),
                        clickFunction: startDetails
                    })
                ]);
            });
        }
        function start(arg) {

            //hack it too look like the other thing
            var temp = [];
            var rawjobState = model.getItem('exec.jobState');
            temp.push({
                job_state: rawjobState.job_state,
                job_id:  rawjobState.job_id
            })
            rawjobState.child_jobs = temp;
            //end hack 

            if(model.getItem('exec.jobState.child_jobs')){
                startBatch(arg);
            }else{
                startSingle(arg);
            }  
        }
        function startSingle(arg) {
            return Promise.try(function () {
                container = arg.node.appendChild(document.createElement('div'));
                ui = UI.make({
                    node: container
                });
                container.innerHTML = layout();
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