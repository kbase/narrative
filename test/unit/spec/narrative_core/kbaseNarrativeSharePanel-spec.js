define(['kbaseNarrativeSharePanel', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeSharePanel widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
