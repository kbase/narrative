define(['KBaseFBA.FBAModelSet', 'KBModeling'], (Widget, kbm) => {
    'use strict';
    describe('Test the KBaseFBA.FBAModelSet widget', () => {
        it('Should do things', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBAModelSet).toEqual(jasmine.any(Function));
        });
    });
});
