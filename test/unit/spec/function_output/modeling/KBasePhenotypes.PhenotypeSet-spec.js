define(['KBasePhenotypes.PhenotypeSet', 'KBModeling'], (Widget, kbm) => {
    'use strict';
    describe('Test the KBasePhenotypes.PhenotypeSet widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBasePhenotypes_PhenotypeSet).toEqual(jasmine.any(Function));
        });
    });
});
