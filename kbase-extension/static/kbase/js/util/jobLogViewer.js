/**
 * Usage:
 * let viewer = JobLogViewer.make();
 * viewer.start({
 *     jobId: <some job id>,
 *     node: <a DOM node>
 * })
 */
define([
    'common/runtime',
    'common/props',
    'common/ui',
    'common/events',
    'common/fsm',
    'kb_common/html',
], (Runtime, Props, UI, Events, Fsm, html) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        button = t('button'),
        span = t('span'),
        p = t('p'),
        numLines = 100,
        cssBaseClass = 'kb-log',
        logContentStandardClass = `${cssBaseClass}__content`,
        logContentExpandedClass = `${logContentStandardClass}--expanded`;

    let logContentClass = logContentStandardClass;

    // all the states possible, to be fed into the FSM.
    const appStates = [
        {
            state: {
                mode: 'new',
            },
            meta: {
                description: 'Widget just created, do not yet know the state of the job',
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['play', 'stop', 'top', 'bottom', 'expand'],
                },
            },
            next: [
                {
                    mode: 'queued',
                    auto: true,
                },
                {
                    mode: 'active',
                    auto: true,
                },
                {
                    mode: 'complete',
                },
                {
                    mode: 'error',
                },
                {
                    mode: 'canceled',
                },
                {
                    mode: 'job-not-found',
                },
            ],
        },
        {
            state: {
                mode: 'queued',
                auto: true,
            },
            meta: {
                description: 'The job is queued, there are no logs yet.',
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['play', 'stop', 'top', 'bottom', 'expand'],
                },
            },
            next: [
                {
                    mode: 'active',
                    auto: false,
                },
                {
                    mode: 'active',
                    auto: true,
                },
                {
                    mode: 'complete',
                },
                {
                    mode: 'canceled',
                },
                {
                    mode: 'error',
                },
            ],
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-queued',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-queued',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-queued',
                        },
                    ],
                },
            },
        },
        {
            state: {
                mode: 'active',
                auto: true,
            },
            meta: {
                description: 'The Job is currently active, receiving log updates automatically',
            },
            ui: {
                buttons: {
                    enabled: ['stop', 'expand'],
                    disabled: ['play', 'top', 'bottom'],
                },
            },
            next: [
                {
                    mode: 'active',
                    auto: false,
                },
                {
                    mode: 'active',
                    auto: true,
                },
                {
                    mode: 'complete',
                },
                {
                    mode: 'canceled',
                },
                {
                    mode: 'error',
                },
            ],
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-active',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-active',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-active',
                        },
                    ],
                },
            },
        },
        {
            state: {
                mode: 'active',
                auto: false,
            },
            meta: {
                description: 'The job is currently active, no automatic updates',
            },
            ui: {
                buttons: {
                    enabled: ['play', 'top', 'bottom', 'expand'],
                    disabled: ['stop'],
                },
            },
            next: [
                {
                    mode: 'active',
                    auto: true,
                },
                {
                    mode: 'active',
                    auto: false,
                },
                {
                    mode: 'complete',
                },
                {
                    mode: 'error',
                },
            ],
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-active-noauto',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-active-noauto',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-active-noauto',
                        },
                    ],
                },
            },
        },
        {
            state: {
                mode: 'complete',
            },
            ui: {
                buttons: {
                    enabled: ['top', 'bottom', 'expand'],
                    disabled: ['play', 'stop'],
                },
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-complete',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-complete',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-complete',
                        },
                    ],
                },
            },
        },
        {
            state: {
                mode: 'canceled',
            },
            ui: {
                buttons: {
                    enabled: ['top', 'bottom', 'expand'],
                    disabled: ['play', 'stop'],
                },
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-canceled',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-canceled',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-canceled',
                        },
                    ],
                },
            },
        },
        {
            state: {
                mode: 'error',
            },
            ui: {
                buttons: {
                    enabled: ['top', 'bottom', 'expand'],
                    disabled: ['play', 'stop'],
                },
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-error',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-error',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-error',
                        },
                    ],
                },
            },
        },
        {
            state: {
                mode: 'job-not-found',
            },
            meta: {
                description: 'Job status returns a job not found error',
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['play', 'stop', 'top', 'bottom', 'expand'],
                },
            },
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-job-not-found',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-job-not-found',
                        },
                    ],
                },
            },
            next: [
                {
                    mode: 'job-not-found',
                },
            ],
        },
    ];

    /**
     * The entrypoint to this widget. This creates the job log viewer and initializes it.
     * Starting it is left as a lifecycle method for the caller.
     *
     */
    function factory() {
        // MAIN
        /* The data model for this widget contains all lines currently being shown, along with the indices for
         * the first and last lines known.
         * It also tracks the total lines currently available for the app, if returned.
         * Lines is a list of small objects. Each object
         * lines - list, each is a small object with keys (these are all post-processed after fetching):
         *      line - string, the line text
         *      isError - boolean, true if that line denotes an error
         *      ts - int timestamp
         *      lineNumber - int, what line this is
         * firstLine - int, the first line we're tracking (inclusive)
         * lastLine - int, the last line we're tracking (inclusive)
         * totalLines - int, the total number of lines available from the server as of the last message.
         */
        const model = Props.make({
                data: {
                    lines: [],
                    firstLine: null,
                    lastLine: null,
                    totalLines: null,
                },
            }),
            runtime = Runtime.make(),
            loopFrequency = 5000,
            listeners = [];

        let container,
            jobId,
            ui,
            fsm,
            looping = false,
            stopped = false,
            listeningForJob = false, // if true, this means we're listening for job updates
            awaitingLog = false, // if true, there's a log request fired that we're awaiting
            requestLoop = null, // the timeout object
            scrollToEndOnNext = false;

        // VIEW ACTIONS

        function scheduleNextRequest() {
            if (!looping) {
                return;
            }
            requestLoop = window.setTimeout(() => {
                requestLatestJobLog();
            }, loopFrequency);
        }

        function stopAutoFetch() {
            looping = false;
            if (ui) {
                ui.hideElement('spinner');
            }
        }

        /**
         * Starts the autofetch loop. After the first request, this starts a timeout that calls it again.
         */
        function startAutoFetch() {
            if (looping || stopped) {
                return;
            }
            const { state } = fsm.getCurrentState();
            if (state.mode === 'active' && state.auto) {
                looping = true;
                fsm.newState({ mode: 'active', auto: true });
                // stop the current timer if we have one.
                if (requestLoop) {
                    clearTimeout(requestLoop);
                }
                requestLatestJobLog();
            }
        }

        /**
         * Start automatically fetching logs - triggered by hitting the play button.
         */
        function doPlayLogs() {
            fsm.updateState({
                auto: true,
            });
            stopped = false;
            startAutoFetch();
        }

        /**
         * Stop automatically fetching logs - triggered by hitting the stop button.
         */
        function doStopLogs() {
            fsm.updateState({
                auto: false,
            });
            stopped = true;
            stopAutoFetch();
            if (requestLoop) {
                clearTimeout(requestLoop);
            }
        }

        /**
         * Requests numLines (set in the factory method) log lines starting from the given firstLine.
         * @param {int} firstLine
         */
        function requestJobLog(firstLine) {
            ui.showElement('spinner');
            awaitingLog = true;
            runtime.bus().emit('request-job-log', {
                jobId: jobId,
                options: {
                    first_line: firstLine,
                },
            });
        }

        function requestLatestJobLog() {
            // only while job is running
            // load numLines at a time
            // otherwise load entire log
            scrollToEndOnNext = true;
            awaitingLog = true;
            ui.showElement('spinner');
            runtime.bus().emit('request-latest-job-log', {
                jobId: jobId,
                options: {},
            });
        }

        /**
         * Scroll to the top of the job log
         */
        function doFetchFirstLogChunk() {
            doStopLogs();
            requestJobLog(0);
            getLogPanel().scrollTo(0, 0);
        }

        /**
         * scroll to the bottom of the job log
         */
        function doFetchLastLogChunk() {
            doStopLogs();
            requestLatestJobLog();
        }

        /**
         * toggle the viewer class to switch between standard and expanded versions
         */
        function toggleViewerSize() {
            const logContentClassList = getLogPanel().classList;
            let inactiveClass;
            if (logContentClassList.contains(logContentStandardClass)) {
                logContentClass = logContentExpandedClass;
                inactiveClass = logContentStandardClass;
            } else {
                logContentClass = logContentStandardClass;
                inactiveClass = logContentExpandedClass;
            }
            logContentClassList.add(logContentClass);
            logContentClassList.remove(inactiveClass);
        }

        // VIEW
        /**
         * builds contents of panel-heading div
         * @param {??} events
         */
        function renderControls(events) {
            return div(
                {
                    dataElement: 'header',
                    class: `${cssBaseClass}__controls`,
                },
                [
                    button(
                        {
                            class: 'btn btn-sm btn-default',
                            dataButton: 'expand',
                            dataToggle: 'tooltip',
                            dataPlacement: 'top',
                            title: 'Toggle log viewer size',
                            id: events.addEvent({
                                type: 'click',
                                handler: toggleViewerSize,
                            }),
                        },
                        [span({ class: 'fa fa-expand' })]
                    ),
                    button(
                        {
                            class: 'btn btn-sm btn-default',
                            dataButton: 'play',
                            dataToggle: 'tooltip',
                            dataPlacement: 'top',
                            title: 'Start fetching logs',
                            id: events.addEvent({
                                type: 'click',
                                handler: doPlayLogs,
                            }),
                        },
                        [span({ class: 'fa fa-play' })]
                    ),
                    button(
                        {
                            class: 'btn btn-sm btn-default',
                            dataButton: 'stop',
                            dataToggle: 'tooltip',
                            dataPlacement: 'top',
                            title: 'Stop fetching logs',
                            id: events.addEvent({
                                type: 'click',
                                handler: doStopLogs,
                            }),
                        },
                        [span({ class: 'fa fa-stop' })]
                    ),
                    button(
                        {
                            class: 'btn btn-sm btn-default',
                            dataButton: 'top',
                            dataToggle: 'tooltip',
                            dataPlacement: 'top',
                            title: 'Jump to the top',
                            id: events.addEvent({
                                type: 'click',
                                handler: doFetchFirstLogChunk,
                            }),
                        },
                        [span({ class: 'fa fa-angle-double-up' })]
                    ),
                    button(
                        {
                            class: 'btn btn-sm btn-default',
                            dataButton: 'bottom',
                            dataToggle: 'tooltip',
                            dataPlacement: 'top',
                            title: 'Jump to the end',
                            id: events.addEvent({
                                type: 'click',
                                handler: doFetchLastLogChunk,
                            }),
                        },
                        [span({ class: 'fa fa-angle-double-down' })]
                    ),
                    div(
                        {
                            dataElement: 'spinner',
                            class: 'pull-right hidden',
                        },
                        [span({ class: 'fa fa-spinner fa-pulse fa-ex fa-fw' })]
                    ),
                ]
            );
        }

        /**
         * This is a step toward having scrollahead/scrollbehind. It doesn't work right, and we
         * have to move on, but I'm leaving this in here for now.
         * There's something minor that I'm missing, I think, about how the scrolling gets
         * managed.
         * @param {ScrollEvent} e
         */
        function handlePanelScrolling(e) {
            const panel = getLogPanel();
            // if scroll is at the bottom, and there are more lines,
            // get the next chunk.
            if (panel.scrollTop === panel.scrollHeight - panel.offsetHeight) {
                const curLast = model.getItem('lastLine');
                if (curLast < model.getItem('totalLines')) {
                    requestJobLog(curLast);
                }
            }
            // if it's at the top, and we're not at line 0, get
            // the previous chunk.
            else if (panel.scrollTop === 0) {
                const curFirst = model.getItem('firstLine');
                if (curFirst > 0) {
                    const reqLine = Math.max(0, curFirst - numLines);
                    if (reqLine < curFirst) {
                        requestJobLog(reqLine);
                    }
                }
            }
        }

        /**
         * builds contents of panel-body class
         */
        function renderLayout() {
            const events = Events.make(),
                content = div(
                    {
                        dataElement: 'kb-log',
                        class: `${cssBaseClass}__container`,
                    },
                    [
                        renderControls(events),
                        div({
                            dataElement: 'log-panel',
                            class: logContentClass,
                        }),
                    ]
                );

            return {
                content: content,
                events: events,
            };
        }

        /**
         * build and return div that displays
         * individual job log line
         * <div class="kblog-line">
         *     <div class="kblog-num-wrapper">
         *        <div class="kblog-line-num">###</span>
         *        <div class="kblog-text">foobarbaz</span>
         *     </div>
         * </div>
         * @param {object} line
         */
        function buildLine(line) {
            // a single line in the log panel
            const kblogLine = document.createElement('div');
            kblogLine.classList.add(`${cssBaseClass}__line_container`);

            // wrapper to allow flex styling
            const wrapperDiv = document.createElement('div');
            wrapperDiv.classList.add(`${cssBaseClass}__flex_wrapper`);

            // line number
            const numDiv = document.createElement('div');
            numDiv.classList.add(`${cssBaseClass}__line_number`);
            const lineNumber = document.createTextNode(line.lineNumber || '');
            numDiv.appendChild(lineNumber);

            // the log line text
            const textDiv = document.createElement('div');
            textDiv.classList.add(`${cssBaseClass}__line_text`);
            const lineText = document.createTextNode(line.text);
            textDiv.appendChild(lineText);

            if (line.isError) {
                kblogLine.classList.add(`${cssBaseClass}__line_container--error`);
                numDiv.classList.add(`${cssBaseClass}__line_number--error`);
                textDiv.classList.add(`${cssBaseClass}__line_text--error`);
            }

            // append line number and text
            wrapperDiv.appendChild(numDiv);
            wrapperDiv.appendChild(textDiv);
            // append wrapper to line div
            kblogLine.appendChild(wrapperDiv);

            return kblogLine;
        }

        function getLogPanel() {
            return ui.getElement('log-panel');
        }

        /**
         * onUpdate callback function (under model)
         */
        function render() {
            const lines = model.getItem('lines');

            if (lines && lines.length > 0) {
                const panel = getLogPanel();
                panel.innerHTML = '';
                lines.forEach((line) => panel.appendChild(buildLine(line)));

                // if we're autoscrolling, scroll to the bottom
                if (fsm.getCurrentState().state.auto || scrollToEndOnNext) {
                    panel.scrollTo(0, panel.lastChild.offsetTop);
                    scrollToEndOnNext = false;
                }
                return;
            }
            ui.setContent('log-panel', 'No log entries to show.');
        }

        function handleJobStatusUpdate(message) {
            // if the job is finished, we don't want to reflect
            // this in the ui, and disable play/stop controls.
            const jobStatus = message.jobState.status,
                { mode } = fsm.getCurrentState().state;
            let newState;

            switch (mode) {
                case 'new':
                    switch (jobStatus) {
                        case 'created':
                        case 'estimating':
                        case 'queued':
                            startJobUpdates();
                            newState = {
                                mode: 'queued',
                                auto: true,
                            };
                            break;
                        case 'running':
                            startJobUpdates();
                            startAutoFetch();
                            newState = {
                                mode: 'active',
                                auto: true,
                            };
                            break;
                        case 'completed':
                            requestJobLog(0);
                            stopJobUpdates();
                            newState = {
                                mode: 'complete',
                            };
                            break;
                        case 'error':
                            requestJobLog(0);
                            stopJobUpdates();
                            newState = {
                                mode: 'error',
                            };
                            break;
                        case 'terminated':
                            requestJobLog(0);
                            stopJobUpdates();
                            newState = {
                                mode: 'canceled',
                            };
                            break;
                        default:
                            stopJobUpdates();
                            console.error('Unknown job status', jobStatus, message);
                            throw new Error('Unknown job status ' + jobStatus);
                    }
                    break;
                case 'queued':
                    switch (jobStatus) {
                        case 'created':
                        case 'estimating':
                        case 'queued':
                            // no change
                            break;
                        case 'running':
                            newState = {
                                mode: 'active',
                                auto: true,
                            };
                            break;
                        // may happen that the job state jumps over in-progress...
                        case 'completed':
                            newState = {
                                mode: 'complete',
                            };
                            break;
                        case 'error':
                            newState = {
                                mode: 'error',
                            };
                            break;
                        case 'terminated':
                            newState = {
                                mode: 'canceled',
                            };
                            break;
                        default:
                            console.error('Unknown log status', jobStatus, message);
                            throw new Error('Unknown log status ' + jobStatus);
                    }
                    break;
                case 'active':
                    switch (jobStatus) {
                        case 'queued':
                            // this should not occur!
                            break;
                        case 'running':
                            startAutoFetch();
                            break;
                        case 'completed':
                            newState = {
                                mode: 'complete',
                            };
                            break;
                        case 'error':
                            newState = {
                                mode: 'error',
                            };
                            break;
                        case 'terminated':
                            newState = {
                                mode: 'canceled',
                            };
                            break;
                        default:
                            console.error('Unknown log status', jobStatus, message);
                            throw new Error('Unknown log status ' + jobStatus);
                    }
                    break;
                case 'canceled':
                    if (jobStatus === 'terminated') {
                        return;
                    }
                    console.error('Unexpected log status ' + jobStatus + ' for "canceled" state');
                    throw new Error('Unexpected log status ' + jobStatus + ' for "canceled" state');
                case 'complete':
                    // N.b. if the jobStatus is not 'completed',
                    // some sort of error has occurred
                    return;
                case 'error':
                    // N.b. if the jobStatus is not 'error' or 'suspend',
                    // some sort of error has occurred
                    return;
                default:
                    throw new Error('Mode ' + mode + ' not yet implemented');
            }
            if (newState) {
                fsm.newState(newState);
            }
        }

        function handleJobDoesNotExistUpdate(message) {
            fsm.newState({ mode: 'job-not-found' });
        }

        function handleJobLogs(message) {
            if (!awaitingLog) {
                return;
            }
            ui.hideElement('spinner');
            /* message has structure:
             * {
             *   jobId: string,
             *   latest: bool,
             *   logs: {
             *      first: int (first line of the log batch), 0-indexed
             *      job_id: string,
             *      latest: bool,
             *      max_lines: int (total logs available - if job is done, so is this),
             *      lines: [{
             *          is_error: 0 or 1,
             *          line: string,
             *          linepos: int, position in log. helpful!
             *          ts: timestamp
             *      }]
             *   }
             * }
             */
            awaitingLog = false;

            if (message.logs.lines.length !== 0) {
                const viewLines = message.logs.lines.map((line) => {
                    return {
                        text: line.line,
                        isError: line.is_error === 1 ? true : false,
                        lineNumber: line.linepos,
                    };
                });
                model.setItem('lines', viewLines);
                model.setItem('firstLine', message.logs.first + 1);
                model.setItem('lastLine', message.logs.first + viewLines.length);
                model.setItem('totalLines', message.logs.max_lines);
                render();
            }
            if (looping) {
                scheduleNextRequest();
            }
        }

        function startEventListeners() {
            let ev = runtime.bus().listen({
                channel: {
                    jobId: jobId,
                },
                key: {
                    type: 'job-logs',
                },
                handle: handleJobLogs,
            });
            listeners.push(ev);

            // An error may encountered during the job fetch on the back end. It is
            // reported as a job-comm-error, but translated by the jobs panel as a job-log-deleted
            // TODO: we may want to rethink this. It might be beneficial to emit this as the
            // original error, and let the widget sort it out? Or perhaps on the back end
            // have the error emitted as a specific message. It is otherwise a little difficult
            // to trace this.
            ev = runtime.bus().listen({
                channel: {
                    jobId: jobId,
                },
                key: {
                    type: 'job-log-deleted',
                },
                handle: function () {
                    stopAutoFetch();
                    render();
                },
            });
            listeners.push(ev);

            ev = runtime.bus().listen({
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
                    type: 'job-does-not-exist',
                },
                handle: handleJobDoesNotExistUpdate,
            });
            listeners.push(ev);
        }

        function stopEventListeners() {
            runtime.bus().removeListeners(listeners);
        }

        // LIFECYCLE API
        function renderFSM() {
            const state = fsm.getCurrentState();

            // Button state
            if (state.ui.buttons) {
                state.ui.buttons.enabled.forEach((_button) => {
                    ui.enableButton(_button);
                });
                state.ui.buttons.disabled.forEach((_button) => {
                    ui.disableButton(_button);
                });
            }

            // Element state
            if (state.ui.elements) {
                state.ui.elements.show.forEach((element) => {
                    ui.showElement(element);
                });
                state.ui.elements.hide.forEach((element) => {
                    ui.hideElement(element);
                });
            }
        }

        function doOnQueued(message) {
            const noLogYet = {
                lineNumber: '',
                text: 'Job is queued, logs will be available when the job is running.',
            };
            const line = buildLine(noLogYet);
            getLogPanel().appendChild(line);
        }

        function doExitQueued(message) {
            ui.setContent('kb-log.panel', '');
        }

        function doJobNotFound(message) {
            ui.setContent('kb-log.panel', div([p(['No job found; logs cannot be displayed'])]));
        }

        function initializeFSM() {
            // events emitted by the fsm.
            fsm = Fsm.make({
                states: appStates,
                initialState: {
                    mode: 'new',
                },
                onNewState: function () {
                    renderFSM();
                },
            });
            fsm.start();
            fsm.bus.on('on-active', () => {
                startAutoFetch();
            });
            fsm.bus.on('exit-active', () => {
                stopAutoFetch();
            });
            fsm.bus.on('on-canceled', () => {
                requestLatestJobLog();
                stopJobUpdates();
            });
            fsm.bus.on('exit-canceled', () => {
                //  nothing to do?
            });
            fsm.bus.on('on-queued', (message) => {
                doOnQueued(message);
            });
            fsm.bus.on('exit-queued', (message) => {
                doExitQueued(message);
            });
            fsm.bus.on('on-job-not-found', (message) => {
                doJobNotFound(message);
            });
        }

        function startJobUpdates() {
            runtime.bus().emit('request-job-update', {
                jobId: jobId,
            });
            listeningForJob = true;
        }

        function stopJobUpdates() {
            if (listeningForJob) {
                listeningForJob = false;
            }
        }

        /**
         * The main lifecycle event, called when its container node exists, and we want to start
         * running this widget.
         * This detaches itself first, if it exists, then recreates itself in its host node.
         * @param {object} arg - should have attributes:
         *   - node - a DOM node where it will be hosted.
         *   - jobId - string, a job id for this log
         */
        function start(arg) {
            detach(); // if we're alive, remove ourselves before restarting
            const hostNode = arg.node;
            if (!hostNode) {
                throw new Error('Requires a node to start');
            }
            jobId = arg.jobId;
            if (!jobId) {
                throw new Error('Requires a job id to start');
            }

            container = hostNode.appendChild(document.createElement('div'));
            ui = UI.make({ node: container });

            const layout = renderLayout();
            container.innerHTML = layout.content;
            layout.events.attachEvents(container);

            initializeFSM();
            renderFSM();
            startEventListeners();

            runtime.bus().emit('request-job-status', {
                jobId: jobId,
            });
            listeningForJob = true;
        }

        function stop() {
            stopEventListeners();
            stopJobUpdates();
            stopAutoFetch();
            if (requestLoop) {
                clearTimeout(requestLoop);
            }
            if (fsm) {
                fsm.stop();
            }
            stopped = false;
        }

        function detach() {
            stop();
            if (container) {
                container.remove();
            }
        }

        // API
        return Object.freeze({
            start: start,
            stop: stop,
            detach: detach,
        });
    }

    return {
        make: function () {
            return factory();
        },
    };
});
