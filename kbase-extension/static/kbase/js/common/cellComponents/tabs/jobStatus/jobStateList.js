define([
    'jquery',
    'bluebird',
    'common/runtime',
    'common/html',
    'common/jobs',
    './jobStateListRow',
    'jquery-dataTables',
], ($, Promise, Runtime, html, Jobs, JobStateListRow) => {
    'use strict';

    const t = html.tag,
        table = t('table'),
        thead = t('thead'),
        tr = t('tr'),
        th = t('th'),
        tbody = t('tbody'),
        i = t('i'),
        dataTablePageLength = 50,
        cssBaseClass = 'kb-job-status';

    function createTable() {
        return table(
            {
                class: `${cssBaseClass}__table container`,
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
                                        class: `${cssBaseClass}__table_head_cell col-sm-5`,
                                    },
                                    ['Object']
                                ),
                                th(
                                    {
                                        class: `${cssBaseClass}__table_head_cell col-sm-2`,
                                    },
                                    ['Status']
                                ),
                                th(
                                    {
                                        class: `${cssBaseClass}__table_head_cell col-sm-3`,
                                    },
                                    [
                                        // TODO: this will be a dropdown featuring
                                        // several options
                                        'CANCEL/RETRY ALL',
                                        i({
                                            class: `fa fa-caret-down kb-pointer ${cssBaseClass}__icon`,
                                        }),
                                    ]
                                ),
                                th(
                                    {
                                        class: `${cssBaseClass}__table_head_cell col-sm-2`,
                                    },
                                    ''
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
        const dataTable = $container.find('table').dataTable({
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
                    $('.dataTables_paginate').hide();
                }
            },
        });
        return dataTable;
    }

    function factory() {
        const widgetsById = {},
            runtime = Runtime.make(),
            listeners = [];

        let $container, tableBody;

        function startParamsListener(jobId) {
            listeners.push(
                runtime.bus().listen({
                    channel: {
                        jobId: jobId,
                    },
                    key: {
                        type: 'job-info',
                    },
                    handle: handleJobInfoUpdate,
                })
            );
        }

        function startJobListener(jobId) {
            listeners.push(
                runtime.bus().listen({
                    channel: {
                        jobId: jobId,
                    },
                    key: {
                        type: 'job-status',
                    },
                    handle: handleJobStatusUpdate,
                })
            );
        }

        /**
         * parse and update the row with job info
         * @param {Object} message
         */
        function handleJobInfoUpdate(message) {
            if (message.jobId && message.jobInfo && widgetsById[message.jobId]) {
                widgetsById[message.jobId].updateParams(message.jobInfo);
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
         */

        function createJobStateListRowWidget(jobState, jobIndex) {
            widgetsById[jobState.job_id] = JobStateListRow.make();
            widgetsById[jobState.job_id].start({
                node: createTableRow(tableBody, jobIndex),
                job: jobState,
                // this will be replaced once the job-info call runs
                name: jobState.description || 'Child Job ' + (jobIndex + 1),
            });
        }

        function start(args) {
            return Promise.try(() => {
                const requiredArgs = ['node', 'jobState'];
                if (!requiredArgs.every((arg) => arg in args && args[arg])) {
                    throw new Error(
                        'start argument must have these keys: ' + requiredArgs.join(', ')
                    );
                }
                $container = $(args.node);
                $container.addClass([`${cssBaseClass}__container`]);
                $container.append($(createTable()));
                [tableBody] = $container.find('tbody');
                const jobState = Jobs.updateJobModel(args.jobState);

                return Promise.try(() => {
                    jobState.child_jobs.forEach((childJob, index) => {
                        createJobStateListRowWidget(childJob, index);
                    });
                }).then(() => {
                    renderTable($container, jobState.child_jobs.length);

                    // TODO: depending on which strategy we use for updating the job status
                    // table, we can remove either the parent listener or that for the
                    // child jobs
                    startJobListener(jobState.job_id);

                    jobState.child_jobs.forEach((childJob) => {
                        startJobListener(childJob.job_id);
                        // populate the params for the child jobs
                        startParamsListener(childJob.job_id);
                        runtime.bus().emit('request-job-info', {
                            jobId: childJob.job_id,
                            // TODO: check whether this param is required in ee2.5
                            // parentJobId: jobState.job_id,
                        });
                    });
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                runtime.bus().removeListeners(listeners);
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
