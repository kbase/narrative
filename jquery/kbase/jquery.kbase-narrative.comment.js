/*


*/


(function( $, undefined ) {


    $.widget("kbase-narrative.comment", {
        version: "1.0.0",
        options: {

        },

        _init: function() {

            this.narrative = this.options.narrative;

            var $deleteDialog = $('<div></div>')
                .append('Really delete comment?')
                .dialog(
                    {
                        title : 'Confirmation',
                        autoOpen : false,
                        modal : true,
                        resizable: false,
                        buttons : {
                            Cancel : function () {
                                $( this ).dialog('close');
                            },
                            Delete :
                                $.proxy(
                                    function() {
                                        $(this.element).remove();
                                        $deleteDialog.dialog('close');
                                        if (this.narrative != undefined) {
                                            this.narrative.save();
                                            this.narrative.reposition();
                                        }
                                    },
                                    this
                                )
                        },
                        open :  function () {
                            $('button:last', $(this).parent()).focus();
                        }
                    }
                );

            $(this.element)
                .css('border', '1px dashed gray')
                .css('min-height', '50px')
                .css('margin-bottom', '5px')
                .append(
                    $('<div></div>')
                        .css('text-align', 'right')
                        .css('clear', 'both')
                        .append(
                            $('<button></button>')
                                .append('Close\n')
                                .css({width : '19px', height : '18px'})
                                .button({text : false, icons : {primary : 'ui-icon-closethick'}})
                                .bind('click',
                                    function(evt) {
                                        $deleteDialog.dialog('open');
                                        evt.stopPropagation();
                                    }
                                )
                        )
                )
                .append(
                    $('<div></div>')
                        .css('padding', '3px')
                        .css('margin', '0px 10px 10px 10px')
                        .css('white-space', 'pre')
                        .attr('contenteditable', 'true')
                        .append(this.options.value)
                        .addClass('editor')
                        .css('color', 'gray')
                        .bind('blur', $.proxy(
                            function(evt) {
                                this.narrative.save();
                            },
                            this
                        ))
                );

            $(this.element).data('blockType', 'comment');

            //$(window).trigger('resize');
            if (this.narrative) {
                this.narrative.reposition();
            }


            return this;

        },

        comment : function() {
            return $('.editor', $(this.element)).html();
        },

        blockDefinition : function() {
            return {
                comment : this.comment(),
                type    : 'comment',
                id      : this.options.id,
            };
        },


    });

}( jQuery ) );
