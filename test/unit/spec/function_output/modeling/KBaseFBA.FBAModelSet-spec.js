/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'KBaseFBA.FBAModelSet',
    'KBModeling'
], function(Widget, kbm) {
    describe('Test the KBaseFBA.FBAModelSet widget', function() {
        it('Should do things', function() {
            var api = new KBModeling('token');
            expect(api.KBaseFBA_FBAModelSet).toEqual(jasmine.any(Function));
        });
    });
});
