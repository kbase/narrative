define(['jquery', 'bluebird', 'widgets/dynamicTable'], ($, Promise, DynamicTable) => {
    'use strict';
    let dummyRows = [
            [1, 2, 3],
            [4, 5, 6],
        ],
        dummyHeaders = [
            {
                id: 'col1',
                text: 'Column 1',
                isSortable: true,
            },
            {
                id: 'col2',
                text: 'Column 2',
                isSortable: true,
            },
            {
                id: 'col3',
                text: 'Column 3',
                isSortable: false,
            },
        ],
        $dummyDiv = $('<div>'),
        dummyTable;

    describe('Test the DynamicTable widget', () => {
        beforeEach(() => {
            dummyTable = new DynamicTable($dummyDiv, {
                headers: dummyHeaders,
                updateFunction: function (pageNum, query, sortColId, sortColDir) {
                    return Promise.resolve({
                        start: 0,
                        total: dummyRows.length,
                        rows: dummyRows,
                    });
                },
            });
        });

        it('Should instantiate with essentially empty data', () => {
            const $container = $('<div>');
            const dt = new DynamicTable($container, {
                updateFunction: () => {
                    return Promise.resolve({
                        start: 0,
                        total: 0,
                        rows: [],
                    });
                },
            });
            expect(dt).toEqual(jasmine.any(Object));
        });

        it('Should display data', () => {
            expect(dummyTable).toEqual(jasmine.any(Object));
        });

        it('Should paginate and show which page', () => {});

        it('Should show an error when pagination fails', () => {});

        it('Should sort properly', () => {});

        it('Should decorate rows properly', () => {});

        it('Should add outer widget classes properly', () => {});

        it('Should add table styles properly', () => {});

        it('Should have optional download buttons', () => {});
    });
});
