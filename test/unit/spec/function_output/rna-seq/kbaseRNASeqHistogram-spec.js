define(['kbaseRNASeqHistogram', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseRNASeqHistogram widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
