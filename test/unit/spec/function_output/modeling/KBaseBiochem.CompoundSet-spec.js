define(['KBaseBiochem.CompoundSet', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test the KBaseBiochem.CompoundSet widget', () => {
        it('Should inject KBaseBiochem.CompoundSet function', () => {
            const api = new KBModeling('token');
            expect(api.KBaseBiochem_Media).toBeDefined();
        });
    });
});
