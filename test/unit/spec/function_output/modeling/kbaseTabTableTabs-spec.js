define(['kbaseTabTableTabs', 'testUtil'], (Widget, TestUtil) => {
    'use strict';
    afterAll(() => TestUtil.clearRuntime());

    describe('Test the kbaseTabTableTabs widget', () => {
        it('Should load the widget', () => {
            expect(Widget).toBeDefined();
        });
    });
});
