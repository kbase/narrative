define(['kbaseNarrativeCell', 'testUtil'], (Widget, TestUtil) => {
    'use strict';
    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeCell widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
