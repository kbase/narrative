define([
    'KBaseSearch.GenomeSet',
    'KBModeling'
], function(Widget, kbm) {
    describe('The KBaseSearch.GenomeSet widget', function() {
        it('Should load the module', function() {
            var api = new KBModeling('token');
            expect(api.KBaseSearch_GenomeSet).toEqual(jasmine.any(Function));
        });
    });
});
