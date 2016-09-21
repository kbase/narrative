/*global define*/
/*jslint white:true,browser:true*/

define([
    'base/js/namespace',
    'base/js/dialog'
], function (
    Jupyter,
    dialog
    ) {
    'use strict';
    function deleteCell(cellOrIndex) {
        var cellIndex;
        if (typeof cellOrIndex === 'number') {
            cellIndex = cellOrIndex;
        } else {
            cellIndex = Jupyter.notebook.find_cell_index(cellOrIndex);
        }
        Jupyter.notebook.delete_cell(cellIndex);
    }

    function editNotebookMetadata() {
        Jupyter.notebook.edit_metadata({
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager
        });
    }

    function editCellMetadata(cell) {
        dialog.edit_metadata({
            md: cell.metadata,
            callback: function (md) {
                cell.metadata = md;
            },
            name: 'Cell',
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.keyboard_manager
        });
    }
    
    function saveNotebook() {
        Jupyter.notebook.save_checkpoint();
    }
    
    function findCellIndex(cell) {
        return Jupyter.notebook.find_cell_index(cell);
    }
    
    function getCells() {
        Jupyter.notebook.get_cells();
    }
    
    /*
     * Disables the Jupyter keyboard manager for a given cell.
     * 
     * It works by capturing the focus event. Note the usage of the useCapture
     * argument. This ensures that the cell container element receives the focus
     * event. Normally the focus event is only received by the target element.
     * Note that the target element also receives the focus. This allows 
     * the target element to override the keyboard manager itself. 
     * For instance, in kbase code cells, if the user clicks into a code input
     * area, Jupyter will itself turn the keyboard manager back on. 
     * 
     * The primary use case is to disable all of Jupyter's helpful but
     * diabolically destructive keyboard shortcuts, while a user is interacting
     * with kbase cells. For instance, although we also may remap Jupyter
     * key bindings to disable ones we definitely don't want users to ever use
     * (e.g. merge cells, delete cells), we do need to keep certain ones
     * available - save via alt-s, code running via shift-enter/return, 
     * ctrl-enter/return.
     * 
     * Ideally Jupyter would provide support for custom keymaps as well as
     * hooks for keymappings to be invoked within
     * specific cells or cell types, and within specific areas.
     */
    function disableKeyListenersForCell(cell) {
        cell.element[0].addEventListener('focus', function () {
            Jupyter.keyboard_manager.disable();
        }, true);
    }
    
    return {
        deleteCell: deleteCell,
        editNotebookMetadata: editNotebookMetadata,
        editCellMetadata: editCellMetadata,
        saveNotebook: saveNotebook,
        findCellIndex: findCellIndex,
        getCells: getCells,
        disableKeyListenersForCell: disableKeyListenersForCell
    };
});
