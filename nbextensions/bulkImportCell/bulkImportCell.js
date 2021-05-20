define([
    'uuid',
    'util/icon',
    'common/busEventManager',
    'common/events',
    'common/html',
    'common/jobManager',
    'common/jobs',
    'common/props',
    'common/runtime',
    'common/spec',
    'common/ui',
    'common/utils',
    'common/pythonInterop',
    'base/js/namespace',
    'kb_service/client/workspace',
    './tabs/configure',
    'common/cellComponents/cellControlPanel',
    'common/cellComponents/cellTabs',
    'common/cellComponents/fsmBar',
    'common/cellComponents/tabs/infoTab',
    'common/cellComponents/tabs/jobStatus/jobStatusTab',
    'common/cellComponents/tabs/results/resultsTab',
    './bulkImportCellStates',
], (
    Uuid,
    Icon,
    BusEventManager,
    Events,
    html,
    JobManager,
    Jobs,
    Props,
    Runtime,
    Spec,
    UI,
    Utils,
    PythonInterop,
    Jupyter,
    Workspace,
    ConfigureWidget,
    CellControlPanel,
    CellTabs,
    FSMBar,
    InfoTabWidget,
    JobStatusTabWidget,
    ResultsWidget,
    States
) => {
    'use strict';
    const CELL_TYPE = 'app-bulk-import';

    const div = html.tag('div'),
        p = html.tag('p'),
        cssCellType = 'kb-bulk-import';

    function DefaultWidget() {
        function make() {
            function start() {
                alert('starting default widget');
                return Promise.resolve();
            }

            function stop() {
                return Promise.resolve();
            }

            return {
                start: start,
                stop: stop,
            };
        }
        return {
            make: make,
        };
    }

    /**
     * This class creates and manages the bulk import cell. This works with, and wraps around,
     * the Jupyter Cell object.
     *
     * This follows a factory pattern. The factory does the work of initializing the bulk import
     * cell module. It modifies the cell metadata, if the initialize parameter is truthy, and
     * extends the cell object to do things we need it to, like respond to minimization requests
     * and render its icon. This modification also includes the contents of importData if
     * present.
     *
     * The common usage of this module, when imported, should be:
     * BulkImportCell.make({
     *   cell: myJupyterCell,
     *   initialize: true (if creating a new one from scratch),
     *   importData: {
     *     file_type: {
     *          files: ['array', 'of', 'files'],
     *          appId: 'importAppId'
     *     },
     *     file_type_2: {
     *          files: ['array', 'of', 'files'],
     *          appId: 'importAppId2'
     *     }
     *   },
     *   specs: {
     *      importAppId: { app spec },
     *      importAppId2: { app spec }
     *   }
     * })
     * @param {object} options - these are the options passed to the factory, with the following
     * expected properties:
     *  - cell - a Jupyter notebook cell. This should be a code cell, and will throw
     *    an Error if it is not.
     *  - initialize - boolean - if true, this will initialize the bulk import cell
     *    structure that gets serialized in the cell metadata. This should ONLY be set true when
     *    creating a new bulk import cell, not loading a narrative that already contains one.
     *
     *    If initialize is falsy, no changes are made to the structure, even if importData is
     *    present and contains new data.
     *  - importData - object - keys = data type strings, values = structure with these keys:
     *      - appId - the app spec id for that importer
     *      - files - the array of files of that type to import using the proper app
     *    e.g.:
     *    {
     *      fastq_reads: {
     *          appId: 'SomeImportModule/some_importer_app,
     *          files: ['file1.fq', 'file2.fq']
     *      }
     *    }
     *  - specs - object - keys = app ids, values = app specs as described by the Narrative Method
     *    Store service.
     */
    function BulkImportCell(options) {
        if (options.cell.cell_type !== 'code') {
            throw new Error('Can only create Bulk Import Cells out of code cells!');
        }

        const cell = options.cell,
            runtime = Runtime.make(),
            busEventManager = BusEventManager.make({
                bus: runtime.bus(),
            }),
            typesToFiles = setupFileData(options.importData),
            workspaceClient = getWorkspaceClient(),
            tabSet = {
                selected: 'configure',
                tabs: {
                    configure: {
                        label: 'Configure',
                        widget: ConfigureWidget,
                    },
                    viewConfigure: {
                        label: 'View Configure',
                        widget: DefaultWidget(),
                    },
                    info: {
                        label: 'Info',
                        widget: InfoTabWidget,
                    },
                    jobStatus: {
                        label: 'Job Status',
                        widget: JobStatusTabWidget,
                    },
                    results: {
                        label: 'Result',
                        widget: ResultsWidget,
                    },
                    error: {
                        label: 'Error',
                        type: 'danger',
                        widget: DefaultWidget(),
                    },
                },
            },
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
            };
        let runStatusListener = null, // only used while listening for the jobs to start
            readOnly = false,
            kbaseNode = null, // the DOM element used as the container for everything in this cell
            cellBus = null, // the parent cell bus that gets external messages
            controllerBus = null, // the main bus for this cell and its children
            ui = null,
            tabWidget = null; // the widget currently in view
        // widgets this cell owns
        let cellTabs, controlPanel, jobManager;

        if (options.initialize) {
            initialize(options.specs);
        }

        const model = Props.make({
                data: Utils.getMeta(cell, 'bulkImportCell'),
                onUpdate: function (props) {
                    Utils.setMeta(cell, 'bulkImportCell', props.getRawObject());
                },
            }),
            // These are the processed Spec object with proper layout order, etc.
            specs = {};
        // gets updated in total later by updateState
        let state = getInitialState();

        for (const [appId, appSpec] of Object.entries(model.getItem('app.specs'))) {
            specs[appId] = Spec.make({ appSpec });
        }

        setupCell();

        /**
         * If importData exists, and has the right structure, use it.
         * If not, and there's input data in the metadata, use that.
         * If not, and there's nothing? throw an error.
         * @param {object} importData
         */
        function setupFileData(importData) {
            if (importData && Object.keys(importData).length) {
                return importData;
            }
            const metaInputs = Utils.getCellMeta(cell, 'kbase.bulkImportCell.inputs');
            if (metaInputs && Object.keys(metaInputs).length) {
                return metaInputs;
            }
            throw new Error('No files were selected to upload!');
        }

        /**
         * Filters the app spec's parameters into two separate arrays and return them
         * as a single array of arrays.
         * The first has the "file param" ids - these are the parameters that include
         * file paths that come from the FTP file staging area (i.e. dynamic dropdown
         * inputs that get their data from the "ftp_staging" source) and the final
         * data object name that they should use.
         * The second is all other params: those parameters that are meant to
         * cover all input data files, i.e. source format.
         * Note that this is intended to be used as part of the cell initialization. At
         * that point, we haven't processed the app specs yet, so we don't know the
         * proper order to lay these out in. Thus, consider the returned arrays unordered.
         * @param {object} appSpec - a plain app spec (not processed by the Spec module)
         * @returns an array with two elements. The first is an array of file parameter
         *   ids, an the second is an array with all other parameter ids.
         */
        function filterFileParameters(appSpec) {
            const fileParams = appSpec.parameters.filter((param) => {
                if (param.text_options && param.text_options.is_output_name) {
                    return true;
                }
                return (
                    param.dynamic_dropdown_options &&
                    param.dynamic_dropdown_options.data_source === 'ftp_staging'
                );
            });
            const allParamIds = appSpec.parameters.map((param) => param.id);
            const fileParamIds = fileParams.map((param) => param.id);
            const fileParamIdSet = new Set(fileParamIds); // for the efficient has() function
            const nonFileParamIds = allParamIds.filter((id) => !fileParamIdSet.has(id));
            return [fileParamIds, nonFileParamIds];
        }

        /**
         * Does the initial pass on newly created cells to initialize its metadata and get it
         * set up for a new life as a Bulk Import Cell.
         * @param {object} appSpecs - a mapping from app id -> app specs as defined by the
         *  Narrative Method Store service
         */
        function initialize(appSpecs) {
            /* Initialize the parameters section.
             * This is broken down per-app, and here we use the file type
             * as the key.
             * So we need to filter through the parameters section of each spec,
             * generate the parameter ids, and make a structure like:
             * {
             *   fileType1: {
             *      params: {
             *          param1: '' or default from spec,
             *          param2: '' or default from spec,
             *          ...etc.
             *      },
             *      filePaths: [{
             *
             *      }],
             *   fileType2: {...}
             * }
             *
             */
            const initialParams = {},
                fileParamIds = {},
                otherParamIds = {},
                initialParamStates = {};
            /* Initialize the parameters set.
             * Get the app spec and split the set of parameters into filePaths and params.
             * Each input file (typesToFiles[fileType].files) gets its own set of filePath
             * parameters.
             * TODO: figure a good way to initialize these with one file use per param file row.
             */
            Object.keys(typesToFiles).forEach((fileType) => {
                const spec = appSpecs[typesToFiles[fileType].appId];
                initialParams[fileType] = {
                    filePaths: [],
                    params: {},
                };
                initialParamStates[fileType] = 'incomplete';
                [fileParamIds[fileType], otherParamIds[fileType]] = filterFileParameters(spec);
                initialParams[fileType].filePaths = typesToFiles[fileType].files.map(
                    (inputFile) => {
                        return fileParamIds[fileType].reduce((fileParams, paramId) => {
                            fileParams[paramId] = inputFile;
                            return fileParams;
                        }, {});
                    }
                );
                spec.parameters.forEach((param) => {
                    if (otherParamIds[fileType].includes(param.id)) {
                        initialParams[fileType].params[param.id] = param.default_values[0];
                    }
                });
            });
            const meta = {
                kbase: {
                    attributes: {
                        id: new Uuid(4).format(),
                        status: 'new',
                        created: new Date().toUTCString(),
                        title: 'Import from Staging Area',
                        subtitle: 'Import files into your Narrative as data objects',
                    },
                    type: CELL_TYPE,
                    bulkImportCell: {
                        'user-settings': {
                            showCodeInputArea: false,
                        },
                        inputs: typesToFiles,
                        params: initialParams,
                        app: {
                            fileParamIds: fileParamIds,
                            otherParamIds: otherParamIds,
                            specs: appSpecs,
                            tag: 'release',
                        },
                        state: {
                            state: 'editingIncomplete',
                            selectedTab: 'configure',
                            selectedFileType: Object.keys(typesToFiles)[0],
                            params: initialParamStates,
                        },
                    },
                },
            };
            cell.metadata = meta;
        }

        /**
         * This specializes this BulkImportCell's existing Jupyter Cell object to have several
         * extra functions that the Narrative can call.
         */
        function specializeCell() {
            // minimizes the cell
            cell.minimize = function () {
                const inputArea = this.input.find('.input_area').get(0),
                    outputArea = this.element.find('.output_wrapper'),
                    viewInputArea = this.element.find(
                        '[data-subarea-type="bulk-import-cell-input"]'
                    ),
                    showCode = Utils.getCellMeta(
                        cell,
                        'kbase.bulkImportCell.user-settings.showCodeInputArea'
                    );

                if (showCode) {
                    inputArea.classList.remove('-show');
                }
                outputArea.addClass('hidden');
                viewInputArea.addClass('hidden');
            };

            // maximizes the cell
            cell.maximize = function () {
                const inputArea = this.input.find('.input_area').get(0),
                    outputArea = this.element.find('.output_wrapper'),
                    viewInputArea = this.element.find(
                        '[data-subarea-type="bulk-import-cell-input"]'
                    ),
                    showCode = Utils.getCellMeta(
                        cell,
                        'kbase.bulkImportCell.user-settings.showCodeInputArea'
                    );

                if (showCode) {
                    if (!inputArea.classList.contains('-show')) {
                        inputArea.classList.add('-show');
                        cell.code_mirror.refresh();
                    }
                }
                outputArea.removeClass('hidden');
                viewInputArea.removeClass('hidden');
            };

            // returns a DOM node with an icon to be rendered elsewhere
            cell.getIcon = function () {
                return Icon.makeToolbarGenericIcon('upload', '#bf6c97');
            };

            // this renders the cell's icon in its toolbar
            cell.renderIcon = function () {
                const iconNode = this.element[0].querySelector(
                    '.celltoolbar [data-element="icon"]'
                );
                if (iconNode) {
                    iconNode.innerHTML = this.getIcon();
                }
            };
        }

        /**
         * Initializes the base BulkImportCell's message bus and binds responses to external messages.
         */
        function setupMessageBus() {
            cellBus = runtime.bus().makeChannelBus({
                name: {
                    cell: Utils.getMeta(cell, 'attributes', 'id'),
                },
                description: 'parent bus for BulkImportCell',
            });
            busEventManager.add(cellBus.on('delete-cell', () => deleteCell()));
            controllerBus = runtime.bus().makeChannelBus({
                description: 'An app cell widget',
            });
            controllerBus.on('update-param-state', () => {
                const curState = model.getItem('state.state');
                if (['editingComplete', 'editingIncomplete'].includes(curState)) {
                    updateEditingState();
                }
            });
        }

        function handleRunStatus(message) {
            switch (message.event) {
                case 'launched_job_batch':
                    // remove any existing jobs
                    jobManager.initBatchJob(message);
                    updateState('inProgress');
                    // TODO: remove when job management is sorted out
                    toggleTab('jobStatus');
                    break;
                case 'error':
                    updateState('appError');
                    break;
                default:
                    console.warn(`Unknown run-status event ${message.event}!`);
                    updateState('generalError');
                    break;
            }
        }

        /**
         * This will toggle the cell to either the editingComplete or editingIncomplete state,
         * based on the ready state of each filetype.
         */
        function updateEditingState() {
            let cellReady = true;
            for (const _state of Object.values(model.getItem('state.params'))) {
                if (_state !== 'complete') {
                    cellReady = false;
                    break;
                }
            }
            const uiState = cellReady ? 'editingComplete' : 'editingIncomplete';
            updateState(uiState);
            if (cellReady) {
                buildPythonCode();
            } else {
                clearPythonCode();
            }
        }

        function buildPythonCode() {
            const runId = new Uuid(4).format(),
                cellId = Utils.getMeta(cell, 'attributes', 'id'),
                appInfos = [],
                inputs = model.getItem('inputs'),
                params = model.getItem('params'),
                appSpecs = model.getItem('app.specs');
            /* appInfo should look like:
             * [{
             *   app_id: string,
             *   version: string,
             *   tag: string
             *   params: [{ set of params for individual run }]
             * }]
             */
            Object.keys(inputs).forEach((fileType) => {
                const appSpecInfo = appSpecs[inputs[fileType].appId].full_info;
                const appInfo = {
                    app_id: appSpecInfo.id,
                    tag: 'release',
                    version: appSpecInfo.ver,
                    params: params[fileType].filePaths.map((filePathParams) => {
                        return Object.assign({}, filePathParams, params[fileType].params);
                    }),
                };
                appInfos.push(appInfo);
            });

            const code = PythonInterop.buildBulkAppRunner(cellId, runId, appInfos);
            cell.set_text(code);
        }

        function clearPythonCode() {
            cell.set_text('');
        }

        /**
         * Initializes the DOM node (kbaseNode) for rendering.
         */
        function setupDomNode() {
            kbaseNode = document.createElement('div');
            kbaseNode.classList.add(`${cssCellType}__base-node`);
            kbaseNode.setAttribute('data-subarea-type', 'bulk-import-cell-input');
            // inserting after, with raw dom, means telling the parent node
            // to insert a node before the node following the one we are
            // referencing. If there is no next sibling, the null value
            // causes insertBefore to actually ... insert at the end!
            cell.input[0].parentNode.insertBefore(kbaseNode, cell.input[0].nextSibling);

            ui = UI.make({
                node: kbaseNode,
                bus: cellBus,
            });
        }

        /**
         * This sets up the bulk import components.
         * This should only be called after a Bulk Import cell is initialized structurally -
         * i.e. if a new one is created, or if a page is loaded that already has one.
         */
        function setupCell() {
            if (!isBulkImportCell(cell)) {
                throw new Error('Can only set up real bulk import cells');
            }

            // set up various cell function extensions
            specializeCell();

            // set up the message bus and bind various commands
            setupMessageBus();
            setupDomNode();

            // initialise the job manager
            jobManager = new JobManager({
                model: model,
                bus: runtime.bus(),
                viewResultsFunction: () => {
                    toggleTab('results');
                },
            });

            // finalize by updating the lastLoaded attribute, which triggers a toolbar re-render
            const meta = cell.metadata;
            meta.kbase.attributes.lastLoaded = new Date().toUTCString();
            cell.metadata = meta;
            render().then(() => {
                // add in the control panel so we can update the job status in the cell header
                jobManager.addUpdateHandler({
                    controlPanel: (updatedModel) => {
                        // Update the execMessage panel with details of the active jobs
                        controlPanel.setExecMessage(
                            Jobs.createCombinedJobState(updatedModel.getItem('exec.jobs.byStatus'))
                        );
                    },
                });
                // populate the execMessage with the current job state
                jobManager.runUpdateHandlers();

                cell.renderMinMax();
                // force toolbar refresh
                // eslint-disable-next-line no-self-assign
                cell.metadata = cell.metadata;
                updateState();
                runTab(state.tab.selected);
            });
        }

        function getWorkspaceClient() {
            return new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken(),
            });
        }

        /**
         * Should do the following steps:
         * 1. if there's a tab showing, stop() it and detach it
         * 2. update the tabs state to be selected
         * @param {string} tab id of the tab to display
         */
        function toggleTab(tab) {
            // if we're toggling the currently selected tab off,
            // then it should be turned off.
            if (tab === state.tab.selected && tab !== null) {
                tab = null;
            }
            state.tab.selected = tab;
            return stopWidget().then(() => {
                if (tab !== null) {
                    runTab(tab);
                }
                model.setItem('state.selectedTab', tab);
                cellTabs.setState(state.tab);
            });
        }

        function stopWidget() {
            if (tabWidget === null) {
                return Promise.resolve();
            }
            return tabWidget.stop().then(() => {
                const widgetNode = ui.getElement('widget');
                if (widgetNode.firstChild) {
                    widgetNode.removeChild(widgetNode.firstChild);
                }
                ui.getElement('body.tab-pane').setAttribute('data-active-tab', '');
            });
        }

        /**
         * Initializes a tab and runs its associated widget.
         * This doesn't change any state, just runs what it's told to,
         * and returns the widget's start() Promise.
         * @param {string} tab
         */
        function runTab(tab) {
            tabWidget = tabSet.tabs[tab].widget.make({
                bus: controllerBus,
                cell,
                jobId: undefined,
                jobManager,
                model,
                specs,
                typesToFiles,
                workspaceClient,
            });

            ui.getElement('body.tab-pane').setAttribute('data-active-tab', tab);

            return tabWidget.start({
                node: ui.getElement('body.tab-pane.widget'),
                currentApp: typesToFiles[model.getItem('state.selectedFileType')].appId,
            });
        }

        /**
         * @param {string} action
         * @returns
         */
        function runAction(action) {
            if (readOnly) {
                console.warn('ignoring attempted action in readonly mode');
                return;
            }
            switch (action) {
                case 'runApp':
                    doRunCellAction();
                    break;
                case 'cancel':
                    doCancelCellAction();
                    break;
                case 'reRunApp':
                    // TODO implement
                    alert('re-running app');
                    break;
                case 'resetApp':
                    // TODO implement
                    alert('resetting app');
                    break;
                case 'offline':
                    // TODO implement / test better
                    alert('currently disconnected from the server');
                    break;
                default:
                    alert(`Unknown command ${action}`);
                    break;
            }
        }

        /**
         * Starts the cell by executing the generated code in its input area.
         * Then changes the global cell state to "launching".
         */
        function doRunCellAction() {
            runStatusListener = cellBus.on('run-status', handleRunStatus);
            busEventManager.add(runStatusListener);
            cell.execute();
            updateState('launching');
        }

        /**
         * Globally cancels all running jobs and the run status by the following steps.
         * 1. If we've clicked run, but we don't have any jobs yet, just remove the
         *    listener and ignore the jobs.
         *    //TODO: make this wait for jobs to start first, then cancel them all in turn?
         *      or set up some state that we catch jobs when they appear and THEN cancel them?
         *      Maybe send a kernel message to stop all jobs with this run id?
         * 2. If we have a list of jobs, cancel them all.
         * 3. Return to the editing state, trigger updateEditingState.
         */
        async function doCancelCellAction() {
            if (runStatusListener !== null) {
                const dialogArgs = {
                    title: 'Cancel job batch?',
                    body: div([
                        p([
                            'Canceling the job will halt any currently running jobs. ',
                            'Any output objects already created will remain in your narrative and can be removed from the Data panel.',
                        ]),
                        p('Continue to Cancel the running job batch?'),
                    ]),
                };

                const confirmed = await UI.showConfirmDialog(dialogArgs);
                if (!confirmed) {
                    return;
                }
                busEventManager.remove(runStatusListener);
            } else {
                await jobManager.cancelJobsByStatus(['created', 'estimating', 'queued', 'running']);
            }
            updateEditingState();
        }

        /**
         * Deletes the cell from the notebook after doing internal cleanup.
         */
        function deleteCell() {
            busEventManager.removeAll();
            const cellIndex = Jupyter.notebook.find_cell_index(cell);
            Jupyter.notebook.delete_cell(cellIndex);
        }

        /**
         * Returns a structured initial view state of the cell. This includes
         * the availability / visibility of the various UI elements.
         *
         * This needs to be run after setting up the data model. It uses
         * that to get the initial state, but defaults to the "editingIncomplete"
         * state if that's not available.
         */
        function getInitialState() {
            // load current state from state list
            // modify to handle file types panel
            const defaultState = 'editingIncomplete';
            let currentState = model.getItem('state.state');
            if (!currentState || !(currentState in States)) {
                currentState = defaultState;
            }
            const uiState = States[currentState].ui;
            uiState.tab.selected = model.getItem('state.selectedTab', 'configure');
            return uiState;
        }

        /**
         * Passes the updated state to various widgets, and serialize it in
         * the cell metadata, where appropriate.
         * @param {string} newUiState - change to a new UI state, if defined.
         */
        function updateState(newUiState) {
            if (newUiState && newUiState in States) {
                const stateDiff = Object.assign({}, States[newUiState].ui);
                model.setItem('state.state', newUiState);
                // update selections
                stateDiff.tab.selected = state.tab.selected;
                stateDiff.selectedFileType = state.selectedFileType;
                state = stateDiff;
            }
            cellTabs.setState(state.tab);
            controlPanel.setActionState(state.action);
            // TODO: add in the FSM state
            FSMBar.showFsmBar({
                ui: ui,
                state: {},
                job: model.getItem('exec.jobState'),
            });
        }

        /**
         * This builds the cell control panel, which includes the action button.
         * It gets stored in the internal controlPanel variable.
         * This returns the DOM layout that the controlPanel creates.
         * @param {Events} events - the events manager that should be used for laying out
         * the button
         */
        function buildControlPanel(events) {
            controlPanel = CellControlPanel.make({
                bus: cellBus,
                ui: ui,
                action: {
                    runAction: runAction.bind(this),
                    actions: actionButtons,
                },
            });
            return controlPanel.buildLayout(events);
        }

        /**
         * Builds the tab component and starts it up attached to the node.
         * This passes along the cellBus and set of tabs known by this cell.
         * @param {DOMElement} node - the node that should be used for the tabs
         */
        function buildTabs(node) {
            cellTabs = CellTabs.make({
                bus: cellBus,
                toggleAction: toggleTab,
                tabs: tabSet,
            });

            return cellTabs.start({
                node: node,
            });
        }

        /**
         * Renders the initial layout structure for the cell.
         * This returns an object with the created events and DOM content
         */
        function renderLayout() {
            const events = Events.make(),
                content = div(
                    {
                        class: `${cssCellType}__layout_container kbase-extension`,
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
                                class: `${cssCellType}__body container-fluid`,
                                dataElement: 'body',
                            },
                            [
                                buildControlPanel(events),
                                div(
                                    {
                                        class: `${cssCellType}__tab_pane`,
                                        dataElement: 'tab-pane',
                                    },
                                    [
                                        div({
                                            class: `${cssCellType}__tab_pane_widget`,
                                            dataElement: 'widget',
                                        }),
                                    ]
                                ),
                            ]
                        ),
                    ]
                );
            return {
                content: content,
                events: events,
            };
        }

        /**
         * Renders the view. This does the work of building the left column, tabs, and
         * action button components and activating them all.
         */
        function render() {
            const layout = renderLayout();
            kbaseNode.innerHTML = layout.content;
            return buildTabs(ui.getElement('body.run-control-panel.toolbar')).then(() => {
                layout.events.attachEvents(kbaseNode);
            });
        }

        /**
         * The factory returns an accessor to the underlying Jupyter cell, and the
         * deleteCell function. Everything else should just run internally.
         */
        return {
            cell,
            deleteCell,
        };
    }

    /**
     * Returns true if the given cell should be treated as a bulk import cell
     * @param {Cell} cell - a Jupyter Notebook cell
     */
    function isBulkImportCell(cell) {
        if (cell.cell_type !== 'code' || !cell.metadata.kbase) {
            return false;
        }
        return cell.metadata.kbase.type === CELL_TYPE;
    }

    return {
        make: BulkImportCell,
        isBulkImportCell,
    };
});
