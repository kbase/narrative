define(['kbaseNarrativeCell', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseNarrativeCell widget', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
