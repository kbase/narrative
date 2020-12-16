define([
    'base/js/namespace',
    'common/cellComponents/tabs/jobStatus/jobStateList',
    'jquery',
    'common/props',
    'json!../../../../../data/testAppObj.json',
], function (Jupyter, jobStateList, $, Props, TestAppObject) {
    'use strict';

    describe('The job status tab module', function () {
        it('loads', function () {
            expect(jobStateList).not.toBe(null);
        });

        it('has expected functions', function () {
            expect(jobStateList.make).toBeDefined();
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

        let node, model,mockJobStateList;

        beforeEach(function () {
            node = document.createElement('div');

            model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });

            mockJobStateList = jobStateList.make({
                model: model
            });
        });

        it('has a make function that returns an object', function () {
            expect(mockJobStateList).not.toBe(null);
        });

        it('has the required methods', function () {
            expect(mockJobStateList.start).toBeDefined();
            expect(mockJobStateList.stop).toBeDefined();
        });

        it('should start and return the correct elements', () => {
            mockJobStateList.start({
                node: node,
                childJobs: model.getItem('exec.jobState.child_jobs')
            });

            const classContents = [
                '.kb-job-status__table',
                '.kb-job-status__table_head',
                '.kb-job-status__table_head_row',
                '.kb-job-status__table_head_cell',
                '.kb-job-status__table_body',
                '.kb-job-status__row',
            ];
            classContents.forEach((item) => {
                expect($(node).find(item).length).toBeGreaterThan(0);
            });

            expect($(node).find('.kb-job-status__row').length).toEqual(7);
        });
    });
});
