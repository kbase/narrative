define(['kbasePathways', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('Test the kbasePathways widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('Should load the widget', () => {
            expect(Widget).toBeDefined();
        });
    });
});
