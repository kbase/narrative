define([
    'jquery',
    '../../../../../../narrative/nbextensions/codeCell/main',
    'base/js/namespace',
    'narrativeMocks',
], ($, Main, Jupyter, Mocks) => {
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
                getAuthToken: () => 'fakeToken',
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
                fullyLoaded: true,
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
                    type: 'code',
                },
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
                data: {},
            });
            setTimeout(() => {
                expect(newCell.cellType).toBeUndefined();
                expect(isCodeCell(newCell)).toBeFalsy();
                done();
            }, 100);
        });

        it('should convert userSettings into user-settings', (done) => {
            const newCell = Mocks.buildMockCell('code', 'codeWithUserSettings');
            expect(newCell.metadata.kbase.codeCell.userSettings.showCodeInputArea).toBe(true);
            Jupyter.notebook.cells.push(newCell);

            Main.load_ipython_extension();
            $([Jupyter.events]).trigger('insertedAtIndex.Cell', {
                type: 'code',
                index: 1,
                cell: newCell,
                data: {
                    type: 'code',
                },
            });
            setTimeout(() => {
                expect(isCodeCell(newCell)).toBeTruthy();
                expect(newCell.metadata.kbase.codeCell.userSettings).not.toBeDefined();
                expect(newCell.metadata.kbase.codeCell).toEqual({
                    'user-settings': {
                        showCodeInputArea: true,
                    },
                });
                done();
            }, 100);
        });

        it('when in doubt, use the old settings', (done) => {
            const newCell = Mocks.buildMockCell('code', 'codeWithUserSettings');
            newCell.metadata.kbase.codeCell['user-settings'] = { showCodeInputArea: false };
            expect(newCell.metadata.kbase.codeCell.userSettings.showCodeInputArea).toBe(true);
            expect(newCell.metadata.kbase.codeCell['user-settings'].showCodeInputArea).toBe(false);
            Jupyter.notebook.cells.push(newCell);

            Main.load_ipython_extension();
            $([Jupyter.events]).trigger('insertedAtIndex.Cell', {
                type: 'code',
                index: 1,
                cell: newCell,
                data: {
                    type: 'code',
                },
            });
            setTimeout(() => {
                expect(isCodeCell(newCell)).toBeTruthy();
                expect(newCell.metadata.kbase.codeCell.userSettings).not.toBeDefined();
                expect(newCell.metadata.kbase.codeCell).toEqual({
                    'user-settings': {
                        showCodeInputArea: true,
                    },
                });
                done();
            }, 100);
        });
    });
});
