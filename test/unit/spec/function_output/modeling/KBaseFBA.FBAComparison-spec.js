define(['KBaseFBA.FBAComparison', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test the KBaseFBA.FBAComparison widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBAComparison).toEqual(jasmine.any(Function));
        });
    });
});
