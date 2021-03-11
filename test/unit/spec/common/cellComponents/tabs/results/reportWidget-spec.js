define([
    'common/cellComponents/tabs/results/reportWidget',
    'base/js/namespace',
    '/test/data/fakeResultsData',
], (ReportWidget, Jupyter, ResultsData) => {
    'use strict';

    describe('Test the app/bulk import cell report widget', () => {
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        beforeEach(function () {
            this.node = document.createElement('div');
            document.body.appendChild(this.node);
            this.widget = ReportWidget.make();
        });

        afterEach(function () {
            this.node.remove();
        });

        it('should start and render with data', async function () {
            await this.widget.start({
                node: this.node,
                objectData: ResultsData.objectData,
            });
            // we should have a div with two <a> elements, each with the
            // name of an object
            expect(this.node.querySelectorAll('a').length).toBe(2);
            expect(this.node.innerHTML).toContain('Reports');
            ResultsData.objectData.forEach((obj) => {
                expect(this.node.innerHTML).toContain(obj.name);
            });
        });

        it('should clear itself after stopping', async function () {
            await this.widget.start({
                node: this.node,
                objectData: ResultsData.objectData,
            });
            expect(this.node.innerHTML).toContain('Reports');
            await this.widget.stop();
            expect(this.node.innerHTML).toBe('');
        });

        it('should expand and create a kbaseReportView widget on toggle', async function () {
            // just take a single object to render
            const singleDataObject = ResultsData.objectData[0];

            await this.widget.start({
                node: this.node,
                objectData: [singleDataObject],
            });
            // there should be only one
            expect(this.node.querySelectorAll('a.kb-report__toggle').length).toBe(1);
            // get a handle on it
            const toggleNode = this.node.querySelector('a.kb-report__toggle');
            // expect it to be collapsed and not to have any siblings
            expect(toggleNode).toHaveClass('collapsed');
            expect(toggleNode.nextSibling).toBeNull();

            toggleNode.click();
            // expect it to open up and make a div as a sibling
            expect(toggleNode).not.toHaveClass('collapsed');
            const reportNode = toggleNode.nextSibling;
            expect(reportNode).toBeDefined();
            // marker for running kbaseReportView
            expect(reportNode.innerHTML).toContain('kb-report-view');
        });

        it('should expand and collapse again on click', async function () {
            // just take a single object to render
            const singleDataObject = ResultsData.objectData[0];

            await this.widget.start({
                node: this.node,
                objectData: [singleDataObject],
            });
            const toggleNode = this.node.querySelector('a.kb-report__toggle');
            // expect it to be collapsed and not to have any siblings
            expect(toggleNode).toHaveClass('collapsed');
            expect(toggleNode.nextSibling).toBeNull();

            toggleNode.click();
            // expect it to open up and make a div as a sibling
            expect(toggleNode).not.toHaveClass('collapsed');
            const reportNode = toggleNode.nextSibling;
            expect(reportNode).toBeDefined();

            // close again on another click
            toggleNode.click();
            expect(toggleNode).toHaveClass('collapsed');
            expect(toggleNode.nextSibling).toBeNull();
        });
    });
});
