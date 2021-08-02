define(['KBaseFBA.FBA', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test the KBaseFBA.FBA widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBA).toBeDefined();
        });
    });
});
