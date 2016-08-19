/*global define*/
/*jslint white:true,browser:true*/

define([
    'base/js/namespace',
    'base/js/dialog'
], function (
    Jupyter,
    dialog
    ) {

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

    return {
        deleteCell: deleteCell,
        editNotebookMetadata: editNotebookMetadata,
        editCellMetadata: editCellMetadata,
        saveNotebook: saveNotebook,
        findCellIndex: findCellIndex,
        getCells: getCells
    };
});

