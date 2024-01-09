define(['jquery', 'widgets/kbasePrompt2', 'testUtil'], ($, Prompt, testUtil) => {
    'use strict';

    const { waitForText } = testUtil;

    describe('The Prompt widget', () => {
        it('should be defined', () => {
            expect(Prompt).toBeDefined();
        });

        it('should display a prompt', async () => {
            const titleText = 'Acknowledge Receipt';
            const bodyText = 'Did you get the message?';

            const $testDiv = $('<div>');

            const prompt = new Prompt($testDiv, {
                title: titleText,
                body: bodyText,
                // Not required. jquery animation class to show/hide. Defaults to 'fade'
                modalClass: 'fade',
                buttons: [
                    {
                        label: 'No',
                        type: 'danger',
                        callback: (close) => {
                            close();
                        },
                    },
                    {
                        label: 'Yes',
                        type: 'primary',
                        callback: (close) => {
                            close();
                        },
                    },
                ],
                footer: 'Some footer value here',
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
                await waitForText('.modal-dialog', bodyText, {
                    textName: `body text "${bodyText}"`,
                });
            } finally {
                prompt.close();
            }
        });
    });
});
