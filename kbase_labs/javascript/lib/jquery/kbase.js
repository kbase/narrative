/**
 * @module KBWidget
 */
(function( $, undefined) {

    var widgetRegistry = {};

    function subclass(constructor, superConstructor) {
        function surrogateConstructor() {}

        surrogateConstructor.prototype = superConstructor.prototype;

        var prototypeObject = new surrogateConstructor();
        prototypeObject.constructor = constructor;

        constructor.prototype = prototypeObject;
    }

    $.KBWidget = function (def) {
        def = (def || {});
        
        var name   = def["name"],
            parent = def["parent"];

        if (widgetRegistry[name] != undefined) {
            // TODO: Decide on override behavior
            //throw "Cannot re-register widget: " + name;
            return;
        }
        var Widget = function ($elem) {
            this.$elem = $elem;
            this.options = $.extend(true, {}, def.options);
            return this;
        }

        widgetRegistry[name] = Widget;

        if (parent) {
            var pWidget = widgetRegistry[parent];
            if (pWidget === undefined)
                throw new Error("Parent widget is not registered");
            subclass(Widget, pWidget);
        }

        var defCopy = $.extend(true, {}, def);
        for (var prop in defCopy) {
            //hella slick closure based _super method adapted from JQueryUI.
//*

            if ($.isFunction(defCopy[prop])) {

                Widget.prototype[prop] = (function (methodName, method) {
                    var _super = function() {
                        throw "No parent method defined! Play by the rules!";
                    }
                    var _superMethod = function() {
                        throw "No parent method defined! Play by the rules!";
                    }

                    if (parent) {
                        var _super = function() {
                            return widgetRegistry[parent].prototype[methodName].apply(this, arguments);
                        }

                        var _superMethod = function (superMethodName) {
                            return widgetRegistry[parent].prototype[superMethodName].apply(this, Array.prototype.slice.apply(arguments, [1]));
                        }
                    }

                    return function () {
                        var _oSuper = this._super;
                        var _oSuperMethod = this._superMethod;
                        this._super = _super;
                        this._superMethod = _superMethod;

                        var retValue = method.apply(this, arguments);

                        this._super = _oSuper;
                        this._superMethod = _oSuperMethod;

                        return retValue;
                    }
                })(prop, defCopy[prop]);

            }
            else {
                Widget.prototype[prop] = defCopy[prop];
            }
        }

        if (parent) {
            Widget.prototype.options = $.extend(true, {}, widgetRegistry[parent].prototype.options, Widget.prototype.options);
        }

        $.fn[name] = function( method, args ) {

            if (this.data(name) == undefined) {
                this.data(name, new Widget(this));
            }

            // Method calling logic
            if ( Widget.prototype[method] ) {
                return Widget.prototype[method].apply(this.data(name), Array.prototype.slice.call( arguments, 1 ));
            } else if ( typeof method === 'object' || ! method ) {
                //return this.data(name).init( arguments );
                var args = arguments;
                $w = this.data(name);
                if (! $w._init) {
                    $w = Widget.prototype.init.apply($w, arguments);
                }
                $w._init = true;
                return $w;
            } else {
                $.error( 'Method ' +  method + ' does not exist on ' + name);
            }

            return this;

        };

        Widget.prototype[name] = function () {
            return $.fn[name].apply(this.$elem, arguments);
        }

        return $.fn[name];
    }

    $.KBWidget('kbaseWidget',
        {
            options : {},

            element : function() {
                return this;
            },

            dbg : function (txt) { if (window.console) console.log(txt); },

            init : function(args) {

                var opts = $.extend(true, {}, this.options);
                this.options = $.extend(false, {}, opts, args);

                return this;
            },

            alert : function(msg) {
                if (msg == undefined ) {
                    msg = this.data('msg');
                }
                this.data('msg', msg);

                return this;
            },

            popper : function() {
                alert ("pop, pop");
            },

            data : function (key, val) {

                if (this.options._storage == undefined) {
                    this.options._storage = {};
                }

                if (arguments.length == 2) {
                    this.options._storage[key] = val;
                }

                if (key != undefined) {
                    return this.options._storage[key];
                }
                else {
                    return this.options._storage;
                }
            },

            _rewireIds : function($elem, $target) {

                if ($target == undefined) {
                    $target = $elem;
                }

                if ($elem.attr('id')) {
                    $target.data($elem.attr('id'), $elem);
                    $elem.removeAttr('id');
                }

                $.each(
                    $elem.find('[id]'),
                    function(idx) {
                        $target.data($(this).attr('id'), $(this));
                        $(this).removeAttr('id');
                        }
                );

                return $elem;
            },

            sortCaseInsensitively : function (a,b) {
                     if (a.toLowerCase() < b.toLowerCase()) { return -1 }
                else if (a.toLowerCase() > b.toLowerCase()) { return 1  }
                else                            { return 0  }
            },

            trigger : function () {
                this.$elem.trigger.apply(this.$elem, arguments);
            },

            on : function () {
                this.$elem.on.apply(this.$elem, arguments);
            },

            off : function () {
                this.$elem.off.apply(this.$elem, arguments);
            },

            emit: function (evt, data) {
                this.$elem.trigger(evt, data)
            } 

        }
    );



}( jQuery ));

/**
 * @module KBApplication
 */
(function ($, undefined) {
    $.KBWidget({
        name: "KBApplication"
    });
})(jQuery);

/*

*/

(function( $, undefined ) {


    $.KBWidget("kbaseAuthenticatedWidget", 'kbaseWidget', {
        version: "1.0.0",
        options: {

        },

        init: function(options) {

            this._super(options);

            if (options.$loginbox) {
                this.$loginbox = options.$loginbox;
            }
            else {
                throw "Cannot create authenticated widget w/o login box!";
            }

            return this;

        },

        sessionId : function() {
            return this.$loginbox.sessionId();
        },

    });

}( jQuery ) );
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

(function( $, undefined ) {


    $.KBWidget("kbaseAccordion", 'kbaseWidget', {
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
                                .addClass('accordion-group')
                                .append(
                                    $('<div></div>')
                                        .addClass('accordion-heading')
                                        .append(
                                            $('<i></i>')
                                                .css('margin-right', '3px')
                                                .css('margin-left', '1px')
                                                .addClass('icon-chevron-right')
                                                .addClass('pull-left')
                                                .css('height', '22px')
                                                .css('line-height', '22px')
                                                .css('color', 'gray')
                                        )
                                        .append(
                                            $('<a></a>')
                                                .addClass('accordion-toggle')
                                                .css('padding', '0px')
                                                .attr('href', '#')
                                                .attr('title', val.title)
                                                .css('height', '22px')
                                                .css('line-height', '22px')

                                                .append(val.title)
                                                //.text(val.title)
                                                .bind(
                                                    'click',
                                                        function(e) {
                                                            e.preventDefault();
                                                            var $opened = $(this).closest('.accordion').find('.in');
                                                            var $target = $(this).parent().next();

                                                            if ($opened != undefined) {
                                                                $opened.collapse('hide');
                                                                var $i = $opened.parent().first().find('i');
                                                                $i.removeClass('icon-chevron-down');
                                                                $i.addClass('icon-chevron-right');
                                                            }

                                                            if ($target.get(0) != $opened.get(0)) {
                                                                $target.collapse('show');
                                                                var $i = $(this).parent().find('i');
                                                                $i.removeClass('icon-chevron-right');
                                                                $i.addClass('icon-chevron-down');
                                                            }

                                                        }
                                                    )
                                            )
                                )
                                .append(
                                    $('<div></div>')
                                        .addClass('accordion-body')
                                        .append(
                                            $('<div></div>')
                                                .addClass('accordion-inner')
                                                .append(val.body)
                                            )
                                    )
                            )
                        ;
                    },
                    this
                )
            );

            this._rewireIds($block, this);

            $elem.append($block);
            $block.find('.accordion-body').collapse('hide');

        },

    });

}( jQuery ) );
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

    $.KBWidget("kbaseBox", 'kbaseWidget', {
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
/*

    Generic prompting widget. Documented via example!

    var tab = 'Some Tab Value';

    var $deleteModal = $('<div></div>').kbasePrompt(
        {
            title : 'Confirm deletion',
            body : 'Really delete <strong>' + tab + '</strong>?',
            controls : [
                'cancelButton',
                {
                    name : 'Delete',
                    type : 'primary',
                    callback : function(e, $prompt) {
                        $prompt.closePrompt();
                        if ($nav.hasClass('active')) {
                            if ($nav.next('li').length) {
                                $nav.next().find('a').trigger('click');
                            }
                            else {
                                $nav.prev('li').find('a').trigger('click');
                            }
                        }
                        $tab.remove();
                        $nav.remove();
                    }
                }
            ],
            footer : 'Some footer value here',
        }
    );

    $deleteModal.openPrompt();

    It takes 4 values - title, body, and footer are jQuery objects containing HTML elements. They will
    be placed as the title, body, and footer of the prompt, respectively. The footer is left justified.

    controls is a little more involved, it governs the buttons used from left->right. Each element is either a string,
    in which case it is a method call on the prompt object, or it's an object with a few keys:
        name : the name to present on the button. It's appended, so you can use an icon!
        type : specify a bootstrap button type (primary, info, success, warning, danger, inverse, link)
        callback: a function callback which is invoked when the button is clicked. The default is prevented.
                  arguments received are the original event object and the associated prompt object. 'this' is the button.
                  Note that the callback is expected to close the modal itself.
        id : an id to tack onto the button, which will be rewired out of existance and hang on the prompt's data().
    Default controls are cancelButton and okayButton, which do nothing other than close the prompt w/o action.

    useful additional methods would be openPrompt() and closePrompt();

*/

(function( $, undefined ) {

    $.KBWidget("kbasePrompt", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            controls : ['cancelButton', 'okayButton']
        },

        init: function(options) {

            this._super(options);

            return this;

        },

        openPrompt : function() {
            this.dialogModal().modal({'keyboard' : true});
        },
        closePrompt : function() {
            this.dialogModal().modal('hide');
        },

        cancelButton : function() {
            return {
                name: 'Cancel',
                callback : function (e, $prompt) {
                    $prompt.closePrompt();
                }
            }
        },
        okayButton : function() {
            return {
                name: 'Okay',
                type : 'primary',
                callback : function (e, $prompt) {
                    $prompt.closePrompt();
                }
            }
        },

        dialogModal : function () {

            if (this.data('dialogModal') != undefined) {
                return this.data('dialogModal');
            }

            var $dialogModal =
                $('<div></div>')
                    .attr('class', 'modal hide fade')
                    .attr('tabindex', '-1')
                    .append(
                        $('<div></div>')
                            .attr('class', 'modal-header')
                            .append(
                                $('<button></button>')
                                    .attr('type', 'button')
                                    .attr('class', 'close')
                                    .attr('data-dismiss', 'modal')
                                    .attr('aria-hidden', 'true')
                                    .append('x\n')
                            )
                            .append(
                                $('<h3></h3>')
                                    .attr('id', 'title')
                            )
                    )
                    .append(
                        $('<div></div>')
                            .attr('class', 'modal-body')
                            .attr('id', 'body')
                    )
                .append(
                    $('<div></div>')
                        .attr('class', 'modal-footer')
                        .append(
                            $('<div></div>')
                                .addClass('row-fluid')
                                .addClass('form-horizontal')
                                .append(
                                    $('<div></div>')
                                    .addClass('span6')
                                    .addClass('text-left')
                                    .attr('id', 'footer')
                                )
                                .append(
                                    $('<div></div>')
                                        .addClass('span6')
                                        .attr('id', 'controls')
                                        .css('white-space', 'nowrap')
                                )
                        )
                )
            ;

            $dialogModal.unbind('keypress');
            $dialogModal.keypress(function(e) {
                if (e.keyCode == 13) {
                    e.stopPropagation();
                    e.preventDefault();
                    $('a:last', $dialogModal).trigger("click");
                }
            });

            //$deleteModal.modal({'keyboard' : true});

            this._rewireIds($dialogModal, $dialogModal);

            if (this.options.title) {
                $dialogModal.data('title').append(this.options.title);
            }

            if (this.options.body) {
                $dialogModal.data('body').append(this.options.body);
            }

            if (this.options.footer) {
                $dialogModal.data('footer').append(this.options.footer);
            }

            var $prompt = this;

            $.each(
                this.options.controls,
                function (idx, val) {
                    if (typeof val == 'string') {
                        val = $prompt[val]();
                    }
                    var btnClass = 'btn';
                    if (val.type) {
                        btnClass = btnClass + ' btn-' + val.type;
                    }

                    var $button =
                        $('<a></a>')
                            .attr('href', '#')
                            .attr('class', btnClass)
                            .append(val.name)
                            .bind('click',
                                function(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    val.callback.call(this, e, $prompt);
                                }
                            )
                    ;

                    if (val.id) {
                        $button.attr('id', val.id);
                    }

                    $dialogModal.data('controls').append($button);
                }
            )

            this._rewireIds($dialogModal, $dialogModal);

            this.data('dialogModal', $dialogModal);

            var $firstField = undefined;
            var selection = false;

            $dialogModal.on('shown',
                $.proxy(
                    function () {
                        $.each(
                            $dialogModal.find('input[type=text],input[type=password],textarea'),
                            function (idx, val) {
                                if ($firstField == undefined) {
                                    $firstField = $(val);
                                }

                                if ($(val).is("input") && $(val).val() == undefined) {
                                    $(val).focus();
                                    selection = true;
                                    return;
                                }
                                else if ($(val).is("textarea") && $(val).text().length == 0) {
                                    $(val).focus();
                                    selection = true;
                                    return;
                                }
                            }
                        );

                        if (! selection && $firstField != undefined) {
                            $firstField.focus();
                        }
                    },
                    this
                )
            );

            /*$dialogModal.find('input[type=text],input[type=password]').last().keypress(
                $.proxy(
                    function(e) {
                        if (e.keyCode == 13) {
                            $dialogModal.find('a:last').trigger('click');
                            e.stopPropagation();
                            e.preventDefault();
                        }
                    },
                    this
                )
            );*/

            return $dialogModal;

        },

    });

}( jQuery ) );
/*

    Simplified prompt for delete confirmations.

    var $deleteModal = $('<div></div>').kbaseDeletePrompt(
        {
            name : tab,
            callback :
                function(e, $prompt) {
                    $prompt.closePrompt();
                    if ($nav.hasClass('active')) {
                        if ($nav.next('li').length) {
                            $nav.next().find('a').trigger('click');
                        }
                        else {
                            $nav.prev('li').find('a').trigger('click');
                        }
                    }
                    $tab.remove();
                    $nav.remove();
                }
            ,
        }
    );

    $deleteModal.openPrompt();

    Sure, you could just set it up through kbasePrompt. But why bother?
*/

(function( $, undefined ) {
    $.KBWidget("kbaseDeletePrompt", 'kbasePrompt', {
        version: "1.0.0",
        options: {
            controls : ['cancelButton', 'okayButton']
        },

        init: function(options) {

            this._super(options);

            return $('<div></div>').kbasePrompt(
                    {
                        title : 'Confirm deletion',
                        body : 'Really delete <strong>' + this.options.name + '</strong>?',
                        controls : [
                            'cancelButton',
                            {
                                name : 'Delete',
                                type : 'primary',
                                callback : this.options.callback
                            }
                        ],
                    }
                )

        },


    });

}( jQuery ) );
/*

    Simplified prompt for error messages.

    var $errorModal = $('<div></div>').kbaseErrorPrompt(
        {
            title : 'OH NOES!',
            message: 'Your action failed',
        }
    );

    $errorModal.openPrompt();

    Sure, you could just set it up through kbasePrompt. But why bother?

*/

(function( $, undefined ) {


    $.KBWidget("kbaseErrorPrompt", 'kbasePrompt', {
        version: "1.0.0",
        options: {
            controls : ['cancelButton', 'okayButton']
        },

        init: function(options) {

            this._super(options);

            return $('<div></div>').kbasePrompt(
                {
                    title : options.title,
                    body : $('<div></div>')
                        .attr('class', 'alert alert-error')
                        .append(
                            $('<div></div>')
                                .append(
                                    $('<div></div>')
                                        .addClass('pull-left')
                                        .append(
                                            $('<i></i>')
                                                .addClass('icon-warning-sign')
                                                .attr('style', 'float: left; margin-right: .3em;')
                                        )
                                )
                                .append(
                                    $('<div></div>')
                                        .append(
                                            $('<strong></strong>').append(options.message)
                                        )
                                )
                        )
                    ,
                    controls : ['okayButton'],
                }
            );

        },


    });

}( jQuery ) );
/*
    This widget is magical.

    It builds a prettily formatted form for you using a JSON structure, then at
    the end lets you extract out the info. Huzzah! Hopefully I will document it
    accurately and without typos.

    Upon init, takes at least one and possibly two arguments - elements and values
    (plus a few defaults that can be set as well. Just look at the options block below).

    $('#container').kbaseFormBuilder(
        {
            elements : some_array_of_elems
            values   : some_array_of_values
        }
    );

    And you're done! It'll build you your fancy form and stuff it into place for you. Note that this form CANNOT be submitted, you're
    assumed to want to extract out the data yourself. Do that with getFormValues:

    var values = $('#container').kbaseFormBuilder('getFormValues');

    That'll return a javascript structure to you (suitable to use as JSON!) to do with as you wish. Alternatively, use getFormValuesAsString:

    var string = $('#container').kbaseFormBuilder('getFormValuesAsString');

    That just stringifies the JSON for you, plus doing a little automatic escaping of strings. That may be useful for you if you were just
    gonna toss the JSON into a string anyway.

    Now for the meet of it - what those values in 'elements' need to be. Each one is an object with numerous well defined keys:

        name : the name of the form element
        key: the key to this value in the resulting JSON structure.
            NOTE - this is NOT an object key. The resulting structure is an array of arrays. The "key" here is just the first
            element of the array.
        description: a tooltip to popup when the element is moused-over.
        label : the text of the label to go to its left
        fieldset: the fieldset to place this element into. Not required.
        split: a string or array containing delimiter(s) to split the resulting value on.
            Example - split is undef. The user types in '1,2,3' the resulting JSON is key => '1,2,3'
            Example - split is ','. The user types in '1,2,3' the resulting JSON is key => [1,2,3]
            Example - split is [':',',']. The user types in 'a,b;1,2;X,Y' the resulting JSON is key => [[a,b],[1,2],[X,Y]]
        json: true/false flag - whether the input value is assumed to contain JSON text. Will parse it out if it does.
        size: the size of the element. uses defaultSize if not given.
        valOnly: true/false flag - if true, will not include the key in the text provided to getFormValuesAsString. Useful for bools!
        type : the type of element. You can have:
            text
            textarea
            password
            checkbox
            select
            multiselect
            radio

            string  (which is a text field)
            secure  (which is a password field)
            enum    (which is a select box)
            boolean (which is a checkbox)

            They all correspond to the same HTML form element
        value: the value of the input element. NOTE - only applicable to elements with a single value
        values: the possible values of a element which could have multiple values.
                NOTE - this is the machine readable value (<option = 'VALUE HERE'></option>) value. Not necessarily what is displayed.
        names: the possible names of an element which could have multiple values.
                NOTE - this is the HUMAN readable name (<option = 'foo'>NAME HERE</option>), not necessarily what is handed out at the end
        selected: If an element can have multiple values, the ones selected. This may be an array for multiples, or a single string.
        multi : true/false if it's a multi-select box
        rows : how many rows to display in a select box. Defaults to defaultRowSize.

        Quick example:

        var $form = $('#foobar').kbaseFormBuilder(
            {
                elements :
                    [
                         {
                            name : 'foo',
                            label : 'This is my first element. Make it purty.',
                            type : 'text',
                            value : 'fill me in, bro',
                            key : '-a',
                            description: "This is routine usage information. How does it work? Why is it here? Why should we use it?",
                        }
                    ],
                values :
                    [
                        'FOOVALUE'
                    ]
            }
        );

        var vals = $form.getFormValues();
        console.log(vals);


    Remember - comments can be terribly misleading. Debug only code. If something doesn't look/sound/work right based upon the docs here,
    it's entirely possible that I just messed up the description. Poke the code as well and see if the usage info is merely wrong, then
    poke Jim and yell at him for something that's missing. :-)

*/

