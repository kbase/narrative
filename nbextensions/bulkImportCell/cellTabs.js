define([
    'common/html'
], (
    html
) => {
    'use strict';

    const div = html.tag('div'),
        span = html.tag('span'),
        a = html.tag('a'),
        cssCellType = 'kb-bulk-import';

    class CellTabs {
        /**
         *
         * @param {object} options
         * - bus - the message bus
         * - ui - the ui controller
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
         */
        constructor(options) {
            this.bus = options.bus;
            this.ui = options.ui;
            this.tabToggleAction = options.toggleAction;
            this.controlBarTabs = options.tabs;
        }

        setState(newState) {
            this.state = newState;
            for (const tabId of Object.keys(this.state.tabs)) {
                const tabState = this.state.tabs[tabId];
                if (tabState) {
                    tabState.enabled ? this.ui.enableButton(tabId) : this.ui.disableButton(tabId);
                    tabState.visible ? this.ui.showButton(tabId) : this.ui.hideButton(tabId);
                }
                this.ui.deactivateButton(tabId);
            }
            this.ui.activateButton(this.state.selected);
        }

        buildLayout(ui, events) {
            return div({
                class: `${cssCellType}-tabs__container`,
            }, [
                div({
                    class: `${cssCellType}-tabs__toolbar btn-toolbar`,
                }, [
                    this.buildTabButtons(ui, events)
                ])
            ]);
        }

        buildTabButtons(events) {
            const buttons = Object.keys(this.controlBarTabs.tabs).map((key) => {
                const tab = this.controlBarTabs.tabs[key];
                let icon;
                if (!tab) {
                    console.warn('Tab not defined: ' + key);
                    return;
                }
                if (tab.icon) {
                    if (typeof tab.icon === 'string') {
                        icon = {
                            name: tab.icon,
                            size: 2
                        };
                    } else {
                        icon = {size: 2};
                    }
                }
                return this.ui.buildButton({
                    label: tab.label,
                    name: key,
                    events: events,
                    type: tab.type || 'primary',
                    hidden: true,
                    features: tab.features,
                    classes: [`${cssCellType}-tabs__button kb-app-cell-btn`],
                    event: {
                        type: 'control-panel-tab',
                        data: {
                            tab: key
                        }
                    },
                    icon: icon
                });
            }).filter(function(x) {
                return x ? true : false;
            });
            this.bus.on('control-panel-tab', (message) => {
                var tab = message.data.tab;
                this.tabToggleAction(tab);
            });

            var outdatedBtn = a({
                tabindex: '0',
                type: 'button',
                class: `${cssCellType}-tabs__button--outdated btn hidden`,
                dataContainer: 'body',
                container: 'body',
                dataToggle: 'popover',
                dataPlacement: 'bottom',
                dataTrigger: 'focus',
                dataElement: 'outdated',
                role: 'button',
                title: 'New version available',
            }, span({
                class: 'fa fa-exclamation-triangle fa-2x'
            }));
            buttons.unshift(outdatedBtn);

            return buttons;
        }

        start() {

        }

        stop() {

        }

    }

    return CellTabs;
});
