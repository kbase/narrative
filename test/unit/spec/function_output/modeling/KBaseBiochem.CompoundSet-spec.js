/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'KBaseBiochem.CompoundSet',
    'KBModeling'
], function(Widget, kbm) {
    describe('Test the KBaseBiochem.CompoundSet widget', function() {
        it('Should inject KBaseBiochem.CompoundSet function', function() {
            var api = new KBModeling('token');
            expect(api.KBaseBiochem_Media).toBeDefined();
        });
    });
});
