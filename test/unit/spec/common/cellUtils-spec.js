define(['common/cellUtils', 'narrativeMocks'], (Utils, Mocks) => {
    'use strict';

    fdescribe('Cell utils tests', () => {
        it('has expected functions', () => {
            const fns = [
                'getMeta',
                'setMeta',
                'getCellMeta',
                'setCellMeta',
                'getTitle',
                'findById',
            ];
            fns.forEach((fn) => {
                expect(Utils[fn]).toEqual(jasmine.any(Function));
            });
        });

        describe('the getMeta function', () => {
            [
                {
                    group: 'attributes',
                    name: 'title',
                    expected: 'Import from Staging Area',
                    label: 'valid group and name',
                },
                {
                    group: 'type',
                    expected: 'app-bulk-import',
                    label: 'valid group, no name',
                },
                {
                    group: 'nope',
                    expected: undefined,
                    label: 'invalid group',
                },
                {
                    group: 'attributes',
                    name: 'nope',
                    expected: undefined,
                    label: 'valid group and invalid name',
                },
                {
                    group: 'nope',
                    name: 'also_nope',
                    expected: undefined,
                    label: 'valid group and invalid name',
                },
            ].forEach((testCase) => {
                it(`works with ${testCase.label}`, () => {
                    const cell = Mocks.buildMockCell('code', 'app-bulk-import');
                    expect(Utils.getMeta(cell, testCase.group, testCase.name)).toEqual(
                        testCase.expected
                    );
                });
            });

            it('returns undefined for a non-KBase cell', () => {
                const cell = { metadata: {} }; // the mockiest of mock cells
                expect(Utils.getMeta(cell, 'attributes')).toBeUndefined();
            });
        });

        describe('the setMeta function', () => {});

        describe('the getCellMeta function', () => {});

        describe('the setCellMeta function', () => {});

        describe('the getTitle function', () => {});

        describe('the findById function', () => {});
    });
});
