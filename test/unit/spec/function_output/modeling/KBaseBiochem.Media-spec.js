/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define(['KBaseBiochem.Media', 'KBModeling'], (Widget, kbm) => {
    describe('Test the KBaseBiochem.Media widget', () => {
        it('Should inject KBaseBiochem.Media function', () => {
            const api = new KBModeling('token');
            expect(api.KBaseBiochem_Media).toBeDefined();
        });
    });
});
