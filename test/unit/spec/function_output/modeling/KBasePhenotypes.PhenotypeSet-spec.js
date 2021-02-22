/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define(['KBasePhenotypes.PhenotypeSet', 'KBModeling'], (Widget, kbm) => {
    describe('Test the KBasePhenotypes.PhenotypeSet widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBasePhenotypes_PhenotypeSet).toEqual(jasmine.any(Function));
        });
    });
});
