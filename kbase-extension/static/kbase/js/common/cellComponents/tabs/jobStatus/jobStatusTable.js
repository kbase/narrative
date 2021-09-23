define([
    'jquery',
    'bluebird',
    'common/html',
    'common/jobs',
    './jobActionDropdown',
    'util/jobLogViewer',
    'util/appCellUtil',
    'jquery-dataTables',
], ($, Promise, html, Jobs, JobActionDropdown, JobLogViewer, Util) => {
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
                style: 'width: 100%',
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
                                        class: `${cssBaseClass}__table_head_cell--import-type`,
                                    },
                                    'Import type'
                                ),
                                th(
                                    {
                                        class: `${cssBaseClass}__table_head_cell--output`,
                                    },
                                    'Output'
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

    /**
     * Compile the information required to display a job in the job status table
     * @param {Object} args with keys
     *      {Object} appData: specs and outputParamIds from the cell config
     *      {Object} jobInfo: job data from the backend, including app ID and params
     *      {Object} fileTypesDisplay: display text for each import type
     *      {Object} typesToFiles: mapping of import type to app ID
     * @returns
     */

    function generateJobDisplayData(args) {
        const { appData, jobInfo, fileTypesDisplay, typesToFiles } = args;
        let analysisType = '';
        const params = {};
        const outputParams = {};
        Object.keys(typesToFiles).forEach((type) => {
            if (typesToFiles[type].appId === jobInfo.app_id) {
                analysisType = fileTypesDisplay.fileTypeMapping[type];
                Object.keys(jobInfo.job_params[0]).forEach((param) => {
                    const value = jobInfo.job_params[0][param];
                    const label = appData.specs[jobInfo.app_id].parameters
                        .filter((p) => {
                            return param === p.id;
                        })
                        .map((p) => {
                            return p.ui_name;
                        })[0];
                    params[param] = {
                        value,
                        label,
                    };
                });
                const outputParamIds = appData.outputParamIds[type];
                outputParamIds.forEach((param) => {
                    outputParams[param] = params[param];
                });
            }
        });

        return {
            analysisType,
            outputParams,
            params,
        };
    }

    function displayAppType(typeName) {
        return div(
            {
                class: `${cssBaseClass}__app_type`,
            },
            typeName
        );
    }

    function displayParamList(params) {
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
                                `${params[key].label}: `
                            ),
                            span(
                                {
                                    class: `${cssBaseClass}__param_value`,
                                },
                                `${params[key].value}`
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
            showHistory = true,
            { jobManager, toggleTab } = config,
            jobsByRetryParent = {},
            fileTypesDisplay = Util.generateFileTypeMappings(config.typesToFiles);

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
            // group jobs by their retry parents
            const jobsByOriginalId = Jobs.getCurrentJobs(rows, jobsByRetryParent);
            const rowCount = Object.keys(jobsByOriginalId).length;

            dataTable = $(container)
                .find('table')
                .dataTable({
                    autoWidth: false,
                    data: Object.values(jobsByOriginalId),
                    rowId: (row) => {
                        return `job_${row.retry_parent || row.job_id}`;
                    },
                    lengthChange: false,
                    pageLength: dataTablePageLength,
                    searching: false,
                    columns: [
                        {
                            className: `${cssBaseClass}__cell--import-type`,
                            render: (data, type, row) => {
                                const jobParams =
                                    jobManager.model.getItem('exec.jobs.paramDisplayData') || {};
                                const relevantJobId =
                                    row.retry_parent && jobParams[row.retry_parent]
                                        ? row.retry_parent
                                        : row.job_id;

                                if (jobParams[relevantJobId]) {
                                    return displayAppType(jobParams[relevantJobId].analysisType);
                                }
                                return `Job ID: ${row.job_id}`;
                            },
                        },
                        {
                            className: `${cssBaseClass}__cell--output`,
                            render: (data, type, row) => {
                                const jobParams =
                                    jobManager.model.getItem('exec.jobs.paramDisplayData') || {};
                                const relevantJobId =
                                    row.retry_parent && jobParams[row.retry_parent]
                                        ? row.retry_parent
                                        : row.job_id;

                                if (jobParams[relevantJobId]) {
                                    return displayParamList(jobParams[relevantJobId].outputParams);
                                }
                                return '';
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
                                const dataTarget =
                                    jobAction === 'retry' && row.retry_parent
                                        ? row.retry_parent
                                        : row.job_id;
                                return button(
                                    {
                                        role: 'button',
                                        dataTarget,
                                        dataAction: jsActionString,
                                        dataElement: 'job-action-button',
                                        class: `${cssBaseClass}__cell_action--${jsActionString}`,
                                    },
                                    jobAction
                                );
                            },
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
            widgetsById[jobState.job_id] = JobLogViewer.make({ jobManager, showHistory });
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

            // if the job is being retried and the log viewer is open, close it
            // TODO: a better fix!
            if (
                action === 'retry' &&
                $(e.target).closest('tr')[0].classList.contains('vertical_collapse--open')
            ) {
                showHideChildRow(e);
            }

            // disable the button to prevent further clicks
            e.target.disabled = true;
            return true;
        }

        function setUpListeners(jobs) {
            jobManager.addEventHandler('modelUpdate', {
                dropdown: () => {
                    dropdownWidget.updateState();
                },
                table: (_, jobArray) => {
                    jobArray.forEach((jobState) => updateJobStatusInTable(jobState));
                },
            });

            const batchId = jobManager.model.getItem('exec.jobState.job_id');
            const paramsRequired = [];
            const jobIdList = [];
            jobs.forEach((jobState) => {
                if (!jobState.batch_job) {
                    jobIdList.push(jobState.job_id);
                    if (
                        !jobManager.model.getItem(`exec.jobs.info.${jobState.job_id}`) &&
                        jobState.job_id !== batchId
                    ) {
                        paramsRequired.push(jobState.job_id);
                    }
                }
            });
            jobManager.addListener('job-status', [batchId].concat(jobIdList));

            if (paramsRequired.length) {
                jobManager.addListener('job-info', paramsRequired, {
                    jobStatusTable_info: handleJobInfo,
                });
                const jobInfoRequestParams =
                    paramsRequired.length === jobIdList.length
                        ? { batchId }
                        : { jobIdList: paramsRequired };
                jobManager.bus.emit('request-job-info', jobInfoRequestParams);
            }
            jobManager.bus.emit('request-job-status', { batchId });
        }

        /**
         * Update the table with a new jobState object
         * @param {object} jobState
         */
        function updateJobStatusInTable(jobState) {
            const rowIx = jobState.retry_parent || jobState.job_id;

            if (!jobsByRetryParent[rowIx]) {
                // irrelevant
                return;
            }

            const jobIx = `${jobState.created || 0}__${jobState.job_id}`;
            jobsByRetryParent[rowIx].jobs[jobIx] = jobState;

            // make sure that this job is the most recent version
            const sortedJobs = Object.keys(jobsByRetryParent[rowIx].jobs).sort();
            const lastJob = sortedJobs[sortedJobs.length - 1];
            const jobUpdateData = jobsByRetryParent[rowIx].jobs[lastJob];
            // irrelevant update -- data is not for the most recent retry
            if (jobUpdateData.job_id !== jobState.job_id) {
                return;
            }

            // select the appropriate row
            try {
                // update the row
                dataTable.DataTable().row(`#job_${rowIx}`).data(jobState);
            } catch (e) {
                console.error('Error trying to update jobs table:', e);
            }
        }

        /**
         * parse and update the row with job info
         * @param {object} _ - job manager context
         * @param {object} message
         */
        function handleJobInfo(_, message) {
            const { jobId, jobInfo } = message;
            const jobState = jobManager.model.getItem(`exec.jobs.byId.${jobId}`);
            const appData = jobManager.model.getItem('app');
            const rowIx = jobState && jobState.retry_parent ? jobState.retry_parent : jobId;

            const jobDisplayData = generateJobDisplayData({
                jobInfo,
                fileTypesDisplay,
                appData,
                typesToFiles: config.typesToFiles,
            });
            jobManager.model.setItem(`exec.jobs.paramDisplayData.${rowIx}`, jobDisplayData);

            // update the table
            dataTable.DataTable().row(`#job_${rowIx}`).invalidate().draw();
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
                    class: `${cssBaseClass}__dropdown_container pull-right`,
                }),
                div(
                    {
                        class: `${cssBaseClass}__table_instructions`,
                    },
                    'Click on a row to view the job details and logs.'
                ),
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
            jobManager.removeEventHandler('modelUpdate', 'table');
            jobManager.removeEventHandler('modelUpdate', 'dropdown');
            jobManager.removeEventHandler('job-info', 'jobStatusTable_info');
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
        generateJobDisplayData,
        cssBaseClass,
    };
});
