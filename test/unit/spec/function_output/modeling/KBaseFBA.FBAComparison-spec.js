define(['KBaseFBA.FBAComparison', 'KBModeling'], (Widget, kbm) => {
    'use strict';
    describe('Test the KBaseFBA.FBAComparison widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBAComparison).toEqual(jasmine.any(Function));
        });
    });
});
