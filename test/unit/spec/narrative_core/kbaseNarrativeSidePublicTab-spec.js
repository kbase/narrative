define(['kbaseNarrativeSidePublicTab', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseNarrativeSidePublicTab widget', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
