define(['kbaseModal', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseModal widget', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
