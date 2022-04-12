define(['kbaseNarrativeDataCell', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseNarrativeDataCell widget', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
