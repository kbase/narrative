/*


*/


(function( $, undefined ) {


    $.widget("kbase-iris.commands", {
        version: "1.0.0",
        options: {
            invocationURL : 'http://bio-data-1.mcs.anl.gov/services/invocation',
            link : function (evt) {
                alert("clicked on " + $(evt.target).text());
            }
        },

        _create : function() {
            this.client = new InvocationService(this.options.invocationURL);
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
                                                var metaFunc = MetaToolInfo(val.cmd);
                                                var label = val.cmd;
                                                if (metaFunc != undefined) {
                                                    var meta = metaFunc(val.cmd);
                                                    label = meta.label;
                                                }

                                                $ul.append(
                                                    $('<li></li>')
                                                        .append($('<a></a>')
                                                            .attr('href', '#')
                                                            .attr('title', val.cmd)
                                                            .css('display', 'list-item')
                                                            //.tooltip()
                                                            .text(label)
                                                            .bind(
                                                                'click',
                                                                this.options.link
                                                            )
                                                        )
                                                        .draggable(
                                                            {
                                                                distance : 20,
                                                                cursor   : 'pointer',
                                                                opacity  : 0.7,
                                                                helper   : 'clone',
                                                                connectToSortable: this.options.connectToSortable,
                                                                revert : 'invalid',
                                                                disabled : this.options.connectToSortable == undefined,
                                                                cursorAt : {
                                                                    left : 5,
                                                                    top  : 5
                                                                }
                                                            }
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
