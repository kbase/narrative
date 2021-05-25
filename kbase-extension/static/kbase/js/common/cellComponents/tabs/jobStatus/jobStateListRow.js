define(['bluebird', 'common/ui', 'common/html', 'common/jobs'], (Promise, UI, html, Jobs) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        td = t('td'),
        span = t('span'),
        button = t('button'),
        ul = t('ul'),
        li = t('li'),
        cssBaseClass = 'kb-job-status';

    function factory() {
        let container, ui, jobId, jobState;

        function _updateStatusLabel(jobStateObject) {
            const statusLabel = Jobs.jobLabel(jobStateObject, true);
            ui.setContent(
                'job-state',
                div(
                    {
                        dataToggle: 'tooltip',
                        dataPlacement: 'bottom',
                        title: statusLabel,
                    },
                    [
                        span({
                            class: `fa fa-circle ${cssBaseClass}__icon--${jobStateObject.status}`,
                        }),
                        statusLabel,
                    ]
                )
            );
        }

        function _updateActionButton(jobStateObject) {
            const jobAction = Jobs.jobAction(jobStateObject);
            const actionNode = container.querySelector('[data-element="job-action"] button');
            if (!jobAction) {
                actionNode.remove();
                return;
            }
            const jsActionString = jobAction.replace(/ /g, '-');
            actionNode.textContent = jobAction;
            actionNode.setAttribute('data-action', jsActionString);
            actionNode.classList = [`${cssBaseClass}__cell_action--${jsActionString}`];
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
                    button(
                        {
                            role: 'button',
                            dataElement: 'job-action-button',
                            dataTarget: jobId,
                        },
                        ''
                    )
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
            if (jobState && jobState.status && jobStateObject.status === jobState.status) {
                // status has not changed: no updates required
                jobState = jobStateObject;
                return;
            }
            jobState = jobStateObject;
            _updateStatusLabel(jobState);
            _updateActionButton(jobState);
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
                jobId = args.jobState.job_id;

                container = args.node;
                ui = UI.make({ node: container });
                container.innerHTML = buildRow(args.name);

                _updateRowStatus(args.jobState);
            }).catch((err) => {
                throw new Error(`Unable to start Job State List Row widget: ${err}`);
            });
        }

        function stop() {
            // no op
        }

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
            start,
            stop,
            updateState,
            updateParams,
        };
    }

    return {
        make: () => {
            return factory();
        },
        cssBaseClass,
    };
});
