define(['kbaseNarrativeCellMenu', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseNarrativeCellMenu widget', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
