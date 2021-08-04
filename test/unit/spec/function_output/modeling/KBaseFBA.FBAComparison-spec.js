define(['KBaseFBA.FBAComparison', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    describe('Test the KBaseFBA.FBAComparison widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBAComparison).toEqual(jasmine.any(Function));
        });
    });
});
