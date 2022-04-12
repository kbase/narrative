define(['kbaseNarrativeExampleDataTab', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseNarrativeExampleDataTab widget', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
