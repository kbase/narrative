define(['kbaseFigureObjectHeatmap', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseFigureObjectHeatmap widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
