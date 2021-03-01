define(['kbaseNarrativeJobStatus'], (JobStatusWidget) => {
    'use strict';
    describe('The kbaseNarrativeJobStatus widget', () => {
        it('Should be defined', () => {
            expect(JobStatusWidget).toBeDefined();
            expect(JobStatusWidget).toEqual(jasmine.any(Function));
        });
    });
});
