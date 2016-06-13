/*global define*/
/*jslint white:true,browser:true*/

define([
    'jquery',
    'bluebird',
    'base/js/namespace',
    'base/js/dialog',
    'common/parameterSpec',
    'common/runtime',
    'common/events',
    'kb_common/html',
    'common/props',
    'kb_service/client/narrativeMethodStore',
    'common/pythonInterop',
    'common/utils',
    'common/dom',
    'common/fsm',
    'google-code-prettify/prettify',
    'css!google-code-prettify/prettify.css'
], function (
    $,
    Promise,
    Jupyter,
    dialog,
    ParameterSpec,
    Runtime,
    Events,
    html,
    Props,
    NarrativeMethodStore,
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
        pre = t('pre'),
        appStates = [
            {
                state: {
                    mode: 'editing',
                    params: 'incomplete'
                },
                ui: {
                    buttons: {
                        enabled: ['toggle-developer-options', 'remove'],
                        disabled: ['run', 'cancel', 're-run']
                    },
                    elements: {
                        show: ['parameters-group'],
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
                        enabled: ['run', 'toggle-developer-options', 'remove'],
                        disabled: ['cancel', 're-run']
                    },
                    elements: {
                        show: ['parameters-group'],
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
                        enabled: ['cancel', 'toggle-developer-options', 'remove'],
                        disabled: ['run', 're-run']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group'],
                        hide: ['parameters-group']
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
                        mode: 'processing',
                        stage: 'queued'
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
                        enabled: ['cancel', 'toggle-developer-options', 'remove'],
                        disabled: ['run', 're-run']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group'],
                        hide: ['parameters-group']
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
                        enabled: ['cancel', 'toggle-developer-options', 'remove'],
                        disabled: ['run', 're-run']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group'],
                        hide: ['parameters-group']
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
                        enabled: ['re-run', 'toggle-developer-options', 'remove'],
                        disabled: ['run', 'cancel']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group'],
                        hide: ['parameters-group']
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
                        enabled: ['re-run', 'toggle-developer-options', 'remove'],
                        disabled: ['run', 'cancel']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group'],
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
                        enabled: ['re-run', 'toggle-developer-options', 'remove'],
                        disabled: ['run', 'cancel']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group'],
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
                        enabled: ['re-run', 'toggle-developer-options', 'remove'],
                        disabled: ['run', 'cancel']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group'],
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
                        enabled: ['re-run', 'toggle-developer-options', 'remove'],
                        disabled: ['run', 'cancel']
                    },
                    elements: {
                        show: ['parameters-display-group', 'exec-group'],
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
            cell = config.cell,
            parentBus = config.bus,
            runtime = Runtime.make(),
            inputWidgetBus = runtime.bus().makeChannelBus(),
            env = {},
            model,
            // HMM. Sync with metadata, or just keep everything there?
            settings = {
                showAdvanced: false
            },
        widgets = {},
            inputBusses = [],
            inputBusMap = {},
            fsm;

        // DATA API

        /*
         * Fetch the method spec for a given method and store the spec in the model.
         * As well, process and store the parameters in the model as well.
         *
         * @param {type} methodId
         * @param {type} methodTag
         * @returns {unresolved}
         */
        function syncMethodSpec(methodId, methodTag) {
            var methodRef = {
                ids: [methodId],
                tag: methodTag
            },
            nms = new NarrativeMethodStore(runtime.config('services.narrative_method_store.url'), {
                token: runtime.authToken()
            });

            return nms.get_method_spec(methodRef)
                .then(function (data) {
                    if (!data[0]) {
                        throw new Error('Method not found');
                    }
                    // TODO: really the best way to store state?
                    env.methodSpec = data[0];
                    // Get an input field widget per parameter
                    var parameters = data[0].parameters.map(function (parameterSpec) {
                        return ParameterSpec.make({parameterSpec: parameterSpec});
                    });
                    env.parameters = parameters;
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

            dom.setContent('fsm-bar.content', content);
        }



        function renderMethodSpec() {
//            if (!env.methodSpec) {
//                return;
//            }
//            var specText = JSON.stringify(env.methodSpec, false, 3),
//                 fixedText = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return pre({
                dataElement: 'spec',
                class: 'prettyprint lang-json', 
                style: {fontSize: '80%'}});
        }

        function renderMethodSummary() {
            return table({class: 'table table-striped'}, [
                tr([
                    th('Name'),
                    td({dataElement: 'name'})
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

        function renderAboutMethod() {
            return html.makeTabs({
                tabs: [
                    {
                        label: 'Summary',
                        name: 'summary',
                        content: renderMethodSummary()
                    },
                    {
                        label: 'Spec',
                        name: 'spec',
                        content: renderMethodSpec()
                    }
                ]
            });
        }

        function toBoolean(value) {
            if (value && value !== null) {
                return true;
            }
            return false;
        }

        function showAboutMethod() {
            console.log('METHOD SPEC', env.methodSpec);
            dom.setContent('about-method.name', env.methodSpec.info.name);
            dom.setContent('about-method.summary', env.methodSpec.info.subtitle);
            dom.setContent('about-method.version', env.methodSpec.info.ver);
            dom.setContent('about-method.git-commit-hash', env.methodSpec.info.git_commit_hash || dom.na());
            dom.setContent('about-method.authors', env.methodSpec.info.authors.join('<br>'));
            var methodRef = [env.methodSpec.info.namespace || 'l.m', env.methodSpec.info.id].filter(toBoolean).join('/'),
                link = a({href: '/#appcatalog/app/' + methodRef, target: '_blank'}, 'Catalog Page');
            dom.setContent('about-method.catalog-link', link);
        }

        function showMethodSpec() {
            if (!env.methodSpec) {
                return;
            }
            var specText = JSON.stringify(env.methodSpec, false, 3),
                fixedText = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                content = pre({class: 'prettyprint lang-json', style: {fontSize: '80%'}}, fixedText);
            dom.setContent('about-method.spec', content);
        }

        function renderLayout() {
            var events = Events.make(),
                content = div({class: 'kbase-extension kb-method-cell', style: {display: 'flex', alignItems: 'stretch'}}, [
                    div({class: 'prompt', dataElement: 'prompt', style: {display: 'flex', alignItems: 'stretch', width: '14ex', flexDirection: 'column'}}, [
                        div({dataElement: 'status'})
                    ]),
                    div({
                        class: 'body',
                        dataElement: 'body',
                        style: {display: 'flex', alignItems: 'stretch', flexDirection: 'column', flex: '1'}
                    }, [
                        div({dataElement: 'notifications', style: {display: 'block', width: '100%'}}),
                        div({dataElement: 'widget', style: {display: 'block', width: '100%'}}, [
                            div({class: 'container-fluid'}, [
                                dom.buildPanel({
                                    title: 'FSM',
                                    name: 'fsm-bar',
                                    hidden: false,
                                    type: 'default',
                                    body: [
                                        div({dataElement: 'content'})
                                    ]
                                }),
                                dom.buildPanel({
                                    title: 'Available Actions',
                                    name: 'availableActions',
                                    hidden: false,
                                    type: 'default',
                                    body: [
                                        div({class: 'btn-toolbar'}, [
                                            div({class: 'btn-group'}, [
                                                dom.makeButton('Run', 'run', {events: events, type: 'primary'})
                                            ]),
                                            div({class: 'btn-group'}, [
                                                dom.makeButton('Cancel', 'cancel', {events: events, type: 'danger'})
                                            ]),
                                            div({class: 'btn-group'}, [
                                                dom.makeButton('Re-run', 're-run', {events: events, type: 'primary'})
                                            ]),
                                            div({class: 'btn-group'}, [
                                                dom.makeButton('Remove', 'remove', {events: events, type: 'danger'})
                                            ]),
                                            div({class: 'btn-group'}, [
                                                dom.makeButton('Show Dev Options', 'toggle-developer-options', {events: events})
                                            ])
                                        ])
                                    ]
                                }),
                                dom.buildCollapsiblePanel({
                                    title: 'About',
                                    name: 'about-method',
                                    hidden: false,
                                    type: 'default',
                                    body: [
                                        div({dataElement: 'about-method'}, renderAboutMethod())
                                    ]
                                }),
                                dom.buildPanel({
                                    title: 'Dev',
                                    name: 'developer-options',
                                    hidden: true,
                                    type: 'default',
                                    body: [
                                        dom.makeButton('Show Code', 'toggle-code-view', {events: events}),
                                        dom.makeButton('Edit Metadata', 'edit-cell-metadata', {events: events}),
                                        dom.makeButton('Edit Notebook Metadata', 'edit-notebook-metadata', {events: events})
                                    ]
                                }),
                                dom.buildPanel({
                                    title: 'Parameters',
                                    name: 'parameters-group',
                                    hidden: false,
                                    type: 'default',
                                    body: div({dataElement: 'widget'})
                                }),
                                dom.buildPanel({
                                    title: 'Parameters Display',
                                    name: 'parameters-display-group',
                                    hidden: false,
                                    type: 'default',
                                    body: div({dataElement: 'widget'})
                                }),
                                dom.buildPanel({
                                    title: 'Method Execution',
                                    name: 'exec-group',
                                    hidden: false,
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

        function buildPython(cell) {
            var code = PythonInterop.buildMethodRunner(cell);
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
                }
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
                codeInputArea.css('display', cell.kbase.inputAreaDisplayStyle);
            } else {
                codeInputArea.css('display', 'none');
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

        function toggleDeveloperOptions(cell) {
            var name = 'showDeveloperOptions',
                selector = 'developer-options',
                node = dom.getElement(selector),
                showing = model.getItem(['user-settings', name]);
            if (showing) {
                model.setItem(['user-settings', name], false);
            } else {
                model.setItem(['user-settings', name], true);
            }
            showing = model.getItem(['user-settings', name]);
            if (showing) {
                node.style.display = 'block';
            } else {
                node.style.display = 'none';
            }
            return showing;
        }

        // WIDGETS

        function showWidget(name, widgetModule, path) {
            var bus = runtime.bus().makeChannelBus(),
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
            if (state.ui.messages) {
                state.ui.messages.forEach(function (message) {
                    widgets[message.widget].bus.send(message.message, message.address);
                });
            }
        }

        function deleteJobFromNotebook(jobId) {
            var metadata = Jupyter.notebook.metadata;
            // first, wipe the metadata
            metadata.job_ids.apps = metadata.job_ids.apps.filter(function (val) {
                return val.id !== jobId;
            });

            // ...and from the method list
            metadata.job_ids.methods = metadata.job_ids.methods.filter(function (val) {
                return val.id !== jobId;
            });

            // remove it from the 'cache' in this jobs panel
            // delete this.source2Job[this.jobStates[jobId].source];
            // delete this.jobStates[jobId];

            // save the narrative!
            Jupyter.notebook.save_checkpoint();

            return true;
        }

        function deleteJob(jobId) {
            return new Promise(function (resolve, reject) {
                // NB the narrative callback code does not pass back error
                // through the callback -- it is just logged to the console.
                // Gulp!
                function callback(value) {
                    resolve(value);
                }
                try {
                    $(document).trigger('cancelJob.Narrative', [jobId, callback]);
                } catch (err) {
                    reject(err);
                }
            });
        }

        function doRerun() {
            var confirmed = dom.confirmDialog('Are you sure you want to zap the data?', 'Yes', 'No way, dude');
            if (!confirmed) {
                return;
            }

            // delete the job

            // Jobs.deleteJob(jobState.job_id)
            Promise.try(function () {
                // If there was an error during the launching/preparation phase,
                // there will be no job yet.
                var jobState = model.getItem('exec.jobState');
                if (jobState) {
                    return Promise.all([jobState.job_id, deleteJob(jobState.job_id)]);
                } else {
                    return [null];
                }
            })
                .spread(function (jobId) {
                    if (jobId) {
                        deleteJobFromNotebook(jobId);
                    }
                })
                .then(function () {
                    // We should really wait for an update to come from the parent!

                    // Remove all of the execution state when we reset the method.
                    model.deleteItem('exec');

                    // TODO: evaluate the params again before we do this.
                    fsm.newState({mode: 'editing', params: 'complete', code: 'built'});

                    renderUI();

                })
                .catch(function (err) {
                    console.error('Error Deleting Job', err);
                });

        }

        function doRemove() {
            var confirmed = dom.confirmDialog('Are you sure you want to remove this method cell? It will also remove any pending jobs, but will leave generated output intact', 'Yes', 'No way, dude');
            if (!confirmed) {
                return;
            }

            Promise.try(function () {
                // If there was an error during the launching/preparation phase,
                // there will be no job yet.
                var jobState = model.getItem('exec.jobState');
                if (jobState) {
                    return deleteJob(jobState.job_id);
                }
            })
                .then(function () {
                    // deleteJobFromNotebook(jobState.job_id);
                })
                .then(function () {
                    // We should really wait for an update to come from the parent!

                    // Remove all of the execution state when we reset the method.
                    model.deleteItem('exec');

                    // TODO: evaluate the params again before we do this.
                    fsm.newState({mode: 'editing', params: 'complete', code: 'built'});
                    renderUI();
                })
                .then(function () {
                    $(document).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(cell));
                })
                .catch(function (err) {
                    console.error('Error Deleting Cell', err);
                });
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

            // delete the job

            Promise.try(function () {
                // If there was an error during the launching/preparation phase,
                // there will be no job yet.
                var jobState = model.getItem('exec.jobState');
                if (jobState) {
                    return Promise.all([jobState.job_id, deleteJob(jobState.job_id)])
                        .then(function () {
                            deleteJobFromNotebook(jobState.job_id);
                        });
                }
            })
                .then(function () {
                    // We should really wait for an update to come from the parent!

                    // Remove all of the execution state when we reset the method.
                    model.deleteItem('exec');

                    // TODO: evaluate the params again before we do this.
                    fsm.newState({mode: 'editing', params: 'complete', code: 'built'});

                    renderUI();
                })
                .catch(function (err) {
                    console.error('Error Deleting Job', err);
                });
        }

        function updateFromLaunchEvent(launchEvent) {
            var newFsmState = (function () {
                switch (launchEvent.event) {
                    case 'validating_app':
                    case 'validated_app':
                    case 'launching_job':
                    case 'launched_job':
                        return {mode: 'processing', stage: 'launching'};
                    case 'error':
                        return {mode: 'error', stage: 'launching'};
                    default:
                        throw new Error('Invalid launch state ' + launchEvent.event);
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
                            return {mode: 'success'};
                        case 'suspend':
                        case 'error':
                            if (currentState.state.stage) {
                                return {mode: 'error', stage: currentState.state.stage};
                            } else {
                                return {mode: 'error'};
                            }
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
                    bus: inputWidgetBus
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

        function start() {
            return Promise.try(function () {
                var bus = inputWidgetBus;

                /*
                 * listeners for the local input cell message bus
                 */

                bus.on('toggle-code-view', function () {
                    var showing = toggleCodeInputArea(),
                        label = showing ? 'Hide Code' : 'Show Code';
                    dom.setButtonLabel('toggle-code-view', label);
                });
                bus.on('edit-cell-metadata', function () {
                    doEditCellMetadata();
                });
                bus.on('edit-notebook-metadata', function () {
                    doEditNotebookMetadata();
                });
                bus.on('toggle-developer-options', function () {
                    var showing = toggleDeveloperOptions(cell),
                        label = showing ? 'Hide Dev Options' : 'Show Dev Options';
                    dom.setButtonLabel('toggle-developer-options', label);
                });
                bus.on('run', function () {
                    doRun();
                });
                bus.on('re-run', function () {
                    doRerun();
                });
                bus.on('cancel', function () {
                    doCancel();
                });
                bus.on('remove', function () {
                    doRemove();
                });

                // Events from widgets...

                parentBus.on('newstate', function (message) {
                    console.log('GOT NEWSTATE', message);
                });

                parentBus.on('reset-to-defaults', function () {
                    bus.emit('reset-to-defaults');
                });

                runtime.bus().listen({
                    channel: {
                        cell: utils.getMeta(cell, 'attributes', 'id')
                    },
                    key: {
                        type: 'runstatus'
                    },
                    handle: function (message) {
                        updateFromLaunchEvent(message.data);
                        utils.pushMeta(cell, 'methodCell.exec.log', {
                            timestamp: new Date(),
                            event: 'runstatus',
                            data: {
                                jobId: message.jobId,
                                runId: message.runId,
                                status: message.event
                            }
                        });

                        // Forward to the exec widget
                        if (widgets.execWidget) {
                            widgets.execWidget.bus.emit('launch-event', {
                                data: message.data
                            });
                        }

                    }
                });

                runtime.bus().listen({
                    channel: {
                        cell: utils.getMeta(cell, 'attributes', 'id')
                    },
                    key: {
                        type: 'jobstatus'
                    },
                    handle: function (message) {

                        // Store the most recent job status (jobInfo) in the model and thus metadata.
                        // console.log('JOBSTATUS', message.job.state);
                        updateFromJobState(message.job.state);

                        var existingState = model.getItem('exec.jobState');
                        if (!existingState || existingState.job_state !== message.job.state.job_state) {
                            model.setItem('exec.jobState', message.job.state);
                            // Forward the job info to the exec widget if it is available. (it should be!)
                            if (widgets.execWidget) {
                                widgets.execWidget.bus.emit('job-state', {
                                    jobState: message.job.state
                                });
                            }
                        } else {
                            if (widgets.execWidget) {
                                widgets.execWidget.bus.emit('job-state-updated', {
                                    jobId: message.job.state.job_id
                                });
                            }
                        }
                        model.setItem('exec.jobStateUpdated', new Date().getTime());



                        // Evaluate the job state to generate our derived "quickStatus" used to control
                        // the ui...


                        // SKIP for now
                        return;

                        model.setItem('job', {
                            updatedAt: new Date().getTime(),
                            info: message.job
                        });

                        var jobStatus = message.job.state.job_state;

                        // Update current status
                        updateRunJobStatus();

                        renderRunStatus();

                        updateJobDetails(message);
                        // updateJobLog(message);

                        updateJobReport(message.job);

                        // and yet another job state thing. This one takes care
                        // the general state of the job state communication

                        // Update status history.

                        // Okay, don't store multiples of the last event.
                        var log = cell.metadata.kbase.log;
                        if (!log) {
                            log = [];
                            cell.metadata.kbase.log = log;
                        }
                        if (log.length > 0) {
                            var lastLog = log[log.length - 1];
                            if (lastLog.data.status === jobStatus) {
                                if (lastLog.count === undefined) {
                                    lastLog.count = 0;
                                }
                                lastLog.count += 1;
                                return;
                            }
                        }

                        utils.pushMeta(cell, 'methodCell.exec.log', {
                            timestamp: new Date(),
                            event: 'jobstatus',
                            data: {
                                jobId: message.jobId,
                                status: jobStatus
                            }
                        });
                    }
                });

                // Listen for interesting narrative jquery events...
                // dataUpdated.Narrative is emitted by the data sidebar list
                // after it has fetched and updated its data. Not the best of
                // triggers that the ws has changed, not the worst.
                $(document).on('dataUpdated.Narrative', function () {
                    // Tell each cell that the workspace has been updated.
                    // This is what is interesting, no?
                    // we can just broadcast this on the runtime bus
//                    runtime.bus().send({
//                        type: 'workspace-changed'
//                    });
                    console.log('sending workspace changed event');
                    // runtime.bus().send('workspace-changed');
                    runtime.bus().emit('workspace-changed');
                    // widgets.paramsInputWidget.bus.emit('workspace-changed');
                    //widgets.paramsDisplayWidget.bus.send('workspace-changed');
                });

                // Initialize display
                showCodeInputArea();


                return null;
            });
        }

        function findInputWidget(requestedInputWidget) {
            var defaultModule = 'nbextensions/methodCell/widgets/methodParamsWidget';
            return defaultModule;

            if (requestedInputWidget === null) {
                return defaultModule;
            }
            // Yes, the string literal 'null' can slip through
            if (requestedInputWidget === 'null') {
                return defaultModule;
            }

            return 'nbextensions/methodCell/widgets/inputWidgets/' + requestedInputWidget;
        }

        function loadInputWidget() {
            return new Promise(function (resolve, reject) {
                var inputWidget = env.methodSpec.widgets.input,
                    selectedWidget = findInputWidget(inputWidget);

                if (!selectedWidget) {
                    reject('Cannot find the requested input widget ' + inputWidget);
                }

                require([selectedWidget], function (Widget) {
                    var bus = runtime.bus().makeChannelBus(),
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
                    widget.start();
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
                            // console.log('Getting?', message);
                            // console.log(model.getItem('params'));
                            return {
                                value: model.getItem(['params', message.parameterName])
                            };
                        }
                    });

                    bus.respond({
                        key: 'test',
                        handle: function (message) {
                            return true;
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
                            buildPython(cell);
                            fsm.newState({mode: 'editing', params: 'complete', code: 'built'});
                            renderUI();
                        } else {
                            resetPython(cell);
                            fsm.newState({mode: 'editing', params: 'incomplete'});
                            renderUI();
                        }
                    });
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
                    'nbextensions/methodCell/widgets/methodParamsViewWidget'
                ], function (Widget) {
                    var bus = runtime.bus().makeChannelBus(),
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
                    'nbextensions/methodCell/widgets/methodExecWidget'
                ], function (Widget) {
                    var bus = runtime.bus().makeChannelBus(),
                        widget = Widget.make({
                            bus: bus,
                            workspaceInfo: workspaceInfo
                        });
                    widgets.execWidget = {
                        path: ['exec-group', 'widget'],
                        bus: bus,
                        instance: widget
                    };
                    widget.start();
                    var x = model.getItem('exec.jobState');
                    bus.emit('run', {
                        node: dom.getElement('exec-group.widget'),
                        jobState: model.getItem('exec.jobState')
                            // jobInfo:
                    });
                    resolve();
                }, function (err) {
                    console.log('ERROR', err);
                    reject(err);
                });
            });
        }

        function run(params) {
            // First get the method specs, which is stashed in the model,
            // with the parameters returned.
            return syncMethodSpec(params.methodId, params.methodTag)
                .then(function () {
                    cell.setMeta('attributes', 'title', env.methodSpec.info.name);
                    return Promise.all([
                        loadInputWidget(),
                        loadInputViewWidget(),
                        loadExecutionWidget()
                    ]);
                })
                .then(function () {
                    // this will not change, so we can just render it here.
                    showAboutMethod();
                    showMethodSpec();
                    PR.prettyPrint(null, container);
                    renderUI();
                });
        }

        // INIT

        model = Props.make({
            data: utils.getMeta(cell, 'methodCell'),
            onUpdate: function (props) {
                utils.setMeta(cell, 'methodCell', props.getRawObject());
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
    console.log('ERROR loading methodCell methodCellWidget', err);
});
