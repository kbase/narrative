/*global define,console,document*/
/*jslint white:true,browser:true*/
/*eslint-env browser*/
/*
 * KBase Editor Cell Extension
 *
 * Supports kbase app cells and the kbase cell toolbar.
 *
 * Note that, out of our control, this operates under the "module as singleton" model.
 * In this model, the execution of the module the first time per session is the same
 * as creating a global management object.
 *
 * Thus we do things like create a a message bus
 *
 * @param {type} $
 * @param {type} Jupyter
 * @param {type} html
 */
define([
    'jquery',
    'base/js/namespace',
    'bluebird',
    'common/runtime',
    'kb_service/utils',
    'kb_service/client/workspace',
    './editorCell',
    'css!kbase/css/appCell.css',
    'css!./styles/main.css',
    'bootstrap'
], function (
    $,
    Jupyter,
    Promise,
    Runtime,
    serviceUtils,
    Workspace,
    EditorCell
    ) {
    'use strict';
    var runtime = Runtime.make();

    function setupNotebook(workspaceInfo) {
        return Promise.all(Jupyter.notebook.get_cells().map(function (cell) {
            if (EditorCell.isEditorCell(cell)) {
                var editorCell = EditorCell.make({
                    cell: cell,
                    workspaceInfo: workspaceInfo
                });
                editorCell.setupCell(cell);
                return editorCell;
            }
        }))
        .then(function (possibleEditorCells) {
            return possibleEditorCells.filter(function (editorCell) {
                if (editorCell) {
                    return true;
                }
                return false;
            });
        });
    }

    function getWorkspaceRef() {
        // TODO: all kbase notebook metadata should be on a kbase top level property;
        var workspaceName = Jupyter.notebook.metadata.ws_name, // Jupyter.notebook.metadata.kbase.ws_name,
            workspaceId;

        if (workspaceName) {
            return {workspace: workspaceName};
        }

        workspaceId = Jupyter.notebook.metadata.ws_id; // Jupyter.notebook.metadata.kbase.ws_id;
        if (workspaceId) {
            return {id: workspaceId};
        }

        throw new Error('workspace name or id is missing from this narrative');
    }

    function setupWorkspace(workspaceUrl) {
        // TODO where to get config from generally?
        var workspaceRef = getWorkspaceRef(),
            workspace = new Workspace(workspaceUrl, {
                token: runtime.authToken()
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
        var workspaceInfo;

        // Listen for interesting narrative jquery events...
        // dataUpdated.Narrative is emitted by the data sidebar list
        // after it has fetched and updated its data. Not the best of
        // triggers that the ws has changed, not the worst.
        $(document).on('dataUpdated.Narrative', function () {
            // Tell each cell that the workspace has been updated.
            // This is what is interesting, no?
            runtime.bus().emit('workspace-changed');
        });

        // TODO: get the kbase specific info out of the notebook, specifically
        // the workspace name, ...

        setupWorkspace(runtime.config('services.workspace.url'))
            .then(function (wsInfo) {
                workspaceInfo = serviceUtils.workspaceInfoToObject(wsInfo);
            })
            .then(function () {
                return setupNotebook(workspaceInfo);
            })
            .then(function () {
                // set up event hooks

                // Primary hook for new cell creation.
                // If the cell has been set with the metadata key kbase.type === 'app'
                // we have a app cell.
                $([Jupyter.events]).on('inserted.Cell', function (event, data) {
                    if (!data.kbase || data.kbase.type !== 'editor') {
                        return;
                    }

                    var editorCell = EditorCell.make({
                        cell: data.cell,
                        workspaceInfo: workspaceInfo
                    });
                    editorCell.upgradeToEditorCell(data.kbase.appSpec, data.kbase.appTag)
                        .catch(function (err) {
                            console.error('ERROR creating cell', err);
                            Jupyter.notebook.delete_cell(Jupyter.notebook.find_cell_index(data.cell));
                            alert('Could not insert cell due to errors.\n' + err.message);
                        });
                });
                // also delete.Cell, edit_mode.Cell, select.Cell, command_mocd.Cell, output_appended.OutputArea ...
                // preset_activated.CellToolbar, preset_added.CellToolbar
            })
            .catch(function (err) {
                console.error('ERROR setting up notebook', err);
            });
    }

    // MAIN
    // module state instantiation

    // // TODO: move this to a another location?
    // var clock = Clock.make({
    //     bus: runtime.bus(),
    //     resolution: 1000
    // });
    // clock.start();

    return {
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load_ipython_extension
    };
}, function (err) {
    console.log('ERROR loading editorCell main', err);
});
