define(['KBaseFBA.FBAModel', 'KBModeling', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test the KBaseFBA.FBAModel widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBAModel).toEqual(jasmine.any(Function));
        });
    });
});
