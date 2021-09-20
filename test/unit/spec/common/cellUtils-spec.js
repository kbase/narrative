define(['common/cellUtils', 'base/js/namespace', 'narrativeMocks'], (Utils, Jupyter, Mocks) => {
    'use strict';

    describe('Cell utils tests', () => {
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

        describe('the setMeta function', () => {
            [
                {
                    group: 'bulkImportCell',
                    name: 'something',
                    value: 'a',
                    type: ' string',
                },
                {
                    group: 'bulkImportCell',
                    name: 'something',
                    value: 1,
                    type: ' number',
                },
                {
                    group: 'bulkImportCell',
                    name: 'something',
                    value: { b: '2' },
                    type: 'n object',
                },
                {
                    group: 'bulkImportCell',
                    name: 'something',
                    value: ['foo', 'bar', 'baz'],
                    type: 'n array',
                },
                {
                    group: 'bulkImportCell',
                    name: 'something',
                    value: null,
                    type: ' null',
                },
                {
                    group: 'bulkImportCell',
                    value: 'a',
                    type: ' string',
                },
                {
                    group: 'bulkImportCell',
                    value: 1,
                    type: ' number',
                },
                {
                    group: 'bulkImportCell',
                    value: { b: '2' },
                    type: 'n object',
                },
                {
                    group: 'bulkImportCell',
                    value: ['foo', 'bar', 'baz'],
                    type: 'n array',
                },
                {
                    group: 'bulkImportCell',
                    value: null,
                    type: ' null',
                },
            ].forEach((testCase) => {
                it(`sets meta with a${testCase.type} value`, () => {
                    const meta = { kbase: { bulkImportCell: {} } },
                        cell = { metadata: meta }, // just a bare cell structure
                        args = [cell, testCase.group, testCase.name, testCase.value].filter(
                            (v) => v !== undefined
                        );
                    Utils.setMeta(...args);
                    let adjustedMeta = cell.metadata.kbase[testCase.group];
                    if (testCase.name) {
                        adjustedMeta = adjustedMeta[testCase.name];
                    }
                    expect(adjustedMeta).toEqual(testCase.value);
                });
            });

            it('sets meta for a new group', () => {
                const meta = { kbase: {} },
                    cell = { metadata: meta };
                Utils.setMeta(cell, 'newGroup', 'newKey', 'value');
                expect(cell.metadata.kbase.newGroup).toEqual({ newKey: 'value' });
            });

            it('throws an error if setting meta for a non-KBase cell', () => {
                const cell = { metadata: {} };
                expect(() => Utils.setMeta(cell, 'foo', 'bar')).toThrowError();
            });
        });

        describe('the getCellMeta function', () => {
            const meta = {
                kbase: {
                    appCell: {
                        foo: 'bar',
                        deep: {
                            deeper: {
                                deepest: 'bottom',
                            },
                        },
                    },
                },
            };

            [
                {
                    path: 'kbase',
                    expected: meta.kbase,
                },
                {
                    path: 'kbase.appCell',
                    expected: meta.kbase.appCell,
                },
                {
                    path: ['kbase', 'appCell'],
                    expected: meta.kbase.appCell,
                },
                {
                    path: 'kbase.appCell.foo',
                    expected: meta.kbase.appCell.foo,
                },
                {
                    path: ['kbase', 'appCell', 'foo'],
                    expected: meta.kbase.appCell.foo,
                },
                {
                    path: 'kbase.appCell.deep.deeper.deepest',
                    expected: meta.kbase.appCell.deep.deeper.deepest,
                },
                {
                    path: 'kbase.appCell',
                    defaultValue: 'stuff',
                    expected: meta.kbase.appCell,
                },
                {
                    path: 'kbase.nope',
                    expected: undefined,
                },
                {
                    path: 'kbase.nope',
                    defaultValue: 'no way',
                    expected: 'no way',
                },
            ].forEach((testCase) => {
                it(`can find test data along the path: ${testCase.path}${
                    testCase.defaultValue ? ' with a default value' : ''
                }`, () => {
                    const cell = { metadata: meta },
                        value = Utils.getCellMeta(cell, testCase.path, testCase.defaultValue);
                    expect(value).toEqual(testCase.expected);
                });
            });
        });

        describe('the setCellMeta function', () => {
            let cell;
            const meta = {
                kbase: {
                    foo: 'bar',
                },
            };
            beforeEach(() => {
                cell = { metadata: Object.assign({}, meta) };
            });

            it('sets a new metadata object if missing', () => {
                cell = {};
                Utils.setCellMeta(cell, 'a', 1);
                expect(cell.metadata).toEqual({ a: 1 });
            });

            it('sets a value with a string path', () => {
                const value = 'x';
                Utils.setCellMeta(cell, 'kbase.test', value);
                expect(cell.metadata.kbase.test).toEqual(value);
            });

            it('sets a value with an array path', () => {
                const value = 'y';
                Utils.setCellMeta(cell, ['kbase', 'test'], value);
                expect(cell.metadata.kbase.test).toEqual(value);
            });

            it('overrides an existing value', () => {
                const value = 'z';
                Utils.setCellMeta(cell, 'kbase.foo', value);
                expect(cell.metadata.kbase.foo).toEqual(value);
            });

            it('forces a refresh when requested', () => {
                // set up a fake "object" to hang a property spy on
                const testCell = {
                    set metadata(data) {
                        this._metadata = data;
                    },
                    get metadata() {
                        return this._metadata;
                    },
                    _metadata: { foo: 'bar' },
                };
                const spy = spyOnProperty(testCell, 'metadata', 'set').and.callThrough();
                Utils.setCellMeta(testCell, 'foo', 'not_bar', true);
                expect(spy).toHaveBeenCalled();
                expect(testCell.metadata.foo).toEqual('not_bar');
            });
        });

        describe('cell id tests', () => {
            const appCellId = 'fake_app_cell',
                bulkImportCellId = 'fake_bulk_import_cell',
                bulkImportTitle = 'Import from Staging Area';

            beforeEach(() => {
                const cell1 = Mocks.buildMockCell('code', 'app');
                cell1.metadata.kbase.attributes.id = appCellId;
                const cell2 = Mocks.buildMockCell('code', 'app-bulk-import');
                cell2.metadata.kbase.attributes.id = bulkImportCellId;
                Jupyter.notebook = Mocks.buildMockNotebook({
                    cells: [cell1, cell2],
                });
            });

            afterEach(() => {
                Jupyter.notebook = null;
            });

            describe('the getTitle function', () => {
                it('retrieves an expected title', () => {
                    expect(Utils.getTitle(bulkImportCellId)).toEqual(bulkImportTitle);
                });

                it('returns undefined for a bad cell id', () => {
                    expect(Utils.getTitle('not a cell')).toBeUndefined();
                });
            });

            describe('the findById function', () => {
                it('retrieves an expected cell', () => {
                    const cell = Utils.findById(bulkImportCellId);
                    expect(cell.metadata.kbase.type).toEqual('app-bulk-import');
                });

                it('returns undefined for a bad cell id', () => {
                    expect(Utils.findById('not a cell')).toBeUndefined();
                });

                it('returns undefined for a duplicate cell', () => {
                    const cell = Mocks.buildMockCell('code', 'app');
                    const fakeId = 'duplicate_cell_id';
                    cell.metadata.kbase.attributes.id = fakeId;
                    Jupyter.notebook = Mocks.buildMockNotebook({
                        cells: [cell, cell],
                    });
                    spyOn(console, 'warn');
                    expect(Utils.findById(fakeId)).toBeUndefined();
                    expect(console.warn).toHaveBeenCalled();
                });
            });
        });
    });
});
