define(['msPathway', 'jquery', 'testUtil'], (Widget, $, TestUtil) => {
    'use strict';

    describe('Test the msPathway widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('Should load the module', () => {
            expect(ModelSeedPathway).toEqual(jasmine.any(Function));
        });
    });
});
