/*
 * KBase App Cell Extension
 *
 * Supports kbase app cells and the kbase cell toolbar.
 *
 * Note that, out of our control, this operates under the "module as singleton" model.
 * In this model, the execution of the module the first time per session is the same
 * as creating a global management object.
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
    'common/error',
    'kb_service/utils',
    'kb_service/client/workspace',
    './appCell',
    'bootstrap',
    'custom/custom',
], ($, Jupyter, Promise, Runtime, Clock, Error, serviceUtils, Workspace, AppCell) => {
    'use strict';
    const runtime = Runtime.make();

    function setupNotebook() {
        return Promise.all(
            Jupyter.notebook.get_cells().map((cell) => {
                if (AppCell.isAppCell(cell)) {
                    const appCell = AppCell.make({ cell });

                    return appCell.setupCell(cell).catch((err) => {
                        // If we have an error here, there is a serious problem setting up the cell and it is not usable.
                        // What to do? The safest thing to do is inform the user, and then strip out the cell, leaving
                        // in its place a markdown cell with the error info.
                        // For now, just pop up an error dialog;
                        Error.reportCellError(
                            'Error starting app cell',
                            'There was an error starting the app cell:',
                            err
                        );
                    });
                }
            })
        );
    }

    /*
     * Called directly by Jupyter during the notebook startup process.
     * Called after the notebook is loaded and the dom structure is created.
     * The job of this call is to mutate the notebook and cells to suit
     * oneself, set up any services or other things needed for operation of
     * the notebook or cells.
     * The work is carried out asynchronously through an orphan promise.
     */
    function load_ipython_extension() {
        // Listen for interesting narrative jquery events...
        // dataUpdated.Narrative is emitted by the data sidebar list
        // after it has fetched and updated its data. Not the best of
        // triggers that the ws has changed, not the worst.
        $(document).on('dataUpdated.Narrative', () => {
            // Tell each cell that the workspace has been updated.
            // This is what is interesting, no?
            runtime.bus().emit('workspace-changed');
        });

        return setupNotebook()
            .then(() => {
                // set up event hooks

                // Primary hook for new cell creation.
                // If the cell has been set with the metadata key kbase.type === 'app'
                // we have a app cell.
                $([Jupyter.events]).on('insertedAtIndex.Cell', (event, payload) => {
                    const cell = payload.cell,
                        setupData = payload.data,
                        jupyterCellType = payload.type;

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

                    const appCell = AppCell.make({ cell });
                    appCell
                        .upgradeToAppCell(setupData.appSpec, setupData.appTag, setupData.type)
                        .catch((err) => {
                            Error.reportCellError(
                                'Error inserting app cell',
                                'Could not insert the app cell due to errors:',
                                err
                            );
                        });
                });
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
            return load_ipython_extension();
        } else {
            return Promise.try(() => {
                $([Jupyter.events]).one('notebook_loaded.Notebook', () => {
                    load_ipython_extension();
                });
            });
        }
    }

    return {
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load,
    };
}, (err) => {
    'use strict';
    console.error('ERROR loading appCell main', err);
});
