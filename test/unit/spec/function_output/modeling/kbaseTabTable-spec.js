define(['kbaseTabTable', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test the kbaseTabTable widget', () => {
        it('Should do things', () => {
            expect(Widget).toBeDefined();
        });
    });
});
