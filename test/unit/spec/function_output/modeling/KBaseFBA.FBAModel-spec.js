define(['KBaseFBA.FBAModel', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    describe('Test the KBaseFBA.FBAModel widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBAModel).toEqual(jasmine.any(Function));
        });
    });
});
