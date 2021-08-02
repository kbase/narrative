define(['kbaseExpressionMatrixHeatmap', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseExpressionMatrixHeatmap widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
