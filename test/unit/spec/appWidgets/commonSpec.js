define(['common/events', 'common/ui', 'common/html', 'widgets/appWidgets2/common', 'testUtil'], (
    Events,
    UI,
    html,
    WidgetCommon,
    TestUtil
) => {
    'use strict';
    const div = html.tag('div'),
        button = html.tag('button');

    describe('Test WidgetCommon module', () => {
        let container;
        beforeEach(function () {
            container = document.createElement('div');
            this.events = Events.make({ node: container });
            this.ui = UI.make({ node: container });
        });
        afterEach(() => {
            container.remove();
            TestUtil.clearRuntime();
        });

        it('Should be loaded with the right functions', () => {
            expect(WidgetCommon).toBeDefined();
            expect(WidgetCommon.clipboardButton).toBeDefined();
            expect(WidgetCommon.containerContent).toBeDefined();
        });

        it('Should be able to produce content with a clipboard icon', function () {
            const input = document.createElement('div');
            container.innerHTML = WidgetCommon.containerContent(
                div,
                button,
                this.events,
                this.ui,
                container,
                input
            );
            expect(container.querySelector('[data-element=icon]')).toHaveClass('fa-clipboard');
        });

        it('Should be able to create the clipboard icon', function () {
            container.innerHTML = WidgetCommon.clipboardButton(
                div,
                button,
                this.events,
                this.ui,
                container
            );
            expect(container.querySelector('[data-element=icon]')).toHaveClass('fa-clipboard');
        });
    });
});
