/*
    control to tack on arbitrary command groups to any container element.
    This lets you mouse over and display buttons (with icons) in the upper right.

    $('#some_div').kbaseButtonControls(
        {
            //list of controls to populate buttons on the right end of the title bar. Give it an icon
            //and a callback function.
            onMouseover : true,
            id: some_id, //arbitrary value to associate with these controls. Each button gets a copy in .data('id')
            controls : [
                {
                    icon : 'icon-search',
                    'icon-alt' : 'icon-search-alt', //optional. Toggle icon between icon and icon-alt when clicked.
                    callback : function(e) {
                        console.log("clicked on search");
                    },
                    id : 'search' //optional. Keys the button to be available via $('#some_div').controls('search')
                },
                {
                    icon : 'icon-minus',
                    callback : function(e) {
                        console.log("clicked on delete");
                    }
                },
            ],
        }
    );
*/

(function( $, undefined ) {

    $.KBWidget({

		  name: "kbaseButtonControls",

        version: "1.0.0",
        options: {
            controls : [],
            onMouseover : true,
        },

        init: function(options) {

            this._super(options);

            this._controls = {};

            this.appendUI( $( this.$elem ) );

            return this;

        },

        appendUI : function ($elem) {

            $elem
                .css('position', 'relative')
                .prepend(
                    $('<div></div>')
                        .addClass('btn-group')
                        .attr('id', 'control-buttons')
                        .css('right', '0px')
                        .css('top', '0px')
                        .css('position', 'absolute')
                        .css('margin-right', '3px')
                )
            ;

            this._rewireIds($elem, this);

            if (this.options.onMouseover) {
                $elem
                    .mouseover(
                        function(e) {
                            $(this).children().first().show();
                        }
                    )
                    .mouseout(
                        function(e) {
                            $(this).children().first().hide();
                        }
                    )
                    .children().first().hide();
            };

            this.setControls(this.options.controls);

            return this;

        },

        controls : function (control) {
            if (control) {
                return this._controls[control];
            }
            else {
                return this._controls;
            }
        },

        setControls : function (controls) {
            this.data('control-buttons').empty();
            for (control in this._controls) {
                this._controls[control] = undefined;
            }

            var $buttonControls = this;

            $.each(
                controls,
                $.proxy(function (idx, val) {

                    if (val.condition) {
                        if (val.condition.call(this, val, $buttonControls.options.context, this.$elem) == false) {
                            return;
                        }
                    }

                    var btnClass = 'btn btn-mini';
                    if (val.type) {
                        btnClass = btnClass + ' btn-' + val.type;
                    }

                    tooltip = val.tooltip;

                    if (typeof val.tooltip == 'string') {
                        tooltip = {title : val.tooltip};
                    }

                    if (tooltip != undefined && tooltip.container == undefined) {
                        //tooltip.container = 'body';//this.$elem;//'body';
                    }

                    var $button =
                        $('<button></button>')
                            .attr('href', '#')
                            .css('padding-top', '1px')
                            .css('padding-bottom', '1px')
                            .attr('class', btnClass)
                            .append($('<i></i>').addClass(val.icon))
                            .tooltip(tooltip)//{title : val.tooltip})
                            .bind('click',
                                function(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (val['icon-alt']) {
                                        $(this).children().first().toggleClass(val.icon);
                                        $(this).children().first().toggleClass(val['icon-alt']);
                                    }
                                    val.callback.call(this, e, $buttonControls.options.context);
                                }
                            )
                    ;

                    if (val.id) {
                        this._controls[val.id] = $button;
                    }
                    if (this.options.id) {
                        $button.data('id', this.options.id);
                    }

                    this.data('control-buttons').append($button);
                },this)
            );
        },


    });

}( jQuery ) );
