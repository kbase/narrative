define([
    'require',
    'jquery',
    'bluebird',
    'uuid',
    'base/js/namespace',
    'common/runtime',
    'common/events',
    'common/error',
    'common/jupyter',
    'kb_common/html',
    'kb_common/format',
    'common/props',
    'kb_service/client/narrativeMethodStore',
    'common/pythonInterop',
    'common/utils',
    'common/unodep',
    'common/ui',
    'common/fsm',
    'common/cellUtils',
    'common/busEventManager',
    'common/format',
    'common/spec',
    'common/semaphore',
    'common/lang',
    'narrativeConfig',
    'google-code-prettify/prettify',
    './appCellWidget-fsm',
    './tabs/resultsTab',
    './tabs/logTab',
    './tabs/errorTab',
    './runClock',
    'css!google-code-prettify/prettify.css',
    'css!font-awesome.css'
], function (
    require,
    $,
    Promise,
    Uuid,
    Jupyter,
    Runtime,
    Events,
    ToErr,
    JupyterProxy,
    html,
    formatting,
    Props,
    NarrativeMethodStore,
    PythonInterop,
    utils,
    utils2,
    UI,
    Fsm,
    cellUtils,
    BusEventManager,
    format,
    Spec,
    Semaphore,
    lang,
    Config,
    PR,
    AppStates,
    resultsTabWidget,
    logTabWidget,
    errorTabWidget,
    RunClock
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        a = t('a'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        pre = t('pre'),
        input = t('input'),
        p = t('p'),
        blockquote = t('blockquote'),
        appStates = AppStates;

    function factory(config) {
        var hostNode,
            container, ui,
            workspaceInfo = config.workspaceInfo,
            runtime = Runtime.make(),
            cell = config.cell,
            parentBus = config.bus,
            // TODO: the cell bus should be created and managed through main.js,
            // that is, the extension.
            cellBus = runtime.bus().makeChannelBus({
                name: {
                    cell: utils.getMeta(cell, 'attributes', 'id')
                },
                description: 'A cell channel'
            }),
            bus = runtime.bus().makeChannelBus({
                description: 'A app cell widget'
            }),
            busEventManager = BusEventManager.make({
                bus: runtime.bus()
            }),
            model,
            spec,
            // HMM. Sync with metadata, or just keep everything there?
            settings = {
                showNotifications: {
                    label: 'Show the Notifications panel',
                    help: 'The notifications panel may contain informational, warning, or error messages emitted during the operation of the app cell',
                    defaultValue: false,
                    type: 'toggle',
                    element: 'notifications'
                },
                showAboutApp: {
                    label: 'Show the About This App panel',
                    help: 'The "About This App" panel shows summary and detailed information about the App for this App Cell.',
                    defaultValue: false,
                    type: 'toggle',
                    element: 'about-app'
                }
            },
            widgets = {},
            fsm,
            saveMaxFrequency = config.saveMaxFrequency || 5000,
            controlBarTabs = {},
            actionButtons = {
                current: {
                    name: null,
                    disabled: null
                },
                availableButtons: {
                    runApp: {
                        help: 'Run the app',
                        type: 'success',
                        classes: ['-run'],
                        xicon: {
                            name: 'play'
                        },
                        label: 'Run'                    
                    },
                    cancel: {
                        help: 'Cancel the running app',
                        type: 'danger',
                        classes: ['-cancel'],
                        xicon: {
                            name: 'stop'
                        },
                        label: 'Cancel'
                    },
                    reRunApp: {
                        help: 'Edit and re-run the app',
                        type: 'default',
                        classes: ['-rerun'],
                        xicon: {
                            name: 'refresh'
                        },
                        label: 'Reset'
                    },
                    resetApp: {
                        help: 'Reset the app and return to Edit mode',
                        type: 'default',
                        classes: ['-reset'],
                        xicon: {
                            name: 'refresh'
                        },
                        label: 'Reset'
                    }
                }
            };

        // NEW - TABS

        function pRequire(module) {
            return new Promise(function (resolve, reject) {
                require(module, function () {
                    resolve(arguments);
                }, function (err) {
                    reject(err);
                });
            });
        }

        function loadParamsWidget(arg) {
            return pRequire(['./appParamsWidget'])
                .spread(function (Widget) {
                    // TODO: widget should make own bus.
                    var bus = runtime.bus().makeChannelBus({ description: 'Parent comm bus for input widget' }),
                        widget = Widget.make({
                            bus: bus,
                            workspaceInfo: workspaceInfo,
                            initialParams: model.getItem('params')
                        });

                    bus.on('sync-params', function (message) {
                        message.parameters.forEach(function (paramId) {
                            bus.send({
                                parameter: paramId,
                                value: model.getItem(['params', message.parameter])
                            }, {
                                key: {
                                    type: 'update',
                                    parameter: message.parameter
                                }
                            });
                        });
                    });

                    bus.on('parameter-sync', function (message) {
                        var value = model.getItem(['params', message.parameter]);
                        bus.send({
                            //                            parameter: message.parameter,
                            value: value
                        }, {
                            // This points the update back to a listener on this key
                            key: {
                                type: 'update',
                                parameter: message.parameter
                            }
                        });
                    });

                    bus.on('set-param-state', function (message) {
                        model.setItem('paramState', message.id, message.state);
                    });

                    bus.respond({
                        key: {
                            type: 'get-param-state'
                        },
                        handle: function (message) {
                            return {
                                state: model.getItem('paramState', message.id)
                            }
                        }
                    });

                    bus.respond({
                        key: {
                            type: 'get-parameter'
                        },
                        handle: function (message) {
                            return {
                                value: model.getItem(['params', message.parameterName])
                            };
                        }
                    });

                    bus.on('parameter-changed', function (message) {
                        // TODO: should never get these in the following states....

                        var state = fsm.getCurrentState().state;
                        if (state.mode === 'editing') {
                            model.setItem(['params', message.parameter], message.newValue);
                            evaluateAppState();
                        } else {
                            console.warn('parameter-changed event detected when not in editing mode - ignored');
                        }
                    });

                    return widget.start({
                            node: arg.node,
                            appSpec: model.getItem('app.spec'),
                            parameters: spec.getSpec().parameters
                        })
                        .then(function () {
                            return {
                                bus: bus,
                                instance: widget
                            };
                        });
                });
        }

        function loadViewParamsWidget(arg) {
            return pRequire(['./appParamsViewWidget'])
                .spread(function (Widget) {
                    // TODO: widget should make own bus.
                    var bus = runtime.bus().makeChannelBus({ description: 'Parent comm bus for input widget' }),
                        widget = Widget.make({
                            bus: bus,
                            workspaceInfo: workspaceInfo,
                            initialParams: model.getItem('params')
                        });

                    bus.on('sync-params', function (message) {
                        message.parameters.forEach(function (paramId) {
                            bus.send({
                                parameter: paramId,
                                value: model.getItem(['params', message.parameter])
                            }, {
                                key: {
                                    type: 'update',
                                    parameter: message.parameter
                                }
                            });
                        });
                    });

                    bus.on('parameter-sync', function (message) {
                        var value = model.getItem(['params', message.parameter]);
                        bus.send({
                            //                            parameter: message.parameter,
                            value: value
                        }, {
                            // This points the update back to a listener on this key
                            key: {
                                type: 'update',
                                parameter: message.parameter
                            }
                        });
                    });

                    bus.on('set-param-state', function (message) {
                        model.setItem('paramState', message.id, message.state);
                    });

                    bus.respond({
                        key: {
                            type: 'get-param-state'
                        },
                        handle: function (message) {
                            return {
                                state: model.getItem('paramState', message.id)
                            };
                        }
                    });

                    bus.respond({
                        key: {
                            type: 'get-parameter'
                        },
                        handle: function (message) {
                            return {
                                value: model.getItem(['params', message.parameterName])
                            };
                        }
                    });

                    bus.on('parameter-changed', function (message) {
                        // TODO: should never get these in the following states....

                        var state = fsm.getCurrentState().state;
                        if (state.mode === 'editing') {
                            model.setItem(['params', message.parameter], message.newValue);
                            evaluateAppState();
                        } else {
                            console.warn('parameter-changed event detected when not in editing mode - ignored');
                        }
                    });

                    return widget.start({
                            node: arg.node,
                            appSpec: model.getItem('app.spec'),
                            parameters: spec.getSpec().parameters
                        })
                        .then(function () {
                            return {
                                bus: bus,
                                instance: widget
                            };
                        });
                });
        }

        function configureWidget() {
            function factory(config) {
                var container,
                    widget;

                function start(arg) {
                    container = arg.node;
                    return loadParamsWidget({
                            node: container
                        })
                        .then(function (result) {
                            widget = result;
                        });

                }

                function stop() {
                    return Promise.try(function () {
                        if (widget) {
                            return widget.instance.stop();
                        }
                    });
                }

                return {
                    start: start,
                    stop: stop
                };
            }

            return {
                make: function (config) {
                    return factory(config);
                }
            };
        }

        function viewConfigureWidget() {
            function factory(config) {
                var container,
                    widget;

                function start(arg) {
                    container = arg.node;
                    return loadViewParamsWidget({
                            node: container
                        })
                        .then(function (result) {
                            widget = result;
                        });
                }

                function stop() {
                    return Promise.try(function () {
                        if (widget) {
                            return widget.instance.stop();
                        }
                    });
                }

                return {
                    start: start,
                    stop: stop
                };
            }

            return {
                make: function (config) {
                    return factory(config);
                }
            };
        }

        function loadWidget(name) {
            return new Promise(function (resolve, reject) {
                require('./tabs/' + name, function (Widget) {
                    resolve(Widget);
                }, function (err) {
                    reject(err);
                });
            });
        }

        function startTab(tabId) {
            var selectedTab = controlBarTabs.tabs[tabId];

            if (selectedTab.widgetModule) {
                return loadWidget(selectedTab.widgetModule)
                    .then(function (Widget) {
                        controlBarTabs.selectedTab = {
                            id: tabId,
                            widget: Widget.make()
                        };

                        ui.activateButton(controlBarTabs.selectedTab.id);

                        var node = document.createElement('div');
                        ui.getElement('run-control-panel.tab-pane.widget').appendChild(node);

                        return controlBarTabs.selectedTab.widget.start({
                            node: node
                        });
                    });
            }
            controlBarTabs.selectedTab = {
                id: tabId,
                widget: selectedTab.widget.make({
                    model: model
                })
            };

            ui.activateButton(controlBarTabs.selectedTab.id);

            var node = document.createElement('div');
            ui.getElement('run-control-panel.tab-pane.widget').appendChild(node);

            return controlBarTabs.selectedTab.widget.start({
                node: node,
                model: model
            });
        }

        function stopTab() {
            ui.deactivateButton(controlBarTabs.selectedTab.id);

            return controlBarTabs.selectedTab.widget.stop()
                .catch(function (err) {
                    console.error('ERROR stopping', err);
                })
                .finally(function () {
                    var widgetNode = ui.getElement('run-control-panel.tab-pane.widget');
                    if (widgetNode.firstChild) {
                        widgetNode.removeChild(widgetNode.firstChild);
                    }
                    controlBarTabs.selectedTab = null;
                });
        }

        function selectTab(tabId) {
            if (controlBarTabs.selectedTab) {
                if (controlBarTabs.selectedTab.id === tabId) {
                    return;
                }
                return stopTab()
                    .then(function () {
                        return startTab(tabId);
                    });
            }
            return startTab(tabId);
        }

        function unselectTab() {
            if (controlBarTabs.selectedTab) {
                // close the tab
                return stopTab();
            }
        }

        function hidePane() {
            return Promise.try(function () {
                var paneNode = ui.getElement('run-control-panel.tab-pane');
                if (paneNode) {
                    paneNode.classList.add('hidden');
                }
            });
        }

        function showPane() {
            return Promise.try(function () {
                var paneNode = ui.getElement('run-control-panel.tab-pane');
                if (paneNode) {
                    paneNode.classList.remove('hidden');
                }
            });
        }

        function selectedTabId() {
            if (controlBarTabs.selectedTab) {
                return controlBarTabs.selectedTab.id;
            }
            return null;
        }

        /*
         * If tab not open, close any open one and open it.
         * If tab open, close it, leaving no tabs open.
         */
        // Track whether the user has selected a tab.
        // This is reset when the user closes a tab.
        var userSelectedTab = false;
        function toggleTab(tabId) {
            if (controlBarTabs.selectedTab) {
                if (controlBarTabs.selectedTab.id === tabId) {
                    return stopTab()
                        .then(function () {
                            // hide the pane, since we just closed the only open
                            //tab.
                            return hidePane();
                        })
                        .then(function () {
                            userSelectedTab = false;
                        });
                }
                return stopTab()
                    .then(function () {
                        return startTab(tabId);
                    })
                    .then(function () {
                        userSelectedTab = true;
                    });
            }
            return showPane()
                .then(function () {
                    startTab(tabId);
                })
                .then(function () {
                    userSelectedTab = true;
                });
        }


        controlBarTabs = {
            selectedTab: null,
            tabs: {
                configure: {
                    label: 'Configure',
                    xicon: 'pencil',
                    widget: configureWidget()
                },
                viewConfigure: {
                    label: 'Configure',
                    xicon: 'pencil',
                    widget: viewConfigureWidget()
                },
                logs: {
                    label: 'Job Status',
                    xicon: 'list',
                    widget: logTabWidget
                },
                results: {
                    label: 'Result',
                    xicon: 'file',
                    widget: resultsTabWidget
                },
                error: {
                    label: 'Error',
                    xicon: 'exclamation',
                    type: 'danger',
                    widget: errorTabWidget
                }
            }
        };

        // DATA API

        function getAppRef() {
            var app = model.getItem('app');

            // Make sure the app info stored in the model is valid.
            if (!app || !app.spec || !app.spec.info) {
                throw new ToErr.KBError({
                    type: 'internal-app-cell-error',
                    message: 'This app cell is corrupt -- the app info is incomplete',
                    advice: [
                        'This condition should never occur outside of a development environment',
                        'The tag of the app associated with the app cell must be one of "release", "beta", or "dev"',
                        'Chances are that this app cell was inserted in a development environment in which the app cell structure was in flux',
                        'You should remove this app cell from the narrative an insert an new one'
                    ]
                });
            }

            switch (app.tag) {
            case 'release':
                return {
                    ids: [app.spec.info.id],
                    tag: 'release',
                    version: app.spec.info.ver
                };
            case 'dev':
            case 'beta':
                return {
                    ids: [app.spec.info.id],
                    tag: app.tag
                };
            default:
                console.error('Invalid tag', app);
                throw new ToErr.KBError({
                    type: 'internal-app-cell-error',
                    message: 'This app cell is corrrupt -- the app tag ' + String(app.tag) + ' is not recognized',
                    advice: [
                        'This condition should never occur outside of a development environment',
                        'The tag of the app associated with the app cell must be one of "release", "beta", or "dev"',
                        'Chances are that this app cell was inserted in a development environment in which the app cell structure was in flux',
                        'You should remove this app cell from the narrative an insert an new one'
                    ]
                });
            }

        }

        function getAppSpec() {
            var appRef = getAppRef(),
                nms = new NarrativeMethodStore(runtime.config('services.narrative_method_store.url'), {
                    token: runtime.authToken()
                });

            return nms.get_method_spec(appRef)
                .then(function (data) {
                    if (!data[0]) {
                        throw new Error('App not found');
                    }
                    return data[0];
                });
        }

        // RENDER API

        function syncFatalError() {
            return;
            // TODO: resolve "fatal error" handling. I think this can be removed, but let's hold off.
            // var advice = model.getItem('fatalError.advice'),
            //     info = model.getItem('fatalError.info'),
            //     ul = t('ul'),
            //     li = t('li');
            // if (advice) {
            //     // Note the 1.2em seems to be the de-facto work around to have a list
            //     // align left with other blocks yet retain the bullet and the
            //     // indentation for list items.
            //     advice = ul({ style: { paddingLeft: '1.2em' } }, advice.map(function (adv) {
            //         return li(adv);
            //     }));
            // } else {
            //     advice = 'no advice';
            // }
            // if (info) {
            //     info = html.makeObjTable(info, { rotated: true, classes: [] });
            // } else {
            //     info = 'no additional info';
            // }
            // ui.setContent('fatal-error.title', model.getItem('fatalError.title'));
            // ui.setContent('fatal-error.message', model.getItem('fatalError.message'));
            // ui.setContent('fatal-error.advice', advice);
            // ui.setContent('fatal-error.info', info);
            // ui.setContent('fatal-error.detail', model.getItem('fatalError.detail'));
        }

        function showFsmBar() {
            var currentState = fsm.getCurrentState(),
                content = Object.keys(currentState.state).map(function (key) {
                    return span([
                        span({ style: { fontStyle: 'italic' } }, key),
                        ' : ',
                        span({ style: { padding: '4px', fontWeight: 'noramal', border: '1px silver solid', backgroundColor: 'gray', color: 'white' } }, currentState.state[key])
                    ]);
                }).join('  ');

            ui.setContent('fsm-display.content', content);
        }

        function renderAppSpec() {
            //            if (!env.appSpec) {
            //                return;
            //            }
            //            var specText = JSON.stringify(env.appSpec, false, 3),
            //                 fixedText = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return pre({
                dataElement: 'spec',
                class: 'prettyprint lang-json',
                style: { fontSize: '80%' }
            });
        }

        function renderAppSummary() {
            return table({ class: 'table table-striped' }, [
                tr([
                    th('Name'),
                    td({ dataElement: 'name' })
                ]),
                ui.ifAdvanced(function () {
                    return tr([
                        th('Module'),
                        td({ dataElement: 'module' })
                    ]);
                }),
                tr([
                    th('Id'),
                    td({ dataElement: 'id' })
                ]),
                tr([
                    th('Version'),
                    td({ dataElement: 'version' })
                ]),
                tr([
                    th('Summary'),
                    td({ dataElement: 'summary' })
                ]),
                tr([
                    th('Authors'),
                    td({ dataElement: 'authors' })
                ]),
                ui.ifAdvanced(function () {
                    return tr([
                        th('Git commit hash'),
                        td({ dataElement: 'git-commit-hash' })
                    ]);
                }),
                tr([
                    th('More info'),
                    td({ dataElement: 'catalog-link' })
                ])
            ]);
        }

        function renderAboutApp() {
            var aboutTabs = [{
                label: 'Summary',
                name: 'summary',
                content: renderAppSummary()
            }];
            if (ui.isDeveloper()) {
                aboutTabs.push({
                    label: 'Spec',
                    name: 'spec',
                    content: renderAppSpec()
                });
            }

            return html.makeTabs({
                tabs: aboutTabs
            });
        }

        function showElement(name) {
            var node = ui.getElement(name);
            if (!node) {
                return;
            }
            node.classList.remove('hidden');
        }

        function hideElement(name) {
            var node = ui.getElement(name);
            if (!node) {
                return;
            }
            node.classList.add('hidden');
        }


        function renderSetting(settingName) {
            var setting = settings[settingName],
                value;

            if (!setting) {
                return;
            }

            value = model.getItem(['user-settings', settingName], setting.defaultValue);
            switch (setting.type) {
            case 'toggle':
                if (value) {
                    showElement(setting.element);
                } else {
                    hideElement(setting.element);
                }
                break;
            }
        }

        function doChangeSetting(event) {
            var control = event.target,
                settingName = control.value;

            model.setItem(['user-settings', settingName], control.checked);

            renderSetting(settingName);
        }

        function renderSettings() {
            var events = Events.make({ node: container }),
                content = Object.keys(settings).map(function (key) {
                    var setting = settings[key],
                        settingsValue = model.getItem(['user-settings', key]) || setting.defaultValue;
                    return div({}, [
                        input({
                            type: 'checkbox',
                            checked: (settingsValue ? true : false),
                            dataSetting: key,
                            value: key,
                            id: events.addEvent({
                                type: 'change',
                                handler: function (e) {
                                    doChangeSetting(e);
                                }
                            })
                        }),
                        span({ style: { marginLeft: '4px', fontStyle: 'italic' } }, setting.label)
                    ]);
                }).join('\n');
            ui.setContent('settings.content', div([
                p('These options show or hide optional areas of the app cell'),
                content
            ]));
            events.attachEvents();

            //Ensure that the settings are reflected in the UI.
            Object.keys(settings).forEach(function (key) {
                renderSetting(key);
            });
        }

        function toBoolean(value) {
            if (value && value !== null) {
                return true;
            }
            return false;
        }

        function showAboutApp() {
            var appSpec = model.getItem('app.spec');
            ui.setContent('about-app.name', appSpec.info.name);
            ui.setContent('about-app.module', appSpec.info.namespace || ui.na());
            ui.setContent('about-app.id', appSpec.info.id);
            ui.setContent('about-app.summary', appSpec.info.subtitle);
            ui.setContent('about-app.version', appSpec.info.ver);
            ui.setContent('about-app.git-commit-hash', appSpec.info.git_commit_hash || ui.na());
            ui.setContent('about-app.authors', (function () {
                if (appSpec.info.authors && appSpec.info.authors.length > 0) {
                    return appSpec.info.authors.join('<br>');
                }
                return ui.na();
            }()));
            var appRef = [appSpec.info.id, model.getItem('app').tag].filter(toBoolean).join('/'),
                link = a({ href: '/#appcatalog/app/' + appRef, target: '_blank' }, 'Catalog Page');
            ui.setContent('about-app.catalog-link', link);
        }

        function showAppSpec() {
            if (!model.getItem('app.spec')) {
                return;
            }
            var specText = JSON.stringify(model.getItem('app.spec'), false, 3),
                fixedText = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                content = pre({ class: 'prettyprint lang-json', style: { fontSize: '80%' } }, fixedText);
            ui.setContent('about-app.spec', content);
        }

        function doActionButton(data) {
            switch (data.action) {
            case 'runApp':
                doRun();
                break;
            case 'reRunApp':
                doRerun();
                break;
            case 'resetApp':
                doResetApp();
                break;
            case 'cancel':
                doCancel();
                break;
            default:
                alert('Undefined action:' + data.action);
            }
        }

        function buildRunControlPanelRunButtons(events) {
            var style = {};
            if (Jupyter.narrative.readonly) {
                style.display = 'none';            
            }
            style.padding = '6px';
            var buttonDiv = div({ 
                class: 'btn-group', 
                style: style 
            },
                Object.keys(actionButtons.availableButtons).map(function (key) {
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
                })
            );
            return buttonDiv;
        }

        function buildRunControlPanelDisplayButtons(events) {
            var buttons = Object.keys(controlBarTabs.tabs).map(function (key) {
                var tab = controlBarTabs.tabs[key],
                    icon;
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
            }).filter(function (x) {
                return x ? true : false;
            });
            bus.on('control-panel-tab', function (message) {
                var tab = message.data.tab;
                toggleTab(tab);
            });
            return buttons;
        }

        function buildRunControlPanel(events) {
            return div({ dataElement: 'run-control-panel' }, [
                div({
                    style: { border: '1px silver solid', height: '50px', position: 'relative' }
                }, [
                    div({ style: { position: 'absolute', top: '0', bottom: '0', left: '0', right: '0' } }, [
                        div({
                            style: {
                                width: '100px',
                                height: '50px',
                                position: 'absolute',
                                top: '0',
                                left: '0'
                            }
                        }, [
                            div({
                                style: {
                                    height: '50px',
                                    width: '100px',
                                    overflow: 'hidden',
                                    textAlign: 'left',
                                    lineHeight: '50px',
                                    verticalAlign: 'middle',
                                    textStyle: 'italic'
                                }
                            }, [
                                buildRunControlPanelRunButtons(events)
                            ])
                        ]),

                        div({
                            dataElement: 'status',
                            style: {
                                position: 'absolute',
                                left: '100px',
                                top: '0',
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
                        div({
                            dataElement: 'toolbar',
                            style: {
                                position: 'absolute',
                                right: '0',
                                top: '0',
                                height: '50px'
                            }
                        }, [
                            div({
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
                                }, buildRunControlPanelDisplayButtons(events))
                            ])
                        ])
                    ])
                ]),
                div({
                    dataElement: 'tab-pane'
                }, [
                    div({ dataElement: 'widget' })
                ])
            ]);
        }

        function renderLayout() {
            var events = Events.make(),
                content = div({ class: 'kbase-extension kb-app-cell', style: { display: 'flex', alignItems: 'stretch' } }, [
                    div({ class: 'prompt', dataElement: 'prompt', style: { display: 'flex', alignItems: 'stretch', flexDirection: 'column' } }, [
                        div({ dataElement: 'status' })
                    ]),
                    div({
                        class: 'body',
                        dataElement: 'body',
                        style: { display: 'flex', alignItems: 'stretch', flexDirection: 'column', flex: '1' }
                    }, [
                        div({ dataElement: 'widget', style: { display: 'block', width: '100%' } }, [
                            div({ class: 'container-fluid' }, [
                                div({
                                    class: 'kb-app-warning alert alert-warning hidden',
                                    dataElement: 'outdated',
                                    role: 'alert'
                                }, [
                                    span({ style: { 'font-weight': 'bold' } }, 'Warning'),
                                    ': this app appears to be out of date. Running it may cause undesired results. Add a new "<b>' + model.getItem('app.spec.info.name') + '</b>" App for the most recent version.'
                                ]),
                                ui.buildPanel({
                                    title: 'App Cell Settings',
                                    name: 'settings',
                                    hidden: true,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: div({ dataElement: 'content' })
                                }),
                                ui.buildCollapsiblePanel({
                                    title: 'Notifications',
                                    name: 'notifications',
                                    hidden: true,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: [
                                        div({ dataElement: 'content' })
                                    ]
                                }),
                                ui.buildCollapsiblePanel({
                                    title: 'About',
                                    name: 'about-app',
                                    hidden: true,
                                    collapsed: false,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: [
                                        div({ dataElement: 'about-app' }, renderAboutApp())
                                    ]
                                }),
                                (function () {
                                    if (!ui.isDeveloper()) {
                                        return;
                                    }
                                    return ui.buildCollapsiblePanel({
                                        title: 'Dev',
                                        name: 'developer-options',
                                        hidden: true,
                                        type: 'default',
                                        classes: ['kb-panel-container'],
                                        body: [
                                            div({ dataElement: 'fsm-display', style: { marginBottom: '4px' } }, [
                                                span({ style: { marginRight: '4px' } }, 'FSM'),
                                                span({ dataElement: 'content' })
                                            ]),
                                            div([
                                                ui.makeButton('Show Code', 'toggle-code-view', { events: events }),
                                                ui.makeButton('Edit Metadata', 'edit-cell-metadata', { events: events }),
                                                ui.makeButton('Edit Notebook Metadata', 'edit-notebook-metadata', { events: events })
                                            ])
                                        ]
                                    });
                                }()),
                                buildRunControlPanel(events)
                            ])
                        ])
                    ])
                ]);
            return {
                content: content,
                events: events
            };
        }

        // this should be elevated to the collection of parameters.
        // Perhaps the top level parameter should be a special field wrapping a struct?
        function validateModel() {
            return spec.validateModel(model.getItem('params'));
        }

        // TODO: we need to determine the proper forms for a app identifier, and
        // who creates this canonical identifier. E.g. the method panel supplies
        // the app id to the cell, but it gets it from the kernel, which gets it
        // directly from the nms/catalog. If the catalog provides the version
        // for a beta or release tag ...
        function fixApp(app) {
            switch (app.tag) {
            case 'release':
                return {
                    id: app.id,
                    tag: app.tag,
                    version: app.version
                };
            case 'beta':
            case 'dev':
                return {
                    id: app.id,
                    tag: app.tag,
                    version: app.gitCommitHash
                };
            default:
                throw new Error('Invalid tag for app ' + app.id);
            }
        }

        function buildPython(cell, cellId, app, params) {
            var runId = new Uuid(4).format(),
                fixedApp = fixApp(app),
                code = PythonInterop.buildAppRunner(cellId, runId, fixedApp, params);
            // TODO: do something with the runId
            cell.set_text(code);
        }


        function resetPython(cell) {
            cell.set_text('');
        }

        function initializeFSM() {
            var currentState = model.getItem('fsm.currentState');
            if (!currentState) {
                // TODO: evaluate the state of things to try to guess the state?
                // Or is this just an error unless it is a new cell?
                // currentState = {mode: 'editing', params: 'incomplete'};
                currentState = { mode: 'new' };
            }
            fsm = Fsm.make({
                states: appStates,
                initialState: {
                    mode: 'new'
                },
                onNewState: function (fsm) {
                    model.setItem('fsm.currentState', fsm.getCurrentState().state);
                    // save the narrative!

                }
            });
            // fsm events

            fsm.bus.on('on-execute-requested', function () {
                ui.setContent('run-control-panel.status.execMessage', 'Sending...');
            });
            fsm.bus.on('exit-execute-requested', function () {
                ui.setContent('run-control-panel.status.execMessage', '');
            });
            fsm.bus.on('on-launched', function () {
                ui.setContent('run-control-panel.status.execMessage', 'Launching...');
            });
            fsm.bus.on('exit-launched', function () {
                ui.setContent('run-control-panel.status.execMessage', '');
            });

            fsm.bus.on('start-queueing', function () {
                doStartQueueing();
            });
            fsm.bus.on('stop-queueing', function () {
                doStopQueueing();
            });

            fsm.bus.on('start-running', function () {
                doStartRunning();
            });
            fsm.bus.on('stop-running', function () {
                doStopRunning();
            });

            fsm.bus.on('on-success', function () {
                doOnSuccess();
            });

            fsm.bus.on('exit-success', function () {
                doExitSuccess();
            });

            fsm.bus.on('on-error', function () {
                doOnError();
            });

            fsm.bus.on('exit-error', function () {
                doExitError();
            });
            fsm.bus.on('on-cancelling', function () {
                doOnCancelling();
            });

            fsm.bus.on('exit-cancelling', function () {
                doExitCancelling();
            });
            fsm.bus.on('on-cancelled', function () {
                doOnCancelled();
            });

            fsm.bus.on('exit-cancelled', function () {
                doExitCancelled();
            });

            try {
                fsm.start(currentState);
            } catch (ex) {
                // TODO should be explicit exception if want to continue with solution
                model.setItem('internalError', {
                    title: 'Error initializing app state',
                    message: ex.message,
                    advice: [
                        'Reset the app with the red recycle button and try again.',
                        'If that fails, delete the app cell and re-insert it.'
                    ],
                    info: null,
                    detail: null
                });
                syncFatalError();
                fsm.start({ mode: 'internal-error' });
            }
        }

        // LIFECYCYLE API

        function doEditNotebookMetadata() {
            JupyterProxy.editNotebookMetadata();
        }

        function doEditCellMetadata() {
            JupyterProxy.editCellMetadata(cell);
        }

        function initCodeInputArea() {
            model.setItem('user-settings.showCodeInputArea', false);
        }

        function showCodeInputArea() {
            var codeInputArea = cell.input.find('.input_area');
            if (model.getItem('user-settings.showCodeInputArea')) {
                codeInputArea.removeClass('hidden');
            } else {
                codeInputArea.addClass('hidden');
            }
        }

        function toggleCodeInputArea() {
            if (model.getItem('user-settings.showCodeInputArea')) {
                model.setItem('user-settings.showCodeInputArea', false);
            } else {
                model.setItem('user-settings.showCodeInputArea', true);
            }
            showCodeInputArea();
            return model.getItem('user-settings.showCodeInputArea');
        }

        function toggleSettings() {
            var name = 'showSettings',
                selector = 'settings',
                node = ui.getElement(selector),
                showing = model.getItem(['user-settings', name]);
            if (showing) {
                model.setItem(['user-settings', name], false);
            } else {
                model.setItem(['user-settings', name], true);
            }

            showing = model.getItem(['user-settings', name]);
            if (showing) {
                node.classList.remove('hidden');
            } else {
                node.classList.add('hidden');
            }
            return showing;
        }

        function doRemoveNotification(index) {
            var notifications = model.getItem('notifications') || [];
            notifications.splice(index, 1);
            model.setItem('notifications', notifications);
            renderNotifications();
        }

        function renderNotifications() {
            var events = Events.make(),
                notifications = model.getItem('notifications') || [],
                content;

            if (notifications.length === 0) {
                content = span({ style: { fontStyle: 'italic' } }, 'There are currently no notifications');
            } else {
                content = notifications.map(function (notification, index) {
                    return div({ class: 'row' }, [
                        div({ class: 'col-md-10' }, notification),
                        div({ class: 'col-md-2', style: { textAlign: 'right' } }, span({}, [
                            a({
                                class: 'btn btn-default',
                                id: events.addEvent({
                                    type: 'click',
                                    handler: function () {
                                        doRemoveNotification(index);
                                    }
                                })
                            }, 'X')
                        ]))
                    ]);
                }).join('\n');
            }
            ui.setContent('notifications.content', content);
            events.attachEvents(container);
        }

        function addNotification(notification) {
            var notifications = model.getItem('notifications') || [];
            notifications.push(notification);
            model.setItem('notifications', notifications);
            renderNotifications();
        }

        function clearNotifications() {
            model.setItem('notifications', []);
        }

        // WIDGETS

        /*
         *
         * Render the UI according to the FSM
         */
        function renderUI() {
            showFsmBar();
            renderNotifications();
            renderSettings();
            var state = fsm.getCurrentState();
            if (model.getItem('outdated')) {
                ui.showElement('outdated');
            }

            var indicatorNode = ui.getElement('run-control-panel.status.indicator');
            var iconNode = ui.getElement('run-control-panel.status.indicator.icon');
            if (iconNode) {
                // clear the classes

                indicatorNode.className = state.ui.appStatus.classes.join(' ');

                iconNode.className = '';
                iconNode.classList.add('fa', 'fa-' + state.ui.appStatus.icon.type, 'fa-3x');
            }

            // Clear the measure
            // ui.setContent('run-control-panel.status.measure', '');

            // Tab state

            // TODO: let user-selection override auto-selection of tab, unless
            // the user-selected tab is no longer enabled or is hidden.

            // disable tab buttons
            // If current tab is not enabled in this state, then forget that the user 
            // made a selection.
            
            var userStateTab = state.ui.tabs[selectedTabId()];
            if (!userStateTab || !userStateTab.enabled || userStateTab.hidden) {
                userSelectedTab = false;
            }

            var tabSelected = false;
            Object.keys(state.ui.tabs).forEach(function (tabId) {
                var tab = state.ui.tabs[tabId];
                if (tab.enabled) {
                    ui.enableButton(tabId);
                } else {
                    ui.disableButton(tabId);
                }
                // TODO honor user-selected tab.
                // Unless the tab is not enabled in this state, in which case
                // we do switch to the one called for by the state.         
                if (tab.selected && !userSelectedTab) {
                    tabSelected = true;
                    selectTab(tabId);
                }
                if (tab.hidden) {
                    ui.hideButton(tabId);
                } else {
                    ui.showButton(tabId);
                }
            });
            // If no new tabs selected (even re-selecting an existing open tab)
            // close the open tab.
            if (!tabSelected && !userSelectedTab) {
                unselectTab();
            }

            if (state.ui.actionButton) {
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
            }
        }

        function toggleReadOnlyMode(readOnly) {
            if (!readOnly) {
                // restore state based on fsm.
                var buttonBar = container.querySelector('.kb-btn-toolbar-cell-widget');
                if (buttonBar) {
                    buttonBar.classList.remove('hidden');
                }
                renderUI();
                var curMode = fsm.getCurrentState().state.mode;
                if (curMode === 'processing') {
                    startListeningForJobMessages();
                }
            } else {
                // Hide the job starting/modifying buttons
                // It'd be nice to put all the elements in view-only mode,
                // to mimic a running state, right? Maybe that's another
                // FSM state?
                var buttonBar = container.querySelector('.kb-btn-toolbar-cell-widget');
                if (buttonBar) {
                    buttonBar.classList.add('hidden');
                }
                stopListeningForJobMessages();
            }
        }

        var saveTimer = null;

        function saveNarrative() {
            if (saveTimer) {
                return;
            }
            saveTimer = window.setTimeout(function () {
                saveTimer = null;
                JupyterProxy.saveNotebook();
            }, saveMaxFrequency);
        }

        /*
         * NB: the jobs panel takes care of removing the job info from the
         * narrative metadata.
         */
        function cancelJob(jobId) {
            runtime.bus().emit('request-job-cancellation', {
                jobId: jobId
            });
        }

        function requestJobStatus(jobId) {
            if (!jobId) {
                return;
            }
            runtime.bus().emit('request-job-status', {
                jobId: jobId
            });
        }

        function resetToEditMode() {
            // only do this if we are not editing.

            model.deleteItem('exec');

            // TODO: evaluate the params again before we do this.
            fsm.newState({ mode: 'editing', params: 'complete', code: 'built' });

            clearOutput();

            renderUI();
        }

        function resetAppAndEdit() {
            // only do this if we are not editing.

            model.deleteItem('exec');

            // TODO: evaluate the params again before we do this.
            fsm.newState({ mode: 'editing', params: 'incomplete' });

            clearOutput();

            renderUI();
        }

        function doRerun() {
            var confirmationMessage = div([
                p('This action will clear the Results and re-enable the Configure tab for editing. You may then change inputs and run the app again.'), 
                p('Any output you have already produced will be left intact in the Narrative and Data Panel'),
                p('Proceed to Reset and resume editing?')
            ]);
            ui.showConfirmDialog({ title: 'Reset and resume editing?', body: confirmationMessage })
                .then(function (confirmed) {
                    if (!confirmed) {
                        return;
                    }

                    // Remove all of the execution state when we reset the app.
                    resetToEditMode('do rerun');
                });
        }

        function doResetApp() {
            var confirmationMessage = div([
                p('This action will clear all parameters, run statistics, and logs and place the app into Edit mode.'),
                p('Proceed to Reset the app and Resume Editing?')
            ]);
            ui.showConfirmDialog({ title: 'Reset App?', body: confirmationMessage })
                .then(function (confirmed) {
                    if (!confirmed) {
                        return;
                    }

                    // Remove all of the execution state when we reset the app.
                    resetAppAndEdit('do reset');
                });
        }

        /*
         * Cancelling a job is the same as deleting it, and the effect of cancelling the job is the same as re-running it.
         *
         */
        function doCancel() {
            var confirmationMessage = div([
                p([
                    'Canceling the job will halt the job processing.',
                    'Any output objects already created will remain in your narrative and can be removed from the Data panel.'
                ]),
                p('Continue to Cancel the running job?')
            ]);
            ui.showConfirmDialog({ title: 'Cancel Job?', body: confirmationMessage })
                .then(function (confirmed) {
                    if (!confirmed) {
                        return;
                    }

                    var jobState = model.getItem('exec.jobState');
                    if (jobState) {
                        cancelJob(jobState.job_id);

                        fsm.newState({ mode: 'canceling' });
                        renderUI();
                        // the job will be deleted form the notebook when the job cancellation
                        // event is received.
                    } else {
                        // Hmm this is a rather odd case, but it has been seen in the wild.
                        // E.g. it could (logically) occur during launch phase (although the cancel button should not be available.)
                        // In erroneous conditions it could occur if a job failed or was
                        // cancelled but the state machine got confused.
                        model.deleteItem('exec');
                        fsm.newState({ mode: 'editing', params: 'complete', code: 'built' });
                        renderUI();
                    }
                });
        }

        function updateFromLaunchEvent(message) {

            // Update the exec state.
            // NB we need to do this because the launch events are only
            // sent once from the narrative back end.

            // Update FSM
            var newFsmState = (function () {
                switch (message.event) {
                case 'launched_job':
                    // NEW: start listening for jobs.
                    startListeningForJobMessages(message.job_id);
                    return { mode: 'processing', stage: 'launched' };
                case 'error':
                    return { mode: 'error', stage: 'launching' };
                default:
                    throw new Error('Invalid launch state ' + message.event);
                }
            }());
            fsm.newState(newFsmState);
            renderUI();
        }

        function updateFromJobState(jobState) {
            var currentState = fsm.getCurrentState(),
                newFsmState = (function () {
                    switch (jobState.job_state) {
                    case 'queued':
                        return { mode: 'processing', stage: 'queued' };
                    case 'job_started':
                        return { mode: 'processing', stage: 'running' };
                    case 'in-progress':
                        return { mode: 'processing', stage: 'running' };
                    case 'completed':
                        stopListeningForJobMessages();
                        return { mode: 'success' };
                    case 'canceled':
                        stopListeningForJobMessages();
                        return { mode: 'canceled' };
                    case 'suspend':
                    case 'error':
                        stopListeningForJobMessages();

                        // Due to the course granularity of job status
                        // messages, we don't can't rely on the prior state
                        // to inform us about what procesing stage the
                        // error occured in -- we need to inspect the job state.
                        var errorStage;
                        if (jobState.exec_start_time) {
                            errorStage = 'running';
                        } else if (jobState.creation_time) {
                            errorStage = 'queued';
                        }
                        if (errorStage) {
                            return {
                                mode: 'error',
                                stage: errorStage
                            };
                        }
                        return {
                            mode: 'error'
                        };
                    default:
                        throw new Error('Invalid job state ' + jobState.job_state);
                    }
                }());
            fsm.newState(newFsmState);
            renderUI();
        }

        // TODO: runId needs to be obtained here from the model.
        //       it is created during the code build (since it needs to be passed
        //       to the kernel)
        function doRun() {
            fsm.newState({ mode: 'execute-requested' });
            renderUI();

            // We want to close down the configure tab, so let's forget about
            // the fact that the user may have opened and closed the tab...
            userSelectedTab = false;

            // TODO: if we don't use this, we should remove it.
            // Save this to the exec state change log.
            var execLog = model.getItem('exec.log');
            if (!execLog) {
                execLog = [];
            }
            execLog.push({
                timestamp: new Date(),
                event: 'execute-requested',
                data: {
                    runId: 'should be here'
                }
            });
            model.setItem('exec.log', execLog);

            cell.execute();
        }

        // LIFECYCLE API

        function init() {
            return Promise.try(function () {
                initializeFSM();
                initCodeInputArea();
                return null;
            });
        }

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
                ui = UI.make({
                    node: container,
                    bus: bus
                });

                // TODO: better place/way to do this:
                if (ui.isDeveloper()) {
                    settings.showDeveloper = {
                        label: 'Show Developer features',
                        defaultValue: false,
                        type: 'toggle',
                        element: 'developer-options'
                    };
                }

                var layout = renderLayout();
                container.innerHTML = layout.content;
                layout.events.attachEvents(container);
                return null;
            });
        }

        function detach() {
            return Promise.try(function () {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                }
            });
        }

        var jobListeners = [];

        function startListeningForJobMessages(jobId) {
            var ev;

            ev = runtime.bus().listen({
                channel: {
                    jobId: jobId
                },
                key: {
                    type: 'job-status'
                },
                handle: function (message) {
                    var existingState = model.getItem('exec.jobState'),
                        newJobState = message.jobState,
                        outputWidgetInfo = message.outputWidgetInfo;
                    if (!existingState || !utils2.isEqual(existingState, newJobState)) {
                        model.setItem('exec.jobState', newJobState);
                        if (outputWidgetInfo) {
                            model.setItem('exec.outputWidgetInfo', outputWidgetInfo);
                        }

                        var execLog = model.getItem('exec.log');
                        if (!execLog) {
                            execLog = [];
                        }
                        execLog.push({
                            timestamp: new Date(),
                            event: 'job-status',
                            data: {
                                jobState: newJobState
                            }
                        });
                        model.setItem('exec.log', execLog);

                        // Now we send the job state on the cell bus, generally.
                        // The model is that a cell can only have one job active at a time.
                        // Thus we can just emit the state of the current job globally
                        // on the cell bus for thos widgets interested.
                        cellBus.emit('job-state', {
                            jobState: newJobState
                        });
                    } else {
                        cellBus.emit('job-state-updated', {
                            jobId: newJobState.job_id
                        });
                    }

                    model.setItem('exec.jobStateUpdated', new Date().getTime());

                    updateFromJobState(newJobState);
                }
            });
            jobListeners.push(ev);

            ev = runtime.bus().listen({
                channel: {
                    jobId: jobId
                },
                key: {
                    type: 'job-canceled'
                },
                handle: function () {
                    //  reset the cell into edit mode
                    var state = fsm.getCurrentState();
                    if (state.state.mode === 'editing') {
                        console.warn('in edit mode, so not resetting ui');
                        return;
                    }
                    resetToEditMode('job-canceled');
                }
            });
            jobListeners.push(ev);

            ev = runtime.bus().listen({
                channel: {
                    jobId: jobId
                },
                key: {
                    type: 'job-does-not-exist'
                },
                handle: function () {
                    //  reset the cell into edit mode
                    var state = fsm.getCurrentState();
                    if (state.state.mode === 'editing') {
                        console.warn('in edit mode, so not resetting ui');
                        return;
                    }

                    resetToEditMode('job-does-not-exist');
                }
            });
            jobListeners.push(ev);

            runtime.bus().emit('request-job-update', {
                jobId: jobId
            });
        }

        function stopListeningForJobMessages() {
            jobListeners.forEach(function (listener) {
                runtime.bus().removeListener(listener);
            });
            jobListeners = [];

            var jobId = model.getItem('exec.jobState.job_id');
            if (jobId) {
                runtime.bus().emit('request-job-completion', {
                    jobId: jobId
                });
            }
        }

        function createOutputCell(jobId) {
            var cellId = utils.getMeta(cell, 'attributes', 'id'),
                cellIndex = Jupyter.notebook.find_cell_index(cell),
                newCellId = new Uuid(4).format(),
                newCell = Jupyter.notebook.insert_cell_below('code', cellIndex);

            $([Jupyter.events]).trigger('inserted.Cell', {
                cell: newCell,
                kbase: {
                    type: 'output',
                    cellId: newCellId,
                    parentCellId: cellId,
                    jobId: jobId,
                    widget: model.getItem('exec.outputWidgetInfo')
                }
            });

            return newCellId;
        }

        function clearOutput() {
            var cellNode = cell.element.get(0),
                textNode = cellNode.querySelector('.output_area.output_text');

            if (textNode) {
                textNode.innerHTML = '';
            }
        }

        // FSM state change events

        function doStartRunning() {
            var jobState = model.getItem('exec.jobState');
            if (!jobState) {
                console.warn('What, no job state?');
                return;
            }

            var message = span([
                ui.loading({size: null, color: 'green'}),
                ' Running - ',
                span({dataElement: 'clock'})
            ]);
            ui.setContent('run-control-panel.status.execMessage', message);

            widgets.runClock = RunClock.make({
                prefix: 'started ',
                suffix: ' ago'
            });
            widgets.runClock.start({
                node: ui.getElement('run-control-panel.status.execMessage.clock'),
                startTime: jobState.exec_start_time
            })
            .catch(function (err) {
                ui.setContent('run-control-panel.status.execMessage.clock', 'ERROR:' + err.message);
            });
        }

        function doStopRunning() {
            if (widgets.runClock) {
                widgets.runClock.stop();
            }
        }

        function doStartQueueing() {
            var jobState = model.getItem('exec.jobState');
            if (!jobState) {
                console.warn('What, no job state?');
                return;
            }

            var message = span([
                ui.loading({color: 'green'}),
                ' Waiting in Queue - ',
                span({dataElement: 'clock'})
            ]);
            ui.setContent('run-control-panel.status.execMessage', message);

            widgets.runClock = RunClock.make({
                prefix: 'for '
            });
            widgets.runClock.start({
                node: ui.getElement('run-control-panel.status.execMessage.clock'),
                startTime: jobState.creation_time
            })
            .catch(function (err) {
                ui.setContent('run-control-panel.status.execMessage.clock', 'ERROR:' + err.message);
            });
        }

        function doStopQueueing() {
            if (widgets.runClock) {
                widgets.runClock.stop();
            }
        }

        function doExitSuccess() {
            if (widgets.runClock) {
                widgets.runClock.stop();
            }
            ui.setContent('run-control-panel.status.execMessage', '');
        }

        function niceState(jobState) {
            var label;
            var color;
            switch (jobState) {
            case 'completed':
                label = 'success';
                color = 'green';
                break;
            case 'suspend':
                label = 'error';
                color = 'red';
                break;
            case 'canceled':
                label = 'cancelation';
                color = 'orange';
                break;
            default:
                label = jobState;
                color = 'black';
            }

            return span({
                style: {
                    color: color,
                    fontWeight: 'bold'
                }
            }, label);
        }

        function doOnSuccess() {
            // have we created output yet?
            var jobState = model.getItem('exec.jobState'),
                jobId = model.getItem('exec.jobState.job_id'),
                outputCellId = model.getItem(['output', 'byJob', jobId, 'cell', 'id']),
                outputCell, notification;

            // show either the clock, if < 24 hours, or the timestamp.
            var message = span([
                'Finished with ',
                niceState(jobState.job_state),
                ' ',
                span({dataElement: 'clock'})
            ]);
            ui.setContent('run-control-panel.status.execMessage', message);

            // Show time since this app cell run finished.
            widgets.runClock = RunClock.make({
                on: {
                    tick: function (elapsed) {
                        var clock;
                        var day = 1000 * 60 * 60 * 24;
                        if (elapsed > day) {
                            clock = span([
                                ' on ',
                                format.niceTime(jobState.finish_time)
                            ]);
                            return {
                                content: clock,
                                stop: true
                            };
                        } else {
                            clock = [config.prefix || '', format.niceDuration(elapsed), config.suffix || ''].join('');
                            return {
                                content: clock + ' ago'                        
                            };
                        }
                    }
                }                
            });
            widgets.runClock.start({
                node: ui.getElement('run-control-panel.status.execMessage.clock'),
                startTime: jobState.finish_time
            })
            .catch(function (err) {
                ui.setContent('run-control-panel.status.execMessage.clock', 'ERROR:' + err.message);
            });

            // if (elapsed > 1000 * 60 * 60 * 24) {
            //     message = span([
            //         'Finished with ',
            //         niceState(jobState.job_state),
            //         ' on ',
            //         format.niceTime(jobState.finish_time)
            //     ]);
            //     ui.setContent('run-control-panel.status.execMessage', message);
            // } else {
            //     message = span([
            //         'Finished with ',
            //         niceState(jobState.job_state),
            //         ' ',
            //         span({dataElement: 'clock'})
            //     ]);

            //     ui.setContent('run-control-panel.status.execMessage', message);

            //     // Show time since this app cell run finished.
            //     widgets.runClock = RunClock.make({
            //         suffix: ' ago'
            //     });
            //     widgets.runClock.start({
            //         node: ui.getElement('run-control-panel.status.execMessage.clock'),
            //         startTime: jobState.finish_time
            //     })
            //     .catch(function (err) {
            //         ui.setContent('run-control-panel.status.execMessage.clock', 'ERROR:' + err.message);
            //     });
            // }


            // widgets named 'no-display' are a trigger to skip the output cell process.
            var skipOutputCell = model.getItem('exec.outputWidgetInfo.name') === 'no-display';

            // If so, is the cell still there?
            if (outputCellId) {
                outputCell = cellUtils.findById(outputCellId);
                if (outputCell) {
                    return;
                }
                notification = div([
                    div('Output cell not found: ' + outputCellId + '. Would you like to recreate it? ')
                ]);
                addNotification(notification);
                return;
            }

            /*
             If the job output specifies that no output is to be shown to the user,
             skip the output cell creation.
             */
            var cellInfo;
            if (skipOutputCell) {
                cellInfo = {
                    created: false
                };
            } else {
                // If not created yet, create it.
                outputCellId = createOutputCell(jobId);
                cellInfo = {
                    id: outputCellId,
                    created: true
                };
            }
            // TODO: insert job info as well.
            model.setItem(['output', 'byJob', jobId], {
                cell: cellInfo,
                createdAt: new Date().toGMTString(),
                params: model.copyItem('params')
            });
        }

        function doReportError() {
            alert('placeholder for reporting an error');
        }

        function doOnError() {
            var jobState = model.getItem('exec.jobState');

            var message = span([
                'Finished with ',
                niceState(jobState.job_state),
                ' on ',
                format.niceTime(jobState.finish_time),
                ' (',
                span({dataElement: 'clock'}),
                ')'
            ]);

            ui.setContent('run-control-panel.status.execMessage', message);

            // Show time since this app cell run finished.
            widgets.runClock = RunClock.make({
                suffix: ' ago'
            });
            widgets.runClock.start({
                node: ui.getElement('run-control-panel.status.execMessage.clock'),
                startTime: jobState.finish_time
            })
            .catch(function (err) {
                ui.setContent('run-control-panel.status.execMessage.clock', 'ERROR:' + err.message);
            });
        }

        function doExitError() {
            if (widgets.runClock) {
                widgets.runClock.stop();
            }
            ui.setContent('run-control-panel.status.execMessage', '');
        }

        function doOnCancelling() {
            ui.setContent('run-control-panel.status.execMessage', 'Cancelling...');
        }

        function doExitCancelling() {
            ui.setContent('run-control-panel.status.execMessage', '');
        }

        function doOnCancelled() {
            var jobState = model.getItem('exec.jobState');

            var message = span([
                span({style: {color: 'orange'}}, 'Canceled'),
                ' on ',
                format.niceTime(jobState.finish_time),
                ' (',
                span({dataElement: 'clock'}),
                ')'
            ]);

            ui.setContent('run-control-panel.status.execMessage', message);

            // Show time since this app cell run finished.
            widgets.runClock = RunClock.make({
                suffix: ' ago'
            });
            widgets.runClock.start({
                node: ui.getElement('run-control-panel.status.execMessage.clock'),
                startTime: jobState.finish_time
            })
            .catch(function (err) {
                ui.setContent('run-control-panel.status.execMessage.clock', 'ERROR:' + err.message);
            });
        }

        function doExitCancelled() {
            if (widgets.runClock) {
                widgets.runClock.stop();
            }
            ui.setContent('run-control-panel.status.execMessage', '');
        }


        function doRemove() {
            var confirmationMessage = div([
                p('Continue to remove this app cell?')
            ]);
            ui.showConfirmDialog({ title: 'Remove Cell?', body: confirmationMessage })
                .then(function (confirmed) {
                    if (!confirmed) {
                        return;
                    }

                });
        }

        function doDeleteCell() {
            var content = div([
                p([
                    'Deleting this cell will not remove any output cells or data objects it may have created. ',
                    'Any input parameters or other configuration of this cell will be lost.'
                ]),
                p('Deleting this cell will also cancel any pending jobs, but will leave generated output intact'),
                blockquote([
                    'Note: It is not possible to "undo" the deletion of a cell, ',
                    'but if the Narrative has not been saved you can refresh the browser window ',
                    'to load the Narrative from its previous state.'
                ]),
                p('Continue to delete this app cell?')
            ]);
            ui.showConfirmDialog({ title: 'Confirm Cell Deletion', body: content })
                .then(function (confirmed) {
                    if (!confirmed) {
                        return;
                    }

                    var jobState = model.getItem('exec.jobState');
                    if (jobState) {
                        cancelJob(jobState.job_id);
                    }

                    // tear down all the sub widgets.
                    // TODO: make all widget behavior consistent. Either message or promise.
                    Object.keys(widgets).forEach(function (widgetId) {
                        try {
                            var widget = widgets[widgetId];
                            if (widget.stop) {
                                widget.stop();
                            } else {
                                widget.instance.bus().send('stop');
                            }
                        } catch (ex) {
                            console.error('ERROR stopping widget', widgetId, ex);
                        }
                    });

                    stop();

                    var cellIndex = Jupyter.notebook.find_cell_index(cell);
                    Jupyter.notebook.delete_cell(cellIndex);
                });
        }

        function start() {
            return Semaphore.make().when('comm', 'ready', Config.get('comm_wait_timeout'))
                .then(function () {
                    /*
                     * listeners for the local input cell message bus
                     */

                    // DOM EVENTS
                    cell.element.on('toggleCodeArea.cell', function () {
                        toggleCodeInputArea(cell);
                    });
                    // the settings toggle is now emitted from the toolbar, which
                    // doesn't have a reference to the bus (yet).
                    cell.element.on('toggleCellSettings.cell', function () {
                        var showing = toggleSettings(cell),
                            label = span({ class: 'fa fa-cog ' }),
                            buttonNode = ui.getButton('toggle-settings');
                        buttonNode.innerHTML = label;
                        if (showing) {
                            buttonNode.classList.add('active');
                        } else {
                            buttonNode.classList.remove('active');
                        }
                    });


                    // APP CELL EVENTS

                    busEventManager.add(bus.on('toggle-code-view', function () {
                        var showing = toggleCodeInputArea(),
                            label = showing ? 'Hide Code' : 'Show Code';
                        ui.setButtonLabel('toggle-code-view', label);
                    }));
                    busEventManager.add(bus.on('show-notifications', function () {
                        // TODO: re-enable notifications
                        // doShowNotifications();
                    }));
                    busEventManager.add(bus.on('edit-cell-metadata', function () {
                        doEditCellMetadata();
                    }));
                    busEventManager.add(bus.on('edit-notebook-metadata', function () {
                        doEditNotebookMetadata();
                    }));

                    busEventManager.add(bus.on('toggle-settings', function () {
                        var showing = toggleSettings(cell),
                            label = span({ class: 'fa fa-cog ' }),
                            buttonNode = ui.getButton('toggle-settings');
                        buttonNode.innerHTML = label;
                        if (showing) {
                            buttonNode.classList.add('active');
                        } else {
                            buttonNode.classList.remove('active');
                        }
                    }));
                    busEventManager.add(bus.on('actionButton', function (message) {
                        doActionButton(message.data);
                    }));
                    busEventManager.add(bus.on('run-app', function () {
                        doRun();
                    }));
                    busEventManager.add(bus.on('re-run-app', function () {
                        doRerun();
                    }));
                    busEventManager.add(bus.on('cancel', function () {
                        doCancel();
                    }));
                    busEventManager.add(bus.on('remove', function () {
                        doRemove();
                    }));


                    busEventManager.add(parentBus.on('reset-to-defaults', function () {
                        bus.emit('reset-to-defaults');
                    }));


                    // We need to listen for job-status messages is we are loading
                    // a cell that has a running job.

                    // TODO: inform the job manager that we are ready to receive
                    // messages for this job?
                    // At present the job manager will start doing this after it
                    // loads the narrative and has inspected the jobs in its metadata.
                    // But this is a race condition -- and it is probably better
                    // if the cell invokes this response and then can receive either
                    // the start of the job-status message stream or a response indicating
                    // that the job has completed, after which we don't need to
                    // listen any further.

                    // get the status

                    // if we are in a running state, start listening for jobs
                    var state = model.getItem('fsm.currentState');
                    // var listeningForJobUpdates = false;
                    if (state) {
                        switch (state.mode) {
                        case 'editing':
                            break;
                        case 'processing':
                            switch (state.stage) {
                            case 'launched':
                            case 'queued':
                            case 'running':
                                startListeningForJobMessages(model.getItem('exec.jobState.job_id'));
                                requestJobStatus(model.getItem('exec.jobState.job_id'));
                                break;
                            }
                            break;
                        case 'success':
                        case 'error':
                            // do nothing for now
                        }
                    }

                    // TODO: only turn this on when we need it!
                    busEventManager.add(cellBus.on('run-status', function (message) {
                        updateFromLaunchEvent(message);

                        model.setItem('exec.launchState', message);

                        // Save this to the exec state change log.
                        model.pushItem('exec.log', {
                            timestamp: new Date(),
                            event: 'launch-status',
                            data: {
                                jobId: message.jobId,
                                runId: message.runId,
                                status: message.event
                            }
                        });

                        saveNarrative();

                        cellBus.emit('launch-status', {
                            launchState: message
                        });
                    }));

                    busEventManager.add(cellBus.on('delete-cell', function (message) {
                        doDeleteCell();
                    }));

                    busEventManager.add(cellBus.on('output-cell-removed', function (message) {
                        var output = model.getItem('output');

                        if (!output.byJob[message.jobId]) {
                            return;
                        }

                        delete output.byJob[message.jobId];
                        model.setItem('output', output);
                        widgets.outputWidget.instance.bus().emit('update', {
                            jobState: model.getItem('exec.jobState'),
                            output: output
                        });
                    }));

                    busEventManager.add(runtime.bus().on('read-only-changed', function (msg) {
                        toggleReadOnlyMode(msg.readOnly);
                    }));

                    // Initialize display
                    showCodeInputArea();

                    return null;
                });
        }

        function stop() {
            return Promise.try(function () {
                busEventManager.removeAll();
            });
        }

        function exportParams() {

            // For each param.

            // if certain limited conditions apply

            // transform the params from the fundamental types

            // to something more suitable for the app params.

            // This is necessary because some params, like subdata, have a
            // natural storage as array, but are supposed to be provided as
            // a string with comma separators
            var params = model.getItem('params'),
                paramsToExport = {},
                parameters = spec.getSpec().parameters;


            Object.keys(params).forEach(function (key) {
                var value = params[key],
                    paramSpec = parameters.specs[key];

                if (!paramSpec) {
                    console.error('Parameter ' + key + ' is not defined in the parameter map', parameters);
                    throw new Error('Parameter ' + key + ' is not defined in the parameter map');
                }

                // TODO: this should be a spec method - export
                if (paramSpec.data.type === 'textsubdata') {
                    if (value && value instanceof Array) {
                        value = value.join(',');
                    }
                }

                paramsToExport[key] = value;
            });

            return paramsToExport;
        }

        // just a quick hack since we are not truly recursive yet..,
        function gatherValidationMessages(validationResult) {
            var messages = [];

            function harvestErrors(validations) {
                if (validations instanceof Array) {
                    validations.forEach(function (result, index) {
                        if (!result.isValid) {
                            messages.push(String(index) + ':' + result.errorMessage);
                        }
                        if (result.validations) {
                            harvestErrors(result.validations);
                        }
                    });
                } else {
                    Object.keys(validations).forEach(function (id) {
                        var result = validations[id];
                        if (!result.isValid) {
                            messages.push(id + ':' + result.errorMessage);
                        }
                        if (result.validations) {
                            harvestErrors(result.validations);
                        }
                    });
                }
            }
            harvestErrors(validationResult);
            return messages;
        }

        function evaluateAppState() {
            validateModel()
                .then(function (result) {
                    // we have a tree of validations, so we need to walk the tree to see if anything
                    // does not validate.
                    var messages = gatherValidationMessages(result);

                    if (messages.length === 0) {
                        buildPython(cell, utils.getMeta(cell, 'attributes').id, model.getItem('app'), exportParams());
                        fsm.newState({ mode: 'editing', params: 'complete', code: 'built' });
                        renderUI();
                    } else {
                        resetPython(cell);
                        fsm.newState({ mode: 'editing', params: 'incomplete' });
                        renderUI();
                    }
                })
                .catch(function (err) {
                    alert('internal error'),
                        console.error('INTERNAL ERROR', err);
                });
        }

        function checkSpec(appSpec) {
            var cellAppSpec = model.getItem('app.spec');

            if (!cellAppSpec) {
                throw new ToErr.KBError({
                    type: 'app-cell-app-info',
                    message: 'This app cell is misconfigured - it does not contain an app spec',
                    info: model.getItem('app'),
                    advice: [
                        'This app cell is not correctly configured',
                        'It should contain an app object but does not',
                        'The app object contains the raw spec and other info',
                        'This is most likely due to this app being inserted into the narrative in a development environment in which the app model (and cell metadata) is in flux'
                    ]
                });
            }

            if (appSpec.info.module !== cellAppSpec.info.module) {
                throw new Error('Mismatching app modules: ' + cellAppSpec.info.module + ' !== ' + appSpec.info.module);
            }

            if (cellAppSpec.info.name !== appSpec.info.name) {
                throw new Error('Mismatching app names: ' + cellAppSpec.info.name + ' !== ' + appSpec.info.name);
            }

            if (cellAppSpec.info.git_commit_hash !== appSpec.info.git_commit_hash) {
                return new ToErr.KBError({
                    severity: 'warning',
                    type: 'app-spec-mismatched-commit',
                    message: 'Mismatching app commit for ' + appSpec.info.id + ', tag=' + model.getItem('app.tag') + ' : ' + cellAppSpec.info.git_commit_hash + ' !== ' + appSpec.info.git_commit_hash,
                    info: {
                        tag: model.getItem('app.tag'),
                        cellCommitHash: cellAppSpec.info.git_commit_hash,
                        catalogCommitHash: appSpec.info.git_commit_hash
                            //cellAppSpec: cellAppSpec,
                            //catalogAppSpec: appSpec
                    },
                    advice: [
                        'Due to potential incompatibilities between different versions of an dev or beta app, this app cell cannot be rendered',
                        'You should add a new app cell for this app, and remove this one',
                        'Inserting a dev or beta app cell will tie the app cell to the specific current commit by storing the commit hash',
                        'In the future we may provide options to attempt conversion of this cell and provide other options'
                    ]
                });
            }

            return null;
        }

        function run(params) {
            // First get the app specs, which is stashed in the model,
            // with the parameters returned.

            // If the app has been run before...

            // The app reference is already in the app cell metadata.

            return Promise.try(function () {
                    return getAppSpec();
                })
                .then(function (appSpec) {
                    // Ensure that the current app spec matches our existing one.
                    var warning = checkSpec(appSpec);
                    if (warning && warning.severity === 'warning') {
                        if (warning.type === 'app-spec-mismatched-commit') {
                            model.setItem('outdated', true);
                        }
                    }

                    // Create a map of parameters for easy access
                    //                    var parameterMap = {};
                    //                    env.parameters = model.getItem('app.spec.parameters').map(function (parameterSpec) {
                    //                        // tee hee
                    //                        var param = ParameterSpec.make({parameterSpec: parameterSpec});
                    //                        parameterMap[param.id()] = param;
                    //                        return param;
                    //                    });
                    //                    env.parameterMap = parameterMap;


                    var appRef = [model.getItem('app.id'), model.getItem('app.tag')].filter(toBoolean).join('/'),
                        url = '/#appcatalog/app/' + appRef;
                    utils.setCellMeta(cell, 'kbase.attributes.title', model.getItem('app.spec.info.name'));
                    utils.setCellMeta(cell, 'kbase.attributes.subtitle', model.getItem('app.spec.info.subtitle'));
                    utils.setCellMeta(cell, 'kbase.attributes.info.url', url);
                    utils.setCellMeta(cell, 'kbase.attributes.info.label', 'more...');                   
                })
                .then(function () {
                    // this will not change, so we can just render it here.
                    showAboutApp();
                    showAppSpec();
                    PR.prettyPrint(null, container);
                    renderUI();
                })
                .then(function () {
                    // if we start out in 'new' state, then we need to promote to
                    // editing...

                    if (fsm.getCurrentState().state.mode === 'new') {
                        fsm.newState({ mode: 'editing', params: 'incomplete' });
                        evaluateAppState();
                        //
                    } else {
                        renderUI();
                    }
                    if (!Jupyter.notebook.writable || Jupyter.narrative.readonly) {
                        toggleReadOnlyMode(true);
                    }
                })
                .catch(function (err) {
                    var error = ToErr.grokError(err);
                    console.error('ERROR loading main widgets', error);
                    addNotification('Error loading main widgets: ' + error.message);

                    model.setItem('fatalError', {
                        title: 'Error loading main widgets',
                        message: error.message,
                        advice: error.advice || [],
                        info: error.info,
                        detail: error.detail || 'no additional details'
                    });
                    syncFatalError();
                    fsm.newState({ mode: 'internal-error' });
                    renderUI();
                });
        }

        /*
         Grok a sensible error structure out of something returned by something.
         */

        // INIT

        model = Props.make({
            data: utils.getMeta(cell, 'appCell'),
            onUpdate: function (props) {
                utils.setMeta(cell, 'appCell', props.getRawObject());
                // saveNarrative();
            }
        });

        spec = Spec.make({
            appSpec: model.getItem('app.spec')
        });

        return {
            init: init,
            attach: attach,
            start: start,
            stop: stop,
            detach: detach,
            run: run
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
}, function (err) {
    console.error('ERROR loading appCell appCellWidget', err);
});