define([
    'base/js/namespace',
    'common/cellComponents/tabs/jobStatus/jobStateListRow',
    'jquery',
    'common/props',
    '/test/data/testAppObj',
], (Jupyter, jobStateListRow, $, Props, TestAppObject) => {
    'use strict';

    describe('The job status tab module', () => {
        it('loads', () => {
            expect(jobStateListRow).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(jobStateListRow.make).toBeDefined();
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

        let node, model, mockJobStateListRow;

        beforeEach(() => {
            node = document.createElement('tr');

            model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });

            mockJobStateListRow = jobStateListRow.make({
                model: model,
            });
        });

        it('has a make function that returns an object', () => {
            expect(mockJobStateListRow).not.toBe(null);
        });

        it('has the required methods', () => {
            expect(mockJobStateListRow.start).toBeDefined();
            expect(mockJobStateListRow.stop).toBeDefined();
        });

        it('should start and return the correct elements', () => {
            mockJobStateListRow.start({
                node: node,
                initialState: 'created',
                name: 'testObject',
            });

            const classContents = [
                '.kb-job-status__cell_log_btn',
                '.show_log',
                '.selected_log',
                '.kb-job-status__icon',
                '.kb-job-status__icon--created',
                '.kb-job-status__cell_action--created',
            ];
            classContents.forEach((item) => {
                expect($(node).find(item).length).toBeGreaterThan(0);
            });

            expect(node.innerHTML).toContain('CANCEL');
            expect(node.innerHTML).toContain('Queued');
        });
    });
});
