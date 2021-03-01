define([
    'base/js/namespace',
    'common/cellComponents/tabs/jobStatus/jobStatusTab',
    'jquery',
    'common/props',
    '/test/data/testAppObj',
], (Jupyter, jobStatusTab, $, Props, TestAppObject) => {
    'use strict';

    describe('The job status tab module', () => {
        it('loads', () => {
            expect(jobStatusTab).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(jobStatusTab.make).toBeDefined();
        });
    });

    describe('The job status tab instance', () => {
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        let node, mockJobStatusTab;

        beforeEach(() => {
            node = document.createElement('div');

            const model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });

            mockJobStatusTab = jobStatusTab.make({
                model: model,
            });
        });

        it('has a make function that returns an object', () => {
            expect(mockJobStatusTab).not.toBe(null);
        });

        it('has the required methods', () => {
            expect(mockJobStatusTab.start).toBeDefined();
            expect(mockJobStatusTab.stop).toBeDefined();
        });

        it('should start and the job status and job log panel', () => {
            mockJobStatusTab.start({ node: node });

            const contents = ['jobs', 'job-log-section-toggle'];
            contents.forEach((item) => {
                expect(node.innerHTML).toContain(item);
            });
        });
    });
});
