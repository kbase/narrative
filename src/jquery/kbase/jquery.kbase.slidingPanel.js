/*

    KBase JQueryUI plugin to slide in a panel from the right edge of the screen containing preview content.

    Set up a container on your HTML page. It can be whatever you'd like. For example.

    <div id = 'fizzlefazzle'></div>

    You don't need to give it $that ID. I just populated it with junk because I don't want to
    encourage people to use something generic like 'login', since there's no need. You don't need
    an ID at all, just some way to select it.

    Later, in your jquery initialization, do this:

    $(function() {
        ...

        $(#"fizzlefaszzle").slidingPanel( { content : "html or jquery or a string or elements or whatever" });

    }

    And that, my friends, is Jenga. You're done. Sit back and enjoy the fruits of your labor.

    There are a couple of useful things to know about. You can open and close the panel programmatically

        $(#"fizzlefazzle").login('open');
        $(#"fizzlefazzle").login('close');

    When you're setting it up, you have a few options:

    $('#fizzlefazzle').slidingPanel(
        {
            animationDuration : integer (how long to run the animation in milliseconds. Defaults to 200ms)
            panelWidth : how wide the slid open panel should be (defaults to 200px)
            truncate : If you've got a lot of content, you probably don't want it all in the window. Truncate it automatically. (defaults to 2000 characters)
            content : REQUIRED. The HTML string/content/jquery object/etc you want to slide out in your panel.
        }
    );

*/


(function( $, undefined ) {


    $.widget("kbase.slidingPanel", $.kbase.widget, {
        version: "1.0.0",
        options: {
            animationDuration : 200,
            panelWidth : 200,
            truncate : 2000,
        },

        _init: function() {

            if (this.data('ui')) {
                this.remove();
            }

            var $ui = this._defaultStyle();
            this.data('ui', $ui);
            this.element.append($ui);
            $(this.element).data('hasSlidingPanel', 1);
            this.reposition();

            if (this.options.autoOpen) {
                this.open();
            }

        },

        remove : function() {
            this.close();
            this.data('ui')[0].remove();
            this.data('ui')[1].remove();
        },

        addContentToPanel : function ($panel, content) {

            if (content == undefined) {
                return;
            }

            $panel.css('font-size', '3px');
            $panel.css('white-space', 'pre');

            var truncated = content;

            if (this.options.truncate) {
                truncated = content.substr(content, this.options.truncate);
            }

            var $container =
                $('<div></div>')
                    .css('margin', '3px')
                    .css('overflow', 'hidden')
                    .css('border', '1px dashed gray')
                    .css('padding', '2px')
                    .width(this.options.panelWidth - 13)
                    .height($panel.height() - 13)
                    .html(truncated);

            $panel.append( $container );

            var boxContent = $('<div></div>')
                .css('white-space', 'pre')
                .css('padding', '3px')
                .html(content);

            $panel.fancybox({
                openEffect  : 'elastic',
                closeEffect : 'elastic',
                content : boxContent,
            });

            return $panel;
        },

        _defaultStyle : function() {

            var $element = $(this.element);

            var $button = $('<button></button>')
                .attr('id', 'button')
                .css('position', 'absolute');

            this._rewireIds($button, this);
            $button.button({text : false, icons : {primary : 'ui-icon-seek-prev'}});
            $button.width(19);

            $button.height($element.height());

            $button.bind('click',
                $.proxy(
                    function (evt) {
                        if (this.data('state') == 'open') {
                            this.close();
                        }
                        else {
                            this.open();
                        }
                    },
                    this
                )
            );

            var $panel = $('<div></div>')
                .attr('id', 'panel')
                .css('position', 'absolute')
                .css('overflow', 'hidden')
                .css('z-index', 100)
            ;

            this._rewireIds($panel, this);

            $panel.width(0);
            $panel.height($element.height());
            this.addContentToPanel($panel, this.options.content);

            this.data('state', 'closed');

            $(window).bind(
                'resize',
                $.proxy(
                    function(evt) {
                        this.reposition(evt);
                    },
                    this
                )
            );

            return [$button, $panel];

        },

        open : function() {

            if (this.data('state') == 'open') {
                return;
            }

            var $that = this;

            this.data('panel').animate(
                {width : this.options.panelWidth, left : '-=' + this.options.panelWidth},
                {
                    duration : this.options.animationDuration,
                    queue    : false,
                }
            );

            this.data('button').animate(
                {left : '-=' + this.options.panelWidth},
                {
                    duration : this.options.animationDuration,
                    queue    : false,
                    complete : function() {
                        $(this).button({icons : {primary : 'ui-icon-seek-next'}});
                        $that.data('state', 'open');
                    }
                }
            );
        },

        close : function() {

            if (this.data('state') == 'closed') {
                return;
            }

            var $that = this;

            this.data('panel').animate(
                {width : 0, left : '+=' + $that.options.panelWidth},
                {
                    duration : $that.options.animationDuration,
                    queue    : false,
                }
            );

            this.data('button').animate(
                {left : '+=' + $that.options.panelWidth},
                {
                    duration : $that.options.animationDuration,
                    queue    : false,
                    complete : function() {
                        $(this).button({icons : {primary : 'ui-icon-seek-prev'}});
                        $that.data('state', 'closed');
                    }
                }
            );

        },

        reposition : function(evt) {
            var $element = this.element;
            this.data('panel').position({of : $element, my : 'right', at : 'right'});
            this.data('button').position({of : this.data('panel'), my : 'right', at : 'left'});
        }

    });

}( jQuery ) );
