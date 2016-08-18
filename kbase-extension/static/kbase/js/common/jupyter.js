/*global define*/
/*jslint white:true,browser:true*/

define([
    'base/js/namespace' 
], function (
    Jupyter    
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

    return {
        deleteCell: deleteCell
    };
});

