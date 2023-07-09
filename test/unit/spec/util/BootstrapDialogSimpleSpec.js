define(['jquery', 'util/bootstrapDialog'], ($, Dialog) => {
    'use strict';

    /**
     * This spec module dedicated to the prospect of testing against a simple
     * dialog which is automatically created and destroyed for each test.
     * See BootstrapDialogSpec.js for more complex tests in which the dialog
     * is created and destroyed by each test.
     */

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

        beforeEach(() => {
            simpleDialog = createSimpleDialog();
        });

        afterEach(() => {
            if (simpleDialog) {
                simpleDialog.destroy();
            }
        });

        it('Should create a new dialog object', () => {
            expect(simpleDialog).toEqual(jasmine.any(Object));
        });

        it('Should show on command', (done) => {
            simpleDialog.$modal.on('shown.bs.modal', () => {
                expect(simpleDialog.$modal.is(':visible')).toBeTruthy();
                done();
            });
            simpleDialog.show();
        });

        it('Should hide on command', (done) => {
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

        it('Should call the "onShown" event handler if provided', () => {
            const $newBody = $('<div>').append('The new body');
            simpleDialog.setBody($newBody);
            expect(simpleDialog.getBody().html()).toBe($newBody.html());
        });
    });
});
