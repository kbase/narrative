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

    function untilTrue(testFun, waitFor) {
        const started = Date.now();
        return new Promise((resolve, reject) => {
            /**
             * Runs testFun,
             * @returns true if testing is complete; false otherwise
             */
            const loop = () => {
                const elapsed = Date.now() - started;
                if (elapsed > waitFor) {
                    resolve(false);
                    return;
                }
                setTimeout(() => {
                    try {
                        if (testFun()) {
                            resolve(true);
                        } else {
                            loop();
                        }
                    } catch (ex) {
                        reject(new Error(`Error running test function: ${ex.message}`));
                    }
                }, 100);
            };
            // can succeed immediately.
            if (testFun()) {
                resolve(true);
            } else {
                loop();
            }
        });
    }

    const DEFAULT_ASYNC_EXPECT_TIMEOUT = 1000;

    describe('Test the BootstrapDialog module', () => {
        it('Should trigger a command on enter key', () => {
            let wasTriggered = false;
            const btnFn = function () {
                wasTriggered = true;
            };
            const dialog = new Dialog({
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
            dialog.getElement().trigger(e);
            expect(wasTriggered).toBe(true);

            dialog.destroy();
        });

        it('Should invoke "onShown" handler when shown', async () => {
            const dialog = new Dialog({
                title: 'Alert',
                body: $('<div>').append('an alert'),
                alertOnly: true,
            });

            let hasBeenShown = false;

            dialog.onShown(() => {
                hasBeenShown = true;
            });

            expect(hasBeenShown).toBeFalse();

            dialog.show();

            expect(
                await untilTrue(() => {
                    return hasBeenShown;
                }, DEFAULT_ASYNC_EXPECT_TIMEOUT)
            ).toBeTrue();

            expect(hasBeenShown).toBeTrue();

            dialog.destroy();
        });

        it('Should invoke "onHidden" handler when shown', async () => {
            /**
             * Tests whether the onHidden handler for the bootstrap dialog
             * 'bs.hidden' event is run.
             * Note that there is an implicit assumption that events are
             * synchronous. Not generally a good assumption, but as it is
             * based on jquery, and jquery events ARE synchronous, it works.
             * Parenthetically, this is one reason I don't like using jquery
             * events, as it builds such asynchronous assumptions into the
             * codebase.
             */
            const dialog = new Dialog({
                title: 'Alert',
                body: $('<div>').append('an alert'),
                alertOnly: true,
            });

            let hasBeenShown = false;

            let hasBeenHidden = false;

            dialog.onShown(() => {
                hasBeenShown = true;
            });

            dialog.onHidden(() => {
                hasBeenHidden = true;
            });

            expect(hasBeenShown).toBeFalse();
            expect(hasBeenHidden).toBeFalse();

            dialog.show();

            expect(
                await untilTrue(() => {
                    return hasBeenShown;
                }, DEFAULT_ASYNC_EXPECT_TIMEOUT)
            ).toBeTrue();

            dialog.hide();

            expect(
                await untilTrue(() => {
                    return hasBeenHidden;
                }, DEFAULT_ASYNC_EXPECT_TIMEOUT)
            ).toBeTrue();

            dialog.destroy();
        });

        it('Should set the title based on type', () => {
            const dialog = new Dialog({
                title: 'A Title Based on Type',
                type: 'warning',
            });
            expect(dialog.$headerTitle.hasClass('text-warning')).toBe(true);
            dialog.destroy();
        });

        it('Should destroy the modal on command', () => {
            const dialog = createSimpleDialog();
            const ret = dialog.destroy();
            expect(ret).toBeNull();
            expect(dialog.getElement()).toBeNull();
            expect(document.querySelectorAll('.modal-backdrop').length).toBe(0);
            expect(document.body).not.toHaveClass('modal-open');
            dialog.destroy();
        });
    });
});
