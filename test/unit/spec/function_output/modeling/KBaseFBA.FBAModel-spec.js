/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'KBaseFBA.FBAModel',
    'KBModeling'
], function(Widget) {
    describe('Test the KBaseFBA.FBAModel widget', function() {
        it('Should load the module', function() {
            var api = new KBModeling('token');
            expect(api.KBaseFBA_FBAModel).toEqual(jasmine.any(Function));
        });
    });
});
