define(['kbaseRNASeqHistogram', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseRNASeqHistogram widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
