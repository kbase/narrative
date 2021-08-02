define(['kbaseNarrativeSidePanel', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeSidePanel widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
