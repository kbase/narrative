/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'KBaseFBA.FBA',
    'KBModeling'
], function(Widget, kbm) {
    describe('Test the KBaseFBA.FBA widget', function() {
        it('Should load the module', function() {
            var api = new KBModeling('token');
            expect(api.KBaseFBA_FBA).toBeDefined();
        });
    });
});
