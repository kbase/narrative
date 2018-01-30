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
        var dummyNode = document.createElement('div');
        var dummyNode2 = document.createElement('div');
        dummyNode.querySelector = jasmine.createSpy('HTML Element').and.returnValue(dummyNode2);
        dummyNode2.querySelector = jasmine.createSpy('HTML Element').and.returnValue(dummyNode2);
        var widget;

        beforeEach(function () {
            widget = new LoadingWidget({node: dummyNode});
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
            // loadingWidget.remove();
            expect(widget.remove).toHaveBeenCalled();
        });
    });
});
