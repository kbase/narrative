define([
    'jquery',
    '../../../../../../narrative/nbextensions/codeCell/main',
    '../../../../../../narrative/nbextensions/codeCell/widgets/codeCell',
    'base/js/namespace',
    'narrativeMocks'
], (
    $,
    Main,
    codeCell,
    Jupyter,
    Mocks
) => {
    'use strict';

    function isCodeCell(cell) {
        if (cell.cell_type !== 'code' || !cell.metadata.kbase) {
            return false;
        }
        return cell.metadata.kbase.type === 'code';
    }

    describe('test the codeCell entrypoint module', () => {
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken'
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        beforeEach(() => {
            // mock the notebook for the main module
            const cell = Mocks.buildMockCell('code', 'code');
            // the mock has two cells, a plain mock code cell, and
            // a mock codeCell
            Jupyter.notebook = Mocks.buildMockNotebook({
                cells: [cell],
                fullyLoaded: true
            });
        });

        afterEach(() => {
            Jupyter.notebook = null;
        });

        it('should have a load_ipython_extension function', () => {
            expect(Main.load_ipython_extension).toBeDefined();
        });

        it('should initialize the notebook on start', () => {
            // expect that setupNotebook was called, which we can
            // proxy by checking on Jupyter.notebook.get_cells.
            spyOn(Jupyter.notebook, 'get_cells').and.callThrough();
            Main.load_ipython_extension();
            expect(Jupyter.notebook.get_cells).toHaveBeenCalled();
        });

        it('should turn a newly inserted cell into a code cell', (done) => {
            const newCell = Mocks.buildMockCell('code');
            Jupyter.notebook.cells.push(newCell);
            Main.load_ipython_extension();
            $([Jupyter.events]).trigger('insertedAtIndex.Cell', {
                type: 'code',
                index: 1,
                cell: newCell,
                data: {
                    type: 'code'
                }
            });
            // there's no other triggers except to wait a moment
            // for the cell to get turned into a bulk import cell
            // and if it takes more than 100ms, it SHOULD fail.
            setTimeout(() => {
                expect(isCodeCell(newCell)).toBeTruthy();
                done();
            }, 100);
        });

        it('should not turn a plain code cell into a kbase code cell', (done) => {
            const newCell = Mocks.buildMockCell('code');
            Jupyter.notebook.cells.push(newCell);
            Main.load_ipython_extension();
            $([Jupyter.events]).trigger('insertedAtIndex.Cell', {
                type: 'code',
                index: 1,
                cell: newCell,
                data: {}
            });
            // there's no other triggers except to wait a moment
            // for the cell to get turned into a bulk import cell
            // and if it takes more than 100ms, it SHOULD fail.
            setTimeout(() => {
                expect(newCell.cellType).toBeUndefined();
                expect(isCodeCell(newCell)).toBeFalsy();
                done();
            }, 100);
        });
    });
});
