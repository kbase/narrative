define(['KBaseBiochem.Media', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    describe('Test the KBaseBiochem.Media widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('Should inject KBaseBiochem.Media function', () => {
            const api = new KBModeling('token');
            expect(api.KBaseBiochem_Media).toBeDefined();
        });
    });
});
