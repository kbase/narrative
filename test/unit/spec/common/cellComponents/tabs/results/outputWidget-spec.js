define([
    'common/cellComponents/tabs/results/outputWidget',
    'base/js/namespace',
    'testUtil',
    '/test/data/fakeResultsData',
], (OutputWidget, Jupyter, TestUtil, ResultsData) => {
    'use strict';

    describe('test the created objects viewer', () => {
        let container;
        beforeEach(function () {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
            container = document.createElement('div');
            this.widget = OutputWidget.make();
        });

        afterEach(() => {
            Jupyter.narrative = null;
            container.remove();
            TestUtil.clearRuntime();
        });

        it('should start and render with data', async function () {
            await this.widget.start({
                node: container,
                objectData: ResultsData.objectData,
            });
            // we should have a table with a header and two rows.
            expect(container.querySelectorAll('tr').length).toBe(3);
            expect(container.innerHTML).toContain('Objects');
            ResultsData.objectData.forEach((obj) => {
                expect(container.innerHTML).toContain(obj.name);
            });
        });

        it('should start and render an empty area with a message saying there is no data', async function () {
            await this.widget.start({
                node: container,
                objectData: [],
            });
            // should make an outer, classed node with nothing in it
            const objNode = container.querySelector('div.kb-created-objects');
            expect(objNode).toBeDefined();
            expect(objNode.innerHTML).toContain('No objects created');
        });

        it('should stop and clear its node', async function () {
            await this.widget.start({
                node: container,
                objectData: ResultsData.objectData,
            });
            // just double check it was made and the node was modified,
            // deeper tests are above
            expect(container.innerHTML).toContain('Objects');
            await this.widget.stop();
            expect(container.innerHTML).toEqual('');
        });

        const baseObjData = {
            name: 'SomeObject',
            type: 'SomeModule.someType-1.0',
            description: 'an object',
            wsInfo: [
                2,
                'SomeObject',
                'SomeModule.someType-1.0',
                '2021-10-22T20:16:36+0000',
                1,
                'someuser',
                12345,
                'someuser:narrative_123456789',
                'ahash',
                123,
                null,
            ],
        };
        Object.keys(baseObjData).forEach((key) => {
            it(`should start and render data missing ${key}`, async function () {
                const objData = TestUtil.JSONcopy(baseObjData);
                delete objData[key];
                await this.widget.start({
                    node: container,
                    objectData: [objData],
                });
                expect(container.innerHTML).toContain('Objects');
                // should basically all be the same, except for description and wsInfo
                const row = container.querySelector('table.dataTable tbody tr');
                const nameElem = row.querySelector('td:first-child');
                const objLink = nameElem.querySelector('a.kb-output-widget__object_link');
                const description = row.querySelector('td:last-child').innerHTML;
                expect(nameElem.innerHTML).toContain(baseObjData.name);
                expect(row.querySelector('td:nth-child(2)').innerHTML).toContain('someType');
                if ('description' in objData) {
                    expect(description).toContain(objData.description);
                } else {
                    expect(description).toBe('Missing description');
                }
                if ('wsInfo' in objData) {
                    expect(objLink).not.toBeNull();
                } else {
                    expect(objLink).toBeNull();
                }
            });
        });

        it(`should show a default string when missing wsInfo, and other values`, async function () {
            await this.widget.start({
                node: container,
                objectData: [{}],
            });
            expect(container.innerHTML).toContain('Objects');
            const row = container.querySelector('table.dataTable tbody tr');
            const expectedStrings = ['Unknown object name', 'Missing type', 'Missing description'];
            expectedStrings.forEach((value, idx) => {
                expect(row.querySelector(`td:nth-child(${idx + 1})`).innerHTML).toBe(value);
            });
        });
    });
});
