/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'kbaseNarrativeJobStatus'
], function($, JobStatusWidget) {
    describe('Test the kbaseNarrativeJobStatus widget', function() {
        var dummyNode;
        beforeEach(function() {
            dummyNode = document.createElement('div');
        });

        it('Should load successfully', function() {
            // var w = new JobStatusWidget($(dummyNode));
            // expect(w).not.toBeNull();
        });
    });
});
