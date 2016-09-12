/*global define*/
/*jslint white:true,browser:true*/

define([
    'jquery',
    'bluebird',
    'uuid',
    'base/js/namespace',
    'base/js/dialog',
    'common/parameterSpec',
    'common/runtime',
    'common/events',
    'common/error',
    'common/jupyter',
    'kb_common/html',
    'common/props',
    'kb_service/client/narrativeMethodStore',
    'kb_service/client/workspace',
    'common/pythonInterop',
    'common/utils',
    'common/unodep',
    'common/ui',
    'common/fsm',
    'common/cellUtils',
    'common/busEventManager',
    'common/format',
    'google-code-prettify/prettify',
    'narrativeConfig',
    './appCellWidget-fsm',
    './tabs/runStatsTab',
    './tabs/jobStateTab',
    './tabs/resultsTab',
    './tabs/logTab',
    './tabs/errorTab',
    'css!google-code-prettify/prettify.css',
    'css!font-awesome.css'
], function (
    $,
    Promise,
    Uuid,
    Jupyter,
    dialog,
    ParameterSpec,
    Runtime,
    Events,
    ToErr,
    JupyterProxy,
    html,
    Props,
    NarrativeMethodStore,
    Workspace,
    PythonInterop,
    utils,
    utils2,
    UI,
    Fsm,
    cellUtils,
    BusEventManager,
    format,
    PR,
    narrativeConfig,
    AppStates,
    runStatsTabWidget,
    jobStateTabWidget,
    resultsTabWidget,
    logTabWidget,
    errorTabWidget
    ) {
    'use strict';
    var t = html.tag,
        div = t('div'), span = t('span'), a = t('a'),
        table = t('table'), tr = t('tr'), th = t('th'), td = t('td'),
        pre = t('pre'), input = t('input'), img = t('img'), p = t('p'), blockquote = t('blockquote'),
        appStates = AppStates;

    function factory(config) {
        var container, places, ui,
            workspaceInfo = config.workspaceInfo,
            runtime = Runtime.make(),
            cell = config.cell,
            parentBus = config.bus,
            // TODO: the cell bus should be created and managed through main.js,
            // that is, the extension.
            cellBus = runtime.bus().makeChannelBus({
            cell: utils.getMeta(cell, 'attributes', 'id')
        }, 'A cell channel'),
            bus = runtime.bus().makeChannelBus(null, 'A app cell widget'),
            busEventManager = BusEventManager.make({
                bus: runtime.bus()
            }),
            env = {},
            model,
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
            inputBusses = [],
            inputBusMap = {},
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
                        type: 'primary',
                        icon: {
                            name: 'play',
                            color: 'green'
                        }
                    },
                    cancel: {
                        help: 'Cancel the running app',
                        type: 'danger',
                        icon: {
                            name: 'stop',
                            color: 'red'
                        }
                    },
                    reRunApp: {
                        help: 'Edit and re-run the app',
                        type: 'primary',
                        icon: {
                            name: 'refresh',
                            color: 'blue'
                        }
                    }
                }
            };


        // NEW - TABS

        function loadParamsWidget(arg) {
            return new Promise(function (resolve, reject) {
                require(['nbextensions/appCell/widgets/appParamsWidget'], function (Widget) {
                    // TODO: widget should make own bus.
                    var bus = runtime.bus().makeChannelBus(null, 'Parent comm bus for input widget'),
                        widget = Widget.make({
                            bus: bus,
                            workspaceInfo: workspaceInfo
                        });
                    bus.emit('run', {
                        node: arg.node,
                        appSpec: model.getItem('app.spec'),
                        parameters: env.parameters
                    });

                    bus.on('sync-params', function (message) {
                        message.parameters.forEach(function (paramId) {
                            bus.send({
                                parameter: paramId,
                                value: model.getItem(['params', message.parameter])
                            },
                                {
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
                        model.setItem(['params', message.parameter], message.newValue);
                        evaluateAppState();
                    });

                    return widget.start()
                        .then(function () {
                            resolve({
                                bus: bus,
                                instance: widget
                            });
                        });
                }, function (err) {
                    console.log('ERROR', err);
                    reject(err);
                });
            });
        }

        function loadViewParamsWidget(arg) {
            return new Promise(function (resolve, reject) {
                require([
                    'nbextensions/appCell/widgets/appParamsViewWidget'
                ], function (Widget) {
                    // TODO: widget should make own bus
                    var bus = runtime.bus().makeChannelBus(null, 'Parent comm bus for load input view widget'),
                        widget = Widget.make({
                            bus: bus,
                            workspaceInfo: workspaceInfo
                        });

                    bus.on('sync-all-parameters', function () {
                        var params = model.getItem('params');
                        Object.keys(params).forEach(function (key) {

                            bus.send({
                                parameter: key,
                                value: params[key]
                            }, {
                                // This points the update back to a listener on this key
                                key: {
                                    type: 'update',
                                    parameter: key
                                }
                            });

                            //bus.emit('update', {
                            //    parameter: key,
                            //    value: params[key]
                            //});
                        });
                    });
                    bus.on('parameter-sync', function (message) {
                        var value = model.getItem(['params', message.parameter]);
                        bus.send({
                            parameter: message.parameter,
                            value: value
                        }, {
                            // This points the update back to a listener on this key
                            key: {
                                type: 'update',
                                parameter: message.parameter
                            }
                        });
                    });
                    bus.emit('run', {
                        node: arg.node,
                        parameters: env.parameters
                    });

//                    return widget.start()
//                        .then(function () {
//                            resolve({
//                                bus: bus,
//                                instance: widget
//                            });
//                        });
                }, function (err) {
                    console.log('ERROR', err);
                    reject(err);
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
                console.log('loading widget', name);
                require('nbextensions/appCell/widgets/tabs/' + name, function (Widget) {
                    resolve(Widget);
                }, function (err) {
                    reject(err);
                });
            });
        }

        function updateFromViewModel(ui, viewModel, path) {
            if (!path) {
                path = [];
            }
            if (typeof viewModel === 'string') {
                ui.setContent(path, viewModel);
            } else if (typeof viewModel === 'number') {
                ui.setContent(path, String(viewModel));
            } else if (viewModel === null) {
                ui.setContent(path, '-');
            } else {
                Object.keys(viewModel).forEach(function (key) {
                    updateFromViewModel(ui, viewModel[key], path.concat(key));
                });
            }
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
                node: node
            });
        }

        function stopTab() {
            ui.deactivateButton(controlBarTabs.selectedTab.id);

            return controlBarTabs.selectedTab.widget.stop()
                .catch(function (err) {
                    console.log('ERROR stopping', err);
                })
                .finally(function () {
                    var widgetNode = ui.getElement('run-control-panel.tab-pane.widget');
                    widgetNode.removeChild(widgetNode.firstChild);
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

        /*
         * If tab not open, close any open one and open it.
         * If tab open, close it, leaving no tabs open.
         */
        function toggleTab(tabId) {
            if (controlBarTabs.selectedTab) {
                if (controlBarTabs.selectedTab.id === tabId) {
                    return stopTab();
                }
                return stopTab()
                    .then(function () {
                        return startTab(tabId);
                    });
            }
            return startTab(tabId);
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
                runStats: {
                    label: 'Stats',
                    xicon: 'bar-chart',
                    widget: runStatsTabWidget
                },
                jobState: {
                    label: 'State',
                    xicon: 'table',
                    advanced: true,
                    widget: jobStateTabWidget
                },
                logs: {
                    label: 'Logs',
                    xicon: 'list',
                    widget: logTabWidget
                },
                results: {
                    label: 'Results',
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
                    // we may be able to grok this.
                    //if (app.spec.info.ver) {
                    //    return {
                    //        ids: [app.spec.info.id],
                    //        tag: 'release',
                    //        version: app.spec.info.ver
                    //    };
                    //}
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
            var advice = model.getItem('fatalError.advice'),
                info = model.getItem('fatalError.info'),
                ul = t('ul'),
                li = t('li');
            if (advice) {
                // Note the 1.2em seems to be the de-facto work around to have a list
                // align left with other blocks yet retain the bullet and the
                // indentation for list items.
                advice = ul({style: {paddingLeft: '1.2em'}}, advice.map(function (adv) {
                    return li(adv);
                }));
            } else {
                advice = 'no advice';
            }
            if (info) {
                info = html.makeObjTable(info, {rotated: true, classes: []});
            } else {
                info = 'no additional info';
            }
            ui.setContent('fatal-error.title', model.getItem('fatalError.title'));
            ui.setContent('fatal-error.message', model.getItem('fatalError.message'));
            ui.setContent('fatal-error.advice', advice);
            ui.setContent('fatal-error.info', info);
            ui.setContent('fatal-error.detail', model.getItem('fatalError.detail'));
        }

        function showFsmBar() {
            var currentState = fsm.getCurrentState(),
                content = Object.keys(currentState.state).map(function (key) {
                return span([
                    span({style: {fontStyle: 'italic'}}, key),
                    ' : ',
                    span({style: {padding: '4px', fontWeight: 'noramal', border: '1px silver solid', backgroundColor: 'gray', color: 'white'}}, currentState.state[key])
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
                style: {fontSize: '80%'}});
        }

        function renderAppSummary() {
            return table({class: 'table table-striped'}, [
                tr([
                    th('Name'),
                    td({dataElement: 'name'})
                ]),
                ui.ifAdvanced(function () {
                    return tr([
                        th('Module'),
                        td({dataElement: 'module'})
                    ]);
                }),
                tr([
                    th('Id'),
                    td({dataElement: 'id'})
                ]),
                tr([
                    th('Version'),
                    td({dataElement: 'version'})
                ]),
                tr([
                    th('Summary'),
                    td({dataElement: 'summary'})
                ]),
                tr([
                    th('Authors'),
                    td({dataElement: 'authors'})
                ]),
                ui.ifAdvanced(function () {
                    return tr([
                        th('Git commit hash'),
                        td({dataElement: 'git-commit-hash'})
                    ]);
                }),
                tr([
                    th('More info'),
                    td({dataElement: 'catalog-link'})
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
            // node.style.display = null;
            node.classList.remove('hidden');
        }
        function hideElement(name) {
            var node = ui.getElement(name);
            if (!node) {
                return;
            }
            //if (!node.getAttribute('data-original-display')) {
            //    node.setAttribute('data-original-display', )
            // }
            // node.style.display = 'none';
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
            var events = Events.make({node: container}),
                content = Object.keys(settings).map(function (key) {
                var setting = settings[key],
                    settingsValue = model.getItem(['user-settings', key]) || setting.defaultValue;
                return div({}, [
                    input({
                        type: 'checkbox',
                        checked: (settingsValue ? true : false),
                        dataSetting: key,
                        value: key,
                        //dataToggle: 'tooltip',
                        //title: setting.help || '',
                        id: events.addEvent({
                            type: 'change',
                            handler: function (e) {
                                doChangeSetting(e);
                            }
                        })
                    }),
                    span({style: {marginLeft: '4px', fontStyle: 'italic'}}, setting.label)
                ]);
            }).join('\n');
            ui.setContent('settings.content', div([
                p('These options show or hide optional areas of the app cell'),
                content
            ]));
            events.attachEvents();
            // ui.enableTooltips('settings');

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
                link = a({href: '/#appcatalog/app/' + appRef, target: '_blank'}, 'Catalog Page');
            ui.setContent('about-app.catalog-link', link);
        }

        function showAppSpec() {
            if (!model.getItem('app.spec')) {
                return;
            }
            var specText = JSON.stringify(model.getItem('app.spec'), false, 3),
                fixedText = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                content = pre({class: 'prettyprint lang-json', style: {fontSize: '80%'}}, fixedText);
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
                case 'cancel':
                    doCancel();
                    break;
                default:
                    alert('Undefined action:' + data.action);
            }
        }
        
        function buildRunControlPanelRunButtons(events) {
            return div({class: 'btn-group'}, 
                Object.keys(actionButtons.availableButtons).map(function (key) {
                    var button = actionButtons.availableButtons[key];
                    return ui.buildButton({
                        tip: button.help,
                        name: key,
                        events: events,
                        type: button.type || 'default',
                        hidden: true,
                        event: {
                            type: 'actionButton',
                            data: {
                                action: key
                            }
                        },
                        icon: {
                            name: button.icon.name,
                            color: button.icon.color,
                            size: 3
                        },
                        classes: [
                            'kb-flat-btn'
                        ]
                    });
                })
            );
        }

        function xbuildRunControlPanelRunButtons(events) {
            return div({class: 'btn-group'}, [
                ui.buildButton({
                    tip: 'Run the app',
                    name: 'run-app',
                    events: events,
                    type: 'primary',
                    hidden: true,
                    icon: {
                        name: 'play',
                        size: 3,
                        color: 'green'
                    },
                    classes: [
                        'kb-flat-btn'
                    ]
                }),
                ui.buildButton({
                    tip: 'Launching the app...',
                    name: 'launching',
                    events: events,
                    type: 'primary',
                    hidden: true,
                    disabled: true,
                    icon: {
                        name: 'play',
                        size: 3,
                        color: 'green'
                    },
                    classes: [
                        'kb-flat-btn'
                    ]
                }),
                ui.buildButton({
                    tip: 'Cancel the running app',
                    name: 'cancel',
                    events: events,
                    type: 'danger',
                    hidden: true,
                    icon: {
                        name: 'stop',
                        size: 3,
                        color: 'red'
                    },
                    classes: [
                        'kb-flat-btn'
                    ]
                }),
                ui.buildButton({
                    tip: 'Canceling the app...',
                    name: 'canceling',
                    events: events,
                    type: 'danger',
                    hidden: true,
                    icon: {
                        name: 'stop',
                        size: 3,
                        color: 'red'
                    },
                    classes: [
                        'kb-flat-btn'
                    ]
                }),
                ui.buildButton({
                    tip: 'Edit and re-run the app',
                    name: 're-run-app',
                    events: events,
                    type: 'primary',
                    hidden: true,
                    icon: {
                        name: 'refresh',
                        size: 3,
                        color: 'blue'
                    },
                    classes: [
                        'kb-flat-btn'
                    ]
                })
            ]);
        }

        function buildRunControlPanelDisplayButtons(events) {
            var buttons = Object.keys(controlBarTabs.tabs).map(function (key) {
                var tab = controlBarTabs.tabs[key], icon;
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
                    event: {
                        type: 'control-panel-tab',
                        data: {
                            tab: key
                        },
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
            return div({dataElement: 'run-control-panel'}, [
                div({
                    style: {border: '1px silver solid', height: '100px', position: 'relative'}
                }, [
                    div({style: {position: 'absolute', top: '0', bottom: '0', left: '0', right: '0'}}, [
                        div({dataElement: 'status', style: {
                                position: 'absolute', left: '0', top: '0',
                                width: '100px',
                                height: '100px',
                                borderRight: '3px silver solid'
                            }}, [
                            div({style: {height: '40px', marginTop: '10px', textAlign: 'center', lineHeight: '40px', verticalAlign: 'middle'}}, [
                                span({dataElement: 'icon', class: 'fa fa-question fa-2x', style: {lineHeight: '40px'}})
                            ]),
                            div({dataElement: 'message', style: {height: '20px', marginTop: '5px', textAlign: 'center'}}, 'status'),
                            div({dataElement: 'measure', style: {height: '20px', marginBotton: '5px',  textAlign: 'center'}})
                        ]),
                        div({dataElement: 'toolbar', style: {
                                position: 'absolute', left: '100px', right: '100px', top: '0',
                                height: '100px',
                                borderRight: '0px silver solid'
                            }}, [
                            div({style: {
                                    height: '50px',
                                    padding: '5px',
                                    xborderBottom: '1px silver solid'
                                }}, [
                                div({dataElement: 'message'})
                            ]),
                            div({style: {
                                    height: '50px',
                                    lineHeight: '50px',
                                    paddingLeft: '15px',
                                    verticalAlign: 'bottom'
                                }}, [
                                    div({class: 'btn-toolbar',
                                        style: {
                                            display: 'inline-block',
                                            verticalAlign: 'bottom'
                                        }}, buildRunControlPanelDisplayButtons(events))
                                ])
                        ]),
                        div({style: {
                                width: '100px', 
                                height: '100px', 
                                position: 'absolute', 
                                top: '0', 
                                right: '0'
                            }}, [
                            div({style: {
                                    height: '100px',
                                    textAlign: 'center',
                                    lineHeight: '100px',
                                    verticalAlign: 'middle',
                                    textStyle: 'italic'
                                }}, [
                                buildRunControlPanelRunButtons(events)
                            ])
                        ])
                    ])
                ]),
                div({dataElement: 'tab-pane',
                    style: {
                        border: '1px rgb(32, 77, 16) solid',
                        xborderLeft: '1px silver solid',
                        xborderRight: '1px silver solid',
                        xborderBottom: '1px silver solid',
                        padding: '4px',
                        xminHeight: '100px'
                    }}, [
                    div({dataElement: 'widget'})
                ])
            ]);
        }

        function renderLayout() {
            var events = Events.make(),
                content = div({class: 'kbase-extension kb-app-cell', style: {display: 'flex', alignItems: 'stretch'}}, [
                    div({class: 'prompt', dataElement: 'prompt', style: {display: 'flex', alignItems: 'stretch', flexDirection: 'column'}}, [
                        div({dataElement: 'status'})
                    ]),
                    div({
                        class: 'body',
                        dataElement: 'body',
                        style: {display: 'flex', alignItems: 'stretch', flexDirection: 'column', flex: '1'}
                    }, [
                        div({dataElement: 'widget', style: {display: 'block', width: '100%'}}, [
                            div({class: 'container-fluid'}, [
                                div({
                                    class: 'kb-app-warning alert alert-warning hidden',
                                    dataElement: 'outdated',
                                    role: 'alert'
                                }, [
                                    span({style: {'font-weight': 'bold'}}, 'Warning'),
                                    ': this app appears to be out of date. Running it may cause undesired results. Add a new "<b>' + model.getItem('app.spec.info.name') + '</b>" App for the most recent version.'
                                ]),
                                ui.buildPanel({
                                    title: 'App Cell Settings',
                                    name: 'settings',
                                    hidden: true,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: div({dataElement: 'content'})
                                }),
                                ui.buildCollapsiblePanel({
                                    title: 'Notifications',
                                    name: 'notifications',
                                    hidden: true,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: [
                                        div({dataElement: 'content'})
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
                                        div({dataElement: 'about-app'}, renderAboutApp())
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
                                            div({dataElement: 'fsm-display', style: {marginBottom: '4px'}}, [
                                                span({style: {marginRight: '4px'}}, 'FSM'),
                                                span({dataElement: 'content'})
                                            ]),
                                            div([
                                                ui.makeButton('Show Code', 'toggle-code-view', {events: events}),
                                                ui.makeButton('Edit Metadata', 'edit-cell-metadata', {events: events}),
                                                ui.makeButton('Edit Notebook Metadata', 'edit-notebook-metadata', {events: events})
                                            ])
                                        ]
                                    });
                                }()),
                                buildRunControlPanel(events),
                                ui.buildCollapsiblePanel({
                                    title: 'Output ' + span({class: 'fa fa-arrow-left'}),
                                    name: 'output-group',
                                    hidden: true,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: div({dataElement: 'widget'})
                                }),
                                ui.buildPanel({
                                    title: 'Error',
                                    name: 'fatal-error',
                                    hidden: true,
                                    type: 'danger',
                                    classes: ['kb-panel-container'],
                                    body: div([
                                        div({class: 'alert alert-danger'}, 'This App cell could not load due to errors described below'),
                                        ui.buildGridTable({
                                            row: {
                                                style: {marginBottom: '6px'}
                                            },
                                            cols: [
                                                {
                                                    width: 2,
                                                    style: {fontWeight: 'bold'}
                                                },
                                                {
                                                    width: 10
                                                }
                                            ],
                                            table: [
                                                ['Title', div({dataElement: 'title'})],
                                                ['Message', div({dataElement: 'message'})],
                                                ['Advice', div({dataElement: 'advice'})],
                                                ['Info', div({dataElement: 'info'})],
                                                ['Details', div({dataElement: 'detail', style: {maxHeight: '300px', maxWidth: '100%', overflow: 'scroll', fontFamily: 'monospace'}})]
                                            ]
                                        })
                                    ])
                                })
                            ])
                        ])
                    ])
                ]);
            return {
                content: content,
                events: events
            };
        }

        function validateModel() {
            /*
             * Validation is currently very simple.
             * Iterate through all parameters in the model specification.
             * If the model contains a value, validate it.
             * Record any failure
             * If the model does not contain a value, and it is optional, use the "null value" for that type.
             * If the model does not contain a value, and it is required, record that failure
             * If there are any failures, the validation feails.
             * And return the set of failures.
             *
             * FOR NOW: let us assume that values only get into the model if
             * they are valid.
             * All we need to do now then is to ensure that all required fields are present,
             * and missing fields get their default "nullish" value.
             *
             * Also FOR NOW: we don't have a model of what "blank" is for a field, so we use this:
             * - for strings, empty string or undefined
             * - for ints, undefined
             * - for floats, undefined
             * - for sets, empty array
             * - for object refs, empty string (we should check if refs are valid here as well, but not yet.)
             *
             *
             */
            var params = model.getItem('params'),
                errors = env.parameters.map(function (parameterSpec) {
                    if (parameterSpec.required()) {
                        if (parameterSpec.isEmpty(params[parameterSpec.id()])) {
                            return {
                                diagnosis: 'required-missing',
                                errorMessage: 'The ' + parameterSpec.dataType() + ' "' + parameterSpec.id() + '" is required but was not provided'
                            };
                        }
                    }
                }).filter(function (error) {
                if (error) {
                    return true;
                }
                return false;
            });
            return {
                isValid: (errors.length === 0),
                errors: errors
            };
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

        function setStatus(cell, status) {
            model.setItem('attributes.status', status);
        }

        function getStatus(cell) {
            model.getItem('attributes.status');
        }

        function initializeFSM() {
            var currentState = model.getItem('fsm.currentState');
            if (!currentState) {
                // TODO: evaluate the state of things to try to guess the state?
                // Or is this just an error unless it is a new cell?
                // currentState = {mode: 'editing', params: 'incomplete'};
                currentState = {mode: 'new'};
            }
            fsm = Fsm.make({
                states: appStates,
                initialState: {
                    mode: 'new'
                },
                //xinitialState: {
                //    mode: 'editing', params: 'incomplete'
                //},
                onNewState: function (fsm) {
                    model.setItem('fsm.currentState', fsm.getCurrentState().state);
                    // save the narrative!

                },
                bus: bus
            });
            fsm.start(currentState);
        }

        // LIFECYCYLE API

        function doEditNotebookMetadata() {
            JupyterProxy.editNotebookMetadata();
        }

        function doEditCellMetadata() {
            JupyterProxy.editCellMetadata(cell);
        }

        function initCodeInputArea() {
            // var codeInputArea = cell.input[0];
            //if (!cell.kbase.inputAreaDisplayStyle) {
            //    cell.kbase.inputAreaDisplayStyle = codeInputArea.css('display');
            // }
            // try this hack to reset the initial state for the input subarea...
            //codeInputArea[0].setAttribute('data-toggle-initial-state', 'hidden');
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

        function toggleCodeInputArea(cell) {
            if (model.getItem('user-settings.showCodeInputArea')) {
                model.setItem('user-settings.showCodeInputArea', false);
            } else {
                model.setItem('user-settings.showCodeInputArea', true);
            }
            showCodeInputArea();
            return model.getItem('user-settings.showCodeInputArea');
        }

        function toggleSettings(cell) {
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
                content = span({style: {fontStyle: 'italic'}}, 'There are currently no notifications');
            } else {
                content = notifications.map(function (notification, index) {
                    return div({class: 'row'}, [
                        div({class: 'col-md-10'}, notification),
                        div({class: 'col-md-2', style: {textAlign: 'right'}}, span({}, [
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


//        function showToggle(name) {
//
//        }
//
//        function ensureToggle(name) {
//            var propName = 'user-settings.show-' + name,
//                elementPath = 'toggle-' + name,
//
//        }
//
//        // just simple display block/none for now
//        function renderToggle(name) {
//            var propName = 'user-settings.show-' + name,
//                elementPath = 'toggle-' + name,
//                node = dom.getElement(elementPath),
//                originalStyle = model.getItem(propName);
//
//            if (orig
//
//        }
//
//        function toggleToggle(name) {
//            var propName = 'user-settings.show-' + name;
//            if (model.getItem(propName)) {
//                model.setItem(propName, false);
//            } else {
//                model.setItem(propName, true);
//            }
//            renderToggle(name);
//            return model.getItem(propName);
//        }

        // WIDGETS

        function showWidget(name, widgetModule, path) {
            var bus = runtime.bus().makeChannelBus(null, 'Bus for showWidget'),
                widget = widgetModule.make({
                    bus: bus,
                    workspaceInfo: workspaceInfo
                });
            widgets[name] = {
                path: path,
                module: widgetModule,
                instance: widget
            };
            widget.start();
            bus.emit('attach', {
                node: ui.getElement(path)
            });
        }

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

            if (state.ui.message) {
                ui.setContent('run-control-panel.toolbar.message', state.ui.message);
            } else {
                ui.setContent('run-control-panel.toolbar.message', '');
            }

            ui.setContent('run-control-panel.status.message', state.ui.label);

            var iconNode = ui.getElement('run-control-panel.status.icon');
            if (iconNode) {
                // clear the classes
                iconNode.className = '';

                iconNode.classList.add('fa', 'fa-' + state.ui.icon.type, 'fa-3x');
                iconNode.style.color = state.ui.icon.color;
            }
            
            // Clear the measure
            // ui.setContent('run-control-panel.status.measure', '');

            // Tab state



            // disable tab buttons
            Object.keys(state.ui.tabs).forEach(function (tabId) {
                var tab = state.ui.tabs[tabId];
                if (tab.enabled) {
                    ui.enableButton(tabId);
                } else {
                    ui.disableButton(tabId);
                }
                if (tab.selected) {
                    selectTab(tabId);
                }
                if (tab.hidden) {
                    ui.hideButton(tabId);
                } else {
                    ui.showButton(tabId);
                }
            });

            // enable tab buttons
            //state.ui.tabs.disabled.forEach(function (tabId) {
            //    ui.disableButton(tabId);
            //});

            // Select tab, if any
            //if (state.ui.tabs.selected) {
            //    selectTab(state.ui.tabs.selected);
            // }
            
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


            // Button state
//            state.ui.buttons.enabled.forEach(function (button) {
//                ui.enableButton(button);
//            });
//            state.ui.buttons.disabled.forEach(function (button) {
//                ui.disableButton(button);
//            });
//            state.ui.buttons.hidden.forEach(function (button) {
//                ui.hideButton(button);
//            });


            // Element state
            state.ui.elements.show.forEach(function (element) {
                ui.showElement(element);
            });
            state.ui.elements.hide.forEach(function (element) {
                ui.hideElement(element);
            });

            // Emit messages for this state.
//            if (state.ui.messages) {
//                state.ui.messages.forEach(function (message) {
//                    var tempBus;
//                    if (message.widget) {
//                        tempBus = widgets[message.widget].bus;
//                    } else {
//                        tempBus = inputWidgetBus;
//                    }
//
//                    tempBus.send(message.message, message.address);
//                });
//            }
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

        function resetToEditMode(source) {
            // only do this if we are not editing.

            model.deleteItem('exec');

            // Also ensure that the exec widget is reset
            // widgets.execWidget.bus.emit('reset');
            // reloadExecutionWidget();

            // TODO: evaluate the params again before we do this.
            fsm.newState({mode: 'editing', params: 'complete', code: 'built'});

            clearOutput();

            renderUI();
        }

        function doRerun() {
            var confirmationMessage = div([
                p('This action will clear the App Execution area and restore the Input Area to edit mode. You may then change inputs and run the app again. (Any output you have already produced will be left intact.)'),
                p('Proceed to Resume Editing?')
            ]);
            ui.showConfirmDialog({title: 'Edit and Re-Run?', body: confirmationMessage})
                .then(function (confirmed) {
                    if (!confirmed) {
                        return;
                    }

                    // No longer delete job state. This will be done if/when
                    // the user deletes the ouput.
                    //var jobState = model.getItem('exec.jobState');
                    //if (jobState) {
                    //    cancelJob(jobState.job_id);
                    // the job will be deleted form the notebook when the job cancellation
                    // event is received.
                    //}

                    // Remove all of the execution state when we reset the app.
                    resetToEditMode('do rerun');
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
            ui.showConfirmDialog({title: 'Cancel Job?', body: confirmationMessage})
                .then(function (confirmed) {
                    if (!confirmed) {
                        return;
                    }

                    var jobState = model.getItem('exec.jobState');
                    if (jobState) {
                        cancelJob(jobState.job_id);

                        fsm.newState({mode: 'canceling'});
                        renderUI();
                        // the job will be deleted form the notebook when the job cancellation
                        // event is received.
                    } else {
                        alert('cannot cancel yet');
                        model.deleteItem('exec');
                        fsm.newState({mode: 'editing', params: 'complete', code: 'built'});
                        renderUI();
                    }

                    // Remove all of the execution state when we reset the app.
                    //model.deleteItem('exec');

                    //reloadExecutionWidget();

                    // TODO: evaluate the params again before we do this.
                    //fsm.newState({mode: 'editing', params: 'complete', code: 'built'});

                    //renderUI();
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
                        return {mode: 'processing', stage: 'launched'};
                    case 'error':
                        return {mode: 'error', stage: 'launching'};
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
                            return {mode: 'processing', stage: 'queued'};
                        case 'job_started':
                            return {mode: 'processing', stage: 'running'};
                        case 'in-progress':
                            return {mode: 'processing', stage: 'running'};
                        case 'completed':
                            stopListeningForJobMessages();
                            return {mode: 'success'};
                        case 'canceled':
                            stopListeningForJobMessages();
                            return {mode: 'canceled'};
                        case 'suspend':
                        case 'error':
                            stopListeningForJobMessages();
                            if (currentState.state.stage) {
                                return {
                                    mode: 'error',
                                    stage: currentState.state.stage
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
            fsm.newState({mode: 'execute-requested'});

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
                container = node;
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
                places = {
                    status: container.querySelector('[data-element="status"]'),
                    notifications: container.querySelector('[data-element="notifications"]'),
                    widget: container.querySelector('[data-element="widget"]')
                };
                return null;
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
                handle: function (message) {
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
                handle: function (message) {
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

            runtime.bus().emit('request-job-status', {
                jobId: jobId
            });
        }

        function stopListeningForJobMessages() {
            jobListeners.forEach(function (listener) {
                runtime.bus().removeListener(listener);
            });
            jobListeners = [];
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
            // cell.set_text('from biokbase.narrative.jobs import AppManager\nAppManager().clear_app()');
            // cell.execute();
            var cellNode = cell.element.get(0),
                textNode = document.querySelector('.output_area.output_text');

            if (textNode) {
                textNode.innerHTML = '';
            }
        }

        function makeRunClock(config) {
            var listeners = [],
                container,
                channel = runtime.bus().makeChannelBus(null, 'Clock channel'),
                clockId = html.genId(),
                startTime;

            function buildLayout() {
                return div({
                    id: clockId,
                    style: {
                        fontFamily: 'monospace'
                    }
                });
            }

            function renderClock() {
                if (!startTime) {
                    return;
                }
                var now = new Date().getTime(),
                    elapsed = now - startTime;

                var clockNode = document.getElementById(clockId);
                if (!clockNode) {
                    console.error('Could not find clock node at' + clockId);
                }
                clockNode.innerHTML = format.elapsedTime(elapsed);
            }


            function start(arg) {
                return Promise.try(function () {
                    // create clock layout on container.
                    //channel.on('run', function (message) {
                    container = arg.node;
                    var layout = buildLayout();
                    container.innerHTML = layout;

                    startTime = arg.startTime;

                    listeners.push(runtime.bus().on('clock-tick', function () {
                        renderClock();
                    }));
                    //});
                });
            }

            function stop() {
                return Promise.try(function () {
                    listeners.forEach(function (listener) {
                        channel.bus().removeListener(listener);
                    });
                });
            }

            return {
                start: start,
                stop: stop,
                bus: function () {
                    return bus;
                }
            };
        }

        var widgets = {};

        function doStartRunning() {
            widgets.runClock = makeRunClock();
            var jobState = model.getItem('exec.jobState');
            if (!jobState) {
                console.log('What, no job state?');
                return;
            }
            widgets.runClock.start({
                node: ui.getElement('run-control-panel.status.measure'),
                startTime: jobState.exec_start_time
            })
                .catch(function (err) {
                    ui.setContent('run-control-panel.status.measure', 'ERROR:' + err.message);
                });
        }

        function doStopRunning() {
            ui.setContent('run-control-panel.status.measure', '');
            if (widgets.runClock) {
                widgets.runClock.stop();
            }
        }

        function doStartQueueing() {
            widgets.runClock = makeRunClock();
            var jobState = model.getItem('exec.jobState');
            if (!jobState) {
                console.log('What, no job state?');
                return;
            }
            widgets.runClock.start({
                node: ui.getElement('run-control-panel.status.measure'),
                startTime: jobState.creation_time
            })
                .catch(function (err) {
                    ui.setContent('run-control-panel.status.measure', 'ERROR:' + err.message);
                });
        }

        function doStopQueueing() {
            ui.setContent('run-control-panel.status.measure', '');
            if (widgets.runClock) {
                widgets.runClock.stop();
            }
        }
        
        function doExitSuccess() {
            ui.setContent('run-control-panel.status.measure', '');
        }

        function doOnSuccess() {
            // have we created output yet?
            var jobId = model.getItem('exec.jobState.job_id'),
                outputCellId = model.getItem(['output', 'byJob', jobId, 'cell', 'id']),
                outputCell, notification,
                outputCreated = model.getItem(['exec', 'outputCreated']);
            
            // Update the measurement in the control panel.
            var jobState = model.getItem('exec.jobState');
            var elapsedRunTime = format.elapsedTime(jobState.finish_time - jobState.exec_start_time);
            ui.setContent('run-control-panel.status.measure', elapsedRunTime);

            // widgets named 'no-display' are a trigger to skip the output cell process.
            var skipOutputCell = model.getItem('exec.outputWidgetInfo.name') === 'no-display';


            // New app -- check the existing exec state, see if the
            // output has been created already, and if so just exit.
            // This protects us from the condition in which a user
            // has removed the output for the latest run.
//            if (outputCreated) {
//                return;
//            }

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

            widgets.outputWidget.instance.bus().emit('update', {
                jobState: model.getItem('exec.jobState'),
                output: model.getItem('output')
            });
            // bus.emit('output-created', )
        }

        function doReportError() {
            alert('placeholder for reporting an error');
        }


        function doRemove() {
            var confirmationMessage = div([
                p('Continue to remove this app cell?')
            ]);
            ui.showConfirmDialog({title: 'Remove Cell?', body: confirmationMessage})
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
            ui.showConfirmDialog({title: 'Confirm Cell Deletion', body: content})
                .then(function (confirmed) {
                    if (!confirmed) {
                        return;
                    }

                    var jobState = model.getItem('exec.jobState');
                    if (jobState) {
                        cancelJob(jobState.job_id);
                    }

                    // tear down all the sub widgets.
                    Object.keys(widgets).forEach(function (widgetId) {
                        var widget = widgets[widgetId];
                        widget.instance.bus().send('stop');
                    });

                    stop();

                    Jupyter.notebook.delete_cell(Jupyter.notebook.find_cell_index(cell));
                });
        }

        function start() {
            return Promise.try(function () {
                /*
                 * listeners for the local input cell message bus
                 */

                // DOM EVENTS
                cell.element.on('toggleCodeArea.cell', function () {
                    toggleCodeInputArea(cell);
                })
                // the settings toggle is now emitted from the toolbar, which
                // doesn't have a reference to the bus (yet).
                cell.element.on('toggleCellSettings.cell', function () {
                    var showing = toggleSettings(cell),
                        label = span({class: 'fa fa-cog '}),
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
                    doShowNotifications();
                }));
                busEventManager.add(bus.on('edit-cell-metadata', function () {
                    doEditCellMetadata();
                }));
                busEventManager.add(bus.on('edit-notebook-metadata', function () {
                    doEditNotebookMetadata();
                }));

                busEventManager.add(bus.on('toggle-settings', function () {
                    var showing = toggleSettings(cell),
                        label = span({class: 'fa fa-cog '}),
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

                busEventManager.add(bus.on('start-queueing', function () {
                    doStartQueueing();
                }));
                busEventManager.add(bus.on('stop-queueing', function () {
                    doStopQueueing();
                }));

                busEventManager.add(bus.on('start-running', function () {
                    doStartRunning();
                }));
                busEventManager.add(bus.on('stop-running', function () {
                    doStopRunning();
                }));

                busEventManager.add(bus.on('on-success', function () {
                    doOnSuccess();
                }));

                busEventManager.add(bus.on('exit-success', function () {
                    doExitSuccess();
                }));

                busEventManager.add(bus.on('sync-all-display-parameters', function () {
                    widgets.paramsDisplayWidget.bus.emit('sync-all-parameters');
                }));

                // Events from widgets...

                busEventManager.add(parentBus.on('newstate', function (message) {
                    console.log('GOT NEWSTATE', message);
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

                // Regardless of what the FSM says, if we are not listening for a
                // job update and we already have an execution job state, let's
                // see if there is anything new, even if we don't expect anything
                // new...
                //if (!listeningForJobUpdates) {
//                var jobId = model.getItem('exec.jobState.job_id');
//                if (jobId) {
//                    startListeningForJobMessages(jobId);
//                }
                //}



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

                    //addNotification('An output for this cell was deleted from the Narrative. The associated output record was modified to reflect this. The output may be reconstructed from the output record by clicking the "Recreated Output Cell" button.');

                    //console.log(output.byJob[message.jobId]);



                    //return;

                    delete output.byJob[message.jobId];
                    model.setItem('output', output);
                    widgets.outputWidget.instance.bus().emit('update', {
                        jobState: model.getItem('exec.jobState'),
                        output: output
                    });
                }));

//                runtime.bus().listen({
//                    channel: {
//                        cell: utils.getMeta(cell, 'attributes', 'id')
//                    },
//                    key: {
//                        type: 'job-status',
//                        jobId:
//                    },
//                    handle: function (message) {
//
//                        // Store the most recent job status (jobInfo) in the model and thus metadata.
//                        // console.log('JOBSTATUS', message.job.state);
//                        updateFromJobState(message.job.state);
//
//                        var existingState = model.getItem('exec.jobState');
//                        if (!existingState || existingState.job_state !== message.job.state.job_state) {
//                            model.setItem('exec.jobState', message.job.state);
//                            // Forward the job info to the exec widget if it is available. (it should be!)
//                            if (widgets.execWidget) {
//                                widgets.execWidget.bus.emit('job-state', {
//                                    jobState: message.job.state
//                                });
//                            }
//                        } else {
//                            if (widgets.execWidget) {
//                                widgets.execWidget.bus.emit('job-state-updated', {
//                                    jobId: message.job.state.job_id
//                                });
//                            }
//                        }
//                        model.setItem('exec.jobStateUpdated', new Date().getTime());
//
//
//
//                        // Evaluate the job state to generate our derived "quickStatus" used to control
//                        // the ui...
//
//
//                        // SKIP for now
//                        return;
//
//                        model.setItem('job', {
//                            updatedAt: new Date().getTime(),
//                            info: message.job
//                        });
//
//                        var jobStatus = message.job.state.job_state;
//
//                        // Update current status
//                        updateRunJobStatus();
//
//                        renderRunStatus();
//
//                        updateJobDetails(message);
//                        // updateJobLog(message);
//
//                        updateJobReport(message.job);
//
//                        // and yet another job state thing. This one takes care
//                        // the general state of the job state communication
//
//                        // Update status history.
//
//                        // Okay, don't store multiples of the last event.
//                        var log = cell.metadata.kbase.log;
//                        if (!log) {
//                            log = [];
//                            cell.metadata.kbase.log = log;
//                        }
//                        if (log.length > 0) {
//                            var lastLog = log[log.length - 1];
//                            if (lastLog.data.status === jobStatus) {
//                                if (lastLog.count === undefined) {
//                                    lastLog.count = 0;
//                                }
//                                lastLog.count += 1;
//                                return;
//                            }
//                        }
//
//                        utils.pushMeta(cell, 'appCell.exec.log', {
//                            timestamp: new Date(),
//                            event: 'jobstatus',
//                            data: {
//                                jobId: message.jobId,
//                                status: jobStatus
//                            }
//                        });
//                    }
//                });

                busEventManager.add(runtime.bus().on('read-only-changed', function (msg) {
                    toggleReadOnlyMode(msg.readOnly);
                }));

                // Initialize display
                showCodeInputArea();

                return null;
            });
        }

        function stop() {
            busEventManager.removeAll();
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
                paramSpecs = env.parameters,
                paramsToExport = {};

            Object.keys(params).forEach(function (key) {
                var value = params[key],
                    paramSpec = env.parameterMap[key];

                if (!paramSpec) {
                    console.error('Parameter ' + key + ' is not defined in the parameter map', env.parameterMap, env.parameters);
                    throw new Error('Parameter ' + key + ' is not defined in the parameter map');
                }

                if (paramSpec.spec.field_type === 'textsubdata') {
                    if (value && value instanceof Array) {
                        value = value.join(',');
                    }
                }

                paramsToExport[key] = value;
            });

            return paramsToExport;
        }


        function loadOutputWidget() {
            return new Promise(function (resolve, reject) {
                require([
                    'nbextensions/appCell/widgets/appOutputWidget'
                ], function (Widget) {
                    var widget = Widget.make({
                        cellId: utils.getMeta(cell, 'attributes', 'id')
                    });
                    widgets.outputWidget = {
                        path: ['output-group', 'widget'],
                        instance: widget
                    };
                    widget.start();
                    widget.bus().emit('run', {
                        node: ui.getElement('output-group.widget'),
                        jobState: model.getItem('exec.jobState'),
                        output: model.getItem('output')
                    });
                    resolve();
                }, function (err) {
                    reject(err);
                });
            });
        }

        function makeIcon() {
            // icon is in the spec ...
            var appSpec = model.getItem('app.spec'),
                nmsBase = runtime.config('services.narrative_method_store_image.url'),
                iconUrl = Props.getDataItem(appSpec, 'info.icon.url');

            if (iconUrl) {
                return span({class: 'fa-stack fa-2x', style: {padding: '0 3px 3px 3px'}}, [
                    img({src: nmsBase + iconUrl, style: {maxWidth: '50px', maxHeight: '50px', margin: '0x'}})
                ]);
            }

            return span({style: ''}, [
                span({class: 'fa-stack fa-2x', style: {textAlign: 'center', color: 'rgb(103,58,183)'}}, [
                    span({class: 'fa fa-square fa-stack-2x', style: {color: 'rgb(103,58,183)'}}),
                    span({class: 'fa fa-inverse fa-stack-1x fa-cube'})
                ])
            ]);
        }

        function renderIcon() {
            var prompt = cell.element[0].querySelector('.input_prompt');

            if (!prompt) {
                return;
            }

            prompt.innerHTML = div({
                style: {textAlign: 'center'}
            }, [
                makeIcon()
            ]);
        }

        function evaluateAppState() {
            var validationResult = validateModel();
            if (validationResult.isValid) {
                buildPython(cell, utils.getMeta(cell, 'attributes').id, model.getItem('app'), exportParams());
                fsm.newState({mode: 'editing', params: 'complete', code: 'built'});
                renderUI();
            } else {
                resetPython(cell);
                fsm.newState({mode: 'editing', params: 'incomplete'});
                renderUI();
            }
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
                    var parameterMap = {};
                    env.parameters = model.getItem('app.spec.parameters').map(function (parameterSpec) {
                        // tee hee
                        var param = ParameterSpec.make({parameterSpec: parameterSpec});
                        parameterMap[param.id()] = param;
                        return param;
                    });
                    env.parameterMap = parameterMap;


                    var appRef = [model.getItem('app.id'), model.getItem('app.tag')].filter(toBoolean).join('/'),
                        url = '/#appcatalog/app/' + appRef;
                    utils.setCellMeta(cell, 'kbase.attributes.title', model.getItem('app.spec.info.name'));
                    utils.setCellMeta(cell, 'kbase.attributes.subtitle', model.getItem('app.spec.info.subtitle'));
                    utils.setCellMeta(cell, 'kbase.attributes.info.url', url);
                    utils.setCellMeta(cell, 'kbase.attributes.info.label', 'more...');
                    return Promise.all([
                        // loadInputWidget(),
                        // loadInputViewWidget(),
                        // loadExecutionWidget(),
                        loadOutputWidget()
                    ]);
                })
                .then(function () {
                    // this will not change, so we can just render it here.
                    showAboutApp();
                    showAppSpec();
                    PR.prettyPrint(null, container);
                    renderUI();
                    // renderIcon();
                })
                .then(function () {
                    // if we start out in 'new' state, then we need to promote to
                    // editing...

                    if (fsm.getCurrentState().state.mode === 'new') {
                        fsm.newState({mode: 'editing', params: 'incomplete'});
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
                    fsm.newState({mode: 'fatal-error'});
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
                saveNarrative();
            }
        });

        return {
            init: init,
            attach: attach,
            start: start,
            run: run
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
}, function (err) {
    console.log('ERROR loading appCell appCellWidget', err);
});