(function( $, undefined ) {


    $.KBWidget("kbaseFormBuilder", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            elements : [],
            defaultSize : 50,
            defaultRowSize : 5,
            defaultMultiSelectSize : 5,

            //don't mess with the dispatch.
            dispatch : {
                text : 'buildTextField',
                textarea : 'buildTextArea',
                password : 'buildSecureTextField',
                checkbox : 'buildCheckbox',
                select : 'buildSelectbox',
                multiselect : 'buildSelectbox',
                radio : 'buildRadioButton',

                string : 'buildTextField',
                secure : 'buildSecureTextField',
                enum   : 'buildSelectbox',
                boolean: 'buildCheckbox',
            },

        },

        init: function(options) {
            this._super(options);
            this.$elem.append(this._buildForm(this.options.elements));
            return this;
        },

        getFormValues : function() {
            var ret = [];

            var formValues = this.data('formValues');
            var form = this.data('form').get(0);

            for (key in formValues) {
                var val = formValues[key];
                var field = val.name;
                var type = val.type;

                var fields = [];

                if (form[field] == '[object NodeList]') {
                    for (var i = 0; i < form[field].length; i++) {
                        fields.push(form[field][i]);
                    }
                }
                else {
                    fields = [ form[field] ];
                }

                if (type == 'checkbox') {
                    if (form[field].checked) {
                        ret.push([key]);
                    }
                }
                else if (type == 'multiselect') {
                    var selectedValues = [key];
                    var fieldValues = selectedValues;

                    if (val.asArray) {
                        fieldValues = [];
                        selectedValues.push(fieldValues);
                    }

                    var hasSelection = 0;
                    for (var i = 0; i < form[field].length; i++) {
                        if (form[field][i].selected) {
                            hasSelection = 1;
                            fieldValues.push(form[field][i].value);
                        }
                    }
                    if (hasSelection) {
                        ret.push(selectedValues);
                    }
                }
                else if (type == 'radio') {
                    var selectedValues = [key];
                    var hasSelection = 0;
                    for (var i = 0; i < form[field].length; i++) {
                        if (form[field][i].checked) {
                            hasSelection = 1;
                            selectedValues.push(form[field][i].value);
                        }
                    }
                    if (hasSelection) {
                        ret.push(selectedValues);
                    }
                }
                else {

                    var res = [];
                    for (var i = 0; i < fields.length; i++) {

                        if (val.json) {
                            var json = JSON.parse(fields[i].value);
                            if (val.asArray) {
                                json = [ json ];
                            }
                            res.push(json);
                        }
                        else {
                            res.push( this.carve(fields[i].value, val.split, val.asArray) );
                        }
                    }

                    if (res.length > 0) {

                        if (res.length == 1) {
                            res = res[0];
                            if (res.length == 0) {
                                continue;
                            }
                        }

                        ret.push([key, res]); //this.carve(form[field].value, val.split)]);
                    }
                }

            }

            if (this.options.returnArrayStructure != undefined) {
                var newRet = [];
                var keyed = {};
                for (var i = 0; i < ret.length; i++) {
                    keyed[ret[i][0]] = ret[i][1];
                }

                for (var i = 0; i < this.options.returnArrayStructure.length; i++) {
                    newRet.push(keyed[this.options.returnArrayStructure[i]]);
                }

                ret = newRet;
            }


            return ret;
        },

        carve : function (strings, delimiters, asArray) {

            delimiters = delimiters == undefined
                //nothing passed, make it an empty array
                ? []
                //otherwise, is it a string?
                : typeof delimiters == 'string'
                    //put it into an array if we have delimiters
                    ? [ delimiters ]
                    //failing all that, assume it's an array and make a copy of it
                    : delimiters.slice(0);

            var delim = delimiters.shift();

            if (delim == undefined) {
                if (asArray && typeof strings == 'string') {
                    strings = [strings];
                }
                return strings;
            }

            var delimRegex = new RegExp(' *' + delim + ' *');

            if (typeof strings == 'string') {
                return this.carve(strings.split(delimRegex), delimiters, asArray);
            }
            else {
                delimiters.push(delim);
                jQuery.each(
                    strings,
                    $.proxy(
                        function (idx, str) {
                            strings[idx] = this.carve(str, delimiters, asArray);
                        },
                        this
                    )
                )
            }

            return strings;

        },

        escapeValue : function(val) {
            val = val.replace(/"/g, '\\"');
            return '"' + val + '"';
        },

        getFormValuesAsString : function() {
            var extractedFormValues = this.getFormValues();

            if (this.options.returnArrayStructure != undefined) {
                return JSON.stringify(extractedFormValues);
            }

            var returnValue = [];


            for (var i = 0; i < extractedFormValues.length; i++) {

                var field = extractedFormValues[i];

                if (field.length == 1) {
                    returnValue.push(field[0]);
                }
                else {
                    for (var j = 1; j < field.length; j++) {
                        if (this.data('formValues')[field[0]].valOnly) {
                            returnValue.push( field[j] );
                        }
                        else {
                            if (typeof field[j] == 'string') {
                                returnValue.push(field[0] + ' ' + this.escapeValue(field[j]));
                            }
                            else {
                                returnValue.push(field[0] + ' ' + this.escapeValue(JSON.stringify(field[j])));
                            }
                        }
                    }
                }
            }

            return returnValue.join(' ');
        },

        _buildForm : function(data) {

            var $form = $('<form></form>')
                .addClass('form-horizontal')
                .bind('submit', function (evt) {return false});

            this.data('form', $form);
            var formValues = this.data('formValues', {});

            var $lastFieldset = undefined;

            var passedValues = {};

            if (this.options.values != undefined) {
                $.each(
                    this.options.values,
                    function (idx, val) {
                        passedValues[val[0]] = val[1] || 1; //set to true for checkboxes, etc.
                    }
                );
            }

            $.each(
                data,
                $.proxy(
                    function(idx, value) {

                        if (formValues[value.key] != undefined) {
                            var errorMsg = "FORM ERROR. KEY " + value.key + ' IS DOUBLE DEFINED';
                            $form = errorMsg;
                            return false;
                        }
                        formValues[value.key] = value;

                        if (value.fieldset) {
                            if ($lastFieldset == undefined || $lastFieldset.attr('name') != value.fieldset) {
                                $lastFieldset = $('<fieldset></fieldset>')
                                    .attr('name', value.fieldset)
                                    .append(
                                        $("<legend></legend>")
                                            .append(value.fieldset)
                                    )
                                ;


                                $form.append($lastFieldset);
                            }
                        }
                        else {
                            $lastFieldset = $form;
                        }

                        var labelText = value.label != undefined
                            ? value.label
                            : value.name;

                        var $label = $('<label></label>')
                            .addClass('control-label')
                            .css('margin-right', '10px')
                            .append(
                                $('<span></span>')
                                    .attr('title', value.label || value.name)
                                    .append(labelText)
                                    .attr('title', value.description)
                            )
                            //a smarter set of CSS would allow me to embed the inputbox INSIDE the label element so that the browser
                            //could just pick up the targetting for me. But this is bootstrap and if I did that it'd break the layout
                            //so I have to do it myself. Thanks, bootstrap!
                            .bind('click', function(e) {
                                $(this).next().children().first().focus();
                            })
                        ;

                        var $span = $label.find('span');
                        if (value.description) {
                            $span.tooltip();
                        }

                        if (passedValues[value.key] != undefined) {
                            value.value = value.checked = value.selected = passedValues[value.key];
                        }

                        var $field;

                        if (this.options.dispatch[value.type]) {
                            $field = this[this.options.dispatch[value.type]](value);
                        }
                        else if (value.type == undefined) {
                            var errorMsg = "FORM ERROR. KEY " + value.key + ' HAS NO TYPE';
                            $form = errorMsg;
                            return false;
                        }
                        else {
                            $field = this.buildTextField(value);
                        }

                        var $container = $('<span></span>');
                        $container.css('display', 'inline-block');

                        $container.append($field);

                        var $button = $('<button></button>')
                                        .addClass('btn')
                                        .attr('title', 'Add more')
                                        .append($('<i></i>').addClass('icon-plus'))
                                        .bind(
                                            'click',
                                            function (evt) {
                                                //alert("Add more!");
                                                $container.append($('<br/>'));
                                                $container.append($field.clone());
                                                evt.stopPropagation();
                                            }
                                        );

                        if (value.multi) {
                            $container.append($button);
                        }

                        $form.append(
                            $('<div></div>')
                                .addClass('control-group')
                                .append($label)
                                .append($container)
                        );

                    },
                    this
                )
            );

            return $form;

        },

        buildTextField : function(data) {
            return $('<input/>')
                    .attr('type', 'text')
                    .attr('size', data.size || this.options.defaultSize)
                    .attr('value', data.value)
                    .attr('name', data.name)
            ;
        },

        buildTextArea : function(data) {
            return $('<textarea></textarea>')
                    .attr('cols', data.size || this.options.defaultSize)
                    .attr('rows', data.rows || this.options.defaultRowSize)
                    .attr('name', data.name)
                    .append(data.value)
            ;
        },

        buildSecureTextField : function(data) {
            return $('<input/>')
                    .attr('type', 'password')
                    .attr('size', data.size || this.options.defaultSize)
                    .attr('value', data.value)
                    .attr('name', data.name)
            ;
        },

        buildCheckbox : function(data) {

            var $checkbox =  $('<input/>')
                    .attr('type', 'checkbox')
                    .attr('name', data.name)
                    .attr('value', data.value);
            ;

            if (data.checked) {
                $checkbox.attr('checked', 'checked');
            }

            return $checkbox;

        },

        buildRadioButton : function(data) {

            var $radioSpan = $('<span></span>')
                .css('display', 'inline-block')
            ;

            $.each(
                data.values,
                $.proxy(
                    function (idx, val) {

                        var $radio = $('<input/>')
                            .attr('type', 'radio')
                            .attr('name',  data.name)
                            .attr('value', val);

                        if (data.checked == val) {
                            $radio.attr('checked', 'checked');
                        }

                        var $l = $('<label></label')
                            .append($radio)
                            .append(data.names[idx] || data.values[idx])
                            .css('clear', 'both')
                            .css('float', 'left')
                        ;


                        $radioSpan.append($l);

                    },
                    this
                )
            );

            return $radioSpan;

        },

        buildSelectbox : function(data) {
            var $selectbox =  $('<select></select>')
                    .attr('name', data.name)
            ;

            if (data.type == 'multiselect') {
                $selectbox
                    .attr('multiple', 'multiple')
                    .attr('size', data.size || this.options.defaultMultiSelectSize);
            }

            if (data.names == undefined) {
                data.names = [];
            }

            $.each(
                data.values,
                function(idx, value) {
                    var name = data.names[idx] || data.values[idx];
                    var $option = $('<option></option>')
                        .attr('value', value)
                        .append(name);

                    if (typeof data.selected == 'string' && data.selected == value) {
                        $option.attr('selected', 'selected');
                    }
                    else if (typeof data.selected == 'object') {
                        $.each(
                            data.selected,
                            function (idx, selectedValue) {
                                if (selectedValue == value) {
                                    $option.attr('selected', 'selected');
                                }
                            }
                        );
                    }

                    $selectbox.append($option);
                }
            );

            return $selectbox;

        },

    });

}( jQuery ) );
/*

    KBase Bootstrap plugin to handle all login/session related stuff.

    Set up a container on your HTML page. It can be whatever you'd like. For example.

    <div id = 'fizzlefazzle'></div>

    You don't need to give it that ID. I just populated it with junk because I don't want to
    encourage people to use something generic like 'login', since there's no need. You don't need
    an ID at all, just some way to select it.

    Later, in your jquery initialization, do this:

    $(function() {
        ...

        $(#"fizzlefaszzle").login();

    }

    And that, my friends, is Jenga. You're done. Sit back and enjoy the fruits of your labor.

    There are a couple of useful things to know about. You can extract the user_id and kbase_sessionid:

        $(#"fizzlefazzle").login('session', 'user_id');
        $(#"fizzlefazzle").login('session', 'kbase_sessionid');

    When you're setting it up, you have a few options:

    $('#fizzlefazzle').login(
        {
            style : (button|slim|micro|hidden) // try 'em all out! button is the default.
            loginURL : the URL we're logging into
            login_callback : a function to be called upon login, success or failure. Gets an args hash  (user_id, kbase_sessionid)
            logout_callback : a function to be called upon logout, gets no args
            prior_login_callback : a function to be called upon loading a page, if the user was already logged in. Gets an args hash (user_id, kbase_sessionid)
            user_id : a string with which to pre-populate the user_id on the forms.
        }
    );

    You can also completely inline it.

    	var $login_doodad = $('<span></span>').login({style : 'hidden'});
    	$login_doodad.login('login', 'username', 'password', function (args) {
    		console.log("Tried to log in and got back: "); console.log(args);
    	});

*/

