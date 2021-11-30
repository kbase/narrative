/**
 *
 * Usage:
 * const viewer = new JobLogViewer({
 *      showHistory: true,
 *      logPollInterval: 250,
 * });
 * viewer.start({
 *     jobId: <some job id>,
 *     node: <a DOM node>
 * })
 *
 * viewer.stop()
 */
define([
    'bluebird',
    'common/runtime',
    'common/props',
    'common/ui',
    'common/fsm',
    'common/jobs',
    'common/html',
    'common/runClock',
    'common/errorDisplay',
    'util/developerMode',
], (Promise, Runtime, Props, UI, Fsm, Jobs, html, RunClock, ErrorDisplay, devMode) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        button = t('button'),
        span = t('span'),
        p = t('p'),
        cssBaseClass = 'kb-log',
        stateCssBaseClass = 'kb-job-state-viewer',
        logContentStandardClass = `${cssBaseClass}__content`,
        logContentExpandedClass = `${logContentStandardClass}--expanded`,
        LOG_CONTAINER = 'log-container',
        LOG_PANEL = 'log-panel',
        LOG_LINES = 'log-lines';

    let logContentClass = logContentStandardClass;

    const allButtons = ['expand', 'play', 'stop', 'top', 'bottom'];

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
                    disabled: allButtons,
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
                    mode: 'finished',
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
                    disabled: allButtons,
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
                    mode: 'finished',
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
                    enabled: ['expand', 'stop', 'top', 'bottom'],
                    disabled: ['play'],
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
                    mode: 'finished',
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
                    enabled: ['expand', 'play', 'top', 'bottom'],
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
                    mode: 'finished',
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
                mode: 'finished',
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
                            emit: 'on-finished',
                        },
                    ],
                },
                resume: {
                    messages: [
                        {
                            emit: 'on-finished',
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
                    disabled: allButtons,
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

    class JobLogViewerCore {
        constructor(config = {}) {
            this._init(config);
        }

        /**
         * Set up the Job Log Viewer class
         * @param {object} config
         */
        _init(config) {
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

            this.model = Props.make({
                data: {
                    lines: [],
                    firstLine: null,
                    lastLine: null,
                    totalLines: null,
                },
            });
            this.bus = config.jobManager ? config.jobManager.bus : Runtime.make().bus();
            this.showHistory = config.showHistory || false;
            this.logPollInterval = config.logPollInterval || 5000;
            this.developerMode = config.devMode || devMode.mode;
            this._resetVariables();
        }

        _resetVariables() {
            this.lastJobState = {};
            this.listenersByType = {};
            this.lastMode = null;
            this.requestLoop = null; // the timeout object
            this.state = {
                looping: false, // if true, the log viewer is automatically requesting log updates
                stopped: false, // if true, we have stopped automatically fetching logs
                listeningForJob: false, // if true, this means we're listening for job status updates
                awaitingLog: false, // if true, there's a log request fired that we're awaiting
                scrollToEndOnNext: false, // if true, the log viewer scrolls to keep up with incoming logs
            };
        }

        /**
         * The main lifecycle event, called when its container node exists, and we want to start
         * running this widget.
         * This detaches itself first, if it exists, then recreates itself in its host node.
         * @param {object} arg - should have attributes:
         *   - node - a DOM node where it will be hosted.
         *   - jobId - string, a job id for this log
         */
        start(arg) {
            const self = this;
            return Promise.try(() => {
                this.stop(); // if the log viewer had already been instantiated, shut it down
                this._resetVariables();

                this.container = arg.node;
                if (!this.container) {
                    throw new Error('Requires a node to start');
                }
                this.jobId = arg.jobId;
                if (!this.jobId) {
                    throw new Error('Requires a job id to start');
                }

                this.ui = UI.make({ node: this.container });
                this.container.innerHTML = this.renderLayout();

                // add event listeners to log control buttons
                this.container.querySelectorAll(`.kb-log__controls button`).forEach((el) => {
                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const dataButton = e.currentTarget.getAttribute('data-button');
                        const actions = {
                            expand: self.toggleViewerSize,
                            play: self.doPlayLogs,
                            stop: self.doStopLogs,
                            top: self.doScrollToTop,
                            bottom: self.doScrollToBottom,
                        };
                        if (actions[dataButton]) {
                            actions[dataButton].bind(self)();
                        }
                    });
                });

                this.initializeFSM();
                this.renderFsmState();
                this.startEventListeners();

                // if an initial job state object has been supplied, render it
                if (arg.jobState && Jobs.isValidJobStateObject(arg.jobState)) {
                    this.lastJobState = arg.jobState;
                }

                this.renderJobState(this.lastJobState || { job_id: this.jobId });

                this.bus.emit('request-job-status', {
                    jobId: this.jobId,
                });
                this.state.listeningForJob = true;
            }).catch((err) => {
                throw err;
            });
        }

        /**
         * stop the widget, cancel any pending requests, and
         * empty the widget container
         */
        stop() {
            this.stopEventListeners();
            this.stopJobStatusUpdates();
            this.stopLogAutoFetch();
            if (this.requestLoop) {
                clearTimeout(this.requestLoop);
            }
            if (this.fsm) {
                this.fsm.stop();
            }
            if (this.runClock) {
                this.runClock.stop();
            }
            this.state.stopped = false;
            if (this.container) {
                this.container.innerHTML = '';
            }
        }

        /**
         * request regular job status updates
         */
        startJobStatusUpdates() {
            this.bus.emit('request-job-updates-start', {
                jobId: this.jobId,
            });
            this.state.listeningForJob = true;
        }

        /**
         * stop regular job status updates
         */
        stopJobStatusUpdates() {
            this.state.listeningForJob = false;

            if (this.state.awaitingLog) {
                this.stopEventListeners(['job-status']);
            } else {
                this.stopEventListeners();
            }
        }

        /**
         * Requests log lines starting from the index supplied.
         * Executed when the job is in states 'completed', 'terminated' or 'error'
         * or if log auto fetch has been turned off
         *
         * @param {int} firstLine
         */
        requestJobLog(firstLine) {
            this.ui.showElement('spinner');
            this.state.awaitingLog = true;
            this.bus.emit('request-job-log', {
                jobId: this.jobId,
                options: {
                    first_line: firstLine,
                },
            });
        }

        /**
         * Request all log lines
         * Executed whilst the job is running
         */
        requestLatestJobLog() {
            this.state.scrollToEndOnNext = true;
            this.ui.showElement('spinner');
            this.state.awaitingLog = true;
            this.bus.emit('request-job-log', {
                jobId: this.jobId,
                options: {
                    latest: true,
                },
            });
        }

        /**
         * Add a job log request to the request loop
         */
        scheduleLogRequest() {
            if (!this.state.looping) {
                return;
            }
            this.requestLoop = window.setTimeout(() => {
                this.requestLatestJobLog();
            }, this.logPollInterval);
        }

        /**
         * Starts the autofetch loop. After the first request, this starts a timeout that calls it again.
         */
        startLogAutoFetch() {
            if (this.state.looping || this.state.stopped) {
                return;
            }
            const { state } = this.fsm.getCurrentState();
            if (state.mode === 'running' && state.auto) {
                this.state.looping = true;
                this.fsm.newState({ mode: 'running', auto: true });
                // stop the current timer if we have one.
                if (this.requestLoop) {
                    clearTimeout(this.requestLoop);
                }
                this.requestLatestJobLog();
            }
        }

        /**
         * Stop automatically fetching the log
         */
        stopLogAutoFetch() {
            this.state.looping = false;
            if (this.ui) {
                this.ui.hideElement('spinner');
            }
        }

        /**
         * Start automatically fetching logs - triggered by hitting the play button.
         */
        doPlayLogs() {
            this.fsm.updateState({
                auto: true,
            });
            this.state.stopped = false;
            this.startLogAutoFetch();
        }

        /**
         * Stop automatically fetching logs - triggered by hitting the stop button.
         */
        doStopLogs() {
            this.fsm.updateState({
                auto: false,
            });
            this.state.stopped = true;
            this.stopLogAutoFetch();
            if (this.requestLoop) {
                clearTimeout(this.requestLoop);
            }
        }

        // UI
        getLogPanel() {
            return this.ui.getElement(LOG_PANEL);
        }

        getLastLogLine() {
            return this.ui.getElement(LOG_LINES).lastChild;
        }

        doScrollToTop() {
            this.getLogPanel().scrollTo(0, 0);
        }

        doScrollToBottom() {
            this.getLogPanel().scrollTo(0, this.getLastLogLine().offsetTop);
        }

        /**
         * Scroll to the top of the job log
         */
        doFetchFirstLogChunk() {
            // check the FSM state
            // if the job is still queued or running, stop the current log fetch and get logs.
            if (!Jobs.isTerminalStatus(this.fsm.getCurrentState().state.mode)) {
                this.doStopLogs();
                this.requestJobLog(0);
            }
            this.getLogPanel().scrollTo(0, 0);
        }

        /**
         * scroll to the bottom of the job log
         */
        doFetchLastLogChunk() {
            // if the FSM is not in a terminal state, stop the log fetch
            // and get the latest logs
            if (!Jobs.isTerminalStatus(this.fsm.getCurrentState().state.mode)) {
                this.doStopLogs();
                this.requestLatestJobLog();
            }
            this.getLogPanel().scrollTo(0, this.getLastLogLine().offsetTop);
        }

        /**
         * This is a step toward having scrollahead/scrollbehind. It doesn't work right, and we
         * have to move on, but I'm leaving this in here for now.
         * There's something minor that I'm missing, I think, about how the scrolling gets
         * managed.
         * @param {ScrollEvent} e
        handlePanelScrolling(e) {
            const panel = getLogPanel();
            // if scroll is at the bottom, and there are more lines,
            // get the next chunk.
            if (panel.scrollTop === panel.scrollHeight - panel.offsetHeight) {
                const curLast = this.model.getItem('lastLine');
                if (curLast < this.model.getItem('totalLines')) {
                    requestJobLog(curLast);
                }
            }
            // if it's at the top, and we're not at line 0, get
            // the previous chunk.
            else if (panel.scrollTop === 0) {
                const curFirst = this.model.getItem('firstLine');
                if (curFirst > 0) {
                    const reqLine = Math.max(0, curFirst - numLines);
                    if (reqLine < curFirst) {
                        requestJobLog(reqLine);
                    }
                }
            }
        }
        */

        // UI Rendering

        /**
         * toggle the viewer class to switch between standard and expanded versions
         */
        toggleViewerSize() {
            const logContentClassList = this.getLogPanel().classList;
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
         * builds contents of panel-heading div with the log controls in it
         */
        renderControls() {
            const buttons = [
                {
                    action: 'expand',
                    title: 'Toggle log viewer size',
                    icon: 'expand',
                },
                {
                    action: 'play',
                    title: 'Start fetching logs',
                    icon: 'play',
                },
                {
                    action: 'stop',
                    title: 'Stop fetching logs',
                    icon: 'stop',
                },
                {
                    action: 'top',
                    title: 'Jump to the top',
                    icon: 'angle-double-up',
                },
                {
                    action: 'bottom',
                    title: 'Jump to the end',
                    icon: 'angle-double-down',
                },
            ];

            return div(
                {
                    dataElement: 'header',
                    class: `${cssBaseClass}__controls`,
                },
                [
                    buttons.map((b) => {
                        return button(
                            {
                                class: `btn btn-sm btn-default ${cssBaseClass}__log_button--${b.action}`,
                                dataToggle: 'tooltip',
                                dataPlacement: 'top',
                                title: b.title,
                                dataButton: b.action,
                            },
                            [span({ class: `fa fa-${b.icon}` })]
                        );
                    }),
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
        renderLayout() {
            const uniqueID = html.genId();
            let content = div(
                {
                    class: `${cssBaseClass}__container`,
                },
                [
                    div(
                        {
                            class: `${stateCssBaseClass}__container`,
                        },
                        [
                            div({
                                class: `${stateCssBaseClass}__status_line`,
                                dataElement: 'status-line',
                            }),
                        ]
                    ),
                    div(
                        {
                            class: `${cssBaseClass}__logs_container`,
                            dataElement: LOG_CONTAINER,
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
                                    this.renderControls(),
                                    div({
                                        dataElement: LOG_PANEL,
                                        class: logContentClass,
                                    }),
                                ]
                            ),
                        ]
                    ),
                ]
            );

            if (this.developerMode) {
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
                                        this.jobId
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

            return content;
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
        renderLogLine(line) {
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
        renderLog() {
            const lines = this.model.getItem('lines');
            if (!lines || lines.length === 0) {
                this.ui.setContent(LOG_PANEL, 'No log entries to show.');
                return;
            }

            const panel = this.getLogPanel();
            panel.innerHTML = t('ol')(
                {
                    class: `${cssBaseClass}__log_line_container`,
                    dataElement: LOG_LINES,
                },
                lines.map((line) => this.renderLogLine(line)).join('\n')
            );

            // if we're autoscrolling, scroll to the bottom
            if (this.fsm.getCurrentState().state.auto || this.state.scrollToEndOnNext) {
                panel.scrollTo(0, this.getLastLogLine().offsetTop);
                this.state.scrollToEndOnNext = false;
            }
        }

        /**
         * debugging function to display the current widget state
         */
        renderWidgetState() {
            if (this.developerMode) {
                this.ui.setContent(
                    'dev.widget-state',
                    JSON.stringify(
                        {
                            fsm: this.fsm.getCurrentState().state,
                            state: this.state,
                        },
                        null,
                        1
                    )
                );
            }
        }

        /**
         * Generate lines describing the job status
         *
         * @param {object} jobState
         * @returns {array[string]} array of HTML strings describing the job state
         */
        renderJobStatusLines(jobState) {
            const lines = Jobs.createJobStatusLines(jobState, this.showHistory);

            return lines.map((line) =>
                div(
                    {
                        class: `${stateCssBaseClass}__job_status_detail`,
                    },
                    line
                )
            );
        }

        /**
         * Render a div containing the current job status and error information
         *
         * @param {object} jobState
         */
        renderJobState(jobState) {
            const isError = jobState.status === 'error';

            if (this.runClock) {
                this.runClock.stop();
            }

            this.ui.setContent(
                'status-line',
                [
                    div(
                        {
                            class: `${stateCssBaseClass}__job_status_detail_container`,
                        },
                        this.renderJobStatusLines(jobState)
                    ),
                    div({
                        class: `${stateCssBaseClass}__error_container`,
                        dataElement: 'error-container',
                    }),
                ].join('\n')
            );

            if (this.developerMode) {
                this.ui.setContent('dev.job-state', JSON.stringify(jobState, null, 1));
                this.renderWidgetState();
            }

            if (jobState.status === 'running') {
                this.runClock = RunClock.make({
                    prefix: ', ',
                    suffix: ' ago',
                });
                this.runClock
                    .start({
                        node: this.ui.getElement('status-line.clock'),
                        startTime: jobState.running,
                    })
                    .catch((err) => {
                        console.warn('Clock problem:', err);
                        this.ui.setContent('status-line.clock', '');
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
                    node: this.ui.getElement('status-line.error-container'),
                });
            }
        }

        /**
         * Update the log control buttons
         * Also renders the widget state if debugging mode is on
         */
        renderFsmState() {
            const state = this.fsm.getCurrentState();
            this.renderWidgetState();
            // Button state
            if (state.ui.buttons) {
                // the log controls section may have been removed
                // so use try/catch to suppress any errors
                state.ui.buttons.enabled.forEach((_button) => {
                    try {
                        this.ui.enableButton(_button);
                    } catch (err) {
                        // eslint-disable-next-line no-empty
                    }
                });
                state.ui.buttons.disabled.forEach((_button) => {
                    try {
                        this.ui.disableButton(_button);
                    } catch (err) {
                        // eslint-disable-next-line no-empty
                    }
                });
            }
        }

        initializeFSM() {
            const self = this;
            this.fsm = Fsm.make({
                states: appStates,
                initialState: {
                    mode: 'new',
                },
                onNewState: () => {
                    self.renderFsmState();
                },
            });
            this.fsm.start();
            // events emitted by the fsm.
            this.fsm.bus.on('on-queued', () => {
                self.startJobStatusUpdates();
            });
            this.fsm.bus.on('on-running', () => {
                self.startLogAutoFetch();
            });
            this.fsm.bus.on('on-finished', () => {
                self.stopLogAutoFetch();
                self.stopJobStatusUpdates();
            });
            this.fsm.bus.on('on-job-not-found', () => {
                self.doJobNotFound();
            });
        }

        // FSM events

        doOnQueued() {
            this.ui.setContent(
                LOG_PANEL,
                p(['Job is queued; logs will be available when the job is running.'])
            );
        }

        doExitQueued() {
            // clear the content of the job panel to make way for logs
            this.ui.setContent(LOG_PANEL, '');
        }

        doJobNotFound() {
            // clear the log container
            this.ui.setContent(LOG_CONTAINER, '');
            this.state.awaitingLog = false;
            // slightly hacky way to get the appropriate job status lines
            this.renderJobState({
                job_id: '',
                status: 'does_not_exist',
            });
            this.stopJobStatusUpdates();
        }
    }

    const LogHandlerMixin = (Base) =>
        class extends Base {
            handleJobStatusUpdate(message) {
                // do nothing if the jobState object is not valid
                if (!Jobs.isValidJobStateObject(message.jobState)) {
                    return;
                }

                const jobStatus =
                        message.jobState && message.jobState.status
                            ? message.jobState.status
                            : null,
                    { mode } = this.fsm.getCurrentState().state;

                if (jobStatus === 'does_not_exist') {
                    this.fsm.newState({ mode: 'job-not-found' });
                    return;
                }

                // nothing has changed since last time.
                if (jobStatus === this.lastJobState.status && mode === this.lastMode) {
                    return;
                }

                this.lastJobState = message.jobState;
                this.lastMode = mode;
                const statusToMode = {
                    created: 'queued',
                    estimating: 'queued',
                    queued: 'queued',
                    running: 'running',
                    completed: 'finished',
                    error: 'finished',
                    terminated: 'finished',
                };
                const newMode = statusToMode[jobStatus] ? statusToMode[jobStatus] : null;
                let newState;

                switch (mode) {
                    case 'new':
                        switch (newMode) {
                            case 'queued':
                                this.startJobStatusUpdates();
                                this.doOnQueued();
                                newState = {
                                    mode: 'queued',
                                    auto: true,
                                };
                                break;
                            case 'running':
                                this.startJobStatusUpdates();
                                this.startLogAutoFetch();
                                newState = {
                                    mode: jobStatus,
                                    auto: true,
                                };
                                break;
                            case 'finished':
                                this.requestJobLog(0);
                                this.stopJobStatusUpdates();
                                newState = {
                                    mode: 'finished',
                                };
                                break;
                            default:
                                this.stopJobStatusUpdates();
                                console.error('Unknown job status', jobStatus, message);
                                throw new Error(`Unknown job status ${jobStatus}`);
                        }
                        break;
                    case 'queued':
                        switch (newMode) {
                            case 'queued':
                                // no change
                                break;
                            case 'running':
                                this.doExitQueued();
                                newState = {
                                    mode: jobStatus,
                                    auto: true,
                                };
                                break;
                            case 'finished':
                                this.requestJobLog(0);
                                this.stopJobStatusUpdates();
                                newState = {
                                    mode: 'finished',
                                };
                                break;
                            default:
                                this.stopJobStatusUpdates();
                                console.error('Unknown job status', jobStatus, message);
                                throw new Error(`Unknown job status ${jobStatus}`);
                        }
                        break;
                    case 'running':
                        switch (newMode) {
                            case 'queued':
                                // this should not occur!
                                break;
                            case 'running':
                                this.startLogAutoFetch();
                                break;
                            case 'finished':
                                // the FSM turns off log fetch and status updates
                                newState = {
                                    mode: 'finished',
                                };
                                break;
                            default:
                                console.error('Unknown job status', jobStatus, message);
                                throw new Error(`Unknown job status ${jobStatus}`);
                        }
                        break;
                    case 'finished':
                        this.stopJobStatusUpdates();
                        // mode should be 'finished' for all statuses
                        // if not, some sort of error has occurred
                        return;
                    default:
                        console.error('Unknown job status', jobStatus, message);
                        throw new Error(`Unknown job status ${jobStatus}`);
                }
                if (newState) {
                    this.renderJobState(this.lastJobState);
                    this.fsm.newState(newState);
                }
            }

            handleJobLogs(message) {
                if (!this.state.awaitingLog) {
                    return;
                }

                this.ui.hideElement('spinner');
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
                this.state.awaitingLog = false;

                if (message.error) {
                    return this.handleLogDeleted(message);
                }
                if (message.logs.lines.length !== 0) {
                    const viewLines = message.logs.lines.map((line) => {
                        return {
                            text: line.line,
                            isError: line.is_error === 1 ? true : false,
                            lineNumber: line.linepos,
                        };
                    });
                    this.model.setItem('lines', viewLines);
                    this.model.setItem('firstLine', message.logs.first + 1);
                    this.model.setItem('lastLine', message.logs.first + viewLines.length);
                    this.model.setItem('totalLines', message.logs.max_lines);
                    this.renderLog();
                }
                if (this.state.looping) {
                    this.scheduleLogRequest();
                }
                // no longer listening for job => remove any existing event listeners
                if (!this.state.listeningForJob) {
                    this.stopEventListeners();
                }
            }

            handleLogDeleted(message) {
                this.stopLogAutoFetch();
                this.renderLog();
                this.state.awaitingLog = false;
                console.error(
                    `Error retrieving log for ${this.jobId}: ${JSON.stringify(
                        message.error,
                        null,
                        1
                    )}`
                );
            }
        };

    const EventListenerMixin = (Base) =>
        class extends Base {
            /**
             * set up the listeners for the log viewer
             */
            startEventListeners() {
                const handlers = {
                    'job-logs': this.handleJobLogs,
                    'job-status': this.handleJobStatusUpdate,
                };

                Object.keys(handlers).forEach((type) => {
                    // ensure that the correct `this` context is bound
                    const handle = handlers[type].bind(this);
                    this.listenersByType[type] = this.bus.listen({
                        channel: { jobId: this.jobId },
                        key: { type },
                        handle,
                    });
                }, this);
            }

            /**
             * Stop the specified listener(s) or all listeners. Listeners are specified as an array
             * of strings, which should be keys in the `listenersByType` object.
             *
             * If no arguments are supplied, all listeners will be removed.
             *
             * @param {array{string}} listeners
             */
            stopEventListeners(listeners = []) {
                if (!listeners.length) {
                    listeners = Object.keys(this.listenersByType);
                }
                this.bus.removeListeners(listeners.map((l) => this.listenersByType[l]));
            }
        };

    class JobLogViewer extends EventListenerMixin(LogHandlerMixin(JobLogViewerCore)) {}

    return {
        JobLogViewer,
        cssBaseClass,
        stateCssBaseClass,
    };
});
