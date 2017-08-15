/*global define*/
/*jslint white:true,browser:true*/

/*
 * Duplicate reads set editor widget, merely as an example of a second editor
 * to play with.
 */

define([
    'bluebird',
    'uuid',
    'common/runtime',
    'common/events',
    'common/html',
    'common/props',
    'common/jupyter',
    'common/busEventManager',
    'kb_service/client/narrativeMethodStore',
    'kb_service/utils',
    'kb_sdk_clients/genericClient',
    'common/pythonInterop',
    'common/utils',
    'common/ui',
    'common/fsm',
    'google-code-prettify/prettify',
    '../editorCell-fsm',

    'css!google-code-prettify/prettify.css',
    'css!font-awesome.css'
], function(
    Promise,
    Uuid,
    Runtime,
    Events,
    html,
    Props,
    Jupyter,
    BusEventManager,
    NarrativeMethodStore,
    serviceUtils,
    GenericClient,
    PythonInterop,
    utils,
    Ui,
    Fsm,
    PR,
    editorCellFsm
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
        places,
        appStates = editorCellFsm.fsm;

    function factory(config) {
        var container, ui,
            workspaceInfo = config.workspaceInfo,
            runtime = Runtime.make(),
            cell = config.cell,
            parentBus = config.bus,
            // TODO: the cell bus should be created and managed through main.js,
            // that is, the extension.
            cellBus,
            bus = runtime.bus().makeChannelBus({ description: 'An editor cell widget' }),
            env = {},
            editorState,
            model,
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
            widgets = {},
            fsm,
            saveMaxFrequency = config.saveMaxFrequency || 5000;

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
         * The app spec parameters, were we to use them, do not at present
         * accurately reflect what we need to present to the user, so we
         * invent some here.
         * They more or less match what we need for editing and to persiste
         * through the setApi
         */
        function getLayout() {}

        function getRelations() {

        }

        function getParameters() {
            return {
                name: {
                    id: 'name',

                    multipleItems: false,

                    ui: {
                        label: 'Reads Set Name',
                        description: 'Name of the reads set',
                        hint: 'The name of the set of sequence reads',
                        class: 'parameter',
                        control: null
                    },
                    data: {
                        type: 'string',
                        constraints: {
                            required: true,
                            rule: 'WorkspaceObjectName' // ws data_type
                        },
                        defaultValue: ''
                    }
                },
                description: {
                    id: 'description',
                    multipleItems: false,
                    ui: {
                        label: 'Description',
                        description: 'Description of the Reads Set',
                        hint: 'The description of the set of sequence reads',
                        class: 'parameter',
                        control: 'textarea',
                        rows: 5
                    },
                    data: {
                        type: 'string',
                        constraints: {
                            required: false,
                            multiLine: true
                        },
                        defaultValue: ''
                    }
                },
                items: {
                    id: 'items',
                    multipleItems: false,
                    ui: {
                        label: 'Items',
                        description: 'A set of Reads Objects',
                        hint: 'A set of Reads Objects',
                        class: 'parameter',
                        control: '',
                        layout: ['ref', 'label']
                    },
                    data: {
                        type: '[]struct',
                        constraints: {
                            required: true
                        },
                        defaultValue: null
                    },
                    parameters: {
                        ref: {
                            id: 'ref',

                            multipleItems: false,

                            ui: {
                                label: 'Reads Object',
                                description: 'This is param 1',
                                hint: 'Hint 1',
                                class: 'parameter'
                            },
                            data: {
                                type: 'workspaceObjectRef',
                                constraints: {
                                    required: true,
                                    types: ['KBaseFile.PairedEndLibrary', 'KBaseFile.SingleEndLibrary']
                                },
                                defaultValue: null
                            }
                        },
                        label: {
                            id: 'label',

                            multipleItems: false,

                            ui: {
                                label: 'Label',
                                description: 'This is param 2',
                                hint: 'Hint 2',
                                class: 'parameter'
                            },
                            data: {
                                type: 'string',
                                constraints: {
                                    required: true
                                },
                                defaultValue: null
                            }
                        }

                    }
                }
            };
        }

        function getLayout() {
            return ['name', 'description', 'items'];
        }

        /*
         * Fetch the app spec for a given app and store the spec in the model.
         * As well, process and store the parameters in the model as well.
         *
         * @param {type} appId
         * @param {type} appTag
         * @returns {unresolved}
         */
        function syncAppSpec(appId, appTag) {
            env.appId = appId;
            env.appTag = appTag;
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
                    // TODO: really the best way to store state?
                    env.appSpec = data[0];
                    // Get an input field widget per parameter


                    //                    var parameterMap = {},
                    //                        parameters = getParameters().map(function (parameterSpec) {
                    //                            // tee hee
                    //                            var param = ParameterSpec.make({parameterSpec: parameterSpec});
                    //                            parameterMap[param.id()] = param;
                    //                            return param;
                    //                        });
                    //                    env.parameters = parameters;
                    //                    env.parameterMap = parameterMap;
                    //                    
                    //                    
                    //                   
                    //                    return parameters;
                });
        }

        // RENDER API


        function syncFatalError() {
            ui.setContent('fatal-error.title', editorState.getItem('fatalError.title'));
            ui.setContent('fatal-error.message', editorState.getItem('fatalError.message'));
            ui.setContent('fatal-error.details', editorState.getItem('fatalError.details'));
            ui.setContent('fatal-error.advice', editorState.getItem('fatalError.advice'));
        }

        function showFatalError(arg) {
            ui.showElement('fatal-error');
        }

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

        function showDebug(status) {
            // NOOP for now
            // console.log('debug', status);
            // ui.setContent('editor-status.debug', status);
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

            value = editorState.getItem(['user-settings', settingName], setting.defaultValue);
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

            editorState.setItem(['user-settings', settingName], control.checked);

            renderSetting(settingName);
        }

        function renderSettings() {
            var events = Events.make({ node: container }),
                content = Object.keys(settings).map(function(key) {
                    var setting = settings[key],
                        settingsValue = editorState.getItem(['user-settings', key], setting.defaultValue);
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
            var appSpec = env.appSpec;
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
            if (!env.appSpec) {
                return;
            }
            var specText = JSON.stringify(env.appSpec, false, 3),
                fixedText = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                content = pre({ class: 'prettyprint lang-json', style: { fontSize: '80%' } }, fixedText);
            ui.setContent('about-app.spec', content);
        }

        function renderLayout() {
            var events = Events.make(),
                content = div({ class: 'kbase-extension kb-editor-cell', style: { display: 'flex', alignItems: 'stretch' } }, [
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
                                                th('Title'), td({ dataElement: 'title' })
                                            ]),
                                            tr([
                                                th('Message'), td({ dataElement: 'message' })
                                            ]),
                                            tr([
                                                th('Details'), td({ dataElement: 'details' })
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
                                    title: 'Select or Create an Object to Edit',
                                    name: 'edit-object-selector',
                                    hidden: false,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: div({ dataElement: 'widget' })
                                }),
                                ui.buildCollapsiblePanel({
                                    title: span(['Currently Editing ', span({ dataElement: 'name', style: { textDecoration: 'underline' } })]),
                                    name: 'currently-editing',
                                    hidden: false,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: div({ dataElement: 'widget' })
                                }),
                                ui.buildPanel({
                                    title: 'Editor ' + span({ class: 'fa fa-pencil' }),
                                    name: 'editor',
                                    hidden: false,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: div({ dataElement: 'widget' })
                                }),
                                div({
                                    dataElement: 'available-actions'
                                }, [
                                    div({ class: 'btn-toolbar kb-btn-toolbar-cell-widget' }, [
                                        div({ class: 'btn-group' }, [
                                            ui.makeButton('Save', 'save', { events: events, type: 'primary' })
                                        ])
                                    ])
                                ]),
                                // just a simple status area for now...
                                ui.buildCollapsiblePanel({
                                    title: 'Status',
                                    name: 'editor-status',
                                    hidden: false,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: div([
                                        div({
                                            dataElement: 'message',
                                            style: {
                                                width: '100%',
                                                padding: '4px',
                                                minHeight: '1em'
                                            }
                                        }),
                                        div({
                                            dataElement: 'flags',
                                            style: { borderTop: '1px silver solid' }
                                        }, [
                                            span('param flags: '),
                                            span({ style: { border: '0px silver solid' } }, [
                                                'touched:', span({
                                                    dataElement: 'touched',
                                                    style: {
                                                        display: 'inline-block',
                                                        border: '1px silver solid',
                                                        width: '10px',
                                                        height: '10px'
                                                    }
                                                })
                                            ]),
                                            span({ style: { border: '0px silver solid', marginLeft: '10px' } }, [
                                                'changed:', span({
                                                    dataElement: 'changed',
                                                    style: {
                                                        display: 'inline-block',
                                                        border: '1px silver solid',
                                                        width: '10px',
                                                        height: '10px'
                                                    }
                                                })
                                            ])
                                        ])
                                        // div(['debug: ', span({dataElement: 'debug'}, 'debug here')])
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

            // TODO: make this work

            return {
                isValid: true,
                errors: []
            };

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
                parameters = getParameters(),
                errors = Object.keys(parameters).map(function(id) {
                    var parameterSpec = parameters[id];
                    if (parameterSpec.required()) {
                        if (parameterSpec.isEmpty(params[id].value)) {
                            return {
                                diagnosis: 'required-missing',
                                errorMessage: 'The ' + parameterSpec.dataType() + ' "' + parameterSpec.id() + '" is required but was not provided'
                            };
                        }
                    }
                }).filter(function(error) {
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

        function setStatus(message) {
            ui.setContent('editor-status.message', message);
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

        /*
         * For now we are using this to transform the params as stored in the
         * model to those expected by the "save" method
         */
        function fixParams(params) {
            var obj = {
                output_object: params.name,
                description: params.description,
                reads_tuple: params.items.map(function(item) {
                    return {
                        input_reads_label: null,
                        input_reads_obj: item,
                        input_reads_metadata: null
                    };
                })
            };
            return obj;
        }

        function buildPython(cell, cellId, app, params) {
            var runId = new Uuid(4).format(),
                fixedApp = fixApp(app),
                code = PythonInterop.buildEditorRunner(cellId, runId, fixedApp, params);
            // TODO: do something with the runId 

            setStatus('Successfully built code');
            editorState.setItem('editorState.currentRunId', runId);
            cell.set_text(code);
        }

        function resetPython(cell) {
            cell.set_text('');
        }

        function initializeFSM() {
            var currentState = editorState.getItem('fsm.currentState');
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
                //xinitialState: {
                //    mode: 'editing', params: 'incomplete'
                //},
                onNewState: function(fsm) {
                    editorState.setItem('fsm.currentState', fsm.getCurrentState().state);
                    // save the narrative!

                },
                bus: bus
            });
            fsm.start(currentState);
        }

        // LIFECYCYLE API

        function doEditNotebookMetadata() {
            Jupyter.editNotebookMetadata();
        }

        function doEditCellMetadata() {
            Jupyter.editCellMetadata(cell);
        }

        function initCodeInputArea() {
            // var codeInputArea = cell.input[0];
            //if (!cell.kbase.inputAreaDisplayStyle) {
            //    cell.kbase.inputAreaDisplayStyle = codeInputArea.css('display');
            // }
            // try this hack to reset the initial state for the input subarea...
            //codeInputArea[0].setAttribute('data-toggle-initial-state', 'hidden');
            editorState.setItem('user-settings.showCodeInputArea', false);
        }

        function showCodeInputArea() {
            var codeInputArea = cell.input.find('.input_area').get(0);
            if (editorState.getItem('user-settings.showCodeInputArea')) {
                if (!codeInputArea.classList.contains('-show')) {
                    codeInputArea.classList.add('-show');
                }
            } else {
                if (codeInputArea.classList.contains('-show')) {
                    codeInputArea.classList.remove('-show');
                }
            }
        }

        function toggleCodeInputArea(cell) {
            if (editorState.getItem('user-settings.showCodeInputArea')) {
                editorState.setItem('user-settings.showCodeInputArea', false);
            } else {
                editorState.setItem('user-settings.showCodeInputArea', true);
            }
            showCodeInputArea();
            return editorState.getItem('user-settings.showCodeInputArea');
        }

        function toggleSettings(cell) {
            var name = 'showSettings',
                selector = 'settings',
                node = ui.getElement(selector),
                showing = editorState.getItem(['user-settings', name]);
            if (showing) {
                editorState.setItem(['user-settings', name], false);
            } else {
                editorState.setItem(['user-settings', name], true);
            }

            showing = editorState.getItem(['user-settings', name]);
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
            var notifications = editorState.getItem('notifications') || [];
            notifications.splice(index, 1);
            editorState.setItem('notifications', notifications);
            renderNotifications();
        }

        function renderNotifications() {
            var events = Events.make(),
                notifications = editorState.getItem('notifications') || [],
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
            var notifications = editorState.getItem('notifications') || [];
            notifications.push(notification);
            editorState.setItem('notifications', notifications);
            renderNotifications();
        }

        function clearNotifications() {
            editorState.setItem('notifications', []);
        }

        // WIDGETS

        function showWidget(name, widgetModule, path) {
            var bus = runtime.bus().makeChannelBus({ description: 'Bus for showWidget' }),
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
            showDebug(JSON.stringify(state.state));

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

            // Editor state flags
            ['touched', 'changed'].forEach(function(flag) {
                var flagged, params = model.getItem('params');
                if (params) {
                    Object.keys(params).forEach(function(key) {
                        var param = params[key];
                        if (param[flag]) {
                            flagged = true;
                        }
                    });
                    setStatusFlag(flag, flagged);
                }
            });


        }

        var saveTimer = null;

        function saveNarrative() {
            if (saveTimer) {
                return;
            }
            saveTimer = window.setTimeout(function() {
                saveTimer = null;
                Jupyter.saveNotebook();
            }, saveMaxFrequency);
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

                    Jupyter.deleteCell(cell);
                });
        }

        function isModelChanged() {
            var params = model.getItem('params');
            if (!params) {
                return false;
            }
            return ['touched', 'changed'].some(function(flag) {
                return Object.keys(params).some(function(key) {
                    return params[key];
                });
            });
        }

        function clearModelFlags() {
            var params = model.getItem('params');
            ['touched', 'changed'].forEach(function(flag) {
                Object.keys(params).forEach(function(key) {
                    var param = params[key];
                    param[flag] = false;
                });
            });
        }

        function doSave() {
            setStatus(html.loading('Saving...'));
            doSaveReadsSet()
                .then(function() {
                    // Clear the parameter flags
                    clearModelFlags();
                    renderUI();
                })
                .catch(function(err) {
                    console.error('ERROR!', err);
                });
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



                places = {
                    status: container.querySelector('[data-element="status"]'),
                    notifications: container.querySelector('[data-element="notifications"]'),
                    widget: container.querySelector('[data-element="widget"]')
                };
                return null;
            });
        }

        function start() {
            return Promise.try(function() {
                /*
                 * listeners for the local input cell message bus
                 */

                bus.on('toggle-code-view', function() {
                    var showing = toggleCodeInputArea(),
                        label = showing ? 'Hide Code' : 'Show Code';
                    ui.setButtonLabel('toggle-code-view', label);
                });
                bus.on('show-notifications', function() {
                    doShowNotifications();
                });
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
                bus.on('save', function() {
                    doSave();
                });
                //                bus.on('remove', function () {
                //                    doRemove();
                //                });

                bus.on('on-success', function() {
                    doOnSuccess();
                });

                // Events from widgets...

                parentBus.on('newstate', function(message) {
                    console.log('GOT NEWSTATE', message);
                });

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

                eventManager.add(cellBus.on('result', function(message) {
                    // Verify that the run id is the same.
                    if (message.address.run_id !== editorState.getItem('editorState.currentRunId')) {
                        setStatus('Error! result message is not from the generated code!');
                        return;
                    }
                    if (message.message.result) {
                        setStatus('Successfully saved the reads set');
                        editorState.setItem('editorState.touched', false);
                        editorState.setItem('editorState.changed', false);
                        fsm.newState({ mode: 'editing', params: 'complete', data: 'clean' });
                        renderUI();

                        // Now we need to reload the editor with thew new item.
                        // console.log('RESULT', message);
                        model.setItem('current.readsSetRef', message.message.result.set_ref);
                        model.setItem('current.readsSet.object', serviceUtils.objectInfoToObject(message.message.result.set_info));
                        updateEditor(message.message.result.set_ref);

                    } else if (message.message.error) {
                        // cheap as heck error message
                        var errorMessage = div({ class: 'alert alert-danger' }, [
                            'Error saving reads set: ',
                            message.message.error.message
                        ]);
                        setStatus(errorMessage);
                    } else {
                        setStatus('what?');
                    }
                }));

                showCodeInputArea();

                return null;
            });
        }

        /*
         * Convert the model into a set of params suitable for the editor
         * app.
         */
        function modelToParams() {
            return [{
                workspace: workspaceInfo.id,
                output_object_name: model.getItem('params.name.value'),
                data: {
                    description: model.getItem('params.description.value'),
                    items: model.getItem('params.items.value', []).map(function(item) {
                        return {
                            label: item.label,
                            ref: item.ref
                        };
                    })
                }
            }];
        }

        // TODO: this should be a the error area -- and we should switch the 
        // editor into error mode.
        function loadErrorWidget(error) {
            console.error('ERROR', error);
            console.error(error.detail.replace('\n', '<br>'));
            var detail;
            if (error.detail) {
                detail = error.detail.replace('\n', '<br>');
            } else {
                detail = '';
            }

            var content = div({
                style: { border: '1px red solid' }
            }, [
                div({ style: { color: 'red' } }, 'Error'),
                table({
                    class: 'table table-bordered'
                }, [
                    tr([
                        th('Type'), td(error.name || 'Unknown')
                    ]),
                    tr([
                        th('Message'), td(error.message || '')
                    ]),
                    tr([
                        th('Details'), td(error.detail.replace('\n', '<br>'))
                    ])
                ])
            ]);

            ui.setContent('editor.widget', content);
        }

        function setStatusFlag(flag, value) {
            var flagNode = ui.getElement('editor-status.flags.' + flag);
            if (flagNode) {
                if (value) {
                    flagNode.style.backgroundColor = 'green';
                } else {
                    flagNode.style.backgroundColor = 'white';
                }
            }
        }

        function loadUpdateEditor() {
            return new Promise(function(resolve, reject) {
                ui.setContent('editor.widget', html.loading());
                require(['nbextensions/editorCell/widgets/readsSetUpdateEditor'], function(Widget) {
                    // TODO: widget should make own bus.
                    var bus = runtime.bus().makeChannelBus({ description: 'Parent comm bus for input widget' }),
                        widget = Widget.make({
                            bus: bus,
                            workspaceInfo: workspaceInfo,
                            appId: env.appId,
                            appTag: env.appTag
                        });
                    widgets.editor = {
                        path: ['editor', 'widget'],
                        // module: widgetModule,
                        type: 'update',
                        bus: bus,
                        instance: widget
                    };
                    bus.on('parameter-sync', function(message) {
                        var value = model.getItem(['params', message.parameter, 'value']);
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
                                value: model.getItem(['params', message.parameter, 'value'])
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
                                value: model.getItem(['params', message.parameterName, 'value'])
                            };
                        }
                    });

                    bus.on('parameter-changed', function(message) {
                        // We simply store the new value for the parameter.
                        console.log('parameter-changed', message);
                        model.setItem(['params', message.parameter, 'value'], message.newValue);
                        model.setItem(['params', message.parameter, 'changed'], true);
                        model.setItem(['params', message.parameter, 'touched'], false);
                        // hack this in for now...
                        var state = fsm.getCurrentState(),
                            newState = JSON.parse(JSON.stringify(state.state));
                        newState.data = 'changed';
                        fsm.newState(newState);

                        evaluateAppState();
                    });

                    bus.on('parameter-touched', function(message) {
                        model.setItem(['params', message.parameter, 'touched'], true);
                        var state = fsm.getCurrentState(),
                            newState = JSON.parse(JSON.stringify(state.state));
                        newState.data = 'touched';
                        fsm.newState(newState);
                        evaluateAppState();
                    });

                    return widget.start()
                        .then(function() {
                            resolve();
                            widget.bus.emit('run', {
                                node: ui.getElement(['editor', 'widget']),
                                appSpec: env.appSpec,
                                parameters: getParameters(),
                                layout: getLayout() // LEFT OFF HERE - need layout + parameters in the update widget...
                            });

                            return null;
                        })
                        .catch(function(err) {
                            console.error('ERROR starting editor widget', err);
                            reject(err);
                        });

                }, function(err) {
                    console.error('ERROR', err);
                    reject(err);
                });
            });
        }

        function unloadEditor() {
            return Promise.try(function() {
                if (widgets.editor) {
                    return widgets.editor.instance.stop()
                        .then(function(stopped) {
                            if (stopped) {
                                widgets.editor = null;
                            }
                            return stopped;
                        });
                }
                return true;
            });
        }

        function loadCreationEditor() {
            return new Promise(function(resolve, reject) {
                ui.setContent('editor.widget', html.loading());

                require(['nbextensions/editorCell/widgets/readsSetCreateEditor'], function(Widget) {
                    // TODO: widget should make own bus.
                    var bus = runtime.bus().makeChannelBus({ description: 'Parent comm bus for input widget' }),
                        widget = Widget.make({
                            bus: bus,
                            workspaceInfo: workspaceInfo
                        });
                    widgets.editor = {
                        path: ['editor', 'widget'],
                        // module: widgetModule,
                        type: 'create',
                        bus: bus,
                        instance: widget
                    };
                    bus.emit('run', {
                        node: ui.getElement(['editor', 'widget']),
                        appSpec: env.appSpec,
                        parameters: getParameters()
                    });
                    bus.on('parameter-sync', function(message) {
                        var value = model.getItem(['params', message.parameter, 'value']);
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
                                value: model.getItem(['params', paramId, 'value'])
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
                                value: model.getItem(['params', message.parameterName, 'value'])
                            };
                        }
                    });

                    //                    bus.on('get-parameter-value', function (message) {
                    //                        var value = model.getItem(['params', message.parameter]);
                    //                        bus.send({
                    //                            parameter: message.parameter,
                    //                            value: value
                    //                        }, {
                    //                            key: {
                    //                                type: 'parameter-value',
                    //                                parameter: message.parameter
                    //                            }
                    //                        });
                    //                    });
                    bus.on('parameter-changed', function(message) {
                        // We simply store the new value for the parameter.
                        model.setItem(['params', message.parameter, 'value'], message.newValue);
                        evaluateAppState();
                    });
                    widget.start()
                        .then(function() {
                            resolve();
                            return null;
                        })
                        .catch(function(err) {
                            reject(err);
                        });

                }, function(err) {
                    console.log('ERROR', err);
                    reject(err);
                });
            });
        }


        function renderCurrentlyEditing(info) {

            // console.log('INFO', info);

            var content = table({ class: 'table table-striped' }, [
                tr([th('Name'), td({ style: { fontWeight: 'bold' } }, info.name)]),
                tr([th('Ref'), td(info.ref)]),
                tr([th('Last saved'), td(info.saveDate.toLocaleDateString() + ' at ' + info.saveDate.toLocaleTimeString())]),
                tr([th('By'), td(info.saved_by)])
            ]);

            ui.setContent('currently-editing.widget', content);

            ui.setContent('currently-editing.name', info.name);
        }


        /*
         * Given an object ref, fetch the set object via the setApi, 
         * then populate
         */
        function updateEditor(objectRef) {

            // TODO: check if the editor has unsaved changed, and 
            // show an error message if so, and refuse to switch.

            var setApiClient = new GenericClient({
                    url: runtime.config('services.service_wizard.url'),
                    token: runtime.authToken(),
                    module: 'SetAPI',
                    version: 'dev'
                }),
                params = {
                    ref: objectRef,
                    include_item_info: 1
                };

            return setApiClient.callFunc('get_reads_set_v1', [params])
                .spread(function(setObject) {
                    // After getting the reads set object, we populate our 
                    // view model (data model-ish) with the results.
                    // The editor will sync up with the model, and pick up the
                    // values.                    
                    model.setItem('params', {});

                    // TODO: move this into code or config specific to 
                    // the reads set editor.
                    model.setItem('params.name.value', setObject.info[1]);
                    model.setItem('params.description.value', setObject.data.description);
                    model.setItem('params.items.value', setObject.data.items.map(function(item) {
                        return {
                            ref: item.ref,
                            label: item.label
                        };
                    }));

                    var info = serviceUtils.objectInfoToObject(setObject.info);

                    model.setItem('currentReadsSet', info);

                    renderCurrentlyEditing(info);

                    return loadUpdateEditor();
                })
                .then(function() {
                    evaluateAppState(true);
                })
                .catch(function(err) {
                    console.error('ERROR getting reads set ', err);
                    console.error(err.detail ? err.detail.replace('\n', '<br>') : '');
                    loadErrorWidget(err);
                });

        }

        /*
         * Reset the editor to default values for the parameters.
         * TODO: this really should be done through the spec, but we
         * are rapidly cutting corners here...
         */
        function resetEditorModel(objectRef) {
            model.setItem('params', {});
            model.setItem('params.name.value', '');
            model.setItem('params.description.value', '');
            model.setItem('params.items.value', []);

            //loadUpdateEditor();

        }

        function doCreateNewSet(name) {
            var setApiClient = new GenericClient({
                    url: runtime.config('services.service_wizard.url'),
                    token: runtime.authToken(),
                    module: 'SetAPI',
                    version: 'dev'
                }),
                //                donorReadsRef = (function (type) {
                //                    switch (type) {
                //                        case 'KBaseFile.SingleEndLibrary':
                //                            return '11733/31/1';
                //                        case 'KBaseFile.PairedEndLibrary':
                //                            return '11733/16/4';
                //                    }
                //                }(type)),
                params = {
                    workspace: String(workspaceInfo.id),
                    output_object_name: name,
                    data: {
                        description: '',
                        // set api has bug -- will throw exception if fetch a 
                        // set with no items.
                        // stuff a sample item in here to start with.
                        items: []
                    }
                };
            return setApiClient.callFunc('save_reads_set_v1', [params])
                .spread(function(result) {

                    // remove whatever is in the editor panel

                    // place the update editor there

                    // updatethe update editor with the thing to edit.

                    updateEditor(result.set_ref);
                })
                .catch(function(err) {
                    console.error('ERROR!', err);
                });

        }

        function doSaveReadsSet() {
            return Promise.try(function() {
                cell.execute();
            });
        }

        function doLoadNewSetForm() {
            unloadEditor();
            resetEditorModel();
            loadCreationEditor();
        }

        function doEditObject(objectInfo) {
            // Update editor state (is also persistent in the metadata)
            editorState.setItem('current.set.ref', objectInfo.ref);
            editorState.setItem('current.set.info', objectInfo);

            updateEditor(objectInfo.ref);
        }

        function loadEditObjectSelector() {
            return new Promise(function(resolve, reject) {
                require([
                    'nbextensions/editorCell/widgets/editObjectSelector'
                ], function(Widget) {
                    var widget = Widget.make({
                        workspaceInfo: workspaceInfo,
                        objectType: 'KBaseSets.ReadsSet'
                    });
                    widgets.editObjectSelector = {
                        path: ['edit-object-selector', 'widget'],
                        instance: widget
                    };
                    widget.bus.on('ready', function() {
                        widget.bus.emit('run', {
                            node: ui.getElement(['edit-object-selector', 'widget']),
                            appSpec: env.appSpec,
                            selectedSet: editorState.getItem('current.set.ref')
                                // parameters: getParameters()
                        });
                    });
                    // When the user selects a reads set to edit.
                    widget.bus.on('changed', function(message) {
                        // Call this when we have a new object to edit. It will 
                        // take care of updating the cell state as well as
                        // rendering the object.
                        console.log('changed', message);
                        doEditObject(message.value);
                    });
                    widget.bus.on('create-new-set', function(message) {
                        doCreateNewSet(message.name);
                    });
                    widget.bus.on('new-set-form', function() {
                        // TODO: ask user if they want to save the editor if it is dirty.
                        doLoadNewSetForm();
                        // swap out the update editor with the creation editor.
                    });
                    widget.bus.on('fatal-error', function(message) {
                        setFatalError({
                            title: 'Fatal error from ' + message.location,
                            message: message.error.message,
                            details: message.error.details || 'You may need to consult the browser log for additional information',
                            advice: message.error.advice
                        });
                        renderUI();
                    });
                    widget.start()
                        .then(function() {
                            resolve();
                            return null;
                        })
                        .catch(function(err) {
                            reject(err);
                        });
                }, function(err) {
                    console.error('ERROR', err);
                    reject(err);
                });
            });
        }

        function evaluateAppState(force) {
            if (force || isModelChanged()) {
                var validationResult = validateModel();
                if (validationResult.isValid) {
                    buildPython(cell, utils.getCellMeta(cell, 'kbase.attributes.id'), editorState.getItem('app'), modelToParams());
                    fsm.newState({ mode: 'editing', params: 'complete', data: 'changed' });
                } else {
                    resetPython(cell);
                    fsm.newState({ mode: 'editing', params: 'incomplete', data: 'changed' });
                }
            }
            renderUI();
        }

        function setFatalError(arg) {
            editorState.setItem('fatalError', {
                title: arg.title,
                message: arg.message,
                details: arg.details,
                advice: arg.advice
            });
            syncFatalError();
            fsm.newState({ mode: 'fatal-error' });
        }

        function run(params) {
            // First get the app specs, which is stashed in the model,
            // with the parameters returned.
            return syncAppSpec(params.appId, params.appTag)
                .then(function() {
                    var appRef = [editorState.getItem('app').id, editorState.getItem('app').tag].filter(toBoolean).join('/'),
                        url = '/#appcatalog/app/' + appRef;
                    utils.setCellMeta(cell, 'kbase.attributes.title', env.appSpec.info.name);
                    utils.setCellMeta(cell, 'kbase.attributes.subtitle', env.appSpec.info.subtitle);
                    utils.setCellMeta(cell, 'kbase.attributes.info.url', url);
                    utils.setCellMeta(cell, 'kbase.attributes.info.label', 'more...');
                    return Promise.all([
                        loadEditObjectSelector(),
                        (function() {
                            if (editorState.getItem('current.set.info')) {
                                return doEditObject(editorState.getItem('current.set.info'));
                            }
                        }())
                    ]);
                })
                .then(function() {
                    // this will not change, so we can just render it here.
                    showAboutApp();
                    showAppSpec();
                    PR.prettyPrint(null, container);
                })
                .then(function() {
                    // if we start out in 'new' state, then we need to promote to
                    // editing...
                    if (fsm.getCurrentState().state.mode === 'new') {
                        // fsm.newState({mode: 'editing', params: 'incomplete'});
                        evaluateAppState();
                    }
                    renderUI();
                })
                .catch(function(err) {
                    console.error('ERROR loading main widgets', err);
                    addNotification('Error loading main widgets: ' + err.message);
                    setFatalError({
                        title: 'Error loading main widgets',
                        message: err.message,
                        details: err.details,
                        advice: err.advice
                    });
                    renderUI();
                });
        }

        // INIT

        model = Props.make({
            data: {},
            onUpdate: function(props) {
                renderUI();
            }
        });

        // console.log('EDITOR STATE', utils.getCellMeta(cell, 'kbase.editorCell'));
        editorState = Props.make({
            data: utils.getCellMeta(cell, 'kbase.editorCell'),
            onUpdate: function(props) {
                console.log('setting editor cell metadata to editorState', props.getRawObject());
                utils.setCellMeta(cell, 'kbase.editorCell', props.getRawObject());
                renderUI();
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
        make: function(config) {
            return factory(config);
        }
    };
}, function(err) {
    console.error('ERROR loading editorCell editorCellWidget', err);
});