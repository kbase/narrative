define(['kbaseNarrativeDataPanel', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeDataPanel widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
