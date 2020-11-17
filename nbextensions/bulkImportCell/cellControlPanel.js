define([
    'common/html',
    './cellTabs',
    './actionButton'
], (
    html,
    CellTabs,
    ActionButton
) => {
    'use strict';

    const div = html.tag('div'),
        span = html.tag('span');

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
    function CellControlPanel(options) {
        let bus = options.bus;
        let ui = options.ui;

        // this.cellTabs = new CellTabs({
        //     ui: this.ui,
        //     bus: this.bus,
        //     toggleAction: options.tabs.toggleAction,
        //     tabs: options.tabs.tabs
        // });

        let actionButton = new ActionButton({
            ui: ui,
            bus: bus,
            runAction: options.action.runAction,
            actions: options.action.actions
        });

        function start() {

        }

        function stop() {
            // this.cellTabs.stop();
            actionButton.stop();
        }

        function setTabState(newState) {
            // this.cellTabs.setState(newState);
        }

        function setActionState(newState) {
            actionButton.setState(newState);
        }

        function buildLayout(events) {
            return div({ dataElement: 'run-control-panel' }, [
                div({
                    style: { border: '1px silver solid', height: '50px', position: 'relative', display: 'flex', flexDirection: 'row' }
                }, [
                    actionButton.buildLayout(events),
                    div({
                        dataElement: 'status',
                        style: {
                            width: '450px',
                            height: '50px',
                            overflow: 'hidden'
                        }
                    }, [
                        div({
                            style: {
                                height: '50px',
                                marginTop: '0px',
                                textAlign: 'left',
                                lineHeight: '50px',
                                verticalAlign: 'middle'
                            }
                        }, [
                            div([
                                span({ dataElement: 'execMessage' })
                            ])
                        ])
                    ]),
                    // div({
                    //     dataElement: 'toolbar',
                    //     style: {
                    //         position: 'absolute',
                    //         right: '0',
                    //         top: '0',
                    //         height: '50px'
                    //     }
                    // }, [
                    //     this.cellTabs.buildLayout(events)
                    // ])
                ])
            ]);
        }
        return {
            start: start,
            stop: stop,
            buildLayout: buildLayout,
            setActionState: setActionState
        };
    }

    return {
        make: CellControlPanel
    };
});
