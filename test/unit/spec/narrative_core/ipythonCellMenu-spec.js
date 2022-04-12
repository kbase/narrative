define(['ipythonCellMenu', 'testUtil'], (Widget, TestUtil) => {
    'use strict';

    describe('The ipythonCellMenu widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
