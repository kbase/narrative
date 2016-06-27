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
    'kb_common/html',
    'common/props',
    'kb_service/client/narrativeMethodStore',
    'kb_service/client/workspace',
    'common/pythonInterop',
    'common/utils',
    'common/dom',
    'common/fsm',
    'google-code-prettify/prettify',
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
    html,
    Props,
    NarrativeMethodStore,
    Workspace,
    PythonInterop,
    utils,
    Dom,
    Fsm,
    PR
    ) {
    'use strict';
    var t = html.tag,
        div = t('div'), span = t('span'), a = t('a'),
        table = t('table'), tr = t('tr'), th = t('th'), td = t('td'),
        pre = t('pre'), input = t('input'),
        appStates = [
            {
                state: {
                    mode: 'editing',
                    params: 'incomplete'
                },
                ui: {
                    buttons: {
                        enabled: ['remove'],
                        disabled: ['run-app', 'cancel', 're-run-app']
                    },
                    elements: {
                        show: ['parameters-group', 'output-group'],
                        hide: ['parameters-display-group', 'exec-group']
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
                        enabled: ['run-app', 'remove'],
                        disabled: ['cancel', 're-run-app']
                    },
                    elements: {
                        show: ['parameters-group', 'output-group'],
                        hide: ['parameters-display-group', 'exec-group']
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
                    mode: 'processing',
                    stage: 'launching'
                },
                ui: {
                    buttons: {
                        enabled: ['cancel', 'remove'],
                        disabled: ['run-app', 're-run-app']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group'],
                        hide: ['parameters-group', 'output-group']
                    },
                    messages: [
                        {
                            widget: 'paramsDisplayWidget',
                            message: {},
                            address: {
                                key: {
                                    type: 'sync-all-parameters'
                                }
                            }
                        }
                    ]
                },
                on: {
                    enter: {
                        messages: [
                            {
                                emit: 'sync-all-display-parameters'
                            }
                        ]
                    },
                    resume: {
                        messages: [
                            {
                                emit: 'sync-all-display-parameters'
                            }
                        ]
                    }
                },
                next: [
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
                        mode: 'editing',
                        params: 'complete',
                        code: 'built'
                    }
                ]
            },
            {
                state: {
                    mode: 'processing',
                    stage: 'queued'
                },
                ui: {
                    buttons: {
                        enabled: ['cancel', 'remove'],
                        disabled: ['run-app', 're-run-app']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group'],
                        hide: ['parameters-group', 'output-group']
                    }
                },
                next: [
                    {
                        mode: 'processing',
                        stage: 'running'
                    },
                    {
                        mode: 'processing',
                        stage: 'queued'
                    },
                    {
                        mode: 'success'
                    },
                    {
                        mode: 'error',
                        stage: 'queued'
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
                    mode: 'processing',
                    stage: 'running'
                },
                ui: {
                    buttons: {
                        enabled: ['cancel', 'remove'],
                        disabled: ['run-app', 're-run-app']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group'],
                        hide: ['parameters-group', 'output-group']
                    }
                },
                next: [
                    {
                        mode: 'processing',
                        stage: 'running'
                    },
                    {
                        mode: 'success'
                    },
                    {
                        mode: 'error',
                        stage: 'running'
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
                    mode: 'success'
                },
                ui: {
                    buttons: {
                        enabled: ['re-run-app', 'remove'],
                        disabled: ['run-app', 'cancel']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group', 'output-group'],
                        hide: ['parameters-group']
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
                    mode: 'error',
                    stage: 'launching'
                },
                ui: {
                    buttons: {
                        enabled: ['re-run-app', 'remove'],
                        disabled: ['run-app', 'cancel']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group', 'output-group'],
                        hide: ['parameters-group']
                    }
                },
                next: [
                    {
                        mode: 'error',
                        stage: 'launching'
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
                    mode: 'error',
                    stage: 'queued'
                },
                ui: {
                    buttons: {
                        enabled: ['re-run-app', 'remove'],
                        disabled: ['run-app', 'cancel']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group', 'output-group'],
                        hide: ['parameters-group']
                    }
                },
                next: [
                    {
                        mode: 'error',
                        stage: 'queued'
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
                    mode: 'error',
                    stage: 'running'
                },
                ui: {
                    buttons: {
                        enabled: ['re-run-app', 'remove'],
                        disabled: ['run-app', 'cancel']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group', 'output-group'],
                        hide: ['parameters-group']
                    }
                },
                next: [
                    {
                        mode: 'error',
                        stage: 'running'
                    },
                    {
                        mode: 'editing',
                        params: 'complete',
                        code: 'built'
                    }
                ]
            },
            // Just a plain error state ... not sure how we get here...
            {
                state: {
                    mode: 'error'
                },
                ui: {
                    buttons: {
                        enabled: ['re-run-app', 'remove'],
                        disabled: ['run-app', 'cancel']
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
        var container, places, dom,
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
            env = {},
            model,
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
                    defaultValue: true,
                    type: 'toggle',
                    element: 'about-app'
                },
                showDeveloper: {
                    label: 'Show developer features',
                    defaultValue: false,
                    type: 'toggle',
                    element: 'developer-options'
                }
            },
        widgets = {},
            inputBusses = [],
            inputBusMap = {},
            fsm,
            saveMaxFrequency = config.saveMaxFrequency || 5000;

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

        function buildStatusBar() {
            return div({style: {lineHeight: '20px'}}, [
                span({
                }, [
                    span('Edit:'),
                    span({
                        style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                        dataElement: 'edit'
                    })
                ]),
                span({
                }, [
                    span('Params:'),
                    span({
                        style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                        dataElement: 'params'
                    })
                ]),
                span({
                }, [
                    span('Code:'),
                    span({
                        style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                        dataElement: 'code'
                    })
                ]),
                span({
                }, [
                    span('Request:'),
                    span({
                        style: {border: '1px silver solid', padding: '4px', display: 'inline-block', minWidth: '20px', backgroundColor: 'gray', color: '#FFF'},
                        dataElement: 'request'
                    })
                ]),
                span({
                }, [
                    span('Result:'),
                    span({
                        style: {
                            border: '1px silver solid',
                            padding: '4px',
                            display: 'inline-block',
                            minWidth: '20px',
                            backgroundColor: 'gray', color: '#FFF'
                        },
                        dataElement: 'result'
                    })
                ])
            ]);
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

            dom.setContent('fsm-display.content', content);
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
                tr([
                    th('Module'),
                    td({dataElement: 'module'})
                ]),
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
                tr([
                    th('Git commit hash'),
                    td({dataElement: 'git-commit-hash'})
                ]),
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
                    {
                        label: 'Spec',
                        name: 'spec',
                        content: renderAppSpec()
                    }
                ]
            });
        }

//        function toggleElement(name) {
//            var node = dom.getElement(name);
//            if (!node) {
//                return;
//            }
//            if (node.style.display === 'none') {
//                node.style.display = 'block';
//            } else {
//                node.style.display = 'none';
//            }
//        }

        function showElement(name) {
            var node = dom.getElement(name);
            if (!node) {
                return;
            }
            // node.style.display = null;
            node.classList.remove('hidden');
        }
        function hideElement(name) {
            var node = dom.getElement(name);
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
            dom.setContent('settings.content', content);
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
            dom.setContent('about-app.name', appSpec.info.name);
            dom.setContent('about-app.module', appSpec.info.namespace || dom.na());
            dom.setContent('about-app.id', appSpec.info.id);
            dom.setContent('about-app.summary', appSpec.info.subtitle);
            dom.setContent('about-app.version', appSpec.info.ver);
            dom.setContent('about-app.git-commit-hash', appSpec.info.git_commit_hash || dom.na());
            dom.setContent('about-app.authors', (function () {
                if (appSpec.info.authors && appSpec.info.authors.length > 0) {
                    return appSpec.info.authors.join('<br>');
                }
                return dom.na();
            }()));
            var appRef = [appSpec.info.namespace || 'l.m', appSpec.info.id].filter(toBoolean).join('/'),
                link = a({href: '/#appcatalog/app/' + appRef, target: '_blank'}, 'Catalog Page');
            dom.setContent('about-app.catalog-link', link);
        }

        function showAppSpec() {
            if (!env.appSpec) {
                return;
            }
            var specText = JSON.stringify(env.appSpec, false, 3),
                fixedText = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                content = pre({class: 'prettyprint lang-json', style: {fontSize: '80%'}}, fixedText);
            dom.setContent('about-app.spec', content);
        }

        function renderLayout() {
            var events = Events.make(),
                content = div({class: 'kbase-extension kb-app-cell', style: {display: 'flex', alignItems: 'stretch'}}, [
                    div({class: 'prompt', dataElement: 'prompt', style: {display: 'flex', alignItems: 'stretch', width: '14ex', flexDirection: 'column'}}, [
                        div({dataElement: 'status'})
                    ]),
                    div({
                        class: 'body',
                        dataElement: 'body',
                        style: {display: 'flex', alignItems: 'stretch', flexDirection: 'column', flex: '1'}
                    }, [
                        div({dataElement: 'widget', style: {display: 'block', width: '100%'}}, [
                            div({class: 'container-fluid'}, [
                                dom.buildPanel({
                                    title: null,
                                    name: 'availableActions',
                                    hidden: false,
                                    type: 'default',
                                    body: [
                                        div({class: 'btn-toolbar'}, [
                                            div({class: 'btn-group'}, [
                                                dom.makeButton('Run', 'run-app', {events: events, type: 'primary'})
                                            ]),
                                            div({class: 'btn-group'}, [
                                                dom.makeButton('Cancel', 'cancel', {events: events, type: 'danger'})
                                            ]),
                                            div({class: 'btn-group'}, [
                                                dom.makeButton('Run Again', 're-run-app', {events: events, type: 'primary'})
                                            ]),
                                            div({class: 'btn-group'}, [
                                                dom.makeButton('Remove', 'remove', {events: events, type: 'danger'})
                                            ]),
                                            div({class: 'btn-group'}, [
                                                dom.makeButton(span({class: 'fa fa-cog '}), 'toggle-settings', {events: events})
                                            ])
                                        ])
                                    ]
                                }),
                                dom.buildPanel({
                                    title: 'App Cell Settings',
                                    name: 'settings',
                                    hidden: true,
                                    type: 'default',
                                    body: div({dataElement: 'content'})
                                }),
                                dom.buildCollapsiblePanel({
                                    title: 'Notifications',
                                    name: 'notifications',
                                    hidden: true,
                                    type: 'default',
                                    body: [
                                        div({dataElement: 'content'})
                                    ]
                                }),
                                dom.buildCollapsiblePanel({
                                    title: 'About',
                                    name: 'about-app',
                                    hidden: false,
                                    type: 'default',
                                    body: [
                                        div({dataElement: 'about-app'}, renderAboutApp())
                                    ]
                                }),
                                dom.buildCollapsiblePanel({
                                    title: 'Dev',
                                    name: 'developer-options',
                                    hidden: true,
                                    type: 'default',
                                    body: [
                                        div({dataElement: 'fsm-display', style: {marginBottom: '4px'}}, [
                                            span({style: {marginRight: '4px'}}, 'FSM'),
                                            span({dataElement: 'content'})
                                        ]),
                                        div([
                                            dom.makeButton('Show Code', 'toggle-code-view', {events: events}),
                                            dom.makeButton('Edit Metadata', 'edit-cell-metadata', {events: events}),
                                            dom.makeButton('Edit Notebook Metadata', 'edit-notebook-metadata', {events: events})
                                        ])
                                    ]
                                }),
                                dom.buildPanel({
                                    title: 'Input ' + span({class: 'fa fa-arrow-left'}),
                                    name: 'parameters-group',
                                    hidden: false,
                                    type: 'default',
                                    body: div({dataElement: 'widget'})
                                }),
                                dom.buildCollapsiblePanel({
                                    title: 'Parameters Display',
                                    name: 'parameters-display-group',
                                    hidden: false,
                                    type: 'default',
                                    body: div({dataElement: 'widget'})
                                }),
                                dom.buildPanel({
                                    title: 'App Execution ' + span({class: 'fa fa-bolt'}),
                                    name: 'exec-group',
                                    hidden: false,
                                    type: 'default',
                                    body: div({dataElement: 'widget'})
                                }),
                                dom.buildPanel({
                                    title: 'Output ' + span({class: 'fa fa-arrow-right'}),
                                    name: 'output-group',
                                    hidden: true,
                                    type: 'default',
                                    body: div({dataElement: 'widget'})
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

        function buildPython(cell, cellId, app, params) {
            var code = PythonInterop.buildAppRunner(cellId, app, params);
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
                currentState = {mode: 'editing', params: 'incomplete'};
            }
            fsm = Fsm.make({
                states: appStates,
                initialState: {
                    mode: 'editing', params: 'incomplete'
                },
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
            Jupyter.notebook.edit_metadata({
                notebook: Jupyter.notebook,
                keyboard_manager: Jupyter.notebook.keyboard_manager
            });
        }

        function doEditCellMetadata() {
            dialog.edit_metadata({
                md: cell.metadata,
                callback: function (md) {
                    cell.metadata = md;
                },
                name: 'Cell',
                notebook: Jupyter.notebook,
                keyboard_manager: Jupyter.keyboard_manager
            });
        }

        function initCodeInputArea() {
            var codeInputArea = cell.input.find('.input_area');
            if (!cell.kbase.inputAreaDisplayStyle) {
                cell.kbase.inputAreaDisplayStyle = codeInputArea.css('display');
            }
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
            return model.getItem('user-settings.showInputCodeArea');
        }

        function toggleSettings(cell) {
            var name = 'showSettings',
                selector = 'settings',
                node = dom.getElement(selector),
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
            dom.setContent('notifications.content', content);
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
                node: dom.getElement(path)
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
                dom.enableButton(button);
            });
            state.ui.buttons.disabled.forEach(function (button) {
                dom.disableButton(button);
            });


            // Element state
            state.ui.elements.show.forEach(function (element) {
                dom.showElement(element);
            });
            state.ui.elements.hide.forEach(function (element) {
                dom.hideElement(element);
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

        var saveTimer = null;
        function saveNarrative() {
            if (saveTimer) {
                return;
            }
            saveTimer = window.setTimeout(function () {
                saveTimer = null;
                Jupyter.notebook.save_checkpoint();
            }, saveMaxFrequency);
        }

        function deleteJob(jobId) {
            return new Promise(function (resolve, reject) {
                // NB the narrative callback code does not pass back error
                // through the callback -- it is just logged to the console.
                // Gulp!

                // we don't really delete jobs here any more, just 
                // temporarily disable for now.

                // This is now fire and forget.
                // TODO: close the loop on this.
                runtime.bus().emit('request-job-removal', {
                    jobId: jobId
                });
                resolve();


//                
//                
//                function callback(value) {
//                    resolve(value);
//                }
//                try {
//                    $(document).trigger('cancelJob.Narrative', [jobId, callback]);
//                } catch (err) {
//                    reject(err);
//                }
            });
        }

        /*
         * NB: the jobs panel takes care of removing the job info from the
         * narrative metadata.
         */
        function cancelJob(jobId) {
            runtime.bus().emit('request-job-removal', {
                jobId: jobId
            });
        }

        function doRerun() {
            var confirmed = dom.confirmDialog('This will clear the App Execution area, and re-display the Input parameters. You may then change inputs and run the app again. (Any output you have already produced will be left intact.)\n\nProceed to prepare the app to Run Again?', 'Yes', 'No');
            if (!confirmed) {
                return;
            }

            var jobState = model.getItem('exec.jobState');
            if (jobState) {
                cancelJob(jobState.job_id);
                // the job will be deleted form the notebook when the job cancellation
                // event is received.
            }

            // Remove all of the execution state when we reset the app.
            model.deleteItem('exec');

            // Also ensure that the exec widget is reset
            // widgets.execWidget.bus.emit('reset');

            // TODO: evaluate the params again before we do this.
            fsm.newState({mode: 'editing', params: 'complete', code: 'built'});

            clearOutput();

            renderUI();
        }

        function doRemove() {
            var confirmed = dom.confirmDialog('Are you sure you want to remove this app cell? It will also remove any pending jobs, but will leave generated output intact', 'Yes', 'No way, dude');
            if (!confirmed) {
                return;
            }

            var jobState = model.getItem('exec.jobState');
            if (jobState) {
                cancelJob(jobState.job_id);
                // the job will be deleted form the notebook when the job cancellation
                // event is received.
            }

            $(document).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(cell));
        }

        /*
         * Cancelling a job is the same as deleting it, and the effect of cancelling the job is the same as re-running it.
         *
         */
        function doCancel() {
            var confirmed = dom.confirmDialog('Are you sure you want to Cancel the running job?', 'Yes', 'No way, dude');
            if (!confirmed) {
                return;
            }

            var jobState = model.getItem('exec.jobState');
            if (jobState) {
                cancelJob(jobState.job_id);
                // the job will be deleted form the notebook when the job cancellation
                // event is received.
            }

            // Remove all of the execution state when we reset the app.
            model.deleteItem('exec');

            // TODO: evaluate the params again before we do this.
            fsm.newState({mode: 'editing', params: 'complete', code: 'built'});

            renderUI();
        }

        function updateFromLaunchEvent(message) {

            // Update the exec state.
            // NB we need to do this because the launch events are only 
            // sent once from the narrative back end.
            console.log('TODO: save the launch state', message);


            // Update FSM
            var newFsmState = (function () {
                switch (message.event) {
                    case 'validating_app':
                    case 'validated_app':
                    case 'launching_job':
                        return {mode: 'processing', stage: 'launching'};
                    case 'launched_job':
                        // NEW: start listening for jobs.
                        console.log('Starting to listen for job id', message);
                        startListeningForJobMessages(message.job_id);
                        return {mode: 'processing', stage: 'launching'};
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
                        case 'suspend':
                        case 'error':
                            stopListeningForJobMessages();
                            if (currentState.state.stage) {
                                return {mode: 'error', stage: currentState.state.stage};
                            }
                            return {mode: 'error'};
                        default:
                            throw new Error('Invalid job state ' + jobState.job_state);
                    }
                }());
            fsm.newState(newFsmState);
            renderUI();
        }

        function doRun() {
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
                dom = Dom.make({
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
                return null;
            });
        }

        var jobListener = null;
        function startListeningForJobMessages(jobId) {
            // console.log('Starting to listen for job messages', jobChannelId);
            jobListener = runtime.bus().listen({
                channel: {
                    jobId: jobId
                },
                key: {
                    type: 'job-status'
                },
                handle: function (message) {
                    // Store the most recent job status (jobInfo) in the model and thus metadata.
                    console.log('DEBUG JOB STATE', message);
                    var existingState = model.getItem('exec.jobState'),
                        newJobState = message.jobState;
                    if (!existingState || existingState.job_state !== newJobState.job_state) {
                        model.setItem('exec.jobState', newJobState);

                        var execLog = model.getItem('exec.log');
                        if (!execLog) {
                            execLog = [];
                        }
                        execLog.push({
                            timestamp: new Date(),
                            event: 'jobs-status',
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
        }

        function stopListeningForJobMessages() {
            runtime.bus().removeListener(jobListener);
        }

        /*
         * This message implementation is called whenever the app cell widget 
         * enters the "success" state.
         * 
         * The job here is to evaluate the output of the execution and to ensure
         * that any output products have been made available in the narrative.
         * 
         * Here is what we need to handle:
         * 
         * 1. The canonical case of one or more objects created in this workspace, 
         * and named in the output parameters.
         * 
         * 2. A job report object which should also be displayed.
         * 
         * After displaying the objects, we record this in the cell metadata
         * 
         * If the user decides to delete the output cells, this ensures that we 
         * will not add them again.
         * 
         * However, we will produce user interface elements to ensure that the 
         * user can re-insert them if they want to.
         * 
         * OR
         * 
         * I think it is supposed to work like this:
         * 
         * kb_service_output_mapping in the app spec provides an array 
         * of "mappings" to produce input paramters (an argument which is a object
         * composed of said properties) for an "output widget". The output widget 
         * is named in info.output_types
         * 
         * All rather fishy and fragile looking to me.
         * Why can't we just classify the types of output available? 
         * Are there really going to be many use cases of outputs customized
         * like this? I expect the vast majority will either be reports or simply
         * the output objects.
         * 
         */
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
        function doOnSuccessx() {
            // See if we've already done this before, if so, skip it.
            // TODO: the fsm should have a way of invoking events on only the first 
            // time entering a state ;)

            // Save the state data for output into special model properties.

            // This ensures that it survivies even if the jobState is blow away

            model.setItem('output.result', model.getItem('exec.jobState.result'));

            // Now ensure that the output objects exists, and if so, store their
            // absolute reference.
            var outputs = getOutputParams();
            if (outputs) {
                getOutputObjectRefs(outputs)
                    .then(function (result) {
                        model.setItem('output.objects', result);
                        // Now get see if we have a report object.
                    })
                    .catch(function (err) {
                        console.error('ERROR', err);
                        alert('ERROR');
                    });
            }
        }

        function createOutputCell(jobId) {
            var cellId = utils.getMeta(cell, 'attributes', 'id'),
                // cellIndex = Jupyter.narrative.getCellByKbaseId(cellId),
                cellIndex = Jupyter.notebook.find_cell_index(cell),
                newCell = Jupyter.notebook.insert_cell_below('code', cellIndex),
                newCellId = new Uuid(4).format();

            newCell.metadata = {
                kbase: {
                    type: 'output',
                    attributes: {
                        id: newCellId,
                        status: 'new',
                        created: new Date().toGMTString(),
                        lastLoaded: new Date().toGMTString()
                    },
                    output: {
                        jobId: jobId,
                        parentCellId: cellId
                    }
                }
            };

            newCell.set_text('JobManager().get_job("' + jobId + '").output_viewer()');

            newCell.execute();

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

        function findCellForId(id) {
            var matchingCells = Jupyter.notebook.get_cells().filter(function (cell) {
                if (cell.metadata && cell.metadata.kbase) {
                    return (cell.metadata.kbase.attributes.id === id);
                }
                return false;
            });
            if (matchingCells.length === 1) {
                return matchingCells[0];
            }
            if (matchingCells.length > 1) {
                addNotification('Too many cells matched the given id: ' + id);
            }
            return null;
        }

        function doOnSuccess() {
            // have we created output yet?
            var jobId = model.getItem('exec.jobState.job_id'),
                outputCellId = model.getItem(['output', 'byJob', jobId, 'cell', 'id']),
                outputCell, notification,
                outputCreated = model.getItem(['exec', 'outputCreated']);


            // New app -- check the existing exec state, see if the 
            // output has been created already, and if so just exit.
            // This protects us from the condition in which a user
            // has removed the output for the latest run.
//            if (outputCreated) {
//                return;
//            }

            // If so, is the cell still there?
            if (outputCellId) {
                outputCell = findCellForId(outputCellId);
                if (outputCell) {
                    return;
                }
                notification = div([
                    div('Output cell not found: ' + outputCellId + '. Would you like to recreate it? ')
                ]);
                addNotification(notification);
                return;
            }

            // If not created yet, create it.
            outputCellId = createOutputCell(jobId);
            model.setItem(['output', 'byJob', jobId], {
                cell: {
                    id: outputCellId,
                    created: true,
                    createdAt: new Date().toGMTString()
                },
                params: model.copyItem('params')
            });

            widgets.outputWidget.instance.bus().emit('update', {
                jobState: model.getItem('exec.jobState'),
                output: model.getItem('output')
            });
            // bus.emit('output-created', )
        }

        function start() {
            return Promise.try(function () {
                /*
                 * listeners for the local input cell message bus
                 */

                bus.on('toggle-code-view', function () {
                    var showing = toggleCodeInputArea(),
                        label = showing ? 'Hide Code' : 'Show Code';
                    dom.setButtonLabel('toggle-code-view', label);
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
                bus.on('toggle-settings', function () {
                    var showing = toggleSettings(cell),
                        label = span({class: 'fa fa-cog '}),
                        buttonNode = dom.getButton('toggle-settings');
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
                bus.on('re-run-app', function () {
                    doRerun();
                });
                bus.on('cancel', function () {
                    doCancel();
                });
                bus.on('remove', function () {
                    doRemove();
                });

                bus.on('on-success', function () {
                    doOnSuccess();
                });

                bus.on('sync-all-display-parameters', function () {
                    widgets.paramsDisplayWidget.bus.emit('sync-all-parameters');
                });

                // Events from widgets...

                parentBus.on('newstate', function (message) {
                    console.log('GOT NEWSTATE', message);
                });

                parentBus.on('reset-to-defaults', function () {
                    bus.emit('reset-to-defaults');
                });


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


                // TODO: only turn this on when we need it!
                cellBus.on('run-status', function (message) {
                    // console.log('have run statusx', message);
                    updateFromLaunchEvent(message);

                    model.setItem('exec.runState', message);

                    // Save this to the exec state change log.
                    var execLog = model.getItem('exec.log');
                    if (!execLog) {
                        execLog = [];
                    }
                    execLog.push({
                        timestamp: new Date(),
                        event: 'run-status',
                        data: {
                            jobId: message.jobId,
                            runId: message.runId,
                            status: message.event
                        }
                    });
                    model.setItem('exec.log', execLog);
                });

                cellBus.on('output-cell-removed', function (message) {
                    var output = model.getItem('output');

                    // console.log('HANDLE', message, output);
                    if (!output.byJob[message.jobId]) {
                        return;
                    }
                    delete output.byJob[message.jobId];
                    model.setItem('output', output);
                    widgets.outputWidget.instance.bus().emit('update', {
                        jobState: model.getItem('exec.jobState'),
                        output: output
                    });
                });

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

                // Initialize display
                showCodeInputArea();

                return null;
            });
        }

        function findInputWidget(requestedInputWidget) {
            var defaultModule = 'nbextensions/appCell/widgets/appParamsWidget';
            return defaultModule;

            if (requestedInputWidget === null) {
                return defaultModule;
            }
            // Yes, the string literal 'null' can slip through
            if (requestedInputWidget === 'null') {
                return defaultModule;
            }

            return 'nbextensions/appCell/widgets/inputWidgets/' + requestedInputWidget;
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

                console.log('param spec', paramSpec);
                if (paramSpec.spec.field_type === 'textsubdata') {
                    console.log('GOT ITTT', value);
                    if (value) {
                        value = value.join(',');
                    }
                }

                paramsToExport[key] = value;
            });

            return paramsToExport;
        }

        function loadInputWidget() {
            return new Promise(function (resolve, reject) {
                var inputWidget = env.appSpec.widgets.input,
                    selectedWidget = findInputWidget(inputWidget);

                if (!selectedWidget) {
                    reject('Cannot find the requested input widget ' + inputWidget);
                }

                require([selectedWidget], function (Widget) {
                    // TODO: widget should make own bus.
                    var bus = runtime.bus().makeChannelBus(null, 'Parent comm bus for input widget'),
                        widget = Widget.make({
                            bus: bus,
                            workspaceInfo: workspaceInfo
                        });
                    widgets.paramsInputWidget = {
                        path: ['parameters-group', 'widget'],
                        // module: widgetModule,
                        bus: bus,
                        instance: widget
                    };
                    bus.emit('run', {
                        node: dom.getElement(['parameters-group', 'widget']),
                        parameters: env.parameters
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

                    bus.respond({
                        key: {
                            type: 'get-parameter'
                        },
                        handle: function (message) {
                            console.log('Getting?', message, model.getItem('params'));
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
                        model.setItem(['params', message.parameter], message.newValue);
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
                    });
                    widget.start();
                    resolve();
                }, function (err) {
                    console.log('ERROR', err);
                    reject(err);
                });
            });
        }

        function loadInputViewWidget() {
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
                    widgets.paramsDisplayWidget = {
                        path: ['parameters-display-group', 'widget'],
                        // module: widgetModule,
                        bus: bus,
                        instance: widget
                    };
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
                    widget.start();
                    bus.emit('run', {
                        node: dom.getElement(['parameters-display-group', 'widget']),
                        parameters: env.parameters
                    });

                    resolve();
                }, function (err) {
                    console.log('ERROR', err);
                    reject(err);
                });
            });
        }

        function loadExecutionWidget() {
            return new Promise(function (resolve, reject) {
                require([
                    'nbextensions/appCell/widgets/appExecWidget'
                ], function (Widget) {
                    var widget = Widget.make({
                        bus: cellBus,
                        workspaceInfo: workspaceInfo
                    });
                    widgets.execWidget = {
                        path: ['exec-group', 'widget'],
                        instance: widget
                    };
                    widget.start();
                    widget.bus().emit('run', {
                        node: dom.getElement('exec-group.widget'),
                        jobState: model.getItem('exec.jobState')
                    });
                    resolve();
                }, function (err) {
                    console.log('ERROR', err);
                    reject(err);
                });
            });
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
                        node: dom.getElement('output-group.widget'),
                        jobState: model.getItem('exec.jobState'),
                        output: model.getItem('output')
                    });
                    resolve();
                }, function (err) {
                    reject(err);
                });
            });
        }

        function run(params) {
            // First get the app specs, which is stashed in the model,
            // with the parameters returned.
            return syncAppSpec(params.appId, params.appTag)
                .then(function () {
                    cell.setMeta('attributes', 'title', env.appSpec.info.name);
                    return Promise.all([
                        loadInputWidget(),
                        loadInputViewWidget(),
                        loadExecutionWidget(),
                        loadOutputWidget()
                    ]);
                })
                .then(function () {
                    // this will not change, so we can just render it here.
                    showAboutApp();
                    showAppSpec();
                    PR.prettyPrint(null, container);
                    renderUI();
                })
                .catch(function (err) {
                    console.error('ERROR loading main widgets', err);
                    addNotification('Error loading main widgets: ' + err.message);
                });
        }

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
