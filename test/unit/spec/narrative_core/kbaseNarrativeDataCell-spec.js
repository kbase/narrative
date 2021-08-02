define(['kbaseNarrativeDataCell', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeDataCell widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
