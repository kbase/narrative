define(['KBaseFBA.FBA', 'KBModeling'], (Widget, kbm) => {
    describe('Test the KBaseFBA.FBA widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBA).toBeDefined();
        });
    });
});
