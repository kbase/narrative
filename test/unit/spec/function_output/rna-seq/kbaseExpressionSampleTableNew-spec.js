define(['kbaseExpressionSampleTableNew', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseExpressionSampleTableNew widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
