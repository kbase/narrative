define(['kbaseVisWidget', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseVisWidget widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