(function( $, undefined ) {

    $.KBWidget("kbaseLogin", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            style : 'button',
            //loginURL : "http://140.221.92.231/services/authorization/Sessions/Login",
            loginURL : "http://kbase.us/services/authorization/Sessions/Login",
            possibleFields : ['verified','name','opt_in','kbase_sessionid','token','groups','user_id','email','system_admin'],
            fields : ['name', 'kbase_sessionid', 'user_id', 'token'],
        },

        get_kbase_cookie : function (field) {

            var chips = {};

            var cookieString = $.cookie('kbase_session');

            if (cookieString == undefined) {
                return chips;
            }

            var pairs = cookieString.split('\|');

            for (var i = 0; i < pairs.length; i++) {
                var set = pairs[i].split('=');
                set[1] = set[1].replace(/PIPESIGN/g, '|');
                set[1] = set[1].replace(/EQUALSSIGN/g, '=');
                chips[set[0]] = set[1];
            }

            chips.success = 1;

            return field == undefined
                ? chips
                : chips[field];
        },

        sessionId : function () {
            return this.get_kbase_cookie('kbase_session_id');
        },

        token : function () {
            return this.get_kbase_cookie('token');
        },

        init: function(options) {

            this._super(options);

            var kbaseCookie = this.get_kbase_cookie();

            this.$elem.empty();

            var style = '_' + this.options.style + 'Style';

            this.ui = this[style]();
            if (this.ui) {
                this.$elem.append(this.ui);
            }

            if (kbaseCookie.user_id) {

                if (this.registerLogin) {
                    this.registerLogin(kbaseCookie);
                }
                if (this.options.prior_login_callback) {
                    this.options.prior_login_callback.call(this, kbaseCookie);
                }

                this.data('_session', kbaseCookie);

            }

            return this;

        },

        registerLoginFunc  : function() { return this.registerLogin },
        specificLogoutFunc : function() { return this.specificLogout },

        populateLoginInfo : function (args) {
            if (args.success) {
                this.data('_session', args);
                this._error = undefined;
            }
            else {
                this.data('_session', {});
                this._error = args.message;
            }
        },

        session : function(key, value) {

            if (this.data('_session') == undefined) {
                this.data('_session', {});
            }

            var session = this.data('_session');

            if (arguments.length == 2) {
                session[key] = value;
            }

            if (arguments.length > 0) {
                return session[key];
            }
            else {
                return session;
            }
        },

        error : function(new_error) {
            if (new_error) {
                this._error = new_error;
            }

            return this._error;
        },

        openDialog : function() {

        	if (this.data('loginDialog')) {

                var $ld = this.data('loginDialog');

                $('form', $ld.dialogModal()).get(0).reset();


                $ld.dialogModal().data("user_id").val( this.session('user_id') || this.data('passed_user_id') || this.options.user_id );

                delete this.options.user_id;
                this.session('user_id',undefined);

                $ld.dialogModal().trigger('clearMessages');

        		this.data('loginDialog').openPrompt();
        	}
        },

        _textStyle : function() {
            this._createLoginDialog();

            var $prompt = $('<span></span>')
                .append(
                    $('<a></a>')
                        .attr('id', 'loginlink')
                        .attr('href', '#')
                        .text('Sign In')
                        .bind('click',
                            $.proxy( function(e) {
                                this.openDialog();
                            }, this)
                        )
                )
                .append(
                    $('<div></div>')
                        .attr('id', 'userdisplay')
                        .css('display', 'none')
                        .append(
                            $('<div></div>')
                                .addClass('pull-left')
                                .css('margin-top', '2px')
                                .append("Signed in as ")
                                .append($('<span></span>').attr('id', 'loggedinuser_id').css('font-weight', 'bold'))
                                .append('&nbsp;')
                        )
                        .append(
                            $('<button></button>')
                                .attr('id', 'logoutlink')
                                .attr('href', '#')
                                .addClass('btn btn-mini')
                                .css('margin-bottom', '5px')
                                .css('padding-left', '3px')
                                .css('padding-right', '3px')
                                .attr('title', 'Logout')
                                .tooltip({'placement' : 'bottom'})
                                .bind('click',
                                    $.proxy( function(e) {
                                        this.logout();
                                    }, this)
                                )
                                .append($('<i></i>').addClass('icon-signout'))
                        )
                )
            ;

            this._rewireIds($prompt, this);

            this.registerLogin =
                function(args) {

                    if ( args.success ) {
                        this.data("loginlink").hide();
                        this.data('loggedinuser_id').text(args.name);
                        this.data("userdisplay").show();
                        this.data('loginDialog').closePrompt();
                    }
                    else {
                        this.data('loginDialog').dialogModal().trigger('error', args.message);
                    }
                };

            this.specificLogout = function(args) {
                this.data("userdisplay").hide();
                this.data("loginlink").show();
            };

            return $prompt;

        },

        _hiddenStyle : function() {

			this._createLoginDialog();

			this.registerLogin =
				function(args) {
					if (args.success) {
						this.data('loginDialog').closePrompt();
					}
					else {
                        this.data('loginDialog').dialogModal().trigger('error', args.message);
                    }
				};

            return undefined;
        },

        _slimStyle : function() {

        	this.data('loginDialog', undefined);

            var $prompt = $('<span></span>')
                .addClass('form-inline')
                .append(
                    $('<span></span>')
                        .attr('id', 'entrance')
                            .append(
                                $('<span></span>')
                                    .addClass('input-prepend input-append')
                                    .append(
                                        $('<span></span>')
                                            .addClass('add-on')
                                            .append('username: ')
                                            .bind('click',
                                                function(e) {
                                                    $(this).next().focus();
                                                }
                                            )
                                    )
                                    .append(
                                        $('<input/>')
                                            .attr('type', 'text')
                                            .attr('name', 'user_id')
                                            .attr('id', 'user_id')
                                            .attr('size', '20')
                                            .val(this.options.user_id)
                                    )
                                    .append(
                                        $('<span></span>')
                                            .addClass('add-on')
                                            .append(' password: ')
                                            .bind('click',
                                                function(e) {
                                                    $(this).next().focus();
                                                }
                                            )
                                    )
                                    .append(
                                        $('<input/>')
                                            .attr('type', 'password')
                                            .attr('name', 'password')
                                            .attr('id', 'password')
                                            .attr('size', '20')
                                    )
                                //.append('&nbsp;')
                                .append(
                                    $('<button></button>')
                                        .attr('id', 'loginbutton')
                                        .addClass('btn btn-primary')
                                        .append(
                                            $('<i></i>')
                                                .attr('id', 'loginicon')
                                                .addClass('icon-lock')
                                        )
                                )
                            )
                )
                .append(
                    $('<span></span>')
                        .attr('id', 'userdisplay')
                        .attr('style', 'display : none;')
                        .addClass('input-prepend')
                        .append(
                            $('<span></span>')
                                .addClass('add-on')
                                //.attr('style', 'text-align : center')
                                .append('Logged in as ')
                                .append(
                                    $('<span></span>')
                                        .attr('id', 'loggedinuser_id')
                                        .attr('style', 'font-weight : bold')
                                        .append('user_id\n')
                                )
                            )
                        .append(
                            $('<button></button>')
                                .addClass('btn')
                                .attr('id', 'logoutbutton')
                                .append(
                                    $('<i></i>')
                                        .attr('id', 'logouticon')
                                        .addClass('icon-signout')
                                )
                        )
                );


            this._rewireIds($prompt, this);

            this.data('password').keypress(
                $.proxy(
                    function(e) {
                        if (e.keyCode == 13.) {
                            this.data('loginbutton').trigger("click");
                            e.stopPropagation();
                        }
                    },
                    this
                )
            );

            this.registerLogin =
                function(args) {

                    this.data('loginicon').removeClass().addClass('icon-lock');

                    if ( args.success ) {
                        this.data("entrance").hide();
                        this.data('user_id').val('');
                        this.data('password').val('');
                        this.data("loggedinuser_id").text(args.name);
                        this.data("userdisplay").show();
                    }
                    else {

                        var $errorModal = $('<div></div>').kbasePrompt(
                            {
                                title : 'Login failed',
                                body : $('<div></div>')
                                    .attr('class', 'alert alert-error')
                                    .append(
                                        $('<div></div>')
                                            .append(
                                                $('<div></div>')
                                                    .addClass('pull-left')
                                                    .append(
                                                        $('<i></i>')
                                                            .addClass('icon-warning-sign')
                                                            .attr('style', 'float: left; margin-right: .3em;')
                                                    )
                                            )
                                            .append(
                                                $('<div></div>')
                                                    .append(
                                                        $('<strong></strong>').append(args.message)
                                                    )
                                            )
                                    )
                                ,
                                controls : ['okayButton'],
                            }
                        );
                        $errorModal.openPrompt();

                    }
                };

            this.specificLogout = function(args) {
                this.data("userdisplay").hide();
                this.data("entrance").show();
            };

            this.data('loginbutton').bind(
                'click',
                $.proxy(
                    function(evt) {

                        this.data('loginicon').removeClass().addClass('icon-refresh');

                        this.login(

                            this.data('user_id').val(),
                            this.data('password').val(),
                            function(args) {

                                this.registerLogin(args);

                                if (this.options.login_callback) {
                                    this.options.login_callback.call(this, args);
                                }
                            }
                        );

                    },
                    this
                )
            );

            this.data('logoutbutton').bind('click',
                $.proxy(
                    function(e) {
                        this.logout();
                        this.data('user_id').focus();
                    },
                    this
                )
            );

            return $prompt;

        },

        _microStyle : function() {
            var $prompt = $('<span></span>')
                .append(
                    $('<button></button>')
                        .addClass('btn btn-primary')
                        .attr('id', 'loginbutton')
                        .append(
                            $('<i></i>')
                                .attr('id', 'loginicon')
                                .addClass('icon-lock')
                        )
                );

            this._rewireIds($prompt, this);

            this._createLoginDialog();

            this.data('loginbutton').bind(
                'click',
                $.proxy(
                    function(evt) {
                        this.openDialog();
                    },
                    this
                )
            );

            this.registerLogin =
                function(args) {

                    if ( args.success ) {

                        this.data('loginDialog').dialogModal().trigger('clearMessages');
                        this.data('loginDialog').closePrompt();

                        this.data('loginbutton').tooltip(
                            {
                                title : 'Logged in as ' + args.name
                            }
                        );

                        this.data('loginicon').removeClass().addClass('icon-user');

                        this.data('loginbutton').bind(
                            'click',
                            $.proxy(
                                function(evt) {
                                    this.logout();
                                },
                                this
                            )
                        );
                    }
                    else {
                        this.data('loginDialog').dialogModal().trigger('error', args.message);
                    }
                };

            this.specificLogout =
                function() {
                    this.data('loginbutton').tooltip('destroy');
                    this.data('loginicon').removeClass().addClass('icon-lock');
                };

            return $prompt;

        },

        _buttonStyle : function () {
            var $prompt = $('<div></div>')
                .attr('style', 'width : 250px; border : 1px solid gray')
                .append(
                    $('<h4></h4>')
                        .attr('style', 'padding : 5px; margin-top : 0px; background-color : lightgray ')
                        .addClass('text-center')
                        .append('User\n')
                )
                .append(
                    $('<div></div>')
                        .attr('id', 'entrance')
                        .append(
                            $('<p></p>')
                                .attr('style', 'text-align : center')
                                .append(
                                    $('<button></button>')
                                        .attr('id', 'loginbutton')
                                        .append('Login')
                                        .addClass('btn btn-primary')
                                )
                        )
                )
                .append(
                    $('<div></div>')
                        .attr('id', 'userdisplay')
                        .attr('style', 'display : none;')
                        .append(
                            $('<p></p>')
                                .attr('style', 'text-align : center')
                                .append('Logged in as ')
                                .append(
                                    $('<span></span>')
                                        .attr('id', 'loggedinuser_id')
                                        .attr('style', 'font-weight : bold')
                                        .append('user_id\n')
                                )
                                .append(
                                    $('<button></button>')
                                        .attr('id', 'logoutbutton')
                                        .append('Logout\n')
                                        .addClass('btn')
                                )
                        )
                );

            this._rewireIds($prompt, this);

            this._createLoginDialog();

            this.data('loginbutton').bind('click',
                $.proxy(
                    function(event) {
                        this.openDialog();
                    },
                    this
                )
            );

            this.data('logoutbutton').bind('click', $.proxy(this.logout, this));

            this.registerLogin =
                function(args) {

                    if ( args.success ) {
                        this.data('loginDialog').dialogModal().trigger('clearMessages');
                        this.data("entrance").hide();
                        this.data("loggedinuser_id").text(args.name);
                        this.data("userdisplay").show();
                        this.data('loginDialog').closePrompt();
                    }
                    else {
                        this.data('loginDialog').dialogModal().trigger('error', args.message);
                    }
                };

            this.specificLogout = function(args) {
                this.data("userdisplay").hide();
                this.data("entrance").show();
            };

            return $prompt;
        },

        _createLoginDialog : function () {

            var $elem = this.$elem;

            var $ld = $('<div></div').kbasePrompt(
                {
                    title : 'Login to KBase',
                    controls : [
                        'cancelButton',
                        {
                            name     : 'Login',
                            type     : 'primary',
                            id       : 'loginbutton',
                            callback : $.proxy( function(e) {
                                var user_id  = this.data('loginDialog').dialogModal().data('user_id').val();
                                var password = this.data('loginDialog').dialogModal().data('password').val();

                                this.data('loginDialog').dialogModal().trigger('message', user_id);

                                this.login(user_id, password, function(args) {

                                    if (this.registerLogin) {
                                        this.registerLogin(args);
                                    }

                                    if (this.options.login_callback) {
                                        this.options.login_callback.call(this, args);
                                    }
                                });

                            },this)
                        }
                    ],
                    body  :
                        $('<p></p>')
                            .append(
                                $('<form></form>')
                                    .attr('name', 'form')
                                    .attr('id', 'form')
                                    .addClass('form-horizontal')
                                    .append(
                                        $('<fieldset></fieldset>')
                                            .append(
                                                $('<div></div>')
                                                    .attr('class', 'alert alert-error')
                                                    .attr('id', 'error')
                                                    .attr('style', 'display : none')
                                                    .append(
                                                        $('<div></div>')
                                                            .append(
                                                                $('<div></div>')
                                                                    .addClass('pull-left')
                                                                    .append(
                                                                        $('<i></i>')
                                                                            .addClass('icon-warning-sign')
                                                                            .attr('style', 'float: left; margin-right: .3em;')
                                                                    )
                                                            )
                                                            .append(
                                                                $('<div></div>')
                                                                    .append(
                                                                        $('<strong></strong>')
                                                                            .append('Error:\n')
                                                                    )
                                                                    .append(
                                                                        $('<span></span>')
                                                                            .attr('id', 'errormsg')
                                                                    )
                                                            )
                                                    )
                                            )
                                            .append(
                                                $('<div></div>')
                                                    .attr('class', 'alert alert-success')
                                                    .attr('id', 'pending')
                                                    .attr('style', 'display : none')
                                                    .append(
                                                        $('<div></div>')
                                                            .append(
                                                                $('<div></div>')
                                                                    .addClass('pull-left')
                                                                    .append(
                                                                        $('<i></i>')
                                                                            .addClass('icon-info-sign')
                                                                            .attr('style', 'float: left; margin-right: .3em;')
                                                                    )
                                                            )
                                                            .append(
                                                                $('<div></div>')
                                                                    .append(
                                                                        $('<strong></strong>')
                                                                            .append('Logging in as:\n')
                                                                    )
                                                                    .append(
                                                                        $('<span></span>')
                                                                            .attr('id', 'pendinguser')
                                                                    )
                                                            )
                                                    )
                                            )
                                            .append(
                                                $('<div></div>')
                                                    .attr('class', 'control-group')
                                                    .append(
                                                        $('<label></label>')
                                                            .addClass('control-label')
                                                            .attr('for', 'user_id')
                                                            .css('margin-right', '10px')
                                                            .append('Username:\n')
                                                    )
                                                    .append(
                                                        $('<input/>')
                                                            .attr('type', 'text')
                                                            .attr('name', 'user_id')
                                                            .attr('id', 'user_id')
                                                            .attr('size', '20')
                                                    )
                                            )
                                            .append(
                                                $('<div></div>')
                                                    .attr('class', 'control-group')
                                                    .append(
                                                        $('<label></label>')
                                                            .addClass('control-label')
                                                            .attr('for', 'password')
                                                            .css('margin-right', '10px')
                                                            .append('Password:\n')
                                                    )
                                                    .append(
                                                        $('<input/>')
                                                            .attr('type', 'password')
                                                            .attr('name', 'password')
                                                            .attr('id', 'password')
                                                            .attr('size', '20')
                                                    )
                                            )
                                    )
                            )
                    ,   //body
                    footer : $('<span></span')
                        .append(
                            $('<a></a>')
                                .attr('href', 'https://gologin.kbase.us/ResetPassword')
                                .attr('target', '_blank')
                                .text('Forgot password?')
                        )
                        .append('&nbsp;|&nbsp;')
                        .append(
                            $('<a></a>')
                                .attr('href', ' https://gologin.kbase.us/OAuth?response_type=code&step=SignUp&redirect_uri=' + encodeURIComponent(location.href))
                                .attr('target', '_blank')
                                .text('Sign up')
                        )
                    ,
                }
            );

            this._rewireIds($ld.dialogModal(), $ld.dialogModal());

            this.data('loginDialog', $ld);

            $ld.dialogModal().bind('error',
                function(event, msg) {
                    $(this).trigger('clearMessages');
                    $(this).data("error").show();
                    $(this).data("errormsg").html(msg);
                }
            );

            $ld.dialogModal().bind('message',
                function(event, msg) {
                    $(this).trigger('clearMessages');
                    $(this).data("pending").show();
                    $(this).data("pendinguser").html(msg);
                }
            );

            $ld.dialogModal().bind('clearMessages',
                function(event) {
                    $(this).data("error").hide();
                    $(this).data("pending").hide();
                }
            );

            return $ld;

        },

        login : function (user_id, password, callback) {

            var args = { user_id : user_id, status : 1 };

            // here's a couple of simple cases that need to be handled somewhere. Figured I'd just toss 'em into this function
            // to keep 'em all in one place.
            if (user_id.length == 0) {
                args.message = 'Cannot login w/o user_id';
                args.status = 0;
                callback.call(this, args);
            } else if (password == undefined || password.length == 0) {
                args.message = 'Cannot login w/o password';
                args.status = 0;
                if (callback != undefined) {
                    callback.call(this, args);
                }
            }
            else {
                args.password = password;
                args.cookie = 1;
                args.fields = this.options.fields.join(',');

                $.support.cors = true;
                $.ajax(
                    {
                        type            : "POST",
                        url             : this.options.loginURL,
                        data            : args,
                        dataType        : "json",
                        crossDomain     : true,
                        xhrFields       : { withCredentials: true },
                        success         : $.proxy(
                            function (data,res,jqXHR) {

                                if (data.kbase_sessionid) {

									//$.cookie('kbase_session',
								    //	  'un=' + data.user_id
									//	+ '|'
									//	+ 'kbase_sessionid=' + data.kbase_sessionid);

                                    var cookieArray = [];

                                    var args = { success : 1 };//this.get_kbase_cookie();
                                    var fields = this.options.fields;

                                    for (var i = 0; i < fields.length; i++) {
                                        //quick 'n dirty escaping 'til I put in something better
                                        var value = data[fields[i]];
                                        args[fields[i]] = value;
                                        value = value.replace(/=/g, 'EQUALSSIGN');
                                        value = value.replace(/\|/g, 'PIPESIGN');
                                        cookieArray.push(fields[i] + '=' + value);
                                    }

                                    $.cookie('kbase_session', cookieArray.join('|'));

                                    this.populateLoginInfo(args);
                                    callback.call(this,args)
                                }
                                else {
                                    $.removeCookie('kbase_session');
                                    this.populateLoginInfo({});
                                    callback.call(this, {status : 0, message : data.error_msg});
                                }

                            },
                            this
                        ),
                        error: $.proxy(
                            function (jqXHR, textStatus, errorThrown) {

                                // If we have a useless error message, replace with
                                // friendly, but useless error message

                                if (textStatus == "error") {
                                    textStatus = "Error connecting to KBase login server";
                                }
                                this.populateLoginInfo({});
                                callback.call(this,{ status : 0, message : textStatus })
                             },
                             this
                            ),
                         xhrFields: {
                            withCredentials: true
                         },
                         beforeSend : function(xhr){
                            // make cross-site requests
                            xhr.withCredentials = true;
                         },
                   }
                );
            }
        },

        logout : function() {

            $.removeCookie('kbase_session');

            // the rest of this is just housekeeping.

            if (this.specificLogout) {
                this.specificLogout();
            }

            this.populateLoginInfo({});

            //automatically prompt to log in again
            if (this.data('loginDialog') != undefined) {
                this.openDialog();
            }

            if (this.options.logout_callback) {
                this.options.logout_callback.call(this);
            }
        }

    });

}( jQuery ) );
/*

    e.g.,

    $('#table').kbaseTable(
        {
            structure : {
                header : [
                    {'value' : 'a', 'sortable' : true},
                    {'value' : 'b', 'sortable' : true, style : 'color : yellow'},
                    'c',
                    'd'
                ],
                rows : [
                    {
                        'a' : 'a1',
                        'b' : 'b1',
                        'c' : 'c1',
                        'd' : 'd1'
                    },
                    {
                        'a' : 'a2',
                        'b' : 'b4',
                        'c' : 'c2',
                        'd' : 'd2'
                    },
                    {
                        'a' : 'a2',
                        'b' : { value : 'b4', colspan : 1},
                        'c' : { value : 'acc'},
                        'd' : 'd2'
                    },
                    {
                        'a' : 'a3',
                        'b' : 'b3',
                        'c' : 'c3',
                        'd' : {
                            value : 'd3',
                            style : 'font-weight : bold; color : blue',
                            class : ['blue', 'green'],
                            mouseover : function(e) {
                                $(this).css('border', '5px solid blue');
                            },
                            mouseout : function(e) {
                                $(this).css('border', '');
                            }
                        }
                    },
                ],
                footer : [
                    'f1', 'f2', 'f3', 'f4'
                ]
            }
        }
    );


*/

(function( $, undefined ) {


    $.KBWidget("kbaseTable", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            sortable    : false,
            striped     : true,
            hover       : true,
            bordered    : true,
        },

        init: function(options) {

            this._super(options);

            this.appendUI( $( this.$elem ), this.options.structure );

            return this;

        },

        appendUI : function ($elem, struct) {

            $elem.empty();

            var $tbl = $('<table></table>')
                .attr('id', 'table')
                .addClass('table');

            if (this.options.tblOptions) {
                this.addOptions($tbl, this.options.tblOptions);
            }


            if (this.options.striped) {
                $tbl.addClass('table-striped');
            }
            if (this.options.hover) {
                $tbl.addClass('table-hover');
            }
            if (this.options.bordered) {
                $tbl.addClass('table-bordered');
            }

            if (this.options.caption) {
                $tbl.append(
                    $('<caption></caption>')
                        .append(this.options.caption)
                )
            }

            if (struct.header) {
                var $thead = $('<thead></thead>')
                    .attr('id', 'thead');

                var $tr = $('<tr></tr>')
                    .attr('id', 'headerRow');

                $.each(
                    struct.header,
                    $.proxy(function (idx, header) {

                        var h = this.nameOfHeader(header);
                        var zed = new Date();

                        var $th = $('<th></th>')
                            .append(h)
                        ;

                        if (typeof header != 'string') {
                            this.addOptions($th, header);

                            if (header.sortable) {
                                var buttonId = h + '-sortButton';
                                var $buttonIcon = $('<i></i>')
                                    .addClass('icon-sort');
                                var $button = $('<button></button>')
                                    .addClass('btn btn-mini')
                                    .attr('id', buttonId)
                                    .css('display', 'none')
                                    .css('float', 'right')
                                    .append($buttonIcon)
                                    .data('shouldHide', true)
                                ;
                                $button.bind('click', $.proxy(function (e) {

                                        var $lastSort = this.data('lastSort');
                                        if ($lastSort != undefined && $lastSort.get(0) != $button.get(0)) {
                                            $lastSort.children(':first').removeClass('icon-sort-up');
                                            $lastSort.children(':first').removeClass('icon-sort-down');
                                            $lastSort.children(':first').addClass('icon-sort');
                                            $lastSort.data('shouldHide', true);
                                            $lastSort.css('display', 'none');
                                        }

                                        if ($buttonIcon.hasClass('icon-sort')) {
                                            $buttonIcon.removeClass('icon-sort');
                                            $buttonIcon.addClass('icon-sort-up');
                                            $button.data('shouldHide', false);
                                            this.sortAndLayoutOn(h, 1);
                                        }
                                        else if ($buttonIcon.hasClass('icon-sort-up')) {
                                            $buttonIcon.removeClass('icon-sort-up');
                                            $buttonIcon.addClass('icon-sort-down');
                                            $button.data('shouldHide', false);
                                            this.sortAndLayoutOn(h, -1);
                                        }
                                        else if ($buttonIcon.hasClass('icon-sort-down')) {
                                            $buttonIcon.removeClass('icon-sort-down');
                                            $buttonIcon.addClass('icon-sort');
                                            $button.data('shouldHide', true);
                                            this.sortAndLayoutOn(undefined);
                                        }

                                        this.data('lastSort', $button);

                                    }, this))
                                ;

                                $th.append($button);
                                $th.bind('mouseover', $.proxy(function(e) {
                                    $button.css('display', 'inline');
                                }, this));
                                $th.bind('mouseout', $.proxy(function(e) {
                                    if ($button.data('shouldHide')) {
                                        $button.css('display', 'none');
                                    }

                                }, this));
                            }
                        }

                        $tr.append($th);

                    }, this)
                );

                $thead.append($tr);
                $tbl.append($thead);

            }

            if (struct.rows) {

                var $tbody = this.data('tbody', $('<tbody></tbody>'));
                this.layoutRows(struct.rows, struct.header);

                $tbl.append($tbody);
            }

            if (struct.footer) {
                var $tfoot = $('<tfoot></tfoot>')
                    .attr('id', 'tfoot');

                for (var idx = 0; idx < struct.footer.length; idx++) {
                    $tfoot.append(
                        $('<td></td>')
                            .append(struct.footer[idx])
                    );
                }

                $tbl.append($tfoot);
            }


            this._rewireIds($tbl, this);

            $elem.append($tbl);

            return $elem;

        },

        sortAndLayoutOn : function(header, dir) {

            var sortedRows = this.options.structure.rows;

            if (header != undefined) {

                var h = this.nameOfHeader(header);

                sortedRows =
                    this.options.structure.rows.slice().sort(
                        function (a,b) {
                            var keyA = a[h];
                            var keyB = b[h];

                            keyA = typeof keyA == 'string' ? keyA.toLowerCase() : keyA;
                            keyB = typeof keyB == 'string' ? keyB.toLowerCase() : keyB;

                                 if (keyA < keyB) { return 0 - dir }
                            else if (keyA > keyB) { return dir }
                            else                  { return 0   }

                        }
                    )
                ;
            }

            this.layoutRows(sortedRows, this.options.structure.header);

        },

        nameOfHeader : function (header) {
            return typeof header == 'string'
                ? header
                : header.value;
        },

        layoutRows : function (rows, header) {

            this.data('tbody').empty();

            for (var idx = 0; idx < rows.length; idx++) {

                this.data('tbody').append(this.createRow(rows[idx], header));

            }
        },

        addOptions : function ($cell, options) {
            if (options.style != undefined) {
                $cell.attr('style', options.style);
            }
            if (options.class != undefined) {
                var classes = typeof options.class == 'string'
                    ? [ options.class ]
                    : options.class;

                $.each(
                    classes,
                    $.proxy(function(idx, cl) {
                        $cell.addClass(cl);
                    }, this)
                );
            }

            var events = ['mouseover', 'mouseout', 'click'];
            $.each(
                events,
                $.proxy(function(idx, e) {
                    if (options[e] != undefined) {
                        $cell.bind(e,options[e])
                    }
                }, this)
            );

            if (options.colspan) {
                $cell.attr('colspan', options.colspan);
            }

            if (options.rowspan) {
                $cell.attr('rowspan', options.rowspan);
            }

        },


        createRow : function (rowData, headers) {

            var $tr = $('<tr></tr>');

            $.each(
                headers,
                $.proxy(function (hidx, header) {
                    var h = this.nameOfHeader(header);

                    var $td = $('<td></td>');

                    if (rowData[h] != undefined) {

                        var value = typeof rowData[h] == 'string'
                            ? rowData[h]
                            : rowData[h].value;

                        $td.append(value);

                        if (typeof rowData[h] != 'string') {
                            this.addOptions($td, rowData[h]);
                        }
                    }

                    if (value != undefined) {
                        $tr.append($td);
                    }

                }, this)
            );

            return $tr;

        },


        deletePrompt : function(row) {
            var $deleteModal = $('<div></div>').kbaseDeletePrompt(
                {
                    name     : row,
                    callback : this.deleteRowCallback(row),
                }
            );

            $deleteModal.openPrompt();
        },

        deleteRowCallback : function (row) {

        },

        shouldDeleteRow : function (row) { return 1; },


    });

}( jQuery ) );
/*

    Easy widget to serve as a tabbed container.

    var $tabs = $('#tabs').kbaseTabs(
        {
            tabPosition : 'bottom', //or left or right or top. Defaults to 'top'
            canDelete : true,       //whether or not the tab can be removed. Defaults to false.
            tabs : [
                {
                    tab : 'T1',                                     //name of the tab
                    content : $('<div></div>').html("I am a tab"),  //jquery object to stuff into the content
                    canDelete : false,                              //override the canDelete param on a per tab basis
                },
                {
                    tab : 'T2',
                    content : $('<div></div>').html("I am a tab 2"),
                },
                {
                    tab : 'T3',
                    content : $('<div></div>').html("I am a tab 3"),
                    show : true,                                    //boolean. This tab gets shown by default. If not specified, the first tab is shown
                },
            ],
        }
    );

    useful methods would be:

    $('#tabs').kbaseTabs('showTab', 'T1');
    $('#tabs').kbaseTabs('addTab', tabObject);  //the tabObject defined up above

*/

