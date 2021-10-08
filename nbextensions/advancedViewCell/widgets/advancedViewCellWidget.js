define(
    [
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
        'common/cellUtils',
        'common/ui',
        'common/fsm',
        'common/spec',
        'google-code-prettify/prettify',
        './advancedViewCellWidget-fsm',
        'css!google-code-prettify/prettify.css',
        'css!font-awesome.css',
    ],
    (
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
    ) => {
        'use strict';
        const t = html.tag,
            div = t('div'),
            span = t('span'),
            a = t('a'),
            p = t('p'),
            table = t('table'),
            tr = t('tr'),
            th = t('th'),
            td = t('td');

        function factory(config) {
            let container, cellBus, fsm, ui;
            const workspaceInfo = config.workspaceInfo,
                runtime = Runtime.make(),
                cell = config.cell,
                parentBus = config.bus,
                // TODO: the cell bus should be created and managed through main.js,
                // that is, the extension.
                bus = runtime.bus().makeChannelBus({ description: 'A view cell widget' }),
                eventManager = BusEventManager.make({
                    bus: runtime.bus(),
                }),
                // HMM. Sync with metadata, or just keep everything there?
                settings = {
                    showAdvanced: {
                        label: 'Show advanced parameters',
                        defaultValue: false,
                        type: 'custom',
                    },
                    showNotifications: {
                        label: 'Show the notifications panel',
                        defaultValue: false,
                        type: 'toggle',
                        element: 'notifications',
                    },
                    showAboutApp: {
                        label: 'Show the About App panel',
                        defaultValue: false,
                        type: 'toggle',
                        element: 'about-app',
                    },
                },
                widgets = {},
                model = Props.make({
                    data: utils.getMeta(cell, 'viewCell'),
                    onUpdate: function (props) {
                        utils.setMeta(cell, 'viewCell', props.getRawObject());
                    },
                }),
                spec = Spec.make({
                    appSpec: model.getItem('app.spec'),
                });

            if (runtime.config('features.developer')) {
                settings.showDeveloper = {
                    label: 'Show developer features',
                    defaultValue: false,
                    type: 'toggle',
                    element: 'developer-options',
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
                const appRef = {
                        ids: [appId],
                        tag: appTag,
                    },
                    nms = new NarrativeMethodStore(
                        runtime.config('services.narrative_method_store.url'),
                        {
                            token: runtime.authToken(),
                        }
                    );

                return nms.get_method_spec(appRef).then((data) => {
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
                    case 'release': {
                        return {
                            id: app.id,
                            tag: app.tag,
                            version: app.version,
                        };
                    }
                    case 'beta':
                    case 'dev':
                        return {
                            id: app.id,
                            tag: app.tag,
                        };
                    default:
                        throw new Error('Invalid tag for app ' + app.id);
                }
            }

            function buildPython(cell, cellId, app, params) {
                const runId = new Uuid(4).format(),
                    fixedApp = fixApp(app),
                    outputWidgetState =
                        utils.getCellMeta(cell, 'viewCell.outputWidgetState') || null,
                    code = PythonInterop.buildAdvancedViewRunner(
                        cellId,
                        runId,
                        fixedApp,
                        params,
                        outputWidgetState
                    );
                cell.set_text(code);
            }

            function resetPython(_cell) {
                _cell.set_text('');
            }

            function initializeFSM() {
                let currentState = model.getItem('fsm.currentState');
                if (!currentState) {
                    currentState = { mode: 'new' };
                }
                fsm = Fsm.make({
                    states: appStates,
                    initialState: {
                        mode: 'new',
                    },
                    onNewState: function (fsm) {
                        model.setItem('fsm.currentState', fsm.getCurrentState().state);
                    },
                    bus: bus,
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
                const codeInputArea = cell.input.find('.input_area');
                if (model.getItem('user-settings.showCodeInputArea')) {
                    codeInputArea.removeClass('hidden');
                } else {
                    codeInputArea.addClass('hidden');
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

            function doRemoveNotification(index) {
                const notifications = model.getItem('notifications') || [];
                notifications.splice(index, 1);
                model.setItem('notifications', notifications);
                renderNotifications();
            }

            function renderNotifications() {
                const events = Events.make(),
                    notifications = model.getItem('notifications') || [],
                    content = notifications
                        .map((notification, index) => {
                            return div({ class: 'row' }, [
                                div({ class: 'col-md-10' }, notification),
                                div(
                                    { class: 'col-md-2', style: { textAlign: 'right' } },
                                    span({}, [
                                        a(
                                            {
                                                class: 'btn btn-default',
                                                id: events.addEvent({
                                                    type: 'click',
                                                    handler: function () {
                                                        doRemoveNotification(index);
                                                    },
                                                }),
                                            },
                                            'X'
                                        ),
                                    ])
                                ),
                            ]);
                        })
                        .join('\n');
                ui.setContent('notifications.content', content);
                events.attachEvents(container);
            }

            function addNotification(notification) {
                const notifications = model.getItem('notifications') || [];
                notifications.push(notification);
                model.setItem('notifications', notifications);
                renderNotifications();
            }

            /*
             *
             * Render the UI according to the FSM
             */
            function renderUI() {
                renderNotifications();
                const state = fsm.getCurrentState();

                // Button state
                state.ui.buttons.enabled.forEach((button) => {
                    ui.enableButton(button);
                });
                state.ui.buttons.disabled.forEach((button) => {
                    ui.disableButton(button);
                });

                // Element state
                state.ui.elements.show.forEach((element) => {
                    ui.showElement(element);
                });
                state.ui.elements.hide.forEach((element) => {
                    ui.hideElement(element);
                });
            }

            function renderLayout() {
                const readOnlyStyle = {};
                if (JupyterNamespace.narrative.readonly) {
                    readOnlyStyle.display = 'none';
                }
                const events = Events.make(),
                    configureId = html.genId(),
                    content = div(
                        {
                            class: 'kbase-extension kb-app-cell',
                            style: {
                                display: 'flex',
                                alignItems: 'stretch',
                            },
                        },
                        [
                            div(
                                {
                                    class: 'prompt',
                                    dataElement: 'prompt',
                                    style: {
                                        display: 'flex',
                                        alignItems: 'stretch',
                                        flexDirection: 'column',
                                    },
                                },
                                [div({ dataElement: 'status' })]
                            ),
                            div(
                                {
                                    class: 'body',
                                    dataElement: 'body',
                                    style: {
                                        display: 'flex',
                                        alignItems: 'stretch',
                                        flexDirection: 'column',
                                        flex: '1',
                                        width: '100%',
                                    },
                                },
                                [
                                    div(
                                        {
                                            dataElement: 'widget',
                                            style: { display: 'block', width: '100%' },
                                        },
                                        [
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
                                                                th('Title'),
                                                                td({ dataElement: 'title' }),
                                                                td(
                                                                    'Message',
                                                                    td({ dataElement: 'message' })
                                                                ),
                                                            ]),
                                                        ]),
                                                    ]),
                                                }),
                                                ui.buildCollapsiblePanel({
                                                    title: 'Notifications',
                                                    name: 'notifications',
                                                    hidden: true,
                                                    type: 'default',
                                                    classes: ['kb-panel-container'],
                                                    body: [div({ dataElement: 'content' })],
                                                }),
                                                ui.buildCollapsiblePanel({
                                                    id: configureId,
                                                    title:
                                                        'Configure ' +
                                                        span({ class: 'fa fa-cogs' }),
                                                    name: 'parameters-group',
                                                    hidden: false,
                                                    collapsed: utils.getCellMeta(
                                                        cell,
                                                        'kbase.viewCell.user-settings.collapsedConfigurePanel',
                                                        false
                                                    ),
                                                    type: 'default',
                                                    classes: ['kb-panel-container'],
                                                    body: div([
                                                        div({
                                                            dataElement: 'widget',
                                                        }),

                                                        div(
                                                            {
                                                                dataElement: 'availableActions',
                                                                style: readOnlyStyle,
                                                            },
                                                            [
                                                                div(
                                                                    {
                                                                        class: 'btn-toolbar kb-btn-toolbar-cell-widget',
                                                                    },
                                                                    [
                                                                        div(
                                                                            { class: 'btn-group' },
                                                                            [
                                                                                ui.makeButton(
                                                                                    'View',
                                                                                    'run-app',
                                                                                    {
                                                                                        events: events,
                                                                                        type: 'primary',
                                                                                    }
                                                                                ),
                                                                            ]
                                                                        ),
                                                                    ]
                                                                ),
                                                            ]
                                                        ),
                                                    ]),
                                                }),
                                            ]),
                                        ]
                                    ),
                                ]
                            ),
                        ]
                    );
                container.innerHTML = content;
                events.attachEvents(container);
                $('#' + configureId + ' .collapse').on('hidden.bs.collapse', () => {
                    utils.setCellMeta(
                        cell,
                        'kbase.viewCell.user-settings.collapsedConfigurePanel',
                        true
                    );
                });
                $('#' + configureId + ' .collapse').on('shown.bs.collapse', () => {
                    utils.setCellMeta(
                        cell,
                        'kbase.viewCell.user-settings.collapsedConfigurePanel',
                        false
                    );
                });
            }

            function doDeleteCell() {
                const content = div([
                    p([
                        'Deleting this cell will remove the data visualization, ',
                        'but will not delete the data object, which will still be available ',
                        'in the data panel.',
                    ]),
                    p('Continue to delete this data cell?'),
                ]);
                ui.showConfirmDialog({ title: 'Confirm Cell Deletion', body: content }).then(
                    (confirmed) => {
                        if (!confirmed) {
                            return;
                        }

                        bus.emit('stop');

                        Jupyter.deleteCell(cell);
                    }
                );
            }

            function doRun() {
                ui.collapsePanel('parameters-group');
                cell.execute();
            }

            // LIFECYCLE API

            function init() {
                return Promise.try(() => {
                    initializeFSM();
                    initCodeInputArea();
                    return null;
                });
            }

            function attach(node) {
                return Promise.try(() => {
                    container = node;
                    ui = Ui.make({
                        node: container,
                        bus: bus,
                    });

                    if (ui.isDeveloper()) {
                        settings.showDeveloper = {
                            label: 'Show developer features',
                            defaultValue: false,
                            type: 'toggle',
                            element: 'developer-options',
                        };
                    }

                    renderLayout();

                    return null;
                });
            }

            function start() {
                return Promise.try(() => {
                    /*
                     * listeners for the local input cell message bus
                     */

                    bus.on('toggle-code-view', () => {
                        const showing = toggleCodeInputArea(),
                            label = showing ? 'Hide Code' : 'Show Code';
                        ui.setButtonLabel('toggle-code-view', label);
                    });
                    bus.on('show-notifications', () => {
                        /* no op */
                    });
                    bus.on('edit-cell-metadata', () => {
                        doEditCellMetadata();
                    });
                    bus.on('edit-notebook-metadata', () => {
                        doEditNotebookMetadata();
                    });
                    bus.on('run-app', () => {
                        doRun();
                    });

                    bus.on('sync-all-display-parameters', () => {
                        widgets.paramsDisplayWidget.bus.emit('sync-all-parameters');
                    });

                    // Events from widgets...

                    parentBus.on('reset-to-defaults', () => {
                        bus.emit('reset-to-defaults');
                    });

                    cellBus = runtime.bus().makeChannelBus({
                        name: {
                            cell: Props.getDataItem(cell.metadata, 'kbase.attributes.id'),
                        },
                        description: 'A cell channel',
                    });

                    eventManager.add(
                        cellBus.on('delete-cell', () => {
                            doDeleteCell();
                        })
                    );

                    eventManager.add(
                        cellBus.on('metadata-changed', () => {
                            evaluateAppState();
                        })
                    );

                    showCodeInputArea();

                    return null;
                });
            }

            function exportParams() {
                const params = model.getItem('params'),
                    paramsToExport = {},
                    parameters = spec.getSpec().parameters;

                Object.keys(params).forEach((key) => {
                    const value = params[key],
                        paramSpec = parameters.specs[key];

                    if (!paramSpec) {
                        console.error(
                            'Parameter ' + key + ' is not defined in the parameter map',
                            parameters
                        );
                        throw new Error(
                            'Parameter ' + key + ' is not defined in the parameter map'
                        );
                    }

                    paramsToExport[key] = value;
                });

                return paramsToExport;
            }

            function loadInputWidget() {
                return new Promise((resolve, reject) => {
                    const selectedWidget = 'nbextensions/advancedViewCell/widgets/appParamsWidget';

                    require([selectedWidget], (Widget) => {
                        // TODO: widget should make own bus.
                        const bus = runtime.bus().makeChannelBus({
                                description: 'Parent comm bus for input widget',
                            }),
                            widget = Widget.make({
                                bus: bus,
                                workspaceInfo: workspaceInfo,
                            });
                        widgets.paramsInputWidget = {
                            path: ['parameters-group', 'widget'],
                            bus: bus,
                            instance: widget,
                        };
                        bus.on('parameter-sync', (message) => {
                            const value = model.getItem(['params', message.parameter]);
                            bus.send(
                                {
                                    parameter: message.parameter,
                                    value: value,
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

                        bus.on('sync-params', (message) => {
                            message.parameters.forEach((paramId) => {
                                bus.send(
                                    {
                                        parameter: paramId,
                                        value: model.getItem(['params', message.parameter]),
                                    },
                                    {
                                        key: {
                                            type: 'parameter-value',
                                            parameter: paramId,
                                        },
                                        channel: message.replyToChannel,
                                    }
                                );
                            });
                        });

                        bus.respond({
                            key: {
                                type: 'get-parameter',
                            },
                            handle: function (message) {
                                return {
                                    value: model.getItem(['params', message.parameterName]),
                                };
                            },
                        });

                        bus.on('parameter-changed', (message) => {
                            // We simply store the new value for the parameter.
                            model.setItem(['params', message.parameter], message.newValue);
                            evaluateAppState();
                        });
                        widget
                            .start({
                                node: ui.getElement(['parameters-group', 'widget']),
                                appSpec: model.getItem('app.spec'),
                                parameters: spec.getSpec().parameters,
                                params: model.getItem('params'),
                            })
                            .then(() => {
                                resolve();
                            });
                    }, (err) => {
                        console.error('ERROR', err);
                        reject(err);
                    });
                });
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

            function evaluateAppState() {
                validateModel()
                    .then((result) => {
                        // we have a tree of validations, so we need to walk the tree to see if anything
                        // does not validate.
                        const messages = gatherValidationMessages(result);

                        if (messages.length === 0) {
                            buildPython(
                                cell,
                                utils.getMeta(cell, 'attributes').id,
                                model.getItem('app'),
                                exportParams()
                            );
                            fsm.newState({ mode: 'editing', params: 'complete', code: 'built' });
                            renderUI();
                        } else {
                            resetPython(cell);
                            fsm.newState({ mode: 'editing', params: 'incomplete' });
                            renderUI();
                        }
                    })
                    .catch((err) => {
                        console.error('INTERNAL ERROR', err);
                    });
            }

            function run(params) {
                // First get the app specs, which is stashed in the model,
                // with the parameters returned.
                return syncAppSpec(params.appId, params.appTag)
                    .then(() => {
                        const appRef = [model.getItem('app.id'), model.getItem('app.tag')]
                                .filter((v) => !!v)
                                .join('/'),
                            url = '/#appcatalog/app/' + appRef;
                        utils.setCellMeta(
                            cell,
                            'kbase.attributes.title',
                            model.getItem('app.spec.info.name')
                        );
                        utils.setCellMeta(
                            cell,
                            'kbase.attributes.subtitle',
                            model.getItem('app.spec.info.subtitle')
                        );
                        utils.setCellMeta(cell, 'kbase.attributes.info.url', url);
                        utils.setCellMeta(cell, 'kbase.attributes.info.label', 'more...');
                        return Promise.all([loadInputWidget()]);
                    })
                    .then(() => {
                        // this will not change, so we can just render it here.
                        PR.prettyPrint(null, container);
                        renderUI();
                    })
                    .then(() => {
                        // if we start out in 'new' state, then we need to promote to
                        // editing...
                        if (fsm.getCurrentState().state.mode === 'new') {
                            fsm.newState({ mode: 'editing', params: 'incomplete' });
                            evaluateAppState();
                        }
                        renderUI();
                    })
                    .catch((err) => {
                        console.error('ERROR loading main widgets', err);
                        addNotification('Error loading main widgets: ' + err.message);
                        model.setItem('fatalError', {
                            title: 'Error loading main widgets',
                            message: err.message,
                        });
                        syncFatalError();
                        fsm.newState({ mode: 'fatal-error' });
                        renderUI();
                    });
            }

            // INIT

            return {
                init: init,
                attach: attach,
                start: start,
                run: run,
            };
        }

        return {
            make: function (config) {
                return factory(config);
            },
        };
    },
    (err) => {
        'use strict';
        console.error('ERROR loading viewCell viewCellWidget', err);
    }
);
