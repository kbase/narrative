define(['KBasePhenotypes.PhenotypeSimulationSet', 'KBModeling'], (Widget, kbm) => {
    describe('Test the KBasePhenotypes.PhenotypeSimulationSet widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBasePhenotypes_PhenotypeSimulationSet).toEqual(jasmine.any(Function));
        });
    });
});
