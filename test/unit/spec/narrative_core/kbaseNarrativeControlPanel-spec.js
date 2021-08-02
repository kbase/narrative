define(['kbaseNarrativeControlPanel', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeControlPanel widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
