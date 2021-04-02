define([
    'common/cellComponents/tabs/results/outputWidget',
    'base/js/namespace',
    '/test/data/fakeResultsData',
], (OutputWidget, Jupyter, ResultsData) => {
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
    });
});
