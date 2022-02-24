define([
    'bluebird',
    'common/html',
    'common/jobCommMessages',
    'common/jobs',
    'common/looper',
    'common/props',
    'common/ui',
], (Promise, html, jcm, Jobs, Looper, Props, UI) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        button = t('button'),
        span = t('span'),
        p = t('p'),
        cssBaseClass = 'kb-log',
        logContentStandardClass = `${cssBaseClass}__content`,
        logContentExpandedClass = `${logContentStandardClass}--expanded`,
        LOG_CONTAINER = 'log-container', // container for the whole widget
        LOG_PANEL = 'log-panel', // panel displayed by clicking on the "Logs" title
        LOG_LINES = 'log-lines'; // numbered list of log lines

    let logContentClass = logContentStandardClass;

    /**
     * The entrypoint to this widget. This creates the job log viewer and initializes it.
     *
     * config options:
     *  {object} jobManager -
     *  {int}    logPollInterval - time in ms for how frequently to check for new logs (optional)
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
            this.element = {
                LOG_CONTAINER, // container for the whole widget
                LOG_PANEL, // panel displayed by clicking on the "Logs" title
                LOG_LINES, // numbered list of log lines
            };

            this.messages = {
                REQUIRES_JOB_MANAGER: 'Requires a valid JobManager',
                REQUIRES_NODE: 'Requires a node to start',
                REQUIRES_JOB_ID: 'Requires a job ID to start',
                JOB_QUEUED: 'Job is queued; logs will be available when the job is running.',
                JOB_NOT_FOUND: 'Job not found',
                JOB_STATUS_UNKNOWN: Jobs.jobStatusUnknown,
                BATCH_JOB: 'Job logs are not available for batch jobs',
            };

            // UI buttons states
            this.buttonsByJobState = {
                default: {
                    buttons: {
                        enabled: [],
                        disabled: ['expand', 'play', 'stop', 'top', 'bottom'],
                    },
                },
                running_scrolling: {
                    buttons: {
                        enabled: ['expand', 'stop', 'top', 'bottom'],
                        disabled: ['play'],
                    },
                },
                running: {
                    buttons: {
                        enabled: ['expand', 'play', 'top', 'bottom'],
                        disabled: ['stop'],
                    },
                },
                terminal: {
                    buttons: {
                        enabled: ['top', 'bottom', 'expand'],
                        disabled: ['play', 'stop'],
                    },
                },
            };

            /* The data model for this widget contains all lines currently being shown, along with the indices for
             * the first and last lines known.
             * It also tracks the total lines currently available for the app, if returned.
             * Lines is a list of small objects. Each object
             * lines - list, each is a small object with keys (these are all post-processed after fetching):
             *      line - string, the line text
             *      is_error - 0 / 1; whether the line denotes an error
             *      ts - int timestamp
             *      linepos - int, what line this is
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

            if (!config.jobManager) {
                throw new Error(this.messages.REQUIRES_JOB_MANAGER);
            }
            this.jobManager = config.jobManager;
            this.bus = this.jobManager.bus;
            this.logPollInterval = config.logPollInterval || 2500;
            this.looper = new Looper({ pollInterval: this.logPollInterval });
            this._resetVariables();
        }

        _resetVariables() {
            this.lastJobState = null;
            this.state = {
                looping: false, // if true, the log viewer is automatically requesting log updates
                awaitingLog: false, // if true, there's a log request fired that we're awaiting
                scrollToEndOnNext: true, // if true, the log viewer scrolls to keep up with incoming logs
            };
        }

        // convert a job status into a 'mode'
        _statusToMode(status) {
            switch (status) {
                case 'created':
                case 'estimating':
                case 'queued':
                    return 'queued';

                case 'running':
                    return status;

                case 'completed':
                case 'error':
                case 'terminated':
                    return 'terminal';

                default:
                    return null;
            }
        }
    }

    /**
     * UI mixin: accessing and rendering various elements of the log viewer
     *
     * @param {object} Base
     */
    const UIMixin = (Base) =>
        class extends Base {
            // element access
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
                        title: 'Auto-scroll to newest log messages',
                        icon: 'play',
                    },
                    {
                        action: 'stop',
                        title: 'Stop auto-scrolling',
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
                            [
                                span({ class: 'fa fa-spinner fa-pulse fa-ex fa-fw' }),
                                'Fetching logs...',
                            ]
                        ),
                    ]
                );
            }

            /**
             * builds contents of panel-body class
             */
            renderLayout() {
                const uniqueID = html.genId();
                return div(
                    {
                        class: `${cssBaseClass}__container`,
                    },
                    [
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
                const errorSuffix = line.is_error ? '--error' : '';
                return t('li')(
                    {
                        class: `${cssBaseClass}__line_text${errorSuffix}`,
                    },
                    line.line
                );
            }

            /**
             * Render the log
             *
             * This adds any new content in model.getItem('lines') to rendered lines from the DOM.
             */
            renderLog() {
                const lines = this.model.getItem('lines');
                if (!lines || lines.length === 0) {
                    this.ui.setContent(LOG_PANEL, 'No log entries to show.');
                    this.renderButtons();
                    return;
                }

                const panel = this.getLogPanel();
                const renderedLines = panel.querySelectorAll('ol li');
                if (renderedLines && renderedLines.length) {
                    const olElement = panel.querySelector('ol');
                    // append the new lines to the existing log lines
                    const newLines = lines
                        .slice(renderedLines.length)
                        .map((line) => this.renderLogLine(line))
                        .join('\n');
                    olElement.innerHTML += newLines;
                } else {
                    panel.innerHTML = t('ol')(
                        {
                            class: `${cssBaseClass}__log_line_container`,
                            dataElement: LOG_LINES,
                        },
                        lines.map((line) => this.renderLogLine(line)).join('\n')
                    );
                }

                // if we're autoscrolling, scroll to the bottom
                if (this.state.scrollToEndOnNext) {
                    this.doScrollToBottom();
                }
                this.renderButtons();
            }

            /**
             * Update the log control buttons
             */
            renderButtons() {
                const previousStatus = (this.lastJobState && this.lastJobState.status) || null;
                let mode = this._statusToMode(previousStatus) || 'default';
                if (mode === 'running' && this.state.scrollToEndOnNext) {
                    mode = 'running_scrolling';
                }
                this._renderButtonState(mode);
            }

            _renderButtonState(mode) {
                // Button state
                const { buttons } = this.buttonsByJobState[mode];
                // the log controls section may have been removed
                // so use try/catch to suppress any errors
                buttons.enabled.forEach((_button) => {
                    try {
                        this.ui.enableButton(_button);
                    } catch (err) {
                        // eslint-disable-next-line no-empty
                    }
                });
                buttons.disabled.forEach((_button) => {
                    try {
                        this.ui.disableButton(_button);
                    } catch (err) {
                        // eslint-disable-next-line no-empty
                    }
                });
            }
        };

    const ControllerMixin = (Base) =>
        class extends Base {
            /* Job requests */

            /**
             * Requests log lines starting from the last line
             * in the stored logs
             */
            requestJobLog() {
                this.ui.showElement('spinner');
                this.state.awaitingLog = true;
                const requestParams = {
                    [jcm.PARAM.JOB_ID]: this.jobId,
                };
                const lastLine = this.model.getItem('lastLine');
                if (lastLine) {
                    requestParams.first_line = lastLine;
                }
                this.bus.emit(jcm.MESSAGE_TYPE.LOGS, requestParams);
            }

            /**
             * Add a job log request to the request loop
             */
            scheduleLogRequest() {
                if (!this.state.looping) {
                    return;
                }
                const self = this;
                this.looper.scheduleRequest(self.requestJobLog.bind(self));
            }

            /**
             * Starts the autofetch loop. After the first request, this starts a timeout that calls it again.
             */
            startLogAutoFetch() {
                if (this.state.looping) {
                    // already dealt with; no changes needed
                    return;
                }
                const { status } = this.lastJobState;
                if (status && status === 'running') {
                    this.state.looping = true;

                    // clear any pending requests and request logs now
                    this.looper.clearRequest();
                    this.requestJobLog();
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
             * Turn on log window auto-scrolling to newest lines
             */
            doPlayLogs() {
                this.state.scrollToEndOnNext = true;
                this.startLogAutoFetch();
            }

            /**
             * Stop log window auto-scrolling to newest update
             */
            doStopLogs() {
                this.state.scrollToEndOnNext = false;
            }
        };

    const EventMixin = (Base) =>
        class extends Base {
            handleJobStatus(message) {
                const { jobState } = message;
                // can't do anything unless there is a job state object
                if (!jobState || !jobState.status) {
                    return;
                }

                // check if this is a batch job
                if (jobState.batch_job) {
                    this.lastJobState = jobState;
                    this.ui.setContent(LOG_PANEL, p(this.messages.BATCH_JOB));
                    this._renderButtonState('default');
                    return;
                }

                const { status } = jobState,
                    previousStatus =
                        this.lastJobState && this.lastJobState.status
                            ? this.lastJobState.status
                            : null;

                this.lastJobState = jobState;

                if (status === 'does_not_exist') {
                    this.ui.setContent(LOG_PANEL, p([this.messages.JOB_NOT_FOUND]));
                    this._renderButtonState('default');
                    this.stopLogAutoFetch();
                    this.state.awaitingLog = false;
                    this.looper.clearRequest();
                    return;
                }

                // nothing has changed since last time.
                if (status === previousStatus) {
                    return;
                }

                const newMode = this._statusToMode(status);
                const previousMode = this._statusToMode(previousStatus);

                if (newMode !== previousMode) {
                    switch (newMode) {
                        case 'queued':
                            this.ui.setContent(LOG_PANEL, p([this.messages.JOB_QUEUED]));
                            this._renderButtonState('default');
                            break;
                        case 'running':
                            // clear the content of the job panel to make way for logs
                            this.ui.setContent(LOG_PANEL, '');
                            this.startLogAutoFetch();
                            this._renderButtonState('running_scrolling');
                            break;
                        case 'terminal':
                            this.stopLogAutoFetch();
                            this.requestJobLog();
                            this._renderButtonState('terminal');
                            break;
                        // this should never happen
                        default:
                            console.error('Unknown job status', status, message);
                            throw new Error(`Unknown job status ${status}`);
                    }
                }
            }

            handleJobLogs(message) {
                if (!this.state.awaitingLog) {
                    return;
                }

                this.ui.hideElement('spinner');
                /* message has structure:
                 * {
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
                 * }
                 */
                this.state.awaitingLog = false;

                if (message.error) {
                    return this.handleLogError(message);
                }
                if (this.state.looping) {
                    this.scheduleLogRequest();
                }

                if (message.lines.length !== 0) {
                    const savedLogs = this.model.getRawObject();
                    // ensure that message.first is equal to or less than savedLogs.lastLine
                    if (!savedLogs.lastLine || message.first <= savedLogs.lastLine) {
                        // no need to update if we already have all the lines
                        if (message.first + message.lines.length <= savedLogs.lastLine) {
                            return;
                        }
                        savedLogs.lines.splice(
                            message.first,
                            message.lines.length,
                            ...message.lines
                        );
                        if (!savedLogs.firstLine) {
                            this.model.setItem('firstLine', message.first + 1);
                        }
                        this.model.setItem('lastLine', message.first + message.lines.length);
                        this.model.setItem('totalLines', message.max_lines);
                        this.model.setItem('lines', savedLogs.lines);
                        this.renderLog();
                    } else {
                        console.warn(
                            `ignoring log message with first line ${message.first}; saved logs from ${savedLogs.firstLine} to ${savedLogs.lastLine}`
                        );
                    }
                }
            }

            handleLogError(message) {
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

            /**
             * set up the event handlers for the log viewer
             */
            addEventHandlers() {
                const self = this;

                this.jobManager.addEventHandler(jcm.MESSAGE_TYPE.STATUS, {
                    [`jobLogViewer_status_${self.jobId}`]: (_, message) => {
                        if (message[this.jobId]) {
                            self.handleJobStatus.bind(self)(message[this.jobId]);
                        }
                    },
                });

                this.jobManager.addEventHandler(jcm.MESSAGE_TYPE.LOGS, {
                    [`jobLogViewer_logs_${self.jobId}`]: (_, message) => {
                        if (message[this.jobId]) {
                            self.handleJobLogs.bind(self)(message[this.jobId]);
                        }
                    },
                });
            }

            /**
             * Remove all active event handlers from the job manager.
             */
            removeEventHandlers() {
                this.jobManager.removeEventHandler(
                    jcm.MESSAGE_TYPE.LOGS,
                    `jobLogViewer_logs_${self.jobId}`
                );
                this.jobManager.removeEventHandler(
                    jcm.MESSAGE_TYPE.STATUS,
                    `jobLogViewer_status_${self.jobId}`
                );
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
                        throw new Error(this.messages.REQUIRES_NODE);
                    }
                    this.jobId = arg.jobId;
                    if (!this.jobId) {
                        throw new Error(this.messages.REQUIRES_JOB_ID);
                    }

                    if (
                        !this.jobManager ||
                        !('bus' in this.jobManager) ||
                        !('model' in this.jobManager)
                    ) {
                        throw new Error(this.messages.REQUIRES_JOB_MANAGER);
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
                    this.addEventHandlers();

                    // check whether a jobState is available
                    const jobState = this.jobManager.getJob(this.jobId) || { job_id: this.jobId };

                    // initial render
                    if (jobState && jobState.status) {
                        this.handleJobStatus({ jobState });
                    } else {
                        // some kind of 'await job info' message
                        this.ui.setContent(LOG_PANEL, p([this.messages.JOB_STATUS_UNKNOWN]));
                        this._renderButtonState('default');
                    }

                    this.bus.emit(jcm.MESSAGE_TYPE.STATUS, {
                        [jcm.PARAM.JOB_ID]: this.jobId,
                    });
                }).catch((err) => {
                    throw err;
                });
            }

            /**
             * stop the widget, cancel any pending requests, and
             * empty the widget container
             */
            stop() {
                this.removeEventHandlers();
                this.stopLogAutoFetch();
                this.looper.clearRequest();
                if (this.container) {
                    this.container.innerHTML = '';
                }
                return this.container;
            }
        };

    class SimpleLogViewer extends EventMixin(ControllerMixin(UIMixin(JobLogViewerCore))) {}

    return {
        SimpleLogViewer,
        cssBaseClass,
    };
});
