define([
    'common/html'
], (
    html
) => {
    'use strict';

    const div = html.tag('div');

    class CellActionButton {
        /**
         *
         * @param {object} options has the following keys:
         *  - bus - the message bus
         *  - ui - the ui manager
         *  - runAction - invoked when the user clicks an active button, takes in the button name
         *      as a single parameter
         *  - actionButtons object that defines the action buttons:
         *   - current: which is the current button, and its state:
         *     - name - string, one of the action keys
         *     - disabled - if truthy, then should not be clickable
         *   - availableButtons - the set of available buttons, each key
         *      is the button name, values have the following properties:
         *      - help - tooltip string
         *      - type - Bootstrap class types
         *      - classes - array of classes to add to the button component
         *      - label - button text

         */
        constructor(options) {
            this.bus = options.bus;
            this.ui = options.ui;
            this.runAction = options.runAction;
            this.actionButtons = options.actions;
        }

        buildLayout(events) {
            return div({
                style: {
                    height: '50px',
                    overflow: 'hidden',
                    textAlign: 'left',
                    lineHeight: '50px',
                    verticalAlign: 'middle',
                    display: 'flex',
                    flexDirection: 'row'
                }
            }, [
                this.buildActionButtons(events)
            ]);
        }

        buildActionButtons(events) {
            const style = {
                padding: '6px'
            };
            const buttonList = Object.keys(this.actionButtons.availableButtons).map((key) => {
                const button = this.actionButtons.availableButtons[key],
                    classes = [].concat(button.classes);
                let icon;
                if (button.icon) {
                    icon = {
                        name: button.icon.name,
                        size: 2
                    };
                }
                return this.ui.buildButton({
                    tip: button.help,
                    name: key,
                    events: events,
                    type: button.type || 'default',
                    classes: classes,
                    // hidden: true,
                    // Overriding button class styles for this context.
                    style: {
                        width: '80px'
                    },
                    event: {
                        type: 'actionButton',
                        data: {
                            action: key
                        }
                    },
                    icon: icon,
                    label: button.label
                });
            });
            this.bus.on('actionButton', (message) => {
                const action = message.data.action;
                this.runAction(action);
            });

            var buttonDiv = div({
                class: 'btn-group',
                style: style
            }, buttonList);
            return buttonDiv;
        }

        /**
         *
         * @param {object} newState
         *  - name: action button to show
         *  - enabled: truthy if should be enabled
         */
        setState(newState) {
            this.state = newState;
            for (const btnName of Object.keys(this.actionButtons.availableButtons)) {
                this.ui.hideButton(btnName);
            }
            this.ui.showButton(this.state.name);
            this.state.enabled ? this.ui.enableButton(this.state.name) : this.ui.disableButton(this.state.name);
        }

        start() {

        }

        stop() {

        }

    }

    return CellActionButton;
});
