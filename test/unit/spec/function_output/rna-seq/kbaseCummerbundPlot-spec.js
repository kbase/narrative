define(['kbaseCummerbundPlot', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseCummerbundPlot widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
