define([
    'jquery',
    'bluebird',
    'common/html',
    'common/jobs',
    'common/runtime',
    './jobStateListRow',
    './jobActionDropdown',
    'util/jobLogViewer',
    'jquery-dataTables',
], ($, Promise, html, Jobs, Runtime, JobStateListRow, JobActionDropdown, JobLogViewer) => {
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

    /**
     * create a job state list instance
     *
     * the config should be an object with a property 'jobManager', which executes
     * the job actions available as part of the job status table, and 'toggleTab',
     * a function used to view the results of finished jobs.
     *
     * @param {object} config
     * @returns jobStateList instance
     */
    function factory(config) {
        const widgetsById = {},
            logWidgets = {},
            bus = Runtime.make().bus(),
            { jobManager, toggleTab } = config;

        if (!jobManager.model || !jobManager.model.getItem('exec.jobs.byId')) {
            throw new Error('Cannot start JobStateList without a jobs object in the config');
        }

        let container, tableBody, dropdownWidget;

        /**
         * convert the table to a DataTable object to get sorting/paging functionality
         * @param {array} rows - table rows
         * @returns {DataTable} datatable object
         */
        // Convert the table to a datatable object to get functionality
        function renderTable(rows) {
            const rowCount = rows.length;
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
         * Click handler for the table. Rows can be expanded to show job details
         * and clicked again to hide them.
         *
         * @param {Event} e - row click event
         * @returns {Promise} that resolves when the appropriate row action completes
         */
        function showHideChildRow(e) {
            const $currentRow = $(e.target).closest('tr');
            const jobId = $currentRow[0].getAttribute('data-element-job-id');
            const $table = $(e.target).closest('table');
            const $dtTable = $table.DataTable();
            const dtRow = $dtTable.row($currentRow);

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
                if (logWidgets[jobId]) {
                    logWidgets[jobId].stop();
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
            const jobState = jobManager.model.getItem(`exec.jobs.byId.${jobId}`);

            // add the log widget to the next `tr` element
            logWidgets[jobId] = JobLogViewer.make({ showHistory: true });
            return Promise.try(() => {
                logWidgets[jobId].start({
                    node: $currentRow.next().find('[data-element="job-log-container"]')[0],
                    jobId,
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
                    jobStateList_info: handleJobInfo,
                });
                bus.emit('request-job-info', {
                    jobIdList: paramsRequired,
                });
            }

            // TODO: add listeners when the bulk import cell is initialised
            jobManager.addListener('job-status', jobIdList, {
                jobStateList_status: handleJobStatus,
            });
            jobManager.addListener('job-does-not-exist', jobIdList, {
                jobStateList_dne: handleJobDoesNotExist,
            });
        }

        /**
         * parse and update the row with job info
         * @param {object} _ - job manager context
         * @param {object} message
         */
        function handleJobInfo(_, message) {
            if (message.jobId && message.jobInfo && widgetsById[message.jobId]) {
                widgetsById[message.jobId].updateParams(message.jobInfo);
                jobManager.removeListener(message.jobId, 'job-info');
                jobManager.model.setItem(
                    `exec.jobs.params.${message.jobId}`,
                    message.jobInfo.job_params[0]
                );
            }
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
         * Pass the job state to all row widgets
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
                name: jobState.job_id || 'Child Job ' + (jobIndex + 1),
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

            const indexedJobs = jobManager.model.getItem('exec.jobs.byId');
            if (!indexedJobs || !Object.keys(indexedJobs).length) {
                throw new Error('Must provide at least one job to show the job state list');
            }
            const jobs = Object.values(indexedJobs);

            container = args.node;
            container.innerHTML = [
                div({
                    class: `${cssBaseClass}__dropdown_container`,
                }),
                createTable(),
            ].join('\n');

            tableBody = container.querySelector('tbody');

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
            Object.values(logWidgets).map((widget) => widget.stop());
            jobManager.removeHandler('modelUpdate', 'table');
            jobManager.removeHandler('job-info', 'jobStateList_info');
            jobManager.removeHandler('job-status', 'jobStateList_status');
            jobManager.removeHandler('job-does-not-exist', 'jobStateList_dne');

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
