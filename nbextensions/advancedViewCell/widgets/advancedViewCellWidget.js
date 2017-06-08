/*global define*/
/*jslint white:true,browser:true*/

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
    './advancedViewCellWidget-fsm',
    'css!google-code-prettify/prettify.css',
    'css!font-awesome.css'
], function (
    $,
    Promise,
    Uuid,
    JupyterNamespace,
    Runtime,
    Events,
    html,
    Props,
    Jupyter,
    BusEventManager,
    NarrativeMethodStore,
    Workspace,
    PythonInterop,
    utils,
    Ui,
    Fsm,
    Spec,
    PR,
    appStates
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
        img = t('img');

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
                .then(function (data) {
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

        function showFatalError(arg) {
            ui.showElement('fatal-error');
        }

        function toBoolean(value) {
            if (value && value !== null) {
                return true;
            }
            return false;
        }

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
                outputWidgetState = utils.getCellMeta(cell, 'viewCell.outputWidgetState') || null,
                code = PythonInterop.buildAdvancedViewRunner(cellId, runId, app, params, outputWidgetState);
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

        function renderLayout() {

            var readOnlyStyle = {};
            if (JupyterNamespace.narrative.readonly) {
                readOnlyStyle.display = 'none';
            }
            var events = Events.make(),
                configureId = html.genId(),
                content = div({
                    class: 'kbase-extension kb-app-cell',
                    style: {
                        display: 'flex',
                        alignItems: 'stretch'
                    }
                }, [
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
                                    // title: 'Input ' + span({ class: 'fa fa-arrow-right' }),
                                    id: configureId,
                                    title: 'Configure ' + span({class: 'fa fa-cogs'}),
                                    name: 'parameters-group',
                                    hidden: false,
                                    collapsed: utils.getCellMeta(cell, 'kbase.viewCell.user-settings.collapsedConfigurePanel', false),
                                    type: 'default',
                                    classes: ['kb-panel-container'],
                                    body: div([
                                        div({
                                            dataElement: 'widget' 
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
                                })
                            ])
                        ])
                    ])
                ]);
            container.innerHTML = content;
            events.attachEvents(container);
            $('#' + configureId + ' .collapse').on('hidden.bs.collapse', function() {
                utils.setCellMeta(cell, 'kbase.viewCell.user-settings.collapsedConfigurePanel', true);
            });
            $('#' + configureId + ' .collapse').on('shown.bs.collapse', function() {
                utils.setCellMeta(cell, 'kbase.viewCell.user-settings.collapsedConfigurePanel', false);
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
                .then(function (confirmed) {
                    if (!confirmed) {
                        return;
                    }

                    bus.emit('stop');

                    Jupyter.deleteCell(cell);
                });
        }

        function doRun() {
            ui.collapsePanel('parameters-group');
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

                renderLayout();


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
                bus.on('run-app', function () {
                    doRun();
                });

                bus.on('sync-all-display-parameters', function () {
                    widgets.paramsDisplayWidget.bus.emit('sync-all-parameters');
                });

                // Events from widgets...

                parentBus.on('reset-to-defaults', function () {
                    bus.emit('reset-to-defaults');
                });

                cellBus = runtime.bus().makeChannelBus({
                    name: {
                        cell: Props.getDataItem(cell.metadata, 'kbase.attributes.id')
                    },
                    description: 'A cell channel'
                });

                eventManager.add(cellBus.on('delete-cell', function () {
                    doDeleteCell();
                }));

                eventManager.add(cellBus.on('metadata-changed', function () {
                    evaluateAppState();
                }));

                showCodeInputArea();

                return null;
            });
        }

        function exportParams() {
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

                paramsToExport[key] = value;
            });

            return paramsToExport;
        }

        function loadInputWidget() {
            return new Promise(function (resolve, reject) {
                var selectedWidget = 'nbextensions/advancedViewCell/widgets/appParamsWidget';

                require([selectedWidget], function (Widget) {
                    // TODO: widget should make own bus.
                    var bus = runtime.bus().makeChannelBus({ description: 'Parent comm bus for input widget' }),
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
                        handle: function (message) {
                            return {
                                value: model.getItem(['params', message.parameterName])
                            };
                        }
                    });

                    bus.on('parameter-changed', function (message) {
                        // We simply store the new value for the parameter.
                        model.setItem(['params', message.parameter], message.newValue);
                        evaluateAppState();
                    });
                    widget.start({
                            node: ui.getElement(['parameters-group', 'widget']),
                            appSpec: model.getItem('app.spec'),
                            parameters: spec.getSpec().parameters,
                            params: model.getItem('params')
                        })
                        .then(function () {
                            resolve();
                        });
                }, function (err) {
                    console.log('ERROR', err);
                    reject(err);
                });
            });
        }

        function makeIcon() {
            // icon is in the spec ...
            var appSpec = env.appSpec,
                nmsBase = runtime.config('services.narrative_method_store_image.url'),
                iconUrl = Props.getDataItem(appSpec, 'info.icon.url');

            if (iconUrl) {
                return span({ class: 'fa-stack fa-2x', style: { padding: '2px' } }, [
                    img({ src: nmsBase + iconUrl, style: { maxWidth: '46px', maxHeight: '46px', margin: '2px' } })
                ]);
            }

            return span({ style: '' }, [
                span({ class: 'fa-stack fa-2x', style: { textAlign: 'center', color: 'rgb(103,58,183)' } }, [
                    span({ class: 'fa fa-square fa-stack-2x', style: { color: 'rgb(103,58,183)' } }),
                    span({ class: 'fa fa-inverse fa-stack-1x fa-cube' })
                ])
            ]);
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

        function run(params) {
            // First get the app specs, which is stashed in the model,
            // with the parameters returned.
            return syncAppSpec(params.appId, params.appTag)
                .then(function () {
                    var appRef = [model.getItem('app.id'), model.getItem('app.tag')].filter(toBoolean).join('/'),
                        url = '/#appcatalog/app/' + appRef;
                    utils.setCellMeta(cell, 'kbase.attributes.title', model.getItem('app.spec.info.name'));
                    utils.setCellMeta(cell, 'kbase.attributes.subtitle', model.getItem('app.spec.info.subtitle'));
                    utils.setCellMeta(cell, 'kbase.attributes.info.url', url);
                    utils.setCellMeta(cell, 'kbase.attributes.info.label', 'more...');
                    return Promise.all([
                        loadInputWidget()
                    ]);
                })
                .then(function () {
                    // this will not change, so we can just render it here.
                    PR.prettyPrint(null, container);
                    renderUI();
                })
                .then(function () {
                    // if we start out in 'new' state, then we need to promote to
                    // editing...
                    if (fsm.getCurrentState().state.mode === 'new') {
                        fsm.newState({ mode: 'editing', params: 'incomplete' });
                        evaluateAppState();
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
                    fsm.newState({ mode: 'fatal-error' });
                    renderUI();
                });
        }

        // INIT

        model = Props.make({
            data: utils.getMeta(cell, 'viewCell'),
            onUpdate: function (props) {
                utils.setMeta(cell, 'viewCell', props.getRawObject());
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
            run: run
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
}, function (err) {
    console.error('ERROR loading viewCell viewCellWidget', err);
});