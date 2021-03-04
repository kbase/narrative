define([
    'common/cellComponents/tabs/results/reportWidget',
    'base/js/namespace',
    '/test/data/fakeResultsData',
], (
    ReportWidget,
    Jupyter,
    ResultsData
) => {
    'use strict';

    describe('Test the app/bulk import cell report widget', () => {
        beforeEach(function () {
            this.node = document.createElement('div');
            document.body.appendChild(this.node);
        });

        afterEach(function () {
            this.node.remove();
        });

        it('should start and render with data', async function () {
            const widget = ReportWidget.make();
            await widget.start({
                node: this.node,
                objectData: ResultsData.objectData
            });
            // we should have a div with two <a> elements, each with the
            // name of an object
            expect(this.node.querySelectorAll('a').length).toBe(2);
            expect(this.node.innerHTML).toContain('Reports');
        });

        it('should expand and create a kbaseReportView widget on toggle', async function () {
            const widget = ReportWidget.make();
            // just take a single object to render
            const singleDataObject = ResultsData.objectData[0];

            await widget.start({
                node: this.node,
                objectData: [singleDataObject]
            });
            // there should be only one
            expect(this.node.querySelectorAll('a.kb-report__toggle').length).toBe(1);
            // get a handle on it
            const toggleNode = this.node.querySelector('a.kb-report__toggle');
            // expect it to be collapsed and not to have any siblings
            expect(toggleNode.classList.contains('collapsed')).toBeTruthy();
            expect(toggleNode.nextSibling).toBeNull();

            toggleNode.click();
            // expect it to open up and make a div as a sibling
            expect(toggleNode.classList.contains('collapsed')).toBeFalsy();
            const reportNode = toggleNode.nextSibling;
            expect(reportNode).toBeDefined();
            // marker for running kbaseReportView
            expect(reportNode.innerHTML).toContain('report-widget');
        });

        it('should expand and collapse again on click', async function () {
            const widget = ReportWidget.make();
            // just take a single object to render
            const singleDataObject = ResultsData.objectData[0];

            await widget.start({
                node: this.node,
                objectData: [singleDataObject]
            });
            const toggleNode = this.node.querySelector('a.kb-report__toggle');
            // expect it to be collapsed and not to have any siblings
            expect(toggleNode.classList.contains('collapsed')).toBeTruthy();
            expect(toggleNode.nextSibling).toBeNull();

            toggleNode.click();
            // expect it to open up and make a div as a sibling
            expect(toggleNode.classList.contains('collapsed')).toBeFalsy();
            const reportNode = toggleNode.nextSibling;
            expect(reportNode).toBeDefined();

            // close again on another click
            toggleNode.click();
            expect(toggleNode.classList.contains('collapsed')).toBeTruthy();
            expect(toggleNode.nextSibling).toBeNull();
        });
    });
});
