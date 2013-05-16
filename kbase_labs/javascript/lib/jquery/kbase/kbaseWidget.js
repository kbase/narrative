(function( $, undefined) {

    var widgetRegistry = {};

    function subclass(constructor, superConstructor) {
        function surrogateConstructor(){}

        surrogateConstructor.prototype = superConstructor.prototype;

        var prototypeObject = new surrogateConstructor();
        prototypeObject.constructor = constructor;

        constructor.prototype = prototypeObject;
    }

    $.kbWidget = function(name, parent, def) {

        if (widgetRegistry[name] != undefined) {
            //throw "Cannot re-register widget: " + name;
            return;
        }
        var Widget = function($elem) {
            this.$elem = $elem;
            this.options = $.extend(true, {}, def.options);
            return this;
        }

        widgetRegistry[name] = Widget;

        if (def == undefined) {
            def = parent;
            parent = undefined;
        }

        if (parent) {
            subclass(Widget, widgetRegistry[parent]);
        }

        var defCopy = $.extend(true, {}, def);
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
                            return widgetRegistry[parent].prototype[superMethodName].apply(this, Array.prototype.slice.apply(arguments, [1]));
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

    $.kbWidget('kbaseWidget',
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

        }
    );



}( jQuery ));
