define(['kbaseNarrativePrestart', 'testUtil'], (Prestart, TestUtil) => {
    'use strict';

    describe('Test the kbaseNarrativePrestart module', () => {
        afterAll(() => TestUtil.clearRuntime());
        it('should be defined', () => {
            expect(Prestart).toBeDefined();
        });
    });
});
