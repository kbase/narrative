define(['jquery', 'widgets/loadingWidget', 'text!/kbase_templates/loading.html', 'css!/narrative/static/kbase/css/kbaseNarrative.css'], (
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
        beforeAll(() => {
            document.body.innerHTML = '';
        });

        beforeEach(function () {
            this.node = document.createElement('div');
            document.body.appendChild(this.node);
            this.node.innerHTML = templateHtml;
        });

        afterEach(function () {
            this.node.remove();
            this.node = null;
            document.body.innerHTML = '';
        });

        it('Should instantiate with a null node', () => {
            const noNodeWidget = new LoadingWidget({ node: null });
            expect(noNodeWidget).not.toBeNull();
            expect(noNodeWidget).toBeInstanceOf(LoadingWidget);
            noNodeWidget.clearTimeout();
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
            widget.clearTimeout();
        });

        it('Should be able to remove its container node', function () {
            spyOn(LoadingWidget.prototype, 'remove').and.callThrough();
            const widget = new LoadingWidget({ node: this.node });
            ['data', 'narrative', 'jobs', 'apps', 'kernel'].forEach((name) => {
                widget.updateProgress(name, true);
            });
            expect(widget.remove).toHaveBeenCalled();
        });

        it('Should not show the loading warning when first starting', function () {
            const widget = new LoadingWidget({ node: this.node });
            const $warning = $(this.node).find('.loading-warning');
            expect($warning.length).toBe(1);
            expect($warning.is(':visible')).toBeFalsy();
            widget.clearTimeout();
        });

        it('Should show the loading warning after a timeout', function (done) {
            const widget = new LoadingWidget({ node: this.node, timeout: 1 });
            spyOn(widget, 'showTimeoutWarning').and.callThrough();
            const $warningNode = $(this.node).find('.loading-warning');
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
