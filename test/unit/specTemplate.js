/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

/**
 * This is an example template for a testing spec for some widget. THIS WILL NOT ACTUALLY RUN.
 * It's just meant as an example to get you bootstrapped.
 *
 * You'll need to change the define block to include the things you want to test (or set up).
 * This uses the Jasmine framework for testing. You can see usage and examples here:
 * https://jasmine.github.io/2.0/introduction.html
 */
define ([
    'kbwidget',
    'bootstrap',
    'a_module'
], function(
    KBWidget,
    bootstrap,
    Module
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
