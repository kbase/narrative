/*


*/


(function( $, undefined ) {


    $.widget("kbase-iris.commands", {
        version: "1.0.0",
        options: {
            link : function (evt) {
                alert("clicked on " + $(evt.target).text());
            }
        },

        _create : function() {
            this.client = new InvocationService();
            return this;
        },

        _init: function() {

            this.appendUI( $( this.element ) );

            return this;

        },

        appendUI : function($elem) {

            this.client.valid_commands_async(
                $.proxy(
                    function (res) {
                        $.each(
                            res,
                            $.proxy(
                                function (idx, group) {

                                    var $ul = $('<ul></ul>');

                                    $elem.append(
                                        $('<h3></h3>')
                                            .append(
                                                $('<a></a>')
                                                    .attr('href', '#')
                                                    .text(group.title)
                                        )
                                    )
                                    .append(
                                        $('<div></div>')
                                            .css('padding', '0px')
                                            .append($ul)
                                    );

                                    $.each(
                                        group.items,
                                        $.proxy(
                                            function (idx, val) {
                                                $ul.append(
                                                    $('<li></li')
                                                        .append($('<a></a>')
                                                            .attr('href', '#')
                                                            .attr('title', 'Usage information would be here...if we had it')
                                                            //.tooltip()
                                                            .text(val.cmd)
                                                            .bind(
                                                                'click',
                                                                this.options.link
                                                            )
                                                        )
                                                );
                                            },
                                            this
                                        )
                                    );
                                },
                                this
                            )
                        );

                        $elem.accordion({autoHeight : false, collapsible : true, fillSpace : true, active : false });

                    },
                    this
                )
            );

        },


    });

}( jQuery ) );