(function( $, undefined ) {


    $.KBWidget("kbaseTabs", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            tabPosition : 'top',
            canDelete : false,
            borderColor : 'lightgray',
        },

        init: function(options) {

            this._super(options);

            this.data('tabs', {});
            this.data('nav', {});

            this.appendUI( $( this.$elem ) );

            return this;

        },

        appendUI : function ($elem, tabs) {

            if (tabs == undefined) {
                tabs = this.options.tabs;
            }

            var $block =
                $('<div></div>')
                    .addClass('tabbable')
            ;

            var $tabs = $('<div></div>')
                .addClass('tab-content')
                .attr('id', 'tabs-content')
            ;
            var $nav = $('<ul></ul>')
                .addClass('nav nav-tabs')
                .attr('id', 'tabs-nav')
            ;

            if (this.options.tabPosition == 'top') {
                $block.addClass('tabs-above');
                $block.append($nav).append($tabs);
            }
            else if (this.options.tabPosition == 'bottom') {
                $block.addClass('tabs-below');
                $block.append($tabs).append($nav);
            }
            else if (this.options.tabPosition == 'left') {
                $block.addClass('tabs-left');
                $block.append($nav).append($tabs);
            }
            else if (this.options.tabPosition == 'right') {
                $block.addClass('tabs-right');
                $block.append($tabs).append($nav);
            }

            this._rewireIds($block, this);

            $elem.append($block);

            if (tabs) {
                $.each(
                    tabs,
                    $.proxy(function (idx, tab) {
                        this.addTab(tab);
                    }, this)
                );
            }

        },

        addTab : function (tab) {

            if (tab.canDelete == undefined) {
                tab.canDelete = this.options.canDelete;
            }

            var $tab = $('<div></div>')
                .addClass('tab-pane fade')
                .append(tab.content);

            if (this.options.border) {
                $tab.css('border', 'solid ' + this.options.borderColor);
                $tab.css('border-width', '0px 1px 0px 1px');
                $tab.css('padding', '3px');
            }

            var $that = this;   //thanks bootstrap! You suck!

            var $nav = $('<li></li>')
                .css('white-space', 'nowrap')
                .append(
                    $('<a></a>')
                        .attr('href', '#')
                        .text(tab.tab)
                        .attr('data-tab', tab.tab)
                        .bind('click',
                            function (e) {
                                e.preventDefault();
                                e.stopPropagation();

                                var previous = $that.data('tabs-nav').find('.active:last a')[0];

                                //we can't just call 'show' directly, since it requires an href or data-target attribute
                                //on the link which MUST be an idref to something else in the dom. We don't have those,
                                //so we just do what show does and call activate directly.
                                //
                                //oh, but we can't just say $(this).tab('activate',...) because bootstrap is specifically
                                //wired up now to pass along any arguments to methods invoked in this manner.
                                //
                                //Because bootstrap -sucks-.
                                $.fn.tab.Constructor.prototype.activate.call(
                                    $(this),
                                    $(this).parent('li'),
                                    $that.data('tabs-nav')
                                );

                                $.fn.tab.Constructor.prototype.activate.call(
                                    $(this),
                                    $tab,
                                    $tab.parent(),
                                    function () {
                                        $(this).trigger({
                                            type            : 'shown',
                                            relatedTarget   : previous
                                        })
                                    });

                            }
                        )
                    .append(
                        $('<button></button>')
                            .addClass('btn btn-mini')
                            .append($('<i></i>').addClass(this.closeIcon()))
                            .css('padding', '0px')
                            .css('width', '22px')
                            .css('height', '22px')
                            .css('margin-left', '10px')
                            .attr('title', this.deleteTabToolTip(tab.tab))
                            .tooltip()
                            .bind('click', $.proxy(function (e) {
                                e.preventDefault();
                                e.stopPropagation();

                                this.deletePrompt(tab.tab);
                            },this))
                    )
                )
            ;

            if (! tab.canDelete) {
                $nav.find('button').remove();
            }

            this.data('tabs')[tab.tab] = $tab;
            this.data('nav')[tab.tab] = $nav;

            this.data('tabs-content').append($tab);
            this.data('tabs-nav').append($nav);

            var tabCount = 0;
            for (t in this.data('tabs')) { tabCount++; }
            if (tab.show || tabCount == 1) {
                this.showTab(tab.tab);
            }
        },

        closeIcon : function () { return 'icon-remove'; },

        deleteTabToolTip : function (tabName) {
            return 'Remove ' + tabName;
        },

        showTab : function (tab) {
            if (this.shouldShowTab(tab)) {
                this.data('nav')[tab].find('a').trigger('click');
            }
        },

        shouldShowTab : function (tab) { return 1; },

        deletePrompt : function(tabName) {
            var $deleteModal = $('<div></div>').kbaseDeletePrompt(
                {
                    name     : tabName,
                    callback : this.deleteTabCallback(tabName),
                }
            );

            $deleteModal.openPrompt();
        },

        deleteTabCallback : function (tabName) {
            return $.proxy(function(e, $prompt) {
                if ($prompt != undefined) {
                    $prompt.closePrompt();
                }

                var $tab = this.data('tabs')[tabName];
                var $nav = this.data('nav')[tabName];

                if ($nav.hasClass('active')) {
                    if ($nav.next('li').length) {
                        $nav.next().find('a').trigger('click');
                    }
                    else {
                        $nav.prev('li').find('a').trigger('click');
                    }
                }
                if (this.shouldDeleteTab(tabName)) {
                    $tab.remove();
                    $nav.remove();
                }
            }, this);
        },

        shouldDeleteTab : function (tabName) { return 1; },

        activeTab : function() {
            var activeNav = this.data('tabs-nav').find('.active:last a')[0];
            return $(activeNav).attr('data-tab');
        },

    });

}( jQuery ) );
/*


*/

(function( $, undefined ) {


    $.KBWidget("kbaseFileBrowser", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            'root' : '/',
            'controls' : true,
            'externalControls' : true,
            'height' : '110px',
            'tallHeight' : '450px',
            'shouldToggleNavHeight' : true,
            'controlButtons' : ['deleteButton', 'viewButton', 'addDirectoryButton', 'uploadButton', 'addButton'],
            'name' : 'File Browser',
            'openFolderIcon' : 'icon-folder-open-alt',
            'closedFolderIcon' : 'icon-folder-close-alt',
            'fileIcon' : 'icon-file',
        },

        init: function (options) {

            this._super(options);

            if (options.client) {
                this.client = options.client;
            }

            if (options.$loginbox) {
                this.$loginbox = options.$loginbox;
            }

            this.appendUI(this.$elem);

            return this;

        },

        refreshDirectory : function(path) {

            if (this.sessionId() == undefined) {
                this.$elem.find('ul').first().empty();
            }

            if (this.data(path)) {
                this.listDirectory(path, this.data(path));
            }

        },

        sortByName : function (a,b) {
                 if (a['name'].toLowerCase() < b['name'].toLowerCase()) { return -1 }
            else if (a['name'].toLowerCase() > b['name'].toLowerCase()) { return 1  }
            else                            { return 0  }
        },

        sessionId : function() {
            return this.$loginbox.sessionId();
        },

        selected : function( path ) {

        },

        displayPath : function(path, $ul, filelist) {

            var $fb = this;

            $ul.empty();

            $.each(
                filelist,
                $.proxy(function (idx, val) {

                    var icon = this.options.fileIcon;
                    var callback = function(e) {
                        e.preventDefault();
                        $fb.data('activeDirectory', undefined);
                        $fb.data('activeFile', undefined);
                        $fb.disableButtons();
                        var $opened = $fb.$elem.find('.active');
                        $opened.removeClass('active');
                        if ($(this).parent().get(0) != $opened.get(0)) {
                            $(this).parent().addClass('active');
                            $fb.data('activeFile', val.path);
                            $fb.enableButtons('f');
                            $fb.selected(val.path);
                        }
                    };

                    if (val.type == 'directory') {
                        icon = this.data(val.path) ? $fb.options.openFolderIcon : $fb.options.closedFolderIcon
                        callback = function(e) {
                            e.preventDefault();
                            $fb.data('activeDirectory', undefined);
                            $fb.data('activeFile', undefined);
                            $fb.disableButtons();

                            var $opened = $fb.$elem.find('.active');
                            $opened.removeClass('active');

                            //has children? It's opened. Close it.
                            if ($(this).next().children().length) {
                                //shut it if it's active. Otherwise, make it active
                                if ($(this).parent().get(0) == $opened.get(0)) {
                                    $(this).children().first().removeClass($fb.options.openFolderIcon);
                                    $(this).children().first().addClass($fb.options.closedFolderIcon);
                                    $(this).next().empty();
                                    $fb.data(val.path, undefined);
                                }
                                else {
                                    $fb.data('activeDirectory', val.path);
                                    $(this).parent().addClass('active');
                                    $fb.enableButtons('d');
                                    $fb.selected(val.path);
                                }

                            }
                            //no children? it's closed. open it.
                            else {
                                $(this).children().first().removeClass($fb.options.closedFolderIcon);
                                $(this).children().first().addClass($fb.options.openFolderIcon);
                                $fb.listDirectory(val.path, $(this).next());
                                $(this).parent().addClass('active');
                                $fb.data('activeDirectory', val.path);
                                $fb.data(val.path, $(this).next());
                                $fb.enableButtons('d');
                                $fb.selected(val.path);
                            }
                        }

                    }

                    $ul.append(
                        $('<li></li>')
                            .append(
                                $('<a></a>')
                                    .append(
                                        $('<i></i>')
                                            .addClass(icon)
                                            .css('color', 'gray')
                                    )
                                    .append(' ')
                                    .append(val.name)
                                    .attr('href', '#')
                                    .bind('click',
                                        callback
                                    )
                            )
                            .data('meta', val.meta)
                            .data('able', 'baker')
                            .append($('<ul></ul>').addClass('nav nav-list'))
                    );

                    if (val.type == 'directory' && this.data(val.path)) {
                        this.listDirectory(val.path, $ul.children().last().children().last());
                    }
                }, this)
            );

        },

        fileBrowserContainer : function() {
            var navHeight = this.options.height;

            var $ul = $('<ul></ul>')
                .addClass('nav nav-list')
                .css('height', navHeight)
                .css('overflow', 'auto')
                .attr('id', 'ul-nav')
            ;

            var $container =
                $('<div></div>')
                    .append($ul);

            this.data('file-ul', $ul);

            return $container;
        },

        fileBrowserControls : function() {
            var $div =
                $('<div></div>')
                    .addClass('btn-toolbar')
                    .addClass('text-right')
                    .append(
                        $('<div></div>')
                            .addClass('btn-group')
                            .attr('id', 'control-buttons')
                            .append(
                                $('<input></input>')
                                    .attr('type', 'file')
                                    .attr('id', 'fileInput')
                                    .css('display', 'none')
                                    .bind( 'change', jQuery.proxy(this.handleFileSelect, this) )
                            )
                    )
            ;
            return $div;
        },

        appendUI : function($elem) {

            var $container = this.fileBrowserContainer();

            var $box = $('<div></div>').kbaseBox(
                {
                    title : this.options.name,
                    canCollapse: true,  //boolean. Whether or not clicking the title bar collapses the box
                    content: $container,//'Moo. We are a box. Take us to China.',  //The content within the box. Any HTML string or jquery element
                    //optional list of controls to populate buttons on the right end of the title bar. Give it an icon
                    //and a callback function.
                }
            );

            $elem.append($box.$elem);

            if (this.options.controls) {
                if (this.options.externalControls) {
                    $container.parent().parent().append(this.fileBrowserControls());
                }
                else {
                    $container.append(this.fileBrowserControls());
                }
            }

            this._rewireIds($box.$elem, this);

            $.each(
                this.options.controlButtons,
                $.proxy( function (idx, val) {
                    this.data('control-buttons').append(
                        this[val]()
                    );
                }, this)
            );

            this._rewireIds($box.$elem, this);

            this.listDirectory(this.options.root, this.data('file-ul'));
            this.disableButtons();

            return this;

        },

        disableButtons : function() {
            this.toggleButtons('N');
        },

        enableButtons : function(flag) {
            this.toggleButtons(flag);
        },

        toggleButtons : function(flag) {

            $.each(
                this.options.controlButtons,
                $.proxy(function (idx, val) {
                    var $button = this[val]();
                    if ($button == undefined) {
                        return;
                    }
                    var require = $button.data('require');
                    if (require != undefined) {
                        if ((require == 'a' && flag != 'N') || require == flag) {
                            $button.removeClass('disabled');
                        }
                        else {
                            $button.addClass('disabled');
                        }
                    }
                }, this)
            );
        },

        addDirectoryButton : function() {
            return this.data('addDirectoryButton') != undefined
                ? this.data('addDirectoryButton')
                : $('<a></a>')
                    .attr('id', 'addDirectoryButton')
                    .addClass('btn btn-mini')
                    .append($('<i></i>').addClass('icon-plus'))
                    .attr('title', 'Add new directory')
                    .tooltip()
                    .bind('click',
                        $.proxy( function(e) {
                            e.preventDefault();
                            if (! this.addDirectoryButton().hasClass('disabled')) {
                                this.addDirectory();
                            }
                        }, this)
                    )
        },

        viewButton : function() {
            return this.data('viewButton') != undefined
                ? this.data('viewButton')
                : $('<a></a>')
                    .attr('id', 'viewButton')
                    .addClass('btn btn-mini')
                    .append($('<i></i>').addClass('icon-search'))
                    .attr('title', 'View selected file')
                    .tooltip()
                    .bind('click',
                        $.proxy( function(e) {
                            e.preventDefault();
                            if (! this.viewButton().hasClass('disabled')) {
                                this.openFile(this.data('activeFile'));
                            }
                        }, this)
                    )
                    .data('require', 'f')
        },

        deleteButton : function() {
            return this.data('deleteButton') != undefined
                ? this.data('deleteButton')
                : $('<a></a>')
                    .attr('id', 'deleteButton')
                    .addClass('btn btn-mini')
                    .append($('<i></i>').addClass('icon-minus'))
                    .attr('title', 'Delete selected item')
                    .tooltip()
                    .bind('click',
                        $.proxy( function(e) {
                            e.preventDefault();
                            if (! this.deleteButton().hasClass('disabled')) {
                                this.deleteFile();
                            }
                        }, this)
                    )
                    .data('require', 'a')
        },

        uploadButton : function() {
            return this.data('uploadButton') != undefined
                ? this.data('uploadButton')
                : $('<a></a>')
                    .attr('id', 'uploadButton')
                    .addClass('btn btn-mini')
                    .append($('<i></i>').addClass('icon-arrow-up'))
                    .attr('title', 'Upload file')
                    .tooltip()
                    .bind('click',
                        $.proxy( function (e) {
                            this.data('fileInput').trigger('click');
                        }, this)
                    )
        },
        addButton : function() {
            if (this.options.addFileCallback == undefined) {
                return;
            }

            return this.data('addButton') != undefined
                ? this.data('addButton')
                : $('<a></a>')
                    .attr('id', 'addButton')
                    .addClass('btn btn-mini')
                    .append($('<i></i>').addClass('icon-arrow-right'))
                    .attr('title', 'Add file')
                    .tooltip()
                    .bind('click',
                        $.proxy( function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (! this.addButton().hasClass('disabled')) {
                                this.options.addFileCallback(this.data('activeFile'));
                            }
                        }, this)
                    )
                    .data('require', 'f')
        },

        addDirectory : function() {
            var parentDir = this.data('activeDirectory') || this.options.root;
            var that = this;

            var displayDir = parentDir.replace(this.options.root, '/');

            var $addDirectoryModal = $('<div></div>').kbasePrompt(
                {
                    title : 'Create directory',
                    body : $('<p></p>')
                            .append('Create directory ')
                            .append(
                                $('<span></span>')
                                    .css('font-weight', 'bold')
                                    .text(displayDir)
                            )
                            .append(' ')
                            .append(
                                $('<input></input>')
                                    .attr('type', 'text')
                                    .attr('name', 'dir_name')
                                    .attr('size', '20')
                            )
                    ,
                    controls : [
                        'cancelButton',
                        {
                            name : 'Create directory',
                            type : 'primary',
                            callback : function(e, $prompt) {
                                $prompt.closePrompt();
                                that.makeDirectoryCallback($addDirectoryModal.dialogModal().find('input').val(), parentDir);
                            }
                        }
                    ]
                }
            );

            $addDirectoryModal.openPrompt();


        },

        openFile : function(file, content, win) {

            if (win == undefined) {
                win = window.open();
                win.document.open();
            }

            if (content == undefined) {
                this.fetchContent(file, win);
                return;
            }

            content = content.replace(/>/g, '&gt;');
            content = content.replace(/</g, '&lt;');

            win.document.write(
                $('<div></div>').append(
                    $('<div></div>')
                        .css('white-space', 'pre')
                        .append(content)
                )
                .html()
            );
            win.document.close();

        },

        deleteFile : function() {

            var file = this.data('activeFile');
            var deleteMethod = 'deleteFileCallback';

            if (file == undefined) {
                file = this.data('activeDirectory');

                if (file == undefined) {
                    return;
                }

                file = file.replace(/\/+$/, '');
                deleteMethod = 'deleteDirectoryCallback';

            }
            var matches = file.match(/(.+)\/[^/]+$/);

            var active_dir = '/';
            if (matches != undefined && matches.length > 1) {
                active_dir = matches[1];
            }

            var that = this; //sigh. The confirm button needs it for now.

            var promptFile = file.replace(this.options.root, '');

            var $deleteModal = $('<div></div>').kbaseDeletePrompt(
                {
                    name : promptFile,
                    callback : function(e, $prompt) {
                        $prompt.closePrompt();
                        that[deleteMethod](file, active_dir);
                    }
                }
            );

            $deleteModal.openPrompt();

        },

        handleFileSelect : function(evt) {

            evt.stopPropagation();
            evt.preventDefault();

            var files = evt.target.files
                || evt.originalEvent.dataTransfer.files
                || evt.dataTransfer.files;

            $.each(
                files,
                jQuery.proxy(
                    function (idx, file) {

                        var reader = new FileReader();

                        var upload_dir = this.options.root;
                        if (this.data('activeDirectory')) {
                            upload_dir = this.data('activeDirectory');
                        }


                        var $processElem;

                        if (this.options.processList) {
                            $processElem = this.options.processList.addProcess('Uploading ' + file.name);
                        }

                        reader.onload = jQuery.proxy(
                            function(e) {
                                this.uploadFile(file.name, e.target.result, upload_dir, $processElem);
                            },
                            this
                        );

                        reader.readAsText(file);

                    },
                    this
                )
            );

            this.data('fileInput').val('');

        },

        listDirectory : function (path, $ul) {
             throw "Cannot call listDirectory directly - please subclass";
        },

        makeDirectoryCallback : function (dir, parentDir) {
             throw "Cannot call makeDirectoryCallback directly - please subclass";
        },

        fetchContent : function(file, win) {
             throw "Cannot call fetchContent directly - please subclass";
        },

        deleteFileCallback : function(file, active_dir) {
             throw "Cannot call deleteFileCallback directly - please subclass";
        },

        deleteDirectoryCallback : function(file, active_dir) {
             throw "Cannot call deleteDirectoryCallback directly - please subclass";
        },

        uploadFile : function(name, content, upload_dir, $processElem) {
             throw "Cannot call uploadFile directly - please subclass";
        },

    });

}( jQuery ) );
/*

    Widget to list all commands available in iris.

    $('#command-list').kbaseIrisCommands(
        {
            client          : client,   //invocation client object
            englishCommands : true,     //use english commands or raw command names
            link : function (evt) {     //what should happen when you click on a command
                evt.preventDefault();
                var f = $("#workspaces").data('addNarrativeCommand');
                f(
                    $(this).attr('title'),
                    $(this).data('type'),
                    $(this).data('blockOptions')
                );
            }
        }
    );

    That's it. You're done. This is a useful module to study to see how to subclass kbaseAccordion.

*/

