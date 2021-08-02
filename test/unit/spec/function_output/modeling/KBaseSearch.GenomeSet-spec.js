define(['KBaseSearch.GenomeSet', 'KBModeling', 'testUtil'], (Widget, kbm, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test the KBaseSearch.GenomeSet widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseSearch_GenomeSet).toEqual(jasmine.any(Function));
        });
    });
});
