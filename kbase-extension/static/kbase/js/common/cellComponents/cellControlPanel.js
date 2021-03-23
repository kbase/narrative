define(['common/html', 'common/cellComponents/actionButtons'], (html, ActionButton) => {
    'use strict';

    const div = html.tag('div'),
        cssBaseClass = 'kb-rcp';

    /**
     * options -
     * - bus - the message bus
     * - ui - the UI controller
     * - action: object that defines the action buttons:
     *   - current: which is the current button, and its state:
     *     - name - string, one of the action keys
     *     - disabled - if truthy, then should not be clickable
     *   - availableButtons - the set of available buttons, each key
     *      is the button name, values have the following properties:
     *      - help - tooltip string
     *      - type - Bootstrap class types
     *      - classes - array of classes to add to the button component
     *      - label - button text
     *   - runAction - function that gets run when the button is clicked,
     *      takes the button name as the single parameter
     * @param {object} options
     */
    function CellControlPanel(options) {
        const bus = options.bus;
        const ui = options.ui;
        const actionButton = ActionButton.make({
            ui: ui,
            bus: bus,
            runAction: options.action.runAction,
            actionButtons: options.action.actions,
        });

        function setActionState(newState) {
            actionButton.setState(newState);
        }

        function setExecMessage(message) {
            if (message === null || message === undefined) {
                message = '';
            }
            ui.setContent('run-control-panel.execMessage', message);
        }

        function buildLayout(events) {
            return div(
                {
                    class: `${cssBaseClass}__layout_div`,
                    dataElement: 'run-control-panel',
                },
                [
                    // action button widget
                    actionButton.buildLayout(events),
                    // status stuff
                    div({
                        class: `${cssBaseClass}-status__fsm_display hidden`,
                        dataElement: 'fsm-display',
                    }),
                    div({
                        class: `${cssBaseClass}-status__container`,
                        dataElement: 'execMessage',
                    }),
                    div({
                        class: `${cssBaseClass}__toolbar`,
                        dataElement: 'toolbar',
                    }),
                ]
            );
        }

        return {
            buildLayout: buildLayout,
            setActionState: setActionState,
            setExecMessage: setExecMessage,
        };
    }

    return {
        make: CellControlPanel,
    };
});
