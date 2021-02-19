define([
    'jquery',
    'kbaseNarrativeJobStatus'
], ($, JobStatusWidget) => {
    'use strict';
    describe('The kbaseNarrativeJobStatus module', () => {
        it('exists', () => {
            expect(JobStatusWidget).toBeDefined();
        });
    });
    // this test requires Jupyter notebook to be set up
    xdescribe('The kbaseNarrativeJobStatus widget', () => {
        let node;
        beforeEach(() => {
            node = document.createElement('div');
        });

        it('Should load successfully', () => {
            const w = new JobStatusWidget(
                $(node),
                {
                    'jobId': 123456,
                    'state': {},
                    'info': {app_id: null, version: null, name: 'Unknown App'}, 'outputWidgetInfo': null
                }
            );
            expect(w).not.toBeNull();
        });
    });
});
