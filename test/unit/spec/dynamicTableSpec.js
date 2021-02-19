define(['jquery', 'bluebird', 'widgets/dynamicTable'], ($, Promise, DynamicTable) => {
    'use strict';
    const rows = [
            [1, 2, 3],
            [4, 5, 6],
        ],
        headers = [
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
        ];

    describe('The DynamicTable widget', () => {
        beforeEach(function () {
            this.div = document.createElement('div');
            this.dt = new DynamicTable($(this.div), {
                headers: headers,
                updateFunction: function () {
                    //pageNum, query, sortColId, sortColDir) {
                    return Promise.resolve({
                        start: 0,
                        total: rows.length,
                        rows: rows,
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
            const table = $container[0].querySelector('table');
            expect(table.id).toBe('dynamic_table');
        });

        it('should have headers set correctly', function () {
            expect(this.dt).toEqual(jasmine.any(Object));
            const table = this.div.querySelector('table');
            expect(table.id).toBe('dynamic_table');
            const thElements = table.querySelectorAll('thead th');
            expect(thElements.length).toBe(headers.length);
            headers.forEach((header, index) => {
                expect(thElements[index].innerHTML).toContain(header.text);
            });
        });

        xit('Should display data', () => {});

        xit('Should paginate and show which page', () => {});

        xit('Should show an error when pagination fails', () => {});

        xit('Should sort properly', () => {});

        xit('Should decorate rows properly', () => {});

        xit('Should add outer widget classes properly', () => {});

        xit('Should add table styles properly', () => {});

        xit('Should have optional download buttons', () => {});
    });
});
