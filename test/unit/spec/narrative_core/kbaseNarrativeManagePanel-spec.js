define(['kbaseNarrativeManagePanel', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseNarrativeManagePanel widget', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
