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
    'common/jupyter',
    'common/busEventManager',
    'kb_service/client/narrativeMethodStore',
    'kb_service/client/workspace',
    'kb_service/utils',
    'kb_sdk_clients/genericClient',
    'common/pythonInterop',
    'common/utils',
    'common/ui',
    'common/fsm',
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
    Jupyter,
    BusEventManager,
    NarrativeMethodStore,
    Workspace,
    apiUtils,
    GenericClient,
    PythonInterop,
    utils,
    Ui,
    Fsm,
    PR
    ) {
    'use strict';
    var t = html.tag,
        div = t('div'), span = t('span'), a = t('a'), p = t('p'),
        table = t('table'), tr = t('tr'), th = t('th'), td = t('td'),
        pre = t('pre'), input = t('input'),
        places,
        appStates = [
            {
                state: {
                    mode: 'new'
                },
                ui: {
                    buttons: {
                        enabled: [],
                        disabled: ['save']
                    },
                    elements: {
                        show: [],
                        hide: ['fatal-error', 'parameters-group']
                    }
                },
                next: [
                    {
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
                        disabled: ['save']
                    },
                    elements: {
                        show: ['fatal-error'],
                        hide: ['parameters-group']
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
                        disabled: ['save']
                    },
                    elements: {
                        show: ['parameters-group'],
                        hide: ['fatal-error']
                    }
                },
                next: [
                    {
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
                        enabled: ['save'],
                        disabled: []
                    },
                    elements: {
                        show: ['parameters-group'],
                        hide: ['fatal-error']
                    }
                },
                next: [
                    {
                        mode: 'editing',
                        params: 'incomplete'
                    },
                    {
                        mode: 'editing',
                        params: 'complete',
                        code: 'built'
                    },
                    {
                        mode: 'saving'
                    },
                    {
                        mode: 'error'
                    }
                ]
            },
            {
                state: {
                    mode: 'saving'
                },
                ui: {
                    buttons: {
                        enabled: [],
                        disabled: ['save']
                    },
                    elements: {
                        show: ['parameters-group'],
                        hide: []
                    }
                },
                next: [
                    {
                        mode: 'saved'
                    }
                ]
            },
            {
                state: {
                    mode: 'saved'
                },
                ui: {
                    buttons: {
                        enabled: [],
                        disabled: ['save']
                    },
                    elements: {
                        show: ['parameters-group'],
                        hide: []
                    }
                },
                on: {
                    enter: {
                        messages: [
                            {
                                emit: 'on-success'
                            }
                        ]
                    }
                },
                next: [
                    {
                        mode: 'saved'
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
                        disabled: ['save']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group', 'output-group'],
                        hide: ['parameters-group']
                    }
                },
                next: [
                    {
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
            // TODO: the cell bus should be created and managed through main.js,
            // that is, the extension.
            cellBus,
            bus = runtime.bus().makeChannelBus(null, 'An editor cell widget'),
            env = {},
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
        function getLayout() {
        }
        function getRelations() {

        }
        function getParameters() {
            var type = model.getItem('params.type'),
                types;
            type = null;
            if (!type) {
                // alert('help, no type!');
                types = ['KBaseFile.SingleEndLibrary', 'KBaseFile.PairedEndLibrary'];
            } else {
                types = [type];
            }

            var parameters = [
//                {
//                    id: 'type',
//                    description: 'Type of the reads set',
//                    short_hint: 'The type of the set of sequence reads',
//                    default_values: [''],
//                    optional: 0,
//                    disabled: 0,
//                    advanced: 0,
//                    allow_multiple: 0,
//                    field_type: 'dropdown',
//                    dropdown_options: {
//                        options: [
//                            {
//                                value: 'KBaseFile.SingleEndLibrary',
//                                display: 'Single-End'
//                            },
//                            {
//                                value: 'KBaseFile.PairedEndLibrary',
//                                display: 'Paired-End'
//                            }
//                        ]
//                    },
//                    ui_class: 'parameter',
//                    ui_name: 'Type'
//                },
                {
                    id: 'name',
                    description: 'Name of the reads set',
                    short_hint: 'The name of the set of sequence reads',
                    default_values: [''],
                    optional: 0,
                    disabled: 0,
                    advanced: 0,
                    allow_multiple: 0,
                    field_type: 'text',
                    text_options: {
                        is_output_name: 1,
                        placeholder: 'Reads Set Name',
                        valid_ws_types: ['KBaseSets.ReadsSet']
                    },
                    ui_class: 'output',
                    ui_name: 'Reads Set Name'
                },
                {
                    id: 'description',
                    description: 'Description of the reads set',
                    short_hint: 'The description of the set of sequence reads',
                    default_values: [''],
                    optional: 1,
                    disabled: 0,
                    advanced: 0,
                    allow_multiple: 0,
                    field_type: 'textarea',
                    textarea_options: {
                        is_output_name: 0,
                        placeholder: 'Description',
                        regex_constraint: [],
                        validate_as: 'string',
                        n_rows: 5
                    },
                    ui_class: 'parameter',
                    ui_name: 'Description'
                },
                {
                    id: 'items',
                    field_type: 'text',
                    description: 'A set of reads objects',
                    short_hint: 'A set of reads objects',
                    default_values: [''],
                    optional: 1,
                    disabled: 0,
                    advanced: 0,
                    allow_multiple: 1,
                    text_options: {
                        is_output_name: 0,
                        placeholder: 'Items',
                        regex_constraint: [],
                        valid_ws_types: types
                    },
                    ui_class: 'input',
                    ui_name: 'Set of Reads Objects'
                }
            ];

            return parameters.map(function (parameterSpec) {
                // tee hee
                var param = ParameterSpec.make({parameterSpec: parameterSpec});
                return param;
            });
        }

        function getParameterMap() {
            var parameterMap = {};
            getParameters().forEach(function (param) {
                // tee hee
                parameterMap[param.id()] = param;
            });
            return  parameterMap;
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
                .then(function (data) {
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
            ui.setContent('fatal-error.title', model.getItem('fatalError.title'));
            ui.setContent('fatal-error.message', model.getItem('fatalError.message'));
        }

        function showFatalError(arg) {
            ui.showElement('fatal-error');
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
                content = div({class: 'kbase-extension kb-editor-cell', style: {display: 'flex', alignItems: 'stretch'}}, [
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
                                }),
                                ui.buildPanel({
                                    title: 'Select Object to Edit',
                                    name: 'edit-object-selector',
                                    hidden: false,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: div({dataElement: 'widget'})
                                }),
                                ui.buildPanel({
                                    title: 'Editor ' + span({class: 'fa fa-pencil'}),
                                    name: 'parameters-group',
                                    hidden: false,
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: div({dataElement: 'widget'})
                                }),
                                div({
                                    dataElement: 'availableActions'
                                }, [
                                    div({class: 'btn-toolbar kb-btn-toolbar-cell-widget'}, [
                                        div({class: 'btn-group'}, [
                                            ui.makeButton('Save', 'save', {events: events, type: 'primary'})
                                        ])
                                    ])
                                ]),
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
                errors = getParameters().map(function (parameterSpec) {
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
                    }
                default:
                    throw new Error('Invalid tag for app ' + app.id);
            }
        }

        function buildPython(cell, cellId, app, params) {
            var runId = new Uuid(4).format(),
                app = fixApp(app),
                code = PythonInterop.buildEditorRunner(cellId, runId, app, params);
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
            state.ui.buttons.enabled.forEach(function (button) {
                ui.enableButton(button);
            });
            state.ui.buttons.disabled.forEach(function (button) {
                ui.disableButton(button);
            });


            // Element state
            state.ui.elements.show.forEach(function (element) {
                ui.showElement(element);
            });
            state.ui.elements.hide.forEach(function (element) {
                ui.hideElement(element);
            });

        }

        var saveTimer = null;
        function saveNarrative() {
            if (saveTimer) {
                return;
            }
            saveTimer = window.setTimeout(function () {
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
            ui.showConfirmDialog({title: 'Confirm Cell Deletion', body: content})
                .then(function (confirmed) {
                    if (!confirmed) {
                        return;
                    }

                    bus.emit('stop');

                    Jupyter.deleteCell(cell);
                });
        }
        function doRun() {
            // ui.collapsePanel('parameters-group');
            // cell.execute();
            // Just save from the UI for now.
            doSaveReadsSet();
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

        function getOutputParams() {
            var outputParams = env.appSpec.parameters.map(function (parameter) {
                var textOptions = parameter.text_options;
                if (textOptions) {
                    if (textOptions.is_output_name === 1) {
                        return parameter.id;
                    }
                }
                return false;
            })
                .filter(function (paramId) {
                    return (paramId !== false);
                }),
                params = model.getItem('params'),
                outputNames = Object.keys(params).filter(function (key) {
                return outputParams.some(function (param) {
                    return (param === key);
                });
            })
                .map(function (key) {
                    return {
                        param: key,
                        objectName: params[key]
                    };
                });
            return outputNames;
        }

        /*
         * Given a set of object names within this workspace, get the object
         * info for each one, and return the absolute reference (wsid, objid, ref)
         */
        function getOutputObjectRefs(outputs) {
            var workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken()
            }),
                objectIdentities = outputs.map(function (output) {
                    return {
                        wsid: workspaceInfo.id,
                        name: output.objectName
                    };
                });
            return workspace.get_object_info_new({
                objects: objectIdentities,
                ignoreErrors: 1,
                includeMetadata: 0
            })
                .then(function (results) {
                    return results.map(function (result, index) {
                        if (result === null) {
                            console.warn('MISSING OBJECT', outputs[index]);
                            throw new Error('Output object ' + outputs[index].objectName + ' specified in param ' + outputs[index].param + ' was not found in this workspace');
                        }
                        return {
                            param: outputs[index].param,
                            name: outputs[index].objectName,
                            ref: [result[6], result[0], result[4]].join('/')
                        };
                    });
                });
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
                    toggleSettings(cell);
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
                bus.on('save', function () {
                    doRun();
                });
//                bus.on('remove', function () {
//                    doRemove();
//                });

                bus.on('on-success', function () {
                    doOnSuccess();
                });

                // Events from widgets...

                parentBus.on('newstate', function (message) {
                    console.log('GOT NEWSTATE', message);
                });

                parentBus.on('reset-to-defaults', function () {
                    bus.emit('reset-to-defaults');
                });

                cellBus = runtime.bus().makeChannelBus({
                    cell: Props.getDataItem(cell.metadata, 'kbase.attributes.id')
                }, 'A cell channel');

                eventManager.add(cellBus.on('delete-cell', function () {
                    doDeleteCell();
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

                if (state) {
                    switch (state.mode) {
                        case 'editing':
                        case 'launching':
                        case 'processing':
                            switch (state.stage) {
                                case 'launching':
                                    // nothing to do.
                                    break;
                                case 'queued':
                                case 'running':
                                    startListeningForJobMessages(model.getItem('exec.jobState.job_id'));
                                    break;
                            }
                            break;
                        case 'success':
                        case 'error':
                        // do nothing for now
                    }
                }


                showCodeInputArea();

                return null;
            });
        }

        function findInputWidget(requestedInputWidget) {
            var defaultModule = 'nbextensions/editorCell/widgets/readsSetUpdateEditor';
            return defaultModule;

            if (requestedInputWidget === null) {
                return defaultModule;
            }
            // Yes, the string literal 'null' can slip through
            if (requestedInputWidget === 'null') {
                return defaultModule;
            }

            return 'nbextensions/editorCell/widgets/inputWidgets/' + requestedInputWidget;
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
                paramSpecs = getParameters(),
                paramsToExport = {},
                parameterMap = getParameterMap();

            Object.keys(params).forEach(function (key) {
                var value = params[key],
                    paramSpec = parameterMap[key];

                // console.log('param spec', paramSpec);
//                if (paramSpec.spec.field_type === 'textsubdata') {
//                    if (value) {
//                        value = value.join(',');
//                    }
//                }

                paramsToExport[key] = value;
            });

            return paramsToExport;
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
                style: {border: '1px red solid'}
            }, [
                div({style: {color: 'red'}}, 'Error'),
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

            ui.setContent('parameters-group.widget', content);
        }

        function loadUpdateEditor() {
            return new Promise(function (resolve, reject) {
                ui.setContent('parameters-group.widget', html.loading());
                require(['nbextensions/editorCell/widgets/readsSetUpdateEditor'], function (Widget) {
                    // TODO: widget should make own bus.
                    var bus = runtime.bus().makeChannelBus(null, 'Parent comm bus for input widget'),
                        widget = Widget.make({
                            bus: bus,
                            workspaceInfo: workspaceInfo,
                            appId: env.appId,
                            appTag: env.appTag
                        });
                    widgets.editor = {
                        path: ['parameters-group', 'widget'],
                        // module: widgetModule,
                        type: 'update',
                        bus: bus,
                        instance: widget
                    };
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

                    bus.on('sync-params', function (message) {
                        message.parameters.forEach(function (paramId) {
                            bus.send({
                                parameter: paramId,
                                value: model.getItem(['params', message.parameter])
                            },
                                {
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
                        handle: function (message) {
                            return {
                                value: model.getItem(['params', message.parameterName])
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
                    bus.on('parameter-changed', function (message) {
                        // We simply store the new value for the parameter.
                        model.setItem(['params', message.parameter], message.newValue);
                        evaluateAppState();
                    });
                    return widget.start()
                        .then(function () {
                            resolve();
                            widget.bus.emit('run', {
                                node: ui.getElement(['parameters-group', 'widget']),
                                appSpec: env.appSpec,
                                parameters: getParameters()
                            });

                            return null;
                        })
                        .catch(function (err) {
                            console.error('ERROR starting editor widget', err);
                            reject(err);
                        });

                }, function (err) {
                    console.error('ERROR', err);
                    reject(err);
                });
            });
        }
        
        function unloadEditor() {
            return Promise.try(function () {
                if (widgets.editor) {
                    return widgets.editor.instance.stop()
                        .then(function (stopped) {
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
            return new Promise(function (resolve, reject) {
                ui.setContent('parameters-group.widget', html.loading());

                require(['nbextensions/editorCell/widgets/readsSetCreateEditor'], function (Widget) {
                    // TODO: widget should make own bus.
                    var bus = runtime.bus().makeChannelBus(null, 'Parent comm bus for input widget'),
                        widget = Widget.make({
                            bus: bus,
                            workspaceInfo: workspaceInfo
                        });
                    widgets.editor = {
                        path: ['parameters-group', 'widget'],
                        // module: widgetModule,
                        type: 'create',
                        bus: bus,
                        instance: widget
                    };
                    bus.emit('run', {
                        node: ui.getElement(['parameters-group', 'widget']),
                        appSpec: env.appSpec,
                        parameters: getParameters()
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

                    bus.on('sync-params', function (message) {
                        message.parameters.forEach(function (paramId) {
                            bus.send({
                                parameter: paramId,
                                value: model.getItem(['params', message.parameter])
                            },
                                {
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
                        handle: function (message) {
                            return {
                                value: model.getItem(['params', message.parameterName])
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
                    bus.on('parameter-changed', function (message) {
                        // We simply store the new value for the parameter.
                        model.setItem(['params', message.parameter], message.newValue);
                        evaluateAppState();
                    });
                    widget.start()
                        .then(function () {
                            resolve();
                            return null;
                        })
                        .catch(function (err) {
                            reject(err);
                        });

                }, function (err) {
                    console.log('ERROR', err);
                    reject(err);
                });
            });
        }

        /*
         * Given an object ref, fetch the set object via the setApi, 
         * then populate
         */
        function updateEditor(objectRef) {
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
                .spread(function (setObject) {
                    // Set the params.
                    model.setItem('params', {});
                    model.setItem('params.name', setObject.info[1]);
                    model.setItem('params.description', setObject.data.description);
                    model.setItem('params.items', setObject.data.items.map(function (item) {
                        item.objectInfo = apiUtils.objectInfoToObject(item.info);
                        return item.ref;
                    }));

                    // For now set the type based on the type of the first element.
                    // console.log(setObject.data.items[0]);
//                    var donorElementType = [
//                        setObject.data.items[0].objectInfo.typeModule,
//                        setObject.data.items[0].objectInfo.typeName
//                    ].join('.');                        
//                     model.setItem('params.type', donorElementType);

                    //console.log('spec', env.appSpec);
                    //console.log('parameters', env.parameters);
//                    console.log('set object', setObject);
//                    console.log('name', setObject.info[1]);
//                    console.log('desc', setObject.data.description);
//                    console.log('MODEL', model.getRawObject());
                    // bus.emit('reset-to-defaults');
                    return loadUpdateEditor();

                })
                .catch(function (err) {
                    console.error('ERROR getting reads set ', err);
                    console.error(err.detail.replace('\n', '<br>'));
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
            model.setItem('params.name', '');
            model.setItem('params.description', '');
            model.setItem('params.items', []);

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
                        items: [
                        ]
                    }
                };
            return setApiClient.callFunc('save_reads_set_v1', [params])
                .spread(function (result) {
                    console.log('CREATED!', result);
                
                    // remove whatever is in the editor panel
                    
                    // place the update editor there
                    
                    // updatethe update editor with the thing to edit.
                    
                    updateEditor(result.set_ref);
                })
                .catch(function (err) {
                    console.error('ERROR!', err);
                });

        }

        function doSaveReadsSet() {
            var setApiClient = new GenericClient({
                url: runtime.config('services.service_wizard.url'),
                token: runtime.authToken(),
                module: 'SetAPI',
                version: 'dev'
            }),
                params = {
                    workspace: String(workspaceInfo.id),
                    output_object_name: model.getItem('params.name'),
                    data: {
                        description: model.getItem('params.description'),
                        items: model.getItem('params.items').map(function (item) {
                            return {
                                ref: item
                            };
                        })
                    }
                };
            console.log('saving...', params);
            return setApiClient.callFunc('save_reads_set_v1', [params])
                .then(function (result) {
                    console.log('SAVED!', result);
                    alert('saved!');
                })
                .catch(function (err) {
                    console.error('ERROR!', err);
                });
        }
        
        function doLoadNewSetForm() {
            unloadEditor();
            resetEditorModel();
            loadCreationEditor();
        }

        function loadEditObjectSelector() {
            return new Promise(function (resolve, reject) {
                require([
                    'nbextensions/editorCell/widgets/editObjectSelector'
                ], function (Widget) {
                    var widget = Widget.make({
                        workspaceInfo: workspaceInfo,
                        objectType: 'KBaseSets.ReadsSet'
                    });
                    widgets.editObjectSelector = {
                        path: ['edit-object-selector', 'widget'],
                        instance: widget
                    };
                    widget.bus.on('ready', function () {
                        widget.bus.emit('run', {
                            node: ui.getElement(['edit-object-selector', 'widget']),
                            appSpec: env.appSpec
                                // parameters: getParameters()
                        });
                    });
                    widget.bus.on('changed', function (message) {
                        updateEditor(message.newObjectRef);
                    });
                    widget.bus.on('create-new-set', function (message) {
                        doCreateNewSet(message.name);
                    });
                    widget.bus.on('new-set-form', function () {
                        // TODO: ask user if they want to save the editor if it is dirty.
                        doLoadNewSetForm();
                        // swap out the update editor with the creation editor.
                    })
                    widget.start()
                        .then(function () {
                            resolve();
                            return null;
                        })
                        .catch(function (err) {
                            reject(err);
                        });
                }, function (err) {
                    console.log('ERROR', err);
                    reject(err);
                });
            });
        }

        function evaluateAppState() {
            var validationResult = validateModel();
            console.log('evaluated app state: ', validationResult);
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


        function run(params) {
            // First get the app specs, which is stashed in the model,
            // with the parameters returned.
            return syncAppSpec(params.appId, params.appTag)
                .then(function () {
                    var appRef = [model.getItem('app').id, model.getItem('app').tag].filter(toBoolean).join('/'),
                        url = '/#appcatalog/app/' + appRef;
                    utils.setCellMeta(cell, 'kbase.attributes.title', env.appSpec.info.name);
                    utils.setCellMeta(cell, 'kbase.attributes.subtitle', env.appSpec.info.subtitle);
                    utils.setCellMeta(cell, 'kbase.attributes.info.url', url);
                    utils.setCellMeta(cell, 'kbase.attributes.info.label', 'more...');
                    return Promise.all([
                        loadEditObjectSelector()
                            // loadInputWidget()
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
                        // evaluateAppState();
                    }
                    renderUI();
                })
                .catch(function (err) {
                    console.error('ERROR loading main widgets', err);
                    addNotification('Error loading main widgets: ' + err.message);
                    model.setItem('fatalError', {
                        title: 'Error loading main widgets',
                        message: err.message
                    });
                    syncFatalError();
                    fsm.newState({mode: 'fatal-error'});
                    renderUI();
                });
        }

        // INIT

        model = Props.make({
            data: utils.getMeta(cell, 'editorCell'),
            onUpdate: function (props) {
                // don't need to put params into the metadata for editor cells.
                // we use the metadata for editor state.
                // utils.setMeta(cell, 'editorCell', props.getRawObject());
                // console.log('model updated');
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
    console.log('ERROR loading editorCell editorCellWidget', err);
});
