define(['bluebird', 'common/events', 'common/html'], (Promise, Events, html) => {
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
     * The job manager functions use the 'action' and 'target' properties of the dropdown
     * option to generate the appropriate function name and arguments.
     *
     * The config also supplies the model that holds the cell's job data, which the widget uses
     * to enable or disable dropdown options, depending on the statuses of the current jobs.
     *
     * @param {object} config
     * @returns jobActionDropdown instance
     */
    function factory(config) {
        const { jobManager, model } = config;

        if (!jobManager || !model) {
            throw new Error(
                'Cannot create jobActionDropdown: must supply config object with keys "jobManager" and "model"'
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
         */

        function doBatchJobAction(e) {
            const el = e.target;
            const action = el.getAttribute('data-action'),
                target = el.getAttribute('data-target').split(TARGET_SEPARATOR);

            // valid actions: cancel or retry
            if (['cancel', 'retry'].includes(action)) {
                jobManager[`${action}JobsByStatus`](target);
            }
        }

        function createActionsDropdown(events) {
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
                                        id: events.addEvent({
                                            type: 'click',
                                            handler: doBatchJobAction,
                                        }),
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
            const jobsByStatus = model.getItem(`exec.jobs.byStatus`);
            actionArr.forEach((action) => {
                const result = action.target.some((status) => {
                    return jobsByStatus[status];
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
        //  *      model:      Props object with job status information
         *
         * @returns {Promise} started JobStateList widget
         */
        function start(args) {
            return Promise.try(() => {
                const requiredArgs = ['node'];
                if (!requiredArgs.every((arg) => arg in args && args[arg])) {
                    throw new Error(
                        'start argument must have these keys: ' + requiredArgs.join(', ')
                    );
                }
                container = args.node;
                const events = Events.make({ node: args.node });
                const actionDropdown = createActionsDropdown(events);
                container.innerHTML = actionDropdown;
                updateState();
                events.attachEvents();
            });
        }

        function stop() {
            return Promise.try(() => {
                container.remove();
            });
        }

        return {
            start,
            stop,
            updateState,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
        cssBaseClass: cssBaseClass,
    };
});
