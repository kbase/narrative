define([
    'underscore',
    'uuid',
    'util/icon',
    'common/busEventManager',
    'common/dialogMessages',
    'common/events',
    'common/html',
    'common/jobManager',
    'common/jobs',
    'common/props',
    'common/runtime',
    'common/spec',
    'common/ui',
    'common/cellUtils',
    'util/appCellUtil',
    'util/string',
    'common/pythonInterop',
    'base/js/namespace',
    'kb_service/client/workspace',
    './tabs/configure',
    './tabs/multiAppInfo',
    'common/cellComponents/cellControlPanel',
    'common/cellComponents/cellTabs',
    'common/cellComponents/fsmBar',
    'common/cellComponents/tabs/jobStatus/jobStatusTab',
    'common/cellComponents/tabs/results/resultsTab',
    'common/errorDisplay',
    './bulkImportCellStates',
    'util/developerMode',
], (
    _,
    Uuid,
    Icon,
    BusEventManager,
    DialogMessages,
    Events,
    html,
    JobManagerModule,
    Jobs,
    Props,
    Runtime,
    Spec,
    UI,
    Utils,
    BulkImportUtil,
    StringUtil,
    PythonInterop,
    Jupyter,
    Workspace,
    ConfigureWidget,
    MultiAppInfoWidget,
    CellControlPanel,
    CellTabs,
    FSMBar,
    JobStatusTabWidget,
    ResultsWidget,
    ErrorTabWidget,
    States,
    DevMode
) => {
    'use strict';
    const { JobManager } = JobManagerModule;

    const CELL_TYPE = 'app-bulk-import';
    const div = html.tag('div'),
        cssCellType = 'kb-bulk-import';

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
     *          appId: 'importAppId',
     *          appParameters: [{ ... }]
     *     },
     *     file_type_2: {
     *          files: ['array', 'of', 'files'],
     *          appId: 'importAppId2',
     *          appParameters: [{ ... }]
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

        const developerMode = options.devMode || DevMode.mode;

        const cell = options.cell,
            runtime = Runtime.make(),
            busEventManager = BusEventManager.make({
                bus: runtime.bus(),
            }),
            typesToFiles = setupFileData(options.importData),
            { fileTypesDisplay, fileTypeMapping } =
                BulkImportUtil.generateFileTypeMappings(typesToFiles),
            workspaceClient = getWorkspaceClient(),
            tabSet = {
                selected: 'configure',
                tabs: {
                    configure: {
                        label: 'Configure',
                        widget: ConfigureWidget.editMode,
                    },
                    viewConfigure: {
                        label: 'View Configure',
                        widget: ConfigureWidget.viewMode,
                    },
                    info: {
                        label: 'Info',
                        widget: MultiAppInfoWidget,
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
                        widget: ErrorTabWidget,
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
            },
            initialActionState = {
                disabled: true,
                name: 'runApp',
            };
        let runStatusListener = null, // only used while listening for the jobs to start
            kbaseNode = null, // the DOM element used as the container for everything in this cell
            cellBus = null, // the parent cell bus that gets external messages
            controllerBus = null, // the main bus for this cell and its children
            ui = null,
            tabWidget = null, // the widget currently in view
            cancelBatch = null; // whether or not to cancel the job
        // widgets this cell owns
        let cellTabs, controlPanel, jobManager;
        const specs = {},
            readOnly = false;

        if (options.initialize) {
            initialize(options.specs); // fills out the specs object
        } else {
            // this gets called as part of initialize if we're doing the initialize step
            setupAppSpecs(Utils.getMeta(cell, 'bulkImportCell', 'app').specs);
        }

        const model = Props.make({
            data: Utils.getMeta(cell, 'bulkImportCell'),
            onUpdate: function (props) {
                Utils.setMeta(cell, 'bulkImportCell', props.getRawObject());
            },
        });
        // gets updated in total later by updateState
        let state = getInitialState();
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
         * @returns an array with 3 elements:
         *   1 - array of file parameter ids (those ids that should be in the file param rows, includes output object names)
         *   2 - array of non-file parameter ids
         *   3 - array of output object parameter ids
         */
        function filterFileParameters(appSpec) {
            const fileParams = appSpec.parameters.filter((param) => {
                return (
                    param.dynamic_dropdown_options &&
                    param.dynamic_dropdown_options.data_source === 'ftp_staging'
                );
            });
            const outputParams = appSpec.parameters.filter((param) => {
                return param.text_options && param.text_options.is_output_name;
            });
            const allParamIds = appSpec.parameters.map((param) => param.id);
            const outputParamIds = outputParams.map((param) => param.id);
            const fileParamIds = fileParams.map((param) => param.id).concat(outputParamIds);
            const fileParamIdSet = new Set(fileParamIds); // for the efficient has() function
            const nonFileParamIds = allParamIds.filter((id) => !fileParamIdSet.has(id));
            return [fileParamIds, nonFileParamIds, outputParamIds];
        }

        function setupAppSpecs(appSpecs) {
            for (const [appId, appSpec] of Object.entries(appSpecs)) {
                specs[appId] = Spec.make({ appSpec });
            }
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
                outputParamIds = {},
                initialParamStates = {};
            setupAppSpecs(appSpecs);
            /* Initialize the parameters set.
             * Get the app spec and split the set of parameters into filePaths and params.
             * Each input file (typesToFiles[fileType].files) gets its own set of filePath
             * parameters.
             * TODO: figure a good way to initialize these with one file use per param file row.
             */
            Object.keys(typesToFiles).forEach((fileType) => {
                const appId = typesToFiles[fileType].appId;
                const spec = appSpecs[appId];
                initialParams[fileType] = {
                    filePaths: [],
                    params: {},
                };
                initialParamStates[fileType] = 'incomplete';
                [fileParamIds[fileType], otherParamIds[fileType], outputParamIds[fileType]] =
                    filterFileParameters(spec);

                // if there's just a file and an output
                if (fileParamIds[fileType].length < 3) {
                    const outputParamId = outputParamIds[fileType][0];
                    initialParams[fileType].filePaths = typesToFiles[fileType].files.map(
                        (inputFile) => {
                            return fileParamIds[fileType].reduce((fileParams, paramId) => {
                                if (paramId === outputParamId) {
                                    const suffix = typesToFiles[fileType].outputSuffix || '';
                                    fileParams[paramId] =
                                        StringUtil.sanitizeWorkspaceObjectName(inputFile, true) +
                                        suffix;
                                } else {
                                    fileParams[paramId] = inputFile;
                                }
                                return fileParams;
                            }, {});
                        }
                    );
                } else {
                    // for now, assume a single output object per row.
                    const numFilesPerRow = fileParamIds[fileType].length - 1;
                    const numRows = typesToFiles[fileType].files.length / numFilesPerRow;
                    initialParams[fileType].filePaths = [];
                    for (let i = 0; i < numRows; i++) {
                        initialParams[fileType].filePaths.push(
                            fileParamIds[fileType].reduce((nullParams, paramId) => {
                                nullParams[paramId] = null;
                                return nullParams;
                            }, {})
                        );
                    }
                }

                const inputFileIds = fileParamIds[fileType].filter(
                    (param) => !outputParamIds[fileType].includes(param)
                );
                // if there's an appParameters array, then we need to process that into files
                // if it's greater than 1 in length, just use the non-file params from the first one
                const appParameters = typesToFiles[fileType].appParameters || [];
                // this becomes true if there is at least one row of appParameters with different
                // non fileParamIds values. Here, we just skim through the otherParamIds for each row.
                let hasUniqueParams = true;
                const nonFileAppParams = appParameters.length ? appParameters[0] : {};
                appParameters.forEach((appParamSet) => {
                    // store all the "input files" in the files array for that type
                    inputFileIds.forEach((paramId) => {
                        typesToFiles[fileType].files.push(appParamSet[paramId]);
                    });
                    // make a reduction with just the file paths / outputs (fileParamIds) for each parameter
                    const filePathRow = fileParamIds[fileType].reduce((fpRow, paramId) => {
                        fpRow[paramId] = appParamSet[paramId];
                        return fpRow;
                    }, {});
                    initialParams[fileType].filePaths.push(filePathRow);
                    // if we still have all unique params, gotta check the next row
                    if (hasUniqueParams) {
                        hasUniqueParams = !otherParamIds[fileType].some(
                            (paramId) => nonFileAppParams[paramId] !== appParamSet[paramId]
                        );
                    }
                });

                if (!hasUniqueParams) {
                    if (!typesToFiles[fileType].messages) {
                        typesToFiles[fileType].messages = [];
                    }
                    typesToFiles[fileType].messages.push({
                        type: 'warning',
                        message:
                            'Multiple parameters listed in the bulk import specification file. Import can proceed, but only the first line of parameters will be used.',
                    });
                }

                const otherParams = specs[appId].makeDefaultedModel();
                initialParams[fileType].params = otherParamIds[fileType].reduce(
                    (paramSet, paramId) => {
                        paramSet[paramId] = otherParams[paramId];
                        if (paramId in nonFileAppParams) {
                            paramSet[paramId] = nonFileAppParams[paramId];
                        }
                        return paramSet;
                    },
                    {}
                );

                // remove the outputSuffix key before storing in metadata, as it's not
                // useful anymore once we set up the initial output names
                delete typesToFiles[fileType].outputSuffix;
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
                            fileParamIds,
                            otherParamIds,
                            outputParamIds,
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
            resetRunStatusListener();
            switch (message.event) {
                case 'launched_job_batch':
                    // remove any existing jobs
                    jobManager.initBatchJob(message);
                    if (cancelBatch) {
                        cancelBatchJob();
                        break;
                    }
                    updateState('inProgress');
                    switchToTab('jobStatus');
                    break;
                case 'error':
                    model.setItem('appError', {
                        type: 'App Startup Error',
                        message: message.error_message,
                        stacktrace: message.error_stacktrace,
                        code: message.error_code,
                        source: message.error_source,
                        method: message.error_method,
                        exceptionType: message.error_type,
                    });
                    updateState('error');
                    switchToTab('error');
                    break;
                default:
                    console.warn(`Unknown run-status event ${message.event}!`);
                    updateState('error');
                    switchToTab('error');
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
                    tag: appSpecInfo.tag || 'release',
                    version: appSpecInfo.git_commit_hash,
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

            // finalize by updating the lastLoaded attribute, which triggers a toolbar re-render
            const meta = cell.metadata;
            meta.kbase.attributes.lastLoaded = new Date().toUTCString();
            cell.metadata = meta;

            // initialise the job manager
            jobManager = new JobManager({
                model,
                cell,
                bus: runtime.bus(),
            });

            render()
                .then(() => {
                    jobManager.addEventHandler('modelUpdate', {
                        execMessage: (jobManagerContext) => {
                            // Update the execMessage panel with details of the active jobs
                            controlPanel.setExecMessage(
                                Jobs.createCombinedJobState(
                                    jobManagerContext.model.getItem('exec.jobs')
                                )
                            );
                        },
                        fsmState: () => {
                            const fsmState = jobManager.getFsmStateFromJobs();
                            if (fsmState) {
                                updateState(fsmState);
                            }
                        },
                    });
                    try {
                        const fsmState = jobManager.restoreFromSaved();
                        if (fsmState) {
                            updateState(fsmState);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                    const expectedFiles = new Set();
                    Object.values(model.getItem('inputs')).forEach((inputs) => {
                        for (const f of inputs.files) {
                            expectedFiles.add(f);
                        }
                    });
                    return BulkImportUtil.getMissingFiles(Array.from(expectedFiles)).catch(
                        (error) => {
                            // if the missing files call fails, just continue.
                            console.error(
                                'Unable to fetch missing files from the Staging Service',
                                error
                            );
                        }
                    );
                })
                .then((missingFiles = []) =>
                    BulkImportUtil.evaluateConfigReadyState(model, specs, new Set(missingFiles))
                )
                .then((readyState) => {
                    const curState = model.getItem('state');
                    const curReadyState = curState.params;
                    const updatedReadyState = !_.isEqual(readyState, curReadyState);
                    let newState;

                    if (updatedReadyState) {
                        model.setItem(['state', 'params'], readyState);
                    }
                    if (curState.state === 'launching') {
                        // TODO: if the cell has got stuck in 'launching' mode,
                        // we should get jobs by cell_id
                        // for now, reset the cell to 'editingComplete'
                        newState = 'editingComplete';
                    }

                    if (
                        updatedReadyState &&
                        ['editingComplete', 'editingIncomplete'].includes(curState.state)
                    ) {
                        updateEditingState();
                    } else {
                        updateState(newState);
                    }
                    cell.renderMinMax();
                    runTab(state.tab.selected);
                });
        }

        function getWorkspaceClient() {
            return new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken(),
            });
        }

        /**
         * Switch tab display
         * stops the current tab widget, runs `tab`
         * and updates the model and cell tabs with the
         * newly-selected tab
         *
         * @param {string} tab id of the tab to display
         */
        function _switchToTab(tab) {
            state.tab.selected = tab;
            return stopWidget().then(() => {
                if (tab !== null) {
                    runTab(tab);
                }
                model.setItem('state.selectedTab', tab);
                cellTabs.setState(state.tab);
            });
        }

        /**
         * Toggle the display of the specified tab
         * If the tab is already being displayed, this will hide it
         *
         * @param {string} tab id of the tab to display
         */
        function toggleTab(tab) {
            // if we're toggling the currently selected tab off,
            // then it should be turned off.
            if (tab === state.tab.selected && tab !== null) {
                tab = null;
            }
            _switchToTab(tab);
        }

        /**
         * Switch to displaying the specified tab
         * If the tab is already displayed, this does nothing
         *
         * @param {string} tab id of the tab to display
         */
        function switchToTab(tab) {
            // don't switch if the tab is null or already selected
            if (tab === null || tab === state.tab.selected) {
                return;
            }
            _switchToTab(tab);
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
                fileTypesDisplay,
                fileTypeMapping,
                jobId: undefined,
                jobManager,
                model,
                specs,
                toggleTab,
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
                    doCellAction('cancelBulkImport');
                    break;
                case 'resetApp':
                    doCellAction('appReset');
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
            clearCellMessages();
            cell.execute();
            updateState('launching');
            switchToTab('viewConfigure');
        }

        /**
         * Either cancel or reset the app
         *
         * Cancel all running jobs and reset the cell for editing. Both actions
         * have the same effect but the user dialogs shown differ.
         *
         * The user is shown a dialog to confirm their choice prior to cancellation
         * and resetting.
         * If a job run has been triggered, the batch job will be terminated, which
         * will also terminate all the child jobs.
         *
         * @param {string} action - either 'cancelBulkImport' or 'appReset'; defaults to 'appReset'
         */
        async function doCellAction(action) {
            if (!action || (action !== 'cancelBulkImport' && action !== 'appReset')) {
                action = 'appReset';
            }
            const confirmed = await DialogMessages.showDialog({ action });

            if (confirmed) {
                // if the runStatusListener is not null,
                // the FE has yet to receive data about the new batch job
                // handleRunStatus will cancel the batch job when it receives that message
                cancelBatch = true;
                controlPanel.setExecMessage(
                    action === 'cancelBulkImport' ? 'Canceling...' : 'Resetting app...'
                );

                // if runStatusListener is null, the batch job data is available and
                // the job can be cancelled immediately.
                if (runStatusListener === null) {
                    cancelBatchJob();
                }
            }
            return Promise.resolve(confirmed);
        }

        function cancelBatchJob() {
            jobManager.cancelBatchJob();
            resetCell();
        }

        function resetCell() {
            resetRunStatusListener();
            jobManager.resetJobs();
            cancelBatch = null;
            updateEditingState();
            switchToTab('configure');
            Jupyter.narrative.saveNarrative();
        }

        function resetRunStatusListener() {
            if (runStatusListener !== null) {
                busEventManager.remove(runStatusListener);
                runStatusListener = null;
            }
        }

        /**
         * Deletes the cell from the notebook after doing internal cleanup.
         */
        async function deleteCell() {
            const confirmed = await DialogMessages.showDialog({ action: 'deleteCell' });
            if (confirmed) {
                jobManager.cancelBatchJob();
                busEventManager.removeAll();
                stopWidget();
                const cellIndex = Jupyter.notebook.find_cell_index(cell);
                Jupyter.notebook.delete_cell(cellIndex);
            }
            return Promise.resolve(confirmed);
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
            const uiState = JSON.parse(JSON.stringify(States[currentState].ui));
            let savedState = model.getItem('state.selectedTab');
            if (!savedState || !uiState.tab.tabs[savedState].enabled) {
                savedState = uiState.defaultTab;
                model.setItem('state.selectedTab', savedState);
            }
            uiState.tab.selected = savedState;
            return uiState;
        }

        /**
         * Passes the updated state to various widgets, and serialize it in
         * the cell metadata, where appropriate.
         * @param {string} newUiState - change to a new UI state, if defined.
         */
        function updateState(newUiState) {
            if (newUiState && newUiState in States) {
                let newTab;
                model.setItem('state.state', newUiState);
                const stateDiff = JSON.parse(JSON.stringify(States[newUiState].ui));
                stateDiff.selectedFileType = state.selectedFileType;
                // update selections
                if (stateDiff.tab.tabs[state.tab.selected].enabled) {
                    stateDiff.tab.selected = state.tab.selected;
                } else {
                    newTab = stateDiff.defaultTab;
                }
                state = stateDiff;
                if (newTab) {
                    switchToTab(newTab);
                }
            }
            cellTabs.setState(state.tab);
            controlPanel.setActionState(state.action);
            // set the appropriate status line
            if (!model.getItem('exec.jobState')) {
                if (!newUiState) {
                    newUiState = model.getItem('state.state');
                }
                const stateMessage = {
                    editingComplete: 'Ready to run',
                    launching: 'Launching',
                };
                controlPanel.setExecMessage(stateMessage[newUiState] || '');
            }

            FSMBar.showFsmBar({
                ui,
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
                ui,
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
                node,
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
                content,
                events,
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
                controlPanel.setActionState(initialActionState);
            });
        }

        function clearCellMessages() {
            const inputs = model.getItem('inputs');
            Object.keys(inputs).forEach((dataType) => {
                delete inputs[dataType].messages;
            });
            model.setItem('inputs', inputs);
        }

        /**
         * The factory returns an accessor to the underlying Jupyter cell, and the
         * deleteCell function. Everything else should just run internally.
         */
        const api = {
            cell,
            deleteCell,
        };

        if (developerMode) {
            api.jobManager = jobManager;
        }

        return api;
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