(function( $, undefined ) {

    $.KBWidget("kbaseIrisCommands", 'kbaseAccordion', {
        version: "1.0.0",
        options: {
            link : function (evt) {
                alert("clicked on " + $(evt.target).text());
            },
            englishCommands : 0,
            fontSize : '75%',
            overflow : true,
            sectionHeight : '300px',
        },

        init: function(options) {

            this._super(options);

            if (options.client) {

                this.client = options.client;
            }

            this.commands = [];

            return this;

        },

        completeCommand : function(command) {

            var completions = [];

            var commandRegex = new RegExp('^' + command + '.*');

            for (var idx = 0; idx < this.commands.length; idx++) {
                if (this.commands[idx].match(commandRegex)) {
                    completions.push(this.commands[idx]);
                }
            }

            return completions;
        },

        commonPrefix : function(str1, str2) {

            var prefix = '';
            for (var idx = 0; idx < str1.length && idx < str2.length; idx++) {
                var chr1 = str1.charAt(idx);
                var chr2 = str2.charAt(idx);
                if (chr1 == chr2) {
                    prefix = prefix + chr1;
                }
                else {
                    break;
                }
            };

            return prefix;
        },

        commonCommandPrefix : function (commands) {

            var prefix = '';

            if (commands.length > 1) {

            //find the longest common prefix for the first two commands. That's our start.
                prefix = this.commonPrefix(commands[0], commands[1]);

                for (var idx = 2; idx < commands.length; idx++) {
                    prefix = this.commonPrefix(prefix, commands[idx]);
                }

            }
            else {
                prefix = commands[0];
            }

            return prefix;

        },

        commandsMatchingRegex : function (regex) {
            var matches =[];
            for (var idx = 0; idx < this.commands.length; idx++) {
                if (this.commands[idx].match(regex)) {
                    matches.push(this.commands[idx]);
                }
            }

            return matches.sort();
        },


        appendUI : function($elem) {
            this.client.valid_commands_async(
                $.proxy(
                    function (res) {
                        var commands = [];
                        $.each(
                            res,
                            $.proxy(
                                function (idx, group) {

                                group.title;

                                    var $ul = $('<ul></ul>')
                                        .addClass('unstyled')
                                        .css('max-height', this.options.overflow ? this.options.sectionHeight : '5000px')
                                        .css('overflow', this.options.overflow ? 'auto' : 'visible')
                                    ;

                                    $.each(
                                        group.items,
                                        $.proxy(
                                            function (idx, val) {
                                                var label = val.cmd;
                                                if (this.options.englishCommands) {

                                                    var metaFunc = MetaToolInfo(val.cmd);
                                                    if (metaFunc != undefined) {
                                                        var meta = metaFunc(val.cmd);
                                                        label = meta.label;
                                                    }
                                                }

                                                this.commands.push(val.cmd);

                                                $ul.append(
                                                    this.createLI(val.cmd, label)
                                                );
                                            },
                                            this
                                        )
                                    );

                                    commands.push(
                                        {
                                            'title' : group.title,
                                            'body' : $ul
                                        }
                                    );
                                },
                                this
                            )
                        );

                        this.loadedCallback($elem, commands);
                    },
                    this
                )
            );

        },

        createLI : function(cmd, label, func) {

            if (label == undefined) {
                label = cmd;
            }

            if (func == undefined) {
                func = this.options.link;
            }

            var $commands = this;

            return $('<li></li>')
                //.css('display', 'list-item')
                .bind(
                    'mouseover',
                    function (e) {
                        e.preventDefault();
                    $(this).children().last().css('display', 'inline');
                    }
                )
                .bind(
                    'mouseout',
                    function (e) {
                        e.preventDefault();
                    $(this).children().last().css('display', 'none');
                    }
                )
                .append($('<a></a>')
                    .attr('href', '#')
                    .attr('title', cmd)
                    .data('type', 'invocation')
                    //.css('display', 'list-item')
                    //.tooltip()
                    .text(label)
                    .bind(
                        'click',
                        func
                    )
                )
                .append(
                    $('<button></button>')
                        .addClass('btn btn-mini')
                        .css('display', 'none')
                        .css('float', 'right')
                        .append('?')
                        .bind(
                            'click',
                            function (e) {
                                e.preventDefault();
                                if ($commands.options.terminal != undefined) {
                                    $commands.options.terminal.run(cmd + ' -h');
                                }
                            }
                        )
                )
                /*.draggable(
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
                )*/
        },

        loadedCallback : function($elem, commands) {

            var that = this;

            $('input,textarea').on('focus.kbaseIrisCommands', $.proxy( function (e) {
                if ($(':focus').get(0) != undefined && $(':focus').get(0) != this.data('searchField').get(0)) {
                    this.data('focused', $(':focus'));
                }
            }, this));

            this.data('focused', $(':focus'));

            var $div = $('<div></div>')
                .css('border', '1px solid lightgray')
                .css('padding', '2px')
                .append(
                    $('<h5></h5>')
                        .addClass('text-left')
                        .text("Command List")
                        .css('background-color', 'lightgray')
                        .css('padding', '2px')
                        .css('margin', '0px')
                        .css('position', 'relative')
                        .bind('click',
                            function(e) {
                                $(this).parent().children().last().collapse('toggle');
                                if (that.options.fileBrowser) {
                                    that.options.fileBrowser.toggleNavHeight();
                                }
                            }
                        )
                        .append(
                            $('<div></div>')
                            .css('right', '0px')
                            .css('top', '0px')
                            .css('position', 'absolute')
                            .append(
                                $('<button></button>')
                                    .attr('id', 'deleteSearchResults')
                                    .addClass('btn btn-mini')
                                    .append($('<i></i>').addClass('icon-remove'))
                                    .css('padding-top', '1px')
                                    .css('padding-bottom', '1px')
                                    .css('display', 'none')
                                    .attr('title', 'Remove search results')
                                    .tooltip()
                                    .bind('click', $.proxy(function (e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        this.data('searchResults').empty();
                                        this.data('deleteSearchResults').hide();
                                        this.data('searchFieldBox').hide();
                                    },this))
                            )
                            .append(
                                $('<button></button>')
                                    .addClass('btn btn-mini')
                                    .append($('<i></i>').addClass('icon-search'))
                                    .css('padding-top', '1px')
                                    .css('padding-bottom', '1px')
                                    .attr('title', 'Search for command')
                                    .tooltip()
                                    .bind('click', $.proxy(function (e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        this.data('searchResults').empty();
                                        this.data('searchFieldBox').toggle();
//                                        this.data('deleteSearchResults').hide();
                                        if (this.data('searchFieldBox').is(':hidden')) {
                                            this.data('searchField').blur();
                                            this.data('focused').focus();
                                        }
                                        else {
                                            this.data('searchField').val('');
                                            this.data('searchField').focus();
                                        }
                                    },this))
                            )
                        )
                        .append(
                            $('<div></div>')
                                .css('right', '0px')
                                .css('top', '24px')
                                .css('position', 'absolute')
                                .css('z-index', '999')
                                .css('display', 'none')
                                .attr('id', 'searchFieldBox')
                                .append(
                                    $('<input></input')
                                        .attr('type', 'text')
                                        .addClass('input-medium search-query')
                                        .attr('name', 'search')
                                        .css('padding-top', '1px')
                                        .css('padding-bottom', '1px')
                                        .attr('id', 'searchField')
                                        .keypress($.proxy(function (e) {
                                            if (e.which == 13) {
                                                var regex = new RegExp(this.data('searchField').val(), 'i');
                                                var commands = this.commandsMatchingRegex(regex);

                                                $.each(
                                                    commands,
                                                    $.proxy( function (idx, cmd) {
                                                        this.data('searchResults').append(
                                                            this.createLI(
                                                                cmd,
                                                                cmd,
                                                                function (e) {
                                                                    that.options.link.call(this, e);
                                                                    //that.data('deleteSearchResults').trigger('click');
                                                                }
                                                            )
                                                        );
                                                    }, this)
                                                );

                                                if (! commands.length) {
                                                    this.data('searchResults').append(
                                                        $('<li></li>')
                                                            .css('font-style', 'italic')
                                                            .text('No matching commands found')
                                                    );
                                                };

                                                this.data('deleteSearchResults').show();
                                                this.data('searchFieldBox').hide();
                                                if (! commands.length) {
                                                    this.data('focused').focus();
                                                }
                                            };
                                        }, this))
                                )
                        )
                )
                .append(
                    $('<ul></ul>')
                        .css('font-size', this.options.fontSize)
                        .css('padding-left', '15px')
                        .attr('id', 'searchResults')
                        .addClass('unstyled')
                        .css('max-height', this.options.overflow ? this.options.sectionHeight : '5000px')
                        .css('overflow', this.options.overflow ? 'auto' : 'visible')
                )
            ;
            $elem.append($div);

            this._rewireIds($div, this);

            this._superMethod('appendUI', $div, commands);

            this.data('accordion').css('margin-bottom', '0px');

        },


    });

}( jQuery ) );
/*


*/

(function( $, undefined ) {


    $.KBWidget("kbaseIrisFileBrowser", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            'root' : '/',
            'controls' : true,
            'externalControls' : true,
            'height' : '110px',
            'tallHeight' : '450px',
            'shouldToggleNavHeight' : true,
            'controlButtons' : ['deleteButton', 'viewButton', 'addDirectoryButton', 'uploadButton'],
            // this is a bug. These should inherit from the superclass. FML.
            'openFolderIcon' : 'icon-folder-open-alt',
            'closedFolderIcon' : 'icon-folder-close-alt',
            'fileIcon' : 'icon-file',
        },

        init: function (options) {

            this._super(options);

            if (options.client) {
                this.client = options.client;
            }

            if (options.$loginbox) {
                this.$loginbox = options.$loginbox;
            }

            this.appendUI(this.$elem);

            return this;

        },

        refreshDirectory : function(path) {

            if (this.sessionId() == undefined) {
                this.$elem.find('ul').first().empty();
            }

            if (this.data(path)) {
                this.listDirectory(path, this.data(path));
            }
        },

        sortByName : function (a,b) {
                 if (a['name'] < b['name']) { return -1 }
            else if (a['name'] > b['name']) { return 1  }
            else                            { return 0  }
        },

        sessionId : function() {
            return this.$loginbox.sessionId();
        },

        listDirectory : function (path, $ul) {

            this.data(path, $ul);

            this.client.list_files_async(
                this.sessionId(),
                '/',
                path,
                jQuery.proxy( function (filelist) {
                    var dirs = filelist[0];
                    var files = filelist[1];

                    var $fb = this;

                    $ul.empty();

                    jQuery.each(
                        dirs.sort(this.sortByName),
                        $.proxy(function (idx, val) {

                            val['full_path'] = val['full_path'].replace(/\/+/g, '/');

                            $ul.append(
                                $('<li></li>')
                                    .append(
                                        $('<a></a>')
                                            .append(
                                                $('<i></i>')
                                                    .addClass(this.data(val['full_path']) ? $fb.options.openFolderIcon : $fb.options.closedFolderIcon)
                                                    .css('color', 'gray')
                                            )
                                            .append(' ')
                                            .append(val['name'])
                                            .attr('href', '#')
                                            .bind('click',
                                                function(e) {
                                                    e.preventDefault();
                                                    $fb.data('activeDirectory', undefined);
                                                    $fb.data('activeFile', undefined);
                                                    $fb.viewButton().addClass('disabled');
                                                    $fb.deleteButton().addClass('disabled');

                                                    var $opened = $fb.$elem.find('.active');
                                                    $opened.removeClass('active');

                                                    //has children? It's opened. Close it.
                                                    if ($(this).next().children().length) {
                                                        //shut it if it's active. Otherwise, make it active
                                                        if ($(this).parent().get(0) == $opened.get(0)) {
                                                            $(this).children().first().removeClass($fb.options.openFolderIcon);
                                                            $(this).children().first().addClass($fb.options.closedFolderIcon);
                                                            $(this).next().empty();
                                                            $fb.data(val['full_path'], undefined);
                                                        }
                                                        else {
                                                            $fb.data('activeDirectory', val['full_path']);
                                                            $(this).parent().addClass('active');
                                                            $fb.deleteButton().removeClass('disabled');
                                                        }

                                                    }
                                                    //no children? it's closed. open it.
                                                    else {
                                                        $(this).children().first().removeClass($fb.options.closedFolderIcon);
                                                        $(this).children().first().addClass($fb.options.openFolderIcon);
                                                        $fb.listDirectory(val['full_path'], $(this).next());
                                                        $(this).parent().addClass('active');
                                                        $fb.data('activeDirectory', val['full_path']);
                                                        $fb.deleteButton().removeClass('disabled');
                                                    }
                                                }
                                            )
                                    )
                                    .append($('<ul></ul>').addClass('nav nav-list'))
                            );

                            if (this.data(val['full_path'])) {
                                this.listDirectory(val['full_path'], $ul.children().last().children().last());
                            }
                        }, this)
                    );
                    jQuery.each(
                        files.sort(this.sortByName),
                        $.proxy(function (idx, val) {

                            val['full_path'] = val['full_path'].replace(/\/+/g, '/');

                            $ul.append(
                                $('<li></li>')
                                    .append(
                                        $('<a></a>')
                                            .append(
                                                $('<i></i>')
                                                    .addClass(this.options.fileIcon)
                                                    .css('color', 'gray')
                                            )
                                            .append(' ')
                                            .append(val['name'])
                                            .attr('href', '#')
                                            .bind('click',
                                                function(e) {
                                                    e.preventDefault();
                                                    $fb.data('activeDirectory', undefined);
                                                    $fb.data('activeFile', undefined);
                                                    $fb.viewButton().addClass('disabled');
                                                    $fb.deleteButton().addClass('disabled');
                                                    var $opened = $fb.$elem.find('.active');
                                                    $opened.removeClass('active');
                                                    if ($(this).parent().get(0) != $opened.get(0)) {
                                                        $(this).parent().addClass('active');
                                                        $fb.data('activeFile', val['full_path']);
                                                        $fb.viewButton().removeClass('disabled');
                                                        $fb.deleteButton().removeClass('disabled');

                                                    }
                                                }
                                            )
                                    )
                            );
                        },this)
                    );

                    }, this
                ),
                $.proxy(function (err) {this.dbg(err)},this)
            );

        },

        toggleNavHeight : function () {
            if (this.options.shouldToggleNavHeight) {
                var $ul = this.data('ul-nav');
                var height = $ul.css('height');
                $ul.css(
                    'height',
                    height == this.options.height
                        ? this.options.tallHeight
                        : this.options.height
                );
            }
        },

        appendUI : function($elem) {

            var $div = $('<div></div>')
                .css('border', '1px solid lightgray')
                .css('padding', '2px')
                .append(
                    $('<h5></h5>')
                        .addClass('text-left')
                        .text("File Browser")
                        .css('margin', '0px')
                        .css('padding', '2px')
                        .css('background-color', 'lightgray')
                        .css('border-collapse', 'collapse')
                        .bind('click',
                            function(e) {
                                $(this).next().collapse('toggle');
                            }
                        )
                    )
            ;

            var navHeight = this.options.height;

            var $ul = $('<ul></ul>')
                .addClass('nav nav-list')
                .css('height', navHeight)
                .css('overflow', 'auto')
                .attr('id', 'ul-nav')
            ;
            var $controls =
                $('<div></div>')
                    .addClass('btn-toolbar')
                    .addClass('text-right')
                    .append(
                        $('<div></div>')
                            .addClass('btn-group')
                            .attr('id', 'control-buttons')
                            .append(
                                $('<input></input>')
                                    .attr('type', 'file')
                                    .attr('id', 'fileInput')
                                    .css('display', 'none')
                                    .bind( 'change', jQuery.proxy(this.handleFileSelect, this) )
                            )
                    )
            ;

            var $container =
                $('<div></div>')
                    .append($ul);

            $div.append($container);
            $elem.append($div);

            if (this.options.controls) {
                if (this.options.externalControls) {
                    $div.append($controls);
                }
                else {
                    $container.append($controls);
                }
            }

            this._rewireIds($div, this);

            $.each(
                this.options.controlButtons,
                $.proxy( function (idx, val) {
                    this.data('control-buttons').append(
                        this[val]()
                    );
                }, this)
            );

            this._rewireIds($div, this);

            this.listDirectory(this.options.root, $ul);

            return this;

        },

        addDirectoryButton : function() {
            return this.data('addDirectoryButton') != undefined
                ? this.data('addDirectoryButton')
                : $('<a></a>')
                    .attr('id', 'addDirectoryButton')
                    .addClass('btn btn-mini')
                    .append($('<i></i>').addClass('icon-plus'))
                    .attr('title', 'Add new directory')
                    .tooltip()
                    .bind('click',
                        $.proxy( function(e) {
                            e.preventDefault();
                            if (! this.addDirectoryButton().hasClass('disabled')) {
                                this.addDirectory();
                            }
                        }, this)
                    )
        },

        viewButton : function() {
            return this.data('viewButton') != undefined
                ? this.data('viewButton')
                : $('<a></a>')
                    .attr('id', 'viewButton')
                    .addClass('btn btn-mini disabled')
                    .append($('<i></i>').addClass('icon-search'))
                    .attr('title', 'View selected file')
                    .tooltip()
                    .bind('click',
                        $.proxy( function(e) {
                            e.preventDefault();
                            if (! this.viewButton().hasClass('disabled')) {
                                this.openFile(this.data('activeFile'));
                            }
                        }, this)
                    )
        },

        deleteButton : function() {
            return this.data('deleteButton') != undefined
                ? this.data('deleteButton')
                : $('<a></a>')
                    .attr('id', 'deleteButton')
                    .addClass('btn btn-mini disabled')
                    .append($('<i></i>').addClass('icon-remove'))
                    .attr('title', 'Delete selected item')
                    .tooltip()
                    .bind('click',
                        $.proxy( function(e) {
                            e.preventDefault();
                            if (! this.deleteButton().hasClass('disabled')) {
                                this.deleteFile();
                            }
                        }, this)
                    )
        },

        uploadButton : function() {
            return this.data('uploadButton') != undefined
                ? this.data('uploadButton')
                : $('<a></a>')
                    .attr('id', 'uploadButton')
                    .addClass('btn btn-mini')
                    .append($('<i></i>').addClass('icon-arrow-up'))
                    .attr('title', 'Upload file')
                    .tooltip()
                    .bind('click',
                        $.proxy( function (e) {
                            this.data('fileInput').trigger('click');
                        }, this)
                    )
        },

        addDirectory : function() {
            var parentDir = this.data('activeDirectory') || this.options.root;
            var that = this;

            var displayDir = parentDir.replace(this.options.root, '/');

            var $addDirectoryModal = $('<div></div>').kbasePrompt(
                {
                    title : 'Create directory',
                    body : $('<p></p>')
                            .append('Create directory ')
                            .append(
                                $('<span></span>')
                                    .css('font-weight', 'bold')
                                    .text(displayDir)
                            )
                            .append(' ')
                            .append(
                                $('<input></input>')
                                    .attr('type', 'text')
                                    .attr('name', 'dir_name')
                                    .attr('size', '20')
                            )
                    ,
                    controls : [
                        'cancelButton',
                        {
                            name : 'Create directory',
                            type : 'primary',
                            callback : function(e, $prompt) {
                                $prompt.closePrompt();
                                that.client.make_directory_async(
                                    that.sessionId,
                                    parentDir,
                                    $addDirectoryModal.dialogModal().find('input').val(),
                                    function (res) { that.refreshDirectory(parentDir) },
                                    function() {}
                                    );
                            }
                        }
                    ]
                }
            );

            $addDirectoryModal.openPrompt();


        },

        openFile : function(file) {

            // can't open the window in trhe callback!
            var win = window.open();
            win.document.open();

            this.client.get_file_async(
                this.sessionId(),
                file,
                '/',
                $.proxy(
                    function (res) {

                        try {
                            var obj = JSON.parse(res);
                            res = JSON.stringify(obj, undefined, 2);
                        }
                        catch(e) {
                            this.dbg("FAILURE");
                            this.dbg(e);
                        }

                        win.document.write(
                            $('<div></div>').append(
                                $('<div></div>')
                                    .css('white-space', 'pre')
                                    .append(res)
                            )
                            .html()
                        );
                        win.document.close();

                    },
                    this
                ),
                function (err) { this.dbg("FILE FAILURE"); this.dbg(err) }
            );
        },

        deleteFile : function() {

            var file = this.data('activeFile');
            var deleteMethod = 'remove_files_async';

            if (file == undefined) {
                file = this.data('activeDirectory');

                if (file == undefined) {
                    return;
                }

                file = file.replace(/\/+$/, '');
                deleteMethod = 'remove_directory_async';

            }
            var matches = file.match(/(.+)\/[^/]+$/);

            var active_dir = '/';
            if (matches != undefined && matches.length > 1) {
                active_dir = matches[1];
            }

            var that = this; //sigh. The confirm button needs it for now.

            var promptFile = file.replace(this.options.root, '');

            var $deleteModal = $('<div></div>').kbaseDeletePrompt(
                {
                    name : promptFile,
                    callback : function(e, $prompt) {
                        $prompt.closePrompt();
                        that.client[deleteMethod](
                            that.sessionId,
                            '/',
                            file,
                            function (res) { that.refreshDirectory(active_dir) },
                            function() {}
                            );
                    }
                }
            );

            $deleteModal.openPrompt();

        },

        handleFileSelect : function(evt) {

            evt.stopPropagation();
            evt.preventDefault();

            var files = evt.target.files
                || evt.originalEvent.dataTransfer.files
                || evt.dataTransfer.files;

            $.each(
                files,
                jQuery.proxy(
                    function (idx, file) {

                        var reader = new FileReader();

                        var upload_dir = '/';
                        if (this.data('activeDirectory')) {
                            upload_dir = this.data('activeDirectory');
                        }


                        var $processElem;

                        if (this.options.processList) {
                            $processElem = this.options.processList.addProcess('Uploading ' + file.name);
                        }

                        reader.onload = jQuery.proxy(
                            function(e) {

                                this.client.put_file_async(
                                    this.sessionId(),
                                    file.name,
                                    e.target.result,
                                    upload_dir,
                                    jQuery.proxy( function (res) {
                                        if (this.options.processList) {
                                            this.options.processList.removeProcess($processElem);
                                        }
                                        this.refreshDirectory(upload_dir)
                                    }, this),
                                    jQuery.proxy( function (res) {
                                        if (this.options.processList) {
                                            this.options.processList.removeProcess($processElem);
                                        }
                                        this.dbg(res);
                                    }, this)
                                );
                            },
                            this
                        );

                        reader.readAsText(file);

                    },
                    this
                )
            );

            this.data('fileInput').val('');

        }

    });

}( jQuery ) );
/*


*/
(function( $, undefined ) {


    $.KBWidget("kbaseIrisGrammar", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            defaultGrammarURL : 'http://www.prototypesite.net/iris-dev/grammar.json',
        },

        init: function(options) {

            this._super(options);

            if (this.options.$loginbox != undefined) {
                this.$loginbox = this.options.$loginbox;
            }

            this.appendUI( $( this.$elem ) );

            this.retrieveGrammar(this.options.defaultGrammarURL);

            return this;

        },

        appendUI : function($elem) {

        },

        tokenize : function(string) {

            var tokens = [];
            var partial = '';
            var quote = undefined;
            var escaped = false;

            for (var idx = 0; idx < string.length; idx++) {
                var chr = string.charAt(idx);
                if (quote == undefined) {
                    //semi colons and question marks will be delimiters...eventually. Just skip 'em for now.
                    if (chr.match(/[?;]/)) {
                        continue;
                    }
                }

                if (chr.match(/\S/) || quote != undefined) {
                    partial = partial + chr;
                }
                else {
                    if (partial.length) {
                        tokens.push(partial);
                        partial = '';
                    }
                    continue;
                }

                if (quote != undefined) {

                    if (chr == quote && ! escaped) {
                        partial = partial.substring(1, partial.length - 1);
                        tokens.push(partial);
                        partial = '';
                        quote = undefined;
                        continue;
                    }

                }

                if (quote == undefined) {
                    if (chr == '"' || chr == "'") {
                        quote = chr;
                    }
                }

                if (chr == '\\') {
                    escaped = true;
                }
                else {
                    escaped = false;
                }

            }

            if (partial.length) {
                tokens.push(partial)
            }

            return tokens;
        },


        evaluate : function (string, callback) {

            var tokens  = this.tokenize(string);
            var grammar = this.grammar;

            if (grammar == undefined) {
                this.retrieveGrammar(this.options.defaultGrammarURL, $.proxy(function() {this.evaluate(string, callback); }, this));
                return;
            }

            //grammar = grammar._root;

            var execute = undefined;
            var tokenVariables = undefined;

            var variables = {};

            var returnObj = {
                parsed : '',
                string : string,
                grammar : grammar._root,
            };

            if (tokens[0] == 'explain') {
                tokens.shift();
                returnObj.explain = 1;
            }

            for (var idx = 0; idx < tokens.length; idx++) {

                var token = tokens[idx];
                var childFound = false;

                for (child in returnObj.grammar.children) {

                    var info = returnObj.grammar.children[child];

                    if (info.regex && token.match(info.regex)) {
                        returnObj.grammar = returnObj.grammar.children[child];
                        childFound = true
                    }
                    else if (child.match(/^\$/)) {
                        returnObj.grammar = returnObj.grammar.children[child];
                        childFound = true;
                    }

                    else if (token == child) {
                        returnObj.grammar = returnObj.grammar.children[child];
                        childFound = true;
                    }
                    else if (! info.caseSensitive) {
                        var regex = new RegExp('^' + child + '$', 'i');
                        if (token.match(regex)) {
                            returnObj.grammar = returnObj.grammar.children[child];
                            childFound = true;
                        }
                    }

                    if (childFound) {
                        if (child.match(/^\$/)) {
                            variables[child] = token;
                        }

                        if (returnObj.parsed.length) {
                            returnObj.parsed = returnObj.parsed + ' ' + token;
                        }
                        else {
                            returnObj.parsed = token;
                        }

                        returnObj.grammar = info;
                        returnObj.execute = info.execute;
                        break;
                    }

                }
                if (! childFound && ! returnObj.grammar.childrenOptional) {
                    returnObj.tail = tokens.splice(idx, tokens.length - idx).join(' ');
                    break;
                }
            }

            if (returnObj.grammar.children != undefined && Object.keys(returnObj.grammar.children).length && ! returnObj.grammar.childrenOptional) {
                returnObj.error = "Parse error at " + token;
                returnObj.fail = 1;
                delete returnObj.execute;
                returnObj.token = token;
                returnObj.tail = tokens.splice(idx, tokens.length - idx).join(' ');
                var next = [];
                if (returnObj.grammar.children != undefined) {
                    for (prop in returnObj.grammar.children) {
                        //next.push(prop);
                        next.push(this.nextForGrammar(prop, returnObj.grammar.children));
                    }
                }
                returnObj.next = next.sort();

                if (callback) {
                    callback(returnObj);
                }
                return returnObj;

            }


            returnObj.rawExecute = returnObj.execute;
            for (var variable in variables) {
                returnObj.execute = returnObj.execute.replace(variable, variables[variable]);
            }

            if (returnObj.tail) {
                var m;
                if (m = returnObj.tail.match(/^into\s+(\S+)/)) {
                    returnObj.execute = returnObj.execute + ' > ' + m[1];
                }
                else {
                    returnObj.fail = 1;
                    returnObj.error = 'Extra characters - ' + returnObj.tail;
                }
            }

            if (callback) {
                callback(returnObj);
            };

            return returnObj;

        },

        nextForGrammar : function(next, grammar) {

            if (next == undefined) {
                next = '';
            }

            var nextGrammar = grammar[next].children;
            var ng;
            var throttle = 1000;

            while (nextGrammar != undefined && throttle-- > 0) {
                if (Object.keys(nextGrammar).length == 1) {
                    var prop = Object.keys(nextGrammar)[0];

                    next = next.length
                        ? next + ' ' + prop
                        : prop;

                    nextGrammar = nextGrammar[prop].children;

                }
            }

            return next;
        },


        allQuestions : function(filter) {
            var questions =  [
                "Display the dna sequence of contig $contig_id from $max to $min",
                "Display the dna sequence of gene $gene_id",
                "What type of family is $family",
                "What is the function of family $family",
                "What fids are in family $family",
                "Display sequences in family $family as fasta",
                "Display sequences in family $family",
                "What is the function of feature $feature_id",
                "What fids in k12 have attached publications",
                "What publications have been connected to gene thrB",
                "Show the DNA sequence of fid thrB",
                "Display the protein sequence of fid thrB",
                "Which protein families contain gene $gene_id",
                "Is fid thrB in an atomic regulon",
                "Which fids appear to have correlated expression with gene thrB",
                "What is the location of feature thrB",
                "What protein sequence corresponds to fid $fid",
                "Which contigs are in genome $genome",
                "What is the size of genome $genome",
                "What is the KBase id of SEED genome $genome",
                "What is the KBase id of SEED feature $feature",
                "What is the source of genome $genome",
                "Which are the closest genomes to $genome",
                "What is the name of genome $genome",
                "Which genomes have models",
                "Which models exist for genome $genome",
                "Which reactions exist in genome $genome",
                "Which reactions are in model $model",
                "What reactions connect to role $role",
                "What roles relate to reaction $reaction",
                "What complexes implement reaction $reaction",
                "What reactions does complex $complex implement",
                "Describe the biomass reaction for model kb|fm.0",
                "What compounds are connected to model $model",
                "What media are known",
                "What compounds are considered part of media $media",
                "show reactions that connect to compound $compound",
                "How many otus exist",
                "What otus exist",
                "What otu contains $otu",
                "What genomes are in OTU $otu",
                "What annotations are known for protein sequence $sequence",
                "What roles are used in models",
                "What roles are used in subsystem $subsystem",
                "What subsystems include role $role",
                "What features in $feature implement role $role",
                "What families implement role $role",
                "What roles occur in subsystem $subsystem",
                "What roles are in subsystem $subsystem",
                "What genomes are in subsystem $subsystem",
                "What subsystems are in genome $genome",
                "what is the taxonomy of genome $genome",
                "What is the taxonomic group id of $group_id",
                "What genomes are in taxonomic group $group",
            ];

            if (filter == undefined) {
                return questions;
            }
            else {
                var filteredQ = [];
                var qRegex = new RegExp(filter);
                for (var idx = 0; idx < questions.length; idx++) {
                    var q = questions[idx];
                    if (q.match(qRegex)) {
                        filteredQ.push(q);
                    }
                }
                return filteredQ;
            }
        },

        XXXallQuestionsBOGUS : function(grammar, prefix) {
            if (prefix == undefined) {
                prefix = '';
            }

            if (grammar == undefined) {
                if (this.grammar == undefined) {
                    this.retrieveGrammar(this.options.defaultGrammarURL, $.proxy(function() {this.allQuestions(); }, this));
                    return;
                }
                else {
                    grammar = this.grammar._root.children;
                }
            }

            for (var child in grammar) {

                var childPrefix = prefix.length
                    ? prefix + ' ' + child
                    : child;

                //var questions = this.allQuestions(grammar[child].children, childPrefix);
            }
        },

        retrieveGrammar : function(url, callback) {

            var token = undefined;

            $.ajax(
                {
    		        async : true,
            		dataType: "text",
            		url: url,
            		crossDomain : true,
            		beforeSend: function (xhr) {
		                if (token) {
                			xhr.setRequestHeader('Authorization', token);
		                }
            		},
            		success: $.proxy(function (data, status, xhr) {

            		    var json = JSON.parse(data);

            		    /*for (id in json) {
            		        var newChildren = {};
            		        for (var idx = 0; idx < json[id].children.length; idx++) {
            		            var childId = json[id].children[idx];
            		            newChildren[childId] = json[childId];
            		        }
            		        json[id].children = newChildren;
            		    }

            		    */
            		    this.grammar = json;

            		    if (callback) {
            		        callback();
            		    }

		            }, this),
            		error: $.proxy(function(xhr, textStatus, errorThrown) {
            		    this.dbg(textStatus);
                        throw xhr;
		            }, this),
                    type: 'GET',
    	        }
    	    );

        }


    });

}( jQuery ) );
/*


*/

