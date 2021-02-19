define([
    'KBaseBiochem.Media',
    'KBModeling'
], function(Widget, kbm) {
    describe('The KBaseBiochem.Media widget', function() {
        it('Should inject KBaseBiochem.Media function', function() {
            var api = new KBModeling('token');
            expect(api.KBaseBiochem_Media).toBeDefined();
        });
    });
});
