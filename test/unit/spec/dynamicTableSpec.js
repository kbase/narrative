define(['jquery', 'bluebird', 'widgets/dynamicTable', 'testUtil'], ($, Promise, DynamicTable, TestUtil) => {
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

    afterAll(() => TestUtil.clearRuntime());

    describe('The DynamicTable widget', () => {
        let container;
        beforeEach(function () {
            container = document.createElement('div');
            this.dt = new DynamicTable($(container), {
                headers: headers,
                // args to updateFunction: pageNum, query, sortColId, sortColDir
                updateFunction: function () {
                    return Promise.resolve({
                        start: 0,
                        total: rows.length,
                        rows: rows,
                    });
                },
            });
        });
        afterEach(() => {
            container.remove();
        });

        it('Should instantiate with essentially empty data', () => {
            container = document.createElement('div');
            const dt = new DynamicTable($(container), {
                updateFunction: () => {
                    return Promise.resolve({
                        start: 0,
                        total: 0,
                        rows: [],
                    });
                },
            });
            expect(dt).toEqual(jasmine.any(Object));
            const table = container.querySelector('table');
            expect(table.id).toBe('dynamic_table');
        });

        it('should have headers set correctly', function () {
            expect(this.dt).toEqual(jasmine.any(Object));
            const table = container.querySelector('table');
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
