define([
    'jquery',
    'bluebird',
    'uuid',
    'base/js/namespace',
    'common/runtime',
    'common/events',
    'common/html',
    'common/props',
    'common/jupyter',
    'common/busEventManager',
    'kb_service/client/narrativeMethodStore',
    'kb_service/client/workspace',
    'common/pythonInterop',
    'common/utils',
    'common/ui',
    'common/fsm',
    'common/spec',
    'google-code-prettify/prettify',
    'css!google-code-prettify/prettify.css',
    'css!font-awesome.css'
], function(
    $,
    Promise,
    Uuid,
    JupyterNamespace,
    Runtime,
    Events,
    html,
    Props,
    Narrative,
    BusEventManager,
    NarrativeMethodStore,
    Workspace,
    PythonInterop,
    utils,
    Ui,
    Fsm,
    Spec,
    PR
) {
    'use strict';
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        a = t('a'),
        p = t('p'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        pre = t('pre'),
        input = t('input'),
        appStates = [{
            state: {
                mode: 'new'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['run-app']
                },
                elements: {
                    show: [],
                    hide: ['fatal-error', 'parameters-group', 'output-group', 'parameters-display-group', 'exec-group']
                }
            },
            next: [{
                mode: 'fatal-error'
            },
            {
                mode: 'editing',
                params: 'incomplete'
            }
            ]
        },
        {
            state: {
                mode: 'fatal-error'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['run-app']
                },
                elements: {
                    show: ['fatal-error'],
                    hide: ['parameters-group', 'output-group', 'parameters-display-group', 'exec-group']
                }
            },
            next: []

        },
        {
            state: {
                mode: 'editing',
                params: 'incomplete'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['run-app']
                },
                elements: {
                    show: ['parameters-group', 'output-group'],
                    hide: ['fatal-error', 'parameters-display-group', 'exec-group']
                }
            },
            next: [{
                mode: 'editing',
                params: 'complete',
                code: 'built'
            },
            {
                mode: 'editing',
                params: 'incomplete'
            }
            ]
        },
        {
            state: {
                mode: 'editing',
                params: 'complete',
                code: 'built'
            },
            ui: {
                buttons: {
                    enabled: ['run-app'],
                    disabled: []
                },
                elements: {
                    show: ['parameters-group', 'output-group'],
                    hide: ['fatal-error', 'parameters-display-group', 'exec-group']
                }
            },
            next: [{
                mode: 'editing',
                params: 'incomplete'
            },
            {
                mode: 'editing',
                params: 'complete',
                code: 'built'
            },
            {
                mode: 'processing',
                stage: 'launching'
            },
            {
                mode: 'processing',
                stage: 'queued'
            },
            {
                mode: 'processing',
                stage: 'running'
            },
            {
                mode: 'success'
            },
            {
                mode: 'error',
                stage: 'launching'
            },
            {
                mode: 'error',
                stage: 'queued'
            },
            {
                mode: 'error',
                stage: 'running'
            },
            {
                mode: 'error'
            }
            ]
        },
        {
            state: {
                mode: 'success'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['run-app']
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                }
            },
            on: {
                enter: {
                    messages: [{
                        emit: 'on-success'
                    }]
                }
            },
            next: [{
                mode: 'success'
            },
            {
                mode: 'editing',
                params: 'complete',
                code: 'built'
            }
            ]
        },
        {
            state: {
                mode: 'error'
            },
            ui: {
                buttons: {
                    enabled: [],
                    disabled: ['run-app']
                },
                elements: {
                    show: ['parameters-display-group', 'exec-group', 'output-group'],
                    hide: ['parameters-group']
                }
            },
            next: [{
                mode: 'error'
            },
            {
                mode: 'editing',
                params: 'complete',
                code: 'built'
            }
            ]
        }
        ];

    function factory(config) {
        var container, ui,
            workspaceInfo = config.workspaceInfo,
            runtime = Runtime.make(),
            cell = config.cell,
            parentBus = config.bus,
            spec,
            // TODO: the cell bus should be created and managed through main.js,
            // that is, the extension.
            cellBus,
            bus = runtime.bus().makeChannelBus({ description: 'A view cell widget' }),
            model,
            paramsWidget,

            eventManager = BusEventManager.make({
                bus: runtime.bus()
            }),
            // HMM. Sync with metadata, or just keep everything there?
            settings = {
                showAdvanced: {
                    label: 'Show advanced parameters',
                    defaultValue: false,
                    type: 'custom'
                },
                showNotifications: {
                    label: 'Show the notifications panel',
                    defaultValue: false,
                    type: 'toggle',
                    element: 'notifications'
                },
                showAboutApp: {
                    label: 'Show the About App panel',
                    defaultValue: false,
                    type: 'toggle',
                    element: 'about-app'
                }
            },
            fsm;

        if (runtime.config('features.developer')) {
            settings.showDeveloper = {
                label: 'Show developer features',
                defaultValue: false,
                type: 'toggle',
                element: 'developer-options'
            };
        }

        // DATA API

        /*
         * Fetch the app spec for a given app and store the spec in the model.
         * As well, process and store the parameters in the model as well.
         *
         * @param {type} appId
         * @param {type} appTag
         * @returns {unresolved}
         */
        function syncAppSpec(appId, appTag) {
            var appRef = {
                    ids: [appId],
                    tag: appTag
                },
                nms = new NarrativeMethodStore(runtime.config('services.narrative_method_store.url'), {
                    token: runtime.authToken()
                });

            return nms.get_method_spec(appRef)
                .then(function(data) {
                    if (!data[0]) {
                        throw new Error('App not found');
                    }                   
                });
        }

        // RENDER API


        function syncFatalError() {
            ui.setContent('fatal-error.title', model.getItem('fatalError.title'));
            ui.setContent('fatal-error.message', model.getItem('fatalError.message'));
        }

        // function showFatalError(arg) {
        //     ui.showElement('fatal-error');
        // }

        function showFsmBar() {
            var currentState = fsm.getCurrentState(),
                content = Object.keys(currentState.state).map(function(key) {
                    return span([
                        span({ style: { fontStyle: 'italic' } }, key),
                        ' : ',
                        span({ style: { padding: '4px', fontWeight: 'noramal', border: '1px silver solid', backgroundColor: 'gray', color: 'white' } }, currentState.state[key])
                    ]);
                }).join('  ');

            ui.setContent('fsm-display.content', content);
        }



        function renderAppSpec() {
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
                ui.ifAdvanced(function() {
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
                ui.ifAdvanced(function() {
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
            return html.makeTabs({
                tabs: [{
                    label: 'Summary',
                    name: 'summary',
                    content: renderAppSummary()
                },
                ui.ifAdvanced(function() {
                    return {
                        label: 'Spec',
                        name: 'spec',
                        content: renderAppSpec()
                    };
                })
                ]
            });
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
                    ui.showElement(setting.element);
                } else {
                    ui.hideElement(setting.element);
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
                content = Object.keys(settings).map(function(key) {
                    var setting = settings[key],
                        settingsValue = model.getItem(['user-settings', key], setting.defaultValue);
                    return div({}, [
                        input({
                            type: 'checkbox',
                            checked: (settingsValue ? true : false),
                            dataSetting: key,
                            value: key,
                            id: events.addEvent({
                                type: 'change',
                                handler: function(e) {
                                    doChangeSetting(e);
                                }
                            })
                        }),
                        span({ style: { marginLeft: '4px', fontStyle: 'italic' } }, setting.label)
                    ]);
                }).join('\n');
            ui.setContent('settings.content', content);
            events.attachEvents();

            //Ensure that the settings are reflected in the UI.
            Object.keys(settings).forEach(function(key) {
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
            ui.setContent('about-app.authors', (function() {
                if (appSpec.info.authors && appSpec.info.authors.length > 0) {
                    return appSpec.info.authors.join('<br>');
                }
                return ui.na();
            }()));
            var appRef = [appSpec.info.namespace || 'l.m', appSpec.info.id].filter(toBoolean).join('/'),
                link = a({ href: '/#appcatalog/app/' + appRef, target: '_blank' }, 'Catalog Page');
            ui.setContent('about-app.catalog-link', link);
        }

        function showAppSpec() {
            var appSpec = model.getItem('app.spec');
            var specText = JSON.stringify(appSpec, false, 3),
                fixedText = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                content = pre({ class: 'prettyprint lang-json', style: { fontSize: '80%' } }, fixedText);
            ui.setContent('about-app.spec', content);
        }

        function renderLayout() {
            var readOnlyStyle = {};
            if (!Narrative.canEdit()) {
                readOnlyStyle.display = 'none';
            }
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
                                ui.buildPanel({
                                    title: 'Error',
                                    name: 'fatal-error',
                                    hidden: true,
                                    type: 'danger',
                                    classes: ['kb-panel-container'],
                                    body: div([
                                        table({ class: 'table table-striped' }, [
                                            tr([
                                                th('Title'), td({ dataElement: 'title' }),
                                                td('Message', td({ dataElement: 'message' }))
                                            ])
                                        ])
                                    ])
                                }),
                                ui.buildPanel({
                                    title: 'Cell Settings',
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
                                    hidden: false,
                                    collapsed: true,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: [
                                        div({ dataElement: 'about-app' }, renderAboutApp())
                                    ]
                                }),
                                ui.buildCollapsiblePanel({
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
                                }),
                                ui.buildCollapsiblePanel({
                                    title: 'Input ' + span({ class: 'fa fa-arrow-right' }),
                                    name: 'parameters-group',
                                    hidden: false,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: div({ dataElement: 'widget' })
                                }),
                                ui.buildCollapsiblePanel({
                                    title: 'Parameters Display',
                                    name: 'parameters-display-group',
                                    hidden: false,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: div({ dataElement: 'widget' })
                                }),
                                div({
                                    dataElement: 'availableActions',
                                    style: readOnlyStyle,
                                }, [
                                    div({ class: 'btn-toolbar kb-btn-toolbar-cell-widget' }, [
                                        div({ class: 'btn-group' }, [
                                            ui.makeButton('View', 'run-app', { events: events, type: 'primary' })
                                        ])
                                    ])
                                ])
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
            return spec.validateModel(model.getItem('params'));
        }

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
                code = PythonInterop.buildViewRunner(cellId, runId, fixApp(app), params);

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
                onNewState: function(fsm) {
                    model.setItem('fsm.currentState', fsm.getCurrentState().state);
                    // save the narrative!

                },
                bus: bus
            });
            fsm.start(currentState);
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
            var codeInputArea = cell.input.find('.input_area').get(0);
            if (model.getItem('user-settings.showCodeInputArea')) {
                if (!codeInputArea.classList.contains('-show')) {
                    codeInputArea.classList.add('-show');
                }
            } else {
                if (codeInputArea.classList.contains('-show')) {
                    codeInputArea.classList.remove('-show');
                }
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
                //node.style.display = 'block';
            } else {
                //node.style.display = 'none';
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
                content = notifications.map(function(notification, index) {
                    return div({ class: 'row' }, [
                        div({ class: 'col-md-10' }, notification),
                        div({ class: 'col-md-2', style: { textAlign: 'right' } }, span({}, [
                            a({
                                class: 'btn btn-default',
                                id: events.addEvent({
                                    type: 'click',
                                    handler: function() {
                                        doRemoveNotification(index);
                                    }
                                })
                            }, 'X')
                        ]))
                    ]);
                }).join('\n');
            ui.setContent('notifications.content', content);
            events.attachEvents(container);
        }

        function addNotification(notification) {
            var notifications = model.getItem('notifications') || [];
            notifications.push(notification);
            model.setItem('notifications', notifications);
            renderNotifications();
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

            // Button state
            state.ui.buttons.enabled.forEach(function(button) {
                ui.enableButton(button);
            });
            state.ui.buttons.disabled.forEach(function(button) {
                ui.disableButton(button);
            });


            // Element state
            state.ui.elements.show.forEach(function(element) {
                ui.showElement(element);
            });
            state.ui.elements.hide.forEach(function(element) {
                ui.hideElement(element);
            });

        }

        function doDeleteCell() {
            var content = div([
                p([
                    'Deleting this cell will remove the data visualization, ',
                    'but will not delete the data object, which will still be avaiable ',
                    'in the data panel.'
                ]),
                p('Continue to delete this data cell?')
            ]);
            ui.showConfirmDialog({ title: 'Confirm Cell Deletion', body: content })
                .then(function(confirmed) {
                    if (!confirmed) {
                        return;
                    }

                    bus.emit('stop');

                    Narrative.deleteCell(cell);
                });
        }

        function doRun() {
            ui.collapsePanel('parameters-group');
            cell.execute();
        }

        // LIFECYCLE API

        function init() {
            return Promise.try(function() {
                initializeFSM();
                initCodeInputArea();
                return null;
            });
        }

        function attach(node) {
            return Promise.try(function() {
                container = node;
                ui = Ui.make({
                    node: container,
                    bus: bus
                });

                if (ui.isDeveloper()) {
                    settings.showDeveloper = {
                        label: 'Show developer features',
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
       
        function start() {
            return Promise.try(function() {
                // DOM EVENTS
                cell.element.on('toggleCodeArea.cell', function() {
                    toggleCodeInputArea(cell);
                });
                /*
                 * listeners for the local input cell message bus
                 */

                bus.on('edit-cell-metadata', function() {
                    doEditCellMetadata();
                });
                bus.on('edit-notebook-metadata', function() {
                    doEditNotebookMetadata();
                });
                cell.element.on('toggleCellSettings.cell', function() {
                    toggleSettings(cell);
                });
                bus.on('toggle-settings', function() {
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
                bus.on('run-app', function() {
                    doRun();
                });

                // Events from widgets...

                parentBus.on('reset-to-defaults', function() {
                    bus.emit('reset-to-defaults');
                });

                cellBus = runtime.bus().makeChannelBus({
                    name: {
                        cell: Props.getDataItem(cell.metadata, 'kbase.attributes.id')
                    },
                    description: 'A cell channel'
                });

                eventManager.add(cellBus.on('delete-cell', function() {
                    doDeleteCell();
                }));

                eventManager.add(runtime.bus().on('ui-mode-changed', function() {
                    if (Narrative.canEdit()) {
                        unloadParamsWidget()
                            .then(function() {
                                loadInputParamsWidget();
                            });
                    } else {
                        unloadParamsWidget()
                            .then(function() {
                                loadViewParamsWidget();
                            });
                    }
                }));

                showCodeInputArea();

                return null;
            });
        }

        function exportParams() {
            var params = model.getItem('params'),
                paramsToExport = {},
                parameters = spec.getSpec().parameters;

            Object.keys(params).forEach(function(key) {
                var value = params[key],
                    paramSpec = parameters.specs[key];

                if (!paramSpec) {
                    console.error('Parameter ' + key + ' is not defined in the parameter map', parameters);
                    throw new Error('Parameter ' + key + ' is not defined in the parameter map');
                }

                paramsToExport[key] = value;
            });

            return paramsToExport;
        }

        function unloadParamsWidget() {
            return Promise.try(function() {
                if (paramsWidget) {
                    return paramsWidget.stop();
                }
            });
        }

        function pRequire(ModulePath) {
            return new Promise(function(resolve, reject) {
                require([ModulePath], function(Widget) {
                    resolve(Widget);
                }, function(err) {
                    reject(err);
                });
            });
        }

        // TODO: handle raciness of the paramsWidget... 
        function loadInputParamsWidget() {
            pRequire('nbextensions/viewCell/widgets/appParamsWidget')
                .then(function(Widget) {
                    var bus = runtime.bus().makeChannelBus({ description: 'Parent comm bus for input widget' });

                    paramsWidget = Widget.make({
                        bus: bus,
                        workspaceInfo: workspaceInfo
                    });

                    bus.on('parameter-sync', function(message) {
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

                    bus.on('sync-params', function(message) {
                        message.parameters.forEach(function(paramId) {
                            bus.send({
                                parameter: paramId,
                                value: model.getItem(['params', message.parameter])
                            }, {
                                key: {
                                    type: 'parameter-value',
                                    parameter: paramId
                                },
                                channel: message.replyToChannel
                            });
                        });
                    });

                    bus.respond({
                        key: {
                            type: 'get-parameter'
                        },
                        handle: function(message) {
                            return {
                                value: model.getItem(['params', message.parameterName])
                            };
                        }
                    });

                    bus.on('parameter-changed', function(message) {
                        // We simply store the new value for the parameter.
                        model.setItem(['params', message.parameter], message.newValue);
                        evaluateAppState();
                    });
                    return paramsWidget.start({
                        node: ui.getElement(['parameters-group', 'widget']),
                        appSpec: model.getItem('app.spec'),
                        parameters: spec.getSpec().parameters,
                        params: model.getItem('params')
                    });
                });
        }

        function loadViewParamsWidget() {
            pRequire('nbextensions/viewCell/widgets/appParamsViewWidget')
                .then(function(Widget) {
                    var bus = runtime.bus().makeChannelBus({ description: 'Parent comm bus for input widget' });

                    paramsWidget = Widget.make({
                        bus: bus,
                        workspaceInfo: workspaceInfo
                    });

                    bus.on('parameter-sync', function(message) {
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

                    bus.on('sync-params', function(message) {
                        message.parameters.forEach(function(paramId) {
                            bus.send({
                                parameter: paramId,
                                value: model.getItem(['params', message.parameter])
                            }, {
                                key: {
                                    type: 'parameter-value',
                                    parameter: paramId
                                },
                                channel: message.replyToChannel
                            });
                        });
                    });

                    bus.respond({
                        key: {
                            type: 'get-parameter'
                        },
                        handle: function(message) {
                            return {
                                value: model.getItem(['params', message.parameterName])
                            };
                        }
                    });

                    bus.on('parameter-changed', function(message) {
                        // We simply store the new value for the parameter.
                        model.setItem(['params', message.parameter], message.newValue);
                        evaluateAppState();
                    });
                    return paramsWidget.start({
                        node: ui.getElement(['parameters-group', 'widget']),
                        appSpec: model.getItem('app.spec'),
                        parameters: spec.getSpec().parameters,
                        params: model.getItem('params')
                    });
                });
        }

        // just a quick hack since we are not truly recursive yet..,
        function gatherValidationMessages(validationResult) {
            var messages = [];

            function harvestErrors(validations) {
                if (validations instanceof Array) {
                    validations.forEach(function(result, index) {
                        if (!result.isValid) {
                            messages.push(String(index) + ':' + result.errorMessage);
                        }
                        if (result.validations) {
                            harvestErrors(result.validations);
                        }
                    });
                } else {
                    Object.keys(validations).forEach(function(id) {
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
                .then(function(result) {
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
                .catch(function(err) {
                    alert('internal error'),
                    console.error('INTERNAL ERROR', err);
                });
        }

        function run(params) {
            // First get the app specs, which is stashed in the model,
            // with the parameters returned.
            return syncAppSpec(params.appId, params.appTag)
                .then(function() {
                    var appRef = [model.getItem('app.id'), model.getItem('app.tag')].filter(toBoolean).join('/'),
                        url = '/#appcatalog/app/' + appRef;
                    utils.setCellMeta(cell, 'kbase.attributes.title', model.getItem('app.spec.info.name'));
                    utils.setCellMeta(cell, 'kbase.attributes.subtitle', model.getItem('app.spec.info.subtitle'));
                    utils.setCellMeta(cell, 'kbase.attributes.info.url', url);
                    utils.setCellMeta(cell, 'kbase.attributes.info.label', 'more...');
                    if (Narrative.canEdit()) {
                        return unloadParamsWidget()
                            .then(function() {
                                return loadInputParamsWidget();
                            });
                    } else {
                        return unloadParamsWidget()
                            .then(function() {
                                return loadViewParamsWidget();
                            });
                    }
                })
                .then(function() {
                    // this will not change, so we can just render it here.
                    showAboutApp();
                    showAppSpec();
                    PR.prettyPrint(null, container);
                    renderUI();
                })
                .then(function() {
                    // if we start out in 'new' state, then we need to promote to
                    // editing...
                    if (fsm.getCurrentState().state.mode === 'new') {
                        fsm.newState({ mode: 'editing', params: 'incomplete' });
                        evaluateAppState();
                    }
                    renderUI();
                })
                .catch(function(err) {
                    console.error('ERROR loading main widgets', err);
                    addNotification('Error loading main widgets: ' + err.message);
                    model.setItem('fatalError', {
                        title: 'Error loading main widgets',
                        message: err.message
                    });
                    syncFatalError();
                    fsm.newState({ mode: 'fatal-error' });
                    renderUI();
                });
        }

        // INIT
        model = Props.make({
            data: utils.getMeta(cell, 'viewCell'),
            onUpdate: function(props) {
                utils.setMeta(cell, 'viewCell', props.getRawObject());
            }
        });

        spec = Spec.make({
            appSpec: model.getItem('app.spec')
        });

        return {
            init: init,
            attach: attach,
            start: start,
            run: run
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
}, function(err) {
    'use strict';
    console.error('ERROR loading viewCell viewCellWidget', err);
});