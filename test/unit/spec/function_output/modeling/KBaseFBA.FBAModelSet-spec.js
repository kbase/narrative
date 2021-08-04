define(['KBaseFBA.FBAModelSet', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    describe('Test the KBaseFBA.FBAModelSet widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('Should do things', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBAModelSet).toEqual(jasmine.any(Function));
        });
    });
});
