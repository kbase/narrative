/**
 * This module contains several mock objects that can be reused throughout unit tests.
 * General usage is as per other AMD modules, e.g.:
 * define(['narrativeMocks'], (Mocks) => {
 *      const mockCell = Mocks.buildMockCell('code');
 *      // now this mockCell can be used in various ways
 *      // it's incomplete for a real Jupyter cell, but should still be mostly
 *      // functional in many Narrative contexts
 * })
 */

define('narrativeMocks', [
    'jquery',
    'uuid'
], (
    $,
    UUID
) => {
    'use strict';
    /**
     * Creates a mock Jupyter notebook cell of some type.
     * @param {string} cellType the type of cell it should be
     * @param {string} kbaseCellType if present, mock up an extended cell by adding some
     *      base metadata.
     */
    function buildMockCell(cellType, kbaseCellType) {
        const $cellContainer = $(document.createElement('div'));
        const $icon = $('<div>').attr('data-element', 'icon');
        const $toolbar = $('<div>').addClass('celltoolbar');
        $toolbar.append($icon);
        const metadata = kbaseCellType ? buildMockExtensionCellMetadata(kbaseCellType) : {};
        const mockCell = {
            metadata: {kbase: metadata},
            cell_type: cellType,
            renderMinMax: () => {},
            element: $cellContainer,
            input: $('<div>').addClass('input'),
            output: $('<div>').addClass('output')
        };
        $cellContainer
            .append($toolbar)
            .append(mockCell.input)
            .append(mockCell.output);
        $('body').append($cellContainer);
        return mockCell;
    }

    /**
     * Builds some mock cell metadata based on the kbaseCellType being mocked.
     * This cell type should be one of:
     *  app-bulk-import
     *  app
     *  (others to be added as tests get filled out)
     * The metadata is expected to go under the `kbase` key in a real cell.
     * So it should go like this:
     * cell.metadata = {
     *  kbase: <result of this function>,
     *  ... other cell metadata from Jupyter ...
     * }
     * @param {string} kbaseCellType
     */
    function buildMockExtensionCellMetadata(kbaseCellType) {
        let meta = {
            type: kbaseCellType,
            attributes: {
                id: new UUID(4).format(),
                status: 'new',
                created: (new Date()).toUTCString(),
                title: '',
                subtitle: ''
            }
        };
        switch(kbaseCellType) {
            case 'app-bulk-import':
                meta.bulkImportCell = {
                    'user-settings': {
                        showCodeInputArea: false
                    },
                    inputs: {}
                };
                meta.attributes.title = 'Import from Staging Area',
                meta.attributes.subtitle = 'Import files into your Narrative as data objects';
                break;
            case 'app':
                meta.appCell = {
                };
                break;
            default:
                // if we don't know the cell type, return a blank metadata
                meta = {};
                break;
        }
        return meta;
    }

    /**
     * Builds a mock Jupyter notebook object with a few keys, but mostly
     * an empty object for modification for whatever testing purposes.
     * @param {object} options a set of options for the mock notebook, with the following:
     *  - deleteCallback: function to be called when `delete_cell` is called.
     *  - fullyLoaded: boolean, if true, then treat the notebook as fully loaded
     *  - cells: a list of mocked cells (see buildMockCell)
     */
    function buildMockNotebook(options) {
        options = options || {};
        const cells = options.cells || [];
        return {
            delete_cell: () => options.deleteCallback ? options.deleteCallback() : null,
            find_cell_index: () => 1,
            get_cells: () => cells,
            _fully_loaded: options.fullyLoaded,
            cells: cells
        };
    }

    return {
        buildMockCell: buildMockCell,
        buildMockNotebook: buildMockNotebook
    };

});
