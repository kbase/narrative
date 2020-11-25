/**
 * This widget shows a simple job state viewer for the app cell.
 * The viewer updates based on changes to the job state and view model.
 * It reports the current job state, runtime, and how long it has been / was queued for.
 */
define(['bluebird', 'common/runtime', 'common/ui', 'common/format', 'kb_common/html'], function (
    Promise,
    Runtime,
    UI,
    format,
    html
) {
    'use strict';

    let t = html.tag,
        div = t('div'),
        p = t('p'),
        span = t('span');

    /**
     * Translate from EE2's job status (or other job state strings interpreted by the app cell)
     * to a presentable string. This returns a span with the text colored and bolded, and the
     * "nice" readable state string.
     *
     * Translated strings = completed, error, terminated, and does_not_exist. Those all get
     * different colors. Other strings are rendered black.
     * @param {string} jobState
     */
    function niceState(jobState) {
        let label, color;
        switch (jobState) {
            case 'completed':
                label = 'success';
                color = 'green';
                break;
            case 'error':
                label = 'error';
                color = 'red';
                break;
            case 'terminated':
                label = 'cancellation';
                color = 'orange';
                break;
            case 'does_not_exist':
                label = 'does_not_exist';
                color = 'orange';
                break;
            default:
                label = jobState;
                color = 'black';
        }

        return span(
            {
                style: {
                    color: color,
                    fontWeight: 'bold',
                },
            },
            label
        );
    }

    /**
     * Updates the view stats.
     * If there's no jobState, this just posts a message saying we're waiting for info, and stops.
     * Otherwise, if the jobState has an updated time (which all EE2 job states should), we do
     * the calculations and re-render here.
     *
     * In essence, this does all the calculation of what fields to render and passes it on to
     * ui.renderFromViewModel
     * @param {object} ui - the current UI object
     * @param {object} viewModel - the app cell's view model
     * @param {object} jobState - the app cell's current job state
     */
    function updateRunStats(ui, viewModel, jobState) {
        if (!jobState) {
            viewModel.launch._attrib.hidden = false;
            viewModel.launch.label = 'Determining Job State...';
        } else {
            const now = new Date().getTime();

            viewModel.launch._attrib.hidden = true;

            if (jobState.updated) {
                const creationTime = jobState.created;
                // Queue status - at least in or has been in the queue
                viewModel.queue._attrib.hidden = false;
                if (jobState.running) {
                    // Queue Status - show it, and it has finished, so show static elapsed time and
                    //   don't show position in queue.
                    viewModel.queue._attrib.style = { fontWeight: 'normal' };
                    viewModel.queue.active = false;
                    viewModel.queue.label = 'Queued for';
                    const execStartTime = jobState.running;
                    viewModel.queue.elapsed = format.niceDuration(execStartTime - creationTime);
                    viewModel.queue.position.label = '';
                    viewModel.queue.position.number = '';

                    // Run Status -- by definition it is running or ran, so show it.
                    viewModel.run._attrib.hidden = false;

                    if (jobState.finished) {
                        viewModel.run._attrib.style = { fontWeight: 'normal' };
                        viewModel.run.active = false;
                        viewModel.run.label = 'Ran for';
                        const finishTime = jobState.finished;
                        viewModel.run.elapsed = format.niceDuration(finishTime - execStartTime);

                        viewModel.finish._attrib.hidden = false;
                        viewModel.finish._attrib.style = { fontWeight: 'bold' };
                        viewModel.finish.active = true;
                        viewModel.finish.state = niceState(jobState.status);
                        viewModel.finish.time = format.niceTime(finishTime);
                        viewModel.finish.elapsed = format.niceDuration(now - finishTime);
                    } else {
                        viewModel.run._attrib.style = { fontWeight: 'bold' };
                        viewModel.run.active = true;
                        viewModel.run.label =
                            'Running ' + ui.loading({ size: null, color: 'green' });
                        viewModel.run.elapsed = format.niceDuration(now - execStartTime);

                        viewModel.finish._attrib.hidden = true;
                    }
                } else {
                    // Run Status - ensure not showing.
                    viewModel.run._attrib.hidden = true;
                    viewModel.run.active = false;

                    if (jobState.finished) {
                        // This can only happen when a job has been cancelled or errored out during queueing.

                        // Queue Status - it is out of the queue
                        viewModel.queue._attrib.style = { fontWeight: 'normal' };
                        viewModel.queue.active = false;
                        viewModel.queue.label = 'Queued for';
                        const finishTime = jobState.finished;
                        viewModel.queue.elapsed = format.niceDuration(finishTime - creationTime);
                        viewModel.queue.position.label = '';
                        viewModel.queue.position.number = '';

                        // Finished Status
                        viewModel.finish._attrib.hidden = false;
                        viewModel.finish._attrib.style = { fontWeight: 'bold' };
                        viewModel.finish.active = true;
                        viewModel.finish.state = niceState(jobState.status);
                        viewModel.finish.time = format.niceTime(finishTime);
                        viewModel.finish.elapsed = format.niceDuration(now - finishTime);
                    } else {
                        // Queue Status - in the queue
                        viewModel.queue._attrib.style = { fontWeight: 'bold' };
                        viewModel.queue.active = true;
                        viewModel.queue.label =
                            'Queued ' + ui.loading({ size: null, color: 'orange' });
                        if (jobState.position) {
                            viewModel.queue.position.label = ', currently at position ';
                            viewModel.queue.position.number = jobState.position;
                        } else {
                            viewModel.queue.position.label = '';
                            viewModel.queue.position.number = '';
                        }
                        viewModel.queue.elapsed = format.niceDuration(now - creationTime);

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

    /**
     * Does the initial rendering set up for the run stats area. Creates rows
     * for each of the various run state possibilities.
     */
    function renderRunStats() {
        return div({ dataElement: 'run-stats', style: { paddingTop: '6px' } }, [
            div(
                {
                    class: 'row',
                    dataElement: 'launch',
                },
                [
                    span({
                        dataElement: 'label',
                    }),
                    ' ',
                    span({
                        dataElement: 'elapsed',
                        class: 'kb-elapsed-time',
                    }),
                ]
            ),
            div(
                {
                    class: 'row',
                    dataElement: 'job_not_found',
                },
                [
                    span({
                        dataElement: 'message',
                    }),
                ]
            ),
            div(
                {
                    class: 'row',
                    dataElement: 'queue',
                },
                [
                    span(
                        {
                            dataElement: 'label',
                        },
                        'Queue'
                    ),
                    ' ',
                    span({
                        dataElement: 'elapsed',
                        class: 'kb-elapsed-time',
                    }),
                    span(
                        {
                            dataElement: 'position',
                        },
                        [
                            span({
                                dataElement: 'label',
                            }),
                            span({
                                dataElement: 'number',
                            }),
                        ]
                    ),
                ]
            ),
            div(
                {
                    class: 'row',
                    dataElement: 'run',
                },
                [
                    span(
                        {
                            dataElement: 'label',
                        },
                        'Run'
                    ),
                    ' ',
                    span({
                        dataElement: 'elapsed',
                        class: 'kb-elapsed-time',
                    }),
                ]
            ),
            div(
                {
                    class: 'row',
                    dataElement: 'finish',
                },
                [
                    span('Finished with '),
                    span({
                        dataElement: 'state',
                    }),
                    ' on ',
                    span({
                        dataElement: 'time',
                    }),
                    ' (',
                    span({
                        dataElement: 'elapsed',
                    }),
                    ' ago)',
                ]
            ),
        ]);
    }

    /**
     * Initializes this state viewer widget.
     * Inits the internal viewModel as well.
     * @param {object} config - the config passed to this widget (not used, but in the format)
     */
    function factory(config) {
        let container,
            ui,
            listeners = [],
            jobState = null,
            runtime = Runtime.make(),
            listeningForJob = false,
            jobId,
            parentJobId;

        let viewModel = {
            lastUpdated: {
                elapsed: null,
                time: null,
            },
            launch: {
                _attrib: {
                    hidden: true,
                    style: {},
                },
                label: null,
                elapsed: null,
            },
            queue: {
                _attrib: {
                    hidden: true,
                    style: {},
                },
                active: null,
                label: null,
                elapsed: null,
                position: {
                    label: null,
                    number: null,
                },
            },
            run: {
                _attrib: {
                    hidden: true,
                    style: {},
                },
                active: null,
                label: null,
                elapsed: null,
            },
            finish: {
                _attrib: {
                    hidden: true,
                    style: {},
                },
                active: null,
                state: null,
                time: null,
                elapsed: null,
            },
            job_not_found: {
                _attrib: {
                    hidden: true,
                    style: {},
                },
                message: div([
                    p([
                        'This job was not found, or may not have been registered with this Narrative.',
                    ]),
                    p(['You will not be able to inspect the job status or view the job log']),
                ]),
            },
        };

        /**
         * Starts listening for job updates and requests the most recent job state for this app cell.
         */
        function startJobUpdates() {
            if (listeningForJob) {
                return;
            }
            runtime.bus().emit('request-job-update', {
                jobId: jobId,
                parentJobId: parentJobId,
            });
            listeningForJob = true;
        }

        /**
         * Stops listening for job updates
         */
        function stopJobUpdates() {
            listeningForJob = false;
        }

        /**
         * If the job doesn't exist, then we need to set a different job state.
         * We don't care what the message is, but it's passed here anyway.
         * @param {object} message
         */
        function handleJobDoesNotExistUpdate(message) {
            jobState = {
                job_state: 'does_not_exist',
            };
        }

        /**
         * Called when the job-status message is received.
         * This parses the job status message. Takes into account both NJS and EE2 style messages.
         * @param {object} message
         */
        function handleJobStatusUpdate(message) {
            jobState = message.jobState;
            switch (jobState.status) {
                case 'queued':
                case 'created':
                case 'estimating':
                case 'running':
                    startJobUpdates();
                    break;
                case 'completed':
                case 'error':
                case 'terminated':
                    stopJobUpdates();
                    break;
                default:
                    stopJobUpdates();
                    console.error('Unknown job status', jobState.status, message);
                    throw new Error('Unknown job status ' + jobState.status);
            }
        }

        /**
         * Sets up handlers and listeners for job status updates.
         * Listens on the jobId channel for these messages:
         *  - job-status -> respond to job update
         *  - job-canceled -> no-op
         *  - job-does-not-exist -> respond to the not found exception
         */
        function listenForJobStatus() {
            let ev = runtime.bus().listen({
                channel: {
                    jobId: jobId,
                },
                key: {
                    type: 'job-status',
                },
                handle: handleJobStatusUpdate,
            });
            listeners.push(ev);

            ev = runtime.bus().listen({
                channel: {
                    jobId: jobId,
                },
                key: {
                    type: 'job-canceled',
                },
                handle: () => {},
            });
            listeners.push(ev);

            ev = runtime.bus().listen({
                channel: {
                    jobId: jobId,
                },
                key: {
                    type: 'job-does-not-exist',
                },
                handle: handleJobDoesNotExistUpdate,
            });
            listeners.push(ev);
        }

        /**
         * Removes job status update listeners.
         */
        function stopListeningForJobStatus() {
            runtime.bus().removeListeners(listeners);
        }

        function start(arg) {
            return Promise.try(() => {
                if (container) {
                    return detach();
                }
            }).then(() => {
                return Promise.try(() => {
                    container = arg.node;
                    ui = UI.make({ node: container });

                    container.innerHTML = renderRunStats();

                    jobId = arg.jobId;
                    parentJobId = arg.parentJobId ? arg.parentJobId : null;

                    listeners.push(
                        runtime.bus().on('clock-tick', () => {
                            updateRunStats(ui, viewModel, jobState);
                        })
                    );

                    listenForJobStatus();

                    // request a new job status update from the kernel on start
                    runtime.bus().emit('request-job-status', {
                        jobId: jobId,
                        parentJobId: parentJobId,
                    });
                    listeningForJob = true;

                    ui.updateFromViewModel(viewModel);
                });
            });
        }

        /**
         * Lifecycle method.
         * On widget stop, this removes all listeners for job status to clean itself up.
         */
        function stop() {
            return Promise.try(function () {
                stopListeningForJobStatus();
            });
        }

        /**
         * Lifecycle method.
         * When told to detach, this widget cleans itself up with a call to stop(),
         * then removes itself from the DOM.
         */
        function detach() {
            return stop().then(() => {
                container.innerHTML = '';
            });
        }

        return {
            start: start,
            stop: stop,
            detach: detach,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
