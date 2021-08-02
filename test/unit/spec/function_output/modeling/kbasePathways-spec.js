define(['kbasePathways', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test the kbasePathways widget', () => {
        it('Should load the widget', () => {
            expect(Widget).toBeDefined();
        });
    });
});
