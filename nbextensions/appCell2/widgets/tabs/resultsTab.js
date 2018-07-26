/*global define*/
/*jslint white:true,browser:true,nomen:true*/

define([
    'bluebird',
    'uuid',
    'common/ui',
    'kb_common/html',
    './jobStateList',
    './resultsViewer'
], function (
    Promise,
    Uuid,
    UI,
    html,
    JobStateList,
    JobResult
) {
    'use strict';
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var container,
            model = config.model,
            ui,
            jobList,
            resultsViewer;

        function start(arg) {
            container = arg.node;
            model = arg.model;
            ui = UI.make({ node: container });

            var jobState = model.getItem('exec.jobState');
            if (jobState.child_jobs && jobState.child_jobs.length) {
                return startBatch(jobState);
            }
            else {
                return startSingle(jobState);
            }
        }

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

            var jobStatus = div({ class: 'col-md-9 batch-mode-col',  dataElement: 'kb-job-status-wrapper' }, [
                ui.buildCollapsiblePanel({
                    title: 'Result',
                    name: 'job-result',
                    hidden: false,
                    type: 'default',
                    classes: ['kb-panel-container'],
                    body: div({}, [
                        ui.buildPanel({
                            name: 'child-result',
                            classes: [
                                'kb-panel-light'
                            ]
                        })
                    ])
                })
            ]);
            return div({}, [list, jobStatus]);
        }

        function renderError(jobState, errorNode) {
            function convertJobError(errorInfo) {
                var errorId = new Uuid(4).format(),
                    errorType, errorMessage, errorDetail;
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

                return {
                    location: 'job execution',
                    type: errorType,
                    message: errorMessage,
                    detail: errorDetail
                };
            }

            function renderErrorLayout() {
                return div([
                    div({
                        style: {
                            fontWeight: 'bold',
                            color: 'red',
                            borderBottom: '1px solid eee',
                            marginBottom: '1em'
                        }
                    }, [
                        'An error occurred in this job!'
                    ]),
                    div({ style: { fontWeight: 'bold' } }, [
                        'Type'
                    ]),
                    div({ dataElement: 'type' }),
                    div({ style: { fontWeight: 'bold', marginTop: '1em' } }, [
                        'Message'
                    ]),
                    div({ dataElement: 'message' }),
                    div({ style: { fontWeight: 'bold', marginTop: '1em' } }, [
                        'Detail'
                    ]),
                    div({
                        dataElement: 'detail',
                        style: {
                            border: '0px silver solid',
                            padding: '4px',
                            wordBreak: 'break-word'
                        }
                    })
                ]);
            }

            var viewModel = convertJobError(jobState.error);

            errorNode.innerHTML = renderErrorLayout();
            var errorUi = UI.make({ node: errorNode });
            errorUi.updateFromViewModel(viewModel);
        }

        function startBatch(jobState) {
            // gonna have to listen to job state somewhere. maybe here?
            // and have a control for stopping the listener
            return Promise.try(() => {
                var layout = batchLayout();
                container.innerHTML = layout;

                jobList = JobStateList.make({ model: model });
                resultsViewer = JobResult.make({ model: model });
                startResults({
                    jobId: model.getItem('exec.jobState.job_id'),
                    isParentJob: true
                });

                function startResults(arg) {
                    var jobId = arg.jobId,
                        selectedJobId = jobId ? jobId : model.getItem('exec.jobState.job_id'),
                        jobState;

                    if (Number.isInteger(arg.jobIndex)) {
                        jobState = model.getItem('exec.jobState.child_jobs')[arg.jobIndex];
                    }
                    else if (arg.isParentJob) {
                        jobState = model.getItem('exec.jobState');
                    }
                    return Promise.try(() => {
                        // branch based on jobState.
                        // If there's an error, we should show the error widget instead.
                        let resultNode = ui.getElement('child-result.body');
                        switch(jobState.job_state) {
                            case 'completed':
                                return resultsViewer.start({
                                    node: resultNode,
                                    jobId: selectedJobId,
                                    isParentJob: arg.isParentJob,
                                    jobState: jobState
                                });
                            case 'error':
                            case 'suspend':
                                renderError(jobState, resultNode);
                                break;
                            case 'canceled':
                                resultNode.innerHTML = 'Job was stopped before it finished. Nothing to see here.';
                                break;
                            default:
                                resultNode.innerHTML = 'Not done running. Be patient, grasshopper.';
                                break;
                        }
                    });
                }

                jobList.start({
                    node: ui.getElement('subjobs.body'),
                    childJobs: model.getItem('exec.jobState.child_jobs'),
                    clickFunction: startResults,
                    parentJobId: model.getItem('exec.jobState.job_id'),
                    batchSize: model.getItem('exec.jobState.batch_size')
                });
            });
        }

        function startSingle(jobState) {
            return Promise.try(function () {
                resultsViewer = JobResult.make({ model: model });
                return resultsViewer.start({
                    node: container,
                    jobId: jobState.job_id,
                    jobState: jobState,
                    isParentJob: true
                });
            });
        }

        function stop() {
            var stopProms = [];
            if (jobList) {
                stopProms.push(jobList.stop());
            }
            if (resultsViewer) {
                stopProms.push(resultsViewer.stop());
            }
            return Promise.all(stopProms);
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});
