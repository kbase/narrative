/*


*/

(function( $, undefined ) {

    $.kbWidget("kbaseIrisProcessList", 'kbaseWidget', {
        version: "1.0.0",
        options: {

        },

        init: function (options) {

            this._super(options);

            this.appendUI(this.$elem);

            return this;

        },

        appendUI : function($elem) {

            $elem.append(
                $('<div></div>')
                    .css('border', '1px solid lightgray')
                    .css('padding', '2px')
                    .append(
                        $('<h5></h5>')
                            .addClass('text-left')
                            .text("Running processes")
                            .css('margin', '0px')
                            .css('padding', '2px')
                            .css('background-color', 'lightgray')
                            .css('border-collapse', 'collapse')

                        )
                    .append(
                        $('<ul></ul>')
                            .addClass('unstyled')
                            .append(this.pendingLi())
                    )
                )
            ;

            return this;

        },

        pendingLi : function() {
            if (this.data('pendingLi') == undefined) {
                this.data('pendingLi',
                    $('<li></li>')
                        .css('font-style', 'italic')
                        .text('No processes running')
                );
            }

            return this.data('pendingLi');
        },

        addProcess : function (process) {

            this.pendingLi().remove();

            var $li = $('<li></li>')
                .text(process);

            this.$elem.find('ul').append($li);

            return $li;
        },

        removeProcess : function ($li) {
            $li.remove();
            if (this.$elem.find('ul').children().length == 0) {
                this.$elem.find('ul').append(this.pendingLi());
            }
        }

    });

}( jQuery ) );
