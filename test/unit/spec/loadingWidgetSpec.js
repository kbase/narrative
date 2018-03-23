/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach, spyOn*/
/*jslint white: true*/

define ([
    'jquery',
    'widgets/loadingWidget'
], function(
    $,
    LoadingWidget
) {
    'use strict';

    describe('Test the LoadingWidget module', function() {
        var dummyNode, dummyNode2, widget;

        beforeEach(function () {
            dummyNode = document.createElement('div');
            dummyNode2 = document.createElement('div');
            dummyNode.querySelector = jasmine.createSpy('HTML Element').and.returnValue(dummyNode2);
            dummyNode2.querySelector = jasmine.createSpy('HTML Element').and.returnValue(dummyNode2);
            widget = new LoadingWidget({node: dummyNode});
        });

        afterEach(function () {
            widget.remove();
        });

        it('Should instantiate with a null node', function() {
            var widget = new LoadingWidget({node: null});
            expect(widget).not.toBeNull();
        });

        it('Should be able to update its progress', function () {
            widget.updateProgress('data', true);
        });

        it('Should be able to remove its container node', function () {
            spyOn(LoadingWidget.prototype, 'remove');
            widget = new LoadingWidget({ node: dummyNode });
            ['data', 'narrative', 'jobs', 'apps', 'kernel'].forEach(function(name) {
                widget.updateProgress(name, true);
            });
            expect(widget.remove).toHaveBeenCalled();
        });

        it('Should not show the loading warning when first starting', function () {
            expect($($(dummyNode).find('.loading-warning')[0]).is(':visible')).toBeFalsy();
        });

        it('Should show the loading warning after a timeout', function (done) {
            spyOn(LoadingWidget.prototype, 'showTimeoutWarning');
            widget = new LoadingWidget({node: dummyNode, timeout: 1});
            setTimeout(function () {
                expect(widget.showTimeoutWarning).toHaveBeenCalled();
                done();
            }, 100);
        });
    });
});
