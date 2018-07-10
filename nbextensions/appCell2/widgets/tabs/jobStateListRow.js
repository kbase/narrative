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
        td = t('td'),
        th = t('th'),
        span = t('span');

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
            color = 'orange';
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
        }, [
            span({
                class: icon
            }),
            ' ' + label
        ]);
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
            jobStatus = jobStatus ? jobStatus : 'Job still pending.';
            var jobIdDiv = '';
            if (jobId) {
                jobIdDiv = div({'style': 'font-size:8pt; color:gray'}, [jobId]);
            }
            container.innerHTML = th({}, [div('Job ' + (jobNumber+1)), jobIdDiv]) + niceState(jobStatus);
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
            stopListeningForJobStatus();
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
                container = arg.node;               // this is the row (tr) that this renders
                container.onclick = () => {
                    if (jobId) {
                        clickFunction(container, jobId);
                    }
                };
                ui = UI.make({ node: container });

                jobId = arg.jobId;                  // id of child job
                jobNumber = arg.jobNumber;          // index of child job
                parentJobId = arg.parentJobId;      // as it says...
                clickFunction = arg.clickFunction;  // called on click (after some ui junk)

                listenForJobStatus();
                runtime.bus().emit('request-job-status', {
                    jobId: parentJobId
                });
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