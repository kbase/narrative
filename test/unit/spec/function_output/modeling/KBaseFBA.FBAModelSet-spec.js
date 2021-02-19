define([
    'KBaseFBA.FBAModelSet',
    'KBModeling'
], function(Widget, kbm) {
    describe('The KBaseFBA.FBAModelSet widget', function() {
        it('should be defined', function() {
            var api = new KBModeling('token');
            expect(api.KBaseFBA_FBAModelSet).toEqual(jasmine.any(Function));
        });
    });
});
