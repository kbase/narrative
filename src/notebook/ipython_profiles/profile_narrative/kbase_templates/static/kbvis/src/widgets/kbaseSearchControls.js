/*
    control to tack on arbitrary command groups to any container element.
    This lets you mouse over and display buttons (with icons) in the upper right.

    $('#some_div').kbaseSearchControls(
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

define('kbaseSearchControls', ['jquery', 'bootstrap', 'kbwidget'], function( $ ) {

    $.KBWidget({

		  name: "kbaseSearchControls",

        version: "1.0.0",
        options: {
            controls : [],
            onMouseover : true,
            position : 'top',
            type : 'floating',
        },

        init: function(options) {

            this._super(options);

            this.appendUI( $( this.$elem ) );

            return this;

        },

        appendUI : function ($elem) {

            var $sc = this;

            var restoreMouseOver = this.options.onMouseover;

            if (this.options.type == 'floating') {
                $elem.css('position', 'relative');
            }
            var $filterbox =
                $.jqElem('div')
                    .addClass('input-group input-group-sm')
                    .append(
                        $.jqElem('input')
                            .attr('type', 'text')
                            .addClass('form-control')
                            .attr('id', 'searchBox')
                            .on('keyup', function(e) {
                                if (e.keyCode == 27) {
                                    $sc.value(undefined);
                                }

                                var value = $sc.value();

                                if (value.length) {
                                    $sc.data('searchIcon').removeClass('fa-search');
                                    $sc.data('searchIcon').addClass('fa-times');
                                    $sc.options.onMouseover = false;
                                }
                                else {
                                    $sc.data('searchIcon').addClass('fa-search');
                                    $sc.data('searchIcon').removeClass('fa-times');
                                    if (restoreMouseOver) {
                                        $sc.options.onMouseover = true;
                                    }
                                }

                                $sc.options.searchCallback.call(this, e, value, $sc.options.context);

                            })
                    )
                    .append(
                        $.jqElem('span')
                            .addClass('input-group-btn')
                            .append(
                                $.jqElem('button')
                                    .addClass('btn btn-default')
                                    .attr('id', 'searchButton')
                                    .append(
                                        $.jqElem('i')
                                            .attr('id', 'searchIcon')
                                            .addClass('fa fa-search')
                                    )
                                    .on('click', function(e) {

                                        if ($sc.data('searchIcon').hasClass('fa-times')) {
                                            $sc.value(undefined);
                                            $sc.data('searchBox').focus();
                                            if (restoreMouseOver) {
                                                $sc.options.onMouseover = true;
                                            }
                                        }

                                        $sc.options.searchCallback.call(this, e, $sc.value(), $sc.options.context);

                                    })
                            )
                    )
            ;

            if (this.options.type == 'floating') {
                $filterbox
                    .css('right', '0px')
                    .css('top', '0px')
                    .css('position', 'absolute')
                    .css('margin-right', '3px')
                    .attr('z-index', 10000);
            }

            this._rewireIds($filterbox, this);

            $elem.append($filterbox);

            $elem.data('searchControls', $filterbox);

            $elem
                .on('mouseover.kbaseSearchControls',
                    function(e) {
                        if ($sc.options.onMouseover) {
                            $filterbox.show();
                        }
                    }
                )
                .on('mouseout.kbaseSearchControls',
                    function(e) {
                        if ($sc.options.onMouseover) {
                            $filterbox.hide();
                        }
                        $sc.data('searchBox').blur();
                    }
                )
            ;
            if (this.options.onMouseover) {
                $filterbox.hide();
            };

            return this;

        },

        value : function(newVal) {
            if (arguments.length) {
                this.data('searchBox').val(newVal);
            }
            return this.data('searchBox').val();
        },

    });

} );
