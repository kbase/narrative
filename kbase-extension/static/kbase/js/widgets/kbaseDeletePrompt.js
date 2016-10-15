/*

    Simplified prompt for delete confirmations.

    var $deleteModal =  new kbaseDeletePrompt($('<div></div>'), {
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

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbasePrompt'
	], function(
		KBWidget,
		bootstrap,
		$,
		kbasePrompt
	) {

    return KBWidget({

		  name: "kbaseDeletePrompt",
		parent : kbasePrompt,

        version: "1.0.0",
        options: {
            controls : ['cancelButton', 'okayButton']
        },

        init: function(options) {

            this._super(
              {
                title : 'Confirm deletion',
                body : 'Really delete <strong>' + options.name + '</strong>?',
                controls : [
                    'cancelButton',
                    {
                        name : 'Delete',
                        type : 'primary',
                        callback : options.callback
                    }
                ],
              }
            );

            return this;

        },


    });

});
