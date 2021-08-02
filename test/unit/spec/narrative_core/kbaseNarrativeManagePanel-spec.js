define(['kbaseNarrativeManagePanel', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeManagePanel widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
