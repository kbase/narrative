/*


*/


(function( $, undefined ) {


    $.widget("kbaseNarrative.commandcontext", $.kbase.widget, {
        version: "1.0.0",
        options: {
            link : function (evt) {
                alert("clicked on " + $(evt.target).text());
            }
        },

        _create : function () {
            this.refresh();
            return this;
        },

        refresh: function() {

            $( this.element).empty();

            this.appendUI( $( this.element ) );

            return this;

        },


        appendUI : function($elem) {

            var $selectedPanel = $('#workspaces').data('selectedPanel');
            if ($selectedPanel) {

                if (! $( $selectedPanel.children()[0] ).data('isNarrative')) {
                    return;
                }

                var $activeElem = $( $selectedPanel.children()[0] ).narrative('activeBlock');
                if ($activeElem) {

                    var outputType;
                    try {
                        outputType = $activeElem.narrativeBlock('outputType');
                    }
                    catch (e) {
                        if ($activeElem.outputType) {
                            outputType = $activeElem.outputType();
                        }
                        else {
                            $elem.empty();
                            return;
                        };
                    }

                    var metaInfo = MetaToolInfo();
                    var commands = [];

                    if (outputType[0] != undefined) {
                        for (var key in metaInfo) {
                            var meta = metaInfo[key](key);
                            if (meta.inputType == outputType[0]) {
                                commands.push(key);
                            }
                        }
                    }

                    var $div = $('<div></div>');

                    var $ul = $('<ul></ul>');

                    $div.append(
                        $('<h3></h3>')
                            .append(
                                $('<a></a>')
                                    .attr('href', '#')
                                    .text('Command context')
                        )
                    )
                    .append(
                        $('<div></div>')
                            .css('padding', '0px')
                            .append($ul)
                    );

                    $.each(
                        commands,
                        $.proxy(
                            function (idx, val) {
                                $ul.append(
                                    $('<li></li>')
                                        .append($('<a></a>')
                                            .attr('href', '#')
                                            //.tooltip()
                                            .text(val)
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

                    $elem.append($div);
                    $div.accordion({autoHeight : false, collapsible : true, fillSpace : true });
                }
            }
        },


    });

}( jQuery ) );
