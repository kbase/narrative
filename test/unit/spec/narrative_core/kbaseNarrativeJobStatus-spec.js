/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define(['jquery', 'kbaseNarrativeJobStatus'], ($, JobStatusWidget) => {
    describe('Test the kbaseNarrativeJobStatus widget', () => {
        let dummyNode;
        beforeEach(() => {
            dummyNode = document.createElement('div');
        });

        it('Should load successfully', () => {
            // var w = new JobStatusWidget($(dummyNode));
            // expect(w).not.toBeNull();
        });
    });
});
