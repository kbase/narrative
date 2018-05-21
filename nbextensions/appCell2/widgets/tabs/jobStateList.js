define([
    'bluebird',
    'common/runtime',
    'common/ui',
    'common/format',
    'kb_common/html'
], function(
    Promise,
    Runtime,
    UI,
    format,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        p = t('p'),
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
        case 'does_not_exist':
            label = 'does_not_exist';
            color: 'orange';
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
            viewModel.launch.label = 'Determining Job State...';
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
                        viewModel.run.label = 'Running ' + ui.loading({ size: null, color: 'green' });
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
                        viewModel.queue.label = 'Queued ' + ui.loading({ size: null, color: 'orange' });
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
            } else {
                viewModel.job_not_found._attrib.hidden = false;
            }
        }

        try {
            ui.updateFromViewModel(viewModel);
        } catch (err) {
            console.error('ERROR updating from view model', err);
        }
    }
    function updateRunStats2(ui, viewModel, jobState) {
        if (!jobState) {
            viewModel.launch._attrib.hidden = false;
            viewModel.launch.label = 'Determining Job State...';
        } else {
            var now = new Date().getTime();
            viewModel.launch._attrib.hidden = true;
            if(jobState.job_state === 'completed'){
                viewModel.finish._attrib.hidden = false;
                viewModel.finish._attrib.style = { fontWeight: 'bold' };
                viewModel.finish.active = true;
                viewModel.finish.state = niceState(jobState.job_state);
                viewModel.finish.time = format.niceTime(jobState.finish_time);
                viewModel.finish.elapsed = format.niceDuration(now - jobState.finish_time);
            } else if (jobState.job_state === 'queued'){
                viewModel.queue._attrib.style = { fontWeight: 'bold' };
                viewModel.queue.active = true;
                viewModel.queue.label = 'Queued ' + ui.loading({ size: null, color: 'orange' });
                if (jobState.position) {
                    viewModel.queue.position.label = ', currently at position ';
                    viewModel.queue.position.number = jobState.position;
                } else {
                    viewModel.queue.position.label = '';
                    viewModel.queue.position.number = '';
                }
                viewModel.queue.elapsed = format.niceDuration(now - jobState.creation_time);
            } else if (jobState.job_state === 'in-progress'){
                viewModel.run._attrib.style = { fontWeight: 'bold' };
                viewModel.run.active = true;
                viewModel.run.label = 'Running ' + ui.loading({ size: null, color: 'green' });
                viewModel.run.elapsed = format.niceDuration(now - jobState.exec_start_time);
            }        
        }
        try {
            ui.updateFromViewModel(viewModel);
        } catch (err) {
            console.error('ERROR updating from view model', err);
        }
    }

    function renderRunStats() {
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
                dataElement: 'job_not_found'
            }, [
                span({
                    dataElement: 'message'
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

    function factory() {
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
            },
            job_not_found: {
                _attrib: {
                    hidden: true,
                    style: {}
                },
                message: div([
                    p([
                        'This job was not found. It was probably started by another user. Only the ',
                        'user who started a job may view it\'s status or associated job logs.'
                    ]),
                    p([
                        'You will not be able to inspect the job status or view the job log'
                    ])
                ])
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

        function handleJobDoesNotExistUpdate(message) {
            stopJobUpdates();
            jobState = {
                job_state: 'does_not_exist'
            };
        }

        function handleJobStatusUpdate(message) {
            jobState = message.jobState;
            switch (jobState.job_state) {
            case 'queued':
            case 'in-progress':
                startJobUpdates();
                break;
            case 'completed':
                stopJobUpdates();
                break;
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

            ev = runtime.bus().listen({
                channel: {
                    jobId: jobId
                },
                key: {
                    type: 'job-canceled'
                },
                handle: function() {
                    console.warn('job cancelled');
                }
            });
            listeners.push(ev);

            ev = runtime.bus().listen({
                channel: {
                    jobId: jobId
                },
                key: {
                    type: 'job-does-not-exist'
                },
                handle: handleJobDoesNotExistUpdate
            });
            listeners.push(ev);
        }

        function stopListeningForJobStatus() {
            runtime.bus().removeListeners(listeners);
        }

        function start(arg) {
            return Promise.try(function() {
                container = arg.node;
                ui = UI.make({ node: container });
                
                container.innerHTML = renderRunStats();

                jobId = arg.jobId;

                listeners.push(runtime.bus().on('clock-tick', function() {
                    updateRunStats2(ui, viewModel, jobState);
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
            return Promise.try(function() {
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
        make: function() {
            return factory();
        }
    };

});