define([
    'common/cellComponents/tabs/results/outputWidget',
    'base/js/namespace',
    '/test/data/fakeResultsData',
], (OutputWidget, Jupyter, ResultsData) => {
    'use strict';

    describe('test the created objects viewer', () => {
        beforeEach(function () {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
            this.node = document.createElement('div');
            document.body.appendChild(this.node);
            this.widget = OutputWidget.make();
        });

        afterEach(function () {
            Jupyter.narrative = null;
            this.node.remove();
        });

        it('should start and render with data', async function () {
            await this.widget.start({
                node: this.node,
                objectData: ResultsData.objectData,
            });
            // we should have a table with a header and two rows.
            expect(this.node.querySelectorAll('tr').length).toBe(3);
            expect(this.node.innerHTML).toContain('Objects');
            ResultsData.objectData.forEach((obj) => {
                expect(this.node.innerHTML).toContain(obj.name);
            });
        });

        it('should start and render an empty area with a message saying there is no data', async function () {
            await this.widget.start({
                node: this.node,
                objectData: [],
            });
            // should make an outer, classed node with nothing in it
            const objNode = this.node.querySelector('div.kb-created-objects');
            expect(objNode).toBeDefined();
            expect(objNode.innerHTML).toContain('No objects created');
        });

        it('should stop and clear its node', async function () {
            await this.widget.start({
                node: this.node,
                objectData: ResultsData.objectData,
            });
            // just double check it was made and the node was modified,
            // deeper tests are above
            expect(this.node.innerHTML).toContain('Objects');
            await this.widget.stop();
            expect(this.node.innerHTML).toEqual('');
        });
    });
});
