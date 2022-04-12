define(['kbaseNarrativeControlPanel', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseNarrativeControlPanel widget', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
