define(['KBasePhenotypes.PhenotypeSet', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    describe('Test the KBasePhenotypes.PhenotypeSet widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBasePhenotypes_PhenotypeSet).toEqual(jasmine.any(Function));
        });
    });
});
