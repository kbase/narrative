/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define(['kbasePathways'], (Widget) => {
    describe('Test the kbasePathways widget', () => {
        it('Should load the widget', () => {
            expect(Widget).toBeDefined();
        });
    });
});
