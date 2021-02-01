define([
    '../../../../../../narrative/nbextensions/bulkImportCell/bulkImportCell',
    'base/js/namespace',
    'common/runtime',
    'narrativeMocks',
    'json!/test/data/NarrativeTest.test_simple_inputs.spec.json'
], (
    BulkImportCell,
    Jupyter,
    Runtime,
    Mocks,
    TestAppSpec
) => {
    'use strict';
    const fakeInputs = {
        dataType: {
            files: ['some_file'],
            appId: 'someApp'
        }
    };
    const fakeSpecs = {
        someApp: TestAppSpec
    };

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
            const cellWidget = BulkImportCell.make({
                cell,
                importData: fakeInputs,
                specs: fakeSpecs,
                initialize: true
            });
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
            expect(cell.metadata.kbase.bulkImportCell.state).toEqual({
                state: 'editingIncomplete',
                selectedTab: 'configure'
            });
        });

        it('should have a cell that can render its icon', () => {
            const cell = Mocks.buildMockCell('code');
            const cellWidget = BulkImportCell.make({
                cell,
                importData: fakeInputs,
                specs: fakeSpecs,
                initialize: true
            });
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
            BulkImportCell.make({
                cell: codeCell,
                importData: fakeInputs,
                specs: fakeSpecs,
                initialize: true
            });
            expect(BulkImportCell.isBulkImportCell(codeCell)).toBeTruthy();
        });

        it('should fail to set up a cell that is not a bulk import cell (has been initialized)', () => {
            const cell = Mocks.buildMockCell('code');
            expect(() => BulkImportCell({
                cell,
                importData: fakeInputs,
                specs: fakeSpecs,
                initialize: false
            })).toThrow();
        });

        it('should be able to delete its cell', () => {
            const cell = Mocks.buildMockCell('code');
            Jupyter.notebook = Mocks.buildMockNotebook();
            spyOn(Jupyter.notebook, 'delete_cell');
            const cellWidget = BulkImportCell.make({
                cell,
                importData: fakeInputs,
                specs: fakeSpecs,
                initialize: true
            });

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
            BulkImportCell.make({
                cell,
                importData: fakeInputs,
                specs: fakeSpecs,
                initialize: true
            });
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
                fastq: {
                    files: ['file1', 'file2', 'file3'],
                    appId: 'someApp'
                },
                sra: {
                    files: ['file4', 'file5'],
                    appId: 'someApp'
                }
            };
            BulkImportCell.make({
                cell,
                initialize: true,
                specs: fakeSpecs,
                importData
            });
            let elem = cell.element.find('[data-element="filetype-panel"] [data-element="sra"]');
            const before = elem[0].outerHTML;
            elem.click();
            expect(elem[0].outerHTML).not.toEqual(before);

        });
    });
});
