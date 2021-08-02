define(['kbaseNarrativeCellMenu', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeCellMenu widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
