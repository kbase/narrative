define([
    'jquery',
    'bluebird',
    'common/html',
    'common/dialogMessages',
    'common/jobs',
    'util/developerMode',
], ($, Promise, html, DialogMessages, Jobs, DevMode) => {
    'use strict';

    const t = html.tag,
        span = t('span'),
        button = t('button'),
        ul = t('ul'),
        li = t('li'),
        div = t('div'),
        cssBaseClass = 'kb-job-action';

    const actionArr = [
        {
            label: 'Cancel queued jobs',
            action: 'cancel',
            target: ['created', 'estimating', 'queued'],
        },
        {
            label: 'Cancel running jobs',
            action: 'cancel',
            target: ['running'],
        },
        {
            label: 'Retry cancelled jobs',
            action: 'retry',
            target: ['terminated'],
        },
        {
            label: 'Retry failed jobs',
            action: 'retry',
            target: ['error'],
        },
    ];

    const TARGET_SEPARATOR = '||';

    /**
     * create a job action dropdown instance
     *
     * The config should be an object with a property 'jobManager', an object with
     * functions that are executed when one of the dropdown options is selected.
     * The job manager supplies the model that holds the cell's job data, which the widget uses
     * to enable or disable dropdown options, depending on the statuses of the current jobs. It
     * also supplies the bus, using which the appropriate messages to cancel or retry jobs are sent.
     *
     * @param {object} config
     * @returns jobActionDropdown instance
     */
    function factory(config) {
        const { jobManager } = config;

        const api = {
            start,
            stop,
            updateState,
        };

        if (config.devMode || DevMode.mode) {
            api.doBatchJobAction = doBatchJobAction;
        }

        if (!jobManager) {
            throw new Error(
                'Cannot create jobActionDropdown: must supply config object with key "jobManager"'
            );
        }
        let container;

        /**
         * Kick off a batch job action
         *
         * @param {event} e - event
         *
         * The target element's "data-" properties encode the action to be performed:
         *
         * - data-action - either "cancel" or "retry"
         * - data-target - the job status(es) of the jobs to perform the action on
         *
         * @returns {Promise} that resolves to false if there is some error with the input or
         * if the user cancels the batch action. If the users confirms the action, the appropriate
         * message will be emitted by the bus.
         */

        function doBatchJobAction(e) {
            const el = e.target;
            const action = el.getAttribute('data-action'),
                statusList = el.getAttribute('data-target').split(TARGET_SEPARATOR);

            // valid actions: cancel or retry
            if (!['cancel', 'retry'].includes(action)) {
                return Promise.resolve(false);
            }

            const jobList = jobManager.getCurrentJobsByStatus(
                statusList,
                Jobs.validStatusesForAction[action]
            );
            if (!jobList || !jobList.length) {
                return Promise.resolve(false);
            }

            return DialogMessages.showDialog({ action: `${action}Jobs`, statusList, jobList }).then(
                (confirmed) => {
                    if (confirmed) {
                        const jobIdList =
                            action === 'retry'
                                ? jobList.map((job) => {
                                      return job.retry_parent || job.job_id;
                                  })
                                : jobList.map((job) => {
                                      return job.job_id;
                                  });
                        jobManager.doJobAction(action, jobIdList);
                    }
                    return Promise.resolve(confirmed);
                }
            );
        }

        function createActionsDropdown() {
            // each button has an action, either 'cancel' or 'retry',
            // and a target, which refers to the status of the jobs
            // that the action will be performed upon.
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
                                        dataElement: `${actionObj.action}-${actionObj.target.join(
                                            TARGET_SEPARATOR
                                        )}`,
                                        dataAction: actionObj.action,
                                        dataTarget: actionObj.target.join(TARGET_SEPARATOR),
                                    },
                                    actionObj.label
                                )
                            );
                        })
                    ),
                ]
            );
        }

        function updateState() {
            const jobCountsByStatus = Jobs.getCurrentJobCounts(
                jobManager.model.getItem('exec.jobs.byId')
            );

            actionArr.forEach((action) => {
                const result = action.target.some((status) => {
                    return jobCountsByStatus[status];
                });
                // if the status exists, enable the button; otherwise, set it to disabled
                container.querySelector(
                    `[data-target="${action.target.join(TARGET_SEPARATOR)}"]`
                ).disabled = !result;
            });
        }

        /**
         *
         * @param {object} args  -- with keys
         *      node:       DOM node to attach to
         *
         * @returns {Promise} started JobActionDropdown widget
         */
        function start(args) {
            return Promise.try(() => {
                if (!args.node) {
                    throw new Error('start argument must have the key "node"');
                }
                container = args.node;
                container.innerHTML = createActionsDropdown();
                updateState();

                container.querySelector('.kb-job-action__dropdown-menu').onclick = (e) => {
                    e.stopPropagation();
                    const $currentButton = $(e.target).closest('button');
                    if ($currentButton[0]) {
                        return Promise.resolve(doBatchJobAction(e));
                    }
                    return Promise.resolve(false);
                };
            });
        }

        function stop() {
            return Promise.try(() => {
                if (container) {
                    container.remove();
                }
            });
        }

        return api;
    }

    return {
        make: (config) => {
            return factory(config);
        },
        cssBaseClass,
    };
});
