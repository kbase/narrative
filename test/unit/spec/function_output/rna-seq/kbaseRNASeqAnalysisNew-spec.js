define(['kbaseRNASeqAnalysisNew', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseRNASeqAnalysisNew widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
