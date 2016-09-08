/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define (
    [
        'jquery',
        'narrativeTour',
        'bootstraptour'
    ], function(
        $,
        Tour,
        BSTour
    ) {
    describe('Test the narrativeTour module', function() {
        it('Loaded the Tour module', function() {
            expect(Tour).not.toBe(null);
            expect(BSTour).not.toBeFalsy();
        });

        it('Has expected functions', function() {
            expect(Tour.Tour).toBeDefined();
        });

        it('Can be instantiated', function() {
            var tourInstance = new Tour.Tour();
            expect(tourInstance).not.toBe.null;
        });

        it('Can be started', function() {
            var tourInstance = new Tour.Tour();
            tourInstance.start();
            expect($.find('.kb-tour')).toBe.truthy;
        });
    });
});