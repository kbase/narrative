define(['kbaseTabTableTabs', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('Test the kbaseTabTableTabs widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('Should load the widget', () => {
            expect(Widget).toBeDefined();
        });
    });
});
