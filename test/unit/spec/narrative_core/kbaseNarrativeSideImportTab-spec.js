define(['kbaseNarrativeSideImportTab', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeSideImportTab widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
