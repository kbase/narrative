define(['kbaseRNASeqAnalysisNew', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseRNASeqAnalysisNew widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
