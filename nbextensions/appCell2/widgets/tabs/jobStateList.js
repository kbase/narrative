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
        span = t('span'),
        table = t('table'),
        tr = t('tr'),
        td = t('td'),
        th = t('th');

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

    function updateRowStatus(ui, jobState, container) {
        var selector = '[data-element-job-id="' + jobState.job_id + '"]';
        var row = container.querySelector(selector);
        if(row === null){
            row = document.createElement('tr');
            row.setAttribute('data-element-job-id', jobState.job_id);
            container.appendChild(row);
        }

        
        var jobStatus = jobState ? jobState.job_state : 'Determining Job State...';
        row.innerHTML = th(jobState.job_id)+ td(jobStatus);

    }
    function renderTable(){
        return table({class: 'table'},[
            tr([
                th('Name'),
                td("test")
            ]),
            tr([
                th('Name2'),
                td("test2")
            ])
        ]);
    }

    function factory() {
        var container, ui, listeners = [],
            jobState = null,
            runtime = Runtime.make(),
            listeningForJob = false,
            jobId;


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
                container.innerHTML = renderTable();

                jobId = arg.jobId;

                listeners.push(runtime.bus().on('clock-tick', function() {
                    updateRowStatus(ui, jobState, container, listeningForJob);
                }));

                listenForJobStatus();
                runtime.bus().emit('request-job-status', {
                    jobId: jobId
                });

                listeningForJob = true;

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