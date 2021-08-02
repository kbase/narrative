define(['KBasePhenotypes.PhenotypeSet', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test the KBasePhenotypes.PhenotypeSet widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBasePhenotypes_PhenotypeSet).toEqual(jasmine.any(Function));
        });
    });
});
