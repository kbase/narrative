define([
    'KBasePhenotypes.PhenotypeSimulationSet',
    'KBModeling'
], function(Widget, kbm) {
    describe('The KBasePhenotypes.PhenotypeSimulationSet widget', function() {
        it('Should load the module', function() {
            var api = new KBModeling('token');
            expect(api.KBasePhenotypes_PhenotypeSimulationSet).toEqual(jasmine.any(Function));
        });
    });
});
