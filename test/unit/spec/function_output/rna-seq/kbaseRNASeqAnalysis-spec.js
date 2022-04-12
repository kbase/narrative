define(['kbaseRNASeqAnalysis', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseRNASeqAnalysis widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
