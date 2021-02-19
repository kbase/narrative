define([
    'KBaseBiochem.CompoundSet',
    'KBModeling'
], function(Widget, kbm) {
    describe('The KBaseBiochem.CompoundSet widget', function() {
        it('Should inject KBaseBiochem.CompoundSet function', function() {
            var api = new KBModeling('token');
            expect(api.KBaseBiochem_Media).toBeDefined();
        });
    });
});
