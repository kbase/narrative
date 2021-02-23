define(['KBaseFBA.FBAModel', 'KBModeling'], (Widget) => {
    'use strict';
    describe('Test the KBaseFBA.FBAModel widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBAModel).toEqual(jasmine.any(Function));
        });
    });
});
