define(['jquery', 'narrativeLogin'], function($, Login) {
    describe('Test the kbaseNarrative module', function() {
        it('Should do things', function() {
            expect(Login.init).not.toBe(null);
        });

        it('Should instantiate on a DOM node', function() {
            var $node = $("<div>");
            Login.init($node);
        });
    });
});