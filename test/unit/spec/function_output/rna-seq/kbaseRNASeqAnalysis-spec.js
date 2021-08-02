define(['kbaseRNASeqAnalysis', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseRNASeqAnalysis widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
