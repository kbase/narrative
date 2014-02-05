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
                    icon : 'fa fa-search',
                    'icon-alt' : 'fa fa-search-o', //optional. Toggle icon between icon and icon-alt when clicked.
                    callback : function(e) {
                        console.log("clicked on search");
                    },
                    id : 'search' //optional. Keys the button to be available via $('#some_div').controls('search')
                },
                {
                    icon : 'fa fa-minus',
                    callback : function(e) {
                        console.log("clicked on delete");
                    }
                },
            ],
        }
    );
*/

define('kbaseButtonControls', ['jquery', 'bootstrap', 'kbwidget'], function( $ ) {

    $.KBWidget({

		  name: "kbaseButtonControls",

        version: "1.0.0",
        options: {
            controls : [],
            onMouseover : true,
            position : 'top',
            type : 'floating'
        },

        init: function(options) {

            this._super(options);

            this._controls = {};

            this.appendUI( $( this.$elem ) );

            return this;

        },

        appendUI : function ($elem) {

            if (this.options.type == 'floating') {
                $elem
                    .css('position', 'relative');
            }

           var $controlButtons =
                $('<div></div>')
                    .addClass('btn-group btn-group-xs')
                    .attr('id', 'control-buttons')
            ;

            if (this.options.type == 'floating') {
                $controlButtons
                    .css('right', '0px')
                    .css(this.options.position, '0px')
                    .css('position', 'absolute')
                    .css('margin-right', '3px')
                    .attr('z-index', 10000)
                ;
            }

            $elem.prepend($controlButtons);

            this._rewireIds($elem, this);

            if (this.options.onMouseover && this.options.type == 'floating') {
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

                    var btnClass = 'btn btn-default';
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

} );
