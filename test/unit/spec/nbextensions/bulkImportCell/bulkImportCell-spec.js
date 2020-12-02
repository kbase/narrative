/* global describe it expect spyOn beforeAll afterAll */
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
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken'
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        it('should construct a bulk import cell class', () => {
            const cell = Mocks.buildMockCell('code');
            expect(cell.getIcon).not.toBeDefined();
            expect(cell.renderIcon).not.toBeDefined();
            const cellWidget = BulkImportCell.make({cell, initialize: true});
            expect(cellWidget).toBeDefined();
            ['getIcon', 'renderIcon', 'maximize', 'minimize'].forEach( (method) => {
                expect(cell[method]).toBeDefined();
            });
            expect(cell.metadata.kbase).toBeDefined();
            for(const prop of ['id', 'status', 'created', 'title', 'subtitle']) {
                expect(cell.metadata.kbase.attributes[prop]).toBeDefined();
            }
            expect(cell.metadata.kbase.type).toBe('app-bulk-import');
            expect(cell.metadata.kbase.bulkImportCell).toBeDefined();
        });

        it('should have a cell that can render its icon', () => {
            const cell = Mocks.buildMockCell('code');
            const cellWidget = BulkImportCell.make({cell, initialize: true});
            expect(cell).toBe(cellWidget.cell);
            expect(cell.getIcon()).toContain('fa-stack');
            cell.renderIcon();
            expect(cell.element.find('[data-element="icon"]').html()).toContain('fa-stack');
        });

        it('should fail to make a bulk import cell if the cell is not a code cell', () => {
            const cell = Mocks.buildMockCell('markdown');
            expect(() => BulkImportCell.make({cell})).toThrow();
        });

        it('can tell whether a cell is bulk import cell with a static function', () => {
            const codeCell = Mocks.buildMockCell('code');
            expect(BulkImportCell.isBulkImportCell(codeCell)).toBeFalsy();
            BulkImportCell.make({cell: codeCell, initialize: true});
            expect(BulkImportCell.isBulkImportCell(codeCell)).toBeTruthy();
        });

        it('should fail to set up a cell that is not a bulk import cell (has been initialized)', () => {
            const cell = Mocks.buildMockCell('code');
            expect(() => BulkImportCell({cell, initialize: false})).toThrow();
        });

        it('should be able to delete its cell', () => {
            const cell = Mocks.buildMockCell('code');
            Jupyter.notebook = Mocks.buildMockNotebook();
            spyOn(Jupyter.notebook, 'delete_cell');
            const cellWidget = BulkImportCell.make({cell, initialize: true});

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
            BulkImportCell.make({cell, initialize: true});
            runtime.bus().send({}, {
                channel: {
                    cell: cell.metadata.kbase.attributes.id
                },
                key: {
                    type: 'delete-cell'
                }
            });
        });

        it('should toggle the active file type', () => {
            const cell = Mocks.buildMockCell('code');
            const importData = {
                fastq: ['file1', 'file2', 'file3'],
                sra: ['file4', 'file5']
            };
            BulkImportCell.make({
                cell: cell,
                initialize: true,
                importData: importData
            });
            let elem = cell.element.find('[data-element="category-panel"] [data-element="sra"]');
            const before = elem[0].outerHTML;
            elem.click();
            expect(elem[0].outerHTML).not.toEqual(before);

        });
    });
});
