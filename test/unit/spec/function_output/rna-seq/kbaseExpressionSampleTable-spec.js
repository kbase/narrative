define(['kbaseExpressionSampleTable', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseExpressionSampleTable widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
