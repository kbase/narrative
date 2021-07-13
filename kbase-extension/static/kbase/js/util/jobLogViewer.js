/**
 *
 * Usage:
 * const viewer = JobLogViewer.make({
 *      showHistory: true,
 *      logPollInterval: 250,
 * });
 * viewer.start({
 *     jobId: <some job id>,
 *     node: <a DOM node>
 * })
 */
define([
    'bluebird',
    'common/runtime',
    'common/props',
    'common/ui',
    'common/events',
    'common/fsm',
    'common/jobs',
    'common/html',
    'common/runClock',
    'common/errorDisplay',
    'util/developerMode',
], (Promise, Runtime, Props, UI, Events, Fsm, Jobs, html, RunClock, ErrorDisplay, devMode) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        button = t('button'),
        span = t('span'),
        p = t('p'),
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
                    mode: 'running',
                    auto: true,
                },
                {
                    mode: 'completed',
                },
                {
                    mode: 'error',
                },
                {
                    mode: 'terminated',
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
                    mode: 'running',
                    auto: false,
                },
                {
                    mode: 'running',
                    auto: true,
                },
                {
                    mode: 'completed',
                },
                {
                    mode: 'terminated',
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
                mode: 'running',
                auto: true,
            },
            meta: {
                description: 'The job is currently running, receiving log updates automatically',
            },
            ui: {
                buttons: {
                    enabled: ['stop', 'expand'],
                    disabled: ['play', 'top', 'bottom'],
                },
            },
            next: [
                {
                    mode: 'running',
                    auto: false,
                },
                {
                    mode: 'running',
                    auto: true,
                },
                {
                    mode: 'completed',
                },
                {
                    mode: 'terminated',
                },
                {
                    mode: 'error',
                },
            ],
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-running',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-running',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-running',
                        },
                    ],
                },
            },
        },
        {
            state: {
                mode: 'running',
                auto: false,
            },
            meta: {
                description: 'The job is currently running, no automatic updates',
            },
            ui: {
                buttons: {
                    enabled: ['play', 'top', 'bottom', 'expand'],
                    disabled: ['stop'],
                },
            },
            next: [
                {
                    mode: 'running',
                    auto: true,
                },
                {
                    mode: 'running',
                    auto: false,
                },
                {
                    mode: 'completed',
                },
                {
                    mode: 'terminated',
                },
                {
                    mode: 'error',
                },
            ],
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'on-running-noauto',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-running-noauto',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-running-noauto',
                        },
                    ],
                },
            },
        },
        {
            state: {
                mode: 'completed',
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
                            emit: 'on-completed',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-completed',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-completed',
                        },
                    ],
                },
            },
        },
        {
            state: {
                mode: 'terminated',
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
                            emit: 'on-terminated',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-terminated',
                        },
                    ],
                },
                exit: {
                    messages: [
                        {
                            emit: 'exit-terminated',
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
        },
    ];

    /**
     * The entrypoint to this widget. This creates the job log viewer and initializes it.
     * Starting it is left as a lifecycle method for the caller.
     *
     * config options:
     *  showHistory   {boolean} - whether job status lines should include history
     *                            (queue and run times)
     *  logPollInterval {int}   - time in ms for how frequently to check for new logs
     *  developerMode {boolean} - whether or not to enable developer mode, which
     *                            prints out extra debugging information
     */
    function factory(config = {}) {
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
            bus = Runtime.make().bus(),
            listenersByType = {},
            { showHistory } = config,
            logPollInterval = config.logPollInterval || 5000,
            developerMode = config.devMode || devMode.mode;

        let container,
            jobId,
            lastJobState = {},
            lastMode,
            ui,
            fsm,
            runClock,
            looping = false,
            stopped = false,
            listeningForJob = false, // if true, this means we're listening for job updates
            awaitingLog = false, // if true, there's a log request fired that we're awaiting
            requestLoop = null, // the timeout object
            scrollToEndOnNext = false;

        function getLogPanel() {
            return ui.getElement('log-panel');
        }

        function getLastLogLine() {
            return ui.getElement('log-lines').lastChild;
        }

        // VIEW ACTIONS
        function scheduleLogRequest() {
            if (!looping) {
                return;
            }
            requestLoop = window.setTimeout(() => {
                requestLatestJobLog();
            }, logPollInterval);
        }

        function stopLogAutoFetch() {
            looping = false;
            if (ui) {
                ui.hideElement('spinner');
            }
        }

        /**
         * Starts the autofetch loop. After the first request, this starts a timeout that calls it again.
         */
        function startLogAutoFetch() {
            if (looping || stopped) {
                return;
            }
            const { state } = fsm.getCurrentState();
            if (state.mode === 'running' && state.auto) {
                looping = true;
                fsm.newState({ mode: 'running', auto: true });
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
            startLogAutoFetch();
        }

        /**
         * Stop automatically fetching logs - triggered by hitting the stop button.
         */
        function doStopLogs() {
            fsm.updateState({
                auto: false,
            });
            stopped = true;
            stopLogAutoFetch();
            if (requestLoop) {
                clearTimeout(requestLoop);
            }
        }

        /**
         * Requests log lines starting from the index supplied.
         * Executed when the job is in states 'completed', 'terminated' or 'error'
         * or if log auto fetch has been turned off
         *
         * @param {int} firstLine
         */
        function requestJobLog(firstLine) {
            ui.showElement('spinner');
            awaitingLog = true;
            bus.emit('request-job-log', {
                jobId: jobId,
                options: {
                    first_line: firstLine,
                },
            });
        }

        /**
         * Request all log lines
         * Executed whilst the job is running
         */
        function requestLatestJobLog() {
            scrollToEndOnNext = true;
            awaitingLog = true;
            ui.showElement('spinner');
            bus.emit('request-job-log', {
                jobId: jobId,
                options: {
                    latest: true,
                },
            });
        }

        /**
         * Scroll to the top of the job log
         */
        function doFetchFirstLogChunk() {
            // check the FSM state
            // if the job is still queued or running, stop the current log fetch and get logs.
            if (!Jobs.isTerminalStatus(fsm.getCurrentState().state.mode)) {
                doStopLogs();
                requestJobLog(0);
            }
            getLogPanel().scrollTo(0, 0);
        }

        /**
         * scroll to the bottom of the job log
         */
        function doFetchLastLogChunk() {
            // if the FSM is not in a terminal state, stop the log fetch
            // and get the latest logs
            if (!Jobs.isTerminalStatus(fsm.getCurrentState().state.mode)) {
                doStopLogs();
                requestLatestJobLog();
            }
            getLogPanel().scrollTo(0, getLastLogLine().offsetTop);
        }

        /**
         * This is a step toward having scrollahead/scrollbehind. It doesn't work right, and we
         * have to move on, but I'm leaving this in here for now.
         * There's something minor that I'm missing, I think, about how the scrolling gets
         * managed.
         * @param {ScrollEvent} e
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
        */

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
                            class: `pull-right hidden ${cssBaseClass}__spinner`,
                        },
                        [span({ class: 'fa fa-spinner fa-pulse fa-ex fa-fw' }), 'Fetching logs...']
                    ),
                ]
            );
        }

        /**
         * builds contents of panel-body class
         */
        function renderLayout() {
            const uniqueID = html.genId(),
                events = Events.make();
            let content = div(
                {
                    dataElement: 'kb-log',
                    class: `${cssBaseClass}__container`,
                },
                [
                    div(
                        {
                            class: `${cssBaseClass}__status_container`,
                        },
                        [
                            div({
                                class: `${cssBaseClass}__status_line`,
                                dataElement: 'status-line',
                            }),
                        ]
                    ),
                    div(
                        {
                            class: `${cssBaseClass}__logs_container`,
                            dataElement: 'log-container',
                        },
                        [
                            div(
                                {
                                    class: `${cssBaseClass}__logs_title collapsed`,
                                    role: 'button',
                                    dataToggle: 'collapse',
                                    dataTarget: '#' + uniqueID,
                                    ariaExpanded: 'false',
                                    ariaControls: uniqueID,
                                },
                                [span({}, ['Logs'])]
                            ),
                            div(
                                {
                                    class: `${cssBaseClass}__logs_content_panel collapse`,
                                    id: uniqueID,
                                },
                                [
                                    renderControls(events),
                                    div({
                                        dataElement: 'log-panel',
                                        class: logContentClass,
                                    }),
                                ]
                            ),
                        ]
                    ),
                ]
            );

            if (developerMode) {
                const devDiv = div(
                    {
                        dataElement: 'dev',
                        class: `${cssBaseClass}__dev_container`,
                    },
                    [
                        div(
                            {
                                class: `${cssBaseClass}__dev_container--jobId`,
                            },
                            [
                                'Job ID: ' +
                                    span(
                                        {
                                            dataElement: 'job-id',
                                        },
                                        jobId
                                    ),
                            ]
                        ),
                        div(
                            {
                                class: `${cssBaseClass}__dev_container--jobState`,
                            },
                            [
                                'Job state: ' +
                                    span({
                                        dataElement: 'job-state',
                                    }),
                            ]
                        ),
                        div(
                            {
                                class: `${cssBaseClass}__dev_container--fsmState`,
                            },
                            [
                                'Widget state: ' +
                                    span({
                                        dataElement: 'widget-state',
                                    }),
                            ]
                        ),
                    ]
                );
                content = div([devDiv, content]);
            }

            return {
                content: content,
                events: events,
                uniqueID: uniqueID,
            };
        }

        /**
         * render the HTML structure that displays
         * an individual job log line
         * <ol class="${cssBaseClass}__log_line_container">
         *    <li class="${cssBaseClass}__line_text">starting job</div>
         *    <li class="${cssBaseClass}__line_text">initialising variables</div>
         *    ...
         * </ol>
         * @param {object} line
         */
        function renderLogLine(line) {
            const errorSuffix = line.isError ? '--error' : '';
            return t('li')(
                {
                    class: `${cssBaseClass}__line_text${errorSuffix}`,
                },
                line.text
            );
        }

        /**
         * Render the log
         *
         * This replaces the log wholesale with the content of model.getItem('lines')
         * rather than keeping track of which lines have and haven't been rendered.
         */
        function renderLog() {
            const lines = model.getItem('lines');
            if (!lines || lines.length === 0) {
                ui.setContent('log-panel', 'No log entries to show.');
                return;
            }

            const panel = getLogPanel();
            panel.innerHTML = t('ol')(
                {
                    class: `${cssBaseClass}__log_line_container`,
                    dataElement: 'log-lines',
                },
                lines.map((line) => renderLogLine(line)).join('\n')
            );

            // if we're autoscrolling, scroll to the bottom
            if (fsm.getCurrentState().state.auto || scrollToEndOnNext) {
                panel.scrollTo(0, getLastLogLine().offsetTop);
                scrollToEndOnNext = false;
            }
        }

        /**
         * debugging function to display the current widget state
         */
        function renderWidgetState() {
            if (developerMode) {
                ui.setContent(
                    'dev.widget-state',
                    JSON.stringify(
                        {
                            fsm: fsm.getCurrentState().state,
                            looping: looping,
                            awaitingLog: awaitingLog,
                            listeningForJob: listeningForJob,
                        },
                        null,
                        1
                    )
                );
            }
        }

        function renderJobStatusLines(jobState) {
            const lines = Jobs.createJobStatusLines(jobState, showHistory);

            return lines.map((line) =>
                div(
                    {
                        class: `${cssBaseClass}__job_status_detail`,
                    },
                    line
                )
            );
        }

        function renderJobState(jobState) {
            const isError = jobState.status === 'error';

            if (runClock) {
                runClock.stop();
            }

            ui.setContent(
                'kb-log.status-line',
                [
                    div(
                        {
                            class: `${cssBaseClass}__job_status_detail_container`,
                        },
                        renderJobStatusLines(jobState)
                    ),
                    div({
                        class: `${cssBaseClass}__error_container`,
                        dataElement: 'error-container',
                    }),
                ].join('\n')
            );

            if (developerMode) {
                ui.setContent('dev.job-state', JSON.stringify(jobState, null, 1));
                renderWidgetState();
            }

            if (jobState.status === 'running') {
                runClock = RunClock.make({
                    prefix: ', ',
                    suffix: ' ago',
                });
                runClock
                    .start({
                        node: ui.getElement('kb-log.status-line.clock'),
                        startTime: jobState.running,
                    })
                    .catch((err) => {
                        console.warn('Clock problem:', err);
                        ui.setContent('kb-log.status-line.clock', '');
                    });
                return;
            }

            if (isError) {
                const errorModel = Props.make({
                    data: {
                        exec: {
                            jobState: jobState,
                        },
                    },
                });
                const errorContent = ErrorDisplay.make({
                    model: errorModel,
                });
                errorContent.start({
                    node: ui.getElement('kb-log.status-line.error-container'),
                });
            }
        }

        function handleJobStatusUpdate(message) {
            // do nothing if the jobState object is not valid
            if (!Jobs.isValidJobStateObject(message.jobState)) {
                return;
            }

            const jobStatus =
                    message.jobState && message.jobState.status ? message.jobState.status : null,
                { mode } = fsm.getCurrentState().state;

            // nothing has changed since last time.
            if (jobStatus === lastJobState.status && mode === lastMode) {
                return;
            }

            lastJobState = message.jobState;
            lastMode = mode;
            let newState;

            switch (mode) {
                case 'new':
                    switch (jobStatus) {
                        case 'created':
                        case 'estimating':
                        case 'queued':
                            startJobStatusUpdates();
                            doOnQueued();
                            newState = {
                                mode: 'queued',
                                auto: true,
                            };
                            break;
                        case 'running':
                            startJobStatusUpdates();
                            startLogAutoFetch();
                            newState = {
                                mode: jobStatus,
                                auto: true,
                            };
                            break;
                        case 'completed':
                        case 'error':
                        case 'terminated':
                            requestJobLog(0);
                            stopJobStatusUpdates();
                            newState = {
                                mode: jobStatus,
                            };
                            break;
                        default:
                            stopJobStatusUpdates();
                            console.error('Unknown job status', jobStatus, message);
                            throw new Error(`Unknown job status ${jobStatus}`);
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
                            doExitQueued();
                            newState = {
                                mode: jobStatus,
                                auto: true,
                            };
                            break;
                        case 'completed':
                        case 'error':
                        case 'terminated':
                            newState = {
                                mode: jobStatus,
                            };
                            requestJobLog(0);
                            stopJobStatusUpdates();
                            break;
                        default:
                            stopJobStatusUpdates();
                            console.error('Unknown job status', jobStatus, message);
                            throw new Error(`Unknown job status ${jobStatus}`);
                    }
                    break;
                case 'running':
                    switch (jobStatus) {
                        case 'created':
                        case 'estimating':
                        case 'queued':
                            // this should not occur!
                            break;
                        case 'running':
                            startLogAutoFetch();
                            break;
                        case 'completed':
                        case 'error':
                        case 'terminated':
                            // the FSM turns off log fetch and status updates
                            newState = {
                                mode: jobStatus,
                            };
                            break;
                        default:
                            console.error('Unknown job status', jobStatus, message);
                            throw new Error(`Unknown job status ${jobStatus}`);
                    }
                    break;
                case 'terminated':
                case 'completed':
                case 'error':
                    stopJobStatusUpdates();
                    // jobStatus should be 'completed' for mode 'completed',
                    // 'error' for mode 'error'
                    // 'terminated' for mode 'terminated'
                    // if not, some sort of error has occurred
                    return;
                default:
                    console.error('Unknown job status', jobStatus, message);
                    throw new Error(`Unknown job status ${jobStatus}`);
            }
            if (newState) {
                renderJobState(lastJobState);
                fsm.newState(newState);
            }
        }

        function handleJobDoesNotExistUpdate() {
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
                renderLog();
            }
            if (looping) {
                scheduleLogRequest();
            }
            // no longer listening for job => remove any existing event listeners
            if (!listeningForJob) {
                stopEventListeners();
            }
        }

        function startEventListeners() {
            listenersByType['job-logs'] = bus.listen({
                channel: {
                    jobId: jobId,
                },
                key: {
                    type: 'job-logs',
                },
                handle: handleJobLogs,
            });

            // An error may encountered during the job fetch on the back end. It is
            // reported as a job-comm-error, but translated by the jobs panel as a job-log-deleted
            // TODO: we may want to rethink this. It might be beneficial to emit this as the
            // original error, and let the widget sort it out? Or perhaps on the back end
            // have the error emitted as a specific message. It is otherwise a little difficult
            // to trace this.
            listenersByType['job-log-deleted'] = bus.listen({
                channel: {
                    jobId: jobId,
                },
                key: {
                    type: 'job-log-deleted',
                },
                handle: function (message) {
                    stopLogAutoFetch();
                    renderLog();
                    awaitingLog = false;
                    console.error(
                        `Error retrieving log for ${jobId}: ${JSON.stringify(message, null, 1)}`
                    );
                },
            });

            listenersByType['job-status'] = bus.listen({
                channel: {
                    jobId: jobId,
                },
                key: {
                    type: 'job-status',
                },
                handle: handleJobStatusUpdate,
            });

            listenersByType['job-does-not-exist'] = bus.listen({
                channel: {
                    jobId: jobId,
                },
                key: {
                    type: 'job-does-not-exist',
                },
                handle: handleJobDoesNotExistUpdate,
            });
        }

        /**
         * Stop the specified listener(s) or all listeners. Listeners are specified as an array
         * of strings, which should be keys in the `listenersByType` object.
         *
         * If no arguments are supplied, all listeners will be removed.
         *
         * @param {array{string}} listeners
         */
        function stopEventListeners(listeners = []) {
            if (!listeners.length) {
                listeners = Object.keys(listenersByType);
            }
            bus.removeListeners(listeners.map((l) => listenersByType[l]));
        }

        // LIFECYCLE API
        function renderFSM() {
            const state = fsm.getCurrentState();
            renderWidgetState();
            // Button state
            if (state.ui.buttons) {
                // the log controls section may have been removed
                // so use try/catch to suppress any errors
                state.ui.buttons.enabled.forEach((_button) => {
                    try {
                        ui.enableButton(_button);
                    } catch (err) {
                        // eslint-disable-next-line no-empty
                    }
                });
                state.ui.buttons.disabled.forEach((_button) => {
                    try {
                        ui.disableButton(_button);
                    } catch (err) {
                        // eslint-disable-next-line no-empty
                    }
                });
            }
        }

        function doOnQueued() {
            ui.setContent(
                'log-panel',
                p(['Job is queued; logs will be available when the job is running.'])
            );
        }

        function doExitQueued() {
            // clear the content of the job panel to make way for logs
            ui.setContent('log-panel', '');
        }

        function doJobNotFound() {
            // clear the log container
            ui.setContent('log-container', '');
            awaitingLog = false;
            // slightly hacky way to get the appropriate job status lines
            renderJobState({ job_state: 'does_not_exist' });
            stopJobStatusUpdates();
        }

        function initializeFSM() {
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
            // events emitted by the fsm.
            fsm.bus.on('on-running', () => {
                startLogAutoFetch();
            });
            fsm.bus.on('exit-running', () => {
                stopLogAutoFetch();
                stopJobStatusUpdates();
            });
            fsm.bus.on('on-job-not-found', () => {
                doJobNotFound();
            });
        }

        function startJobStatusUpdates() {
            bus.emit('request-job-update', {
                jobId: jobId,
            });
            listeningForJob = true;
        }

        function stopJobStatusUpdates() {
            listeningForJob = false;

            if (awaitingLog) {
                stopEventListeners(['job-status']);
            } else {
                stopEventListeners();
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
            return Promise.try(() => {
                container = arg.node;
                if (!container) {
                    throw new Error('Requires a node to start');
                }
                jobId = arg.jobId;
                if (!jobId) {
                    throw new Error('Requires a job id to start');
                }

                detach(); // if we're alive, remove ourselves before restarting
                ui = UI.make({ node: container });
                const layout = renderLayout();
                container.innerHTML = layout.content;
                layout.events.attachEvents(container);
                initializeFSM();
                renderFSM();
                startEventListeners();

                // if an initial job state object has been supplied, render it
                if (arg.jobState && Jobs.isValidJobStateObject(arg.jobState)) {
                    lastJobState = arg.jobState;
                }

                renderJobState(lastJobState || { job_id: jobId });

                bus.emit('request-job-status', {
                    jobId: jobId,
                });
                listeningForJob = true;
            }).catch((err) => {
                throw err;
            });
        }

        function stop() {
            stopEventListeners();
            stopJobStatusUpdates();
            stopLogAutoFetch();
            if (requestLoop) {
                clearTimeout(requestLoop);
            }
            if (fsm) {
                fsm.stop();
            }
            if (runClock) {
                runClock.stop();
            }
            stopped = false;
        }

        function detach() {
            stop();
            if (container) {
                container.innerHTML = '';
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
        make: function (config) {
            return factory(config);
        },
        cssBaseClass: cssBaseClass,
    };
});
