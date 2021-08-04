define(['kbaseTabTable', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('Test the kbaseTabTable widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('Should do things', () => {
            expect(Widget).toBeDefined();
        });
    });
});
