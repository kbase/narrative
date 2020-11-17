/* global describe, it, expect, spyOn */
define([
    '../../../../../../narrative/nbextensions/bulkImportCell/bulkImportCell',
    'base/js/namespace',
    'common/runtime',
    'narrativeMocks'
], (
    BulkImportCell,
    Jupyter,
    Runtime,
    Mocks
) => {
    'use strict';

    describe('test the bulk import cell module', () => {
        it('should construct a bulk import cell class', () => {
            const cell = Mocks.buildMockCell('code');
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
            const cell = Mocks.buildMockCell('code');
            const cellWidget = new BulkImportCell(cell, true);
            expect(cell).toBe(cellWidget.cell);
            expect(cell.getIcon()).toContain('fa-stack');
            cell.renderIcon();
            expect(cell.element.find('[data-element="icon"]').html()).toContain('fa-stack');
        });

        it('should fail to make a bulk import cell if the cell is not a code cell', () => {
            const cell = Mocks.buildMockCell('markdown');
            expect(() => new BulkImportCell(cell)).toThrow();
        });

        it('can tell whether a cell is bulk import cell with a static function', () => {
            const codeCell = Mocks.buildMockCell('code');
            expect(BulkImportCell.isBulkImportCell(codeCell)).toBeFalsy();
            new BulkImportCell(codeCell, true);
            expect(BulkImportCell.isBulkImportCell(codeCell)).toBeTruthy();
        });

        it('should fail to set up a cell that is not a bulk import cell (has been initialized)', () => {
            const cell = Mocks.buildMockCell('code');
            expect(() => new BulkImportCell(cell, false)).toThrow();
        });

        it('should be able to delete its cell', () => {
            const cell = Mocks.buildMockCell('code');
            Jupyter.notebook = Mocks.buildMockNotebook();
            spyOn(Jupyter.notebook, 'delete_cell');
            const cellWidget = new BulkImportCell(cell, true);

            cellWidget.deleteCell();
            expect(Jupyter.notebook.delete_cell).toHaveBeenCalled();
        });

        it('responds to a delete-cell bus message', (done) => {
            const runtime = Runtime.make();
            const cell = Mocks.buildMockCell('code');
            Jupyter.notebook = Mocks.buildMockNotebook({
                deleteCallback: () => done()
            });
            spyOn(Jupyter.notebook, 'delete_cell').and.callThrough();
            new BulkImportCell(cell, true);
            runtime.bus().send({}, {
                channel: {
                    cell: cell.metadata.kbase.attributes.id
                },
                key: {
                    type: 'delete-cell'
                }
            });
        });
    });
});