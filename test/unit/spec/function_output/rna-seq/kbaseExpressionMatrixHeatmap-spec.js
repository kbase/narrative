define(['kbaseExpressionMatrixHeatmap', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseExpressionMatrixHeatmap widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
