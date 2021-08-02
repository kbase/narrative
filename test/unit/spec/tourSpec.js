define(['jquery', 'narrativeTour', 'bootstraptour', 'testUtil'], ($, Tour, BSTour, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test the narrativeTour module', () => {
        it('Loaded the Tour module', () => {
            expect(Tour).not.toBe(null);
            expect(BSTour).not.toBeFalsy();
        });

        it('Has expected functions', () => {
            expect(Tour.Tour).toBeDefined();
        });

        it('Can be instantiated', () => {
            const tourInstance = new Tour.Tour();
            expect(tourInstance).not.toBe(null);
        });

        it('Can be started', () => {
            const tourInstance = new Tour.Tour();
            tourInstance.start();
            expect($.find('.kb-tour')).toBeTruthy();
            tourInstance.stop();
        });
    });
});
