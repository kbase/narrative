define([
    'jquery',
    'widgets/loadingWidget',
    'text!/kbase_templates/loading.html',
    'css!/narrative/static/kbase/css/all_concat.css',
], ($, LoadingWidget, LoadingTemplate) => {
    'use strict';

    const templateHtml = LoadingTemplate.replace(
        '{{ static_url("kbase/images/kbase_animated_logo.gif") }}',
        '/narrative/static/kbase/images/kbase_animated_logo.gif'
    );
    describe('Test the LoadingWidget module', () => {
        let container;
        beforeEach(() => {
            container = document.createElement('div');
            container.innerHTML = templateHtml;
        });

        afterEach(() => {
            container.remove();
        });

        it('Should instantiate with a null node', () => {
            const noNodeWidget = new LoadingWidget({ node: null });
            expect(noNodeWidget).not.toBeNull();
            expect(noNodeWidget).toBeInstanceOf(LoadingWidget);
            noNodeWidget.clearTimeout();
        });

        it('Should be able to update its progress', () => {
            const widget = new LoadingWidget({ node: container });
            widget.updateProgress('data', true);
            // hidden checkmark that gets added once an element starts loading
            expect(
                container.querySelector('[data-element="data"] .kb-progress-stage').innerHTML
            ).toContain('class="fa fa-check"');
            // total progress indicator updated
            expect(container.querySelector('.progress-bar').style.width).toBe('20%');
            widget.clearTimeout();
        });

        it('Should be able to remove its container node', () => {
            spyOn(LoadingWidget.prototype, 'remove').and.callThrough();
            const widget = new LoadingWidget({ node: container });
            ['data', 'narrative', 'jobs', 'apps', 'kernel'].forEach((name) => {
                widget.updateProgress(name, true);
            });
            expect(widget.remove).toHaveBeenCalled();
        });

        it('Should not show the loading warning when first starting', () => {
            const widget = new LoadingWidget({ node: container });
            const $warning = $(container).find('.kb-loading-blocker__text--warning');
            expect($warning.length).toBe(1);
            expect($warning.is(':visible')).toBeFalsy();
            widget.clearTimeout();
            widget.remove();
        });

        it('Should show the loading warning after a timeout', (done) => {
            const widget = new LoadingWidget({ node: container, timeout: 1 });
            spyOn(widget, 'showTimeoutWarning').and.callThrough();
            const $warningNode = $(container).find('.kb-loading-blocker__text--warning');
            expect($warningNode.length).toBe(1);
            spyOn($warningNode.__proto__, 'fadeIn').and.callThrough();
            expect(widget.timeoutShown).toBeFalse();
            setTimeout(() => {
                expect(widget.showTimeoutWarning).toHaveBeenCalled();
                expect(widget.timeoutShown).toBeTrue();
                expect($warningNode.fadeIn).toHaveBeenCalledWith('fast');
                widget.remove();
                done();
            }, 500);
        });
    });
});
