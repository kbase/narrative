define([
    'KBaseFBA.FBAModel',
    'KBModeling'
], function(Widget) {
    'use strict';
    describe('The KBaseFBA.FBAModel widget', function() {
        it('Should load the module', function() {
            var api = new KBModeling('token');
            expect(api.KBaseFBA_FBAModel).toEqual(jasmine.any(Function));
        });
    });
});
