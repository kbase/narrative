define([
    'KBasePhenotypes.PhenotypeSet',
    'KBModeling'
], function(Widget, kbm) {
    describe('The KBasePhenotypes.PhenotypeSet widget', function() {
        it('Should load the module', function() {
            var api = new KBModeling('token');
            expect(api.KBasePhenotypes_PhenotypeSet).toEqual(jasmine.any(Function));
        });
    });
});
