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
        beforeEach(function () {
            this.container = document.createElement('div');
            document.body.appendChild(this.container);
            this.events = Events.make({ node: this.container });
            this.ui = UI.make({ node: this.container });
        });
        afterEach(function () {
            this.container.remove();
            TestUtil.clearRuntime();
        });

        it('Should be loaded with the right functions', () => {
            expect(WidgetCommon).toBeDefined();
            expect(WidgetCommon.clipboardButton).toBeDefined();
            expect(WidgetCommon.containerContent).toBeDefined();
        });

        it('Should be able to produce content with a clipboard icon', function () {
            const input = document.createElement('div');
            this.container.innerHTML = WidgetCommon.containerContent(
                div,
                button,
                this.events,
                this.ui,
                this.container,
                input
            );
            expect(this.container.querySelector('[data-element=icon]')).toHaveClass('fa-clipboard');
        });

        it('Should be able to create the clipboard icon', function () {
            this.container.innerHTML = WidgetCommon.clipboardButton(
                div,
                button,
                this.events,
                this.ui,
                this.container
            );
            expect(this.container.querySelector('[data-element=icon]')).toHaveClass('fa-clipboard');
        });

        it('Should copy input to the clipboard with a click', function () {
            const text = 'some text';
            const contrivedInput = div(
                {
                    role: 'textbox',
                },
                text
            );
            this.container.innerHTML = WidgetCommon.containerContent(
                div,
                button,
                this.events,
                this.ui,
                this.container,
                contrivedInput
            );
            this.events.attachEvents(this.container);
            const btn = this.container.querySelector('button');
            spyOn(navigator.clipboard, 'writeText');
            btn.click();
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
        });

        it('Should copy callback-specified input to the clipboard with a click', function () {
            const otherText = 'something completely different.';
            const contrivedInput = div();
            this.container.innerHTML = WidgetCommon.containerContent(
                div,
                button,
                this.events,
                this.ui,
                this.container,
                contrivedInput,
                () => otherText
            );
            this.events.attachEvents(this.container);
            const btn = this.container.querySelector('button');
            spyOn(navigator.clipboard, 'writeText');
            btn.click();
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(otherText);
        });
    });
});
