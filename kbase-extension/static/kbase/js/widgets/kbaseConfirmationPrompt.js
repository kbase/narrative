/*

    A prompt for confirmation of a user action. 

    It is based on kbasePrompt2, a modernized and improved version of kbasePrompt. 


    define([
        'jquery',
        'widgets/kbaseConfirmationPrompt'
    ], ($, ConfirmationPrompt)


            var $modal =  new ConfirmationPrompt($('<div>'), {
                    name : tab,
                    callback :
                        function(e, $prompt) {
                            $prompt.closePrompt();
                            if ($nav.hasClass('active')) {
                                if ($nav.next('li').length) {
                                    $nav.next().find('a').trigger('click');
                                }
                                else {
                                    $nav.prev('li').find('a').trigger('click');
                                }
                            }
                            $tab.remove();
                            $nav.remove();
                        }
                    ,
                }
            );

            $deleteModal.openPrompt();
*/

define([
    'kbwidget',
    'widgets/kbasePrompt2',

    // For effect
    'bootstrap',
], (KBWidget, kbasePrompt2) => {
    'use strict';
    return KBWidget({
        name: 'kbaseConfirmationPrompt',
        parent: kbasePrompt2,

        version: '1.0.0',
        options: {},

        init: function (options) {
            const onCancel =
                options.onCancel ||
                ((close) => {
                    close();
                });
            this._super({
                title: options.title,
                body: options.message,
                buttons: [
                    {
                        label: 'Cancel',
                        type: 'default',
                        callback: onCancel,
                    },
                    {
                        label: options.verb,
                        type: 'primary',
                        callback: options.onConfirm,
                    },
                ],
                onEnterKey: (close) => {
                    options.onConfirm(close);
                },
            });

            return this;
        },
    });
});
