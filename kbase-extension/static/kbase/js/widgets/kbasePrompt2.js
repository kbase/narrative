/*

    Generic prompting widget. Documented via example!

    This widget is designed to be a base prompt for use-case-specific prompts. Compared
    to the older kbasePrompt.js, it makes fewer assumptions about how it will be used.
    At this time, it is also a proper AMD module, whilst the older one is not (but still
    works, as it is loaded globally).

    It also uses viewer of the 

    const myPrompt =  new Prompt($('<div>'), {
        title : 'Acknowledge Receipt',
        body : 'Did you get the message?',
        // Not required. jquery animation class to show/hide. Defaults to 'fade'
        modalClass : 'fade', 
        buttons : [
            {
                label: 'No',
                type: 'danger',
                callback:  ((prompt) => { 
                    prompt.close();
                })
            },
            {
                label: 'Yes',
                type: 'primary',
                callback:  ((prompt) => { 
                    prompt.close();
                })
            }
           
        ],
        footer : 'Some footer value here',
    });
    myPrompt.open();



    It takes three content objects: title, body, and footer: These are all strings,
    strings with html, or jQuery objects. They will be placed as the title, body, and
    footer of the prompt, respectively. The footer text is left justified, as it shares
    the footer area with the buttons, which are right aligned.

    Buttons are placed in the right-hand side of the footer area. There are no default
    buttons!
    
    Each button is specified by a label, type, and callback function. 
    
        The label may be a string or jquery object, allowing usage of icons or images. 
    
        The type is the suffix to the "btn-" class assigned to the button. As per bootstrap,
        these may be default, primary, success, info, warning, danger, or link.

        The callback is called when the button is clicked. The sole parameter
        to the callback is a function which, when called, will close the prompt
        dialog modal.

    The "modalClass" option appends additional classes to the top level "modal"
    bootstrap class. It is optional.  The default behavior of "fade" ensures that the
    modal smoothly fades in and out when opened and closed.
*/

define([
    'kbwidget',
    'jquery',

    // For effect
    'bootstrap',
], (KBWidget, $) => {
    'use strict';

    return KBWidget({
        name: 'kbasePrompt2',

        version: '1.0.0',
        options: {
            buttons: [],
            modalClass: 'fade',
        },

        init: function (options) {
            this._super(options);
            this.$dialogModal = null;
            return this;
        },

        open: function () {
            // Here is where it is inserted (by the bootstrap javascript api)
            // into the DOM, in case you were wondering how that magic happens.
            this.$dialogModal = this.createDialogModal();
            this.$dialogModal.on('hidden.bs.modal', function () {
                // Zap the model.
                $(this).html('');
            });
            this.$dialogModal.modal({ keyboard: true });
        },

        close: function () {
            if (this.$dialogModal) {
                this.$dialogModal.removeClass('fade').modal('hide');
            }
        },

        createDialogModal: function () {
            const $dialogModal = $('<div>')
                .attr('data-name', 'kbase-prompt')
                .attr('class', 'modal ' + this.options.modalClass)
                .attr('tabindex', '-1')
                .append(
                    $.jqElem('div')
                        .addClass('modal-dialog')
                        .append(
                            $.jqElem('div')
                                .addClass('modal-content')
                                .append(
                                    $('<div>')
                                        .attr('class', 'modal-header')
                                        .append(
                                            $('<button>')
                                                .attr('type', 'button')
                                                .attr('class', 'close')
                                                .attr('data-dismiss', 'modal')
                                                .attr('aria-hidden', 'true')
                                                .append('x\n')
                                        )
                                        .append($('<h3>').addClass('modal-title'))
                                )
                                .append($('<div>').attr('class', 'modal-body'))
                                .append(
                                    $('<div>')
                                        .attr('class', 'modal-footer')
                                        .append(
                                            $('<div>')
                                                .addClass('row')
                                                .addClass('form-horizontal')
                                                .append(
                                                    $('<div>')
                                                        .addClass('col-md-6')
                                                        .addClass('text-left')
                                                        .attr('data-name', 'footer')
                                                )
                                                .append(
                                                    $('<div>')
                                                        .addClass('col-md-6')
                                                        .attr('data-name', 'buttons')
                                                        .css('white-space', 'nowrap')
                                                )
                                        )
                                )
                        )
                );

            // We handle the "enter key" if is configured.
            // The old method would "click" the last button, but this is a bit of extra
            // magic that is not necessary in the general case.
            if (this.options.onEnterKey) {
                $dialogModal.unbind('keypress');
                $dialogModal.keypress((e) => {
                    if (e.keyCode == 13) {
                        e.stopPropagation();
                        e.preventDefault();
                        this.options.onEnterKey(this);
                    }
                });
            }

            if (this.options.title) {
                $dialogModal.find('.modal-title').append(this.options.title);
            }

            if (this.options.body) {
                $dialogModal.find('.modal-body').append(this.options.body);
            }

            if (this.options.footer) {
                $dialogModal.find('[data-name="footer"]').append(this.options.footer);
            }

            const prompt = this;

            $.each(this.options.buttons, (_index, { type, label, callback }) => {
                const $button = $('<a>')
                    .attr('class', `btn btn-${type || 'default'}`)
                    .append(label)
                    .bind('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        callback(() => {
                            prompt.close();
                        });
                    });

                $dialogModal.find('[data-name="buttons"]').append($button);
            });

            return $dialogModal;
        },
    });
});
