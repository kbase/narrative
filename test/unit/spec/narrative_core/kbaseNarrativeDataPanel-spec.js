define(['kbaseNarrativeDataPanel', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseNarrativeDataPanel widget', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
