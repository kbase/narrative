define([
    'jquery',
    '/narrative/nbextensions/bulkImportCell/main',
    '/narrative/nbextensions/bulkImportCell/bulkImportCell',
    'base/js/namespace',
    'narrativeMocks',
    'testUtil',
    'json!/test/data/NarrativeTest.test_input_params.spec.json',
], ($, Main, BulkImportCell, Jupyter, Mocks, TestUtil, TestAppSpec) => {
    'use strict';

    describe('test the bulkImportCell entrypoint module', () => {
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        afterEach(() => {
            TestUtil.clearRuntime();
        });

        describe('on start', () => {
            beforeEach(() => {
                // create a mock bulkImportCell and add it to the mock notebook
                const cell = Mocks.buildMockCell('code', 'app-bulk-import');
                // mock the notebook for the main module
                Jupyter.notebook = Mocks.buildMockNotebook({
                    cells: [cell],
                    fullyLoaded: true,
                });
            });

            afterEach(() => {
                Jupyter.notebook = null;
            });

            it('should have a load_ipython_extension function', () => {
                expect(Main.load_ipython_extension).toBeDefined();
            });

            it('should initialize the notebook', () => {
                // expect that setupNotebook was called, which we can
                // proxy by checking on Jupyter.notebook.get_cells.
                spyOn(Jupyter.notebook, 'get_cells').and.callThrough();
                spyOn(BulkImportCell, 'make').and.callFake(() => {
                    // fake out the call to 'make' the bulk import cell
                    // as the mock does not have all the metadata
                });
                return Main.load_ipython_extension().then(() => {
                    expect(Jupyter.notebook.get_cells).toHaveBeenCalled();
                    expect(BulkImportCell.make).toHaveBeenCalled();
                });
            });
        });

        describe('a newly-inserted code cell', () => {
            let codeCell;
            beforeEach(() => {
                // create a mock code cell and add it to the mock notebook
                codeCell = Mocks.buildMockCell('code');
                Jupyter.notebook = Mocks.buildMockNotebook({
                    cells: [codeCell],
                    fullyLoaded: true,
                });
            });

            afterEach(() => {
                codeCell.element.remove();
                Jupyter.notebook = null;
            });

            it('can be turned into a Bulk Import Cell', (done) => {
                Main.load_ipython_extension().then(() => {
                    $([Jupyter.events]).trigger('insertedAtIndex.Cell', {
                        type: 'code',
                        index: 0,
                        cell: codeCell,
                        data: {
                            type: 'app-bulk-import',
                            typesToFiles: {
                                fileType: {
                                    files: ['a_file'],
                                    appId: 'someApp',
                                },
                            },
                            specs: {
                                someApp: TestAppSpec,
                            },
                        },
                    });
                    // there's no other triggers except to wait a moment
                    // for the cell to get turned into a bulk import cell
                    // and if it takes more than 100ms, it SHOULD fail.
                    setTimeout(() => {
                        expect(BulkImportCell.isBulkImportCell(codeCell)).toBeTruthy();
                        done();
                    }, 100);
                });
            });

            it('cannot be converted into a Bulk Import Cell without data', (done) => {
                Main.load_ipython_extension().then(() => {
                    $([Jupyter.events]).trigger('insertedAtIndex.Cell', {
                        type: 'code',
                        index: 0,
                        cell: codeCell,
                        data: {},
                    });
                    // there's no other triggers except to wait a moment
                    // for the cell to get turned into a bulk import cell
                    // and if it takes more than 100ms, it SHOULD fail.
                    setTimeout(() => {
                        expect(BulkImportCell.isBulkImportCell(codeCell)).toBeFalsy();
                        done();
                    }, 100);
                });
            });
        });
    });
});
