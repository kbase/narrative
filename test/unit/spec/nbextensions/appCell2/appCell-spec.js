define(['/narrative/nbextensions/appCell2/appCell', 'testUtil', 'narrativeMocks'], (
    AppCell,
    TestUtil,
    Mocks
) => {
    'use strict';

    fdescribe('test the base AppCell2 module', () => {
        it('loads with expected functions', () => {
            ['make', 'isAppCell'].forEach((fn) => {
                expect(AppCell[fn]).toEqual(jasmine.any(Function));
            });
        });

        describe('create AppCell tests', () => {
            afterEach(() => {
                TestUtil.clearRuntime();
            });

            it('makes an AppCell without starting it', () => {
                const fakeCell = Mocks.buildMockCell('code');
                const appCell = AppCell.make(fakeCell);
                ['setupCell', 'upgradeToAppCell'].forEach((fn) => {
                    expect(appCell[fn]).toEqual(jasmine.any(Function));
                });
            });
        });

        describe('isAppCell tests', () => {
            const allowedCellTypes = ['app2', 'app', 'devapp'];
            allowedCellTypes.forEach((cellType) => {
                it(`returns true for a ${cellType} tagged cell`, () => {
                    const cell = {
                        cell_type: 'code',
                        metadata: {
                            kbase: {
                                type: cellType,
                            },
                        },
                    };
                    expect(AppCell.isAppCell(cell)).toBeTrue();
                });
            });

            const badCellCases = [
                {
                    cell: { cell_type: 'markdown' },
                    label: 'a markdown Jupyter type',
                },
                {
                    cell: { cell_type: 'code', metadata: {} },
                    label: 'no kbase metadata',
                },
                {
                    cell: { cell_type: 'code', metadata: { kbase: { type: 'foo' } } },
                    label: 'mismatched kbase type',
                },
            ];
            badCellCases.forEach((testCase) => {
                it(`returns false for a cell with ${testCase.label}`, () => {
                    expect(AppCell.isAppCell(testCase.cell)).toBeFalse();
                });
            });
        });
    });
});
