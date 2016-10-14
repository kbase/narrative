/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'KBasePhenotypes.PhenotypeSimulationSet',
    'KBModeling'
], function(Widget, kbm) {
    describe('Test the KBasePhenotypes.PhenotypeSimulationSet widget', function() {
        it('Should load the module', function() {
            var api = new KBModeling('token');
            expect(api.KBasePhenotypes_PhenotypeSimulationSet).toEqual(jasmine.any(Function));
        });
    });
});
