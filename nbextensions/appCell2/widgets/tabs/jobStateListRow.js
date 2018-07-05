define([
    'bluebird',
    'common/runtime',
    'common/ui',
    'kb_common/html'
], function(
    Promise,
    Runtime,
    UI,
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
        var label, icon, color;
        switch (jobState) {
        case 'completed':
            label = 'success';
            icon = 'fa fa-check';
            color = 'green';
            break;
        case 'queued':
            label = jobState;
            icon = 'fa fa-angle-double-right';
            color = 'green';
            break;
        case 'in-progress':
            label = jobState;
            icon = 'fa fa-spinner';
            color = 'green';
            break;
        case 'suspend':
            label = 'suspended';
            icon = 'fa fa-pause';
            color = 'red';
            break;
        case 'error':
            label = jobState;
            icon = 'fa fa-times';
            color = 'red';
            break;
        case 'canceled':
            label = jobState;
            icon = 'fa fa-times';
            color = 'orange';
            break;
        case 'does_not_exist':
            label = 'does not exist';
            icon = 'fa fa-question';
            color: 'orange';
            break;
        default:
            label = jobState;
            icon = 'fa fa-question';
            color = 'black';
        }

        return td({
            style: {
                color: color,
                fontWeight: 'bold'
            },
            class: icon
        }, label);
    }

    function factory() {
        var container, ui, listeners = [],
            runtime = Runtime.make(),
            listeningForJob = false,
            jobNumber,
            jobId,
            parentJobId,
            clickFunction;

        function updateRowStatus(jobStatus) {
            var selector = '[data-element-job-id="' + jobNumber + '"]';
            var row = container.querySelector(selector);
            if (row === null) {
                row = document.createElement('tr');
                row.setAttribute('data-element-job-id', jobNumber);
                row.classList.add('job-info');
                row.onclick = () => {
                    if (jobId) {
                        clickFunction(row, jobId);
                    }
                };
                container.appendChild(row);
            }
            jobStatus = jobStatus ? jobStatus : 'Job still pending.';
            row.innerHTML = th('Job ' + jobNumber) + niceState(jobStatus);
        }

        function startJobUpdates() {
            if (listeningForJob) {
                return;
            }
            runtime.bus().emit('request-job-update', {
                jobId: parentJobId
            });
            listeningForJob = true;
        }

        function stopJobUpdates() {
            if (listeningForJob) {
                runtime.bus().emit('request-job-completion', {
                    jobId: parentJobId
                });
                listeningForJob = false;
            }
        }

        function handleJobDoesNotExistUpdate(message) {
            stopJobUpdates();
        }

        function handleJobStatusUpdate(message) {
            // get the actual job state (whole job, incl parent info)
            var jobState = message.jobState;
            // jobNumber is the index on child_jobs for this widget.
            // if child_jobs doesn't have that index, then there's no job yet.
            // so... just not started yet.
            if (!jobState.child_jobs || jobState.child_jobs.length < jobNumber) {
                updateRowStatus();
            }
            else {
                var state = jobState.child_jobs[jobNumber];
                if (!jobId) {
                    jobId = state.job_id;
                }
                switch (state.job_state) {
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
                updateRowStatus(state.job_state);
            }
        }

        function listenForJobStatus() {
            var ev = runtime.bus().listen({
                channel: {
                    jobId: parentJobId
                },
                key: {
                    type: 'job-status'
                },
                handle: handleJobStatusUpdate
            });
            listeners.push(ev);

            ev = runtime.bus().listen({
                channel: {
                    jobId: parentJobId
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
                    jobId: parentJobId
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

                jobId = arg.jobId;                  // id of child job
                jobNumber = arg.jobNumber;          // index of child job
                parentJobId = arg.parentJobId;      // as it says...
                clickFunction = arg.clickFunction;  // called on click (after some ui junk)

                if (jobId) {
                    listenForJobStatus();
                    runtime.bus().emit('request-job-status', {
                        jobId: jobId
                    });
                }
                listeningForJob = true;

            });
        }

        function stop() {
            return Promise.try(function() {
                stopListeningForJobStatus();
            });
        }

        function setJobId(newId) {
            stop()
            .then(() => {
                jobId = newId;
                listenForJobStatus();
            });
        }

        return {
            start: start,
            stop: stop,
            setJobId: setJobId
        };
    }

    return {
        make: function() {
            return factory();
        }
    };

});