(function( $, undefined ) {

    $.KBWidget("kbaseIrisProcessList", 'kbaseWidget', {
        version: "1.0.0",
        options: {

        },

        init: function (options) {

            this._super(options);

            this.appendUI(this.$elem);

            return this;

        },

        appendUI : function($elem) {

            $elem.append(
                $('<div></div>')
                    .css('border', '1px solid lightgray')
                    .css('padding', '2px')
                    .append(
                        $('<h5></h5>')
                            .addClass('text-left')
                            .text("Running processes")
                            .css('margin', '0px')
                            .css('padding', '2px')
                            .css('background-color', 'lightgray')
                            .css('border-collapse', 'collapse')

                        )
                    .append(
                        $('<ul></ul>')
                            .addClass('unstyled')
                            .append(this.pendingLi())
                    )
                )
            ;

            return this;

        },

        pendingLi : function() {
            if (this.data('pendingLi') == undefined) {
                this.data('pendingLi',
                    $('<li></li>')
                        .css('font-style', 'italic')
                        .text('No processes running')
                );
            }

            return this.data('pendingLi');
        },

        addProcess : function (process) {

            this.pendingLi().remove();

            var $li = $('<li></li>')
                .text(process);

            this.$elem.find('ul').append($li);

            return $li;
        },

        removeProcess : function ($li) {
            $li.remove();
            if (this.$elem.find('ul').children().length == 0) {
                this.$elem.find('ul').append(this.pendingLi());
            }
        }

    });

}( jQuery ) );
/*


*/

