define(['ipythonCellMenu', 'testUtil'], (Widget, TestUtil) => {
    'use strict';
    afterAll(() => TestUtil.clearRuntime());

    describe('The ipythonCellMenu widget', () => {
        it('should be defined', () => {
            expect(Widget).toBeDefined();
        });
    });
});
