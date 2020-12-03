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
    'common/error',
    './bulkImportCell',
    'kb_service/client/workspace',
    'kb_service/utils',
    'custom/custom'
], function(
    $,
    Jupyter,
    Promise,
    Runtime,
    Error,
    BulkImportCell,
    Workspace,
    serviceUtils,
) {
    'use strict';
    const CELL_TYPE = 'app-bulk-import';
    const runtime = Runtime.make();

    /**
     * This gets called on extension initialization. This iterates over all existing cells,
     * and if it's a bulk import cell, then we init the wrapping BulkImportCell class.
     */
    function setupNotebook() {
        return Promise.all(Jupyter.notebook.get_cells().map((cell) => {
            if (BulkImportCell.isBulkImportCell(cell)) {
                try {
                    BulkImportCell.make({
                        cell
                    });
                }
                catch(error) {
                    // If we have an error here, there is a serious problem setting up the cell and it is not usable.
                    // What to do? The safest thing to do is inform the user, and then strip out the cell, leaving
                    // in it's place a markdown cell with the error info.
                    // For now, just pop up an error dialog;

                    Error.reportCellError('Error starting bulk import cell',
                        'There was an error starting the bulk import cell',
                        error);
                }
            }
        }));
    }

    /*
     * Called directly by Jupyter during the notebook startup process.
     * Called after the notebook is loaded and the dom structure is created.
     * The job of this call is to mutate the notebook and cells to be aware of
     * the bulk import cells.
     */
    function load_ipython_extension() {
        // Listen for interesting narrative jquery events...
        // dataUpdated.Narrative is emitted by the data sidebar list
        // after it has fetched and updated its data. Not the best of
        // triggers that the ws has changed, not the worst.
        $(document).on('dataUpdated.Narrative', function() {
            // Tell each cell that the workspace has been updated.
            // This is what is interesting, no?
            runtime.bus().emit('workspace-changed');
        });

        return setupNotebook()
            .then(() => {
                $([Jupyter.events]).on('insertedAtIndex.Cell', (event, payload) => {
                    const cell = payload.cell,
                        setupData = payload.data,
                        jupyterCellType = payload.type;

                    if (jupyterCellType !== 'code' ||
                        !setupData ||
                        setupData.type !== CELL_TYPE) {
                        return;
                    }
                    const importData = setupData.typesToFiles || {};

                    try {
                        BulkImportCell.make({
                            cell,
                            importData,
                            initialize: true
                        });
                    }
                    catch(error) {
                        Jupyter.notebook.delete_cell(Jupyter.notebook.find_cell_index(cell));
                        Error.reportCellError('Error inserting bulk import cell',
                            'Could not insert the App Cell due to errors.',
                            error);
                    }
                });
            });
    }

    /**
     * The main entrypoint for this extension, this either loads up the extension right away,
     * or waits on loading to finish.
     * It returns a Promise that gets resolved when `load_python_extension` is executed.
     */
    function load() {
        /* Only initialize after the notebook is fully loaded. */
        if (Jupyter.notebook._fully_loaded) {
            return load_ipython_extension();
        }
        else {
            return Promise.try(() => {
                $([Jupyter.events]).one('notebook_loaded.Notebook', function () {
                    load_ipython_extension();
                });
            });
        }
    }

    return {
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load
    };
}, (err) => {
    'use strict';
    console.error('Error while loading the bulkImportCell extension', err);
});
