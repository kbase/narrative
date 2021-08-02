define(['kbaseModal', 'testUtil'], (Widget, TestUtil) => {
    'use strict';
    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseModal widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