(function( $, undefined ) {


    $.KBWidget("kbaseIrisTerminal", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            invocationURL : 'http://localhost:5000',
            searchURL : 'https://kbase.us/services/search-api/search/$category/$keyword?start=$start&count=$count&format=json',
            searchStart : 1,
            searchCount : 10,
            searchFilter : {
                literature : 'link,pid'
            },
//            invocationURL : 'http://bio-data-1.mcs.anl.gov/services/invocation',
            maxOutput : 100,
            scrollSpeed : 750,
            terminalHeight : '500px',
            promptIfUnauthenticated : 1,
        },

        init: function(options) {

            this._super(options);

            //for lack of a better place to put it, the plugin to set cursor position
            $.fn.setCursorPosition = function(position){
                if(this.length == 0) return this;
                return $(this).setSelection(position, position);
            }

            $.fn.setSelection = function(selectionStart, selectionEnd) {
                if(this.length == 0) return this;
                input = this[0];
                if (input.createTextRange) {
                    var range = input.createTextRange();
                    range.collapse(true);
                    range.moveEnd('character', selectionEnd);
                    range.moveStart('character', selectionStart);
                    range.select();
                } else if (input.setSelectionRange) {
                    input.focus();
                    input.setSelectionRange(selectionStart, selectionEnd);
                }

                return this;
            }

            $.fn.focusEnd = function(){
                this.setCursorPosition(this.val().length);
                        return this;
            }

            $.fn.getCursorPosition = function() {
                if(this.length == 0) return this;
                input = this[0];

                return input.selectionEnd;
            }

            //end embedded plugin

            if (this.options.client) {
                this.client = this.options.client;
            }
            else {
                this.client = new InvocationService(this.options.invocationURL, undefined,
                    jQuery.proxy(function() {
                        var cookie_obj = this.$loginbox.kbaseLogin('get_kbase_cookie');
                        if (cookie_obj) {
                            var token = cookie_obj['token'];
                            this.dbg("returning token from auth_cb " + token);
                            return token;
                        }
                        else {
                            this.dbg("returning undef from auth_cb ");
                            return undefined;
                        }
                    }, this));
            }

            this.$loginbox =
                $("<div></div>").kbaseLogin(
                    {
                        style : 'text',
                        login_callback :
                            jQuery.proxy(
                                function(args) {
                                    if (args.success) {
                                        this.out_line();
                                        this.client.start_session_async(
                                            args.user_id,
                                            jQuery.proxy(
                                                function (newsid) {
                                                    this.set_session(args.user_id);
                                                    this.loadCommandHistory();
                                                    this.out("Set session to " + args.user_id);
                                                    this.scroll();
                                                },
                                                this
                                            ),
                                            jQuery.proxy(
                                                function (err) {
                                                    this.out("<i>Error on session_start:<br>" +
                                                    err.message.replace("\n", "<br>\n") + "</i>");
                                                },
                                                this
                                            )
                                        );

                                        this.kbase_sessionid = args.kbase_sessionid;
                                        this.input_box.focus();

                                        this.refreshFileBrowser();
                                    }
                                },
                                this
                            ),
                        logout_callback :
                            jQuery.proxy(
                                function() {
                                    this.sessionId = undefined;
                                    this.cwd = '/';
                                    this.dbg("LOGOUT CALLBACK");
                                    this.refreshFileBrowser();
                                    this.terminal.empty();
                                },
                                this
                            )
                    }
                );

            this.tutorial = $('<div></div>').kbaseIrisTutorial();

            this.commandHistory = [];
            this.commandHistoryPosition = 0;

            this.path = '.';
            this.cwd = "/";
            this.variables = {};
            this.aliases = {};

            this.appendUI( $( this.$elem ) );

            var cookie;

            if (cookie = this.$loginbox.get_kbase_cookie()) {
                var $commandDiv = $("<div></div>").css('white-space', 'pre');
                this.terminal.append($commandDiv);
                this.out_line();
                if (cookie.user_id) {
                    this.out_to_div($commandDiv, 'Already logged in as ' + cookie.name + "\n");
                    this.set_session(cookie.user_id);
                    this.loadCommandHistory();
                    this.out_to_div($commandDiv, "Set session to " + cookie.user_id);
                }
                else if (this.options.promptIfUnauthenticated) {
                    this.$loginbox.kbaseLogin('openDialog');
                }
            }
            else if (this.options.promptIfUnauthenticated) {
                this.$loginbox.kbaseLogin('openDialog');
            }

            this.fileBrowsers = [];

            if (this.options.fileBrowser) {
                this.addFileBrowser(this.options.fileBrowser);
            }
            else {
                this.addFileBrowser(
                    $('<div></div>').kbaseIrisFileBrowser (
                        {
                            client : this.client,
                            $loginbox : this.$loginbox,
                            externalControls : false,
                        }
                    )
                )
            };

            return this;

        },

        addFileBrowser : function ($fb) {
            this.fileBrowsers.push($fb);
        },

        open_file : function(file) {
            this.fileBrowsers[0].openFile(file);
        },

        refreshFileBrowser : function() {
            for (var idx = 0; idx < this.fileBrowsers.length; idx++) {
                this.fileBrowsers[idx].refreshDirectory(this.cwd);
            }
        },

        loginbox : function () {
            return this.$loginbox;
        },

        getClient : function() {
            return this.client;
        },

        authToken : function() {
            var cookieObj = this.$loginbox.kbaseLogin('get_kbase_cookie');
            if (cookieObj != undefined) {
                return cookieObj['token'];
            }
            else {
                return undefined;
            }
        },

        appendInput : function(text, spacer) {
            if (this.input_box) {
                var space = spacer == undefined ? ' ' : '';

                if (this.input_box.val().length == 0) {
                    space = '';
                };

                this.input_box.val(this.input_box.val() + space + text);
                this.input_box.focusEnd();
            }
        },

        appendUI : function($elem) {

            var $block = $('<div></div>')
                .append(
                    $('<div></div>')
                        .attr('id', 'terminal')
                        .css('height' , this.options.terminalHeight)
                        .css('overflow', 'auto')
                        .css('padding' , '5px')
                        .css('font-family' , 'monospace')
                )
                .append(
                    $('<textarea></textarea>')
                        .attr('id', 'input_box')
                        .attr('style', 'width : 99%;')
                        .attr('height', '3')
                    )
                .append(
                    $('<div></div>')
                        .attr('id', 'file-uploader')
                    )
                .append(
                    $('<div></div>')
                        .attr('id', 'panel')
                        .css('display', 'none')
                    );
            ;

            this._rewireIds($block, this);

            $elem.append($block);

            this.terminal = this.data('terminal');
            this.input_box = this.data('input_box');

            this.out('Welcome to the interactive KBase.');
            this.out_line();

            this.input_box.bind(
                'keypress',
                jQuery.proxy(function(event) { this.keypress(event); }, this)
            );
            this.input_box.bind(
                'keydown',
                jQuery.proxy(function(event) { this.keydown(event) }, this)
            );
            this.input_box.bind(
                "onchange",
                jQuery.proxy(function(event) { this.dbg("change"); }, this)
            );


            this.data('input_box').focus();

            $(window).bind(
                "resize",
                jQuery.proxy(
                    function(event) { this.resize_contents(this.terminal) },
                    this
                )
            );

            this.resize_contents(this.terminal);


        },

        saveCommandHistory : function() {
            this.client.put_file_async(
                this.sessionId,
                "history",
                JSON.stringify(this.commandHistory),
                "/",
                function() {},
                function() {}
            );
        },

        loadCommandHistory : function() {
            this.client.get_file_async(
                this.sessionId,
                "history", "/",
                jQuery.proxy(
                    function (txt) {
                        this.commandHistory = JSON.parse(txt);
                        this.commandHistoryPosition = this.commandHistory.length;
                    },
                    this
                ),
                jQuery.proxy(function (e) {
                    this.dbg("error on history load : " + e);
		    }, this)
            );
        },

        set_session: function(session) {
            this.sessionId = session;
        },

        resize_contents: function($container) {
            //	var newx = window.getSize().y - document.id(footer).getSize().y - 35;
            //	container.style.height = newx;
        },

        keypress: function(event) {

            if (event.which == 13) {
                event.preventDefault();
                var cmd = this.input_box.val();

                // commented out regexes to auto-quote kb| ids
                /*
                cmd = cmd.replace(/ (kb\|[^ ]+)( |$)/g, ' "$1" ');

                cmd = cmd.replace(/([^"])(kb\|[^ "]+)"/g, '$1"$2"');
                cmd = cmd.replace(/"(kb\|[^ "]+)/g, '"$1"');
                cmd = cmd.replace(/"+(kb\|[^ "]+)"+/g, '"$1"');

                cmd = cmd.replace(/([^'])(kb\|[^ ']+)'/g, "$1'$2'");
                cmd = cmd.replace(/'(kb\|[^ ']+)/g, "'$1'");
                cmd = cmd.replace(/'+(kb\|[^ ']+)'+/g, "'$1'");

                cmd = cmd.replace(/"'(kb\|[^ ']+)'"/g, "'$1'");
                */

                cmd = cmd.replace(/^ +/, '');
                cmd = cmd.replace(/ +$/, '');

                this.dbg("Run (" + cmd + ')');
                this.out_cmd(cmd);

                var exception = cmd + cmd; //something that cannot possibly be a match
                var m;
                if (m = cmd.match(/^\s*(\$\S+)/)) {
                    exception = m[1];
                }

                for (variable in this.variables) {
                    if (variable.match(exception)) {
                        continue;
                    }
                    var escapedVar = variable.replace(/\$/, '\\$');
                    var varRegex = new RegExp(escapedVar, 'g');
                    cmd = cmd.replace(varRegex, this.variables[variable]);
                }

                this.run(cmd);
                this.scroll();
                this.input_box.val('');
            }
        },

        keydown: function(event) {

            if (event.which == 38) {
                event.preventDefault();
                if (this.commandHistoryPosition > 0) {
                    this.commandHistoryPosition--;
                }
                this.input_box.val(this.commandHistory[this.commandHistoryPosition]);
            }
            else if (event.which == 40) {
                event.preventDefault();
                if (this.commandHistoryPosition < this.commandHistory.length) {
                    this.commandHistoryPosition++;
                }
                this.input_box.val(this.commandHistory[this.commandHistoryPosition]);
            }
            else if (event.which == 39) {
                if (this.options.commandsElement) {

                    var input_box_length = this.input_box.val().length;
                    var cursorPosition = this.input_box.getCursorPosition();

                    if (cursorPosition != undefined && cursorPosition < input_box_length) {
                        this.selectNextInputVariable(event);
                        return;
                    }

                    event.preventDefault();

                    var toComplete = this.input_box.val().match(/([^\s]+)\s*$/);

                    if (toComplete.length) {
                        toComplete = toComplete[1];

                        var ret = this.options.grammar.evaluate(
                            this.input_box.val()
                        );

                        if (ret != undefined && ret['next'] && ret['next'].length) {

                            var nextRegex = new RegExp('^' + toComplete);

                            var newNext = [];
                            for (var idx = 0; idx < ret['next'].length; idx++) {
                                var n = ret['next'][idx];

                                if (n.match(nextRegex)) {
                                    newNext.push(n);
                                }
                            }
                            if (newNext.length || ret.parsed.length == 0) {
                                ret['next'] = newNext;
                                if (ret['next'].length == 1) {
                                    var toCompleteRegex = new RegExp('\s*' + toComplete + '\s*$');
                                    this.input_box.val(this.input_box.val().replace(toCompleteRegex, ''));
                                }
                            }

                            //this.input_box.val(ret['parsed'] + ' ');

                            if (ret['next'].length == 1) {
                                var pad = ' ';
                                if (this.input_box.val().match(/\s+$/)) {
                                    pad = '';
                                }
                                this.appendInput(pad + ret['next'][0] + ' ', 0);
                                this.selectNextInputVariable();
                                return;
                            }
                            else if (ret['next'].length){

                                var shouldComplete = true;
                                var regex = new RegExp(toComplete + '\\s*$');
                                for (prop in ret.next) {
                                    if (! prop.match(regex)) {
                                        shouldComplete = false;
                                    }
                                }

                                this.displayCompletions(ret['next'], toComplete);//shouldComplete ? toComplete : '', false);
                                return;
                            }
                        }

                        var completions = this.options.commandsElement.kbaseIrisCommands('completeCommand', toComplete);
                        if (completions.length == 1) {
                            var completion = completions[0].replace(new RegExp('^' + toComplete), '');
                            this.appendInput(completion + ' ', 0);
                        }
                        else if (completions.length) {
                            this.displayCompletions(completions, toComplete);
                        }

                    }

                }
            }

        },

        selectNextInputVariable : function(e) {
            var match;

            var pos = this.input_box.getCursorPosition();

            if (match = this.input_box.val().match(/(\$\S+)/)) {
                if (e != undefined) {
                    e.preventDefault();
                }

                var start = this.input_box.val().indexOf(match[1]);
                var end = this.input_box.val().indexOf(match[1]) + match[1].length;
                //this.input_box.focusEnd();
                this.input_box.setSelection(
                    start,
                    end
                );
                this.input_box.setSelection(start, end);
            }
        },

        search_json_to_table : function(json, filter) {

            var $div = $('<div></div>');

            var filterRegex = new RegExp('.');
            if (filter) {
                filterRegex = new RegExp(filter.replace(/,/g,'|'));
            };

            $.each(
                json,
                $.proxy(function(idx, record) {
                    var $tbl = $('<table></table>')
                        .css('border', '1px solid black')
                        .css('margin-bottom', '2px');
                        var keys = Object.keys(record).sort();
                    for (var idx = 0; idx < keys.length; idx++) {
                        var prop = keys[idx];
                        if (prop.match(filterRegex)) {
                            $tbl
                                .append(
                                    $('<tr></tr>')
                                        .css('text-align', 'left')
                                        .append(
                                            $('<th></th>').append(prop)
                                        )
                                        .append(
                                            $('<td></td>').append(record[prop])
                                        )
                                )
                        }
                    }
                    $div.append($tbl);
                }, this)
            );

            return $div;

        },

        displayCompletions : function(completions, toComplete) {
            var prefix = this.options.commandsElement.kbaseIrisCommands('commonCommandPrefix', completions);

            if (prefix != undefined && prefix.length) {
                this.input_box.val(
                    this.input_box.val().replace(new RegExp(toComplete + '\s*$'), prefix)
                );
            }
            else {
                prefix = toComplete;
            }

            var $commandDiv = $('<div></div>');
            this.terminal.append($commandDiv);

            var $tbl = $('<table></table>')
                .attr('border', 1)
                .css('margin-top', '10px')
                .append(
                    $('<tr></tr>')
                        .append(
                            $('<th></th>')
                                .text('Suggested commands')
                        )
                    );
            jQuery.each(
                completions,
                jQuery.proxy(
                    function (idx, val) {
                        $tbl.append(
                            $('<tr></tr>')
                                .append(
                                    $('<td></td>')
                                        .append(
                                            $('<a></a>')
                                                .attr('href', '#')
                                                .text(val)
                                                .bind('click',
                                                    jQuery.proxy(
                                                        function (evt) {
                                                            evt.preventDefault();
                                                            this.input_box.val(
                                                                this.input_box.val().replace(new RegExp(prefix + '\s*$'), '')
                                                            );
                                                            this.appendInput(val + ' ');
                                                        },
                                                        this
                                                    )
                                                )
                                        )
                                    )
                            );
                    },
                    this
                )
            );
            $commandDiv.append($tbl);
            this.scroll();

        },

        out_cmd: function(text) {


            var $wrapperDiv = $('<div></div>')
                .css('white-space', 'pre')
                .css('position', 'relative')
                .append(
                    $('<div></div>')
                        .addClass('btn-group')
                        .css('display', 'none')
                        .css('position', 'absolute')
                        .css('top', '0px')
                        .css('right', '0px')
                        .css('text-align', 'right')
                        .append(
                            $('<a></a>')
                                .addClass('btn btn-mini')
                                .append(
                                    $('<i></i>')
                                        .addClass('icon-download-alt')
                                )
                                .attr('title', 'Open results in new window')
                                .bind('click',
                                    function (e) {
                                        var win = window.open();
                                        win.document.open();
                                        var output =
                                            $('<div></div>')
                                                .append(
                                                    $('<div></div>')
                                                        .css('white-space', 'pre')
                                                        .css('font-family' , 'monospace')
                                                        .append(
                                                            $(this).parent().parent().next().clone()
                                                        )
                                                )
                                        ;
                                        $.each(
                                            output.find('a'),
                                            function (idx, val) {
                                                $(val).replaceWith($(val).html());
                                            }
                                        );

                                        win.document.write(output.html());
                                        win.document.close();
                                    }
                                )
                        )
                        .append(
                            $('<a></a>')
                                .addClass('btn btn-mini')
                                .append(
                                    $('<i></i>')
                                        .addClass('icon-remove')
                                )
                                .attr('title', 'delete command from window')
                                .bind('click',
                                    function (e) {
                                        $(this).parent().parent().next().remove();
                                        $(this).parent().parent().next().remove();
                                        $(this).parent().parent().remove();
                                    }
                                )
                        )
                )
                .append(
                    $('<span></span>')
                        .addClass('command')
                        .text(">" + this.cwd + " " + text)
                )
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
            ;

            this.terminal.append($wrapperDiv);
        },

        // Outputs a line of text
        out: function(text, scroll, html) {
            this.out_to_div(this.terminal, text, scroll, html);
        },

        // Outputs a line of text
        out_to_div : function($div, text, scroll, html) {
            if (!html && typeof text == 'string') {
                text = text.replace(/</g, '&lt;');
                text = text.replace(/>/g, '&gt;');
            }

            $div.append(text);
            if (scroll) {
                this.scroll(0);
            }
        },

        // Outputs a line of text
        out_line: function(text) {
            var $hr = $('<hr/>');
            this.terminal.append($hr);
            this.scroll(0);
        },

        scroll: function(speed) {
            if (speed == undefined) {
                speed = this.options.scrollSpeed;
            }

            this.terminal.animate({scrollTop: this.terminal.prop('scrollHeight') - this.terminal.height()}, speed);
        },

        // Executes a command
        run: function(command) {

            if (command == 'help') {
                this.out('There is an introductory Iris tutorial available <a target="_blank" href="http://kbase.us/developer-zone/tutorials/iris/introduction-to-the-kbase-iris-interface/">on the KBase tutorials website</a>.', 0, 1);
                return;
            }


            var $commandDiv = $('<div></div>').css('white-space', 'pre');
//            $wrapperDiv.append($commandDiv);

            this.terminal.append($commandDiv);

            this.out_line();

            var m;

            if (m = command.match(/^log[io]n\s*(.*)/)) {
                var args = m[1].split(/\s+/);
                this.dbg(args.length);
                if (args.length != 1) {
                    this.out_to_div($commandDiv, "Invalid login syntax.");
                    return;
                }
                sid = args[0];

                //old login code. copy and pasted into iris.html.
                this.client.start_session_async(
                    sid,
                    jQuery.proxy(
                        function (newsid) {
                            this.set_session(sid);
                            this.loadCommandHistory();
                            this.out_to_div($commandDiv, "Set session to " + sid);
                        },
                        this
                    ),
                    jQuery.proxy(
                        function (err) {
                            this.out_to_div($commandDiv, "<i>Error on session_start:<br>" +
                                err.message.replace("\n", "<br>\n") + "</i>");
                        },
                        this
                    )
                );
                this.scroll();
                return;
            }

            if (m = command.match(/^authenticate\s*(.*)/)) {
                var args = m[1].split(/\s+/)
                if (args.length != 1) {
                    this.out_to_div($commandDiv, "Invalid login syntax.");
                    return;
                }
                sid = args[0];

                this.$loginbox.kbaseLogin('data', 'passed_user_id', sid);
                this.$loginbox.data('passed_user_id', sid);

                this.$loginbox.kbaseLogin('openDialog');

                return;
            }

            if (m = command.match(/^unauthenticate/)) {

                this.$loginbox.kbaseLogin('logout');
                this.scroll();
                return;
            }

            if (m = command.match(/^logout/)) {

                this.sessionId = undefined;
                this.scroll();
                return;
            }


            if (! this.sessionId) {
                this.out_to_div($commandDiv, "You are not logged in.");
                this.scroll();
                return;
            }

            this.commandHistory.push(command);
            this.saveCommandHistory();
            this.commandHistoryPosition = this.commandHistory.length;

            if (command == 'clear') {
                this.terminal.empty();
                return;
            }

            if (command == 'history') {
                var $tbl = $('<table></table>');
                jQuery.each(
                    this.commandHistory,
                    jQuery.proxy(
                        function (idx, val) {
                            $tbl.append(
                                $('<tr></tr>')
                                    .append(
                                        $('<td></td>')
                                            .text(idx)
                                    )
                                    .append(
                                        $('<td></td>')
                                            .css('padding-left', '10px')
                                            .append(
                                                $('<a></a>')
                                                    .attr('href', '#')
                                                    .text(val)
                                                    .bind('click',
                                                        jQuery.proxy(
                                                            function (evt) {
                                                                evt.preventDefault();
                                                                this.appendInput(val + ' ');
                                                            },
                                                            this
                                                        )
                                                    )
                                            )
                                    )
                                );
                        },
                        this
                    )
                );

                this.out_to_div($commandDiv, $tbl);
                return;
            }
            else if (m = command.match(/^!(\d+)/)) {
                command = this.commandHistory.item(m[1]);
            }


            if (m = command.match(/^cd\s*(.*)/)) {
                var args = m[1].split(/\s+/)
                if (args.length != 1) {
                    this.out_to_div($commandDiv, "Invalid cd syntax.");
                    return;
                }
                dir = args[0];

                this.client.change_directory_async(
                    this.sessionId,
                    this.cwd,
                    dir,
                        jQuery.proxy(
                            function (path) {
                                this.cwd = path;
                            },
                            this
                        ),
                    jQuery.proxy(
                        function (err) {
                            var m = err.message.replace("/\n", "<br>\n");
                            this.out_to_div($commandDiv, "<i>Error received:<br>" + err.code + "<br>" + m + "</i>");
                        },
                        this
                    )
                );
                return;
            }

            if (m = command.match(/^(\$\S+)\s*=\s*(\S+)/)) {
                this.variables[m[1]] = m[2];
                this.out_to_div($commandDiv, m[1] + ' set to ' + m[2]);
                return;
            }

            if (m = command.match(/^alias\s+(\S+)\s*=\s*(\S+)/)) {
                this.aliases[m[1]] = m[2];
                this.out_to_div($commandDiv, m[1] + ' set to ' + m[2]);
                return;
            }

            if (m = command.match(/^search\s+(\S+)\s+(\S+)(?:\s*(\S+)\s+(\S+)(?:\s*(\S+))?)?/)) {

                var parsed = this.options.grammar.evaluate(command);

                var searchVars = {};
                //'kbase.us/services/search-api/search/$category/$keyword?start=$start&count=$count&format=json',

                var searchURL = this.options.searchURL;

                searchVars.$category = m[1];
                searchVars.$keyword = m[2];
                searchVars.$start = m[3] || this.options.searchStart;
                searchVars.$count = m[4] || this.options.searchCount;
                var filter = m[5] || this.options.searchFilter[searchVars.$category];

                for (prop in searchVars) {
                    searchURL = searchURL.replace(prop, searchVars[prop]);
                }

                $.support.cors = true;
                $.ajax(
                    {
                        type            : "GET",
                        url             : searchURL,
                        dataType        : "json",
                        crossDomain     : true,
                        xhrFields       : { withCredentials: true },
                         xhrFields: {
                            withCredentials: true
                         },
                         beforeSend : function(xhr){
                            // make cross-site requests
                            xhr.withCredentials = true;
                         },
                        success         : $.proxy(
                            function (data,res,jqXHR) {
                                this.out_to_div($commandDiv, $('<i></i>').html("Command completed."));
                                this.out_to_div($commandDiv, $('<br/>'));
                                this.out_to_div($commandDiv,
                                    $('<span></span>')
                                        .append($('<b></b>').html(data.found))
                                        .append(" records found.")
                                );
                                this.out_to_div($commandDiv, $('<br/>'));
                                this.out_to_div($commandDiv, this.search_json_to_table(data.body, filter));
                                var res = this.search_json_to_table(data.body, filter);

                                this.scroll();

                            },
                            this
                        ),
                        error: $.proxy(
                            function (jqXHR, textStatus, errorThrown) {

                                this.out_to_div($commandDiv, errorThrown);

                            }, this
                        ),
                   }
                );

                return;
            }

            if (m = command.match(/^cp\s*(.*)/)) {
                var args = m[1].split(/\s+/)
                if (args.length != 2) {
                    this.out_to_div($commandDiv, "Invalid cp syntax.");
                    return;
                }
                from = args[0];
                to   = args[1];
                this.client.copy_async(
                    this.sessionId,
                    this.cwd,
                    from,
                    to,
                    $.proxy(
                        function () {
                            this.refreshFileBrowser();
                        },this
                    ),
                    jQuery.proxy(
                        function (err) {
                            var m = err.message.replace("\n", "<br>\n");
                            this.out_to_div($commandDiv, "<i>Error received:<br>" + err.code + "<br>" + m + "</i>");
                        },
                        this
                    )
                );
                return;
            }
            if (m = command.match(/^mv\s*(.*)/)) {
                var args = m[1].split(/\s+/)
                if (args.length != 2) {
                    this.out_to_div($commandDiv, "Invalid mv syntax.");
                    return;
                }

                from = args[0];
                to   = args[1];
                this.client.rename_file_async(
                    this.sessionId,
                    this.cwd,
                    from,
                    to,
                    $.proxy(
                        function () {
                            this.refreshFileBrowser();
                        },this
                    ),
                    jQuery.proxy(
                        function (err) {
                            var m = err.message.replace("\n", "<br>\n");
                            this.out_to_div($commandDiv, "<i>Error received:<br>" + err.code + "<br>" + m + "</i>");
                        },
                        this
                    ));
                return;
            }

            if (m = command.match(/^mkdir\s*(.*)/)) {
                var args = m[1].split(/\s+/)
                if (args.length != 1){
                    this.out_to_div($commandDiv, "Invalid mkdir syntax.");
                    return;
                }
                dir = args[0];
                this.client.make_directory_async(
                    this.sessionId,
                    this.cwd,
                    dir,
                    $.proxy(
                        function () {
                            this.refreshFileBrowser();
                        },this
                    ),
                    jQuery.proxy(
                        function (err) {
                            var m = err.message.replace("\n", "<br>\n");
                            this.out_to_div($commandDiv, "<i>Error received:<br>" + err.code + "<br>" + m + "</i>");
                        },
                        this
                    )
                );
                return;
            }

            if (m = command.match(/^rmdir\s*(.*)/)) {
                var args = m[1].split(/\s+/)
                if (args.length != 1) {
                    this.out_to_div($commandDiv, "Invalid rmdir syntax.");
                    return;
                }
                dir = args[0];
                this.client.remove_directory_async(
                    this.sessionId,
                    this.cwd,
                    dir,
                    $.proxy(
                        function () {
                            this.refreshFileBrowser();
                        },this
                    ),
                    jQuery.proxy(
                        function (err) {
                            var m = err.message.replace("\n", "<br>\n");
                            this.out_to_div($commandDiv, "<i>Error received:<br>" + err.code + "<br>" + m + "</i>");
                        },
                        this
                    )
                );
                return;
            }

            if (m = command.match(/^rm\s*(.*)/)) {
                var args = m[1].split(/\s+/)
                if (args.length != 1) {
                    this.out_to_div($commandDiv, "Invalid rm syntax.");
                    return;
                }
                file = args[0];
                this.client.remove_files_async(
                    this.sessionId,
                    this.cwd,
                    file,
                    $.proxy(
                        function () {
                            this.refreshFileBrowser();
                        },this
                    ),
                    jQuery.proxy(
                        function (err) {
                            var m = err.message.replace("\n", "<br>\n");
                            this.out_to_div($commandDiv, "<i>Error received:<br>" + err.code + "<br>" + m + "</i>");
                        },
                        this
                    )
                );
                return;
            }

            if (command == "next") {
                this.tutorial.goToNextPage();
                command = "show_tutorial";
            }

            if (command == "back") {
                this.tutorial.goToPrevPage();
                command = "show_tutorial";
            }

            if (command == "tutorial") {
                this.tutorial.currentPage = 0;
                command = "show_tutorial";
            }

            if (command == 'tutorial list') {
                var list = this.tutorial.list();
                $.each(
                    list,
                    $.proxy( function (idx, val) {
                        $commandDiv.append(
                            $('<a></a>')
                                .attr('href', '#')
                                .append(val)
                                .bind('click', $.proxy( function (e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    this.out_to_div($commandDiv, 'Set tutorial to <i>' + val + '</i><br>', 0, 1);
                                    this.tutorial = $('<div></div>').kbaseIrisTutorial({tutorial : val});
                                    this.input_box.focus();
                                }, this))
                            .append('<br>')
                        );

                    }, this)
                );
                //this.out_to_div($commandDiv, output, 0, 1);
                this.scroll();
                return;
            }

            if (command == 'show_tutorial') {
                var $page = this.tutorial.contentForCurrentPage().clone();
                var headerCSS = { 'text-align' : 'left', 'font-size' : '100%' };
                $page.find('h1').css( headerCSS );
                $page.find('h2').css( headerCSS );
                if (this.tutorial.currentPage > 0) {
                    $page.append("<br>Type <i>back</i> to move to the previous step in the tutorial.");
                }
                if (this.tutorial.currentPage < this.tutorial.pages.length - 1) {
                    $page.append("<br>Type <i>next</i> to move to the next step in the tutorial.");
                }
                $page.append("<br>Type <i>tutorial list</i> to see available tutorials.");

                $commandDiv.css('white-space', '');
                this.out_to_div($commandDiv, $page, 0, 1);
                this.scroll();

                return;
            }

            if (command == 'commands') {
                this.client.valid_commands_async(
                    jQuery.proxy(
                        function (cmds) {
                            var $tbl = $('<table></table>');
                            jQuery.each(
                                cmds,
                                function (idx, group) {
                                    $tbl.append(
                                        $('<tr></tr>')
                                            .append(
                                                $('<th></th>')
                                                    .attr('colspan', 2)
                                                    .html(group.title)
                                                )
                                        );

                                    for (var ri = 0; ri < group.items.length; ri += 2) {
                                        $tbl.append(
                                            $('<tr></tr>')
                                                .append(
                                                    $('<td></td>')
                                                        .html(group.items[ri].cmd)
                                                    )
                                                .append(
                                                    $('<td></td>')
                                                        .html(
                                                            group.items[ri + 1] != undefined
                                                                ? group.items[ri + 1].cmd
                                                                : ''
                                                        )
                                                    )
                                            );
                                    }
                                }
                            );
                            $commandDiv.append($tbl);
                            this.scroll();

                        },
                       this
                    )
                );
                return;
            }

            if (m = command.match(/^questions\s*(\S+)?/)) {

                var questions = this.options.grammar.allQuestions(m[1]);
                var $tbl = $('<table></table>');
                $.each(
                    questions,
                    $.proxy(function (idx, question) {
                        $tbl.append(
                            $('<tr></tr>')
                                .append(
                                    $('<td></td>')
                                        .append(
                                            $('<a></a>')
                                                .attr('href', '#')
                                                .text(question)
                                                .bind('click',
                                                    jQuery.proxy(
                                                        function (evt) {
                                                            evt.preventDefault();
                                                            this.input_box.val(question);
                                                            this.selectNextInputVariable();
                                                        },
                                                        this
                                                    )
                                                )
                                        )
                                    )
                            );
                    }, this)
                );
                $commandDiv.append($tbl);
                this.scroll();

                return;
            }

            if (d = command.match(/^ls\s*(.*)/)) {
                var args = d[1].split(/\s+/)
                var obj = this;
                if (args.length == 0) {
                    d = ".";
                }
                else {
                    if (args.length != 1) {
                        this.out_to_div($commandDiv, "Invalid ls syntax.");
                        return;
                    }
                    else {
                        d = args[0];
                    }
                }

                this.client.list_files_async(
                    this.sessionId,
                    this.cwd,
                    d,
                    jQuery.proxy(
                        function (filelist) {
                            var dirs = filelist[0];
                            var files = filelist[1];

                            var $tbl = $('<table></table>')
                                //.attr('border', 1);

                            jQuery.each(
                                dirs,
                                function (idx, val) {
                                    $tbl.append(
                                        $('<tr></tr>')
                                            .append(
                                                $('<td></td>')
                                                    .text('0')
                                                )
                                            .append(
                                                $('<td></td>')
                                                    .html(val['mod_date'])
                                                )
                                            .append(
                                                $('<td></td>')
                                                    .html(val['name'])
                                                )
                                        );
                                }
                            );

                            jQuery.each(
                                files,
                                jQuery.proxy(
                                    function (idx, val) {
                                        var url = this.options.invocationURL + "/download/" + val['full_path'] + "?session_id=" + this.sessionId;
                                        $tbl.append(
                                            $('<tr></tr>')
                                                .append(
                                                    $('<td></td>')
                                                        .text(val['size'])
                                                    )
                                                .append(
                                                    $('<td></td>')
                                                        .html(val['mod_date'])
                                                    )
                                                .append(
                                                    $('<td></td>')
                                                        .append(
                                                            $('<a></a>')
                                                                .text(val['name'])
                                                                //uncomment these two lines to click and open in new window
                                                                //.attr('href', url)
                                                                //.attr('target', '_blank')
                                                                //comment out this block if you don't want the clicks to pop up via the api
                                                                //*
                                                                .attr('href', '#')
                                                                .bind(
                                                                    'click',
                                                                    jQuery.proxy(
                                                                        function (event) {
                                                                            event.preventDefault();
                                                                            this.open_file(val['full_path']);
                                                                        },
                                                                        this
                                                                    )
                                                                )
                                                                //*/
                                                            )
                                                    )
                                            );
                                    },
                                    this
                                )
                            );

                            $commandDiv.append($tbl);
                            this.scroll();
                         },
                         this
                     ),
                     function (err)
                     {
                         var m = err.message.replace("\n", "<br>\n");
                         obj.out_to_div($commandDiv, "<i>Error received:<br>" + err.code + "<br>" + m + "</i>");
                     }
                    );
                return;
            }

            var parsed = this.options.grammar.evaluate(command);

            if (parsed != undefined) {
                if (! parsed.fail && parsed.execute) {
                    command = parsed.execute;

                    if (parsed.explain) {
                        $commandDiv.append(parsed.execute);
                        return;
                    }

                }
                else if (parsed.parsed.length && parsed.fail) {
                    $commandDiv.append($('<i></i>').html(parsed.error));
                    return;
                }
            }

            command = command.replace(/\\\n/g, " ");
            command = command.replace(/\n/g, " ");

            var $pendingProcessElem;

            if (this.data('processList')) {
                $pendingProcessElem = this.data('processList').addProcess(command);
            }

            this.client.run_pipeline_async(
                this.sessionId,
                command,
                [],
                this.options.maxOutput,
                this.cwd,
                jQuery.proxy(
                    function (runout) {

                        if (this.data('processList')) {
                            this.data('processList').removeProcess($pendingProcessElem);
                        }

                        if (runout) {
                            var output = runout[0];
                            var error  = runout[1];

                            this.refreshFileBrowser();

                            if (output.length > 0 && output[0].indexOf("\t") >= 0) {

                                var $tbl = $('<table></table>')
                                    //.attr('border', 1);

                                jQuery.each(
                                    output,
                                    jQuery.proxy(
                                        function (idx, val) {
                                            var parts = val.split(/\t/);
                                            var $row = $('<tr></tr>')
                                            jQuery.each(
                                                parts,
                                                jQuery.proxy(
                                                    function (idx, val) {
                                                        $row.append(
                                                            $('<td></td>')
                                                                .html(val)
                                                            );
                                                        if (idx > 0) {
                                                            $row.children().last().css('padding-left', '15px')
                                                        }
                                                        if (idx < parts.length - 1) {
                                                            $row.children().last().css('padding-right', '15px')
                                                        }
                                                    },
                                                    this
                                                )
                                            );
                                            $tbl.append($row);
                                        },
                                        this
                                    )
                                );
                                $commandDiv.append($tbl);
                            }
                            else {
                                jQuery.each(
                                    output,
                                    jQuery.proxy(
                                        function (idx, val) {
                                            this.out_to_div($commandDiv, val, 0);
                                        },
                                        this
                                    )
                                );

                                if (error.length) {
                                    jQuery.each(
                                        error,
                                        jQuery.proxy(
                                            function (idx, val) {
                                                this.out_to_div($commandDiv, $('<i></i>').html(val));
                                            },
                                            this
                                        )
                                    );
                                }
                                else {
                                    this.out_to_div($commandDiv, $('<i></i>').html("Command completed."));
                                }
                            }
                        }
                        else {
                            this.out_to_div($commandDiv, "Error running command.");
                        }
                        this.scroll();
                    },
                    this
                )
            );
        }

    });

}( jQuery ) );
/*

*/

