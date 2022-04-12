define(['kbaseFigureObjectHeatmap', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseFigureObjectHeatmap widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
