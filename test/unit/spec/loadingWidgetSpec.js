define(['jquery', 'widgets/loadingWidget', 'text!/kbase_templates/loading.html'], (
    $,
    LoadingWidget,
    LoadingTemplate
) => {
    'use strict';

    const templateHtml = LoadingTemplate.replace(
        '{{ static_url("kbase/images/kbase_animated_logo.gif") }}',
        '/narrative/static/kbase/images/kbase_animated_logo.gif'
    );
    describe('Test the LoadingWidget module', () => {
        beforeEach(function () {
            this.node = document.createElement('div');
            this.node.innerHTML = templateHtml;
        });

        it('Should instantiate with a null node', () => {
            const noNodeWidget = new LoadingWidget({ node: null });
            expect(noNodeWidget).not.toBeNull();
            expect(noNodeWidget).toBeInstanceOf(LoadingWidget);
        });

        it('Should be able to update its progress', function () {
            const widget = new LoadingWidget({ node: this.node });
            widget.updateProgress('data', true);
            // hidden checkmark that gets added once an element starts loading
            expect(
                this.node.querySelector('[data-element="data"] .kb-progress-stage').innerHTML
            ).toContain('class="fa fa-check"');
            // total progress indicator updated
            expect(this.node.querySelector('.progress-bar').style.width).toBe('20%');
        });

        it('Should be able to remove its container node', function () {
            spyOn(LoadingWidget.prototype, 'remove');
            const widget = new LoadingWidget({ node: this.node });
            ['data', 'narrative', 'jobs', 'apps', 'kernel'].forEach((name) => {
                widget.updateProgress(name, true);
            });
            expect(widget.remove).toHaveBeenCalled();
        });

        it('Should not show the loading warning when first starting', function () {
            new LoadingWidget({ node: this.node });
            expect($(this.node).find('.loading-warning').length).toBe(1);
            expect($(this.node).find('.loading-warning:visible').length).toBe(0);
            expect($(this.node).find('.loading-warning:hidden').length).toBe(1);
        });

        it('Should show the loading warning after a timeout', function (done) {
            spyOn(LoadingWidget.prototype, 'showTimeoutWarning').and.callThrough();
            const widget = new LoadingWidget({ node: this.node, timeout: 1 });
            const $warningNode = $(this.node).find('.loading-warning');
            spyOn($warningNode.__proto__, 'fadeIn').and.callThrough();
            expect(widget.timeoutShown).toBeFalse();
            setTimeout(() => {
                expect($(this.node).find('.loading-warning').length).toBe(1);
                expect(widget.showTimeoutWarning).toHaveBeenCalled();
                expect($warningNode.fadeIn).toHaveBeenCalledOnceWith('fast');
                expect(widget.timeoutShown).toBeTrue();
                done();
            }, 500);
        });
    });
});
