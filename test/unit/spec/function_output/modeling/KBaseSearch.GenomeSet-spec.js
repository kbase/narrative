/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'KBaseSearch.GenomeSet',
    'KBModeling'
], function(Widget, kbm) {
    describe('Test the KBaseSearch.GenomeSet widget', function() {
        it('Should do things', function() {
            var api = new KBModeling('token');
            expect(api.KBaseSearch_GenomeSet).toEqual(jasmine.any(Function));
        });
    });
});
