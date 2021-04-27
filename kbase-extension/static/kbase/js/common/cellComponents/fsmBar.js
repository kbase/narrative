define(['common/html', 'util/developerMode'], (html, devMode) => {
    'use strict';

    const span = html.tag('span'),
        developerMode = devMode.mode;

    /**
     * Display the state of the FSM and the job (if appropriate) in the cell
     * toolbar for debugging purposes.
     *
     * The FSM info will be placed under the node with data element 'fsm-display'
     *
     * @param {object} args with keys
     *      ui: common/ui object with the appropriate node set
     *      state: current FSM state
     *      job: current jobState object OR
     *      indexedJobs: object containing jobState objects, indexed by job ID
     */
    function showFsmBar(args) {
        const { ui, state, job, indexedJobs } = args;

        if (!developerMode) {
            return;
        }

        const stateObj = state && state.state ? state.state : {};
        if (!state) {
            console.warn('FSMBar: no current FSM state found');
            // return;
        }
        let content = Object.keys(stateObj || {})
            .map((key) => {
                return span([
                    span(
                        {
                            class: 'kb-fsm__key',
                        },
                        `${key}:`
                    ),
                    span(
                        {
                            class: 'kb-fsm__value',
                        },
                        stateObj[key]
                    ),
                ]);
            })
            .join('  ');

        if (job && job.job_id) {
            content =
                span([
                    span(
                        {
                            class: 'kb-fsm__key',
                        },
                        'job ID:'
                    ),
                    span(
                        {
                            class: 'kb-fsm__value',
                        },
                        job.job_id
                    ),
                ]) + content;
        }
        if (indexedJobs && Object.keys(indexedJobs).length) {
            content =
                span([
                    span(
                        {
                            class: 'kb-fsm__key',
                        },
                        'jobs:'
                    ),
                    Object.keys(indexedJobs)
                        .sort()
                        .map((jobId) => {
                            return span(
                                {
                                    class: 'kb-fsm__value',
                                },
                                jobId
                            );
                        })
                        .join('; '),
                ]) + content;
        }

        ui.getElement('fsm-display').classList.remove('hidden');
        ui.setContent('fsm-display', content);
    }
    return {
        showFsmBar,
    };
});
