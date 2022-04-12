define(['jquery', 'util/bootstrapDialog'], ($, Dialog) => {
    'use strict';
    const $simpleBody = $('<div>').append('This is a body text'),
        simpleTitle = 'Simple Modal Title',
        simpleButtons = [
            $('<button>')
                .append('b1')
                .click(() => {}),
            $('<button>')
                .append('b2')
                .click(() => {}),
        ];

    function createSimpleDialog() {
        return new Dialog({
            title: simpleTitle,
            body: $simpleBody,
            buttons: simpleButtons,
        });
    }

    describe('Test the BootstrapDialog module', () => {
        let simpleDialog;
        afterEach(() => {
            if (simpleDialog) {
                simpleDialog.destroy();
            }
        });

        it('Should create a new dialog object', () => {
            simpleDialog = createSimpleDialog();
            expect(simpleDialog).toEqual(jasmine.any(Object));
        });

        it('Should show on command', (done) => {
            simpleDialog = createSimpleDialog();
            simpleDialog.$modal.on('shown.bs.modal', () => {
                expect(simpleDialog.$modal.is(':visible')).toBeTruthy();
                done();
            });
            simpleDialog.show();
        });

        it('Should hide on command', (done) => {
            simpleDialog = createSimpleDialog();
            simpleDialog.$modal.on('hidden.bs.modal', () => {
                expect(simpleDialog.$modal.is(':visible')).toBeFalsy();
                done();
            });
            simpleDialog.$modal.on('shown.bs.modal', () => {
                expect(simpleDialog.$modal.is(':visible')).toBeTruthy();
                simpleDialog.hide();
            });
            simpleDialog.show();
        });

        it('Should get a title string back', () => {
            simpleDialog = createSimpleDialog();
            const title = simpleDialog.getTitle();
            expect(title).toBe(simpleTitle);
        });

        it('Should get the body div back', () => {
            simpleDialog = createSimpleDialog();
            const body = simpleDialog.getBody();
            expect(body.html()).toBe($simpleBody.html());
        });

        it('Should give the buttons back', () => {
            simpleDialog = createSimpleDialog();
            const buttons = simpleDialog.getButtons();
            expect(buttons.length).toBe(2);
            expect(buttons[0].innerHTML).toBe('b1');
            expect(buttons[1].innerHTML).toBe('b2');
        });

        it('Should get the whole modal object back', () => {
            simpleDialog = createSimpleDialog();
            const $modal = simpleDialog.getElement();
            expect($modal[0].tagName).toBe('DIV');
        });

        it('Should write over the title', () => {
            simpleDialog = createSimpleDialog();
            const newTitle = 'A new title!';
            simpleDialog.setTitle(newTitle);
            expect(simpleDialog.getTitle()).toBe(newTitle);
        });

        it('Should create a new body', () => {
            simpleDialog = createSimpleDialog();
            const $newBody = $('<div>').append('The new body');
            simpleDialog.setBody($newBody);
            expect(simpleDialog.getBody().html()).toBe($newBody.html());
        });

        it('Should trigger a command on enter key', () => {
            let wasTriggered = false;
            const btnFn = function () {
                wasTriggered = true;
            };
            simpleDialog = new Dialog({
                title: 'Test for command on enter keypress',
                body: $('<div>'),
                buttons: [
                    $('<button data-dismiss="modal">').append('Clickable button').click(btnFn),
                ],
                enterToTrigger: true,
            });
            expect(wasTriggered).toBe(false);
            const e = $.Event('keypress');
            e.which = 13;
            e.keyCode = 13;
            simpleDialog.getElement().trigger(e);
            expect(wasTriggered).toBe(true);
        });

        it('Should create a simple alert', () => {
            simpleDialog = new Dialog({
                title: 'Alert',
                body: $('<div>').append('an alert'),
                alertOnly: true,
            });

            const btns = simpleDialog.getButtons();
            expect(btns.length).toBe(1);
            expect(btns[0].innerHTML).toBe('Close');
        });

        it('Should set the title based on type', () => {
            simpleDialog = new Dialog({
                title: 'A Title Based on Type',
                type: 'warning',
            });
            expect(simpleDialog.$headerTitle.hasClass('text-warning')).toBe(true);
        });

        it('Should destroy the modal on command', () => {
            simpleDialog = createSimpleDialog();
            const ret = simpleDialog.destroy();
            expect(ret).toBeNull();
            expect(simpleDialog.getElement()).toBeNull();
            expect(document.querySelectorAll('.modal-backdrop').length).toBe(0);
            expect(document.body).not.toHaveClass('modal-open');
        });
    });
});
