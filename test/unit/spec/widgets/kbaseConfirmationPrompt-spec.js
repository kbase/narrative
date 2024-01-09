define(['jquery', 'widgets/kbaseConfirmationPrompt', 'testUtil'], (
    $,
    ConfirmationPrompt,
    testUtil
) => {
    'use strict';

    const { waitForText } = testUtil;

    fdescribe('The Prompt widget', () => {
        it('should be defined', () => {
            expect(ConfirmationPrompt).toBeDefined();
        });

        it('should display a prompt', async () => {
            const titleText = 'Confirm This Works';
            const messageText = 'Did this work?';

            const $testDiv = $('<div>');

            const prompt = new ConfirmationPrompt($testDiv, {
                title: titleText,
                message: messageText,
                verb: 'Confirm It!',
                onConfirm: (close) => {
                    close();
                },
            });
            prompt.open();

            try {
                expect($testDiv).toBeDefined();

                // We can use a function to look for the text.
                await waitForText(
                    '.modal-dialog',
                    (text) => {
                        return text.includes(titleText);
                    },
                    { textName: `title text "${titleText}"` }
                );

                // Or just supply the text, and the string api's "includes" method will be
                // used to look for it.
                await waitForText('.modal-dialog', messageText, {
                    textName: `message text "${messageText}"`,
                });
            } finally {
                prompt.close();
            }
        });
    });
});
