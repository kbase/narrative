define([
    'kb_common/html',
], function(
    html
){
    'use strict';
    function factory(config) {
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

        var t = html.tag,
            div = t('div'),
            cssCellType = 'kb-bulk-import';

        const actionButtons = config.actionButtons,
            ui = config.ui,
            bus = config.bus,
            runAction = config.runAction;
            // cssCellType = config.cssCellType;

        function buildLayout(events) {
            return div({
                class: `${cssCellType}-action-button__container`,
            }, [
                buildActionButtons(events)
            ]);
        }

        function buildActionButtons(events) {
            const buttonList = Object.keys(actionButtons.availableButtons).map((key) => {
                var button = actionButtons.availableButtons[key],
                    classes = [`${cssCellType}-action-button__button`].concat(button.classes);
                let icon;
                if (button.icon) {
                    icon = {
                        name: button.icon.name,
                        size: 2
                    };
                }
                return ui.buildButton({
                    tip: button.help,
                    name: key,
                    events: events,
                    type: button.type || 'default',
                    classes: classes,
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
            bus.on('actionButton', (message) => {
                const action = message.data;
                runAction(action);
            });

            return div({
                class: `${cssCellType}-action-button__list btn-group`
            }, buttonList);
        }

        function setState(newState) {
            let state = newState;
            for (const btnName of Object.keys(actionButtons.availableButtons)) {
                ui.hideButton(btnName);
            }
            ui.showButton(state.name);
            state.disable ? ui.disableButton(state.name): ui.enableButton(state.name);
        }

        return {
            setState: setState,
            buildLayout: buildLayout
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});