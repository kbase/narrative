define(['kbaseNarrativeSideImportTab', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseNarrativeSideImportTab widget', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
