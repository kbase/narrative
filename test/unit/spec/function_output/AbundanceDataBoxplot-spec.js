define(['AbundanceDataBoxplot', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The AbundanceDataBoxplot widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
