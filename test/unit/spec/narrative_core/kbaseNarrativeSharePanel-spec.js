define(['kbaseNarrativeSharePanel', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseNarrativeSharePanel widget', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
