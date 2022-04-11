define([
    '/narrative/nbextensions/appCell2/widgets/tabs/resultsTab',
    '/narrative/nbextensions/appCell2/widgets/tabs/resultsViewer',
    'common/props',
    '/test/data/jobsData',
], (ResultsTab, ResultsViewer, Props, JobsData) => {
    'use strict';

    function buildModel() {
        const testJob = JobsData.jobsByStatus.completed[0];
        const data = {
            exec: { jobState: testJob },
        };
        return Props.make({ data });
    }

    const model = buildModel();
    const ResView = {
        start: () => Promise.resolve(),
        stop: () => Promise.resolve(),
    };

    describe('The app cell results tab module', () => {
        it('Should load and return a make function', () => {
            expect(ResultsTab).toEqual(jasmine.any(Object));
            expect(ResultsTab.make).toEqual(jasmine.any(Function));
        });
    });

    describe('The app cell results tab instance', () => {
        it('can be instantiated', () => {
            const resultsTabInstance = ResultsTab.make({ model });
            ['start', 'stop'].forEach((fn) => {
                expect(resultsTabInstance[fn]).toEqual(jasmine.any(Function));
            });
        });

        describe('starts', () => {
            it('in single job mode', async () => {
                const node = document.createElement('div');
                const resultsTabInstance = ResultsTab.make({ model });
                spyOn(ResultsViewer, 'make').and.returnValue(ResView);
                spyOn(ResView, 'start').and.callThrough();
                spyOn(ResView, 'stop').and.callThrough();
                await resultsTabInstance.start({ node, model });
                expect(ResultsViewer.make.calls.allArgs()).toEqual([[{ model }]]);
                expect(ResView.start).toHaveBeenCalledTimes(1);
                expect(ResView.stop).not.toHaveBeenCalled();
            });
        });
        describe('stop', () => {
            it('can stop the widget', async () => {
                const node = document.createElement('div');
                const resultsTabInstance = ResultsTab.make({ model });
                spyOn(ResultsViewer, 'make').and.returnValue(ResView);
                spyOn(ResView, 'start').and.callThrough();
                spyOn(ResView, 'stop').and.callThrough();
                await resultsTabInstance.start({ node, model });
                // stop!
                await resultsTabInstance.stop();
                expect(ResultsViewer.make.calls.allArgs()).toEqual([[{ model }]]);
                expect(ResView.start).toHaveBeenCalledTimes(1);
                expect(ResView.stop).toHaveBeenCalledTimes(1);
            });
            it('can stop the widget without it being started', async () => {
                const resultsTabInstance = ResultsTab.make({ model });
                spyOn(ResultsViewer, 'make').and.returnValue(ResView);
                spyOn(ResView, 'start').and.callThrough();
                spyOn(ResView, 'stop').and.callThrough();

                await resultsTabInstance.stop();
                expect(ResultsViewer.make).not.toHaveBeenCalled();
                expect(ResView.start).not.toHaveBeenCalled();
                expect(ResView.stop).not.toHaveBeenCalled();
            });
        });
    });
});
