/*global define*/
/*jslint white:true,browser:true*/

define([
    'jquery',
    'bluebird',
    'uuid',
    'common/parameterSpec',
    'common/runtime',
    'common/events',
    'common/html',
    'common/props',
    'kb_service/client/narrativeMethodStore',
    'common/pythonInterop',
    'common/utils',
    'common/ui',
    'common/jupyter',
    'google-code-prettify/prettify',
    'css!google-code-prettify/prettify.css',
    'css!font-awesome.css'
], function (
    $,
    Promise,
    Uuid,
    ParameterSpec,
    Runtime,
    Events,
    html,
    Props,
    NarrativeMethodStore,
    PythonInterop,
    utils,
    Ui,
    Jupyter,
    PR
    ) {
    'use strict';
    var t = html.tag,
        div = t('div'), span = t('span'), a = t('a'), p = t('p'), img = t('img'),
        table = t('table'), tr = t('tr'), th = t('th'), td = t('td'),
        pre = t('pre'), input = t('input');

    function factory(config) {
        var container, places, ui,
            workspaceInfo = config.workspaceInfo,
            runtime = Runtime.make(),
            cell = config.cell,
            //parentBus = config.bus,
            // TODO: the cell bus should be created and managed through main.js,
            // that is, the extension.
            cellBus,
            bus = runtime.bus().makeChannelBus(null, 'A widget cell widget'),
            env = {},
            model,
            // HMM. Sync with metadata, or just keep everything there?
            settings = {
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
        widgets = {},
            inputBusses = [],
            inputBusMap = {},
            fsm,
            saveMaxFrequency = config.saveMaxFrequency || 5000;

        if (runtime.config('features.advanced')) {
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
                .then(function (data) {
                    if (!data[0]) {
                        throw new Error('App not found');
                    }
                    // TODO: really the best way to store state?
                    env.appSpec = data[0];
                    // Get an input field widget per parameter
                    var parameterMap = {},
                        parameters = data[0].parameters.map(function (parameterSpec) {
                        // tee hee
                        var param = ParameterSpec.make({parameterSpec: parameterSpec});
                        parameterMap[param.id()] = param;
                        return param;
                    });
                    env.parameters = parameters;
                    env.parameterMap = parameterMap;
                    return parameters;
                });
        }

        // RENDER API
        function syncFatalError() {
            ui.setContent('fatal-error.title', model.getItem('fatalError.title'));
            ui.setContent('fatal-error.message', model.getItem('fatalError.message'));
        }

        function showFatalError(arg) {
            ui.showElement('fatal-error');
        }

        function renderAppSpec() {
            return pre({
                dataElement: 'spec',
                class: 'prettyprint lang-json',
                style: {fontSize: '80%'}
            });
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
            return html.makeTabs({
                tabs: [
                    {
                        label: 'Summary',
                        name: 'summary',
                        content: renderAppSummary()
                    },
                    ui.ifAdvanced(function () {
                        return {
                            label: 'Spec',
                            name: 'spec',
                            content: renderAppSpec()
                        };
                    })
                ]
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
                    settingsValue = model.getItem(['user-settings', key], setting.defaultValue);
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
                    span({style: {marginLeft: '4px', fontStyle: 'italic'}}, setting.label)
                ]);
            }).join('\n');
            ui.setContent('settings.content', content);
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
            var appSpec = env.appSpec;
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
            var appRef = [appSpec.info.namespace || 'l.m', appSpec.info.id].filter(toBoolean).join('/'),
                link = a({href: '/#appcatalog/app/' + appRef, target: '_blank'}, 'Catalog Page');
            ui.setContent('about-app.catalog-link', link);
        }

        function showAppSpec() {
            if (!env.appSpec) {
                return;
            }
            var specText = JSON.stringify(env.appSpec, false, 3),
                fixedText = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                content = pre({class: 'prettyprint lang-json', style: {fontSize: '80%'}}, fixedText);
            ui.setContent('about-app.spec', content);
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
                                ui.buildPanel({
                                    title: 'Error',
                                    name: 'fatal-error',
                                    hidden: true,
                                    type: 'danger',
                                    classes: ['kb-panel-container'],
                                    body: div([
                                        table({class: 'table table-striped'}, [
                                            tr([
                                                th('Title'), td({dataElement: 'title'}),
                                                td('Message', td({dataElement: 'message'}))
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
                                    hidden: false,
                                    collapsed: true,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: [
                                        div({dataElement: 'about-app'}, renderAboutApp())
                                    ]
                                }),
                                ui.buildCollapsiblePanel({
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

        // TODO: we need to determine the proper forms for a app identifier, and
        // who creates this canonical identifier. E.g. the method panel supplies
        // the app id to the cell, but it gets it from the kernel, which gets it
        // directly from the nms/catalog. If the catalog provides the version
        // for a beta or release tag ...
        function fixApp(app) {
            switch (app.tag) {
                case 'release':
                {
                    return {
                        id: app.id,
                        tag: app.tag,
                        version: app.version
                    };
                }
                case 'beta':
                case 'dev':
                    return {
                        id: app.id,
                        tag: app.tag
                    };
                default:
                    throw new Error('Invalid tag for app ' + app.id);
            }
        }

        function buildPython(cell, cellId, app, params) {
            var runId = new Uuid(4).format(),
                app = fixApp(app),
                code = PythonInterop.buildCustomWidgetRunner(cellId, runId, app, params);
            // TODO: do something with the runId
            cell.set_text(code);
        }

        function resetPython(cell) {
            cell.set_text('');
        }

        // LIFECYCYLE API

        function doEditNotebookMetadata() {
            Jupyter.editNotebookMetadata();
        }

        function doEditCellMetadata() {
            Jupyter.editCellMetadata(cell);
        }

        function initCodeInputArea() {
            model.setItem('user-settings.showCodeInputArea', false);
        }

        function showCodeInputArea() {
            var codeInputArea = cell.input.find('.input_area');
            if (model.getItem('user-settings.showCodeInputArea')) {
                codeInputArea.removeClass('hidden');
                // codeInputArea.css('display', cell.kbase.inputAreaDisplayStyle);
            } else {
                codeInputArea.addClass('hidden');
                // codeInputArea.css('display', 'none');
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

        function doDeleteCell() {
            var content = div([
                p([
                    'Deleting this cell will remove the widget from the Narrative, ',
                    'but will not delete the data object, which will still be avaiable ',
                    'in the data panel.'
                ]),
                p('Continue to delete this cell?')
            ]);
            ui.showConfirmDialog({title: 'Confirm Cell Deletion', body: content})
                .then(function (confirmed) {
                    if (!confirmed) {
                        return;
                    }

                    bus.emit('stop');

                    Jupyter.deleteCell(cell);
                });
        }
        
        function makeIcon() {
            // icon is in the spec ...
            var appSpec = env.appSpec,
                nmsBase = runtime.config('services.narrative_method_store_image.url'),
                iconUrl = Props.getDataItem(appSpec, 'info.icon.url');

            if (iconUrl) {
                return span({class: 'fa-stack fa-2x', style: {padding: '2px'}}, [
                    img({src: nmsBase + iconUrl, style: {maxWidth: '46px', maxHeight: '46px', margin: '2px'}})
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

        function renderUI() {
            renderNotifications();
            renderSettings();
        }

        // LIFECYCLE API

        function init() {
            return Promise.try(function () {
                initCodeInputArea();
                return null;
            });
        }

        function attach(node) {
            return Promise.try(function () {
                container = node;
                ui = Ui.make({
                    node: container,
                    bus: bus
                });
                var layout = renderLayout();
                container.innerHTML = layout.content;
                layout.events.attachEvents(container);
                places = {
                    status: container.querySelector('[data-element="status"]'),
                    notifications: container.querySelector('[data-element="notifications"]'),
                    widget: container.querySelector('[data-element="widget"]')
                };
                
                if (ui.isDeveloper()) {
                    settings.showDeveloper = {
                        label: 'Show Developer features',
                        defaultValue: false,
                        type: 'toggle',
                        element: 'developer-options'
                    };
                }
                
                return null;
            });
        }

        function start() {
            return Promise.try(function () {
                /*
                 * listeners for the local input cell message bus
                 */

                bus.on('toggle-code-view', function () {
                    var showing = toggleCodeInputArea(),
                        label = showing ? 'Hide Code' : 'Show Code';
                    ui.setButtonLabel('toggle-code-view', label);
                });
                bus.on('show-notifications', function () {
                    doShowNotifications();
                });
                bus.on('edit-cell-metadata', function () {
                    doEditCellMetadata();
                });
                bus.on('edit-notebook-metadata', function () {
                    doEditNotebookMetadata();
                });
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
                bus.on('toggle-settings', function () {
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
                bus.on('run-app', function () {
                    doRun();
                });
                bus.on('on-success', function () {
                    doOnSuccess();
                });

                bus.on('sync-all-display-parameters', function () {
                    widgets.paramsDisplayWidget.bus.emit('sync-all-parameters');
                });

                // Events from widgets...

                bus.on('newstate', function (message) {
                    console.log('GOT NEWSTATE', message);
                });

                bus.on('reset-to-defaults', function () {
                    bus.emit('reset-to-defaults');
                });

                // CELL MESSAGES

                var cellId = Props.getDataItem(cell.metadata, 'kbase.attributes.id');
                
                cellBus = runtime.bus().makeChannelBus({
                    cell: cellId
                }, 'A cell channel');
                
                runtime.bus().channel({cell: cellId}).

                cellBus.on('delete-cell', function () {
                    doDeleteCell();
                });
                
                cellBus.on('parameter-changed', function (message) {
                    Props.setDataItem(cell.metadata, ['kbase', 'widgetCell', 'params', message.id], message.value);
                    console.log('received...', message);
                });

                cellBus.on('sync-parameters', function (message) {
                    var value = Props.getDataItem(cell.metadata, ['kbase', 'widgetCell', 'params', message.id]);
                    cellBus.emit('parameter-value', {
                        id: message.id,
                        value: value
                    });
                });
                
                
                //cellBus.on('parameter-changed', function (message) {
                    // TODO: validate parameter
                    
                    // TODO: save parameter into model.
                //    console.log('received...', message);
                //});

                showCodeInputArea();

                return null;
            });
        }

        

        function run(params) {
            // First get the app specs, which is stashed in the model,
            // with the parameters returned.
            return syncAppSpec(params.appId, params.appTag)
                .then(function () {
                    utils.setCellMeta(cell, 'kbase.attributes.title', env.appSpec.info.name);
                    utils.setCellMeta(cell, 'kbase.attributes.subtitle', env.appSpec.info.subtitle);
                })
                .then(function () {
                    // this will not change, so we can just render it here.
                    renderUI();
                    showAboutApp();
                    showAppSpec();
                    PR.prettyPrint(null, container);
                    // renderIcon();
                })
                .catch(function (err) {
                    console.error('ERROR loading main widgets', err);
                    addNotification('Error loading main widgets: ' + err.message);
                    model.setItem('fatalError', {
                        title: 'Error loading main widgets',
                        message: err.message
                    });
                    syncFatalError();
                });
        }

        // INIT

        model = Props.make({
            data: utils.getMeta(cell, 'widgetCell'),
            onUpdate: function (props) {
                utils.setMeta(cell, 'widgetCell', props.getRawObject());
                // saveNarrative();
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
    console.log('ERROR loading viewCell viewCellWidget', err);
});
