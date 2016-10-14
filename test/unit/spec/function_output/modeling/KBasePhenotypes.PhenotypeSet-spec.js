/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'KBasePhenotypes.PhenotypeSet',
    'KBModeling'
], function(Widget, kbm) {
    describe('Test the KBasePhenotypes.PhenotypeSet widget', function() {
        it('Should do things', function() {
            var api = new KBModeling('token');
            expect(api.KBasePhenotypes_PhenotypeSet).toEqual(jasmine.any(Function));
        });
    });
});
