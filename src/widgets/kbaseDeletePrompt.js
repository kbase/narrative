/*

    Simplified prompt for delete confirmations.

    var $deleteModal = $('<div></div>').kbaseDeletePrompt(
        {
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

    Sure, you could just set it up through kbasePrompt. But why bother?
*/

(function( $, undefined ) {
    $.KBWidget("kbaseDeletePrompt", 'kbasePrompt', {
        version: "1.0.0",
        options: {
            controls : ['cancelButton', 'okayButton']
        },

        init: function(options) {

            this._super(options);

            return $('<div></div>').kbasePrompt(
                    {
                        title : 'Confirm deletion',
                        body : 'Really delete <strong>' + this.options.name + '</strong>?',
                        controls : [
                            'cancelButton',
                            {
                                name : 'Delete',
                                type : 'primary',
                                callback : this.options.callback
                            }
                        ],
                    }
                )

        },


    });

}( jQuery ) );
