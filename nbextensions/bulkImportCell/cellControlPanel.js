define([
    'common/html',
    'common/commonCell/actionButtons',
    './cellTabs'
], (
    html,
    ActionButton,
    CellTabs
) => {
    'use strict';

    const div = html.tag('div'),
        span = html.tag('span'),
        cssCellType = 'kb-bulk-import';

    class CellControlPanel {
        /**
         * options -
         * - bus - the message bus
         * - ui - the UI controller
         * - tabs: an object with the following properties:
         *   - toggleAction - a function that should be run when toggling tabs, takes
         *      the tab name as a single parameter
         *   - tabs: also an object:
         *     - selectedTab - string, one of the keys under "tabs"
         *     - tabs - an object where each key is a tab key, and has a display label:
         *       {
         *          configure: {
         *              label: "Configure"
         *          }
         *          , etc.
         *       }
         * - actions: object that defines the action buttons:
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
        constructor(options) {
            this.bus = options.bus;
            this.ui = options.ui;

            this.cellTabs = new CellTabs({
                ui: this.ui,
                bus: this.bus,
                toggleAction: options.tabs.toggleAction,
                tabs: options.tabs.tabs
            });

            this.actionButton = ActionButton.make({
                ui: this.ui,
                bus: this.bus,
                runAction: options.action.runAction,
                actionButtons: options.action.actions
            });
        }

        start() {

        }

        stop() {
            this.cellTabs.stop();
            this.actionButton.stop();
        }

        setTabState(newState) {
            this.cellTabs.setState(newState);
        }

        setActionState(newState) {
            this.actionButton.setState(newState);
        }

        buildLayout(events) {
            return div({
                class: `${cssCellType}-control-panel__container`,
                dataElement: 'run-control-panel'
            }, [
                div({
                    class: `${cssCellType}-control-panel__border`,
                }, [
                    this.actionButton.buildLayout(events),
                    div({
                        class: `${cssCellType}-control-panel__status_container`,
                        dataElement: 'status',
                    }, [
                        div({
                            class: `${cssCellType}-control-panel__message_box_holder`,
                        }, [
                            div({
                                class: `${cssCellType}-control-panel__message_box`,
                            }, [
                                span({
                                    class: `${cssCellType}-control-panel__exec_message`,
                                    dataElement: 'execMessage'
                                })
                            ])
                        ])
                    ]),
                    div({
                        class: `${cssCellType}-control-panel__tab_bar`,
                        dataElement: 'toolbar',
                    }, [
                        this.cellTabs.buildLayout(events)
                    ])
                ])
            ]);
        }
    }

    return CellControlPanel;
});
