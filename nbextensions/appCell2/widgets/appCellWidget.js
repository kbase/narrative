define(
    [
        'jquery',
        'underscore',
        'bluebird',
        'uuid',
        'base/js/namespace',
        'kb_service/client/catalog',
        'kb_service/client/narrativeMethodStore',
        'narrativeConfig',
        'common/runtime',
        'common/dialogMessages',
        'common/events',
        'common/error',
        'common/jupyter',
        'common/html',
        'common/props',
        'common/pythonInterop',
        'common/ui',
        'common/fsm',
        'common/cellUtils',
        'common/busEventManager',
        'common/spec',
        'common/semaphore',
        'common/jobs',
        'common/jobCommMessages',
        'common/cellComponents/actionButtons',
        'google-code-prettify/prettify',
        './appCellWidget-fsm',
        './tabs/resultsTab',
        './tabs/logTab',
        'common/errorDisplay',
        'common/cellComponents/tabs/infoTab',
        'common/cellComponents/fsmBar',
        'util/developerMode',
        './appParamsWidget',
        './appParamsViewWidget',
        'css!google-code-prettify/prettify',
    ],
    (
        $,
        _,
        Promise,
        Uuid,
        Jupyter,
        Catalog,
        NarrativeMethodStore,
        Config,
        Runtime,
        DialogMessages,
        Events,
        ToErr,
        Narrative,
        html,
        Props,
        PythonInterop,
        UI,
        Fsm,
        cellUtils,
        BusEventManager,
        Spec,
        Semaphore,
        Jobs,
        jcm,
        ActionButtons,
        PR,
        AppStates,
        resultsTabWidget,
        logTabWidget,
        errorTabWidget,
        infoTabWidget,
        FSMBar,
        DevMode,
        AppParamsWidget,
        AppParamsViewWidget
    ) => {
        'use strict';

        const t = html.tag,
            div = t('div'),
            span = t('span'),
            a = t('a'),
            cssCellType = 'kb-app-cell',
            fsmState = AppStates.STATE;

        function factory(config) {
            const runtime = Runtime.make(),
                { cell } = config,
                saveMaxFrequency = config.saveMaxFrequency || 5000,
                parentBus = config.bus,
                widgets = {},
                cellBus = runtime.bus().makeChannelBus({
                    name: {
                        [jcm.CHANNEL.CELL]: cellUtils.getMeta(cell, 'attributes', 'id'),
                    },
                    description: 'A cell channel',
                }),
                bus = runtime.bus().makeChannelBus({
                    description: 'An app cell widget',
                }),
                busEventManager = BusEventManager.make({
                    bus: runtime.bus(),
                }),
                actionButtons = {
                    current: {
                        name: null,
                        disabled: null,
                    },
                    availableButtons: {
                        runApp: {
                            help: 'Run the app',
                            type: 'primary',
                            classes: ['-run'],
                            label: 'Run',
                        },
                        cancel: {
                            help: 'Cancel the running app',
                            type: 'danger',
                            classes: ['-cancel'],
                            label: 'Cancel',
                        },
                        reRunApp: {
                            help: 'Edit and re-run the app',
                            type: 'default',
                            classes: ['-rerun'],
                            label: 'Reset',
                        },
                        resetApp: {
                            // only occurs when there is an internal error
                            help: 'Reset the app and return to Edit mode',
                            type: 'default',
                            classes: ['-reset'],
                            label: 'Reset',
                        },
                        offline: {
                            help: 'Currently disconnected from the server.',
                            type: 'danger',
                            classes: ['-cancel'],
                            label: 'Offline',
                        },
                    },
                },
                controlBarTabs = {
                    selected: 'configure',
                    selectedTab: null,
                    tabs: {
                        configure: {
                            label: 'Configure',
                            widget: configureWidget(),
                        },
                        viewConfigure: {
                            label: 'View Configure',
                            widget: viewConfigureWidget(),
                        },
                        info: {
                            label: 'Info',
                            widget: infoTabWidget,
                        },
                        jobStatus: {
                            label: 'Job Status',
                            widget: logTabWidget,
                        },
                        results: {
                            label: 'Result',
                            widget: resultsTabWidget,
                        },
                        error: {
                            label: 'Error',
                            type: 'danger',
                            widget: errorTabWidget,
                        },
                    },
                },
                // INIT
                model = Props.make({
                    data: cellUtils.getMeta(cell, 'appCell'),
                    onUpdate: function (props) {
                        cellUtils.setMeta(cell, 'appCell', props.getRawObject());
                    },
                }),
                spec = Spec.make({
                    appSpec: model.getItem('app.spec'),
                }),
                jobListeners = [],
                api = {
                    init,
                    attach,
                    start,
                    stop,
                    detach,
                    run,
                },
                developerMode = config.devMode || DevMode.mode;

            let hostNode,
                container,
                ui,
                actionButtonWidget,
                fsm,
                selectedJobId,
                readOnly = false,
                viewOnly = false;

            // TABS

            function loadParamsWidget(arg) {
                // TODO: widget should make own bus.
                const widgetBus = runtime
                        .bus()
                        .makeChannelBus({ description: 'Parent comm bus for input widget' }),
                    widget = AppParamsWidget.make({
                        bus: widgetBus,
                        initialParams: model.getItem('params'),
                    });

                widgetBus.on('sync-params', (message) => {
                    message.parameters.forEach((paramId) => {
                        widgetBus.send(
                            {
                                parameter: paramId,
                                value: model.getItem(['params', message.parameter]),
                            },
                            {
                                key: {
                                    type: 'update',
                                    parameter: message.parameter,
                                },
                            }
                        );
                    });
                });

                widgetBus.on('parameter-sync', (message) => {
                    const value = model.getItem(['params', message.parameter]);
                    widgetBus.send(
                        {
                            value,
                        },
                        {
                            // This points the update back to a listener on this key
                            key: {
                                type: 'update',
                                parameter: message.parameter,
                            },
                        }
                    );
                });

                widgetBus.on('set-param-state', (message) => {
                    model.setItem('paramState', message.id, message.state);
                });

                widgetBus.respond({
                    key: {
                        type: 'get-param-state',
                    },
                    handle: function (message) {
                        return {
                            state: model.getItem('paramState', message.id),
                        };
                    },
                });

                widgetBus.respond({
                    key: {
                        type: 'get-parameter',
                    },
                    handle: function (message) {
                        return {
                            value: model.getItem(['params', message.parameterName]),
                        };
                    },
                });

                widgetBus.respond({
                    key: {
                        type: 'get-batch-mode',
                    },
                    handle: function () {
                        const canDoBatch = Config.get('features').batchAppMode;
                        return canDoBatch && (model.getItem('user-settings.batchMode') || false);
                    },
                });

                widgetBus.on('parameter-changed', (message) => {
                    // TODO: should never get these in the following states....

                    const { state } = fsm.getCurrentState();
                    const isError = Boolean(message.isError);
                    if (state.mode === 'editing') {
                        model.setItem(['params', message.parameter], message.newValue);
                        evaluateAppState(isError);
                    } else {
                        console.warn(
                            'parameter-changed event detected when not in editing mode - ignored'
                        );
                    }
                });

                widgetBus.on('toggle-batch-mode', () => {
                    toggleBatchMode();
                });

                return widget
                    .start({
                        node: arg.node,
                        appSpec: model.getItem('app.spec'),
                        parameters: spec.getSpec().parameters,
                    })
                    .then(() => {
                        return {
                            bus: widgetBus,
                            instance: widget,
                        };
                    });
            }

            function loadViewParamsWidget(arg) {
                // TODO: widget should make own bus.
                const widgetBus = runtime
                        .bus()
                        .makeChannelBus({ description: 'Parent comm bus for input widget' }),
                    widget = AppParamsViewWidget.make({
                        bus: widgetBus,
                        initialParams: model.getItem('params'),
                    });

                widgetBus.on('sync-params', (message) => {
                    message.parameters.forEach((paramId) => {
                        widgetBus.send(
                            {
                                parameter: paramId,
                                value: model.getItem(['params', message.parameter]),
                            },
                            {
                                key: {
                                    type: 'update',
                                    parameter: message.parameter,
                                },
                            }
                        );
                    });
                });

                widgetBus.on('parameter-sync', (message) => {
                    const value = model.getItem(['params', message.parameter]);
                    widgetBus.send(
                        {
                            value,
                        },
                        {
                            // This points the update back to a listener on this key
                            key: {
                                type: 'update',
                                parameter: message.parameter,
                            },
                        }
                    );
                });

                widgetBus.on('set-param-state', (message) => {
                    model.setItem('paramState', message.id, message.state);
                });

                widgetBus.respond({
                    key: {
                        type: 'get-param-state',
                    },
                    handle: function (message) {
                        return {
                            state: model.getItem('paramState', message.id),
                        };
                    },
                });

                widgetBus.respond({
                    key: {
                        type: 'get-parameter',
                    },
                    handle: function (message) {
                        return {
                            value: model.getItem(['params', message.parameterName]),
                        };
                    },
                });

                widgetBus.respond({
                    key: {
                        type: 'get-batch-mode',
                    },
                    handle: function () {
                        const canDoBatch = Config.get('features').batchAppMode;
                        return canDoBatch && (model.getItem('user-settings.batchMode') || false);
                    },
                });

                widgetBus.on('parameter-changed', (message) => {
                    // TODO: should never get these in the following states....

                    const { state } = fsm.getCurrentState();
                    if (state.mode === 'editing') {
                        model.setItem(['params', message.parameter], message.newValue);
                        evaluateAppState();
                    } else {
                        console.warn(
                            'parameter-changed event detected when not in editing mode - ignored'
                        );
                    }
                });

                return widget
                    .start({
                        node: arg.node,
                        appSpec: model.getItem('app.spec'),
                        parameters: spec.getSpec().parameters,
                    })
                    .then(() => {
                        return {
                            bus: widgetBus,
                            instance: widget,
                        };
                    });
            }

            function configureWidget() {
                function widgetFactory() {
                    let widgetContainer, widget;

                    function widgetStart(arg) {
                        widgetContainer = arg.node;
                        return loadParamsWidget({
                            node: widgetContainer,
                        }).then((result) => {
                            widget = result;
                        });
                    }

                    function widgetStop() {
                        return Promise.try(() => {
                            if (widget) {
                                return widget.instance.stop();
                            }
                        });
                    }

                    return {
                        start: widgetStart,
                        stop: widgetStop,
                    };
                }

                return {
                    make: function () {
                        return widgetFactory();
                    },
                };
            }

            function viewConfigureWidget() {
                function widgetFactory() {
                    let widgetContainer, widget;

                    function widgetStart(arg) {
                        widgetContainer = arg.node;
                        return loadViewParamsWidget({
                            node: widgetContainer,
                        }).then((result) => {
                            widget = result;
                        });
                    }

                    function widgetStop() {
                        return Promise.try(() => {
                            if (widget) {
                                return widget.instance.stop();
                            }
                        });
                    }

                    return {
                        start: widgetStart,
                        stop: widgetStop,
                    };
                }

                return {
                    make: function () {
                        return widgetFactory();
                    },
                };
            }

            function startTab(tabId) {
                const selectedTab = controlBarTabs.tabs[tabId];

                controlBarTabs.selectedTab = {
                    id: tabId,
                    widget: selectedTab.widget.make({
                        model,
                        jobId: selectedJobId,
                    }),
                };
                return _startTab(tabId, { model });
            }

            function _startTab(tabId, startArgs) {
                ui.activateButton(controlBarTabs.selectedTab.id);

                const node = document.createElement('div');
                node.classList.add(`kb-app-cell-tab-pane__container--${tabId}`, 'clearfix');
                ui.getElement('body.widget.tab-pane.widget').appendChild(node);
                startArgs.node = node;
                startArgs.bus = runtime.bus();
                return controlBarTabs.selectedTab.widget.start(startArgs);
            }

            function stopTab() {
                ui.deactivateButton(controlBarTabs.selectedTab.id);
                if (controlBarTabs.selectedTab.widget.getSelectedJobId) {
                    selectedJobId = controlBarTabs.selectedTab.widget.getSelectedJobId();
                }
                return controlBarTabs.selectedTab.widget
                    .stop()
                    .catch((err) => {
                        console.error('ERROR stopping', err);
                    })
                    .finally(() => {
                        const widgetNode = ui.getElement('body.widget.tab-pane.widget');
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
                    return stopTab().then(() => {
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
                return Promise.try(() => {
                    const paneNode = ui.getElement('body.widget.tab-pane');
                    if (paneNode) {
                        paneNode.classList.add('hidden');
                    }
                });
            }

            function showPane() {
                return Promise.try(() => {
                    const paneNode = ui.getElement('body.widget.tab-pane');
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

            function toggleBatchMode() {
                if (!Config.get('features').batchAppMode) {
                    return;
                }
                const curBatchState = model.getItem('user-settings.batchMode'),
                    newBatchMode = !curBatchState,
                    runState = fsm.getCurrentState();
                if (runState.state.mode !== 'editing') {
                    return;
                }
                model.setItem('user-settings.batchMode', newBatchMode);
                bus.emit('set-batch-mode', newBatchMode);
                toggleTab('configure').then(() => {
                    toggleTab('configure');
                });
                evaluateAppState();
                // if the configure widget is selected, stop and start it.
            }

            /*
             * If tab not open, close any open one and open it.
             * If tab open, close it, leaving no tabs open.
             */
            // Track whether the user has selected a tab.
            // This is reset when the user closes a tab.
            let userSelectedTab = false;

            function toggleTab(tabId) {
                if (controlBarTabs.selectedTab) {
                    if (controlBarTabs.selectedTab.id === tabId) {
                        return stopTab()
                            .then(() => {
                                // hide the pane, since we just closed the only open
                                //tab.
                                return hidePane();
                            })
                            .then(() => {
                                userSelectedTab = false;
                            });
                    }
                    return stopTab()
                        .then(() => {
                            return startTab(tabId);
                        })
                        .then(() => {
                            userSelectedTab = true;
                        });
                }
                return showPane()
                    .then(() => {
                        startTab(tabId);
                    })
                    .then(() => {
                        userSelectedTab = true;
                    });
            }

            // DATA API

            function getAppRef() {
                const app = model.getItem('app');

                // Make sure the app info stored in the model is valid.
                if (!app || !app.spec || !app.spec.info) {
                    throw new ToErr.KBError({
                        type: 'internal-app-cell-error',
                        message: 'This app cell is corrupt -- the app info is incomplete',
                        advice: [
                            'This condition should never occur outside of a development environment',
                            'The tag of the app associated with the app cell must be one of "release", "beta", or "dev"',
                            'Chances are that this app cell was inserted in a development environment in which the app cell structure was in flux',
                            'You should remove this app cell from the narrative an insert an new one',
                        ],
                    });
                }

                switch (app.tag) {
                    case 'release':
                        return {
                            ids: [app.spec.info.id],
                            tag: 'release',
                            version: app.spec.info.ver,
                        };
                    case 'dev':
                    case 'beta':
                        return {
                            ids: [app.spec.info.id],
                            tag: app.tag,
                        };
                    default:
                        console.error('Invalid tag', app);
                        throw new ToErr.KBError({
                            type: 'internal-app-cell-error',
                            message:
                                'This app cell is corrupt -- the app tag ' +
                                String(app.tag) +
                                ' is not recognized',
                            advice: [
                                'This condition should never occur outside of a development environment',
                                'The tag of the app associated with the app cell must be one of "release", "beta", or "dev"',
                                'Chances are that this app cell was inserted in a development environment in which the app cell structure was in flux',
                                'You should remove this app cell from the narrative an insert an new one',
                            ],
                        });
                }
            }

            function getAppSpec() {
                const appRef = getAppRef(),
                    nms = new NarrativeMethodStore(
                        runtime.config('services.narrative_method_store.url'),
                        {
                            token: runtime.authToken(),
                        }
                    );
                const catalog = new Catalog(runtime.config('services.catalog.url'));
                const appId = appRef.ids[0];
                return Promise.all([
                    nms.get_method_full_info({
                        ids: [appId],
                        tag: appRef.tag,
                        ver: appRef.version,
                    }),
                    nms.get_method_spec(appRef),
                    catalog.get_exec_aggr_stats({ full_app_ids: [appId] }),
                ]).then(([methodFullInfo, methodSpecData, execAggrStatsData]) => {
                    model.setItem('app.spec.full_info', methodFullInfo[0]);
                    model.setItem('executionStats', execAggrStatsData[0]);
                    if (!methodSpecData[0]) {
                        throw new Error('App not found');
                    }
                    return methodSpecData[0];
                });
            }

            // RENDER API

            function doActionButton(action) {
                switch (action) {
                    case 'runApp':
                        doRun();
                        break;
                    case 'reRunApp':
                        doRerun();
                        break;
                    case 'resetApp':
                        doReset();
                        break;
                    case 'cancel':
                        doCancel();
                        break;
                    default:
                        alert(`Undefined action: ${action}`);
                }
            }

            // bulkImportCell / cellTabs / buildTabButtons
            function buildRunControlPanelDisplayButtons(events) {
                const cssBaseClass = 'kb-rcp';
                const buttons = Object.keys(controlBarTabs.tabs)
                    .filter((key) => {
                        // ensure that the tab data is an object with key 'label'
                        return (
                            controlBarTabs.tabs[key] &&
                            typeof controlBarTabs.tabs[key] === 'object' &&
                            controlBarTabs.tabs[key].label
                        );
                    })
                    .map((key) => {
                        const tab = controlBarTabs.tabs[key];
                        let icon;
                        if (tab.icon && typeof tab.icon === 'string') {
                            icon = {
                                size: 2,
                                name: tab.icon,
                            };
                        }
                        return ui.buildButton({
                            label: tab.label,
                            name: key,
                            events,
                            type: tab.type || 'primary',
                            hidden: true,
                            features: tab.features,
                            classes: [`${cssBaseClass}__tab-button kb-app-cell-btn`],
                            event: {
                                type: 'control-panel-tab',
                                data: {
                                    tab: key,
                                },
                            },
                            icon,
                        });
                    });
                bus.on('control-panel-tab', (message) => {
                    const { tab } = message.data;
                    toggleTab(tab);
                });

                const outdatedBtn = a(
                    {
                        tabindex: '0',
                        type: 'button',
                        class: `${cssBaseClass}__tab-button--outdated btn hidden`,
                        dataContainer: 'body',
                        container: 'body',
                        dataToggle: 'popover',
                        dataPlacement: 'bottom',
                        dataTrigger: 'focus',
                        dataElement: 'outdated',
                        role: 'button',
                        title: 'New version available',
                    },
                    span({
                        class: 'fa fa-exclamation-triangle fa-2x',
                    })
                );
                buttons.unshift(outdatedBtn);

                return buttons;
            }

            function buildRunControlPanel(events) {
                const cssBaseClass = 'kb-rcp';
                return div(
                    {
                        class: cssBaseClass,
                        dataElement: 'run-control-panel',
                    },
                    [
                        div(
                            {
                                class: `${cssBaseClass}__layout_div`,
                            },
                            [
                                // action button widget
                                actionButtonWidget.buildLayout(events),
                                // status stuff
                                div({
                                    class: `${cssBaseClass}-status__fsm_display hidden`,
                                    dataElement: 'fsm-display',
                                }),
                                div({
                                    class: `${cssBaseClass}-status__container`,
                                    dataElement: 'execMessage',
                                }),
                                // toolbar buttons on the RHS
                                div(
                                    {
                                        class: `${cssBaseClass}__toolbar`,
                                        dataElement: 'toolbar',
                                    },
                                    [
                                        div(
                                            {
                                                class: `${cssBaseClass}__btn-toolbar btn-toolbar`,
                                            },
                                            buildRunControlPanelDisplayButtons(events)
                                        ),
                                    ]
                                ),
                            ]
                        ),
                    ]
                );
            }

            function renderLayout() {
                const events = Events.make(),
                    content = div(
                        {
                            class: `kbase-extension ${cssCellType} ${cssCellType}__container`,
                        },
                        [
                            div(
                                {
                                    class: `${cssCellType}__prompt prompt`,
                                    dataElement: 'prompt',
                                },
                                [
                                    div({
                                        class: `${cssCellType}__prompt_status`,
                                        dataElement: 'status',
                                    }),
                                ]
                            ),
                            div(
                                {
                                    class: `${cssCellType}__body body`,
                                    dataElement: 'body',
                                },
                                [
                                    div(
                                        {
                                            class: `${cssCellType}__widget_container`,
                                            dataElement: 'widget',
                                        },
                                        [
                                            div({ class: 'container-fluid' }, [
                                                buildRunControlPanel(events),
                                            ]),
                                            div(
                                                {
                                                    dataElement: 'tab-pane',
                                                },
                                                [div({ dataElement: 'widget' })]
                                            ),
                                        ]
                                    ),
                                ]
                            ),
                        ]
                    );
                return {
                    content,
                    events,
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
                            version: app.version,
                        };
                    case 'beta':
                    case 'dev':
                        return {
                            id: app.id,
                            tag: app.tag,
                            version: app.gitCommitHash,
                        };
                    default:
                        throw new Error('Invalid tag for app ' + app.id);
                }
            }

            function buildPython(_cell, cellId, app, params) {
                const runId = new Uuid(4).format(),
                    fixedApp = fixApp(app);
                let code;
                if (
                    model.getItem('user-settings.batchMode') &&
                    Config.get('features').batchAppMode
                ) {
                    code = PythonInterop.buildBatchAppRunner(cellId, runId, fixedApp, [params]);
                } else {
                    code = PythonInterop.buildAppRunner(cellId, runId, fixedApp, params);
                }
                _cell.set_text(code);
            }

            function resetPython(_cell) {
                _cell.set_text('');
            }

            function initializeFSM() {
                let currentState = model.getItem('fsm.currentState');
                if (!currentState) {
                    currentState = fsmState.NEW;
                }
                fsm = Fsm.make({
                    states: AppStates.appStates,
                    initialState: fsmState.NEW,
                    onNewState: function (_fsm) {
                        model.setItem('fsm.currentState', _fsm.getCurrentState().state);
                    },
                });
                // fsm events
                fsm.bus.on('disconnected', () => {
                    ui.setContent(
                        'run-control-panel.execMessage',
                        'Disconnected. Unable to communicate with server.'
                    );
                });

                fsm.bus.on('on-execute-requested', () => {
                    ui.setContent('run-control-panel.execMessage', 'Sending...');
                });
                fsm.bus.on('exit-execute-requested', () => {
                    ui.setContent('run-control-panel.execMessage', '');
                });

                fsm.bus.on('on-launched', () => {
                    ui.setContent('run-control-panel.execMessage', 'Launching...');
                });
                fsm.bus.on('exit-launched', () => {
                    ui.setContent('run-control-panel.execMessage', '');
                });

                fsm.bus.on('start-queueing', () => {
                    doStartQueueing();
                });
                fsm.bus.on('start-running', () => {
                    doStartRunning();
                });

                fsm.bus.on('on-completed', () => {
                    doOnSuccess();
                });
                fsm.bus.on('resume-completed', () => {
                    doResumeSuccess();
                });
                fsm.bus.on('exit-completed', () => {
                    doExitSuccess();
                });

                fsm.bus.on('on-error', () => {
                    doOnError();
                });
                fsm.bus.on('exit-error', () => {
                    doExitError();
                });

                fsm.bus.on('on-cancelling', () => {
                    doOnCancelling();
                });
                fsm.bus.on('exit-cancelling', () => {
                    doExitCancelling();
                });

                fsm.bus.on('on-cancelled', () => {
                    doOnCancelled();
                });
                fsm.bus.on('exit-cancelled', () => {
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
                            'If that fails, delete the app cell and re-insert it.',
                        ],
                        info: null,
                        detail: null,
                    });
                    fsm.start(fsmState.INTERNAL_ERROR);
                }
            }

            // LIFECYCYLE API

            function doEditNotebookMetadata() {
                Narrative.editNotebookMetadata();
            }

            function doEditCellMetadata() {
                Narrative.editCellMetadata(cell);
            }

            function initCodeInputArea() {
                model.setItem('user-settings.showCodeInputArea', false);
            }

            function showCodeInputArea() {
                const codeInputArea = cell.input.find('.input_area').get(0);
                if (model.getItem('user-settings.showCodeInputArea')) {
                    if (!codeInputArea.classList.contains('-show')) {
                        codeInputArea.classList.add('-show');
                    }
                } else {
                    codeInputArea.classList.remove('-show');
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

            // WIDGETS

            /*
             *
             * Render the UI according to the FSM
             */
            function renderUI() {
                if (!ui) {
                    throw new Error(
                        'Cannot render UI without defining a node for the widget. Have you run `widget.attach()`?'
                    );
                }
                const state = fsm.getCurrentState();
                try {
                    FSMBar.showFsmBar({
                        ui,
                        state,
                        job: model.getItem('exec.jobState'),
                    });
                } catch (error) {
                    console.warn('Could not display FSM state:', error);
                }

                if (!viewOnly && model.getItem('outdated')) {
                    const outdatedBtn = ui.getElement('outdated');
                    outdatedBtn.setAttribute(
                        'data-content',
                        'This app has a newer version available! ' +
                            "There's probably nothing wrong with this version, " +
                            'but the new one may include new features. Add a new "' +
                            model.getItem('newAppName') +
                            '" app cell for the update.'
                    );
                }

                // Tab state

                // TODO: let user-selection override auto-selection of tab, unless
                // the user-selected tab is no longer enabled or is hidden.

                // disable tab buttons
                // If current tab is not enabled in this state, then forget that the user
                // made a selection.

                const userStateTab = state.ui.tabs[selectedTabId()];
                if (!userStateTab || !userStateTab.enabled || userStateTab.hidden) {
                    userSelectedTab = false;
                }

                let tabSelected = false;
                Object.keys(state.ui.tabs).forEach((tabId) => {
                    const tab = state.ui.tabs[tabId];
                    let tabState;
                    if (tab instanceof Array) {
                        tabState = tab.filter((mode) => {
                            if (
                                (mode.selector.viewOnly && viewOnly) ||
                                (!mode.selector.viewOnly && !viewOnly)
                            ) {
                                return true;
                            }
                        })[0].settings;
                    } else {
                        tabState = tab;
                    }
                    tabState.enabled ? ui.enableButton(tabId) : ui.disableButton(tabId);

                    // TODO honor user-selected tab.
                    // Unless the tab is not enabled in this state, in which case
                    // we do switch to the one called for by the state.
                    if (tabState.selected && !userSelectedTab) {
                        tabSelected = true;
                        selectTab(tabId);
                    }
                    tabState.hidden ? ui.hideButton(tabId) : ui.showButton(tabId);
                });
                // If no new tabs selected (even re-selecting an existing open tab)
                // close the open tab.
                if (!tabSelected && !userSelectedTab) {
                    unselectTab();
                }

                actionButtonWidget.setState(state.ui.actionButton);
            }

            /*
            setReadOnly is called to put the cell into read-only mode when it is loaded.
            This is different than view-only, which for read/write mode is toggleable.
            Read-only does imply view-only as well!
            */
            function setReadOnly() {
                readOnly = true;
                cell.code_mirror.setOption('readOnly', 'nocursor');
                toggleViewOnlyMode(true);
            }

            function toggleViewOnlyMode(newViewOnly) {
                viewOnly = newViewOnly;
            }

            let saveTimer = null;

            function saveNarrative() {
                if (saveTimer) {
                    return;
                }
                if (readOnly) {
                    console.warn('cannot save narrative in read-only mode; save request ignored');
                    return;
                }
                saveTimer = window.setTimeout(() => {
                    saveTimer = null;
                    Narrative.saveNotebook();
                }, saveMaxFrequency);
            }

            /*
             * NB: the jobs panel takes care of removing the job info from the
             * narrative metadata.
             */
            function cancelJob(jobId) {
                runtime.bus().emit(jcm.MESSAGE_TYPE.CANCEL, {
                    [jcm.PARAM.JOB_ID]: jobId,
                });
            }

            // Reset the app to edit mode
            function resetToEditMode() {
                // only do this if we are not editing.
                model.deleteItem('exec');
                clearOutput();
                ui.setContent('run-control-panel.execMessage', '');

                // renderUI is called as part of this function
                evaluateAppState();
            }

            function doRerun() {
                DialogMessages.showDialog({ action: 'appReset' }).then((confirmed) => {
                    if (confirmed) {
                        resetToEditMode();
                    }
                });
            }

            function doReset() {
                DialogMessages.showDialog({ action: 'appReset' }).then((confirmed) => {
                    if (confirmed) {
                        resetToEditMode();
                    }
                });
            }

            /*
             * Cancelling a job is the same as deleting it, and the effect of cancelling the job is the same as re-running it.
             *
             */
            function doCancel() {
                DialogMessages.showDialog({ action: 'cancelApp' }).then((confirmed) => {
                    if (!confirmed) {
                        return;
                    }

                    if (!model.getItem('exec.jobState.job_id')) {
                        resetToEditMode();
                        return;
                    }

                    cancelJob(model.getItem('exec.jobState.job_id'));
                    fsm.newState(fsmState.CANCELING);
                    renderUI();
                });
            }

            function updateFromLaunchEvent(message) {
                // Update the exec state.
                // NB we need to do this because the launch events are only
                // sent once from the narrative back end.
                let newExecMessage = '';
                // Update FSM
                const newFsmState = (function () {
                    switch (message.event) {
                        case 'launched_job':
                            // start listening for jobs.
                            model.setItem('exec.jobState', {
                                job_id: message.job_id,
                                status: 'created',
                                created: 0,
                            });
                            newExecMessage = 'Launching...';
                            startListeningForJobMessages(message.job_id);
                            return fsmState.PROCESSING_LAUNCHED;
                        case 'error':
                            return fsmState.LAUNCH_ERROR;
                        default:
                            throw new Error('Invalid launch state ' + message.event);
                    }
                })();
                fsm.newState(newFsmState);
                ui.setContent('run-control-panel.execMessage', newExecMessage);
                renderUI();
            }

            function updateFromJobState(jobState, forceRender) {
                const newFsmState = (function () {
                    switch (jobState.status) {
                        case 'created':
                        case 'estimating':
                        case 'queued':
                            return fsmState.PROCESSING_QUEUED;
                        case 'running':
                            return fsmState.PROCESSING_RUNNING;
                        case 'completed':
                            stopListeningForJobMessages();
                            return fsmState.COMPLETED;
                        case 'terminated':
                            stopListeningForJobMessages();
                            return fsmState.TERMINATED;
                        case 'error':
                        case 'does_not_exist':
                            stopListeningForJobMessages();
                            return fsmState.RUNTIME_ERROR;
                        default:
                            throw new Error('Invalid job state ' + jobState.status);
                    }
                })();
                fsm.newState(newFsmState);
                if (forceRender) {
                    initializeFSM();
                }
                renderUI();
            }

            function doRun() {
                if (readOnly) {
                    console.warn('run request ignored in readOnly mode');
                    return;
                }
                fsm.newState(fsmState.EXECUTE_REQUESTED);
                ui.setContent('run-control-panel.execMessage', 'Sending...');
                renderUI();

                // We want to close down the configure tab, so let's forget about
                // the fact that the user may have opened and closed the tab...
                userSelectedTab = false;

                cell.execute();
            }

            function startListeningForJobMessages(jobId) {
                if (!jobId) {
                    return;
                }
                jobListeners.push(
                    // listen for job-related bus messages
                    runtime.bus().listen({
                        channel: {
                            [jcm.CHANNEL.JOB]: jobId,
                        },
                        key: {
                            type: jcm.MESSAGE_TYPE.STATUS,
                        },
                        handle: doJobStatus,
                    })
                );
                runtime.bus().emit(jcm.MESSAGE_TYPE.START_UPDATE, {
                    [jcm.PARAM.JOB_ID]: jobId,
                });
            }

            function doJobStatus(message) {
                const existingState = model.getItem('exec.jobState'),
                    existingJobId = existingState
                        ? existingState.job_id
                        : model.getItem('exec.launchState.job_id'),
                    newJobState = message[existingJobId].jobState,
                    { outputWidgetInfo } = message[existingJobId],
                    forceRender =
                        (!existingState || !Jobs.isValidJobStateObject(existingState)) &&
                        Jobs.isValidJobStateObject(newJobState);
                if (!existingState || !_.isEqual(existingState, newJobState)) {
                    model.setItem('exec.jobState', newJobState);
                    if (outputWidgetInfo) {
                        model.setItem('exec.outputWidgetInfo', outputWidgetInfo);
                    }
                }
                model.setItem('exec.jobStateUpdated', new Date().getTime());

                updateFromJobState(newJobState, forceRender);
            }

            function stopListeningForJobMessages() {
                while (jobListeners.length) {
                    const listener = jobListeners.pop();
                    runtime.bus().removeListener(listener);
                }

                const jobId = model.getItem('exec.jobState.job_id');
                if (jobId) {
                    runtime.bus().emit(jcm.MESSAGE_TYPE.STOP_UPDATE, {
                        [jcm.PARAM.JOB_ID]: jobId,
                    });
                }
            }

            function createOutputCell(jobId) {
                const parentCellId = cellUtils.getMeta(cell, 'attributes', 'id'),
                    cellIndex = Jupyter.notebook.find_cell_index(cell),
                    // the new output cell ID
                    cellId = new Uuid(4).format(),
                    setupData = {
                        cellId,
                        jobId,
                        parentCellId,
                        type: 'output',
                        widget: model.getItem('exec.outputWidgetInfo'),
                    };
                Jupyter.notebook.insert_cell_below('code', cellIndex, setupData);

                return cellId;
            }

            function clearOutput() {
                const cellNode = cell.element.get(0),
                    textNode = cellNode.querySelector('.output_area.output_text');

                if (textNode) {
                    textNode.innerHTML = '';
                }
            }

            function updateJobState() {
                const jobState = model.getItem('exec.jobState');
                ui.setContent('run-control-panel.execMessage', Jobs.createJobStatusLines(jobState));
            }

            // FSM state change events
            function doStartRunning() {
                updateJobState();
            }

            function doStartQueueing() {
                updateJobState();
            }

            function doExitSuccess() {
                ui.setContent('run-control-panel.execMessage', '');
            }

            function doOnSuccess() {
                updateJobState();

                // Output Cell Handling

                // If not in edit mode, we just skip this, and issue a warning to the console.
                if (!Narrative.canEdit()) {
                    console.warn(
                        'App cell completion in read-only narrative, cannot process output. Please save the narrative after app cells have completed.'
                    );
                    return;
                }

                // If so, is the cell still there?
                const jobId = model.getItem('exec.jobState.job_id');
                let outputCellId = model.getItem(['output', 'byJob', jobId, 'cell', 'id']);

                // If the output cell is already recorded in the app cell, and it it is in the
                // narrative, do not try to inserted it.
                if (outputCellId) {
                    if (cellUtils.findById(outputCellId)) {
                        return;
                    }
                }

                /*
                If the job output specifies that no output is to be shown to the user,
                skip the output cell creation.
                */
                // widgets named 'no-display' are a trigger to skip the output cell process.
                const skipOutputCell = model.getItem('exec.outputWidgetInfo.name') === 'no-display';
                let cellInfo;
                if (skipOutputCell) {
                    cellInfo = {
                        created: false,
                    };
                } else {
                    // No, we don't check here
                    outputCellId = createOutputCell(jobId);
                    cellInfo = {
                        id: outputCellId,
                        created: true,
                    };
                }

                // Record the output cell info by the job id.
                // This serves to "stamp" the ouput cell in to the app cell
                // TODO: this logic is probably no longer required. This used to be linked
                // to functionality which allowed a user to re-insert an output cell if it
                // had been deleted. Some output cells cannot be replicated, since their output
                // is not derived from an object visible in the data panel.
                model.setItem(['output', 'byJob', jobId], {
                    cell: cellInfo,
                    createdAt: new Date().toGMTString(),
                    params: model.copyItem('params'),
                });
            }

            function doResumeSuccess() {
                updateJobState();
            }

            function doOnError() {
                updateJobState();
                ui.setContent('run-control-panel.execMessage', '');
            }

            function doExitError() {
                ui.setContent('run-control-panel.execMessage', '');
            }

            function doOnCancelling() {
                ui.setContent('run-control-panel.execMessage', 'Cancelling...');
            }

            function doExitCancelling() {
                ui.setContent('run-control-panel.execMessage', '');
            }

            function doOnCancelled() {
                updateJobState();
            }

            function doExitCancelled() {
                ui.setContent('run-control-panel.execMessage', '');
            }

            function doDeleteCell() {
                DialogMessages.showDialog({ action: 'deleteCell' }).then((confirmed) => {
                    if (!confirmed) {
                        return;
                    }

                    const jobState = model.getItem('exec.jobState');
                    if (jobState) {
                        cancelJob(jobState.job_id);
                    }

                    // tear down all the sub widgets.
                    // TODO: make all widget behavior consistent. Either message or promise.
                    Object.keys(widgets).forEach((widgetId) => {
                        try {
                            const widget = widgets[widgetId];
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

                    const cellIndex = Jupyter.notebook.find_cell_index(cell);
                    Jupyter.notebook.delete_cell(cellIndex);
                });
            }

            function addBusEvents() {
                // APP CELL EVENTS

                busEventManager.add(
                    bus.on('toggle-code-view', () => {
                        const showing = toggleCodeInputArea(),
                            label = showing ? 'Hide Code' : 'Show Code';
                        ui.setButtonLabel('toggle-code-view', label);
                    })
                );
                busEventManager.add(
                    bus.on('edit-cell-metadata', () => {
                        doEditCellMetadata();
                    })
                );
                busEventManager.add(
                    bus.on('edit-notebook-metadata', () => {
                        doEditNotebookMetadata();
                    })
                );

                // TODO: once we evaluate how to handle state in bulk import cell, see if these functions
                // and events can be abstracted or should be

                // are these used anywhere?!
                busEventManager.add(
                    bus.on('run-app', () => {
                        doRun();
                    })
                );
                busEventManager.add(
                    bus.on('re-run-app', () => {
                        doReset();
                    })
                );
                busEventManager.add(
                    bus.on('cancel', () => {
                        doCancel();
                    })
                );

                busEventManager.add(
                    parentBus.on('reset-to-defaults', () => {
                        bus.emit('reset-to-defaults');
                    })
                );

                busEventManager.add(
                    parentBus.on('toggle-batch-mode', () => {
                        toggleBatchMode();
                    })
                );

                // TODO: only turn this on when we need it!
                busEventManager.add(
                    cellBus.on(jcm.MESSAGE_TYPE.RUN_STATUS, (message) => {
                        updateFromLaunchEvent(message);

                        model.setItem('exec.launchState', message);

                        saveNarrative();

                        cellBus.emit('launch-status', {
                            launchState: message,
                        });
                    })
                );

                busEventManager.add(
                    cellBus.on('delete-cell', () => {
                        doDeleteCell();
                    })
                );

                busEventManager.add(
                    cellBus.on('output-cell-removed', (message) => {
                        const output = model.getItem('output');

                        if (!output.byJob[message.jobId]) {
                            return;
                        }

                        delete output.byJob[message.jobId];
                        model.setItem('output', output);
                    })
                );

                busEventManager.add(
                    runtime.bus().on('read-only-changed', (msg) => {
                        toggleViewOnlyMode(msg.readOnly);
                        renderUI();
                    })
                );

                busEventManager.add(
                    runtime.bus().on('kernel-state-changed', () => {
                        renderUI();
                    })
                );
            }

            function exportParams() {
                const params = model.getItem('params'),
                    paramsToExport = {},
                    { parameters } = spec.getSpec();

                Object.keys(params).forEach((key) => {
                    let value = params[key];
                    const paramSpec = parameters.specs[key];

                    if (!paramSpec) {
                        console.error(
                            'Parameter ' + key + ' is not defined in the parameter map',
                            parameters
                        );
                        throw new Error(
                            'Parameter ' + key + ' is not defined in the parameter map'
                        );
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
                const messages = [];

                function harvestErrors(validations) {
                    if (validations instanceof Array) {
                        validations.forEach((result, index) => {
                            if (!result.isValid) {
                                messages.push(String(index) + ':' + result.errorMessage);
                            }
                            if (result.validations) {
                                harvestErrors(result.validations);
                            }
                        });
                    } else {
                        Object.keys(validations).forEach((id) => {
                            const result = validations[id];
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

            /**
             * Evaluates the state the app is in. It does this by validating the current model, gathers
             * all validation messages from the parameters, and renders them as needed.
             *
             * If there are no errors from the state and we're not definitely in an error case already,
             * then just build the Python code and set the state so that the params are complete and the
             * code is built.
             *
             * If there are errors, then we clear the Python code from the code area, and set the state to
             * be incomplete.
             * @param {boolean} isError
             */
            function evaluateAppState(isError) {
                validateModel()
                    .then((result) => {
                        // we have a tree of validations, so we need to walk the tree to see if anything
                        // does not validate.
                        const messages = gatherValidationMessages(result);

                        if (messages.length === 0 && !isError) {
                            buildPython(
                                cell,
                                cellUtils.getMeta(cell, 'attributes').id,
                                model.getItem('app'),
                                exportParams()
                            );
                            fsm.newState(fsmState.EDITING_COMPLETE);
                        } else {
                            resetPython(cell);
                            fsm.newState(fsmState.EDITING_INCOMPLETE);
                        }
                        renderUI();
                    })
                    .catch((err) => {
                        console.error('INTERNAL ERROR', err);
                    });
            }

            function checkSpec(appSpec) {
                const cellAppSpec = model.getItem('app.spec');

                if (!cellAppSpec) {
                    throw new ToErr.KBError({
                        type: 'app-cell-app-info',
                        message: 'This app cell is misconfigured - it does not contain an app spec',
                        info: model.getItem('app'),
                        advice: [
                            'This app cell is not correctly configured',
                            'It should contain an app object but does not',
                            'The app object contains the raw spec and other info',
                            'This is most likely due to this app being inserted into the narrative in a development environment in which the app model (and cell metadata) is in flux',
                        ],
                    });
                }

                if (appSpec.info.module !== cellAppSpec.info.module) {
                    throw new Error(
                        'Mismatching app modules: ' +
                            cellAppSpec.info.module +
                            ' !== ' +
                            appSpec.info.module
                    );
                }

                if (cellAppSpec.info.git_commit_hash !== appSpec.info.git_commit_hash) {
                    return new ToErr.KBError({
                        severity: 'warning',
                        type: 'app-spec-mismatched-commit',
                        message:
                            'Mismatching app commit for ' +
                            appSpec.info.id +
                            ', tag=' +
                            model.getItem('app.tag') +
                            ' : ' +
                            cellAppSpec.info.git_commit_hash +
                            ' !== ' +
                            appSpec.info.git_commit_hash,
                        info: {
                            tag: model.getItem('app.tag'),
                            cellCommitHash: cellAppSpec.info.git_commit_hash,
                            catalogCommitHash: appSpec.info.git_commit_hash,
                            newAppName: appSpec.info.name,
                        },
                        advice: [
                            'Due to potential incompatibilities between different versions of an dev or beta app, this app cell cannot be rendered',
                            'You should add a new app cell for this app, and remove this one',
                            'Inserting a dev or beta app cell will tie the app cell to the specific current commit by storing the commit hash',
                            'In the future we may provide options to attempt conversion of this cell and provide other options',
                        ],
                    });
                }

                return null;
            }

            // LIFECYCLE API

            function init() {
                return Promise.try(() => {
                    initializeFSM();
                    initCodeInputArea();

                    if (!Jupyter.notebook.writable || Jupyter.narrative.readonly) {
                        setReadOnly();
                    }

                    return null;
                });
            }

            function attach(node) {
                return Promise.try(() => {
                    hostNode = node;
                    container = hostNode.appendChild(document.createElement('div'));
                    ui = UI.make({
                        node: container,
                        bus,
                    });

                    actionButtonWidget = ActionButtons.make({
                        ui,
                        actionButtons,
                        bus,
                        runAction: doActionButton,
                        cssCellType: null,
                    });

                    const layout = renderLayout();
                    container.innerHTML = layout.content;
                    layout.events.attachEvents(container);
                    $(container).find('[data-toggle="popover"]').popover();
                    return null;
                }).catch((error) => {
                    throw new Error('Unable to attach app cell widget: ' + error);
                });
            }

            function start() {
                return Promise.try(() => {
                    // Initial ui tweaks

                    // Honor the code input area show/hide.
                    // TODO: this fixup is far too late in the cell lifecycle, leaving the code
                    // area showing if it marked as hidden. We need to at least hide the input area
                    // by default.
                    showCodeInputArea();

                    if (readOnly) {
                        ui.hideElement('outdated');
                    }
                })
                    .then(() => {
                        return Semaphore.make().when(
                            'comm',
                            'ready',
                            Config.get('comm_wait_timeout')
                        );
                    })
                    .then(() => {
                        cell.element.on('toggleCodeArea.cell', () => {
                            toggleCodeInputArea();
                        });

                        addBusEvents();

                        return null;
                    })
                    .catch((err) => {
                        if (err.message.indexOf('semaphore') !== -1) {
                            throw new Error(
                                'A network timeout occurred while trying to build a communication ' +
                                    'channel to retrieve job information. Please refresh the page to try ' +
                                    'again.<br><br>Details: ' +
                                    err.message
                            );
                        }
                        throw err;
                    });
            }

            function run() {
                // First get the app specs, which is stashed in the model,
                // with the parameters returned.
                // If the app has been run before...
                // The app reference is already in the app cell metadata.
                return Promise.try(() => {
                    if (cellUtils.getCellMeta(cell, 'kbase.type') !== 'devapp') {
                        return getAppSpec();
                    }
                    return {};
                })
                    .then((appSpec) => {
                        // Ensure that the current app spec matches our existing one.
                        if (appSpec && cellUtils.getCellMeta(cell, 'kbase.type') !== 'devapp') {
                            const warning = checkSpec(appSpec);
                            if (warning && warning.severity === 'warning') {
                                if (warning.type === 'app-spec-mismatched-commit') {
                                    model.setItem('outdated', true);
                                    model.setItem('newAppName', warning.info.newAppName);
                                }
                            }
                        }

                        const appRef = [model.getItem('app.id'), model.getItem('app.tag')]
                                .filter((v) => !!v)
                                .join('/'),
                            url = '/#appcatalog/app/' + appRef;
                        cellUtils.setCellMeta(
                            cell,
                            'kbase.attributes.title',
                            model.getItem('app.spec.info.name')
                        );
                        cellUtils.setCellMeta(
                            cell,
                            'kbase.attributes.subtitle',
                            model.getItem('app.spec.info.subtitle')
                        );
                        cellUtils.setCellMeta(cell, 'kbase.attributes.info.url', url);
                        cellUtils.setCellMeta(cell, 'kbase.attributes.info.label', 'more...');
                    })
                    .then(() => {
                        // this will not change, so we can just render it here.
                        PR.prettyPrint(null, container);

                        // if we start out in 'new' state, we need to promote it to
                        // one of the 'editing' states
                        if (fsm.getCurrentState().state.mode === 'new') {
                            evaluateAppState();
                            return;
                        }

                        /*
                         * Check the job state and request an update if it looks outdated.
                         */
                        const jobState = model.getItem('exec.jobState');
                        if (jobState && !Jobs.isValidJobStateObject(jobState)) {
                            startListeningForJobMessages(jobState.job_id);
                        } else if (!jobState && model.getItem('exec.launchState.job_id')) {
                            startListeningForJobMessages(model.getItem('exec.launchState.job_id'));
                        }

                        renderUI();

                        // Initial job state listening.
                        const jobListeningModes = ['canceling', 'processing', 'error'];
                        const currentMode = fsm.getCurrentState().state.mode;
                        if (jobListeningModes.includes(currentMode)) {
                            startListeningForJobMessages(jobState.job_id);
                        }
                    })
                    .catch((err) => {
                        const error = ToErr.grokError(err);
                        console.error('ERROR loading main widgets', error);

                        model.setItem('fatalError', {
                            title: 'Error loading main widgets',
                            message: error.message,
                            advice: error.advice || [],
                            info: error.info,
                            detail: error.detail || 'no additional details',
                        });
                        fsm.newState(fsmState.INTERNAL_ERROR);
                        renderUI();
                    });
            }

            function stop() {
                return Promise.try(() => {
                    busEventManager.removeAll();
                });
            }

            function detach() {
                return Promise.try(() => {
                    if (hostNode && container) {
                        hostNode.removeChild(container);
                    }
                });
            }

            function __fsm() {
                return fsm;
            }

            return developerMode ? { ...api, __fsm, busEventManager, model } : api;
        }

        return {
            make: function (config) {
                return factory(config);
            },
            cssCellType,
        };
    },
    (err) => {
        'use strict';
        console.error('ERROR loading appCell appCellWidget', err);
    }
);
