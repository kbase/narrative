define(['kbaseNarrativeExampleDataTab', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseNarrativeExampleDataTab widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
