define(['kbaseNarrativePrestart', 'testUtil'], (Prestart, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test the kbaseNarrativePrestart module', () => {
        it('should be defined', () => {
            expect(Prestart).toBeDefined();
        });
    });
});
