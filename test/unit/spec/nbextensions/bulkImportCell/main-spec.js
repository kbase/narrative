/* global describe it expect beforeEach spyOn afterEach beforeAll afterAll */

define([
    'jquery',
    '../../../../../../narrative/nbextensions/bulkImportCell/main',
    '../../../../../../narrative/nbextensions/bulkImportCell/bulkImportCell',
    'base/js/namespace',
    'narrativeMocks'
], (
    $,
    Main,
    BulkImportCell,
    Jupyter,
    Mocks
) => {
    'use strict';

    describe('test the bulkImportCell entrypoint module', () => {
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
            const cell = Mocks.buildMockCell('code', 'app-bulk-import');
            // the mock has two cells, a plain mock code cell, and
            // a mock BulkImportCell
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
            return Main.load_ipython_extension()
                .then(() => {
                    expect(Jupyter.notebook.get_cells).toHaveBeenCalled();
                });
        });

        it('should turn a newly inserted cell into a Bulk Import Cell', (done) => {
            const newCell = Mocks.buildMockCell('code');
            Jupyter.notebook.cells.push(newCell);
            Main.load_ipython_extension()
                .then(() => {
                    $([Jupyter.events]).trigger('insertedAtIndex.Cell', {
                        type: 'code',
                        index: 1,
                        cell: newCell,
                        data: {
                            type: 'app-bulk-import'
                        }
                    });
                    // there's no other triggers except to wait a moment
                    // for the cell to get turned into a bulk import cell
                    // and if it takes more than 100ms, it SHOULD fail.
                    setTimeout(() => {
                        expect(BulkImportCell.isBulkImportCell(newCell)).toBeTruthy();
                        done();
                    }, 100);
                });
        });

        it('should not turn a plain code cell into a Bulk Import Cell', (done) => {
            const newCell = Mocks.buildMockCell('code');
            Jupyter.notebook.cells.push(newCell);
            Main.load_ipython_extension()
                .then(() => {
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
                        expect(BulkImportCell.isBulkImportCell(newCell)).toBeFalsy();
                        done();
                    }, 100);
                });
        });

    });
});
