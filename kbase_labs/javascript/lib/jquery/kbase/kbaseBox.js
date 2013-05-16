/*

    Easy widget to serve as a container with a title.

    var $box = $('#box').kbaseBox(
        {
            title : 'This is a box',
            canCollapse: true,  //boolean. Whether or not clicking the title bar collapses the box
            content: 'Moo. We are a box. Take us to China.',  //The content within the box. Any HTML string or jquery element
            //optional list of controls to populate buttons on the right end of the title bar. Give it an icon
            //and a callback function.
            controls : [
                {
                    icon : 'icon-search',
                    callback : function(e) {
                        console.log("clicked on search");
                    },
                    id : 'search' //optional. Keys the button to be available via $box.controls('search')
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

    alternatively, set it up or change it after the fact.

    $('#tabs').kbaseTabs('setTitle', 'New box title');
    $('#tabs').kbaseTabs('setContent', "I'm a big billy goat, so you'd better beat it, sister");
    $('#tabs').kbaseTabs('setControls', newControls);  //the tabObject defined up above

*/

(function( $, undefined ) {

    $.kbWidget("kbaseBox", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            canCollapse : true,
            controls : [],
            bannerColor : 'lightgray',
            boxColor : 'lightgray',
        },

        init: function(options) {

            this._super(options);

            this._controls = {};

            this.appendUI( $( this.$elem ) );

            return this;

        },

        setBannerColor : function(color) {
            this.data('banner').css('background-color', color);
        },

        startThinking : function() {
            this.data('banner').addClass('progress progress-striped active')
        },

        stopThinking : function() {
            this.data('banner').removeClass('progress progress-striped active')
        },

        appendUI : function ($elem) {
            var canCollapse = this.options.canCollapse;
            var $div = $('<div></div>')
                .append(
                    $('<div></div>')
                        .css('text-align', 'left')
                        .css('font-size', '70%')
                        .css('color', 'gray')
                        .append(this.options.precontent)
                )
                .append(
                    $('<div></div>')
                        .css('border', '1px solid ' + this.options.boxColor)
                        .css('padding', '2px')
                        .append(
                            $('<div></div>')
                            //.addClass('progress')
                            .attr('id', 'banner')
                            .css('width', '100%')
                            .css('height', '24px')
                            .css('margin-bottom', '0px')
                            .css('box-shadow', 'none')
                            .css('background-color', this.options.bannerColor)
                            .css('border-radius', '0px')
                            .append(
                                $('<h5></h5>')
                                    .addClass('text-left')
                                    .css('text-align', 'left')
                                    .css('text-shadow', 'none')
                                    .css('color', 'black')
                                    .css('font-size', '14px')
                                    .addClass('bar')
                                    .css('padding', '2px')
                                    .css('margin', '0px')
                                    .css('position', 'relative')
                                    .css('width', '100%')
                                    .bind('click',
                                        function(e) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (canCollapse) {
                                                $(this).parent().parent().children().last().collapse('toggle');
                                            }
                                        }
                                    )
                                    .append(
                                        $('<span></span>')
                                            .attr('id', 'title')
                                    )
                                    .append(
                                        $('<div></div>')
                                        .addClass('btn-group')
                                        .attr('id', 'control-buttons')
                                        .css('right', '0px')
                                        .css('top', '0px')
                                        .css('position', 'absolute')
                                        .append('foo, bar, baz')
                                    )
                            )
                        )
                        .append(
                            $('<div></div>')
                                .attr('id', 'content')
                        )
                )
                .append(
                    $('<div></div>')
                        .css('text-align', 'right')
                        .css('font-size', '70%')
                        .css('color', 'gray')
                        .append(this.options.postcontent)
                )

            ;

            this._rewireIds($div, this);

            this.setControls(this.options.controls);
            this.setTitle(this.options.title);
            this.setContent(this.options.content);

            $elem.append($div);

            return this;

        },

        setTitle : function (title) {
            this.data('title').empty();
            this.data('title').append(title);
        },

        setContent : function (content) {
            this.data('content').empty();
            this.data('content').append(content);
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

            var $box = this;

            $.each(
                controls,
                $.proxy(function (idx, val) {

                    var btnClass = 'btn btn-mini';
                    if (val.type) {
                        btnClass = btnClass + ' btn-' + val.type;
                    }

                    var $button =
                        $('<button></button>')
                            .attr('href', '#')
                            .css('padding-top', '1px')
                            .css('padding-bottom', '1px')
                            .attr('class', btnClass)
                            .append($('<i></i>').addClass(val.icon))
                            .bind('click',
                                function(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    val.callback.call(this, e, $box);
                                }
                            )
                    ;

                    if (val.id) {
                        this._controls[val.id] = $button;
                    }

                    this.data('control-buttons').append($button);
                },this)
            );
        },


    });

}( jQuery ) );
