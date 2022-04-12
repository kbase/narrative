define(['KBaseBiochem.CompoundSet', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    describe('Test the KBaseBiochem.CompoundSet widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('Should inject KBaseBiochem.CompoundSet function', () => {
            const api = new KBModeling('token');
            expect(api.KBaseBiochem_Media).toBeDefined();
        });
    });
});
