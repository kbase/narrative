/* global describe, it, expect, spyOn */
define([
    'jquery',
    '../../../../../../narrative/nbextensions/bulkImportCell/bulkImportCell',
    'base/js/namespace'
], (
    $,
    BulkImportCell,
    Jupyter
) => {
    'use strict';

    /**
     * Creates a mock Jupyter notebook cell of some type.
     * @param {string} cellType the type of cell it should be
     */
    function createMockCell(cellType) {
        const $cellContainer = $(document.createElement('div'));
        const $icon = $('<div>').attr('data-element', 'icon');
        const $toolbar = $('<div>').addClass('celltoolbar');
        $toolbar.append($icon);
        const mockCell = {
            metadata: {},
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
        return mockCell;
    }

    function mockNotebook() {
        return {
            delete_cell: () => {},
            find_cell_index: () => 1,
        };
    }

    describe('test the bulk import cell module', () => {
        it('should construct a bulk import cell class', () => {
            const cell = createMockCell('code');
            expect(cell.getIcon).not.toBeDefined();
            expect(cell.renderIcon).not.toBeDefined();
            const cellWidget = new BulkImportCell(cell, true);
            expect(cellWidget).toBeDefined();
            expect(cell.getIcon).toBeDefined();
            expect(cell.renderIcon).toBeDefined();
            expect(cell.metadata.kbase).toBeDefined();
            for(const prop of ['id', 'status', 'created', 'title', 'subtitle']) {
                expect(cell.metadata.kbase.attributes[prop]).toBeDefined();
            }
            expect(cell.metadata.kbase.type).toBe('app-bulk-import');
            expect(cell.metadata.kbase.bulkImportCell).toBeDefined();
        });

        it('should have a cell that can render its icon', () => {
            const cell = createMockCell('code');
            const cellWidget = new BulkImportCell(cell, true);
            expect(cell).toBe(cellWidget.cell);
            expect(cell.getIcon()).toContain('fa-stack');
            cell.renderIcon();
            expect(cell.element.find('[data-element="icon"]').html()).toContain('fa-stack');
        });

        it('should fail to make a bulk import cell if the cell is not a code cell', () => {
            expect(() => new BulkImportCell(createMockCell('markdown'))).toThrow();
        });

        it('can tell whether a cell is bulk import cell with a static function', () => {
            const codeCell = createMockCell('code');
            expect(BulkImportCell.isBulkImportCell(codeCell)).toBeFalsy();
            new BulkImportCell(codeCell, true);
            expect(BulkImportCell.isBulkImportCell(codeCell)).toBeTruthy();
        });

        it('should fail to set up a cell that is not a bulk import cell (has been initialized)', () => {
            const cell = createMockCell('code');
            expect(() => new BulkImportCell(cell, false)).toThrow();
        });

        it('should be able to delete its cell', () => {
            const cell = createMockCell('code');
            Jupyter.notebook = mockNotebook();
            spyOn(Jupyter.notebook, 'delete_cell');
            const cellWidget = new BulkImportCell(cell, true);

            cellWidget.deleteCell();
            expect(Jupyter.notebook.delete_cell).toHaveBeenCalled();
        });
    });
});
