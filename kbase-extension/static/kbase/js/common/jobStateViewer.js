/**
 *
 * Usage:
 * const viewer = new JobStateViewer({
 *      jobManager,
 *      showHistory: true,
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
    'common/errorDisplay',
    'common/html',
    'common/jobs',
    'common/jobCommMessages',
    'common/props',
    'common/runClock',
    'common/ui',
    'util/developerMode',
], (Promise, ErrorDisplay, html, Jobs, jcm, Props, RunClock, UI, devMode) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        span = t('span'),
        devContainerCssBaseClass = 'kb-dev__container',
        cssBaseClass = 'kb-job-state-viewer';

    /**
     * The entrypoint to this widget. This creates the job state viewer and initializes it.
     * Starting it is left as a lifecycle method for the caller.
     *
     * config options:
     *  jobManager    {object}  - required
     *  showHistory   {boolean} - whether job status lines should include history
     *                            (queue and run times)
     *  developerMode {boolean} - whether or not to enable developer mode, which
     *                            prints out extra debugging information
     */

    class JobStateViewerCore {
        constructor(config = {}) {
            this._init(config);
        }

        /**
         * Set up the Job State Viewer class
         * @param {object} config
         */
        _init(config) {
            if (!config.jobManager) {
                throw new Error('Requires a valid JobManager for initialisation');
            }
            this.jobManager = config.jobManager;
            this.bus = this.jobManager.bus;
            this.showHistory = config.showHistory || false;
            this.developerMode = config.devMode || devMode.mode;
            this.lastJobState = {};
        }

        /**
         * The main lifecycle event, called when its container node exists, and we want to start
         * running this widget.
         * This detaches itself first, if it exists, then recreates itself in its host node.
         * @param {object} arg - should have attributes:
         *   - node - a DOM node where it will be hosted.
         *   - jobId - string, a job id for this widget to track
         */
        start(arg) {
            return Promise.try(() => {
                this.stop(); // if the state viewer had already been instantiated, shut it down

                this.container = arg.node;
                if (!this.container) {
                    throw new Error('Requires a node to start');
                }
                this.jobId = arg.jobId;
                if (!this.jobId) {
                    throw new Error('Requires a job id to start');
                }

                if (
                    !this.jobManager ||
                    !('bus' in this.jobManager) ||
                    !('model' in this.jobManager)
                ) {
                    throw new Error('Requires a valid JobManager to start');
                }

                this.ui = UI.make({ node: this.container });
                this.container.innerHTML = this.renderLayout();

                this.addEventHandlers();

                // check whether a jobState is available
                this.lastJobState = this.jobManager.getJob(this.jobId);
                this.renderJobState(this.lastJobState || { job_id: this.jobId });

                this.bus.emit(jcm.MESSAGE_TYPE.STATUS, {
                    [jcm.PARAM.JOB_ID]: this.jobId,
                });
            });
        }

        /**
         * stop the widget, cancel any pending requests, and
         * empty the widget container
         */
        stop() {
            this.removeEventHandlers();
            if (this.runClock) {
                this.runClock.stop();
            }
            if (this.container) {
                this.container.innerHTML = '';
            }
        }

        /**
         * builds contents of panel-body class
         */
        renderLayout() {
            let content = div(
                {
                    class: `${cssBaseClass}__container`,
                },
                [
                    div({
                        class: `${cssBaseClass}__status_line`,
                        dataElement: 'status-line',
                    }),
                ]
            );

            if (this.developerMode) {
                const devDiv = div(
                    {
                        dataElement: 'dev',
                        class: devContainerCssBaseClass,
                    },
                    [
                        div(
                            {
                                class: `${devContainerCssBaseClass}--jobId`,
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
                                class: `${devContainerCssBaseClass}--jobState`,
                            },
                            [
                                'Job state: ' +
                                    span({
                                        dataElement: 'job-state',
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
                        class: `${cssBaseClass}__job_status_detail`,
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
                            class: `${cssBaseClass}__job_status_detail_container`,
                        },
                        this.renderJobStatusLines(jobState)
                    ),
                    div({
                        class: `${cssBaseClass}__error_container`,
                        dataElement: 'error-container',
                    }),
                ].join('\n')
            );

            if (this.developerMode) {
                this.ui.setContent('dev.job-state', JSON.stringify(jobState, null, 1));
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
                            jobState,
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
    }

    const EventListenerMixin = (Base) =>
        class extends Base {
            /**
             * set up the event handlers for the state viewer
             */
            addEventHandlers() {
                const self = this;
                this.jobManager.addEventHandler(jcm.MESSAGE_TYPE.STATUS, {
                    [`jobStateViewer_status_${this.jobId}`]: (_, message) => {
                        if (message[this.jobId]) {
                            self.handleJobStatus.bind(self)(message[this.jobId]);
                        }
                    },
                });
            }

            /**
             * Remove all active event handlers from the job manager.
             */
            removeEventHandlers() {
                this.jobManager.removeEventHandler(
                    jcm.MESSAGE_TYPE.STATUS,
                    `jobStateViewer_status_${self.jobId}`
                );
            }

            handleJobStatus(message) {
                const { jobState } = message;
                // can't do anything unless there is a job state object
                if (!jobState) {
                    return;
                }
                const { status } = jobState;

                // nothing has changed since last time.
                if (
                    this.lastJobState &&
                    this.lastJobState.status &&
                    status === this.lastJobState.status
                ) {
                    return;
                }

                this.lastJobState = jobState;
                this.renderJobState(this.lastJobState);
            }
        };

    class JobStateViewer extends EventListenerMixin(JobStateViewerCore) {}

    return {
        JobStateViewer,
        cssBaseClass,
    };
});
