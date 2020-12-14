define([
    'base/js/namespace',
    'common/cellComponents/tabs/jobStatus/jobStatusTab',
    'jquery',
    'common/props',
    'json!../../../../../data/testAppObj.json',
], function (Jupyter, jobStatusTab, $, Props, TestAppObject) {
    'use strict';

    describe('The job status tab module', function () {
        it('loads', function () {
            expect(jobStatusTab).not.toBe(null);
        });

        it('has expected functions', function () {
            expect(jobStatusTab.make).toBeDefined();
        });
    });

    describe('The job status tab instance', function () {
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        let jobStatusTab, node;

        beforeEach(function () {
            node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);

            const model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });

            jobStatusTab = jobStatusTab.make({
                model: model
            });
        });

        afterEach(() => {
            $('body').empty();
            jobStatusTab = null;
            node = null;
        });

        it('has a make function that returns an object', function () {
            expect(jobStatusTab).not.toBe(null);
        });

        it('has the required methods', function () {
            expect(jobStatusTab.start).toBeDefined();
            expect(jobStatusTab.stop).toBeDefined();
        });

        it('should start and the job status and job log panel', () => {
            return jobStatusTab
                .start({
                    node: node
                })
                .then(() => {
                    const contents = [
                        'jobs',
                        'job-log-section-toggle'
                    ];
                    contents.forEach((item) => {
                        expect(node.innerHTML).toContain(item);
                    });
                });
        });
    });
});
