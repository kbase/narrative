/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    'jquery',
    'base/js/namespace',
    'common/utils'
], function (
    Promise,
    $,
    Jupyter,
    utils
    ) {
    'use strict';

    function specializeCell(cell) {
        cell.minimize = function () {
            var inputArea = this.input.find('.input_area'),
                outputArea = this.element.find('.output_wrapper'),
                showCode = utils.getCellMeta(cell, 'kbase.outputCell.user-settings.showCodeInputArea');

            if (showCode) {
                inputArea.addClass('hidden');
            }
            outputArea.addClass('hidden');
        };

        cell.maximize = function () {
            var inputArea = this.input.find('.input_area'),
                outputArea = this.element.find('.output_wrapper'),
                showCode = utils.getCellMeta(cell, 'kbase.outputCell.user-settings.showCodeInputArea');

            if (showCode) {
                inputArea.removeClass('hidden');
            }
            outputArea.removeClass('hidden');
        };
    }

    function setupCell(cell) {
        if (cell.cell_type !== 'code') {
            return;
        }
        if (!cell.metadata.kbase) {
            return;
        }
        if (cell.metadata.kbase.type !== 'output') {
            return;
        }

        specializeCell(cell);

        // The kbase property is only used for managing runtime state of the cell
        // for kbase. Anything to be persistent should be on the metadata.
        cell.kbase = {
        };

        // Update metadata.
        utils.setMeta(cell, 'attributes', 'lastLoaded', (new Date()).toUTCString());


        // The output cell just needs to inhibit the input area.
        // The input code and associated output (a widget) is already
        // to be found in this cell (during insertion).

        cell.renderMinMax();
    }

    function upgradeCell(cell) {
        // all we do for now is set up the input area
        cell.input.find('.input_area').addClass('hidden');
        utils.setCellMeta(cell, 'kbase.outputCell.user-settings.showCodeInputArea', false);
        setupCell(cell);
    }

    function load() {
        $([Jupyter.events]).on('inserted.Cell', function (event, data) {
            if (data.kbase && data.kbase.type === 'output') {
                upgradeCell(data.cell)
                    .then(function () {
                        
                        console.log('OUTPUT: Cell created?');
                    })
                    .catch(function (err) {
                        console.error('ERROR creating cell', err);
                        // delete cell.
                        $(document).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(data.cell));
                        alert('Could not insert cell due to errors.\n' + err.message);
                    });
            }
        });
        
        Jupyter.notebook.get_cells().forEach(function (cell) {
            try {
                setupCell(cell);
            } catch (ex) {
                console.error('ERROR setting up output cell', ex);
            }
        });
    }

    return {
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load
    };
}, function (err) {
    'use strict';
    console.log('ERROR loading viewCell main', err);
});