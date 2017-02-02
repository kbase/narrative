define([
    'bluebird',
    'common/runtime',
    'common/ui',
    'common/format',
    'kb_common/html'
], function (
    Promise,
    Runtime,
    UI,
    format,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span');

    function niceState(jobState) {
        var label;
        var color;
        switch (jobState) {
        case 'completed':
            label = 'success';
            color = 'green';
            break;
        case 'suspend':
            label = 'error';
            color = 'red';
            break;
        case 'canceled':
            label = 'cancelation';
            color = 'orange';
            break;
        default:
            label = jobState;
            color = 'black';
        }

        return span({
            style: {
                color: color,
                fontWeight: 'bold'
            }
        }, label);
    }

    function updateRunStats(ui, viewModel, jobState) {
        if (!jobState) {
            viewModel.launch._attrib.hidden = false;
            viewModel.launch.label = 'Launching...';
        } else {
            var now = new Date().getTime();

            viewModel.launch._attrib.hidden = true;

            if (jobState.creation_time) {
                // Queue status - at least in or has been in the queue
                viewModel.queue._attrib.hidden = false;

                if (jobState.exec_start_time) {
                    // Queue Status - show it, and it has finished, so show static elapsed time and
                    //   done't show position in queue.
                    viewModel.queue._attrib.style = { fontWeight: 'normal' };
                    viewModel.queue.active = false;
                    viewModel.queue.label = 'Queued for';
                    viewModel.queue.elapsed = format.niceDuration(jobState.exec_start_time - jobState.creation_time);
                    viewModel.queue.position.label = '';
                    viewModel.queue.position.number = '';

                    // Run Status -- by definition it is running or ran, so show it.
                    viewModel.run._attrib.hidden = false;

                    if (jobState.finish_time) {
                        viewModel.run._attrib.style = { fontWeight: 'normal' };
                        viewModel.run.active = false;
                        viewModel.run.label = 'Ran for';
                        viewModel.run.elapsed = format.niceDuration(jobState.finish_time - jobState.exec_start_time);

                        viewModel.finish._attrib.hidden = false;
                        viewModel.finish._attrib.style = { fontWeight: 'bold' };
                        viewModel.finish.active = true;
                        viewModel.finish.state = niceState(jobState.job_state);
                        viewModel.finish.time = format.niceTime(jobState.finish_time);
                        viewModel.finish.elapsed = format.niceDuration(now - jobState.finish_time);

                    } else {
                        viewModel.run._attrib.style = { fontWeight: 'bold' };
                        viewModel.run.active = true;
                        viewModel.run.label = 'Running ' + ui.loading({size: null, color: 'green'});
                        viewModel.run.elapsed = format.niceDuration(now - jobState.exec_start_time);

                        viewModel.finish._attrib.hidden = true;
                    }
                } else {
                    // Run Status - ensure not showing.
                    viewModel.run._attrib.hidden = true;
                    viewModel.run.active = false;

                    if (jobState.finish_time) {
                        // This can only happen when a job has been cancelled or errored out during queueing.

                        // Queue Status - it is out of the queue
                        viewModel.queue._attrib.style = { fontWeight: 'normal' };
                        viewModel.queue.active = false;
                        viewModel.queue.label = 'Queued for';
                        viewModel.queue.elapsed = format.niceDuration(jobState.finish_time - jobState.creation_time);
                        viewModel.queue.position.label = '';
                        viewModel.queue.position.number = '';

                        // Finished Status
                        viewModel.finish._attrib.hidden = false;
                        viewModel.finish._attrib.style = { fontWeight: 'bold' };
                        viewModel.finish.active = true;
                        viewModel.finish.state = niceState(jobState.job_state);
                        viewModel.finish.time = format.niceTime(jobState.finish_time);
                        viewModel.finish.elapsed = format.niceDuration(now - jobState.finish_time);
                    } else {
                        // Queue Status - in the queue
                        viewModel.queue._attrib.style = { fontWeight: 'bold' };
                        viewModel.queue.active = true;
                        viewModel.queue.label = 'Queued ' + ui.loading({size: null, color: 'orange'});
                        // console.log('position???', jobState);
                        if (jobState.position) {
                            viewModel.queue.position.label = ', currently at position ';
                            viewModel.queue.position.number = jobState.position;
                        } else {
                            viewModel.queue.position.label = '';
                            viewModel.queue.position.number = '';
                        }
                        viewModel.queue.elapsed = format.niceDuration(now - jobState.creation_time);

                        // Finished status -- ensure not showing
                        viewModel.finish._attrib.hidden = true;
                        viewModel.finish.active = false;
                    }
                }
            }
        }

        try {
            ui.updateFromViewModel(viewModel);
        } catch (err) {
            console.log('ERROR updating from view model', err);
        }
    }

    function renderRunStats() {
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
                backgroundColor: 'gray',
                color: '#FFF'
            };
        return div({ dataElement: 'run-stats', style: { paddingTop: '6px' } }, [
            div({
                class: 'row',
                dataElement: 'launch'
            }, [
                span({
                    dataElement: 'label'
                }),
                ' ',
                span({
                    dataElement: 'elapsed',
                    class: 'kb-elapsed-time'
                })
            ]),
            div({
                class: 'row',
                dataElement: 'queue'
            }, [
                span({
                    dataElement: 'label'
                }, 'Queue'),
                ' ',
                span({
                    dataElement: 'elapsed',
                    class: 'kb-elapsed-time'
                }),
                span({
                    dataElement: 'position'
                }, [
                    span({
                        dataElement: 'label'
                    }),
                    span({
                        dataElement: 'number'
                    })
                ])
            ]),
            div({
                class: 'row',
                dataElement: 'run'
            }, [
                span({
                    dataElement: 'label'
                }, 'Run'),
                ' ',
                span({
                    dataElement: 'elapsed',
                    class: 'kb-elapsed-time'
                })
            ]),
            div({
                class: 'row',
                dataElement: 'finish'
            }, [
                span('Finished with '),
                span({
                    dataElement: 'state'
                }),
                ' on ',
                span({
                    dataElement: 'time'
                }),
                ' (',
                span({
                    dataElement: 'elapsed'
                }),
                ' ago)'
            ])
        ]);
    }

    //  function renderRunStats() {
    //     var labelStyle = {
    //             textAlign: 'right',
    //             border: '1px transparent solid',
    //             padding: '4px'
    //         },
    //         dataStyle = {
    //             border: '1px silver solid',
    //             padding: '4px',
    //             display: 'inline-block',
    //             minWidth: '20px',
    //             backgroundColor: 'gray',
    //             color: '#FFF'
    //         };
    //     return div({ dataElement: 'run-stats', style: { paddingTop: '6px' } }, [
    //         // div({ class: 'row', dataElement: 'lastUpdated' }, [
    //         //     div({ class: 'col-md-2', style: labelStyle }, span({ dataElement: 'label' }, 'Last updated')),
    //         //     div({ class: 'col-md-2', style: dataStyle }, span({ dataElement: 'elapsed', class: 'kb-elapsed-time' })),
    //         //     div({ class: 'col-md-2', style: dataStyle }, span({ dataElement: 'time' }))
    //         // ]),
    //         div({ class: 'row', dataElement: 'queue' }, [
    //             div({ class: 'col-md-2', style: labelStyle }, span({ dataElement: 'label' }, 'Queue')),
    //             div({ class: 'col-md-2', style: dataStyle }, span({ dataElement: 'elapsed', class: 'kb-elapsed-time' })),
    //             div({ class: 'col-md-2', style: labelStyle }, 'Position'),
    //             div({ class: 'col-md-2', style: dataStyle }, span({ dataElement: 'position' }))
    //         ]),
    //         div({ class: 'row', dataElement: 'run' }, [
    //             div({ class: 'col-md-2', style: labelStyle }, span({ dataElement: 'label' }, 'Run')),
    //             div({ class: 'col-md-2', style: dataStyle }, span({ dataElement: 'elapsed', class: 'kb-elapsed-time' }))
    //         ]),
    //         div({ class: 'row', dataElement: 'finish' }, [
    //             div({ class: 'col-md-2', style: labelStyle }, 'Finish'),
    //             div({ class: 'col-md-2', style: dataStyle }, span({ dataElement: 'state' })),
    //             div({ class: 'col-md-2', style: labelStyle }, 'When'),
    //             div({ class: 'col-md-2', style: dataStyle }, span({ dataElement: 'when' }))
    //         ])
    //     ]);
    // }

    function factory(config) {
        var container, ui, listeners = [],
            jobState = null,
            runtime = Runtime.make(),
            listeningForJob = false,
            jobId;

        var viewModel = {
            lastUpdated: {
                elapsed: null,
                time: null
            },
            launch: {
                _attrib: {
                    hidden: true,
                    style: {}
                },
                label: null,
                elapsed: null
            },
            queue: {
                _attrib: {
                    hidden: true,
                    style: {}
                },
                active: null,
                label: null,
                elapsed: null,
                position: {
                    label: null,
                    number: null
                }
            },
            run: {
                _attrib: {
                    hidden: true,
                    style: {}
                },
                active: null,
                label: null,
                elapsed: null
            },
            finish: {
                _attrib: {
                    hidden: true,
                    style: {}
                },
                active: null,
                state: null,
                time: null,
                elapsed: null
            }
        };

        function startJobUpdates() {
            if (listeningForJob) {
                return;
            }
            runtime.bus().emit('request-job-update', {
                jobId: jobId
            });
            listeningForJob = true;
        }

        function stopJobUpdates() {
            if (listeningForJob) {
                runtime.bus().emit('request-job-completion', {
                    jobId: jobId
                });
                listeningForJob = false;
            }
        }

        function handleJobStatusUpdate(message) {
            jobState = message.jobState;
            // console.log('got job update', message.jobState);
            switch (jobState.job_state) {
            case 'queued':
            case 'in-progress':
                startJobUpdates();
                break;
            case 'completed':
            case 'error':
            case 'suspend':
            case 'canceled':
                stopJobUpdates();
                break;
            default:
                stopJobUpdates();
                console.error('Unknown job status', jobState.job_state, message);
                throw new Error('Unknown job status ' + jobState.job_state);
            }
        }

        function listenForJobStatus() {
            var ev = runtime.bus().listen({
                channel: {
                    jobId: jobId
                },
                key: {
                    type: 'job-status'
                },
                handle: handleJobStatusUpdate
            });
            listeners.push(ev);
        }

        function stopListeningForJobStatus() {
            runtime.bus().removeListeners(listeners);
        }

        function start(arg) {
            return Promise.try(function () {
                container = arg.node;
                ui = UI.make({ node: container });

                // var lastUpdated = model.getItem('exec.jobStateUpdated');

                container.innerHTML = renderRunStats();

                // updateRunStats(ui, jobState, lastUpdated);
                jobId = arg.jobId;
                // var jobState = model.getItem('exec.jobState');
                // updateRunStats(ui, jobState);

                listeners.push(runtime.bus().on('clock-tick', function () {
                    updateRunStats(ui, viewModel, jobState);
                }));

                listenForJobStatus();
                runtime.bus().emit('request-job-status', {
                    jobId: jobId
                });
                listeningForJob = true;

                ui.updateFromViewModel(viewModel);

            });
        }

        function stop() {
            return Promise.try(function () {
                stopListeningForJobStatus();
                // runtime.bus().removeListeners(listeners);
            });
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