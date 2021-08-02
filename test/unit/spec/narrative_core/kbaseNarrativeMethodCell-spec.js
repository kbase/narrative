define(['kbaseNarrativeMethodCell', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeMethodCell widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
