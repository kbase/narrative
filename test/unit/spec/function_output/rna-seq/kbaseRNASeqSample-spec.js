define(['kbaseRNASeqSample', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The kbaseRNASeqSample widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
