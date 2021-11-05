define(['KBaseSearch.GenomeSet', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    describe('Test the KBaseSearch.GenomeSet widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseSearch_GenomeSet).toEqual(jasmine.any(Function));
        });
    });
});
