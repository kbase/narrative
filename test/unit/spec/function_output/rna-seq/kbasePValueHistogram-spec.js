define(['kbasePValueHistogram', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbasePValueHistogram widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
