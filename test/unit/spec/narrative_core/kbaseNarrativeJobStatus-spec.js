define(['kbaseNarrativeJobStatus', 'testUtil'], (JobStatusWidget, TestUtil) => {
    'use strict';

    describe('The kbaseNarrativeJobStatus widget', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('Should be defined', () => {
            expect(JobStatusWidget).toBeDefined();
            expect(JobStatusWidget).toEqual(jasmine.any(Function));
        });
    });
});
