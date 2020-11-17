define([
    'bluebird',
    'common/html',
    'common/ui',
    'common/events'
], (
    Promise,
    html,
    UI,
    Events
) => {
    'use strict';

    const div = html.tag('div'),
        span = html.tag('span'),
        a = html.tag('a');

    function CellTabs(options) {
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
        let bus = options.bus,
            ui,
            tabToggleAction = options.toggleAction,
            controlBarTabs = options.tabs,
            state,
            container;

        function setState(newState) {
            state = newState;
            for (const tabId of Object.keys(state.tabs)) {
                const tabState = state.tabs[tabId];
                if (tabState) {
                    tabState.enabled ? ui.enableButton(tabId) : ui.disableButton(tabId);
                    tabState.visible ? ui.showButton(tabId) : ui.hideButton(tabId);
                }
                ui.deactivateButton(tabId);
            }
            ui.activateButton(state.selected);
        }

        function renderLayout() {
            const events = Events.make(),
                content = div({
                    style: {
                        display: 'inline-block',
                        right: '0',
                        height: '50px',
                        lineHeight: '50px',
                        paddingRight: '15px',
                        verticalAlign: 'bottom'
                    }
                }, [
                    div({
                        class: 'btn-toolbar',
                        style: {
                            display: 'inline-block',
                            verticalAlign: 'bottom'
                        }
                    }, [
                        buildTabButtons(events)
                    ])
                ]);
            return {
                content: content,
                events: events
            };
        }

        function buildTabButtons(events) {
            const buttons = Object.keys(controlBarTabs.tabs).map((key) => {
                const tab = controlBarTabs.tabs[key];
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
                        icon.size = 2;
                    }
                }
                return ui.buildButton({
                    label: tab.label,
                    name: key,
                    events: events,
                    type: tab.type || 'primary',
                    hidden: true,
                    features: tab.features,
                    classes: ['kb-app-cell-btn'],
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
            bus.on('control-panel-tab', (message) => {
                var tab = message.data.tab;
                tabToggleAction(tab);
            });

            var outdatedBtn = a({
                tabindex: '0',
                type: 'button',
                class: 'btn hidden',
                dataContainer: 'body',
                container: 'body',
                dataToggle: 'popover',
                dataPlacement: 'bottom',
                dataTrigger: 'focus',
                dataElement: 'outdated',
                role: 'button',
                title: 'New version available',
                style: {
                    color: '#f79b22',
                    padding: '6px 0 0 0'
                }
            }, span({
                class: 'fa fa-exclamation-triangle fa-2x'
            }));
            buttons.unshift(outdatedBtn);

            return buttons;
        }

        function start(args) {
            return Promise.try(() => {
                container = args.node;
                ui = UI.make({
                    node: container,
                    bus: bus
                });
                const layout = renderLayout();
                container.innerHTML = layout.content;
                layout.events.attachEvents(container);
            });
        }

        function stop() {
            return Promise.try(() => {

            });
        }

        return {
            start: start,
            stop: stop,
            setState: setState
        };

    }

    return {
        make: CellTabs
    };
});
