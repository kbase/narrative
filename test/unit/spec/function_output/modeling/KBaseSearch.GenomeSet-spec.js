/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define(['KBaseSearch.GenomeSet', 'KBModeling'], (Widget, kbm) => {
    describe('Test the KBaseSearch.GenomeSet widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseSearch_GenomeSet).toEqual(jasmine.any(Function));
        });
    });
});
