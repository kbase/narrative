/**
 * @class KBWidget
 *
 * A KBase widget. Lorem ipsum dolor sit amet, consectetur adipisicing elit,
 * sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
 * ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
 * ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
 * velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
 * cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
 * est laborum.
 *
 * And here's an example:
 *
 *     @example
 *     var widget = $.KBWidget({
 *         name: "MyFancyWidget",
 *         parent: "MommyWidget",
 *         init: function () {}
 *     });
 */
(function( $, undefined) {
    var KBase;
    var ucfirst = function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    var willChangeNoteForName = function(name) {
        return 'willChangeValueFor' + ucfirst(name);
    }

    var didChangeNoteForName = function(name) {
        return 'didChangeValueFor' + ucfirst(name);
    }

    var defaultBindingAccessors = function(elem) {
        var tagName = $(elem).prop('tagName').toLowerCase();

        if (tagName.match(/^(input|select|textarea)$/)) {
            if ($(elem).attr('type') == 'checkbox') {
                return {
                    setter : 'checked',
                    getter : 'checked'
                }
            }
            else {
                return {
                        setter : 'val',
                        getter : 'val'
                    }
            }
        }
        else {
            return {
                    setter : 'text',
                    getter : 'text'
                }
        }
    };

    makeBindingCallback = function(elem, $target, attribute, transformers, accessors) {

        return $.proxy(function (e, vals) {
            e.preventDefault();
            e.stopPropagation();

            var newVal = vals.newValue;

            if (transformers.transformedValue != undefined) {
                newVal = transformers.transformedValue(newVal);
            }

            if (accessors.setter == 'checked') {
                $(elem).attr(accessors.setter, newVal);
            }
            else {
                $(elem)[accessors.setter](newVal);
            }

        }, $(elem))
    };

    makeBindingBlurCallback = function(elem, $target, attribute, transformers, accessors) {

        return $.proxy(function (e, vals) {

            if (e.type == 'keypress' && e.which != 13) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            var newVal;

            if (accessors.getter == 'checked') {
                newVal = this.is(':checked')
                    ? true
                    : false;
            }
            else {
                newVal = this[accessors.getter]();
            }

            if (newVal != this.data('kbase_bindingValue')) {

                if (transformers.validator != undefined) {
                    var validation = transformers.validator(newVal);

                    if (! validation.success) {
                        $(elem).data('validationError.kbaseBinding', validation.msg);
                        this.popover(
                            {
                                placement   : 'right',
                                title       : 'Validation error',
                                content     : $.proxy( function () { return this.data('validationError.kbaseBinding') }, $(elem)),
                                trigger     : 'manual',
                                html        : true,
                            }
                        );

                        this.popover('show');
                        return;
                    }
                    else {
                        $(elem).popover('hide');
                        if (validation.newVal) {
                            newVal = validation.newVal;
                        }
                    }
                }

                if (transformers.reverseTransformedValue != undefined) {
                    newVal = transformers.reverseTransformedValue(newVal);
                }

                var setter = $target.__attributes[attribute].setter;

                $target[setter](newVal);
            }

        }, $(elem))
    };

    makeBindingFocusCallback = function(elem, transformers, accessors) {

        return $.proxy( function (e) {
            e.preventDefault();
            e.stopPropagation();

            this.data('kbase_bindingValue', this[accessors.getter]());

        }, $(elem));

    };

    $.fn.kb_bind = function($target, attribute, transformers, accessors) {

        if (this.length > 1) {
            var methodArgs = arguments;
            $.each(
                this,
                function (idx, elem) {
                    $.fn.kb_bind.apply($(elem), methodArgs);
                }
            )
            return this;
        }

        if (accessors == undefined) {
            accessors = defaultBindingAccessors(this);
        }

        if (transformers == undefined) {
            transformers = {};
        }

        var event = didChangeNoteForName(attribute);
        $target.on(
            event,
            makeBindingCallback(this, $target, attribute, transformers, accessors)
        );

        $(this).on(
            'blur.kbaseBinding',
            makeBindingBlurCallback(this, $target, attribute, transformers, accessors)
        );

        $(this).on(
            'focus.kbaseBinding',
            makeBindingFocusCallback(this, transformers, accessors)
        );

        var tagName = $(this).prop('tagName').toLowerCase();
        if (tagName.match(/^(input)$/)) {
            $(this).on(
                'keypress.kbaseBinding',
                makeBindingBlurCallback(this, $target, attribute, transformers, accessors)
            )

            if ($(this).attr('type') == 'checkbox') {
                $(this).on(
                    'change.kbaseBinding',
                    makeBindingBlurCallback(this, $target, attribute, transformers, accessors)
                )
            }
        }

        var target_getter = $target.__attributes[attribute].getter;
        var newVal = $target[target_getter]();

        if (transformers.transformedValue != undefined) {
            newVal = transformers.transformedValue(newVal);
        }

        if (accessors.setter == 'checked') {
            $(this).attr(accessors.setter, newVal);
        }
        else {
            $(this)[accessors.setter](newVal);
        }

        return this;
    };

    $.fn.kb_unbind = function($target, attribute, callback, transformers, accessors) {

        if (this.length > 1) {
            var methodArgs = arguments;
            $.each(
                this,
                function (idx, elem) {
                    $.fn.kb_unbind.apply($(elem), methodArgs);
                }
            )
            return this;
        }

        if (accessors == undefined) {
            accessors = defaultBindingAccessors(this);
        }

        if (transformers == undefined) {
            transformers = {};
        }

        var event = didChangeNoteForName(attribute);
        $target.off(
            event,
            makeBindingCallback(this, $target, attribute, transformers, accessors)
        );

        $(this).off(
            'blur.kbaseBinding',
            makeBindingBlurCallback(this, $target, attribute, transformers, accessors)
        );

        $(this).off(
            'focus.kbaseBinding',
            makeBindingBlurCallback(this, transformers, accessors)
        );


        var tagName = $(this).prop('tagName').toLowerCase();
        if (tagName.match(/^(input)$/)) {
            $(this).off(
                'keypress.kbaseBinding',
                makeBindingEnterCallback(this, $target, attribute, transformers, accessors)
            )
            if ($(this).attr('type') == 'checkbox') {
                $(this).off(
                    'change.kbaseBinding',
                    makeBindingBlurCallback(this, $target, attribute, transformers, accessors)
                )
            }
        }

        return this;

    };


    var widgetRegistry = {};
    if (KBase === undefined) {
        KBase = window.KBase = {
            _functions : {

                getter :
                    function(name) {
                        return function() {
                            return this.valueForKey(name);
                        }
                    },

                setter :
                    function (name) {
                        return function (newVal) {
                            return this.setValueForKey(name, newVal);
                        }
                    },

                getter_setter :
                    function (name) {

                        return function(newVal) {
                            if (arguments.length == 1) {
                                return this.setValueForKey(name, newVal);
                            }
                            else {
                                return this.valueForKey(name);
                            }
                        }
                    },
            }
        }
    }

    function subclass(constructor, superConstructor) {
        function surrogateConstructor(){}

        surrogateConstructor.prototype = superConstructor.prototype;

        var prototypeObject = new surrogateConstructor();
        prototypeObject.constructor = constructor;

        constructor.prototype = prototypeObject;
    }

    $.jqElem = function (tagName) {
        var tag = "<" + tagName + ">";
        if (! tag.match(/^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track)/) ) {
            tag += '</' + tagName + '>';
        }
        return $(tag);
    }

    $.KBObject = function(def) {
        if (def.asPlugin == undefined) {
            def.asPlugin = false;
        }

        return $.KBWidget(def);
    }

    $.KBWidget = function(def) {

        var name    = def.name;
        var parent  = def.parent;

        if (parent == undefined) {
            parent = 'kbaseWidget';
        }

        var asPlugin= def.asPlugin;
        if (asPlugin == undefined) {
            asPlugin = true;
        }

        //if (widgetRegistry[name] != undefined) {
        //    //throw "Cannot re-register widget: " + name;
        //    return;
        //}

        var Widget = function($elem) {
            this.$elem = $elem;
            this.options = $.extend(true, {}, def.options, this.constructor.prototype.options);
            return this;
        }

        var directName = name;
        directName = directName.replace(/^kbase/, '');
        directName = directName.charAt(0).toLowerCase() + directName.slice(1);

        KBase[directName] = function (options, $elem) {
            var $w = new Widget();
            if ($elem == undefined) {
                $elem = $.jqElem('div');
            }
            $w.$elem = $elem;
            $w.init(options);
            $w._init = true;
            $w.trigger('initialized');
            return $w;
        }

        widgetRegistry[name] = Widget;

        if (def == undefined) {
            def = parent;
            parent = 'kbaseWidget';
            if (def == undefined) {
                def = {};
            }
        }

        if (parent) {
            subclass(Widget, widgetRegistry[parent]);
        }

        var defCopy = $.extend(true, {}, def);

        Widget.prototype.__attributes = {};

        if (defCopy._accessors != undefined) {

            //for (var accessor in defCopy._accessors) {
            $.each(
                defCopy._accessors,
                $.proxy(function (idx, accessor) {
                    var info = {
                        name   : accessor,
                        setter : accessor,
                        getter : accessor,
                        type : 'rw'
                    }

                    if (typeof accessor === 'object') {

                        info.setter = accessor.name;
                        info.getter = accessor.name;

                        for (var key in accessor) {
                            info[key] = accessor[key];
                        }

                    }

                    Widget.prototype.__attributes[info.name] = info;

                    if (info.setter == info.getter && info.type.match(/rw/)) {

                        Widget.prototype[info.getter] = KBase._functions.getter_setter(info.name);

                    }
                    else {
                        if (info.type.match(/w/) && info.setter != undefined) {
                            Widget.prototype[info.setter] = KBase._functions.setter(info.name);
                        }

                        if (info.type.match(/r/) && info.getter != undefined) {
                            Widget.prototype[info.getter] = KBase._functions.getter(info.name);
                        }

                    }

                }, this)

            );

            defCopy._accessors = undefined;
        }

        var extension = $.extend(true, {}, Widget.prototype.__attributes, widgetRegistry[parent].prototype.__attributes);
        Widget.prototype.__attributes = extension;

        for (var prop in defCopy) {
            //hella slick closure based _super method adapted from JQueryUI.
//*

            if ($.isFunction(defCopy[prop])) {

                Widget.prototype[prop] = (function(methodName, method) {
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

                        var _superMethod = function(superMethodName) {
                            return widgetRegistry[parent].prototype[superMethodName].apply(this, Array.prototype.slice.call(arguments, 1));
                        }
                    }

                    return function() {
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
//*/
                Widget.prototype[prop] = defCopy[prop];
            }
        }

        if (parent) {
            Widget.prototype.options = $.extend(true, {}, widgetRegistry[parent].prototype.options, Widget.prototype.options);
        }

        if (asPlugin) {
            $.fn[name] = function( method, args ) {

                if (this.length > 1) {
                    var methodArgs = arguments;
                    $.each(
                        this,
                        function (idx, elem) {
                            $.fn[name].apply($(elem), methodArgs);
                        }
                    )
                    return this;
                }

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
                    $w.trigger('initialized');
                    return $w;
                } else {
                    $.error( 'Method ' +  method + ' does not exist on ' + name);
                }

                return this;

            };
        }

        Widget.prototype[name] = function () {
            return $.fn[name].apply(this.$elem, arguments);
        }

        return $.fn[name];
    }

    $.KBWidget(
        {
            name : 'kbaseWidget',

            /**
             * Writes text to console.
             * @param {String} txt The text to write.
             */
            dbg : function (txt) { if (window.console) console.log(txt); },


            callAfterInit : function (func) {
                var $me = this;
                var delayer = function () {

                    var recursion = arguments.callee;

                    if ($me._init) {
                        func();
                    }
                    else {
                        setTimeout(recursion, 10);
                    }
                }

                delayer();
                return delayer;
            },

            /**
             * Initializes the widget.
             * @param {Object} args Initialization arguments
             */
            init : function(args) {

                this._attributes = {};

                var opts = $.extend(true, {}, this.options);
                this.options = $.extend(true, {}, opts, args);

                for (attribute in this.__attributes) {
                    if (this.options[attribute] != undefined) {
                        this.setValueForKey(attribute, this.options[attribute]);
                    }
                }


                return this;
            },

            /**
             * Sets an alert to display
             * @param {String} msg The message to display
             */
            alert : function(msg) {
                if (msg == undefined ) {
                    msg = this.data('msg');
                }
                this.data('msg', msg);

                return this;
            },

            valueForKey :
                function (attribute) {
                    //this.trigger('didAccessValueFor' + name + '.kbase');
                    return this._attributes[attribute];
                },

            setValueForKey :

                function(attribute, newVal) {

                    var triggerValues = undefined;
                    var oldVal = this.valueForKey(attribute);

                    if (newVal != oldVal) {

                        var willChangeNote = willChangeNoteForName(attribute);

                        triggerValues = {
                            oldValue : oldVal,
                            newValue : newVal
                        }
                        this.trigger(willChangeNote, triggerValues);

                        this._attributes[attribute] = triggerValues.newValue;

                        if (triggerValues.newValue != oldVal) {
                            var didChangeNote  = didChangeNoteForName(attribute);

                            this.trigger(didChangeNote, triggerValues);
                        }
                    }

                    return this.valueForKey(attribute);
                },

            /**
             * Sets data.
             * @param {Object} key The key for the data
             * @param {Object} value The data itself
             */
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

            sortByKey : function (key, insensitively) {
                if (insensitively) {
                    return function (a,b) {
                             if (a[key].toLowerCase() < b[key].toLowerCase()) { return -1 }
                        else if (a[key].toLowerCase() > b[key].toLowerCase()) { return 1  }
                        else                                                  { return 0  }
                    }
                }
                else {
                    return function (a,b) {
                             if (a[key] < b[key]) { return -1 }
                        else if (a[key] > b[key]) { return 1  }
                        else                      { return 0  }
                    }
                }
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

            makeObserverCallback : function($target, attribute, callback) {
                return $.proxy(function (e, vals) {
                    e.preventDefault();
                    e.stopPropagation();

                    callback.call(this, e, $target, vals);

                }, this)
            },

            observe : function($target, attribute, callback) {
                $target.on(
                    attribute,
                    $target,
                    this.makeObserverCallback($target, attribute, callback)
                );

            },

            unobserve : function($target, attribute, callback) {
                $target.off(
                    attribute,
                    $target,
                    this.makeObserverCallback($target, attribute, callback)
                );
            },

/*
            kb_bind : function($target, attribute, callback) {
                var event = didChangeNoteForName(attribute);
                $target.on(event, $target, callback);
            },

            kb_unbind : function($target, attribute, callback) {
                var event = didChangeNoteForName(attribute);
                $target.off(event, callback);
            },
*/

//*
            kb_bind : function($target, attribute, callback) {
                var event = didChangeNoteForName(attribute);
                this.observe($target, event, callback);
            },

            kb_unbind : function($target, attribute, callback) {
                var event = didChangeNoteForName(attribute);
                //$target.off(event, callback);
                this.unobserve($target, event, callback);
            },

            uuid : function () {
                var result = '';
                for (var i = 0; i < 32; i++) {
                    result += Math.floor(Math.random()*16).toString(16).toUpperCase();
                }

                return result;
            },

//*/

        }
    );



}( jQuery ));
