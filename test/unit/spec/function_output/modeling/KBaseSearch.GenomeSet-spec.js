define(['KBaseSearch.GenomeSet', 'KBModeling'], (Widget, kbm) => {
    'use strict';
    describe('Test the KBaseSearch.GenomeSet widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseSearch_GenomeSet).toEqual(jasmine.any(Function));
        });
    });
});
