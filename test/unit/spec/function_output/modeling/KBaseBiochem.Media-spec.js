define(['KBaseBiochem.Media', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test the KBaseBiochem.Media widget', () => {
        it('Should inject KBaseBiochem.Media function', () => {
            const api = new KBModeling('token');
            expect(api.KBaseBiochem_Media).toBeDefined();
        });
    });
});
