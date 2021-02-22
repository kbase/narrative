/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define(['KBaseFBA.FBA', 'KBModeling'], (Widget, kbm) => {
    describe('Test the KBaseFBA.FBA widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBA).toBeDefined();
        });
    });
});