(function( $, undefined ) {


    $.KBWidget("kbaseIrisTutorial", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            default : 'How to annotate a genome',
        },

        dispatch : {
            'How to annotate a genome' : 'http://www.prototypesite.net/iris-dev/annotate_genome.html',
            'How to create an IRIS tutorial' : 'tutorial_tutorial.html',
            'Constructing RAST2 in the IRIS Environment': 'rast2.html',
        },

        list : function() {
            var output = [];
            for (key in this.dispatch) {
                output.push(key);
            }

            return output.sort();
        },

        init : function (options) {
            this._super(options);

            if (this.options.tutorial == undefined) {
                this.options.tutorial = this.options.default;
            }

            this.retrieveTutorial(this.options.tutorial);

            this.pages = [];
            this.currentPage = -1;

            return this;
        },

        retrieveTutorial : function(tutorial) {

            var url = this.dispatch[tutorial];

            this.pages = [];

            var token = undefined;

            $.ajax(
                {
    		        async : true,
            		dataType: "text",
            		url: url,
            		crossDomain : true,
            		beforeSend: function (xhr) {
		                if (token) {
                			xhr.setRequestHeader('Authorization', token);
		                }
            		},
            		success: $.proxy(function (data, status, xhr) {
            		    var $resp = $('<div></div>').append(data);
            		    $resp = $resp.find('#tutorial');
            		    $resp.find('a').attr('target', '_blank');
            		    var children = $resp.children();
            		    this.$title = $(children[0]);
            		    this.$summary = $(children[1]);
            		    var $pages = $(children[2]);

            		    this.pages.push(
            		        {
            		            title   : this.$title,
            		            content : this.$summary
            		        }
            		    );

            		    $.each(
            		        $pages.children(),
            		        $.proxy(function (idx, page) {
            		            var $head = $(page).find('h2');
            		            var $content = $(page).find('div');
            		            $(page).find('.example').remove();
            		            /*$.each(
            		                $(page).find('pre'),
            		                function (idx, pre) {
            		                    var html = $(pre).html();
            		                    html = html.replace(/^\s+/mg, '');
            		                    $(pre).html(html);
            		                }
            		            );*/
            		            $head.remove();
            		            this.pages.push(
            		                {
            		                    title   : $head,
            		                    content : $(page)
            		                }
            		            );
            		        }, this)
            		    );
            		    this.renderAsHTML();
		            }, this),
            		error: $.proxy(function(xhr, textStatus, errorThrown) {
                        throw xhr;
		            }, this),
                    type: 'GET',
    	        }
    	    );

        },

        renderAsHTML : function() {
            this.$elem.empty();
            this.$elem.append(this.$title);
            this.$elem.append(this.$summary);
            $.each(
                this.pages,
                $.proxy(function (idx, val) {
                    this.$elem.append(val.title);
                    this.$elem.append(val.content);
                }, this)
            );
        },

        lastPage : function() {
            return this.pages.length - 1;
        },

        currentPage : function() {
            page = this.currentPage;
            if (this.currentPage < 0) {
                page = 0;
            }
            return this.pages[page];
        },

        goToPrevPage : function () {
            var page = this.currentPage - 1;
            if (page < 0) {
                page = 0;
            }
            this.currentPage = page;
            return page;
        },

        goToNextPage : function () {
            var page = this.currentPage + 1;
            if (page >= this.pages.length) {
                page = this.pages.length - 1;
            }
            this.currentPage = page;
            return page;
        },

        contentForPage : function(idx) {
            return $('<div></div>')
                .append(this.pages[this.currentPage].title)
                .append(this.pages[this.currentPage].content);
        },

        contentForCurrentPage : function () {
            return this.contentForPage(this.currentPage);
        },

    });

}( jQuery ) );
/*


*/

(function( $, undefined ) {


    $.KBWidget("kbaseWorkspaceBrowser", 'kbaseFileBrowser', {
        version: "1.0.0",
        options: {
            name : 'Workspace Browser',
            workspace : 'chenrydemo',
            selectWorkspace : true,
        },

        init : function(options) {

            options.controlButtons = ['deleteButton', 'viewButton', 'uploadButton', 'addButton'];

            this._super(options);

            if (this.options.wsClient != undefined) {
                this.wsClient = this.options.wsClient;
            }

            if (this.options.workspace != undefined) {
                this.workspace = this.options.workspace;
            }

            this.listWorkspaces();

            return this;

        },

        token : function() {
            var token = this.$loginbox.get_kbase_cookie('token');
            return token;
        },

        selected : function( path ) {
            var workspace = this.data('workspace-select').val();
            var $option = this.data('workspace-select').find(':selected');

            if ($option.data('perm') != 'a') {
                this.deleteButton().addClass('disabled');
            }
        },

        refreshDirectory : function(path) {
            this.listWorkspaces();
        },

        listDirectory : function (path, $ul) {

            if (path == this.workspace) {
                this.wsClient.list_workspace_objects_async(
                    {
                        workspace           : path,
                        auth       : this.token(),
                        showDeletedObject   : false,
                    },
                    $.proxy ( function(res) {
                        var files = [];
                        this.meta = {};
                        $.each(
                            res,
                            $.proxy( function (idx, val) {
                                files.push({
                                    name : val[0],
                                    path : val[0],
                                    type : val[3] == 0 ? 'file' : 'directory'
                                });

                                this.meta[val[0]] = {
                                    name    : val[0],
                                    version : val[3],
                                    type    : val[1],
                                };

                            }, this)
                        );

                        this.displayPath('/', $ul, files.sort(this.sortByName));
                    }, this)
                )
            }
            else if (this.workspace) {

                var files = [];
                var version = this.meta[path].version;
                for (var i = version; i >= 0; i--) {
                    files.push({
                        name : 'Revision ' + i,
                        path : path,
                        type : 'file',
                        meta : {
                            version : i
                        }
                    });
                }

                this.displayPath('path', $ul, files);

            }
        },

        /*makeDirectoryCallback : function (dir, parentDir) {

        },*/

        viewButton : function() {
            var $viewButton = this._super();
            $viewButton.data('require', 'a');
            $viewButton.unbind('click');
            $viewButton.bind('click',
                $.proxy( function(e) {
                    e.preventDefault();
                    if (! this.viewButton().hasClass('disabled')) {
                        var file = this.data('activeFile');
                        if (file == undefined) {
                            file = this.data('activeDirectory');
                        }

                        this.openFile( file );
                    }
                }, this)
            );
            return $viewButton;
        },

        addButton : function() {
            var $addButton = this._super();
            $addButton.data('require', 'a');
            $addButton.unbind('click');
            $addButton.bind('click',
                $.proxy( function(e) {
                    e.preventDefault();
                    if (! this.addButton().hasClass('disabled')) {
                        var file = this.data('activeFile');
                        if (file == undefined) {
                            file = this.data('activeDirectory');
                        }

                        this.options.addFileCallback( file );
                    }
                }, this)
            );
            return $addButton;
        },

        stringify : function(key, val) {
            if (typeof val == 'array') {
                val = val.join(", ");
            }
            else if (typeof val != 'string') {
                val = this.stringify(val);
            }

            return key + ' : ' + val;
        },

        fetchContent : function(file, win) {

            var $opened = this.$elem.find('.active');

            var params = {
                type : this.meta[file].type,
                workspace : this.workspace,
                id : file,
            };

            if (meta = $opened.data('meta')) {
                params.instance = meta.version;
            }

            this.wsClient.get_object_async(
                params,
                $.proxy(
                    function(res) {
                        try {
                            if (typeof res.data == 'string') {
                                res = res.data;
                            }
                            else {
                                var jsonStr = JSON.stringify(res.data, undefined, 2);
                                res = jsonStr;
                            }
                        }
                        catch(e) {
                            this.dbg("FAILURE");
                            this.dbg(e);
                            res = res.data;
                        }

                        /*if (typeof res != 'string') {
                            var output = '';
                            for (prop in res) {
                                output += this.stringify(prop, res[prop]);
                            }
                            res = output;
                        }*/

                        this.openFile(file, res, win);
                    }, this),
                $.proxy (function(res) {
                    win.close();
                    var $errorModal = $('<div></div>').kbaseErrorPrompt(
                        {
                            title : 'Fetch failed',
                            message : res.message
                        }
                    );
                    $errorModal.openPrompt();
                }, this)

            );
        },

        deleteFileCallback : function(file, active_dir) {
            if (this.workspace == undefined) {

            }
            else {
                this.wsClient.delete_object_async(
                    {
                        type : 'Unspecified',
                        workspace : this.workspace,
                        id : file,
                        auth       : this.token(),
                    },
                    $.proxy (function(res) {
                        this.listDirectory(this.workspace, this.data('ul-nav'));
                    }, this),
                    $.proxy (function(res) {
                        var $errorModal = $('<div></div>').kbaseErrorPrompt(
                            {
                                title : 'Deletion failed',
                                message : res.message
                            }
                        );
                        $errorModal.openPrompt();
                    }, this)

                );
            }
        },

        /*deleteDirectoryCallback : function(file, active_dir) {

        },*/

        uploadFile : function(name, content, upload_dir, $processElem) {
            if (this.workspace == undefined) {

            }
            else {
                this.wsClient.save_object_async(
                    {
                        type : 'Unspecified',
                        workspace : this.workspace,
                        id : name,
                        data : content,
                        auth       : this.token(),
                    },
                    $.proxy (function(res) {
                        if (this.options.processList) {
                            this.options.processList.removeProcess($processElem);
                        }
                        this.listDirectory(this.workspace, this.data('ul-nav'));
                    }, this),
                    $.proxy (function(res) {
                        if (this.options.processList) {
                            this.options.processList.removeProcess($processElem);
                        }
                        var $errorModal = $('<div></div>').kbaseErrorPrompt(
                            {
                                title : 'Creation failed',
                                message : res.message
                            }
                        );
                        $errorModal.openPrompt();
                    }, this)

                );
            }
        },

        createWorkspace : function() {
            var $addWorkspaceModal = $('<div></div>').kbasePrompt(
                {
                    title : 'Create workspace',
                    body : $('<p></p>')
                            .append('Create workspace ')
                            .append(' ')
                            .append(
                                $('<input></input>')
                                    .attr('type', 'text')
                                    .attr('name', 'ws_name')
                                    .attr('size', '20')
                            )
                    ,
                    controls : [
                        'cancelButton',
                        {
                            name : 'Create workspace',
                            type : 'primary',
                            callback : $.proxy(function(e, $prompt) {
                                $prompt.closePrompt();
                                //that.makeDirectoryCallback($addDirectoryModal.dialogModal().find('input').val(), parentDir);
                                this.wsClient.create_workspace_async(
                                    {
                                        workspace           : $addWorkspaceModal.dialogModal().find('input').val(),
                                        permission          : 'a',
                                        auth       : this.token(),
                                    },
                                    $.proxy( function(res) {
                                        this.workspace =   $addWorkspaceModal.dialogModal().find('input').val();
                                        this.listWorkspaces();
                                    }, this),
                                    $.proxy(function(res) {
                                        var $errorModal = $('<div></div>').kbaseErrorPrompt(
                                            {
                                                title : 'Creation failed',
                                                message : res.message
                                            }
                                        );
                                        $errorModal.openPrompt();
                                    }, this)
                                );
                            }, this)
                        }
                    ]
                }
            );

            $addWorkspaceModal.openPrompt();
        },

        deleteWorkspace : function() {
            var $deleteModal = $('<div></div>').kbaseDeletePrompt(
                {
                    name : this.data('workspace-select').val(),
                    callback : $.proxy(function(e, $prompt) {
                        $prompt.closePrompt();
                        this.deleteWorkspaceCallback(this.data('workspace-select').val());
                    }, this)
                }
            );
            $deleteModal.openPrompt();
        },

        deleteWorkspaceCallback : function (ws) {

            this.wsClient.delete_workspace_async(
                {
                    workspace  : ws,
                    auth       : this.token(),
                },
                $.proxy( function(res) {
                    this.listWorkspaces();
                }, this),
                $.proxy(function(res) {

                    var $errorModal = $('<div></div>').kbaseErrorPrompt(
                        {
                            title : 'deletion failed',
                            message : res.message
                        }
                    );
                    $errorModal.openPrompt();
                }, this)
            );

        },

        fileBrowserContainer : function() {

            var superContainer = this._super('fileBrowserContainer');

            if (this.options.selectWorkspace) {
                superContainer.prepend(
                    $('<div></div>')
                        .addClass('btn-toolbar')
                        .addClass('text-left')
                        .css('width', '100%')
                        .append(
                            $('<div></div>')
                                .addClass('input-append')
                                .attr('id', 'workspace-controls')
                                .append(
                                    $('<select></select>')
                                        .css('height', '22px')
                                        .css('width', '254px')
                                        .attr('id', 'workspace-select')
                                        .bind('change', $.proxy ( function(e) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            this.workspace = undefined;
                                            var workspace = this.data('workspace-select').val();
                                            var $option = this.data('workspace-select').find(':selected');

                                            if ($option.data('perm') != 'a') {
                                                this.data('deleteWorkspace-button').addClass('disabled');
                                            }
                                            else {
                                                this.data('deleteWorkspace-button').removeClass('disabled');
                                            }

                                            if (workspace != '--- choose workspace ---') {
                                                this.workspace = workspace;
                                                this.listDirectory(workspace, this.data('ul-nav'));
                                            }
                                        }, this))
                                )
                                .append(
                                    $('<button></button>')
                                        .addClass('btn btn-mini')
                                        .attr('id', 'deleteWorkspace-button')
                                        .append( $('<i></i>').addClass('icon-minus') )
                                        .bind('click', $.proxy( function(e) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (! this.data('deleteWorkspace-button').hasClass('disabled')) {
                                                this.deleteWorkspace();
                                            }
                                        }, this))
                                )
                                .append(
                                    $('<button></button>')
                                        .addClass('btn btn-mini')
                                        .attr('id', 'createWorkspace-button')
                                        .append( $('<i></i>').addClass('icon-plus') )
                                        .bind('click', $.proxy( function(e) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            this.createWorkspace();
                                        }, this))
                                )
                        )
                );
            }

            this._rewireIds(superContainer, this);

            return superContainer;
        },

        listWorkspaces : function() {

            this.wsClient.list_workspaces_async(
                {'auth' : this.token()},
                $.proxy( function (res) {
                    var workspaces = [];
                    $.each(
                        res,
                        $.proxy(function (idx, val) {
                            workspaces.push(
                                {
                                    name : val[0],
                                    perm : val[4]
                                }
                            );
                        }, this)
                    );

                    var perm;

                    workspaces = workspaces.sort(this.sortByName);
                    if (this.data('workspace-select') != undefined) {
                        this.data('workspace-select').empty();
                        this.data('workspace-select').append(
                            $('<option></option>')
                                .append(' --- choose workspace --- ')
                                .attr('val', '')
                        );
                        $.each(
                            workspaces,
                            $.proxy (function (idx, val) {

                                var $option = $('<option></option>')
                                    .append(val.name)
                                    .attr('value', val.name)
                                    .data('perm', val.perm);
                                if (val.name == this.workspace) {
                                   perm = val.perm;
                                }

                                this.data('workspace-select').append($option);

                            }, this)
                        );
                    }

                    if (this.workspace) {
                        this.data('workspace-select').val(this.workspace);
                        this.listDirectory(this.workspace, this.data('ul-nav'));
                    }
                    if (perm != 'a') {
                        this.data('deleteWorkspace-button').addClass('disabled');
                    }


                }, this)
            );
        },

    });

}( jQuery ) );
