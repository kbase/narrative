/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach, spyOn*/
/*jslint white: true*/

define(['jquery', 'widgets/loadingWidget'], ($, LoadingWidget) => {
    'use strict';

    describe('Test the LoadingWidget module', () => {
        let dummyNode, dummyNode2, widget;

        beforeEach(() => {
            dummyNode = document.createElement('div');
            dummyNode2 = document.createElement('div');
            dummyNode.querySelector = jasmine.createSpy('HTML Element').and.returnValue(dummyNode2);
            dummyNode2.querySelector = jasmine
                .createSpy('HTML Element')
                .and.returnValue(dummyNode2);
            widget = new LoadingWidget({ node: dummyNode });
        });

        afterEach(() => {
            widget.remove();
        });

        it('Should instantiate with a null node', () => {
            const widget = new LoadingWidget({ node: null });
            expect(widget).not.toBeNull();
        });

        it('Should be able to update its progress', () => {
            widget.updateProgress('data', true);
        });

        it('Should be able to remove its container node', () => {
            spyOn(LoadingWidget.prototype, 'remove');
            widget = new LoadingWidget({ node: dummyNode });
            ['data', 'narrative', 'jobs', 'apps', 'kernel'].forEach((name) => {
                widget.updateProgress(name, true);
            });
            expect(widget.remove).toHaveBeenCalled();
        });

        it('Should not show the loading warning when first starting', () => {
            expect($($(dummyNode).find('.loading-warning')[0]).is(':visible')).toBeFalsy();
        });

        it('Should show the loading warning after a timeout', (done) => {
            spyOn(LoadingWidget.prototype, 'showTimeoutWarning');
            widget = new LoadingWidget({ node: dummyNode, timeout: 1 });
            setTimeout(() => {
                expect(widget.showTimeoutWarning).toHaveBeenCalled();
                done();
            }, 100);
        });
    });
});
