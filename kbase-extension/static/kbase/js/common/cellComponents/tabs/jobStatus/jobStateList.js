define([
    'jquery',
    'bluebird',
    'common/html',
    'common/jobs',
    'common/runtime',
    './jobStateListRow',
    './jobActionDropdown',
    'util/developerMode',
    'jquery-dataTables',
], ($, Promise, html, Jobs, Runtime, JobStateListRow, JobActionDropdown, devMode) => {
    'use strict';

    const t = html.tag,
        table = t('table'),
        thead = t('thead'),
        tr = t('tr'),
        th = t('th'),
        tbody = t('tbody'),
        div = t('div'),
        dataTablePageLength = 50,
        cssBaseClass = 'kb-job-status';

    function createTable() {
        return table(
            {
                class: `${cssBaseClass}__table`,
                caption: 'Job Status',
            },
            [
                thead(
                    {
                        class: `${cssBaseClass}__table_head`,
                    },
                    [
                        tr(
                            {
                                class: `${cssBaseClass}__table_head_row`,
                            },
                            [
                                th(
                                    {
                                        class: `${cssBaseClass}__table_head_cell--object`,
                                    },
                                    'Object'
                                ),
                                th(
                                    {
                                        class: `${cssBaseClass}__table_head_cell--status`,
                                    },
                                    'Status'
                                ),
                                th(
                                    {
                                        class: `${cssBaseClass}__table_head_cell--action`,
                                    },
                                    'Action'
                                ),
                                th(
                                    {
                                        class: `${cssBaseClass}__table_head_cell--log-view`,
                                    },
                                    'Status details'
                                ),
                            ]
                        ),
                    ]
                ),
                tbody({
                    class: `${cssBaseClass}__table_body`,
                }),
            ]
        );
    }

    function createTableRow(tableBody, id) {
        const newRow = document.createElement('tr');
        newRow.setAttribute('data-element-job-id', id);
        newRow.classList.add(`${cssBaseClass}__row`);
        return tableBody.appendChild(newRow);
    }

    // Convert the table to a datatable object to get functionality
    function renderTable(container, rowCount) {
        return $(container.querySelector('table')).dataTable({
            searching: false,
            pageLength: dataTablePageLength,
            lengthChange: false,
            columnDefs: [
                {
                    // action row should not be orderable
                    targets: 2,
                    orderable: false,
                },
                {
                    // logs row should not be orderable
                    targets: 3,
                    orderable: false,
                },
            ],
            fnDrawCallback: () => {
                // Hide pagination controls if length is less than or equal to table length
                if (rowCount <= dataTablePageLength) {
                    $(container.querySelector('.dataTables_paginate')).hide();
                }
            },
        });
    }

    /**
     * create a job state list instance
     *
     * the config should be an object with a property 'jobManager', which executes
     * the job actions available as part of the job status table, and 'model', the
     * Props object from the parent cell with information about job execution state
     *
     * @param {object} config
     * @returns jobStateList instance
     */
    function factory(config) {
        const widgetsById = {},
            bus = Runtime.make().bus(),
            listeners = {},
            { jobManager, model } = config,
            developerMode = config.devMode || devMode.mode;

        if (!model || !model.getItem('exec.jobs.byId')) {
            throw new Error('Cannot start JobStateList without a jobs object in the config');
        }

        let container, tableBody, dropdownWidget;

        /**
         * Execute an action for a single job
         *
         * @param {event} e - event
         *
         * The target element's "data-" properties encode the action to be performed:
         *
         * - data-action - "cancel", "retry", or "go-to-results"
         * - data-target - the job ID of the job to perform the action on
         */
        function doSingleJobAction(e) {
            const el = e.target;
            e.stopPropagation();
            const action = el.getAttribute('data-action'),
                target = el.getAttribute('data-target');

            if (['cancel', 'retry', 'go-to-results'].includes(action)) {
                if (action === 'go-to-results') {
                    // switch to results tab
                    return jobManager.viewResults(target);
                }
                return jobManager[`${action}Job`](target);
            }
        }

        function startParamsListener(jobId) {
            listeners[`params__${jobId}`] = bus.listen({
                channel: {
                    jobId: jobId,
                },
                key: {
                    type: 'job-info',
                },
                handle: handleJobInfoUpdate,
            });
        }

        function startStatusListener(jobId) {
            listeners[`status__${jobId}`] = bus.listen({
                channel: {
                    jobId: jobId,
                },
                key: {
                    type: 'job-status',
                },
                handle: handleJobStatusUpdate,
            });
        }

        function startJobDoesNotExistListener(jobId) {
            listeners[`doesNotExist__${jobId}`] = bus.listen({
                channel: {
                    jobId: jobId,
                },
                key: {
                    type: 'job-does-not-exist',
                },
                handle: () => {
                    ['params', 'status'].forEach((type) => {
                        if (listeners[`${type}__${jobId}`]) {
                            bus.removeListener(listeners[`${type}__${jobId}`]);
                            delete listeners[`${type}__${jobId}`];
                        }
                    });
                    handleJobStatusUpdate({
                        jobState: {
                            job_id: jobId,
                            status: 'does_not_exist',
                            created: 0,
                        },
                    });
                },
            });
        }

        /**
         * parse and update the row with job info
         * @param {Object} message
         */
        function handleJobInfoUpdate(message) {
            if (message.jobId && message.jobInfo && widgetsById[message.jobId]) {
                widgetsById[message.jobId].updateParams(message.jobInfo);
                bus.removeListener(listeners[`params__${message.jobId}`]);
                delete listeners[`params__${message.jobId}`];
            }
        }

        /**
         * Pass the job state to all row widgets
         * @param {Object} message
         */
        function handleJobStatusUpdate(message) {
            const jobState = message.jobState;
            if (!Jobs.isValidJobStateObject(jobState)) {
                return;
            }

            const jobId = jobState.job_id;
            const status = jobState.status;

            // remove listeners if appropriate
            if (listeners[`doesNotExist__${jobId}`]) {
                bus.removeListener(listeners[`doesNotExist__${jobId}`]);
                delete listeners[`doesNotExist__${jobId}`];
            }
            if (Jobs.isTerminalStatus(status)) {
                bus.removeListener(listeners[`status__${jobId}`]);
                delete listeners[`status__${jobId}`];
            }

            // check if the status has changed; if not, ignore this update
            const previousStatus = model.getItem(`exec.jobs.byId.${jobId}.status`);
            if (status === previousStatus) {
                return;
            }

            // otherwise, update the model using the jobState object
            jobManager.updateModel([jobState]);

            if (widgetsById[jobId]) {
                // update the row widget
                widgetsById[jobId].updateState(jobState);
            }
            dropdownWidget.updateState();
        }

        /**
         * Creates a job state widget and puts it in the widgetsById object, keyed by the jobId.
         *
         * @param {object} jobState  -- jobState object, containing jobID, status, etc.
         * @param {int}    jobIndex
         * @returns {Promise} started job row instance
         */

        function createJobStateListRowWidget(jobState, jobIndex) {
            widgetsById[jobState.job_id] = JobStateListRow.make();
            // this returns a promise
            return widgetsById[jobState.job_id].start({
                node: createTableRow(tableBody, jobState.job_id),
                jobState: jobState,
                // this will be replaced once the job-info call runs
                name: jobState.description || jobState.job_id || 'Child Job ' + (jobIndex + 1),
                clickAction: doSingleJobAction,
            });
        }

        /**
         *
         * @param {object} args  -- with key
         *      node:     DOM node to attach to
         *
         * @returns {Promise} started JobStateList widget
         */
        function start(args) {
            const requiredArgs = ['node'];
            if (!requiredArgs.every((arg) => arg in args && args[arg])) {
                throw new Error('start argument must have these keys: ' + requiredArgs.join(', '));
            }

            const indexedJobs = model.getItem('exec.jobs.byId');
            if (!indexedJobs || !Object.keys(indexedJobs).length) {
                throw new Error('Must provide at least one job to show the job state list');
            }

            container = args.node;
            container.innerHTML = [
                div({
                    class: `${cssBaseClass}__dropdown_container`,
                }),
                createTable(),
            ].join('\n');

            tableBody = container.querySelector('tbody');
            const jobs = Object.values(indexedJobs);

            return Promise.all(
                jobs.map((jobState, index) => {
                    createJobStateListRowWidget(jobState, index);
                })
            )
                .then(() => {
                    // start the dropdown widget
                    dropdownWidget = JobActionDropdown.make(config);
                    return dropdownWidget.start({
                        node: container.querySelector(`.${cssBaseClass}__dropdown_container`),
                    });
                })
                .then(() => {
                    renderTable(container, jobs.length);

                    jobs.forEach((jobState) => {
                        startStatusListener(jobState.job_id);
                        startJobDoesNotExistListener(jobState.job_id);
                        // populate the job params
                        startParamsListener(jobState.job_id);
                        bus.emit('request-job-info', {
                            jobId: jobState.job_id,
                        });
                    });
                });
        }

        function stop() {
            return Promise.try(() => {
                bus.removeListeners(Object.keys(listeners));
                Object.keys(listeners).forEach((key) => {
                    delete listeners[key];
                });
                dropdownWidget.stop();
            });
        }

        if (developerMode) {
            return {
                start,
                stop,
                listeners,
                model,
            };
        }

        return {
            start,
            stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
        cssBaseClass: cssBaseClass,
    };
});
