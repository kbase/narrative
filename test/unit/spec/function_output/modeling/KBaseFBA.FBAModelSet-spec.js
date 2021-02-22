/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define(['KBaseFBA.FBAModelSet', 'KBModeling'], (Widget, kbm) => {
    describe('Test the KBaseFBA.FBAModelSet widget', () => {
        it('Should do things', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBAModelSet).toEqual(jasmine.any(Function));
        });
    });
});
