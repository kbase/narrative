/*
 * KBase App Cell Extension
 *
 * Supports kbase app cells and the kbase cell toolbar.
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
    'common/runtime',
    'common/clock',
    'common/ui',
    'kb_common/html',
    'kb_service/utils',
    'kb_service/client/workspace',
    './appCell',
    'css!kbase/css/appCell.css',
    'bootstrap',
    'custom/custom',
], ($, Jupyter, Promise, Runtime, Clock, UI, html, serviceUtils, Workspace, AppCell) => {
    'use strict';
    const runtime = Runtime.make();
    const t = html.tag,
        div = t('div'),
        p = t('p');

    function setupNotebook(workspaceInfo) {
        // console.log(Jupyter.notebook.get_cells());
        return Promise.all(
            Jupyter.notebook.get_cells().map((cell) => {
                if (AppCell.isAppCell(cell)) {
                    const appCell = AppCell.make({
                        cell: cell,
                        workspaceInfo: workspaceInfo,
                    });
                    return appCell.setupCell(cell).catch((err) => {
                        // If we have an error here, there is a serious problem setting up the cell and it is not usable.
                        // What to do? The safest thing to do is inform the user, and then strip out the cell, leaving
                        // in it's place a markdown cell with the error info.
                        // For now, just pop up an error dialog;
                        const ui = UI.make({
                            node: document.body,
                        });
                        ui.showInfoDialog({
                            title: 'Error',
                            body: div(
                                {
                                    style: {
                                        margin: '10px',
                                    },
                                },
                                [
                                    ui.buildPanel({
                                        title: 'Error Starting App Cell',
                                        type: 'danger',
                                        body: ui.buildErrorTabs({
                                            preamble: p(
                                                'There was an error starting the app cell.'
                                            ),
                                            error: err,
                                        }),
                                    }),
                                ]
                            ),
                        });
                    });
                }
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
    function load_ipython_extension() {
        let workspaceInfo;

        // Listen for interesting narrative jquery events...
        // dataUpdated.Narrative is emitted by the data sidebar list
        // after it has fetched and updated its data. Not the best of
        // triggers that the ws has changed, not the worst.
        $(document).on('dataUpdated.Narrative', () => {
            // Tell each cell that the workspace has been updated.
            // This is what is interesting, no?
            runtime.bus().emit('workspace-changed');
        });

        // TODO: get the kbase specific info out of the notebook, specifically
        // the workspace name, ...

        setupWorkspace(runtime.config('services.workspace.url'))
            .then((wsInfo) => {
                workspaceInfo = serviceUtils.workspaceInfoToObject(wsInfo);
            })
            .then(() => {
                return setupNotebook(workspaceInfo);
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

                    if (setupData && setupData.type === 'app2') {
                        setupData.type = 'app';
                    }

                    if (
                        jupyterCellType !== 'code' ||
                        !setupData ||
                        !(setupData.type === 'app' || setupData.type === 'devapp')
                    ) {
                        return;
                    }

                    const appCell = AppCell.make({
                        cell: cell,
                        workspaceInfo: workspaceInfo,
                    });
                    appCell
                        .upgradeToAppCell(setupData.appSpec, setupData.appTag, setupData.type)
                        .catch((err) => {
                            console.error('ERROR creating cell', err);
                            Jupyter.notebook.delete_cell(Jupyter.notebook.find_cell_index(cell));
                            // For now, just pop up an error dialog;
                            const ui = UI.make({
                                node: document.body,
                            });
                            ui.showInfoDialog({
                                title: 'Error',
                                body: div(
                                    {
                                        style: {
                                            margin: '10px',
                                        },
                                    },
                                    [
                                        ui.buildPanel({
                                            title: 'Error Inserting App Cell',
                                            type: 'danger',
                                            body: ui.buildErrorTabs({
                                                preamble: p(
                                                    'Could not insert the App Cell due to errors.'
                                                ),
                                                error: err,
                                            }),
                                        }),
                                    ]
                                ),
                            });
                        });
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

    // TODO: move this to a another location!!
    const clock = Clock.make({
        bus: runtime.bus(),
        resolution: 1000,
    });
    clock.start();

    function load() {
        /* Only initialize after the notebook is fully loaded. */
        if (Jupyter.notebook._fully_loaded) {
            load_ipython_extension();
        } else {
            $([Jupyter.events]).one('notebook_loaded.Notebook', () => {
                load_ipython_extension();
            });
        }
    }

    return {
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load,
    };
}, (err) => {
    console.error('ERROR loading appCell main', err);
});
