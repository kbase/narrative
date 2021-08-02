define(['kbaseRNASeqSample', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseRNASeqSample widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
