/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'KBaseBiochem.Media',
    'KBModeling'
], function(Widget, kbm) {
    describe('Test the KBaseBiochem.Media widget', function() {
        it('Should inject KBaseBiochem.Media function', function() {
            var api = new KBModeling('token');
            expect(api.KBaseBiochem_Media).toBeDefined();
        });
    });
});
