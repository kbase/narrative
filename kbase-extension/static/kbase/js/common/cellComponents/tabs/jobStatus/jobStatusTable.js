define([
    'jquery',
    'bluebird',
    'common/html',
    'common/jobs',
    'common/runtime',
    './jobActionDropdown',
    'util/jobLogViewer',
    'jquery-dataTables',
], ($, Promise, html, Jobs, Runtime, JobActionDropdown, JobLogViewer) => {
    'use strict';

    const t = html.tag,
        table = t('table'),
        thead = t('thead'),
        tr = t('tr'),
        th = t('th'),
        tbody = t('tbody'),
        div = t('div'),
        ul = t('ul'),
        li = t('li'),
        button = t('button'),
        span = t('span'),
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

    function renderParams(params) {
        // coerce to a string
        return ul(
            {
                class: `${cssBaseClass}__param_list`,
            },
            Object.keys(params)
                .sort()
                .map((key) => {
                    return li(
                        {
                            class: `${cssBaseClass}__param_item`,
                        },
                        [
                            span(
                                {
                                    class: `${cssBaseClass}__param_key`,
                                },
                                `${key}: `
                            ),
                            span(
                                {
                                    class: `${cssBaseClass}__param_value`,
                                },
                                `${params[key]}`
                            ),
                        ]
                    );
                })
        );
    }

    /**
     * create a job status table instance
     *
     * the config should be an object with a property 'jobManager', which executes
     * the job actions available as part of the job status table, and 'toggleTab',
     * a function used to view the results of finished jobs.
     *
     * @param {object} config
     * @returns jobStatusTable instance
     */
    function factory(config) {
        const widgetsById = {},
            bus = Runtime.make().bus(),
            { jobManager, toggleTab } = config;

        if (!jobManager.model || !jobManager.model.getItem('exec.jobs.byId')) {
            throw new Error('Cannot start JobStatusTable without a jobs object in the config');
        }

        let container, dropdownWidget, dataTable;

        /**
         * convert the table to a DataTable object to get sorting/paging functionality
         * @param {array} rows - table rows
         * @returns {DataTable} datatable object
         */
        function renderTable(rows) {
            const rowCount = rows.length;
            dataTable = $(container)
                .find('table')
                .dataTable({
                    data: rows,
                    rowId: (row) => {
                        return 'job_' + row.job_id;
                    },
                    searching: false,
                    pageLength: dataTablePageLength,
                    lengthChange: false,
                    columns: [
                        {
                            className: `${cssBaseClass}__cell--object`,
                            render: (data, type, row) => {
                                const params = jobManager.model.getItem(
                                    `exec.jobs.params.${row.job_id}`
                                );
                                return params ? renderParams(params) : row.job_id;
                            },
                        },
                        {
                            className: `${cssBaseClass}__cell--status`,
                            render: (data, type, row) => {
                                const statusLabel = Jobs.jobLabel(row, true);
                                return div(
                                    {
                                        dataToggle: 'tooltip',
                                        dataPlacement: 'bottom',
                                        title: statusLabel,
                                    },
                                    [
                                        span({
                                            class: `fa fa-circle ${cssBaseClass}__icon--${row.status}`,
                                        }),
                                        statusLabel,
                                    ]
                                );
                            },
                        },
                        {
                            className: `${cssBaseClass}__cell--action`,
                            render: (data, type, row) => {
                                const jobAction = Jobs.jobAction(row);
                                if (!jobAction) {
                                    return '';
                                }
                                const jsActionString = jobAction.replace(/ /g, '-');
                                return button(
                                    {
                                        role: 'button',
                                        dataTarget: row.job_id,
                                        dataAction: jsActionString,
                                        dataElement: 'job-action-button',
                                        class: `${cssBaseClass}__cell_action--${jsActionString}`,
                                    },
                                    jobAction
                                );
                            },
                        },
                        {
                            className: `${cssBaseClass}__cell--log-view`,
                            render: () => {
                                return div(
                                    {
                                        class: `${cssBaseClass}__log_link`,
                                        role: 'button',
                                        dataToggle: 'vertical-collapse-after',
                                    },
                                    ['Status details']
                                );
                            },
                            orderable: false,
                        },
                    ],
                    fnDrawCallback: () => {
                        // Hide pagination controls if length is less than or equal to table length
                        if (rowCount <= dataTablePageLength) {
                            $(container).find('.dataTables_paginate').hide();
                        }
                    },
                });
        }

        /**
         * Click handler for the table. Rows can be expanded to show job details
         * and clicked again to hide them.
         *
         * @param {Event} e - row click event
         * @returns {Promise} that resolves when the appropriate row action completes
         */
        function showHideChildRow(e) {
            const $currentRow = $(e.target).closest('tr');
            const $table = $(e.target).closest('table');
            const $dtTable = $table.DataTable();
            const dtRow = $dtTable.row($currentRow);
            const jobState = dtRow.data();

            // remove the existing row selection
            $table
                .find(`.${cssBaseClass}__row--selected`)
                .removeClass(`${cssBaseClass}__row--selected`);
            // select the current row
            $currentRow.addClass(`${cssBaseClass}__row--selected`);

            if (dtRow.child.isShown()) {
                // This row is already open - close it
                dtRow.child.hide();
                $currentRow.removeClass('vertical_collapse--open');
                if (widgetsById[jobState.job_id]) {
                    widgetsById[jobState.job_id].stop();
                }
                dtRow.child.remove();
                return Promise.resolve();
            }

            // create the child row contents, add to the child row, and show it
            const str = div({
                class: `${cssBaseClass}__log_container`,
                dataElement: 'job-log-container',
            });
            dtRow.child(str).show();

            // add the log widget to the next `tr` element
            widgetsById[jobState.job_id] = JobLogViewer.make({ jobManager, showHistory: true });
            return Promise.try(() => {
                widgetsById[jobState.job_id].start({
                    node: $currentRow.next().find('[data-element="job-log-container"]')[0],
                    jobId: dtRow.data().job_id,
                    jobState,
                });
            })
                .then(() => {
                    $currentRow.addClass('vertical_collapse--open');
                })
                .catch((err) => {
                    console.error(err);
                });
        }

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

            if (!['cancel', 'retry', 'go-to-results'].includes(action)) {
                return false;
            }

            const jobState = jobManager.model.getItem(`exec.jobs.byId.${target}`);
            if (!jobState) {
                return false;
            }

            if (action === 'go-to-results') {
                // switch to results tab
                return toggleTab('results');
            }
            if (!Jobs.canDo(action, jobState)) {
                // make sure that the button is disabled so it cannot be clicked again
                e.target.disabled = true;
                return false;
            }
            jobManager.doJobAction(action, [target]);
            // disable the button to prevent further clicks
            e.target.disabled = true;
            return true;
        }

        function setUpListeners(jobs) {
            jobManager.addHandler('modelUpdate', {
                dropdown: () => {
                    dropdownWidget.updateState();
                },
                table: (_, jobArray) => {
                    jobArray.forEach((jobState) => updateJobStatusInTable(jobState));
                },
            });
            const paramsRequired = [];
            const jobIdList = [];
            jobs.forEach((jobState) => {
                jobIdList.push(jobState.job_id);
                if (!jobManager.model.getItem(`exec.jobs.params.${jobState.job_id}`)) {
                    paramsRequired.push(jobState.job_id);
                }
            });

            if (paramsRequired.length) {
                jobManager.addListener('job-info', paramsRequired, {
                    jobStatusTable_info: handleJobInfo,
                });
                bus.emit('request-job-info', {
                    jobIdList: paramsRequired,
                });
            }

            // TODO: add listeners when the bulk import cell is initialised
            jobManager.addListener('job-status', jobIdList, {
                jobStatusTable_status: handleJobStatus,
            });
            jobManager.addListener('job-does-not-exist', jobIdList, {
                jobStatusTable_dne: handleJobDoesNotExist,
            });
        }

        /**
         * Update the table with a new jobState object
         * @param {object} jobState
         */
        function updateJobStatusInTable(jobState) {
            // select the appropriate row
            dataTable
                .DataTable()
                .row('#job_' + jobState.job_id)
                .data(jobState)
                .draw();
        }

        /**
         * parse and update the row with job info
         * @param {object} _ - job manager context
         * @param {object} message
         */
        function handleJobInfo(_, message) {
            const jobId = message.jobId;
            jobManager.model.setItem(`exec.jobs.params.${jobId}`, message.jobInfo.job_params[0]);
            jobManager.removeListener(jobId, 'job-info');
            // update the table
            dataTable
                .DataTable()
                .row('#job_' + jobId)
                .invalidate()
                .draw();
        }

        /**
         * @param {object} _ - job manager context
         * @param {object} message
         * @returns
         */
        function handleJobDoesNotExist(_, message) {
            const { jobId } = message;
            jobManager.removeListener(message.jobId, 'job-info');
            handleJobStatus({
                jobId,
                jobState: {
                    job_id: jobId,
                    status: 'does_not_exist',
                },
            });
        }

        /**
         * Update the job status table with the new job status
         * @param {object} _ - job manager context
         * @param {object} message
         */
        function handleJobStatus(_, message) {
            const jobState = message.jobState;
            const jobId = jobState.job_id;
            const status = jobState.status;

            jobManager.removeListener(jobId, 'job-does-not-exist');

            if (Jobs.isTerminalStatus(status)) {
                jobManager.removeListener(jobId, 'job-status');
                if (status === 'does_not_exist') {
                    jobManager.removeJobListeners(jobId);
                }
            }

            // check if the status has changed; if not, ignore this update
            const previousStatus = jobManager.model.getItem(`exec.jobs.byId.${jobId}.status`);
            if (status === previousStatus) {
                return;
            }

            // otherwise, update the model using the jobState object
            jobManager.updateModel([jobState]);
        }

        /**
         *
         * @param {object} args  -- with key
         *      node:     DOM node to attach to
         *
         * @returns {Promise} started JobStatusTable widget
         */
        function start(args) {
            const requiredArgs = ['node'];
            if (!requiredArgs.every((arg) => arg in args && args[arg])) {
                throw new Error('start argument must have these keys: ' + requiredArgs.join(', '));
            }

            const indexedJobs = jobManager.model.getItem('exec.jobs.byId');
            if (!indexedJobs || !Object.keys(indexedJobs).length) {
                throw new Error('Must provide at least one job to show the job status table');
            }
            const jobs = Object.values(indexedJobs);

            container = args.node;
            container.innerHTML = [
                div({
                    class: `${cssBaseClass}__dropdown_container`,
                }),
                createTable(),
            ].join('\n');

            return Promise.try(() => {
                // start the dropdown widget
                dropdownWidget = JobActionDropdown.make(config);
                return dropdownWidget.start({
                    node: container.querySelector(`.${cssBaseClass}__dropdown_container`),
                });
            }).then(() => {
                renderTable(jobs);

                container.querySelectorAll('tbody tr.odd, tbody tr.even').forEach((el) => {
                    el.onclick = (e) => {
                        e.stopPropagation();
                        const $currentButton = $(e.target).closest(
                            '[data-element="job-action-button"]'
                        );
                        const $currentRow = $(e.target).closest('tr.odd, tr.even');
                        // not an expandable row or a job action button
                        if (!$currentRow[0] && !$currentButton[0]) {
                            return Promise.resolve();
                        }
                        // job action button
                        if ($currentButton[0]) {
                            return Promise.resolve(doSingleJobAction(e));
                        }
                        // expandable row
                        return showHideChildRow(e);
                    };
                });

                setUpListeners(jobs);
            });
        }

        function stop() {
            Object.values(widgetsById).map((widget) => widget.stop());
            jobManager.removeHandler('modelUpdate', 'table');
            jobManager.removeHandler('modelUpdate', 'dropdown');
            jobManager.removeHandler('job-info', 'jobStatusTable_info');
            jobManager.removeHandler('job-status', 'jobStatusTable_status');
            jobManager.removeHandler('job-does-not-exist', 'jobStatusTable_dne');

            return dropdownWidget.stop();
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
        cssBaseClass,
    };
});
