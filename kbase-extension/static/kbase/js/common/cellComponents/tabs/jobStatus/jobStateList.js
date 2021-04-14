define([
    'jquery',
    'bluebird',
    'common/events',
    'common/html',
    'common/jobs',
    'common/runtime',
    './jobStateListRow',
    'jquery-dataTables',
], ($, Promise, Events, html, Jobs, Runtime, JobStateListRow) => {
    'use strict';

    const t = html.tag,
        table = t('table'),
        thead = t('thead'),
        tr = t('tr'),
        th = t('th'),
        tbody = t('tbody'),
        span = t('span'),
        button = t('button'),
        ul = t('ul'),
        li = t('li'),
        div = t('div'),
        dataTablePageLength = 50,
        cssBaseClass = 'kb-job-status';

    function createActionsDropdown(events) {
        // each button has an action, either 'cancel' or 'retry',
        // and a target, which refers to the status of the jobs
        // that the action will be performed upon.

        const actionArr = [
            {
                label: 'Cancel queued jobs',
                action: 'cancel',
                target: 'queued',
            },
            {
                label: 'Cancel running jobs',
                action: 'cancel',
                target: 'running',
            },
            {
                label: 'Retry cancelled jobs',
                action: 'retry',
                target: 'terminated',
            },
            {
                label: 'Retry failed jobs',
                action: 'retry',
                target: 'error',
            },
        ];
        const uniqueId = html.genId();
        return div(
            {
                class: `${cssBaseClass}__dropdown dropdown`,
            },
            [
                button(
                    {
                        id: uniqueId,
                        type: 'button',
                        dataToggle: 'dropdown',
                        ariaHaspopup: true,
                        ariaExpanded: false,
                        ariaLabel: 'Job options',
                        class: `btn btn-default ${cssBaseClass}__dropdown_header`,
                    },
                    [
                        'Cancel / retry all',
                        span({
                            class: `fa fa-caret-down kb-pointer ${cssBaseClass}__icon`,
                        }),
                    ]
                ),
                ul(
                    {
                        class: `${cssBaseClass}__dropdown-menu dropdown-menu`,
                        ariaLabelledby: uniqueId,
                    },
                    actionArr.map((actionObj) => {
                        return li(
                            {
                                class: `${cssBaseClass}__dropdown-menu-item`,
                            },
                            button(
                                {
                                    class: `${cssBaseClass}__dropdown-menu-item-link--${actionObj.action}`,
                                    type: 'button',
                                    title: actionObj.label,
                                    // TODO: add action listener and implementation here
                                    id: events.addEvent({
                                        type: 'click',
                                        handler: () => {
                                            console.log('CLICK!');
                                        },
                                    }),
                                    dataAction: actionObj.action,
                                    dataTarget: actionObj.target,
                                },
                                actionObj.label
                            )
                        );
                    })
                ),
            ]
        );
    }

    function createTable() {
        return table(
            {
                class: `${cssBaseClass}__table`,
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
    function renderTable($container, rowCount) {
        return $container.find('table').dataTable({
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
                    $container.find('.dataTables_paginate').hide();
                }
            },
        });
    }

    function factory() {
        const widgetsById = {},
            bus = Runtime.make().bus(),
            listeners = {};

        let $container, tableBody;

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

        function startJobListener(jobId) {
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

        /**
         * parse and update the row with job info
         * @param {Object} message
         */
        function handleJobInfoUpdate(message) {
            if (message.jobId && message.jobInfo && widgetsById[message.jobId]) {
                widgetsById[message.jobId].updateParams(message.jobInfo);
                bus.removeListener(listeners[`params__${message.jobId}`]);
            }
        }

        /**
         * Pass the job state to all row widgets
         * @param {Object} message
         */
        function handleJobStatusUpdate(message) {
            const jobState = Jobs.updateJobModel(message.jobState);

            if (jobState.child_jobs) {
                jobState.child_jobs.forEach((state) => {
                    widgetsById[state.job_id].updateState(state);
                });
            }

            if (jobState.job_id && widgetsById[jobState.job_id]) {
                widgetsById[jobState.job_id].updateState(jobState);
            }
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
                node: createTableRow(tableBody, jobIndex),
                jobState: jobState,
                // this will be replaced once the job-info call runs
                name: jobState.description || 'Child Job ' + (jobIndex + 1),
            });
        }

        /**
         *
         * @param {object} args  -- with keys
         *      node:     DOM node to attach to
         *      jobState: job state object
         *      includeParentJob: boolean; whether or not to add a parent job row
         */
        function start(args) {
            const requiredArgs = ['node', 'jobState'];
            if (!requiredArgs.every((arg) => arg in args && args[arg])) {
                throw new Error('start argument must have these keys: ' + requiredArgs.join(', '));
            }
            const events = Events.make({ node: args.node });
            $container = $(args.node);
            const actionDropdown = createActionsDropdown(events);

            $container.append($(actionDropdown + '\n' + createTable()));
            [tableBody] = $container.find('tbody');
            const jobState = Jobs.updateJobModel(args.jobState);

            return Promise.all(
                jobState.child_jobs.map((childJob, index) => {
                    createJobStateListRowWidget(childJob, index);
                })
            ).then(() => {
                renderTable($container, jobState.child_jobs.length);

                events.attachEvents();

                // TODO: depending on which strategy we use for updating the job status
                // table, we can remove either the parent listener or that for the
                // child jobs
                startJobListener(jobState.job_id);

                jobState.child_jobs.forEach((childJob) => {
                    startJobListener(childJob.job_id);
                    // populate the params for the child jobs
                    startParamsListener(childJob.job_id);
                    bus.emit('request-job-info', {
                        jobId: childJob.job_id,
                    });
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                bus.removeListeners(Object.keys(listeners));
            });
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: function () {
            return factory();
        },
        cssBaseClass: cssBaseClass,
    };
});
