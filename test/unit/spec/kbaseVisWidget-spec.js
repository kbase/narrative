define(['kbaseVisWidget', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseVisWidget widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
