define(['KBasePhenotypes.PhenotypeSimulationSet', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test the KBasePhenotypes.PhenotypeSimulationSet widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBasePhenotypes_PhenotypeSimulationSet).toEqual(jasmine.any(Function));
        });
    });
});
