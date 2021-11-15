define([
    'jquery',
    'bluebird',
    'common/html',
    'common/jobs',
    './jobActionDropdown',
    'util/jobLogViewer',
    'util/appCellUtil',
    'util/string',
    'jquery-dataTables',
], ($, Promise, html, Jobs, JobActionDropdown, JobLogViewerModule, Util, String) => {
    'use strict';

    const { JobLogViewer } = JobLogViewerModule;
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
                class: `${cssBaseClass}__table table-striped`,
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
     *      {Object} fileTypeMapping: display text for each import type
     *      {Object} typesToFiles: mapping of import type to app ID
     * @returns {Object} with keys
     *      analysisType:   abbreviated name for the app
     *      outputParams:   any output files or objects
     *      params:         all user-specified job params, output-friendly format
     */

    function generateJobDisplayData(args) {
        const { appData, jobInfo, fileTypeMapping, typesToFiles } = args;
        let analysisType = '';
        const params = {};
        const outputParams = {};
        // unfortunate data structure makes generating this data long-winded
        Object.keys(typesToFiles).forEach((type) => {
            // match app_id to get the abbreviated name for the analysis
            if (typesToFiles[type].appId === jobInfo.app_id) {
                analysisType = fileTypeMapping[type];
                Object.keys(jobInfo.job_params[0]).forEach((param) => {
                    // find each parameter in job_params in the app specs
                    appData.specs[jobInfo.app_id].parameters.forEach((appParam) => {
                        // only add values that are in the parameters
                        // as these are the user-settable params
                        if (appParam.id === param) {
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
                        }
                    });
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
                title: typeName,
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
    class JobStatusTable {
        constructor(config = {}) {
            this._init(config);
        }

        /**
         * Set up the Job Status Table class
         * @param {object} config
         */
        _init(config) {
            this.config = config;
            this.showHistory = true; // whether or not the embedded widgets should show job history

            const { jobManager, toggleTab } = config;
            if (!jobManager.model || !jobManager.model.getItem('exec.jobs.byId')) {
                throw new Error('Cannot start JobStatusTable without a jobs object in the config');
            }
            this.jobManager = jobManager;
            this.toggleTab = toggleTab;

            this.fileTypeMapping = config.fileTypeMapping;
            this.jobsByRetryParent = {};
            this.widgetsById = {};
            this.errors = {};
        }

        /**
         *
         * @param {object} args  -- with key
         *      node:     DOM node to attach to
         *
         * @returns {Promise} started JobStatusTable widget
         */
        start(args) {
            const requiredArgs = ['node'];
            if (!requiredArgs.every((arg) => arg in args && args[arg])) {
                throw new Error('start argument must have these keys: ' + requiredArgs.join(', '));
            }

            const indexedJobs = this.jobManager.model.getItem('exec.jobs.byId');
            if (!indexedJobs || !Object.keys(indexedJobs).length) {
                throw new Error('Must provide at least one job to show the job status table');
            }
            const jobs = Object.values(indexedJobs);

            this.container = args.node;
            this.container.innerHTML = [
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
                this.dropdownWidget = JobActionDropdown.make(this.config);
                return this.dropdownWidget.start({
                    node: this.container.querySelector(`.${cssBaseClass}__dropdown_container`),
                });
            }).then(() => {
                this.renderTable(jobs);
                this.setUpEventHandlers();
                this.setUpJobListeners(jobs);
                this.addTableClickListeners();
            });
        }

        stop() {
            Object.values(this.widgetsById).map((widget) => widget.stop());
            this.jobManager.removeEventHandler('modelUpdate', 'jobStatusTable_status');
            this.jobManager.removeEventHandler('modelUpdate', 'dropdown');
            this.jobManager.removeEventHandler('job-info', 'jobStatusTable_info');
            this.jobManager.removeEventHandler('job-error', 'jobStateTable_error');
            this.container.innerHTML = '';
            if (this.dropdownWidget) {
                return this.dropdownWidget.stop();
            }
        }

        /**
         * convert the table to a DataTable object to get sorting/paging functionality
         * @param {array} rows - table rows
         * @returns {DataTable} datatable object
         */
        renderTable(rows) {
            // group jobs by their retry parents
            const jobsByOriginalId = Jobs.getCurrentJobs(rows, this.jobsByRetryParent);
            const allJobInfo = this.jobManager.model.getItem('exec.jobs.info');
            const appData = this.jobManager.model.getItem('app');
            if (allJobInfo) {
                Object.keys(jobsByOriginalId).forEach((jobId) => {
                    if (allJobInfo[jobId]) {
                        const jobDisplayData = generateJobDisplayData({
                            jobInfo: allJobInfo[jobId],
                            fileTypeMapping: this.fileTypeMapping,
                            appData,
                            typesToFiles: this.config.typesToFiles,
                        });
                        this.jobManager.model.setItem(
                            `exec.jobs.paramDisplayData.${jobId}`,
                            jobDisplayData
                        );
                    }
                });
            }

            this.dataTable = $(this.container.querySelector('table')).dataTable({
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
                                this.jobManager.model.getItem('exec.jobs.paramDisplayData') || {};
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
                                this.jobManager.model.getItem('exec.jobs.paramDisplayData') || {};
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
                            const statusLabel = String.capitalize(Jobs.jobLabel(row));
                            return div(
                                {
                                    dataToggle: 'tooltip',
                                    dataPlacement: 'bottom',
                                    title: statusLabel,
                                },
                                [
                                    span({
                                        class: `fa fa-circle ${cssBaseClass}__icon--${row.status}`,
                                        title: statusLabel,
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

                            const buttonHtml = button(
                                {
                                    role: 'button',
                                    dataTarget,
                                    dataAction: jsActionString,
                                    dataElement: 'job-action-button',
                                    class: `${cssBaseClass}__cell_action--${jsActionString}`,
                                },
                                jobAction
                            );

                            if (
                                ['cancel', 'retry'].includes(jobAction) &&
                                this.errors[row.job_id]
                            ) {
                                return (
                                    buttonHtml +
                                    span({
                                        class: `fa fa-exclamation-triangle ${cssBaseClass}__icon--action_warning`,
                                        ariaHidden: 'true',
                                        dataToggle: 'popover',
                                        dataContainer: 'body',
                                        dataContent: 'Could not ' + jobAction + ' job.',
                                    })
                                );
                            }
                            return buttonHtml;
                        },
                    },
                ],
                drawCallback: function () {
                    // Hide pagination controls if length is less than or equal to table length
                    if (this.api().data().length <= dataTablePageLength) {
                        $(this.container).find('.dataTables_paginate').hide();
                    }
                },
            });
        }

        /**
         * Add a new row to the table (if applicable)
         * @param {object} jobState
         */
        addTableRow(jobState) {
            // check whether this job is part of the same batch as the other jobs;
            // if so, it should be added to the table
            const expectedBatchId = this.jobManager.model.getItem('exec.jobState.batch_id');
            if (
                // no batch job
                !expectedBatchId ||
                // incoming job has no batch ID
                !jobState.batch_id ||
                // incoming job is in a different batch
                jobState.batch_id !== expectedBatchId ||
                // this is the batch job
                jobState.job_id === expectedBatchId
            ) {
                return;
            }
            const rowIx = jobState.retry_parent || jobState.job_id;
            const currentJobIx = `${jobState.created || 0}__${jobState.job_id}`;

            this.jobsByRetryParent[rowIx] = {
                job_id: rowIx,
                jobs: {},
            };
            this.jobsByRetryParent[rowIx].jobs[currentJobIx] = jobState;
            // do we have job info for it?
            if (!this.jobManager.model.getItem(`exec.jobs.info.${rowIx}`)) {
                this.jobManager.requestJobInfo([rowIx]);
            }

            // is this a job that has been retried?
            if (jobState.retry_ids && jobState.retry_ids.length) {
                return;
            }
            // this is a new job that is part of the same batch
            this.dataTable.DataTable().row.add(jobState).draw();
            this.addTableClickListeners();
        }

        /**
         * add the listeners to the table that allow row expansion
         */
        addTableClickListeners() {
            this.container.querySelectorAll('tbody tr.odd, tbody tr.even').forEach((el) => {
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
                        return Promise.resolve(this.doSingleJobAction(e));
                    }
                    // expandable row
                    return this.showHideChildRow(e);
                };
            });
        }

        /**
         * Click handler for the table. Rows can be expanded to show job details
         * and clicked again to hide them.
         *
         * @param {Event} e - row click event
         * @returns {Promise} that resolves when the appropriate row action completes
         */
        showHideChildRow(e) {
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
                if (this.widgetsById[`${jobState.job_id}_LOG`]) {
                    this.widgetsById[`${jobState.job_id}_LOG`].stop();
                }
                dtRow.child.remove();
                return Promise.resolve();
            }

            // create the child row contents, add to the child row, and show it
            const str = div(
                {
                    class: `${cssBaseClass}__detail_container`,
                    dataElement: 'job-detail-container',
                },
                [
                    div({
                        dataElement: `job-logs-div`,
                    }),
                ]
            );
            dtRow.child(str).show();

            // add the log widget to the next `tr` element
            this.widgetsById[`${jobState.job_id}_LOG`] = new JobLogViewer({
                jobManager: this.jobManager,
                showHistory: this.showHistory,
            });
            return Promise.try(() => {
                this.widgetsById[`${jobState.job_id}_LOG`].start({
                    jobId: dtRow.data().job_id,
                    jobState,
                    config: this.config,
                    node: $currentRow.next().find('[data-element="job-logs-div"]')[0],
                });
            })
                .then(() => {
                    $currentRow.addClass('vertical_collapse--open');
                })
                .catch((err) => {
                    console.error(err);
                });
        }

        closeRow(e) {
            if ($(e.target).closest('tr')[0].classList.contains('vertical_collapse--open')) {
                this.showHideChildRow(e);
            }
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
        doSingleJobAction(e) {
            const el = e.target;
            e.stopPropagation();
            const action = el.getAttribute('data-action'),
                target = el.getAttribute('data-target');

            if (!['cancel', 'retry', 'go-to-results'].includes(action)) {
                return false;
            }

            const jobState = this.jobManager.model.getItem(`exec.jobs.byId.${target}`);
            if (!jobState) {
                return false;
            }

            if (action === 'go-to-results') {
                // switch to results tab
                return this.toggleTab('results');
            }
            if (!Jobs.canDo(action, jobState)) {
                // make sure that the button is disabled so it cannot be clicked again
                e.target.disabled = true;
                return false;
            }
            // make sure any errors associated with the row ID are deleted
            if (this.errors[target]) {
                delete this.errors[target];
            }
            this.jobManager.doJobAction(action, [target]);

            // if the job is being retried and the log viewer is open, close it
            // TODO: a better fix!
            if (action === 'retry') {
                this.closeRow(e);
            }

            // disable the button to prevent further clicks
            e.target.disabled = true;
            e.target.textContent = action + 'ing';
            // remove any error indicator from the DOM
            $(e.target).closest('td').find(`.${cssBaseClass}__icon--action_warning`).remove();
            return true;
        }

        /**
         * Set up event handlers
         */
        setUpEventHandlers() {
            this.jobManager.addEventHandler('modelUpdate', {
                dropdown: () => {
                    this.dropdownWidget.updateState();
                },
                jobStatusTable_status: (_, jobArray) => {
                    jobArray.forEach((jobState) => this.updateJobStatusInTable(jobState));
                },
            });
        }

        /**
         * Set up job event listeners and handlers
         *
         * @param {array} jobs
         */
        setUpJobListeners(jobs) {
            const batchId = this.jobManager.model.getItem('exec.jobState.job_id');
            const paramsRequired = [];
            const jobIdList = [];
            jobs.forEach((jobState) => {
                if (!jobState.batch_job) {
                    jobIdList.push(jobState.job_id);
                    if (
                        !this.jobManager.model.getItem(`exec.jobs.info.${jobState.job_id}`) &&
                        jobState.job_id !== batchId
                    ) {
                        paramsRequired.push(jobState.job_id);
                    }
                }
            });
            this.jobManager.addListener('job-status', [batchId].concat(jobIdList));
            this.jobManager.addListener('job-error', [batchId].concat(jobIdList), {
                jobStatusTable_error: this.handleJobError.bind(this),
            });

            if (paramsRequired.length) {
                this.jobManager.addListener('job-info', paramsRequired, {
                    jobStatusTable_info: this.handleJobInfo.bind(this),
                });
                const jobInfoRequestParams =
                    paramsRequired.length === jobIdList.length
                        ? { batchId }
                        : { jobIdList: paramsRequired };
                this.jobManager.bus.emit('request-job-info', jobInfoRequestParams);
            }
            this.jobManager.bus.emit('request-job-status', { batchId });
        }

        // HANDLERS

        /**
         * Update the table with a new jobState object
         * @param {object} jobState
         */
        updateJobStatusInTable(jobState) {
            const rowIx = jobState.retry_parent || jobState.job_id;

            if (!this.jobsByRetryParent[rowIx]) {
                return this.addTableRow(jobState);
            }

            const jobIx = `${jobState.created || 0}__${jobState.job_id}`;
            this.jobsByRetryParent[rowIx].jobs[jobIx] = jobState;

            // make sure that this job is the most recent version
            const sortedJobs = Object.keys(this.jobsByRetryParent[rowIx].jobs).sort();
            const lastJob = sortedJobs[sortedJobs.length - 1];
            const jobUpdateData = this.jobsByRetryParent[rowIx].jobs[lastJob];
            // irrelevant update -- data is not for the most recent retry
            if (jobUpdateData.job_id !== jobState.job_id) {
                return;
            }

            // select the appropriate row
            try {
                // update the row
                this.dataTable.DataTable().row(`#job_${rowIx}`).data(jobState);
            } catch (e) {
                console.error('Error trying to update jobs table:', e);
            }
        }

        /**
         * parse and update the row with job info
         * @param {object} _ - job manager context
         * @param {object} message
         */
        handleJobInfo(_, message) {
            const { jobId, jobInfo } = message;
            const jobState = this.jobManager.model.getItem(`exec.jobs.byId.${jobId}`);
            const appData = this.jobManager.model.getItem('app');
            const rowIx = jobState && jobState.retry_parent ? jobState.retry_parent : jobId;

            const jobDisplayData = generateJobDisplayData({
                jobInfo,
                fileTypeMapping: this.fileTypeMapping,
                appData,
                typesToFiles: this.config.typesToFiles,
            });
            this.jobManager.model.setItem(`exec.jobs.paramDisplayData.${rowIx}`, jobDisplayData);

            // update the table
            this.dataTable.DataTable().row(`#job_${rowIx}`).invalidate().draw();
        }

        /**
         * parse a job error message
         * @param {object} _ - job manager context
         * @param {object} message
         */
        handleJobError(_, message) {
            const { jobId, error } = message;
            if (!error) {
                return;
            }
            const jobState = this.jobManager.model.getItem(`exec.jobs.byId.${jobId}`);
            const rowIx = jobState && jobState.retry_parent ? jobState.retry_parent : jobId;

            this.errors[rowIx] = error;

            // update the table
            this.dataTable.DataTable().row(`#job_${rowIx}`).invalidate().draw();
            $('.' + `${cssBaseClass}__icon--action_warning`).popover({
                placement: 'auto',
                trigger: 'hover focus',
            });
        }
    }

    return {
        JobStatusTable,
        generateJobDisplayData,
        cssBaseClass,
    };
});
