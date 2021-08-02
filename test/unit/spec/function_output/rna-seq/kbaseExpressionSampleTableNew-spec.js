define(['kbaseExpressionSampleTableNew', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseExpressionSampleTableNew widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
