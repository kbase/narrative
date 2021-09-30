define(['common/events', 'common/ui', 'kb_common/html', 'widgets/appWidgets2/common'], (
    Events,
    UI,
    html,
    WidgetCommon
) => {
    'use strict';
    const div = html.tag('div');
    const button = html.tag('button');
    const container = document.createElement('div');
    const events = Events.make({ node: container });
    const ui = UI.make({ node: container });
    describe('Test WidgetCommon module', () => {
        it('Should be loaded with the right functions', () => {
            expect(WidgetCommon).toBeDefined();
            expect(WidgetCommon.clipboardButton).toBeDefined();
            expect(WidgetCommon.containerContent).toBeDefined();
        });

        it('Should be able to produce content with a clipboard icon', () => {
            const input = document.createElement('div');
            const content = WidgetCommon.containerContent(
                div,
                button,
                events,
                ui,
                container,
                input
            );
            container.innerHTML = content;
            expect(
                container
                    .querySelectorAll('[data-element=icon]')[0]
                    .classList.contains('fa-clipboard')
            ).toBeTrue();
        });

        it('Should be able to create the clipboard icon', () => {
            const clipboardButton = WidgetCommon.clipboardButton(
                div,
                button,
                events,
                ui,
                container
            );
            container.innerHTML = clipboardButton;
            expect(
                container
                    .querySelectorAll('[data-element=icon]')[0]
                    .classList.contains('fa-clipboard')
            ).toBeTrue();
        });
    });
});
