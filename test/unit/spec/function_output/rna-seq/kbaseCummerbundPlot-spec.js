define(['kbaseCummerbundPlot', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseCummerbundPlot widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
