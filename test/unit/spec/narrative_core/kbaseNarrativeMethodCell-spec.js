define(['kbaseNarrativeMethodCell', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseNarrativeMethodCell widget', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
