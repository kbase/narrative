/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/stagingAreaViewer'
], function(
    $,
    StagingAreaViewer
) {
    'use strict';
    describe('Test the module', function() {
        var myModule;

        // Some setup code before each individual test (not always necessary).
        beforeEach(function () {
            myModule = Module.make();
        });

        // Some cleanup code after each test (not always necessary).
        afterEach(function () {
            myModule.destroy();
            myModule = null;
        });

        // A single test case where the result shouldn't be null.
        it('Should do stuff', function() {
            var result = myModule.doStuff();
            expect(result).not.toBeNull();
        });

        // A single test case where the result should be any Object.
        it('Should have things as an object', function () {
            expect(myModule.things).toEqual(jasmine.any(Object));
        });
    });
});
