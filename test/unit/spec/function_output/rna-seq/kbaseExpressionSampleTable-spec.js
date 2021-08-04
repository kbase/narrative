define(['kbaseExpressionSampleTable', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseExpressionSampleTable widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
