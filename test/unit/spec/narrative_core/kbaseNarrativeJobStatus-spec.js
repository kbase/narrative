define(['kbaseNarrativeJobStatus', 'testUtil'], (JobStatusWidget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeJobStatus widget', () => {
        it('Should be defined', () => {
            expect(JobStatusWidget).toBeDefined();
            expect(JobStatusWidget).toEqual(jasmine.any(Function));
        });
    });
});
