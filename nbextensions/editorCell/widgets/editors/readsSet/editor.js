/*global define*/
/*jslint white:true,browser:true*/

define([
    'require',
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
    'kb_service/utils',
    'kb_sdk_clients/genericClient',
    'common/pythonInterop',
    'common/utils',
    'common/ui',
    'common/fsm',
    'common/spec',
    'google-code-prettify/prettify',
    './fsm',
    './loading',
    './message',

    'css!google-code-prettify/prettify.css',
    'css!font-awesome.css'
], function(
    require,
    Promise,
    Uuid,
    Jupyter,
    Runtime,
    Events,
    html,
    Props,
    JupyterProxy,
    BusEventManager,
    NarrativeMethodStore,
    serviceUtils,
    GenericClient,
    PythonInterop,
    utils,
    Ui,
    Fsm,
    Spec,
    PR,
    editorCellFsm,
    loadingWidget,
    MessageWidget
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
        appStates = editorCellFsm.fsm;

    function CancellationError(message, reason) {
        this.message = message;
        this.reason = reason;
    }
    CancellationError.prototype = Object.create(Error.prototype);
    CancellationError.prototype.constructor = CancellationError;
    CancellationError.prototype.name = 'ClientException';

    function factory(config) {
        var cell = config.cell,
            parentBus = config.bus,

            hostNode, container, ui,
            workspaceInfo = config.workspaceInfo,
            runtime = Runtime.make(),

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
                }
            },
            widgets = {},
            spec,
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

        function toBoolean(value) {
            if (value && value !== null) {
                return true;
            }
            return false;
        }

        function buildLayout(events) {
            var readOnlyStyle = {};
            if (Jupyter.narrative.readonly) {
                readOnlyStyle.display = 'none';
            }
            return div({ class: 'kbase-extension kb-editor-cell', style: { display: 'flex', alignItems: 'stretch' } }, [
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
                                title: 'Select Object to Edit',
                                name: 'edit-object-selector',
                                hidden: false,
                                type: 'default',
                                classes: ['kb-panel-container'],
                                body: div({ dataElement: 'widget' })
                            }),
                            ui.buildCollapsiblePanel({
                                title: span(['Currently Editing ', span({
                                    dataElement: 'name',
                                    style: {
                                        textDecoration: 'underline'
                                    }
                                })]),
                                name: 'currently-editing',
                                collapsed: true,
                                hidden: false,
                                type: 'default',
                                classes: ['kb-panel-container'],
                                body: div({ dataElement: 'widget' })
                            }),
                            ui.buildPanel({
                                title: span({ class: 'fa fa-pencil', style: { marginLeft: '3px', width: '20px' } }) + 'Editor ',
                                name: 'editor',
                                hidden: false,
                                type: 'default',
                                classes: ['kb-panel-container'],
                                body: div({ dataElement: 'widget' })
                            }),
                            div({
                                dataElement: 'available-actions',
                                style: readOnlyStyle
                            }, [
                                div({ class: 'btn-toolbar kb-btn-toolbar-cell-widget' }, [
                                    div({ class: 'btn-group' }, [
                                        ui.makeButton('Save', 'save', { events: events, type: 'primary' }),
                                        div({
                                            dataElement: 'status',
                                            class: 'xbtn ',
                                            style: {
                                                display: 'inline-block',
                                                marginLeft: '6px',
                                                xborder: '1px red dotted',
                                                padding: '6px 12px',
                                                lineHeight: '1.43'

                                            }
                                        })
                                    ])
                                ])
                            ])
                        ])
                    ])
                ])
            ]);
        }

        function validateModel() {
            return spec.validateModel(model.getItem('params'));
        }

        function setStatus(message) {
            ui.setContent('available-actions.status', message);
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

        function buildPython() {
            var cellId = utils.getCellMeta(cell, 'kbase.attributes.id');
            var app = editorState.getItem('app');
            var params = modelToParams();
            var runId = editorState.getItem('editorState.currentRunId');

            var fixedApp = fixApp(app);
            var code = PythonInterop.buildEditorRunner(cellId, runId, fixedApp, params);
            // TODO: do something with the runId

            // setStatus('Successfully built code');

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

        function initCodeInputArea() {
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
            renderNotifications();
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

            // Editor state flags
            // *** disabling this vew model style
            // ['touched', 'changed'].forEach(function(flag) {
            //     var flagged, params = model.getItem('params');
            //     if (params) {
            //         Object.keys(params).forEach(function(key) {
            //             var param = params[key];
            //             if (param[flag]) {
            //                 flagged = true;
            //             }
            //         });
            //         setStatusFlag(flag, flagged);
            //     }
            // });
            ui.setContent('flags.fsm', JSON.stringify(fsm.getCurrentState().state));


        }

        // var saveTimer = null;

        // function saveNarrative() {
        //     if (saveTimer) {
        //         return;
        //     }
        //     saveTimer = window.setTimeout(function() {
        //         saveTimer = null;
        //         Jupyter.saveNotebook();
        //     }, saveMaxFrequency);
        // }

        function doDeleteCell() {
            var content = div([
                p([
                    'Deleting this cell will remove the editor from the Narrative, ',
                    'but will not delete the associated Reads Sets, which will still be avaiable ',
                    'in the data panel.'
                ]),
                p('Continue to delete this cell?')
            ]);
            ui.showConfirmDialog({ title: 'Confirm Cell Deletion', body: content })
                .then(function(confirmed) {
                    if (!confirmed) {
                        return;
                    }

                    bus.emit('stop');

                    JupyterProxy.deleteCell(cell);
                });
        }

        function doSave() {
            setStatus(html.loading('Saving...'));
            // We stamp the run id and rebuild the code to capture the run id.
            // This is a provides for a sanity check tht the response from the
            // save originates with this request.
            editorState.setItem('editorState.currentRunId', new Uuid(4).format());
            buildPython();
            doSaveReadsSet()
                .then(function() {
                    // Clear the parameter flags
                    // clearModelFlags();
                    renderUI();
                })
                .catch(function(err) {
                    console.error('ERROR!', err);
                });
        }

        function modelToParams() {
            return [{
                workspace: workspaceInfo.id,
                output_object_name: model.getItem('params.name'),
                data: {
                    description: model.getItem('params.description'),
                    items: model.getItem('params.items', []).map(function(item) {
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

        function loadUpdateEditor(controller) {
            return new Promise(function(resolve, reject) {
                require(['./update'], function(Widget) {
                    // TODO: widget should make own bus.
                    var bus = runtime.bus().makeChannelBus({ description: 'Parent comm bus for input widget' }),
                        widget = Widget.make({
                            bus: bus,
                            workspaceInfo: workspaceInfo,
                            appId: env.appId,
                            appTag: env.appTag,
                            initialValue: model.getItem('params')
                        });
                    controller.widget = widget;
                    controller.desc = 'update editor widget';
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
                        model.setItem(['params', message.parameter], message.newValue);
                        evaluateAppState();
                    });

                    bus.on('parameter-touched', function(message) {
                        // model.setItem(['params', message.parameter, 'touched'], true);
                        var state = fsm.getCurrentState(),
                            newState = JSON.parse(JSON.stringify(state.state));
                        newState.data = 'touched';
                        fsm.newState(newState);
                        evaluateAppState();
                    });

                    return widget.start({
                            node: controller.node,
                            appSpec: env.appSpec,
                            parameters: spec.getSpec()
                        })
                        .then(function() {
                            resolve();
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

        function doShowMessage(message) {
            var messageWidget = MessageWidget.make();
            widgets.editor.instance = messageWidget;
            return messageWidget.start({
                content: message,
                node: ui.getElement('editor.widget')
            });
        }



        function renderCurrentlyEditing() {
            var info = editorState.getItem('current.set.info');
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
        function loadData(objectRef) {
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
                    // *** removed the .value
                    model.setItem('params.name', setObject.info[1]);
                    model.setItem('params.description', setObject.data.description);
                    model.setItem('params.items', setObject.data.items.map(function(item) {
                        return {
                            ref: item.ref,
                            label: item.label
                        };
                    }));

                    var objectInfo = serviceUtils.objectInfoToObject(setObject.info);

                    // Might as well set here.
                    editorState.setItem('current.set.ref', objectInfo.ref);
                    editorState.setItem('current.set.info', objectInfo);

                    // NOT USED?
                    model.setItem('currentReadsSet', objectInfo);


                    // return loadUpdateEditor();
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
        }

        function doCreateNewSet(name) {
            var setApiClient = new GenericClient({
                    url: runtime.config('services.service_wizard.url'),
                    token: runtime.authToken(),
                    module: 'SetAPI',
                    version: 'dev'
                }),
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
                    doEditObject(serviceUtils.objectInfoToObject(result.set_info));

                    // return unloadEditor()
                    //     .then(function() {
                    //         var loading = loadingWidget.make();
                    //         return loading.start({
                    //                 node: ui.getElement('editor.widget'),
                    //                 message: 'Loading Reads Set'
                    //             })
                    //             .then(function() {
                    //                 return loadData(result.set_ref);
                    //             })
                    //             .then(function() {
                    //                 return loading.stop();
                    //             })
                    //     })
                    //     .then(function() {
                    //         return loadUpdateEditor();
                    //     })
                    //     .then(function() {
                    //         renderCurrentlyEditing();
                    //         ui.collapsePanel('edit-object-selector');
                    //         evaluateAppState(true);
                    //     });
                })
                .catch(function(err) {
                    console.error('ERROR getting reads set ', err);
                    console.error(err.detail ? err.detail.replace('\n', '<br>') : '');
                    loadErrorWidget(err);
                });

        }

        function doSaveReadsSet() {
            return Promise.try(function() {
                cell.execute();
                var state = JSON.parse(JSON.stringify(fsm.getCurrentState().state));
                state.data = 'clean';
                fsm.newState(state);
            });
        }

        var editorControllers = {};

        function unloadEditorController(controller) {
            var originalStatus = controller.status;
            controller.status = 'unloading';
            controller.cancelled = true;
            return Promise.try(function() {
                    // stop the widget if there is one.
                    if (controller.widget) {
                        controller.status = 'stopping';
                        return controller.widget.stop()
                            .then(function() {
                                controller.status = 'stopped';
                                controller.widget = null;
                            });
                    }
                })
                .then(function() {
                    var editorNode = ui.getElement('editor.widget');
                    try {
                        editorNode.removeChild(controller.node);
                    } catch (ex) {
                        console.warn('Error removing widget controller node', ex);
                    }
                });
        }

        function unloadEditors() {
            return Promise.all(Object.keys(editorControllers).map(function(id) {
                var controller = editorControllers[id];
                return unloadEditorController(controller)
                    .then(function() {
                        delete editorControllers[id];
                    });
            }));
        }

        // Widget controller

        function unloadWidgetController(controller) {
            var originalStatus = controller.status;
            controller.status = 'unloading';
            controller.cancelled = true;
            return Promise.try(function() {
                    // stop the widget if there is one.
                    if (controller.widget) {
                        controller.status = 'stopping';
                        return controller.widget.stop()
                            .then(function() {
                                controller.status = 'stopped';
                                controller.widget = null;
                            });
                    }
                })
                .then(function() {
                    var editorNode = ui.getElement('editor.widget');
                    try {
                        editorNode.removeChild(controller.node);
                    } catch (ex) {
                        console.warn('Error removing widget controller node', ex);
                    }
                });
        }

        function unloadWidgets() {
            return Promise.all(Object.keys(editorControllers).map(function(id) {
                var controller = editorControllers[id];
                return unloadWidgetController(controller)
                    .then(function() {
                        delete editorControllers[id];
                    });
            }));
        }

        function doShowWidget(widgetFactory, arg) {
            // New, create control object.
            var controller = {
                id: new Uuid(4).format(),
                node: document.createElement('div'),
                widget: null,
                cancelled: false,
                status: 'creating'
            };

            arg.node = controller.node;

            return unloadWidgets()
                .then(function() {
                    editorControllers[controller.id] = controller;
                    controller.widget = widgetFactory.make();
                    controller.desc = '?? widget ??';
                    controller.status = 'starting';
                    ui.getElement('editor.widget').appendChild(controller.node);
                    return controller.widget.start(arg);
                })
                .catch(CancellationError, function(err) {
                    console.warn('editor loading was cancelled', err);
                })
                .catch(function(err) {
                    alert('internal error: ' + err.message);
                });
        }

        function doEditObject(objectInfo) {
            // New, create control object.
            var controller = {
                id: new Uuid(4).format(),
                node: document.createElement('div'),
                widget: null,
                cancelled: false,
                status: 'creating'
            };

            // Update editor state (is also persistent in the metadata)
            editorState.setItem('current.set.ref', objectInfo.ref);
            editorState.setItem('current.set.info', objectInfo);

            return unloadEditors()
                .then(function() {
                    editorControllers[controller.id] = controller;
                    controller.widget = loadingWidget.make();
                    controller.desc = 'loading widget.';
                    controller.status = 'starting';
                    ui.getElement('editor.widget').appendChild(controller.node);
                    return controller.widget.start({
                        node: controller.node,
                        message: 'Loading Reads Set'
                    })
                })
                .then(function() {
                    if (controller.cancelled) {
                        throw new CancellationError();
                    }
                    return loadData(objectInfo.ref);
                })
                .then(function() {
                    if (controller.cancelled) {
                        throw new CancellationError();
                    }
                    return controller.widget.stop();
                })
                .then(function() {
                    if (controller.cancelled) {
                        throw new CancellationError();
                    }
                    return loadUpdateEditor(controller);
                })
                .then(function() {
                    if (controller.cancelled) {
                        throw new CancellationError();
                    }
                    renderCurrentlyEditing();
                    ui.collapsePanel('edit-object-selector');
                    evaluateAppState(true);
                })
                .catch(CancellationError, function(err) {
                    console.warn('editor loading was cancelled', err);
                })
                .catch(function(err) {
                    alert('internal error: ' + err.message);
                });
        }

        function loadEditObjectSelector() {
            return new Promise(function(resolve, reject) {
                require([
                    './selector'
                ], function(Widget) {
                    var widget = Widget.make({
                        workspaceInfo: workspaceInfo,
                        objectType: 'KBaseSets.ReadsSet'
                    });
                    widgets.editObjectSelector = {
                        path: ['edit-object-selector', 'widget'],
                        instance: widget
                    };
                    // When the user selects a reads set to edit.
                    widget.channel.on('changed', function(message) {
                        // Call this when we have a new object to edit. It will
                        // take care of updating the cell state as well as
                        // rendering the object.
                        //editorState.setItem('current.set.ref', objectInfo.ref);
                        //editorState.setItem('current.set.info', objectInfo);
                        var currentObject = editorState.getItem('current.set.info');
                        var newObject = message.objectInfo;
                        if (!newObject) {
                            if (currentObject) {
                                return doShowWidget(MessageWidget, {
                                    content: div({
                                        style: {
                                            textAlign: 'center'
                                        }
                                    }, 'No reads set selected. Please use the "Select Object to Edit" section above to create or edit a Reads Set.')
                                });
                            } else {
                                // do nothing, no editor displaying.
                            }
                        } else {
                            if (currentObject) {
                                if (currentObject.ref !== newObject.ref) {
                                    // replace it
                                    doEditObject(message.objectInfo);
                                } else {
                                    // do nothing, just leave editor alone.
                                }
                            } else {
                                // loadit for the first time, same thing.
                                doEditObject(message.objectInfo);
                            }
                        }
                    });
                    widget.channel.on('create-new-set', function(message) {
                        doCreateNewSet(message.name);
                    });
                    widget.channel.on('fatal-error', function(message) {
                        setFatalError({
                            title: 'Fatal error from ' + message.location,
                            message: message.error.message,
                            details: message.error.details || 'You may need to consult the browser log for additional information',
                            advice: message.error.advice
                        });
                        renderUI();
                    });
                    widget.start({
                            node: ui.getElement(['edit-object-selector', 'widget']),
                            appSpec: env.appSpec,
                            selectedSet: editorState.getItem('current.set.ref')
                        })
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
            return Promise.try(function() {
                    var currentEditorSetInfo = editorState.getItem('current.set.info');

                    if (!currentEditorSetInfo) {
                        // nothing being edited.
                        fsm.updateState({
                            mode: 'new'
                        });
                        return null;
                    }

                    return validateModel()
                        .then(function(result) {
                            // we have a tree of validations, so we need to walk the tree to see if anything
                            // does not validate.
                            var messages = gatherValidationMessages(result);


                            if (messages.length === 0) {
                                buildPython();
                                // fsm.updateState({ params: 'complete' });
                                // dumb, but gotta get it working...
                                fsm.newState({
                                    mode: 'editing',
                                    params: 'complete',
                                    data: 'changed'
                                });
                            } else {
                                resetPython(cell);
                                // fsm.newState({ mode: 'editing', params: 'incomplete', data: 'changed' });
                                //fsm.updateState({ params: 'incomplete' });
                                fsm.newState({
                                    mode: 'editing',
                                    params: 'incomplete',
                                    data: 'changed'
                                });
                            }
                        });

                })
                .then(function() {
                    renderUI();
                })
                .catch(function(err) {
                    alert('internal error'),
                        console.error('INTERNAL ERROR', err);
                });
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

        // LIFECYCLE

        function registerEvents() {
            bus.on('toggle-code-view', function() {
                var showing = toggleCodeInputArea(),
                    label = showing ? 'Hide Code' : 'Show Code';
                ui.setButtonLabel('toggle-code-view', label);
            });
            bus.on('show-notifications', function() {
                doShowNotifications();
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
                    setStatus(div([
                        p('Error! result message is not from the generated code!'),
                        p(['Sent ', editorState.getItem('editorState.currentRunId'), ' received ', message.address.run_id])
                    ]));
                    return;
                }
                if (message.message.result) {
                    setStatus('Successfully saved the reads set');
                    editorState.setItem('editorState.touched', false);
                    editorState.setItem('editorState.changed', false);
                    fsm.newState({
                        mode: 'editing',
                        params: 'complete',
                        data: 'clean'
                    });
                    renderUI();

                    // Now we need to reload the editor with the NEW item.
                    editorState.setItem('current.set.ref', message.message.result.set_ref);
                    var objectInfo = serviceUtils.objectInfoToObject(message.message.result.set_info);
                    editorState.setItem('current.set.info', objectInfo);
                    JupyterProxy.saveNotebook();
                    // ui.setContent('editor.widget', html.loading('Loading saved Reads Set'));

                    return doEditObject(objectInfo);
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
        }

        function loadSpec() {
            return new Promise(function(resolve) {
                require(['./spec'], function(editorSpec) {
                    var spec = Spec.make({
                        spec: editorSpec
                    });
                    resolve(spec);
                });
            });
        }

        function start(arg) {

            // Set up the top level DOM node and build the layout.
            hostNode = arg.node;
            container = hostNode.appendChild(document.createElement('div'));
            ui = Ui.make({
                node: container,
                bus: bus
            });

            var events = Events.make({
                node: container
            });
            container.innerHTML = buildLayout(events);
            events.attachEvents();

            initializeFSM();
            initCodeInputArea();

            return loadSpec()
                .then(function(loadedSpec) {
                    spec = loadedSpec;
                    registerEvents();
                    showCodeInputArea();
                    return syncAppSpec(arg.appId, arg.appTag)
                })
                .then(function() {
                    // Should not need to do this each time...
                    var appRef = [editorState.getItem('app').id, editorState.getItem('app').tag].filter(toBoolean).join('/');
                    var url = '/#appcatalog/app/' + appRef;
                    utils.setCellMeta(cell, 'kbase.attributes.title', env.appSpec.info.name);
                    utils.setCellMeta(cell, 'kbase.attributes.subtitle', env.appSpec.info.subtitle);
                    utils.setCellMeta(cell, 'kbase.attributes.info.url', url);
                    utils.setCellMeta(cell, 'kbase.attributes.info.label', 'more...');

                    return loadEditObjectSelector();
                })
                .then(function() {
                    // only load the editor up if we have an existing set.
                    // NEW: get the most recent one, not just the most recently selected one.
                    if (editorState.getItem('current.set.info')) {
                        console.log('START() -- LOADING OBJECT IN editor');
                        return doEditObject(editorState.getItem('current.set.info'));
                    } else {
                        return doShowWidget(MessageWidget, {
                            content: div({
                                style: {
                                    textAlign: 'center'
                                }
                            }, 'No reads set selected. Please use the "Select Object to Edit" section above to create or edit a Reads Set.')
                        });
                    }
                })
                .then(function() {
                    // this will not change, so we can just render it here.
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

        function stop() {
            return Promise.try(function() {
                return Promise.all(Object.keys(widgets).map(function(key) {
                    return widgets[key].stop();
                }));
                // busConnection.top();
            });
        }

        // INIT

        model = Props.make({
            data: {},
            onUpdate: function(props) {
                renderUI();
            }
        });

        editorState = Props.make({
            data: utils.getCellMeta(cell, 'kbase.editorCell'),
            onUpdate: function(props) {
                utils.setCellMeta(cell, 'kbase.editorCell', props.getRawObject());
                renderUI();
            }
        });

        return {
            start: start,
            stop: stop
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