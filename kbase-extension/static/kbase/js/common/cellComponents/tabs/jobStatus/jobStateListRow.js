define([
    'bluebird',
    'common/ui',
    'kb_common/html',
    'common/events',
    'jquery',
    'common/jobs',
    'util/jobLogViewer',
], (Promise, UI, html, Events, $, Jobs, JobLogViewer) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        td = t('td'),
        span = t('span'),
        ul = t('ul'),
        li = t('li'),
        cssBaseClass = 'kb-job-status',
        events = Events.make();

    function factory() {
        let container, ui, jobId, jobState;
        const widgets = {};

        function _createStatusLabel(jobStatus) {
            return (
                span({
                    class: `fa fa-circle ${cssBaseClass}__icon--${jobStatus}`,
                }) +
                ' ' +
                Jobs.jobLabel(jobStatus)
            );
        }

        function _createActionButton(jobStatus) {
            return div(
                {
                    class: `${cssBaseClass}__cell_action--${jobStatus}`,
                    role: 'button',
                    // TODO: these actions need to be added
                    id: events.addEvent({
                        type: 'click',
                        handler: function () {
                            // handle action button clicks
                        },
                    }),
                },
                [Jobs.jobAction(jobStatus)]
            );
        }

        function buildRow(_name) {
            return (
                // input name/descriptor
                td(
                    {
                        class: `${cssBaseClass}__cell--object`,
                        dataElement: 'job-params',
                    },
                    [div(_name)]
                ) +
                // job status
                td(
                    {
                        class: `${cssBaseClass}__cell--status`,
                        dataElement: 'job-state',
                    },
                    []
                ) +
                // action to take
                td(
                    {
                        class: `${cssBaseClass}__cell--action`,
                        dataElement: 'job-action',
                    },
                    []
                ) +
                // job status details
                td(
                    {
                        class: `${cssBaseClass}__cell--log-view`,
                    },
                    [
                        div(
                            {
                                class: `${cssBaseClass}__log_link`,
                                role: 'button',
                                dataToggle: 'vertical-collapse-after',
                            },
                            ['Status details']
                        ),
                    ]
                )
            );
        }

        // update the status and action columns
        function _updateRowStatus(jobStateObject) {
            jobState = jobStateObject;
            ui.setContent('job-state', _createStatusLabel(jobState.status));
            ui.setContent('job-action', _createActionButton(jobState.status));
        }

        function selectRow(e) {
            const $currentRow = $(e.target).closest('tr');
            const $allRows = $(`.${cssBaseClass}__row`);
            $allRows.removeClass(`${cssBaseClass}__row--selected`);
            $currentRow.toggleClass(`${cssBaseClass}__row--selected`);
        }

        function showHideChildRow(e) {
            const $currentRow = $(e.target).closest('tr');
            const $dtTable = $(e.target).closest('table').DataTable();
            const dtRow = $dtTable.row($currentRow);

            if (dtRow.child.isShown()) {
                // This row is already open - close it
                dtRow.child.hide();
                $currentRow.removeClass('vertical_collapse--open');
                if (widgets.log) {
                    widgets.log.stop();
                }
                dtRow.child.remove();
                return;
            }

            // create the child row contents, add to the child row, and show it
            const str = div({
                class: `${cssBaseClass}__log_container`,
                dataElement: 'job-log-container',
            });
            dtRow.child(false);
            dtRow.child(str).show();

            // add the log widget to the next `tr` element
            widgets.log = JobLogViewer.make({ showHistory: true });
            widgets.log.start({
                node: $currentRow.next().find('[data-element="job-log-container"]')[0],
                jobId: jobId,
                jobState: jobState,
            });
            $currentRow.addClass('vertical_collapse--open');
            return;
        }

        /**
         * Start the job status row widget
         * @param {object} args, with keys
         *      jobState:  a job state object for the job to be represented
         *      name: the value of the input parameter(s) for the job
         *      node: the node to insert the row into (will presumably be a `tr` element)
         */
        function start(args) {
            return Promise.try(() => {
                const requiredArgs = ['jobState', 'name', 'node'];
                if (
                    Object.prototype.toString.call(args) !== '[object Object]' ||
                    !requiredArgs.every((arg) => arg in args && args[arg])
                ) {
                    throw new Error(
                        'invalid arguments supplied' +
                            '\n\n' +
                            'you supplied ' +
                            JSON.stringify(args)
                    );
                }

                if (!Jobs.isValidJobStateObject(args.jobState)) {
                    throw new Error('invalid job object supplied');
                }
                container = args.node;
                ui = UI.make({ node: container });
                container.innerHTML = buildRow(args.name);
                container.onclick = (e) => {
                    selectRow(e);
                    showHideChildRow(e);
                };
                jobId = args.jobState.job_id;
                _updateRowStatus(args.jobState);
            }).catch((err) => {
                throw new Error('Unable to start Job State List Row widget: ' + err);
            });
        }

        function stop() {}

        // TODO: ensure that narrative does not create invalid job objects,
        // e.g. { job_state: 'does_not_exist' }
        function updateState(newState) {
            if (!Jobs.isValidJobStateObject(newState)) {
                throw new Error(
                    `JobStateListRow for ${jobId} received invalid job object: `,
                    newState
                );
            }
            if (newState.job_id !== jobId) {
                throw new Error(
                    `JobStateListRow for ${jobId} received incorrect job object: `,
                    newState
                );
            }
            _updateRowStatus(newState);
        }

        /**
         * Update the job parameters table cell from a jobInfo object
         *
         * jobInfo object structure:
         * {
         *      job_id: <job_id_here>,
         *      job_params: [
         *          {
         *              param_1: "param 1 value",
         *              param_2: "param 2 value",
         *          }
         *      ]
         * }
         *
         * Params are currently displayed in the form
         * <ul>
         *      <li><span>param_1:</span> <span>param 1 value</span>
         *      <li><span>param_2:</span> <span>param 2 value</span>
         *      ...
         * </ul>
         *
         * @param {object} jobInfo
         */
        function updateParams(jobInfo) {
            if (!Jobs.isValidJobInfoObject(jobInfo)) {
                throw new Error(
                    `JobStateListRow for ${jobId} received invalid job info object: ${JSON.stringify(
                        jobInfo
                    )}`
                );
            }
            if (!jobInfo.job_id || jobInfo.job_id !== jobId) {
                throw new Error(
                    `JobStateListRow for ${jobId} received incorrect job info: ${JSON.stringify(
                        jobInfo
                    )}`
                );
            }
            const newParams = jobInfo.job_params[0];

            ui.setContent(
                'job-params',
                // coerce to a string
                ul(
                    {
                        class: `${cssBaseClass}__param_list`,
                    },
                    Object.keys(newParams)
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
                                        `${newParams[key]}`
                                    ),
                                ]
                            );
                        })
                )
            );
        }

        return {
            start: start,
            stop: stop,
            updateState: updateState,
            updateParams: updateParams,
        };
    }

    return {
        make: function () {
            return factory();
        },
        cssBaseClass: cssBaseClass,
    };
});
