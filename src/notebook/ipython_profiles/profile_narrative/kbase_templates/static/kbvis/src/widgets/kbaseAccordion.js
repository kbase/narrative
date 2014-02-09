/*

Widget to create an accordion control. Easy to use!

    var $accordion = $('#accordion').kbaseAccordion(
        [
            {
                title : 'Accordion element 1',
                body : 'body 1'
            },
            {
                title : 'Accordion element 2',
                body : 'body 2'
            },
            {
                title : 'Accordion element 3',
                body : 'body 3'
            },
            {
                title : 'Accordion element 4',
                body : 'body 4'
            },
        ]
    );

*/

define('kbaseAccordion', ['jquery', 'kbwidget'], function( $ ) {


    $.KBWidget({
        name : 'kbaseAccordion',
        version: "1.0.0",
        options: {
            fontSize : '100%',
        },

        init: function(options) {

            this._super(options);

            if (this.options.client) {
                this.client = this.options.client;
            }

            this.appendUI( $( this.$elem ) );

            return this;

        },

        appendUI : function ($elem, elements) {

            if (elements == undefined) {
                elements = this.options.elements;
            }

            var fontSize = this.options.fontSize;

            var $block =
                $('<div></div>')
                    .addClass('accordion')
                    .css('font-size', fontSize)
                    .attr('id', 'accordion')
            ;

            $.each(
                elements,
                $.proxy(
                    function (idx, val) {

                        $block.append(
                            $('<div></div>')
                                .addClass('panel panel-default')
                                .css('margin-bottom', '2px')
                                .append(
                                    $('<div></div>')
                                        .addClass('panel-heading')
                                        .css('padding', '0px')
                                        .append(
                                            $('<i></i>')
                                                .css('margin-right', '5px')
                                                .css('margin-left', '3px')
                                                .addClass('fa fa-chevron-right')
                                                .addClass('pull-left')
                                                .css('height', '22px')
                                                .css('line-height', '22px')
                                                .css('color', 'gray')
                                        )
                                        .append(
                                            $('<a></a>')
                                                .css('padding', '0px')
                                                .attr('href', '#')
                                                .attr('title', val.title)
                                                .css('height', '22px')
                                                .css('line-height', '22px')

                                                .append(val.title)
                                                //.text(val.title)
                                        )
                                        .bind(
                                            'click',
                                                function(e) {
                                                    e.preventDefault();
                                                    var $opened = $(this).closest('.panel').find('.in');
                                                    var $target = $(this).next();

                                                    if ($opened != undefined) {
                                                        $opened.collapse('hide');
                                                        var $i = $opened.parent().first().find('i');
                                                        $i.removeClass('fa fa-chevron-down');
                                                        $i.addClass('fa fa-chevron-right');
                                                    }

                                                    if ($target.get(0) != $opened.get(0)) {
                                                        $target.collapse('show');
                                                        var $i = $(this).parent().find('i');
                                                        $i.removeClass('fa fa-chevron-right');
                                                        $i.addClass('fa fa-chevron-down');
                                                    }

                                                }
                                            )
                                )
                                .append(
                                    $('<div></div>')
                                        .addClass('panel-body collapse')
                                        .css('padding-top', '9px')
                                        .css('padding-bottom', '9px')
                                        .append(val.body)
                                    )
                            )
                        ;
                    },
                    this
                )
            );

            this._rewireIds($block, this);

            $elem.append($block);
//            $block.find('.panel-body').collapse('hide');

        },

    });

});
