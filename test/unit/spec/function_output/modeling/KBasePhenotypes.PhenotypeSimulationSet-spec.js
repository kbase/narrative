define(['KBasePhenotypes.PhenotypeSimulationSet', 'KBModeling', 'testUtil'], (
    Widget,
    kbm,
    TestUtil
) => {
    'use strict';

    describe('Test the KBasePhenotypes.PhenotypeSimulationSet widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBasePhenotypes_PhenotypeSimulationSet).toEqual(jasmine.any(Function));
        });
    });
});
