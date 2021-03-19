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
     *      job: current jobState object
     */
    function showFsmBar(args) {
        const { ui, state, job } = args;

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
        ui.getElement('fsm-display').classList.remove('hidden');
        ui.setContent('fsm-display', content);
    }
    return {
        showFsmBar,
    };
});
