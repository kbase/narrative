/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define(['KBaseFBA.FBAComparison', 'KBModeling'], (Widget, kbm) => {
    describe('Test the KBaseFBA.FBAComparison widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBAComparison).toEqual(jasmine.any(Function));
        });
    });
});
