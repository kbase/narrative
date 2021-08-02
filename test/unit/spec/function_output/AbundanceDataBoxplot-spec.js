define(['AbundanceDataBoxplot', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The AbundanceDataBoxplot widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
