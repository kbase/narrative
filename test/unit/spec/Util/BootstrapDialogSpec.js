define(['jquery', 'util/bootstrapDialog'], ($, Dialog) => {
    'use strict';
    const $simpleBody = $('<div>').append('This is a body text'),
        simpleTitle = 'Title',
        simpleButtons = [
            $('<button>')
                .append('b1')
                .click(() => {}),
            $('<button>')
                .append('b2')
                .click(() => {}),
        ];
    let simpleDialog;

    beforeEach(() => {
        simpleDialog = new Dialog({
            title: simpleTitle,
            body: $simpleBody,
            buttons: simpleButtons,
        });
        // simpleDialog.getElement().appendTo('body');
    });

    describe('Test the BootstrapDialog module', () => {
        it('Should create a new dialog object', () => {
            expect(simpleDialog).toEqual(jasmine.any(Object));
        });

        it('Should show on command', () => {
            simpleDialog.show();
            expect($($.find('.fade.in')).is(':visible')).toBeTruthy();
        });

        it('Should hide on command', (done) => {
            simpleDialog.$modal.on('hidden.bs.modal', () => {
                expect(simpleDialog.$modal.is(':visible')).toBeFalsy();
                done();
            });
            simpleDialog.show();
            simpleDialog.hide();
        });

        it('Should get a title string back', () => {
            const title = simpleDialog.getTitle();
            expect(title).toBe(simpleTitle);
        });

        it('Should get the body div back', () => {
            const body = simpleDialog.getBody();
            expect(body.html()).toBe($simpleBody.html());
        });

        it('Should give the buttons back', () => {
            const buttons = simpleDialog.getButtons();
            expect(buttons.length).toBe(2);
            expect(buttons[0].innerHTML).toBe('b1');
            expect(buttons[1].innerHTML).toBe('b2');
        });

        it('Should get the whole modal object back', () => {
            const $modal = simpleDialog.getElement();
            expect($modal[0].tagName).toBe('DIV');
        });

        it('Should write over the title', () => {
            const newTitle = 'A new title!';
            simpleDialog.setTitle(newTitle);
            expect(simpleDialog.getTitle()).toBe(newTitle);
        });

        it('Should create a new body', () => {
            const $newBody = $('<div>').append('The new body');
            simpleDialog.setBody($newBody);
            expect(simpleDialog.getBody().html()).toBe($newBody.html());
        });

        it('Should trigger a command on enter key', () => {
            let wasTriggered = false;
            const btnFn = function () {
                wasTriggered = true;
            };
            const dialog = new Dialog({
                title: 'test',
                body: $('<div>'),
                buttons: [$('<button>').append('foo').click(btnFn)],
                enterToTrigger: true,
            });
            dialog.show();
            expect(wasTriggered).toBe(false);
            const e = $.Event('keypress');
            e.which = 13;
            e.keyCode = 13;
            dialog.getElement().trigger(e);
            expect(wasTriggered).toBe(true);
            dialog.hide();
            dialog.destroy();
        });

        it('Should create a simple alert', () => {
            const alert = new Dialog({
                title: 'Alert',
                body: $('<div>').append('an alert'),
                alertOnly: true,
            });

            const btns = alert.getButtons();
            expect(btns.length).toBe(1);
            expect(btns[0].innerHTML).toBe('Close');
        });

        it('Should set the title based on type', () => {
            const d = new Dialog({
                title: 'Foo',
                type: 'warning',
            });
            expect(d.$headerTitle.hasClass('text-warning')).toBe(true);
        });

        it('Should destroy the modal on command', () => {
            const ret = simpleDialog.destroy();
            expect(ret).toBe(null);
            expect(simpleDialog.getElement()).toBe(null);
        });
    });
});
