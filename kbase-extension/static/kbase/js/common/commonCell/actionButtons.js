define([
    'kb_common/html',
], function(
    html
){
    'use strict';
    function factory() {

        var t = html.tag,
            div = t('div');

        const actionButtons = {
            current: {
                name: null,
                disabled: null
            },
            availableButtons: {
                runApp: {
                    help: 'Run the app',
                    type: 'success',
                    classes: ['-run'],
                    label: 'Run'
                },
                cancel: {
                    help: 'Cancel the running app',
                    type: 'danger',
                    classes: ['-cancel'],
                    label: 'Cancel'
                },
                reRunApp: {
                    help: 'Edit and re-run the app',
                    type: 'default',
                    classes: ['-rerun'],
                    label: 'Reset'
                },
                resetApp: {
                    help: 'Reset the app and return to Edit mode',
                    type: 'default',
                    classes: ['-reset'],
                    label: 'Reset'
                },
                offline: {
                    help: 'Currently disconnected from the server.',
                    type: 'danger',
                    classes: ['-cancel'],
                    label: 'Offline'
                }
            }
        };

        function buildActionButtons(ui, events) {
            var style = {
                padding: '6px'
            };
            var buttonList = Object.keys(actionButtons.availableButtons).map(function(key) {
                var button = actionButtons.availableButtons[key],
                    classes = [].concat(button.classes),
                    icon;
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
                    hidden: true,
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

            var buttonDiv = div({
                class: 'btn-group',
                style: style
            }, buttonList);
            return buttonDiv;
        }

        function renderActionButton(ui, state, viewOnly){
            if (state.ui.actionButton && !viewOnly) {
                if (actionButtons.current.name) {
                    ui.hideButton(actionButtons.current.name);
                }
                var name = state.ui.actionButton.name;
                ui.showButton(name);
                actionButtons.current.name = name;
                if (state.ui.actionButton.disabled) {
                    ui.disableButton(name);
                } else {
                    ui.enableButton(name);
                }
            } else {
                if (actionButtons.current.name) {
                    ui.hideButton(actionButtons.current.name);
                }
            }
        }

        return {
            buildActionButtons: buildActionButtons,
            renderActionButton: renderActionButton
        };
    }

    return {
        make: function() {
            return factory();
        }
    };
});