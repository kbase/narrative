define(['kbasePValueHistogram', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbasePValueHistogram widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
