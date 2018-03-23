/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'jquery',
    'util/bootstrapSearch'
], function(
    $,
    BootstrapSearch
) {
    'use strict';
    var $targetElem;

    beforeEach(function() {
        $targetElem = $('<div>');
    });

    afterEach(function() {
        $targetElem.empty();
    });

    describe('Test the BootstrapSearch module', function() {
        it('Should create a new search object', function() {
            var bsSearch = new BootstrapSearch($targetElem, {});
            expect(bsSearch).not.toBeNull();
        });

        it('Should fire an input function when triggered by input', function() {
            var passed = false;
            var bsSearch = new BootstrapSearch($targetElem, {
                inputFunction: function() {
                    passed = true;
                }
            });
            bsSearch.val('stuff');
            expect(passed).toBe(true);
        });

        it('Should have empty and filled icons at the right time', function() {
            var emptyFa = 'fa-battery-0',
                filledFa = 'fa-battery-4';

            var bsSearch = new BootstrapSearch($targetElem, {
                emptyIcon: emptyFa,
                filledIcon: filledFa
            });
            var addon = $targetElem.find('span.input-group-addon > span');
            expect(addon.hasClass(emptyFa)).toBe(true);
            bsSearch.val('stuff');
            expect(addon.hasClass(filledFa)).toBe(true);
        });

        it('Should auto-set fa- in front of icons without it', function() {
            var empty = 'battery-0',
                emptyFa = 'fa-battery-0',
                filled = 'battery-4',
                filledFa = 'fa-battery-4';

            var bsSearch = new BootstrapSearch($targetElem, {
                emptyIcon: empty,
                filledIcon: filled
            });
            var addon = $targetElem.find('span.input-group-addon > span');
            expect(addon.hasClass(emptyFa)).toBe(true);
            bsSearch.val('stuff');
            expect(addon.hasClass(filledFa)).toBe(true);
        });

        it('Should clear input by default when clicking addon', function() {
            var bsSearch = new BootstrapSearch($targetElem);
            bsSearch.val('stuff');
            $targetElem.find('span.input-group-addon').click();
            expect(bsSearch.val()).toBeFalsy();
        });

        it('Should fire a function when clicking the addon - overrides default clear', function() {
            var passed = false;
            var bsSearch = new BootstrapSearch($targetElem, {
                addonFunction: function() {
                    passed = true;
                }
            });
            bsSearch.val('stuff');
            $targetElem.find('span.input-group-addon').click();
            expect(passed).toBe(true);
            expect(bsSearch.val()).toEqual('stuff');
        });

        it('Should have a val function that works as in vanilla JS', function() {
            var bsSearch = new BootstrapSearch($targetElem);
            bsSearch.val('stuff');
            expect(bsSearch.val()).toEqual('stuff');
        });
    });
});
