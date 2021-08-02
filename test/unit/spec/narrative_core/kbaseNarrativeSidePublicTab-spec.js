define(['kbaseNarrativeSidePublicTab', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeSidePublicTab widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
