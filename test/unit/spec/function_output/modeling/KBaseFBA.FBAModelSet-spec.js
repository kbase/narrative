define(['KBaseFBA.FBAModelSet', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test the KBaseFBA.FBAModelSet widget', () => {
        it('Should do things', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBAModelSet).toEqual(jasmine.any(Function));
        });
    });
});
