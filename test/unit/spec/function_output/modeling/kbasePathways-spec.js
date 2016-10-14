/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'kbasePathways',
], function(Widget) {
    describe('Test the kbasePathways widget', function() {
        it('Should load the widget', function() {
            expect(Widget).toBeDefined();
        });
    });
});
