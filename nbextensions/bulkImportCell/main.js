/*
 * KBase Bulk Import Cell Extension
 *
 * Supports kbase bulk import cells
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
    'common/ui',
    'kb_common/html',
    './bulkImportCell',
    'custom/custom'
], function(
    $,
    Jupyter,
    Promise,
    Runtime,
    UI,
    html,
    BulkImportCell
) {
    'use strict';
    const runtime = Runtime.make(),
        t = html.tag,
        div = t('div'),
        p = t('p'),
        CELL_TYPE = 'app-bulk-import';

    /**
     * This gets called on extension initialization. This iterates over all existing cells,
     * and if it's a bulk import cell, then we init the module that says so.
     */
    function setupNotebook() {
        return Promise.all(Jupyter.notebook.get_cells().map(function(cell) {
            if (BulkImportCell.isBulkImportCell(cell)) {
                const bulkImportCell = new BulkImportCell(cell);
                try {
                    bulkImportCell.setupCell(cell);
                }
                catch(error) {

                    // If we have an error here, there is a serious problem setting up the cell and it is not usable.
                    // What to do? The safest thing to do is inform the user, and then strip out the cell, leaving
                    // in it's place a markdown cell with the error info.
                    // For now, just pop up an error dialog;
                    var ui = UI.make({
                        node: document.body
                    });
                    ui.showInfoDialog({
                        title: 'Error',
                        body: div({
                            style: {
                                margin: '10px'
                            }
                        }, [
                            ui.buildPanel({
                                title: 'Error Starting App Cell',
                                type: 'danger',
                                body: ui.buildErrorTabs({
                                    preamble: p('There was an error starting the app cell.'),
                                    error: error
                                })
                            })
                        ])
                    });
                }
            }
        }));
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

        setupNotebook()
            .then(() => {
                $([Jupyter.events]).on('insertedAtIndex.Cell', (event, payload) => {
                    const cell = payload.cell,
                        setupData = payload.data,
                        jupyterCellType = payload.type;

                    if (jupyterCellType !== 'code' ||
                        !setupData ||
                        !(setupData.type === CELL_TYPE)) {
                        return;
                    }

                    const bulkImportCell = new BulkImportCell(cell);
                    bulkImportCell.initialize(setupData.appTag, setupData.fileMap);
                    try {
                        bulkImportCell.setupCell();
                    }
                    catch(error) {
                        console.error('Error while creating bulk import cell', error);
                        Jupyter.notebook.delete_cell(Jupyter.notebook.find_cell_index(cell));
                        var ui = UI.make({
                            node: document.body
                        });
                        ui.showInfoDialog({
                            title: 'Error',
                            body: div({
                                style: {
                                    margin: '10px'
                                }
                            }, [
                                ui.buildPanel({
                                    title: 'Error Inserting App Cell',
                                    type: 'danger',
                                    body: ui.buildErrorTabs({
                                        preamble: p('Could not insert the App Cell due to errors.'),
                                        error: error
                                    })
                                })
                            ])
                        });
                    }
                });
            });

    }

    // MAIN
    // module state instantiation

    function load() {
        /* Only initialize after the notebook is fully loaded. */
        if (Jupyter.notebook._fully_loaded) {
            load_ipython_extension();
        }
        else {
            $([Jupyter.events]).one('notebook_loaded.Notebook', function () {
                load_ipython_extension();
            });
        }
    }

    return {
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load
    };
}, (err) => {
    'use strict';
    console.error('ERROR loading bulkImportCell main', err);
});
