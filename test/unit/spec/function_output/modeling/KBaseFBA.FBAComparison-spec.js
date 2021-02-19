define([
    'KBaseFBA.FBAComparison',
    'KBModeling'
], function(Widget, kbm) {
    describe('The KBaseFBA.FBAComparison widget', function() {
        it('Should load the module', function() {
            var api = new KBModeling('token');
            expect(api.KBaseFBA_FBAComparison).toEqual(jasmine.any(Function));
        });
    });
});
