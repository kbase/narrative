(function( $, undefined) {

    var widgetRegistry = {};
    if (window.KBase == undefined) {
        window.KBase = {};
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

    $.kbObject = function(name, parent, def, asPlugin) {
        if (asPlugin == undefined) {
            asPlugin = false;
        }

        return $.kbWidget(name, parent, def, asPlugin);
    }

    $.kbWidget = function(name, parent, def, asPlugin) {

        if (asPlugin == undefined) {
            asPlugin = true;
        }

        if (widgetRegistry[name] != undefined) {
            //throw "Cannot re-register widget: " + name;
            return;
        }

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
            $w.$elem = $elem;
            $w.init(options);
            $w._init = true;
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

    $.kbWidget('kbaseWidget',
        {
            options : {},

            element : function() {
                return this;
            },

            dbg : function (txt) { if (window.console) console.log(txt); },

            init : function(args) {
                var opts = $.extend(true, {}, this.options);
                this.options = $.extend(true, {}, opts, args);
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

            sortByKey : function (key) {
                return function (a,b) {
                         if (a[key] < b[key]) { return -1 }
                    else if (a[key] > b[key]) { return 1  }
                    else                      { return 0  }
                }
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
