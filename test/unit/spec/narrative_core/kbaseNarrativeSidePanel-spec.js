define(['kbaseNarrativeSidePanel', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseNarrativeSidePanel widget', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
