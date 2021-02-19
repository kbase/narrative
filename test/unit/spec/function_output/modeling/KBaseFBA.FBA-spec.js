define([
    'KBaseFBA.FBA',
    'KBModeling'
], function(Widget, kbm) {
    describe('The KBaseFBA.FBA widget', function() {
        it('Should load the module', function() {
            var api = new KBModeling('token');
            expect(api.KBaseFBA_FBA).toBeDefined();
        });
    });
});
