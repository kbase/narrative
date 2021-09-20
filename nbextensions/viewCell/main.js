/*
 * KBase View Cell Extension
 *
 * Supports kbase view cells and the kbase cell toolbar.
 *
 * Note that, out of our control, this operates under the "module as singleton" model.
 * In this model, the execution of the module the first time per session is the same
 * as creating a global management object.
 *
 * Thus we do things like createa a message bus
 *
 * @param {type} $
 * @param {type} Jupyter
 * @param {type} html
 *
 */
define([
    'jquery',
    'base/js/namespace',
    'bluebird',
    'uuid',
    'common/html',
    './widgets/viewCellWidget',
    'common/runtime',
    'common/parameterSpec',
    'common/cellUtils',
    'common/clock',
    'common/dom',
    'common/props',
    'util/icon',
    'common/jupyter',
    'common/spec',
    'kb_service/utils',
    'kb_service/client/workspace',
    'common/cellComponents/appInfoDialog',
    'bootstrap',
    'custom/custom',
], (
    $,
    Jupyter,
    Promise,
    Uuid,
    html,
    ViewCellWidget,
    Runtime,
    ParameterSpec,
    utils,
    Clock,
    Dom,
    Props,
    Icon,
    jupyter,
    Spec,
    serviceUtils,
    Workspace,
    appInfoDialog
) => {
    'use strict';

    let t = html.tag,
        div = t('div'),
        workspaceInfo,
        env,
        runtime = Runtime.make();

    /*
     * Dealing with metadata
     */

    // This is copied out of jupyter code.
    function activateToolbar() {
        const toolbarName = 'KBase';
        Jupyter.CellToolbar.global_show();
        Jupyter.CellToolbar.activate_preset(toolbarName, Jupyter.events);
        Jupyter.notebook.metadata.celltoolbar = toolbarName;
    }

    /*
     * Should only be called when a cell is first inserted into a narrative.
     * It creates the correct metadata and then sets up the cell.
     *
     */
    function upgradeToViewCell(cell, appSpec, appTag) {
        return Promise.try(() => {
            // Create base app cell
            const meta = cell.metadata;
            meta.kbase = {
                type: 'view',
                attributes: {
                    id: new Uuid(4).format(),
                    status: 'new',
                    created: new Date().toUTCString(),
                    icon: 'bar-chart',
                },
                cellState: {
                    icon: 'bar-chart',
                },
                viewCell: {
                    app: {
                        id: appSpec.info.id,
                        gitCommitHash: appSpec.info.git_commit_hash,
                        version: appSpec.info.ver,
                        tag: appTag,
                        spec: appSpec,
                    },
                    state: {
                        edit: 'editing',
                        params: null,
                        code: null,
                        request: null,
                        result: null,
                    },
                    params: null,
                    output: {
                        byJob: {},
                    },
                },
            };
            cell.metadata = meta;
        })
            .then(() => {
                // Add the params
                const spec = Spec.make({
                    appSpec: appSpec,
                });
                utils.setCellMeta(cell, 'kbase.viewCell.params', spec.makeDefaultedModel());
            })
            .then(() => {
                // Complete the cell setup.
                return setupCell(cell);
            })
            .then((cellStuff) => {
                // Initialize the cell to its default state.
                cellStuff.bus.emit('reset-to-defaults');
            });
    }

    function specializeCell(cell) {
        cell.minimize = function () {
            const inputArea = this.input.find('.input_area').get(0),
                outputArea = this.element.find('.output_wrapper'),
                viewInputArea = this.element.find('[data-subarea-type="view-cell-input"]'),
                showCode = utils.getCellMeta(
                    cell,
                    'kbase.viewCell.user-settings.showCodeInputArea'
                );

            if (showCode) {
                // inputArea.addClass('hidden');
                inputArea.classList.remove('-show');
            }
            outputArea.addClass('hidden');
            viewInputArea.addClass('hidden');
        };

        cell.maximize = function () {
            const inputArea = this.input.find('.input_area').get(0),
                outputArea = this.element.find('.output_wrapper'),
                viewInputArea = this.element.find('[data-subarea-type="view-cell-input"]'),
                showCode = utils.getCellMeta(
                    cell,
                    'kbase.viewCell.user-settings.showCodeInputArea'
                );

            if (showCode) {
                // inputArea.removeClass('hidden');
                if (!inputArea.classList.contains('-show')) {
                    inputArea.classList.add('-show');
                }
            }
            outputArea.removeClass('hidden');
            viewInputArea.removeClass('hidden');
        };
        cell.renderIcon = function () {
            const inputPrompt = this.element[0].querySelector('[data-element="prompt"]');

            if (inputPrompt) {
                inputPrompt.innerHTML = this.getIcon();
            }
        };
        cell.getIcon = function () {
            return Icon.makeToolbarAppIcon(utils.getCellMeta(cell, 'kbase.viewCell.app.spec'));
        };
        cell.showInfo = function () {
            const app = utils.getCellMeta(cell, 'kbase.viewCell.app');
            appInfoDialog.show({
                id: app.spec.info.id,
                version: app.spec.info.ver,
                module: app.spec.info.module_name,
                tag: app.tag,
            });
        };
    }

    function checkAndRepairCell(cell) {
        // Has proper structure?
        // TODO:

        // Has proper app spec?
        let spec = utils.getCellMeta(cell, 'kbase.viewCell.app.spec');
        if (!spec) {
            spec = utils.getCellMeta(cell, 'kbase.viewCell.app.appSpec');
            if (!spec) {
                throw new Error('App Spec not set on this editor.');
            }
            utils.setCellMeta(cell, 'kbase.viewCell.app.spec', spec);
            console.warn('Editor cell repaired -- the app spec was set on the old property');
            delete utils.getCellMeta(cell, 'kbase.viewCell.app').appSpec;
        }
    }

    function setupCell(cell) {
        return Promise.try(() => {
            // Only handle kbase cells.

            if (cell.cell_type !== 'code') {
                return;
            }
            if (!cell.metadata.kbase) {
                return;
            }
            if (cell.metadata.kbase.type !== 'view') {
                return;
            }

            checkAndRepairCell(cell);

            specializeCell(cell);

            const cellElement = cell.element;
            cellElement.addClass('kb-cell').addClass('kb-view-cell');

            // The kbase property is only used for managing runtime state of the cell
            // for kbase. Anything to be persistent should be on the metadata.
            cell.kbase = {};

            // Update metadata.
            utils.setMeta(cell, 'attributes', 'lastLoaded', new Date().toUTCString());

            // TODO: the code cell input widget should instantiate its state
            // from the cell!!!!
            const cellBus = runtime
                    .bus()
                    .makeChannelBus({ description: 'Parent comm for The Cell Bus' }),
                appId = utils.getMeta(cell, 'viewCell', 'app').id,
                appTag = utils.getMeta(cell, 'viewCell', 'app').tag,
                viewCellWidget = ViewCellWidget.make({
                    bus: cellBus,
                    cell: cell,
                    runtime: runtime,
                    workspaceInfo: workspaceInfo,
                }),
                dom = Dom.make({ node: cell.input[0] }),
                kbaseNode = dom.createNode(
                    div({
                        dataSubareaType: 'view-cell-input',
                    })
                );

            // Create (above) and place the main container for the input cell.
            kbaseNode.classList.add('hidden');
            cell.input.after($(kbaseNode));
            cell.kbase.node = kbaseNode;
            cell.kbase.$node = $(kbaseNode);

            jupyter.disableKeyListenersForCell(cell);

            return viewCellWidget
                .init()
                .then(() => {
                    return viewCellWidget.attach(kbaseNode);
                })
                .then(() => {
                    return viewCellWidget.start();
                })
                .then(() => {
                    return viewCellWidget.run({
                        appId: appId,
                        appTag: appTag,
                        authToken: runtime.authToken(),
                    });
                })
                .then(() => {
                    // AppCellController.start();
                    cell.renderMinMax();
                    return {
                        widget: viewCellWidget,
                        bus: cellBus,
                    };
                });
        });
    }

    function setupNotebook() {
        return Promise.all(
            Jupyter.notebook.get_cells().map((cell) => {
                return setupCell(cell);
            })
        );
    }

    function setupWorkspace(workspaceUrl) {
        // TODO where to get config from generally?
        const workspaceRef = { id: runtime.workspaceId() },
            workspace = new Workspace(workspaceUrl, {
                token: runtime.authToken(),
            });

        return workspace.get_workspace_info(workspaceRef);
    }

    /*
     * Called directly by Jupyter during the notebook startup process.
     * Called after the notebook is loaded and the dom structure is created.
     * The job of this call is to mutate the notebook and cells to suite
     * oneself, set up any services or other things needed for operation of
     * the notebook or cells.
     * The work is carried out asynchronously through an orphan promise.
     */
    function initializeExtension() {
        // Listen for interesting narrative jquery events...
        // dataUpdated.Narrative is emitted by the data sidebar list
        // after it has fetched and updated its data. Not the best of
        // triggers that the ws has changed, not the worst.
        $(document).on('dataUpdated.Narrative', () => {
            runtime.bus().emit('workspace-changed');
        });

        // Set the notebook environment.
        // For instance, we don't want to override the toolbar in the Narrative, but we need to supply our on in a plain notebook.
        env = 'narrative';

        // And make a toolbar preset composed of the extensions, and activate it for this notebook.
        if (env !== 'narrative') {
            activateToolbar();
        }

        // TODO: get the kbase specific info out of the notebook, specifically
        // the workspace name, ...

        setupWorkspace(runtime.config('services.workspace.url'))
            .then((wsInfo) => {
                workspaceInfo = serviceUtils.workspaceInfoToObject(wsInfo);
                return workspaceInfo;
            })
            .then(() => {
                return setupNotebook();
            })
            .then(() => {
                // set up event hooks

                // Primary hook for new cell creation.
                // If the cell has been set with the metadata key kbase.type === 'app'
                // we have a app cell.
                $([Jupyter.events]).on('insertedAtIndex.Cell', (event, payload) => {
                    const cell = payload.cell;
                    const setupData = payload.data;
                    const jupyterCellType = payload.type;
                    if (jupyterCellType === 'code' && setupData && setupData.type === 'view') {
                        upgradeToViewCell(cell, setupData.appSpec, setupData.appTag).catch(
                            (err) => {
                                console.error('ERROR creating cell', err);
                                // delete cell.
                                Jupyter.notebook.delete_cell(
                                    Jupyter.notebook.find_cell_index(cell)
                                );
                                alert('Could not insert cell due to errors.\n' + err.message);
                            }
                        );
                    }
                });
                // also delete.Cell, edit_mode.Cell, select.Cell, command_mocd.Cell, output_appended.OutputArea ...
                // preset_activated.CellToolbar, preset_added.CellToolbar
            })
            .catch((err) => {
                console.error('ERROR setting up notebook', err);
            });
    }

    // MAIN
    // module state instantiation

    function load() {
        /* Only initialize after the notebook is fully loaded. */
        if (Jupyter.notebook._fully_loaded) {
            initializeExtension();
        } else {
            $([Jupyter.events]).one('notebook_loaded.Notebook', () => {
                initializeExtension();
            });
        }
    }

    return {
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load,
    };
}, (err) => {
    'use strict';
    console.error('ERROR loading viewCell main', err);
});
