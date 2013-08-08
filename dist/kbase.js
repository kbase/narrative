(function($, undefined) {
    var KBase;
    var ucfirst = function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };
    var willChangeNoteForName = function(name) {
        return "willChangeValueFor" + ucfirst(name);
    };
    var didChangeNoteForName = function(name) {
        return "didChangeValueFor" + ucfirst(name);
    };
    var defaultBindingAccessors = function(elem) {
        var tagName = $(elem).prop("tagName").toLowerCase();
        if (tagName.match(/^(input|select|textarea)$/)) {
            if ($(elem).attr("type") == "checkbox") {
                return {
                    setter: "checked",
                    getter: "checked"
                };
            } else {
                return {
                    setter: "val",
                    getter: "val"
                };
            }
        } else {
            return {
                setter: "text",
                getter: "text"
            };
        }
    };
    makeBindingCallback = function(elem, $target, attribute, transformers, accessors) {
        return $.proxy(function(e, vals) {
            e.preventDefault();
            e.stopPropagation();
            var newVal = vals.newValue;
            if (transformers.transformedValue != undefined) {
                newVal = transformers.transformedValue(newVal);
            }
            if (accessors.setter == "checked") {
                $(elem).attr(accessors.setter, newVal);
            } else {
                $(elem)[accessors.setter](newVal);
            }
        }, $(elem));
    };
    makeBindingBlurCallback = function(elem, $target, attribute, transformers, accessors) {
        return $.proxy(function(e, vals) {
            if (e.type == "keypress" && e.which != 13) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            var newVal;
            if (accessors.getter == "checked") {
                newVal = this.is(":checked") ? true : false;
            } else {
                newVal = this[accessors.getter]();
            }
            if (newVal != this.data("kbase_bindingValue")) {
                if (transformers.validator != undefined) {
                    var validation = transformers.validator(newVal);
                    if (!validation.success) {
                        $(elem).data("validationError.kbaseBinding", validation.msg);
                        this.popover({
                            placement: "right",
                            title: "Validation error",
                            content: $.proxy(function() {
                                return this.data("validationError.kbaseBinding");
                            }, $(elem)),
                            trigger: "manual",
                            html: true
                        });
                        this.popover("show");
                        return;
                    } else {
                        $(elem).popover("hide");
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
        }, $(elem));
    };
    makeBindingFocusCallback = function(elem, transformers, accessors) {
        return $.proxy(function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.data("kbase_bindingValue", this[accessors.getter]());
        }, $(elem));
    };
    $.fn.kb_bind = function($target, attribute, transformers, accessors) {
        if (this.length > 1) {
            var methodArgs = arguments;
            $.each(this, function(idx, elem) {
                $.fn.kb_bind.apply($(elem), methodArgs);
            });
            return this;
        }
        if (accessors == undefined) {
            accessors = defaultBindingAccessors(this);
        }
        if (transformers == undefined) {
            transformers = {};
        }
        var event = didChangeNoteForName(attribute);
        $target.on(event, makeBindingCallback(this, $target, attribute, transformers, accessors));
        $(this).on("blur.kbaseBinding", makeBindingBlurCallback(this, $target, attribute, transformers, accessors));
        $(this).on("focus.kbaseBinding", makeBindingFocusCallback(this, transformers, accessors));
        var tagName = $(this).prop("tagName").toLowerCase();
        if (tagName.match(/^(input)$/)) {
            $(this).on("keypress.kbaseBinding", makeBindingBlurCallback(this, $target, attribute, transformers, accessors));
            if ($(this).attr("type") == "checkbox") {
                $(this).on("change.kbaseBinding", makeBindingBlurCallback(this, $target, attribute, transformers, accessors));
            }
        }
        var target_getter = $target.__attributes[attribute].getter;
        var newVal = $target[target_getter]();
        if (transformers.transformedValue != undefined) {
            newVal = transformers.transformedValue(newVal);
        }
        if (accessors.setter == "checked") {
            $(this).attr(accessors.setter, newVal);
        } else {
            $(this)[accessors.setter](newVal);
        }
        return this;
    };
    $.fn.kb_unbind = function($target, attribute, callback, transformers, accessors) {
        if (this.length > 1) {
            var methodArgs = arguments;
            $.each(this, function(idx, elem) {
                $.fn.kb_unbind.apply($(elem), methodArgs);
            });
            return this;
        }
        if (accessors == undefined) {
            accessors = defaultBindingAccessors(this);
        }
        if (transformers == undefined) {
            transformers = {};
        }
        var event = didChangeNoteForName(attribute);
        $target.off(event, makeBindingCallback(this, $target, attribute, transformers, accessors));
        $(this).off("blur.kbaseBinding", makeBindingBlurCallback(this, $target, attribute, transformers, accessors));
        $(this).off("focus.kbaseBinding", makeBindingBlurCallback(this, transformers, accessors));
        var tagName = $(this).prop("tagName").toLowerCase();
        if (tagName.match(/^(input)$/)) {
            $(this).off("keypress.kbaseBinding", makeBindingEnterCallback(this, $target, attribute, transformers, accessors));
            if ($(this).attr("type") == "checkbox") {
                $(this).off("change.kbaseBinding", makeBindingBlurCallback(this, $target, attribute, transformers, accessors));
            }
        }
        return this;
    };
    var widgetRegistry = {};
    if (KBase === undefined) {
        KBase = window.KBase = {
            _functions: {
                getter: function(name) {
                    return function() {
                        return this.valueForKey(name);
                    };
                },
                setter: function(name) {
                    return function(newVal) {
                        return this.setValueForKey(name, newVal);
                    };
                },
                getter_setter: function(name) {
                    return function(newVal) {
                        if (arguments.length == 1) {
                            return this.setValueForKey(name, newVal);
                        } else {
                            return this.valueForKey(name);
                        }
                    };
                }
            }
        };
    }
    function subclass(constructor, superConstructor) {
        function surrogateConstructor() {}
        surrogateConstructor.prototype = superConstructor.prototype;
        var prototypeObject = new surrogateConstructor();
        prototypeObject.constructor = constructor;
        constructor.prototype = prototypeObject;
    }
    $.jqElem = function(tagName) {
        var tag = "<" + tagName + ">";
        if (!tag.match(/^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track)/)) {
            tag += "</" + tagName + ">";
        }
        return $(tag);
    };
    $.kbObject = function(name, parent, def, asPlugin) {
        if (asPlugin == undefined) {
            asPlugin = false;
        }
        return $.KBWidget(name, parent, def, asPlugin);
    };
    $.KBWidget = function(name, parent, def, asPlugin) {
        if (asPlugin == undefined) {
            asPlugin = true;
        }
        var Widget = function($elem) {
            this.$elem = $elem;
            this.options = $.extend(true, {}, def.options, this.constructor.prototype.options);
            return this;
        };
        var directName = name;
        directName = directName.replace(/^kbase/, "");
        directName = directName.charAt(0).toLowerCase() + directName.slice(1);
        KBase[directName] = function(options, $elem) {
            var $w = new Widget();
            if ($elem == undefined) {
                $elem = $.jqElem("div");
            }
            $w.$elem = $elem;
            $w.init(options);
            $w._init = true;
            $w.trigger("initialized");
            return $w;
        };
        widgetRegistry[name] = Widget;
        if (def == undefined) {
            def = parent;
            parent = "kbaseWidget";
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
            $.each(defCopy._accessors, $.proxy(function(idx, accessor) {
                var info = {
                    name: accessor,
                    setter: accessor,
                    getter: accessor,
                    type: "rw"
                };
                if (typeof accessor === "object") {
                    info.setter = accessor.name;
                    info.getter = accessor.name;
                    for (var key in accessor) {
                        info[key] = accessor[key];
                    }
                }
                Widget.prototype.__attributes[info.name] = info;
                if (info.setter == info.getter && info.type.match(/rw/)) {
                    Widget.prototype[info.getter] = KBase._functions.getter_setter(info.name);
                } else {
                    if (info.type.match(/w/) && info.setter != undefined) {
                        Widget.prototype[info.setter] = KBase._functions.setter(info.name);
                    }
                    if (info.type.match(/r/) && info.getter != undefined) {
                        Widget.prototype[info.getter] = KBase._functions.getter(info.name);
                    }
                }
            }, this));
            defCopy._accessors = undefined;
        }
        var extension = $.extend(true, {}, Widget.prototype.__attributes, widgetRegistry[parent].prototype.__attributes);
        Widget.prototype.__attributes = extension;
        for (var prop in defCopy) {
            if ($.isFunction(defCopy[prop])) {
                Widget.prototype[prop] = function(methodName, method) {
                    var _super = function() {
                        throw "No parent method defined! Play by the rules!";
                    };
                    var _superMethod = function() {
                        throw "No parent method defined! Play by the rules!";
                    };
                    if (parent) {
                        var _super = function() {
                            return widgetRegistry[parent].prototype[methodName].apply(this, arguments);
                        };
                        var _superMethod = function(superMethodName) {
                            return widgetRegistry[parent].prototype[superMethodName].apply(this, Array.prototype.slice.call(arguments, 1));
                        };
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
                    };
                }(prop, defCopy[prop]);
            } else {
                Widget.prototype[prop] = defCopy[prop];
            }
        }
        if (parent) {
            Widget.prototype.options = $.extend(true, {}, widgetRegistry[parent].prototype.options, Widget.prototype.options);
        }
        if (asPlugin) {
            $.fn[name] = function(method, args) {
                if (this.length > 1) {
                    var methodArgs = arguments;
                    $.each(this, function(idx, elem) {
                        $.fn[name].apply($(elem), methodArgs);
                    });
                    return this;
                }
                if (this.data(name) == undefined) {
                    this.data(name, new Widget(this));
                }
                if (Widget.prototype[method]) {
                    return Widget.prototype[method].apply(this.data(name), Array.prototype.slice.call(arguments, 1));
                } else if (typeof method === "object" || !method) {
                    var args = arguments;
                    $w = this.data(name);
                    if (!$w._init) {
                        $w = Widget.prototype.init.apply($w, arguments);
                    }
                    $w._init = true;
                    $w.trigger("initialized");
                    return $w;
                } else {
                    $.error("Method " + method + " does not exist on " + name);
                }
                return this;
            };
        }
        Widget.prototype[name] = function() {
            return $.fn[name].apply(this.$elem, arguments);
        };
        return $.fn[name];
    };
    $.KBWidget("kbaseWidget", {
        _accessors: [ "wing", "wong" ],
        element: function() {
            return this;
        },
        dbg: function(txt) {
            if (window.console) console.log(txt);
        },
        callAfterInit: function(func) {
            var $me = this;
            var delayer = function() {
                var recursion = arguments.callee;
                if ($me._init) {
                    func();
                } else {
                    setTimeout(recursion, 10);
                }
            };
            delayer();
            return delayer;
        },
        init: function(args) {
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
        alert: function(msg) {
            if (msg == undefined) {
                msg = this.data("msg");
            }
            this.data("msg", msg);
            return this;
        },
        valueForKey: function(attribute) {
            return this._attributes[attribute];
        },
        setValueForKey: function(attribute, newVal) {
            var triggerValues = undefined;
            var oldVal = this.valueForKey(attribute);
            if (newVal != oldVal) {
                var willChangeNote = willChangeNoteForName(attribute);
                triggerValues = {
                    oldValue: oldVal,
                    newValue: newVal
                };
                this.trigger(willChangeNote, triggerValues);
                this._attributes[attribute] = triggerValues.newValue;
                if (triggerValues.newValue != oldVal) {
                    var didChangeNote = didChangeNoteForName(attribute);
                    this.trigger(didChangeNote, triggerValues);
                }
            }
            return this.valueForKey(attribute);
        },
        data: function(key, val) {
            if (this.options._storage == undefined) {
                this.options._storage = {};
            }
            if (arguments.length == 2) {
                this.options._storage[key] = val;
            }
            if (key != undefined) {
                return this.options._storage[key];
            } else {
                return this.options._storage;
            }
        },
        _rewireIds: function($elem, $target) {
            if ($target == undefined) {
                $target = $elem;
            }
            if ($elem.attr("id")) {
                $target.data($elem.attr("id"), $elem);
                $elem.removeAttr("id");
            }
            $.each($elem.find("[id]"), function(idx) {
                $target.data($(this).attr("id"), $(this));
                $(this).removeAttr("id");
            });
            return $elem;
        },
        sortCaseInsensitively: function(a, b) {
            if (a.toLowerCase() < b.toLowerCase()) {
                return -1;
            } else if (a.toLowerCase() > b.toLowerCase()) {
                return 1;
            } else {
                return 0;
            }
        },
        sortByKey: function(key, insensitively) {
            if (insensitively) {
                return function(a, b) {
                    if (a[key].toLowerCase() < b[key].toLowerCase()) {
                        return -1;
                    } else if (a[key].toLowerCase() > b[key].toLowerCase()) {
                        return 1;
                    } else {
                        return 0;
                    }
                };
            } else {
                return function(a, b) {
                    if (a[key] < b[key]) {
                        return -1;
                    } else if (a[key] > b[key]) {
                        return 1;
                    } else {
                        return 0;
                    }
                };
            }
        },
        trigger: function() {
            this.$elem.trigger.apply(this.$elem, arguments);
        },
        on: function() {
            this.$elem.on.apply(this.$elem, arguments);
        },
        off: function() {
            this.$elem.off.apply(this.$elem, arguments);
        },
        makeObserverCallback: function($target, attribute, callback) {
            return $.proxy(function(e, vals) {
                e.preventDefault();
                e.stopPropagation();
                callback.call(this, e, $target, vals);
            }, this);
        },
        observe: function($target, attribute, callback) {
            $target.on(attribute, $target, this.makeObserverCallback($target, attribute, callback));
        },
        unobserve: function($target, attribute, callback) {
            $target.off(attribute, $target, this.makeObserverCallback($target, attribute, callback));
        },
        kb_bind: function($target, attribute, callback) {
            var event = didChangeNoteForName(attribute);
            this.observe($target, event, callback);
        },
        kb_unbind: function($target, attribute, callback) {
            var event = didChangeNoteForName(attribute);
            this.unobserve($target, event, callback);
        },
        uuid: function() {
            var result = "";
            for (var i = 0; i < 32; i++) {
                result += Math.floor(Math.random() * 16).toString(16).toUpperCase();
            }
            return result;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseAccordion", "kbaseWidget", {
        version: "1.0.0",
        options: {
            fontSize: "100%"
        },
        init: function(options) {
            this._super(options);
            if (this.options.client) {
                this.client = this.options.client;
            }
            this.appendUI($(this.$elem));
            return this;
        },
        appendUI: function($elem, elements) {
            if (elements == undefined) {
                elements = this.options.elements;
            }
            var fontSize = this.options.fontSize;
            var $block = $("<div></div>").addClass("accordion").css("font-size", fontSize).attr("id", "accordion");
            $.each(elements, $.proxy(function(idx, val) {
                $block.append($("<div></div>").addClass("accordion-group").append($("<div></div>").addClass("accordion-heading").append($("<i></i>").css("margin-right", "5px").css("margin-left", "3px").addClass("icon-chevron-right").addClass("pull-left").css("height", "22px").css("line-height", "22px").css("color", "gray")).append($("<a></a>").addClass("accordion-toggle").css("padding", "0px").attr("href", "#").attr("title", val.title).css("height", "22px").css("line-height", "22px").append(val.title).bind("click", function(e) {
                    e.preventDefault();
                    var $opened = $(this).closest(".accordion").find(".in");
                    var $target = $(this).parent().next();
                    if ($opened != undefined) {
                        $opened.collapse("hide");
                        var $i = $opened.parent().first().find("i");
                        $i.removeClass("icon-chevron-down");
                        $i.addClass("icon-chevron-right");
                    }
                    if ($target.get(0) != $opened.get(0)) {
                        $target.collapse("show");
                        var $i = $(this).parent().find("i");
                        $i.removeClass("icon-chevron-right");
                        $i.addClass("icon-chevron-down");
                    }
                }))).append($("<div></div>").addClass("accordion-body").append($("<div></div>").addClass("accordion-inner").append(val.body))));
            }, this));
            this._rewireIds($block, this);
            $elem.append($block);
            $block.find(".accordion-body").collapse("hide");
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseAuthenticatedWidget", "kbaseWidget", {
        version: "1.0.0",
        _accessors: [ {
            name: "auth",
            setter: "setAuth"
        }, "sessionId", "authToken", "user_id", "loggedInCallback", "loggedOutCallback", "loggedInQueryCallback" ],
        options: {
            auth: undefined
        },
        init: function(options) {
            this._super(options);
            $(document).on("loggedIn.kbase", $.proxy(function(e, auth) {
                this.setAuth(auth);
                if (this.loggedInCallback) {
                    this.loggedInCallback(e, auth);
                }
            }, this));
            $(document).on("loggedOut.kbase", $.proxy(function(e) {
                this.setAuth(undefined);
                if (this.loggedOutCallback) {
                    this.loggedOutCallback(e);
                }
            }, this));
            $(document).trigger("loggedInQuery", $.proxy(function(auth) {
                this.setAuth(auth);
                if (auth.kbase_sessionid) {
                    this.callAfterInit($.proxy(function() {
                        if (this.loggedInQueryCallback) {
                            this.loggedInQueryCallback(auth);
                        }
                    }, this));
                }
            }, this));
            return this;
        },
        setAuth: function(newAuth) {
            this.setValueForKey("auth", newAuth);
            if (newAuth == undefined) {
                newAuth = {};
            }
            this.sessionId(newAuth.kbase_sessionid);
            this.authToken(newAuth.token);
            this.user_id(newAuth.user_id);
        },
        loggedInQueryCallback: function(args) {
            if (this.loggedInCallback) {
                this.loggedInCallback(undefined, args);
            }
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseBox", "kbaseWidget", {
        version: "1.0.0",
        options: {
            canCollapse: true,
            canCollapseOnDoubleClick: false,
            controls: [],
            bannerColor: "lightgray",
            boxColor: "lightgray"
        },
        init: function(options) {
            this._super(options);
            if (this.options.canCollapse) {
                this.options.controls.push({
                    icon: "icon-caret-up",
                    "icon-alt": "icon-caret-down",
                    tooltip: {
                        title: "collapse / expand",
                        placement: "bottom"
                    },
                    callback: $.proxy(function(e) {
                        this.data("content").slideToggle();
                    }, this)
                });
            }
            this.appendUI($(this.$elem));
            return this;
        },
        setBannerColor: function(color) {
            this.data("banner").css("background-color", color);
        },
        startThinking: function() {
            this.data("banner").addClass("progress progress-striped active");
        },
        stopThinking: function() {
            this.data("banner").removeClass("progress progress-striped active");
        },
        appendUI: function($elem) {
            var canCollapse = this.options.canCollapse;
            var $div = $("<div></div>").append($("<div></div>").css("text-align", "left").css("font-size", "70%").css("color", "gray").append(this.options.precontent)).append($("<div></div>").css("border", "1px solid " + this.options.boxColor).css("padding", "2px").append($("<div></div>").attr("id", "banner").css("width", "100%").css("height", "24px").css("margin-bottom", "0px").css("box-shadow", "none").css("background-color", this.options.bannerColor).css("border-radius", "0px").append($("<h5></h5>").attr("id", "banner-text").addClass("text-left").css("text-align", "left").css("text-shadow", "none").css("color", "black").css("font-size", "14px").addClass("bar").css("padding", "2px").css("margin", "0px").css("position", "relative").css("width", "100%").bind("dblclick", function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (canCollapseOnDoubleClick) {
                    $(this).parent().parent().children().last().collapse("toggle");
                }
            }).append($("<span></span>").attr("id", "title")))).append($("<div></div>").attr("id", "content"))).append($("<div></div>").css("text-align", "right").css("font-size", "70%").css("color", "gray").append(this.options.postcontent));
            this._rewireIds($div, this);
            if (this.options.controls) {
                this.data("banner-text").kbaseButtonControls({
                    onMouseover: false,
                    controls: this.options.controls
                });
            }
            this.setTitle(this.options.title);
            this.setContent(this.options.content);
            $elem.append($div);
            return this;
        },
        setTitle: function(title) {
            this.data("title").empty();
            this.data("title").append(title);
        },
        setContent: function(content) {
            this.data("content").empty();
            this.data("content").append(content);
        },
        content: function() {
            return this.data("content");
        },
        controls: function(control) {
            return this.data("banner-text").kbaseButtonControls("controls", control);
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseButtonControls", "kbaseWidget", {
        version: "1.0.0",
        options: {
            controls: [],
            onMouseover: true
        },
        init: function(options) {
            this._super(options);
            this._controls = {};
            this.appendUI($(this.$elem));
            return this;
        },
        appendUI: function($elem) {
            $elem.css("position", "relative").prepend($("<div></div>").addClass("btn-group").attr("id", "control-buttons").css("right", "0px").css("top", "0px").css("position", "absolute").css("margin-right", "3px"));
            this._rewireIds($elem, this);
            if (this.options.onMouseover) {
                $elem.mouseover(function(e) {
                    $(this).children().first().show();
                }).mouseout(function(e) {
                    $(this).children().first().hide();
                }).children().first().hide();
            }
            this.setControls(this.options.controls);
            return this;
        },
        controls: function(control) {
            if (control) {
                return this._controls[control];
            } else {
                return this._controls;
            }
        },
        setControls: function(controls) {
            this.data("control-buttons").empty();
            for (control in this._controls) {
                this._controls[control] = undefined;
            }
            var $buttonControls = this;
            $.each(controls, $.proxy(function(idx, val) {
                if (val.condition) {
                    if (val.condition.call(this, val, $buttonControls.options.context, this.$elem) == false) {
                        return;
                    }
                }
                var btnClass = "btn btn-mini";
                if (val.type) {
                    btnClass = btnClass + " btn-" + val.type;
                }
                tooltip = val.tooltip;
                if (typeof val.tooltip == "string") {
                    tooltip = {
                        title: val.tooltip
                    };
                }
                if (tooltip != undefined && tooltip.container == undefined) {}
                var $button = $("<button></button>").attr("href", "#").css("padding-top", "1px").css("padding-bottom", "1px").attr("class", btnClass).append($("<i></i>").addClass(val.icon)).tooltip(tooltip).bind("click", function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (val["icon-alt"]) {
                        $(this).children().first().toggleClass(val.icon);
                        $(this).children().first().toggleClass(val["icon-alt"]);
                    }
                    val.callback.call(this, e, $buttonControls.options.context);
                });
                if (val.id) {
                    this._controls[val.id] = $button;
                }
                if (this.options.id) {
                    $button.data("id", this.options.id);
                }
                this.data("control-buttons").append($button);
            }, this));
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseDataBrowser", "kbaseAuthenticatedWidget", {
        version: "1.0.0",
        options: {
            title: "Data Browser",
            canCollapse: true,
            height: "200px",
            types: {
                file: {
                    icon: "icon-file"
                },
                folder: {
                    icon: "icon-folder-close-alt",
                    "icon-open": "icon-folder-open-alt",
                    expandable: true
                }
            },
            content: []
        },
        init: function(options) {
            this.targets = {};
            this.openTargets = {};
            this._super(options);
            this.appendUI(this.$elem);
            return this;
        },
        sortByName: function(a, b) {
            if (a["name"].toLowerCase() < b["name"].toLowerCase()) {
                return -1;
            } else if (a["name"].toLowerCase() > b["name"].toLowerCase()) {
                return 1;
            } else {
                return 0;
            }
        },
        appendContent: function(content, $target) {
            $.each(content, $.proxy(function(idx, val) {
                var icon = val.icon;
                var iconOpen = val["icon-open"];
                if (icon == undefined && val.type != undefined) {
                    icon = this.options.types[val.type].icon;
                    iconOpen = this.options.types[val.type]["icon-open"];
                }
                if (val.expandable == undefined && val.type != undefined) {
                    val.expandable = this.options.types[val.type].expandable;
                }
                var $button = $("<i></i>").addClass(val.open ? iconOpen : icon).css("color", "gray");
                var $li = $("<li></li>").attr("id", val.id).append($("<a></a>").append($button).append(" ").append(val.label));
                if (val.data) {
                    $li.data("data", val.data);
                }
                if (val.id) {
                    $li.data("id", val.id);
                    this.targets[val.id] = $li;
                }
                $target.append($li);
                if (val.expandable) {
                    var $ul = $("<ul></ul>").addClass("nav nav-list");
                    if (!val.open) {
                        $ul.hide();
                    }
                    if (val.children != undefined) {
                        this.appendContent(val.children, $ul);
                    }
                    $target.append($ul);
                    var callback = val.childrenCallback;
                    if (val.children == undefined && callback == undefined && val.type != undefined) {
                        callback = this.options.types[val.type].childrenCallback;
                    }
                    $li.bind("click", $.proxy(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        $button.toggleClass(iconOpen);
                        $button.toggleClass(icon);
                        if ($ul.is(":hidden") && callback != undefined) {
                            callback.call(this, val.id, $.proxy(function(results) {
                                $ul.empty();
                                this.appendContent(results, $ul);
                                $ul.show("collapse");
                                this.openTargets[val["id"]] = true;
                            }, this));
                        } else {
                            if ($ul.is(":hidden")) {
                                $ul.show("collapse");
                                this.openTargets[val["id"]] = true;
                            } else {
                                $ul.hide("collapse");
                                this.openTargets[val["id"]] = false;
                            }
                        }
                    }, this));
                    if (val.open && val.children == undefined && callback != undefined) {
                        $button.toggleClass(iconOpen);
                        $button.toggleClass(icon);
                        $ul.hide();
                        $li.trigger("click");
                    }
                }
                var controls = val.controls;
                if (controls == undefined && val.type != undefined) {
                    controls = this.options.types[val.type].controls;
                }
                if (controls) {
                    $li.kbaseButtonControls({
                        controls: controls,
                        id: val.id,
                        context: this
                    });
                }
            }, this));
            this._rewireIds($target, this);
            return $target;
        },
        prepareRootContent: function() {
            return $("<ul></ul>").addClass("nav nav-list").css("height", this.options.height).css("overflow", "auto").attr("id", "ul-nav");
        },
        appendUI: function($elem) {
            var $root = this.prepareRootContent();
            this._rewireIds($root, this);
            this.appendContent(this.options.content, this.data("ul-nav"));
            $elem.kbaseBox({
                title: this.options.title,
                canCollapse: this.options.canCollapse,
                content: $root,
                postcontent: this.options.postcontent
            });
            return $elem;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseDeletePrompt", "kbasePrompt", {
        version: "1.0.0",
        options: {
            controls: [ "cancelButton", "okayButton" ]
        },
        init: function(options) {
            this._super(options);
            return $("<div></div>").kbasePrompt({
                title: "Confirm deletion",
                body: "Really delete <strong>" + this.options.name + "</strong>?",
                controls: [ "cancelButton", {
                    name: "Delete",
                    type: "primary",
                    callback: this.options.callback
                } ]
            });
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseErrorPrompt", "kbasePrompt", {
        version: "1.0.0",
        options: {
            controls: [ "cancelButton", "okayButton" ]
        },
        init: function(options) {
            this._super(options);
            return $("<div></div>").kbasePrompt({
                title: options.title,
                body: $("<div></div>").attr("class", "alert alert-error").append($("<div></div>").append($("<div></div>").addClass("pull-left").append($("<i></i>").addClass("icon-warning-sign").attr("style", "float: left; margin-right: .3em;"))).append($("<div></div>").append($("<strong></strong>").append(options.message)))),
                controls: [ "okayButton" ]
            });
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseFormBuilder", "kbaseWidget", {
        version: "1.0.0",
        options: {
            elements: [],
            defaultSize: 50,
            defaultRowSize: 5,
            defaultMultiSelectSize: 5,
            dispatch: {
                text: "buildTextField",
                textarea: "buildTextArea",
                password: "buildSecureTextField",
                checkbox: "buildCheckbox",
                select: "buildSelectbox",
                multiselect: "buildSelectbox",
                radio: "buildRadioButton",
                string: "buildTextField",
                secure: "buildSecureTextField",
                "enum": "buildSelectbox",
                "boolean": "buildCheckbox"
            }
        },
        init: function(options) {
            this._super(options);
            this.$elem.append(this._buildForm(this.options.elements));
            return this;
        },
        getFormValuesAsObject: function() {
            var values = this.getFormValues();
            var ret = {};
            $.each(values, function(idx, val) {
                ret[val[0]] = val.slice(1);
            });
            return ret;
        },
        getFormValues: function() {
            var ret = [];
            var formValues = this.data("formValues");
            var form = this.data("form").get(0);
            for (key in formValues) {
                var val = formValues[key];
                var field = val.name;
                var type = val.type;
                var fields = [];
                if (form[field] == "[object NodeList]") {
                    for (var i = 0; i < form[field].length; i++) {
                        fields.push(form[field][i]);
                    }
                } else {
                    fields = [ form[field] ];
                }
                if (type == "checkbox") {
                    if (form[field].checked) {
                        ret.push([ key ]);
                    }
                } else if (type == "multiselect") {
                    var selectedValues = [ key ];
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
                } else if (type == "radio") {
                    var selectedValues = [ key ];
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
                } else {
                    var res = [];
                    for (var i = 0; i < fields.length; i++) {
                        if (val.json) {
                            var json = JSON.parse(fields[i].value);
                            if (val.asArray) {
                                json = [ json ];
                            }
                            res.push(json);
                        } else {
                            res.push(this.carve(fields[i].value, val.split, val.asArray));
                        }
                    }
                    if (res.length > 0) {
                        if (res.length == 1) {
                            res = res[0];
                            if (res.length == 0) {
                                continue;
                            }
                        }
                        ret.push([ key, res ]);
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
        carve: function(strings, delimiters, asArray) {
            delimiters = delimiters == undefined ? [] : typeof delimiters == "string" ? [ delimiters ] : delimiters.slice(0);
            var delim = delimiters.shift();
            if (delim == undefined) {
                if (asArray && typeof strings == "string") {
                    strings = [ strings ];
                }
                return strings;
            }
            var delimRegex = new RegExp(" *" + delim + " *");
            if (typeof strings == "string") {
                return this.carve(strings.split(delimRegex), delimiters, asArray);
            } else {
                delimiters.push(delim);
                jQuery.each(strings, $.proxy(function(idx, str) {
                    strings[idx] = this.carve(str, delimiters, asArray);
                }, this));
            }
            return strings;
        },
        escapeValue: function(val) {
            val = val.replace(/"/g, '\\"');
            return '"' + val + '"';
        },
        getFormValuesAsString: function() {
            var extractedFormValues = this.getFormValues();
            if (this.options.returnArrayStructure != undefined) {
                return JSON.stringify(extractedFormValues);
            }
            var returnValue = [];
            for (var i = 0; i < extractedFormValues.length; i++) {
                var field = extractedFormValues[i];
                if (field.length == 1) {
                    returnValue.push(field[0]);
                } else {
                    for (var j = 1; j < field.length; j++) {
                        if (this.data("formValues")[field[0]].valOnly) {
                            returnValue.push(field[j]);
                        } else {
                            if (typeof field[j] == "string") {
                                returnValue.push(field[0] + " " + this.escapeValue(field[j]));
                            } else {
                                returnValue.push(field[0] + " " + this.escapeValue(JSON.stringify(field[j])));
                            }
                        }
                    }
                }
            }
            return returnValue.join(" ");
        },
        _buildForm: function(data) {
            var $form = $("<form></form>").addClass("form-horizontal").bind("submit", function(evt) {
                return false;
            });
            this.data("form", $form);
            var formValues = this.data("formValues", {});
            var $lastFieldset = undefined;
            var passedValues = {};
            if (this.options.values != undefined) {
                $.each(this.options.values, function(idx, val) {
                    passedValues[val[0]] = val[1] || 1;
                });
            }
            $.each(data, $.proxy(function(idx, value) {
                if (formValues[value.key] != undefined) {
                    var errorMsg = "FORM ERROR. KEY " + value.key + " IS DOUBLE DEFINED";
                    $form = errorMsg;
                    return false;
                }
                formValues[value.key] = value;
                if (value.fieldset) {
                    if ($lastFieldset == undefined || $lastFieldset.attr("name") != value.fieldset) {
                        $lastFieldset = $("<fieldset></fieldset>").attr("name", value.fieldset).append($("<legend></legend>").append(value.fieldset));
                        $form.append($lastFieldset);
                    }
                } else {
                    $lastFieldset = $form;
                }
                var labelText = value.label != undefined ? value.label : value.name;
                var $label = $("<label></label>").addClass("control-label").css("margin-right", "10px").append($("<span></span>").attr("title", value.label || value.name).append(labelText).attr("title", value.description)).bind("click", function(e) {
                    $(this).next().children().first().focus();
                });
                var $span = $label.find("span");
                if (value.description) {
                    $span.tooltip();
                }
                if (passedValues[value.key] != undefined) {
                    value.value = value.checked = value.selected = passedValues[value.key];
                }
                var $field;
                if (this.options.dispatch[value.type]) {
                    $field = this[this.options.dispatch[value.type]](value);
                } else if (value.type == undefined) {
                    var errorMsg = "FORM ERROR. KEY " + value.key + " HAS NO TYPE";
                    $form = errorMsg;
                    return false;
                } else {
                    $field = this.buildTextField(value);
                }
                var $container = $("<span></span>");
                $container.css("display", "inline-block");
                $container.append($field);
                var $button = $("<button></button>").addClass("btn").attr("title", "Add more").append($("<i></i>").addClass("icon-plus")).bind("click", function(evt) {
                    $container.append($("<br/>"));
                    $container.append($field.clone());
                    evt.stopPropagation();
                });
                if (value.multi) {
                    $container.append($button);
                }
                $form.append($("<div></div>").addClass("control-group").append($label).append($container));
            }, this));
            return $form;
        },
        buildTextField: function(data) {
            return $("<input/>").attr("type", "text").attr("size", data.size || this.options.defaultSize).attr("value", data.value).attr("name", data.name);
        },
        buildTextArea: function(data) {
            return $("<textarea></textarea>").attr("cols", data.size || this.options.defaultSize).attr("rows", data.rows || this.options.defaultRowSize).attr("name", data.name).append(data.value);
        },
        buildSecureTextField: function(data) {
            return $("<input/>").attr("type", "password").attr("size", data.size || this.options.defaultSize).attr("value", data.value).attr("name", data.name);
        },
        buildCheckbox: function(data) {
            var $checkbox = $("<input/>").attr("type", "checkbox").attr("name", data.name).attr("value", data.value);
            if (data.checked) {
                $checkbox.attr("checked", "checked");
            }
            return $checkbox;
        },
        buildRadioButton: function(data) {
            var $radioSpan = $("<span></span>").css("display", "inline-block");
            $.each(data.values, $.proxy(function(idx, val) {
                var $radio = $("<input/>").attr("type", "radio").attr("name", data.name).attr("value", val);
                if (data.checked == val) {
                    $radio.attr("checked", "checked");
                }
                var $l = $("<label></label").append($radio).append(data.names[idx] || data.values[idx]).css("clear", "both").css("float", "left");
                $radioSpan.append($l);
            }, this));
            return $radioSpan;
        },
        buildSelectbox: function(data) {
            var $selectbox = $("<select></select>").attr("name", data.name);
            if (data.type == "multiselect") {
                $selectbox.attr("multiple", "multiple").attr("size", data.size || this.options.defaultMultiSelectSize);
            }
            if (data.names == undefined) {
                data.names = [];
            }
            $.each(data.values, function(idx, value) {
                var name = data.names[idx] || data.values[idx];
                var $option = $("<option></option>").attr("value", value).append(name);
                if (typeof data.selected == "string" && data.selected == value) {
                    $option.attr("selected", "selected");
                } else if (typeof data.selected == "object") {
                    $.each(data.selected, function(idx, selectedValue) {
                        if (selectedValue == value) {
                            $option.attr("selected", "selected");
                        }
                    });
                }
                $selectbox.append($option);
            });
            return $selectbox;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseIrisCommands", "kbaseAccordion", {
        version: "1.0.0",
        options: {
            link: function(evt) {
                alert("clicked on " + $(evt.target).text());
            },
            englishCommands: 0,
            fontSize: "90%",
            overflow: true,
            sectionHeight: "300px"
        },
        init: function(options) {
            this._super(options);
            if (options.client) {
                this.client = options.client;
            }
            this.commands = [];
            this.commandCategories = {};
            return this;
        },
        completeCommand: function(command) {
            var completions = [];
            var commandRegex = new RegExp("^" + command + ".*");
            for (var idx = 0; idx < this.commands.length; idx++) {
                if (this.commands[idx].match(commandRegex)) {
                    completions.push(this.commands[idx]);
                }
            }
            return completions;
        },
        commonPrefix: function(str1, str2) {
            var prefix = "";
            for (var idx = 0; idx < str1.length && idx < str2.length; idx++) {
                var chr1 = str1.charAt(idx);
                var chr2 = str2.charAt(idx);
                if (chr1 == chr2) {
                    prefix = prefix + chr1;
                } else {
                    break;
                }
            }
            return prefix;
        },
        commonCommandPrefix: function(commands) {
            var prefix = "";
            if (commands.length > 1) {
                prefix = this.commonPrefix(commands[0], commands[1]);
                for (var idx = 2; idx < commands.length; idx++) {
                    prefix = this.commonPrefix(prefix, commands[idx]);
                }
            } else {
                prefix = commands[0];
            }
            return prefix;
        },
        commandsMatchingRegex: function(regex) {
            var matches = [];
            for (var idx = 0; idx < this.commands.length; idx++) {
                if (this.commands[idx].match(regex)) {
                    matches.push(this.commands[idx]);
                }
            }
            return matches.sort();
        },
        appendUI: function($elem) {
            this.client.valid_commands($.proxy(function(res) {
                var commands = [];
                $.each(res, $.proxy(function(idx, group) {
                    group.title;
                    var $ul = $("<ul></ul>").addClass("unstyled").css("max-height", this.options.overflow ? this.options.sectionHeight : "5000px").css("overflow", this.options.overflow ? "auto" : "visible");
                    $.each(group.items, $.proxy(function(idx, val) {
                        var label = val.cmd;
                        if (this.options.englishCommands) {
                            var metaFunc = MetaToolInfo(val.cmd);
                            if (metaFunc != undefined) {
                                var meta = metaFunc(val.cmd);
                                label = meta.label;
                            }
                        }
                        this.commands.push(val.cmd);
                        if (this.commandCategories[group.name] == undefined) {
                            this.commandCategories[group.name] = [];
                        }
                        this.commandCategories[group.name].push(val.cmd);
                        $ul.append(this.createLI(val.cmd, label));
                    }, this));
                    commands.push({
                        title: group.title,
                        category: group.name,
                        body: $ul
                    });
                }, this));
                this.loadedCallback($elem, commands);
            }, this));
        },
        createLI: function(cmd, label, func) {
            if (label == undefined) {
                label = cmd;
            }
            if (func == undefined) {
                func = this.options.link;
            }
            var $li = $("<li></li>").append($("<a></a>").attr("href", "#").attr("title", cmd).data("type", "invocation").text(label).bind("click", func));
            $li.kbaseButtonControls({
                context: this,
                controls: [ {
                    icon: "icon-question",
                    callback: function(e, $ic) {
                        if ($ic.options.terminal != undefined) {
                            $ic.options.terminal.run(cmd + " -h");
                        }
                    },
                    id: "helpButton"
                } ]
            });
            return $li;
        },
        loadedCallback: function($elem, commands) {
            var that = this;
            $("input,textarea").on("focus.kbaseIrisCommands", $.proxy(function(e) {
                if ($(":focus").get(0) != undefined && $(":focus").get(0) != this.data("searchField").get(0)) {
                    this.data("focused", $(":focus"));
                }
            }, this));
            this.data("focused", $(":focus"));
            var $form = $.jqElem("form").addClass("form-search").css("margin-bottom", "2px").append($("<div></div>").css("max-height", this.options.overflow ? this.options.sectionHeight : "5000px").css("overflow", this.options.overflow ? "auto" : "visible").append($("<div></div>").addClass("input-append").addClass("pull-right").css("margin-top", "5px").attr("id", "searchFieldBox").append($("<input></input>").attr("type", "text").addClass("input-small search-query").attr("name", "search").css("padding-top", "1px").css("padding-bottom", "1px").attr("id", "searchField").attr("size", "50").keyup($.proxy(function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (e.metaKey || e.altKey || e.ctrlKey) {
                    return;
                }
                var value = this.data("searchField").val();
                if (value.length < 3) {
                    if (value.length == 0) {
                        this.data("test").animate({
                            left: "-100%"
                        }, 150);
                    }
                    return;
                }
                this.data("test").animate({
                    left: "0px"
                }, 150);
                var regex = new RegExp(value, "i");
                var commands = this.commandsMatchingRegex(regex);
                var $ul = $.jqElem("ul").css("font-size", this.options.fontSize).css("padding-left", "15px").addClass("unstyled");
                $.each(commands, $.proxy(function(idx, cmd) {
                    $ul.append(this.createLI(cmd, cmd, function(e) {
                        that.options.link.call(this, e);
                    }));
                }, this));
                if (!commands.length) {
                    $ul.append($("<li></li>").css("font-style", "italic").text("No matching commands found"));
                }
                this.data("searchResults").empty();
                this.data("searchResults").append($ul);
                this.data("searchResults").prepend($.jqElem("div").css("position", "relative").css("top", "2px").css("left", "90%").append($.jqElem("button").addClass("btn btn-mini").append($.jqElem("i").addClass("icon-remove")).on("click", $.proxy(function(e) {
                    this.data("searchField").val("");
                    this.data("searchField").trigger("keyup");
                }, this))));
            }, this))).append($.jqElem("button").addClass("btn btn-small").css("padding-top", "1px").css("padding-bottom", "1px").attr("id", "search-button").append($.jqElem("i").attr("id", "search-button-icon").addClass("icon-search")).on("click", $.proxy(function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.data("searchField").trigger("keyup");
            }, this)))));
            var $box = $.jqElem("div").kbaseBox({
                title: "Command list",
                content: $.jqElem("div").append($.jqElem("div").attr("id", "command-container").css("max-height", this.options.overflow ? this.options.sectionHeight : "5000px").css("overflow", this.options.overflow ? "auto" : "visible").append($.jqElem("div").attr("id", "test").css("position", "relative").css("left", "-100%").css("width", "200%").append($.jqElem("div").text("This is my left div right here").css("width", "50%").css("float", "left").attr("id", "searchResults")).append($.jqElem("div").css("width", "50%").css("float", "right").append($.jqElem("div").attr("id", "all-commands").css("white-space", "nowrap"))))).append($form)
            });
            $elem.append($box.$elem);
            this._rewireIds($box.$elem, this);
            this._superMethod("appendUI", this.data("all-commands"), commands);
            this.data("accordion").css("margin-bottom", "0px");
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseIrisFileBrowser", "kbaseDataBrowser", {
        version: "1.0.0",
        _accessors: [ "invocationURL", "client", "addFileCallback", "editFileCallback", "singleFileSize", "chunkSize", "stalledUploads" ],
        options: {
            stalledUploads: {},
            uploadDir: ".uploads",
            concurrentUploads: 4,
            singleFileSize: 15e6,
            chunkSize: 5e6,
            title: "File Browser",
            root: "/",
            types: {
                file: {
                    controls: [ {
                        icon: "icon-minus",
                        callback: function(e, $fb) {
                            $fb.deleteFile($(this).data("id"), "file");
                        },
                        id: "removeButton"
                    }, {
                        icon: "icon-download-alt",
                        callback: function(e, $fb) {
                            $fb.openFile($(this).data("id"));
                        },
                        id: "viewButton"
                    }, {
                        icon: "icon-pencil",
                        callback: function(e, $fb) {
                            if ($fb.editFileCallback() != undefined) {
                                $fb.editFileCallback()($(this).data("id"), $fb);
                            }
                        },
                        id: "editButton",
                        condition: function(control, $fb) {
                            var size = this.$elem.data("data").size;
                            if (size > $fb.singleFileSize()) {
                                return false;
                            } else {
                                return $fb.editFileCallback() == undefined ? false : true;
                            }
                        }
                    }, {
                        icon: "icon-arrow-right",
                        callback: function(e, $fb) {
                            if ($fb.addFileCallback() != undefined) {
                                $fb.addFileCallback()($(this).data("id"), $fb);
                            }
                        },
                        id: "addButton"
                    } ]
                },
                folder: {
                    childrenCallback: function(path, callback) {
                        this.listDirectory(path, function(results) {
                            callback(results);
                        });
                    },
                    controls: [ {
                        icon: "icon-minus",
                        callback: function(e, $fb) {
                            $fb.deleteFile($(this).data("id"), "folder");
                        },
                        id: "removeDirectoryButton"
                    }, {
                        icon: "icon-plus",
                        callback: function(e, $fb) {
                            $fb.addDirectory($(this).data("id"));
                        },
                        id: "addDirectoryButton"
                    }, {
                        icon: "icon-arrow-up",
                        callback: function(e, $fb) {
                            $fb.data("active_directory", $(this).data("id"));
                            $fb.data("fileInput").trigger("click");
                        },
                        id: "uploadFileButton"
                    } ]
                }
            }
        },
        uploadFile: function() {
            this.data("fileInput").trigger("click");
        },
        init: function(options) {
            this._super(options);
            this.listDirectory(this.options.root, $.proxy(function(results) {
                this.appendContent(results, this.data("ul-nav"));
            }, this));
            return this;
        },
        checkStalledUploads: function() {
            this.client().list_files(this.sessionId(), "/", this.options.uploadDir).done($.proxy(function(filelist) {
                var dirs = filelist[0];
                $.each(dirs, $.proxy(function(idx, dir) {
                    this.client().get_file(this.sessionId(), "chunkMap", "/" + this.options.uploadDir + "/" + dir.name).done($.proxy(function(res) {
                        var chunkMap;
                        try {
                            var chunkMap = JSON.parse(res);
                        } catch (e) {
                            this.dbg("Could not load chunk map");
                            this.dbg(e);
                        }
                        while (chunkMap.chunks.length > 0) {
                            var chunk = chunkMap.chunks.shift();
                            chunkMap.chunksByName[chunk.name] = chunk;
                            chunkMap.doneChunks.push(chunk);
                        }
                        this.checkAndMergeChunks(chunkMap);
                    }, this));
                }, this));
            }, this));
        },
        loggedInCallback: function(e, args) {
            if (args.success) {
                this.refreshDirectory("/");
                this.client().make_directory(this.sessionId(), "/", this.options.uploadDir).always($.proxy(function(res) {
                    this.checkStalledUploads();
                }, this));
            }
        },
        loggedOutCallback: function(e) {
            this.data("ul-nav").empty();
        },
        prepareRootContent: function() {
            var $ul = this._super();
            $ul.css("height", parseInt(this.options.height) - 25 + "px");
            var $pc = $("<div></div>").css("margin-top", "2px");
            $pc.kbaseButtonControls({
                onMouseover: false,
                context: this,
                controls: [ {
                    icon: "icon-plus",
                    callback: function(e, $fb) {
                        $fb.addDirectory("/");
                    }
                }, {
                    icon: "icon-arrow-up",
                    callback: function(e, $fb) {
                        $fb.data("active_directory", $(this).data("id"));
                        $fb.data("fileInput").trigger("click");
                    }
                } ]
            });
            return $("<div></div>").css("height", this.options.height).append($ul).append($pc).append($("<input></input>").attr("type", "file").attr("id", "fileInput").css("display", "none").attr("multiple", "multiple").bind("change", $.proxy(this.handleFileSelect, this)));
        },
        refreshDirectory: function(path) {
            if (this.sessionId() == undefined) {
                this.data("ul-nav").empty();
                return;
            }
            var $target;
            if (path == "/") {
                $target = this.data("ul-nav");
            } else {
                var path_target = this.targets[path];
                if (path_target == undefined) {
                    return;
                } else $target = path_target.next();
            }
            var pathRegex = new RegExp("^" + path);
            var openTargets = [];
            for (var subPath in this.targets) {
                if (subPath.match(pathRegex) && !this.targets[subPath].next().is(":hidden") && this.targets[subPath].next().is("ul")) {
                    openTargets.push(subPath);
                }
            }
            if (!$target.is(":hidden")) {
                this.listDirectory(path, $.proxy(function(results) {
                    $target.empty();
                    this.appendContent(results, $target);
                }, this), openTargets);
            }
            $.each(openTargets, $.proxy(function(idx, subPath) {
                var $target = this.targets[subPath].next();
                this.listDirectory(subPath, $.proxy(function(results) {
                    $target.empty();
                    this.appendContent(results, $target);
                    $target.show();
                }, this));
            }, this));
        },
        listDirectory: function(path, callback) {
            this.client().list_files(this.sessionId(), "/", path, jQuery.proxy(function(filelist) {
                var dirs = filelist[0];
                var files = filelist[1];
                var results = [];
                var $fb = this;
                jQuery.each(dirs, $.proxy(function(idx, val) {
                    val["full_path"] = val["full_path"].replace(/\/+/g, "/");
                    results.push({
                        type: "folder",
                        id: val.full_path,
                        label: val.name,
                        open: $fb.openTargets[val["full_path"]]
                    });
                }, this));
                jQuery.each(files, $.proxy(function(idx, val) {
                    val["full_path"] = val["full_path"].replace(/\/+/g, "/");
                    results.push({
                        type: "file",
                        id: val.full_path,
                        label: val.name,
                        data: val
                    });
                }, this));
                results = results.sort(this.sortByKey("label", "insensitively"));
                callback(results);
            }, this), $.proxy(function(err) {
                this.dbg(err);
            }, this));
        },
        handleFileSelect: function(evt) {
            evt.preventDefault();
            var files = evt.target.files || evt.originalEvent.dataTransfer.files || evt.dataTransfer.files;
            $.each(files, jQuery.proxy(function(idx, file) {
                var upload_dir = "/";
                if (this.data("active_directory")) {
                    upload_dir = this.data("active_directory");
                }
                var fileName = file.name;
                if (this.data("override_filename")) {
                    fileName = this.data("override_filename");
                    this.data("override_filename", undefined);
                }
                var fullFilePath = upload_dir + "/" + fileName;
                fullFilePath = fullFilePath.replace(/\/\/+/g, "/");
                var pid = this.uuid();
                this.trigger("updateIrisProcess", {
                    pid: pid,
                    msg: "Uploading " + fullFilePath + " ... 0%"
                });
                if (file.size <= this.singleFileSize()) {
                    var reader = new FileReader();
                    reader.onprogress = $.proxy(function(e) {
                        this.trigger("updateIrisProcess", {
                            pid: pid,
                            msg: "Uploading " + fullFilePath + " ... " + (100 * e.loaded / e.total).toFixed(2) + "%"
                        });
                        this.dbg("progress " + e.loaded / e.total);
                        this.dbg(e);
                    }, this);
                    reader.onload = jQuery.proxy(function(e) {
                        this.client().put_file(this.sessionId(), fileName, e.target.result, upload_dir, jQuery.proxy(function(res) {
                            this.trigger("removeIrisProcess", pid);
                            this.refreshDirectory(upload_dir);
                        }, this), jQuery.proxy(function(res) {
                            this.trigger("removeIrisProcess", pid);
                            this.dbg(res);
                        }, this));
                    }, this);
                    reader.readAsBinaryString(file);
                } else {
                    var chunkUploadPath = fullFilePath;
                    chunkUploadPath = chunkUploadPath.replace(/\//g, "::");
                    var fileSize = file.size;
                    var chunkSize = this.chunkSize();
                    var chunk = 1;
                    var offset = 0;
                    var chunkMap = {
                        chunks: [],
                        doneChunks: [],
                        chunksByName: {},
                        size: 0,
                        fileName: fileName,
                        upload_dir: upload_dir,
                        fullFilePath: fullFilePath,
                        chunkUploadPath: chunkUploadPath,
                        fullUploadPath: this.options.uploadDir + "/" + chunkUploadPath,
                        pid: pid
                    };
                    if (this.stalledUploads()[chunkMap.fullFilePath] != undefined) {
                        this.data("resumed_chunkMap", this.stalledUploads()[chunkMap.fullFilePath]);
                        this.stalledUploads()[chunkMap.fullFilePath] = undefined;
                    }
                    if (this.data("resumed_chunkMap") != undefined) {
                        chunkMap = this.data("resumed_chunkMap");
                        this.trigger("removeIrisProcess", pid);
                        var percent = (100 * chunkMap.doneChunks.length / (chunkMap.doneChunks.length + chunkMap.chunks.length)).toFixed(2);
                        if (percent >= 100) {
                            percent = 99;
                        }
                        this.trigger("updateIrisProcess", {
                            pid: chunkMap.pid,
                            msg: "Uploading " + chunkMap.fullFilePath + " ... " + percent + "%"
                        });
                        this.data("resumed_chunkMap", undefined);
                    } else {
                        while (fileSize > 0) {
                            if (chunkSize > fileSize) {
                                chunkSize = fileSize;
                            }
                            fileSize -= chunkSize;
                            var pad = "00000000";
                            var paddedChunk = (pad + chunk).slice(-8);
                            chunkMap.chunks.push({
                                chunk: chunk,
                                name: "chunk." + paddedChunk,
                                start: offset,
                                end: offset + chunkSize,
                                size: chunkSize,
                                complete: false
                            });
                            chunkMap.size += chunkSize;
                            offset = offset + chunkSize;
                            chunk++;
                        }
                    }
                    var callback = $.proxy(function(res) {
                        $.each(chunkMap.chunks, function(idx, chunk) {
                            chunkMap.chunksByName[chunk.name] = chunk;
                        });
                        var chunker = this.makeChunkUploader(file, chunkMap);
                        for (var i = 0; i < this.options.concurrentUploads; i++) {
                            chunker();
                        }
                    }, this);
                    this.client().make_directory(this.sessionId(), "/" + this.options.uploadDir, chunkMap.chunkUploadPath).always($.proxy(function() {
                        this.client().put_file(this.sessionId(), "chunkMap", JSON.stringify(chunkMap, undefined, 2), "/" + chunkMap.fullUploadPath).done(callback).fail($.proxy(function(res) {
                            this.dbg(res);
                        }, this));
                    }, this));
                }
            }, this));
            this.data("fileInput").val("");
        },
        makeChunkUploader: function(file, chunkMap) {
            chunkMap.jobs = 0;
            var $fb = this;
            return function() {
                var recursion = arguments.callee;
                if (chunkMap.chunks.length > 0) {
                    var chunk = chunkMap.chunks.shift();
                    var slice = file.slice || file.webkitSlice || file.mozSlice;
                    var blob = slice.call(file, chunk.start, chunk.end);
                    var reader = new FileReader();
                    reader.onloadend = function(e) {
                        if (e.target.readyState == FileReader.DONE) {
                            $fb.client().put_file($fb.sessionId(), chunk.name, e.target.result, "/" + chunkMap.fullUploadPath, function(res) {
                                chunkMap.doneChunks.push(chunk);
                                var percent = (100 * chunkMap.doneChunks.length / (chunkMap.jobs - 1 + chunkMap.doneChunks.length + chunkMap.chunks.length)).toFixed(2);
                                if (percent >= 100) {
                                    percent = 99;
                                }
                                $fb.trigger("updateIrisProcess", {
                                    pid: chunkMap.pid,
                                    msg: "Uploading " + chunkMap.fullFilePath + " ... " + percent + "%"
                                });
                                chunkMap.jobs--;
                                recursion();
                            }, function(res) {
                                chunkMap.jobs--;
                                chunkMap.chunks.push(chunk);
                                recursion();
                            });
                        }
                    };
                    chunkMap.jobs++;
                    reader.readAsBinaryString(blob);
                } else if (chunkMap.jobs == 0) {
                    $fb.checkAndMergeChunks(chunkMap, recursion);
                } else {}
            };
        },
        checkAndMergeChunks: function(chunkMap, chunkUploader) {
            this.client().list_files(this.sessionId(), "/" + this.options.uploadDir, chunkMap.chunkUploadPath, $.proxy(function(filelist) {
                var dirs = filelist[0];
                var files = filelist[1];
                var results = [];
                var $fb = this;
                var canMerge = true;
                var successfulChunks = 0;
                var fileSizes = {};
                jQuery.each(files, $.proxy(function(idx, val) {
                    fileSizes[val.name] = val.size;
                }, this));
                var concatenatedFileSize = fileSizes["upload"] || 0;
                var newDoneChunks = [];
                chunkMap.doneChunks = chunkMap.doneChunks.sort(this.sortByKey("name"));
                $.each(chunkMap.doneChunks, $.proxy(function(idx, chunk) {
                    var size = chunk.size;
                    if (size == fileSizes[chunk.name]) {
                        chunk.complete = true;
                        successfulChunks++;
                        newDoneChunks.push(chunk);
                    } else if (fileSizes[chunk.name] == undefined && concatenatedFileSize > 0) {
                        concatenatedFileSize -= size;
                        chunk.complete = true;
                        successfulChunks++;
                    } else {
                        chunk.complete = false;
                        chunkMap.chunks.push(chunk);
                        canMerge = false;
                    }
                }, this));
                chunkMap.doneChunks = newDoneChunks;
                if (concatenatedFileSize != 0) {
                    canMerge = false;
                    var smallestFile = Object.keys(fileSizes).sort()[0];
                    var smallestSize = fileSizes[smallestFile];
                    if (concatenatedFileSize - smallestSize == 0) {
                        var newDoneChunks = [];
                        for (var idx = 0; idx < chunkMap.doneChunks.length; idx++) {
                            var chunk = chunkMap.doneChunks[idx];
                            if (chunk.name != smallestFile) {
                                newDoneChunks.push(chunk);
                            }
                        }
                        chunkMap.doneChunks = newDoneChunks;
                        canMerge = true;
                    } else {
                        var $pe = $("<div></div>").text("Uploading " + chunkMap.fullFilePath + " failed. Please start over");
                        $pe.kbaseButtonControls({
                            onMouseover: true,
                            context: this,
                            controls: [ {
                                icon: "icon-ban-circle",
                                tooltip: "Cancel",
                                callback: function(e, $fb) {
                                    $fb.client().remove_directory($fb.sessionId(), "/", "/" + chunkMap.fullUploadPath, function() {
                                        $fb.trigger("removeIrisProcess", chunkMap.pid);
                                    });
                                }
                            } ]
                        });
                        this.trigger("updateIrisProcess", {
                            pid: chunkMap.pid,
                            content: $pe
                        });
                        return;
                    }
                }
                if (canMerge) {
                    var merger = this.makeChunkMerger(chunkMap);
                    merger();
                } else if (chunkUploader) {
                    chunkUploader();
                } else {
                    var percent = (100 * chunkMap.doneChunks.length / (chunkMap.doneChunks.length + chunkMap.chunks.length)).toFixed(2);
                    if (percent >= 100) {
                        percent = 99;
                    }
                    var $pe = $("<div></div>").text("Uploading " + chunkMap.fullFilePath + " ...stalled at " + percent + "%");
                    $pe.kbaseButtonControls({
                        onMouseover: true,
                        context: this,
                        controls: [ {
                            icon: "icon-refresh",
                            callback: function(e, $fb) {
                                $fb.data("resumed_chunkMap", chunkMap);
                                $fb.data("fileInput").trigger("click");
                            }
                        }, {
                            icon: "icon-ban-circle",
                            callback: function(e, $fb) {
                                $fb.client().remove_directory($fb.sessionId(), "/", "/" + chunkMap.fullUploadPath, function() {
                                    $fb.trigger("removeIrisProcess", chunkMap.pid);
                                    $fb.refreshDirectory("/" + target_dir);
                                });
                            }
                        } ]
                    });
                    this.trigger("updateIrisProcess", {
                        pid: chunkMap.pid,
                        content: $pe
                    });
                    this.stalledUploads()[chunkMap.fullFilePath] = chunkMap;
                }
            }, this));
        },
        makeChunkMerger: function(chunkMap) {
            var $fb = this;
            var mergedUploadPath = chunkMap.fullUploadPath + "/upload";
            var mergePercent = chunkMap.doneChunks.length ? 1 / chunkMap.doneChunks.length : 0;
            var mergeCounter = 1;
            return function() {
                if (chunkMap.doneChunks.length == 0) {
                    $fb.client().rename_file($fb.sessionId(), "/", mergedUploadPath, chunkMap.fullFilePath, function() {
                        $fb.client().remove_directory($fb.sessionId(), "/", chunkMap.fullUploadPath, function() {
                            $fb.trigger("removeIrisProcess", chunkMap.pid);
                            $fb.refreshDirectory(chunkMap.upload_dir);
                        });
                    }, function(res) {
                        this.dbg("rename file failure");
                        this.dbg(res);
                    });
                    return;
                }
                var chunk = chunkMap.doneChunks.shift();
                var recursion = arguments.callee;
                $fb.client().run_pipeline($fb.sessionId(), "cat " + chunkMap.fullUploadPath + "/" + chunk.name + " >> " + mergedUploadPath, [], 0, "/", $.proxy(function(runout) {
                    if (runout) {
                        var output = runout[0];
                        var error = runout[1];
                        var newPercent = (99 + mergeCounter++ * mergePercent).toFixed(2);
                        $fb.trigger("updateIrisProcess", {
                            pid: chunkMap.pid,
                            msg: "Uploading " + chunkMap.fullFilePath + " ... " + newPercent + "%"
                        });
                        if (!error.length) {
                            $fb.client().remove_files($fb.sessionId(), "/" + chunkMap.fullUploadPath, chunk.name, $.proxy(function(res) {
                                recursion();
                            }, $fb));
                        }
                    }
                }, this), function(res) {
                    this.dbg("OMFG ERR");
                    this.dbg(res);
                });
            };
        },
        openFile: function(file) {
            var url = this.options.invocationURL + "/download/" + file + "?session_id=" + this.sessionId();
            window.location.href = url;
        },
        deleteFile: function(file, type) {
            var deleteMethod = type == "file" ? "remove_files" : "remove_directory";
            file = file.replace(/\/+$/, "");
            var matches = file.match(/(.+)\/[^/]+$/);
            var active_dir = "/";
            if (matches != undefined && matches.length > 1) {
                active_dir = matches[1];
            }
            var that = this;
            var promptFile = file.replace(this.options.root, "");
            var $deleteModal = $("<div></div>").kbaseDeletePrompt({
                name: promptFile,
                callback: function(e, $prompt) {
                    $prompt.closePrompt();
                    that.client()[deleteMethod](that.sessionId(), "/", file, function(res) {
                        that.refreshDirectory(active_dir);
                    });
                }
            });
            $deleteModal.openPrompt();
        },
        addDirectory: function(parentDir) {
            var that = this;
            var displayDir = parentDir.replace(this.options.root, "/");
            var $addDirectoryModal = $("<div></div>").kbasePrompt({
                title: "Create directory",
                body: $("<p></p>").append("Create directory ").append($("<span></span>").css("font-weight", "bold").text(displayDir)).append(" ").append($("<input></input>").attr("type", "text").attr("name", "dir_name").attr("size", "20")),
                controls: [ "cancelButton", {
                    name: "Create directory",
                    type: "primary",
                    callback: function(e, $prompt) {
                        $prompt.closePrompt();
                        that.client().make_directory(that.sessionId(), parentDir, $addDirectoryModal.dialogModal().find("input").val(), function(res) {
                            that.refreshDirectory(parentDir);
                        }, function() {});
                    }
                } ]
            });
            $addDirectoryModal.openPrompt();
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseIrisFileEditor", "kbaseAuthenticatedWidget", {
        version: "1.0.0",
        _accessors: [ "client", {
            name: "file",
            setter: "setFile"
        }, "rows", "cols", "content", "loadedContent", "saveFileCallback", "cancelSaveFileCallback" ],
        options: {
            rows: 50,
            cols: 85
        },
        init: function(options) {
            this._super(options);
            this.appendUI(this.$elem);
            return this;
        },
        setFile: function(newFile) {
            this.setValueForKey("file", newFile);
            this.appendUI(this.$elem);
        },
        save: function() {
            var fileParts = this.file().split("/");
            var fileName = fileParts.pop();
            var uploadDir = fileParts.join("/");
            if (this.content() == this.loadedContent()) {
                return;
            }
            this.client().put_file(this.sessionId(), fileName, this.content(), uploadDir, jQuery.proxy(function(res) {
                this.dbg("saved file");
            }, this), jQuery.proxy(function(res) {
                throw "Could not save file " + res.error.message;
            }, this));
        },
        appendUI: function($elem) {
            $elem.empty();
            $elem.append("Loading file " + this.file() + "...<br>please wait...").append($.jqElem("br")).append($.jqElem("div").attr("align", "center").append($.jqElem("i").addClass("icon-spinner").addClass("icon-spin icon-4x")));
            this.client().get_file(this.sessionId(), this.file(), "/", $.proxy(function(res) {
                var $ui = $.jqElem("textarea").attr("rows", this.rows()).attr("cols", this.cols()).css("width", "720px").kb_bind(this, "content");
                this.content(res);
                this.loadedContent(this.content());
                $elem.empty();
                $elem.append($ui);
            }, this), function(err) {
                this.dbg("FILE FAILURE");
                this.dbg(err);
            });
        },
        savePrompt: function() {
            if (this.content() == this.loadedContent()) {
                if (this.saveFileCallback) {
                    this.saveFileCallback()(this.file());
                }
                return;
            }
            var $saveModal = $.jqElem("div").kbasePrompt({
                title: "Save changes",
                body: "Save changes to <strong>" + this.file() + "</strong> before closing?",
                controls: [ {
                    name: "Close without save",
                    callback: $.proxy(function(e, $prompt) {
                        $prompt.closePrompt();
                        if (this.cancelSaveFileCallback) {
                            this.cancelSaveFileCallback()(this.file());
                        }
                    }, this)
                }, {
                    name: "Close and save",
                    type: "primary",
                    callback: $.proxy(function(e, $prompt) {
                        $prompt.closePrompt();
                        this.save();
                        if (this.saveFileCallback) {
                            this.saveFileCallback()(this.file());
                        }
                    }, this)
                } ]
            });
            $saveModal.openPrompt();
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseIrisGrammar", "kbaseWidget", {
        version: "1.0.0",
        options: {
            defaultGrammarURL: "http://www.prototypesite.net/iris-dev/grammar.json"
        },
        init: function(options) {
            this._super(options);
            if (this.options.$loginbox != undefined) {
                this.$loginbox = this.options.$loginbox;
            }
            this.appendUI($(this.$elem));
            this.retrieveGrammar(this.options.defaultGrammarURL);
            return this;
        },
        appendUI: function($elem) {},
        tokenize: function(string) {
            var tokens = [];
            var partial = "";
            var quote = undefined;
            var escaped = false;
            for (var idx = 0; idx < string.length; idx++) {
                var chr = string.charAt(idx);
                if (quote == undefined) {
                    if (chr.match(/[?;]/)) {
                        continue;
                    }
                }
                if (chr.match(/\S/) || quote != undefined) {
                    partial = partial + chr;
                } else {
                    if (partial.length) {
                        tokens.push(partial);
                        partial = "";
                    }
                    continue;
                }
                if (quote != undefined) {
                    if (chr == quote && !escaped) {
                        partial = partial.substring(1, partial.length - 1);
                        tokens.push(partial);
                        partial = "";
                        quote = undefined;
                        continue;
                    }
                }
                if (quote == undefined) {
                    if (chr == '"' || chr == "'") {
                        quote = chr;
                    }
                }
                if (chr == "\\") {
                    escaped = true;
                } else {
                    escaped = false;
                }
            }
            if (partial.length) {
                tokens.push(partial);
            }
            return tokens;
        },
        evaluate: function(string, callback) {
            var tokens = this.tokenize(string);
            var grammar = this.grammar;
            if (grammar == undefined) {
                this.retrieveGrammar(this.options.defaultGrammarURL, $.proxy(function() {
                    this.evaluate(string, callback);
                }, this));
                return;
            }
            var execute = undefined;
            var tokenVariables = undefined;
            var variables = {};
            var returnObj = {
                parsed: "",
                string: string,
                grammar: grammar._root
            };
            if (tokens[0] == "explain") {
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
                        childFound = true;
                    } else if (child.match(/^\$/)) {
                        returnObj.grammar = returnObj.grammar.children[child];
                        childFound = true;
                    } else if (token == child) {
                        returnObj.grammar = returnObj.grammar.children[child];
                        childFound = true;
                    } else if (!info.caseSensitive) {
                        var regex = new RegExp("^" + child + "$", "i");
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
                            returnObj.parsed = returnObj.parsed + " " + token;
                        } else {
                            returnObj.parsed = token;
                        }
                        returnObj.grammar = info;
                        returnObj.execute = info.execute;
                        break;
                    }
                }
                if (!childFound && !returnObj.grammar.childrenOptional) {
                    returnObj.tail = tokens.splice(idx, tokens.length - idx).join(" ");
                    break;
                }
            }
            if (returnObj.grammar.children != undefined && Object.keys(returnObj.grammar.children).length && !returnObj.grammar.childrenOptional) {
                returnObj.error = "Parse error at " + token;
                returnObj.fail = 1;
                delete returnObj.execute;
                returnObj.token = token;
                returnObj.tail = tokens.splice(idx, tokens.length - idx).join(" ");
                var next = [];
                if (returnObj.grammar.children != undefined) {
                    for (prop in returnObj.grammar.children) {
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
                    returnObj.execute = returnObj.execute + " > " + m[1];
                } else {
                    returnObj.fail = 1;
                    returnObj.error = "Extra characters - " + returnObj.tail;
                }
            }
            if (callback) {
                callback(returnObj);
            }
            return returnObj;
        },
        nextForGrammar: function(next, grammar) {
            if (next == undefined) {
                next = "";
            }
            var nextGrammar = grammar[next].children;
            var ng;
            var throttle = 1e3;
            while (nextGrammar != undefined && throttle-- > 0) {
                if (Object.keys(nextGrammar).length == 1) {
                    var prop = Object.keys(nextGrammar)[0];
                    next = next.length ? next + " " + prop : prop;
                    nextGrammar = nextGrammar[prop].children;
                }
            }
            return next;
        },
        allQuestions: function(filter) {
            var questions = [ "Display the dna sequence of contig $contig_id from $max to $min", "Display the dna sequence of gene $gene_id", "What type of family is $family", "What is the function of family $family", "What fids are in family $family", "Display sequences in family $family as fasta", "Display sequences in family $family", "What is the function of feature $feature_id", "What fids in k12 have attached publications", "What publications have been connected to gene thrB", "Show the DNA sequence of fid thrB", "Display the protein sequence of fid thrB", "Which protein families contain gene $gene_id", "Is fid thrB in an atomic regulon", "Which fids appear to have correlated expression with gene thrB", "What is the location of feature thrB", "What protein sequence corresponds to fid $fid", "Which contigs are in genome $genome", "What is the size of genome $genome", "What is the KBase id of SEED genome $genome", "What is the KBase id of SEED feature $feature", "What is the source of genome $genome", "Which are the closest genomes to $genome", "What is the name of genome $genome", "Which genomes have models", "Which models exist for genome $genome", "Which reactions exist in genome $genome", "Which reactions are in model $model", "What reactions connect to role $role", "What roles relate to reaction $reaction", "What complexes implement reaction $reaction", "What reactions does complex $complex implement", "Describe the biomass reaction for model kb|fm.0", "What compounds are connected to model $model", "What media are known", "What compounds are considered part of media $media", "show reactions that connect to compound $compound", "How many otus exist", "What otus exist", "What otu contains $otu", "What genomes are in OTU $otu", "What annotations are known for protein sequence $sequence", "What roles are used in models", "What roles are used in subsystem $subsystem", "What subsystems include role $role", "What features in $feature implement role $role", "What families implement role $role", "What roles occur in subsystem $subsystem", "What roles are in subsystem $subsystem", "What genomes are in subsystem $subsystem", "What subsystems are in genome $genome", "what is the taxonomy of genome $genome", "What is the taxonomic group id of $group_id", "What genomes are in taxonomic group $group" ];
            if (filter == undefined) {
                return questions;
            } else {
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
        XXXallQuestionsBOGUS: function(grammar, prefix) {
            if (prefix == undefined) {
                prefix = "";
            }
            if (grammar == undefined) {
                if (this.grammar == undefined) {
                    this.retrieveGrammar(this.options.defaultGrammarURL, $.proxy(function() {
                        this.allQuestions();
                    }, this));
                    return;
                } else {
                    grammar = this.grammar._root.children;
                }
            }
            for (var child in grammar) {
                var childPrefix = prefix.length ? prefix + " " + child : child;
            }
        },
        retrieveGrammar: function(url, callback) {
            var token = undefined;
            $.ajax({
                async: true,
                dataType: "text",
                url: url,
                crossDomain: true,
                beforeSend: function(xhr) {
                    if (token) {
                        xhr.setRequestHeader("Authorization", token);
                    }
                },
                success: $.proxy(function(data, status, xhr) {
                    var json = JSON.parse(data);
                    this.grammar = json;
                    if (callback) {
                        callback();
                    }
                }, this),
                error: $.proxy(function(xhr, textStatus, errorThrown) {
                    this.dbg(textStatus);
                    throw xhr;
                }, this),
                type: "GET"
            });
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseIrisProcessList", "kbaseWidget", {
        version: "1.0.0",
        _accessors: [ "processList" ],
        options: {
            processList: {}
        },
        init: function(options) {
            this._super(options);
            $(document).on("updateIrisProcess.kbaseIris", $.proxy(function(e, params) {
                this.updateProcess(e, params);
            }, this));
            $(document).on("removeIrisProcess.kbaseIris", $.proxy(function(e, pid) {
                this.removeProcess(e, pid);
            }, this));
            this.appendUI(this.$elem);
            return this;
        },
        updateProcess: function(e, params) {
            var pid = params.pid;
            if (pid == undefined) {
                throw "Cannot update process w/o pid";
            }
            this.pendingLi().remove();
            var $processElem = this.processList()[pid] != undefined ? this.processList()[pid] : $.jqElem("li");
            $processElem.empty();
            if (params.msg) {
                $processElem.text(params.msg);
            } else if (params.content) {
                $processElem.append(params.content);
            }
            if (this.processList()[pid] == undefined) {
                this.$elem.find("ul").append($processElem);
                this.processList()[pid] = $processElem;
            }
            return $processElem;
        },
        removeProcess: function(e, pid) {
            if (pid == undefined) {
                throw "Cannot update process w/o pid";
            }
            var $processElem = this.processList()[pid];
            if ($processElem == undefined) {
                return;
            }
            $processElem.remove();
            if (this.$elem.find("ul").children().length == 0) {
                this.$elem.find("ul").append(this.pendingLi());
            }
            this.processList()[pid] = undefined;
            return pid;
        },
        appendUI: function($elem) {
            var $box = $elem.kbaseBox({
                title: "Running processes",
                content: $("<ul></ul>").addClass("unstyled").append(this.pendingLi())
            });
            return this;
        },
        pendingLi: function() {
            if (this.data("pendingLi") == undefined) {
                this.data("pendingLi", $("<li></li>").css("font-style", "italic").text("No processes running"));
            }
            return this.data("pendingLi");
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseIrisTerminal", "kbaseAuthenticatedWidget", {
        version: "1.0.0",
        _accessors: [ "terminalHeight", "client" ],
        options: {
            invocationURL: "http://localhost:5000",
            searchURL: "https://kbase.us/services/search-api/search/$category/$keyword?start=$start&count=$count&format=json",
            searchStart: 1,
            searchCount: 10,
            searchFilter: {
                literature: "link,pid"
            },
            maxOutput: 100,
            scrollSpeed: 750,
            terminalHeight: "450px",
            promptIfUnauthenticated: 1,
            autocreateFileBrowser: true
        },
        init: function(options) {
            this._super(options);
            $.fn.setCursorPosition = function(position) {
                if (this.length == 0) return this;
                return $(this).setSelection(position, position);
            };
            $.fn.setSelection = function(selectionStart, selectionEnd) {
                if (this.length == 0) return this;
                input = this[0];
                if (input.createTextRange) {
                    var range = input.createTextRange();
                    range.collapse(true);
                    range.moveEnd("character", selectionEnd);
                    range.moveStart("character", selectionStart);
                    range.select();
                } else if (input.setSelectionRange) {
                    input.focus();
                    input.setSelectionRange(selectionStart, selectionEnd);
                }
                return this;
            };
            $.fn.focusEnd = function() {
                this.setCursorPosition(this.val().length);
                return this;
            };
            $.fn.getCursorPosition = function() {
                if (this.length == 0) return this;
                input = this[0];
                return input.selectionEnd;
            };
            if (this.client() == undefined) {
                this.client(new InvocationService(this.options.invocationURL, undefined, $.proxy(function() {
                    var toke = this.auth() ? this.auth().token : undefined;
                    return toke;
                }, this)));
            }
            this.tutorial = $("<div></div>").kbaseIrisTutorial();
            this.commandHistory = [];
            this.commandHistoryPosition = 0;
            this.path = ".";
            this.cwd = "/";
            this.variables = {};
            this.aliases = {};
            this.appendUI($(this.$elem));
            this.fileBrowsers = [];
            if (this.options.fileBrowser) {
                this.addFileBrowser(this.options.fileBrowser);
            } else if (this.options.autocreateFileBrowser) {
                this.addFileBrowser($("<div></div>").kbaseIrisFileBrowser({
                    client: this.client(),
                    externalControls: false
                }));
            }
            return this;
        },
        loggedInCallback: function(e, args) {
            if (args.success) {
                this.client().start_session(args.user_id, $.proxy(function(newsid) {
                    this.loadCommandHistory();
                    if (args.token) {
                        this.out("Authenticated as " + args.name);
                    } else {
                        this.out("Unauthenticated logged in as " + args.kbase_sessionid);
                    }
                    this.out_line();
                    this.scroll();
                }, this), $.proxy(function(err) {
                    this.out("<i>Error on session_start:<br>" + err.error.message.replace("\n", "<br>\n") + "</i>", 0, 1);
                }, this));
                this.input_box.focus();
            }
        },
        loggedInQueryCallback: function(args) {
            this.loggedInCallback(undefined, args);
            if (!args.success && this.options.promptIfUnauthenticated) {
                this.trigger("promptForLogin");
            }
        },
        loggedOutCallback: function(e) {
            this.cwd = "/";
            this.commandHistory = undefined;
            this.terminal.empty();
        },
        addFileBrowser: function($fb) {
            this.fileBrowsers.push($fb);
        },
        open_file: function(file) {
            this.fileBrowsers[0].openFile(file);
        },
        refreshFileBrowser: function() {
            for (var idx = 0; idx < this.fileBrowsers.length; idx++) {
                this.fileBrowsers[idx].refreshDirectory(this.cwd);
            }
        },
        appendInput: function(text, spacer) {
            if (this.input_box) {
                var space = spacer == undefined ? " " : "";
                if (this.input_box.val().length == 0) {
                    space = "";
                }
                this.input_box.val(this.input_box.val() + space + text);
                this.input_box.focusEnd();
            }
        },
        appendUI: function($elem) {
            var $block = $("<div></div>").append($("<div></div>").attr("id", "terminal").css("height", this.options.terminalHeight).css("overflow", "auto").css("padding", "5px").css("font-family", "monospace")).append($("<textarea></textarea>").attr("id", "input_box").attr("style", "width : 95%;").attr("height", "3")).append($("<div></div>").attr("id", "file-uploader")).append($("<div></div>").attr("id", "panel").css("display", "none"));
            this._rewireIds($block, this);
            $elem.append($block);
            this.terminal = this.data("terminal");
            this.input_box = this.data("input_box");
            this.out("Welcome to the interactive KBase terminal!<br>\n" + "Please click the 'Sign in' button in the upper right to get started.<br>\n" + "Type <b>commands</b> for a list of commands.<br>\n" + "For usage information about a specific command, type the command name with -h or --help after it.<br>\n" + "Please visit <a href = 'http://kbase.us/for-users/tutorials/navigating-iris/' target = '_blank'>http://kbase.us/for-users/tutorials/navigating-iris/</a> or type <b>tutorial</b> for an IRIS tutorial.<br>\n" + "To find out what's new, type <b>whatsnew</b><br>\n", 0, 1);
            this.out_line();
            this.input_box.bind("keypress", jQuery.proxy(function(event) {
                this.keypress(event);
            }, this));
            this.input_box.bind("keydown", jQuery.proxy(function(event) {
                this.keydown(event);
            }, this));
            this.input_box.bind("onchange", jQuery.proxy(function(event) {
                this.dbg("change");
            }, this));
            this.data("input_box").focus();
            $(window).bind("resize", jQuery.proxy(function(event) {
                this.resize_contents(this.terminal);
            }, this));
            this.resize_contents(this.terminal);
        },
        saveCommandHistory: function() {
            this.client().put_file(this.sessionId(), "history", JSON.stringify(this.commandHistory), "/", function() {}, function() {});
        },
        loadCommandHistory: function() {
            this.client().get_file(this.sessionId(), "history", "/", jQuery.proxy(function(txt) {
                this.commandHistory = JSON.parse(txt);
                this.commandHistoryPosition = this.commandHistory.length;
            }, this), jQuery.proxy(function(e) {
                this.dbg("error on history load : ");
                this.dbg(e);
            }, this));
        },
        resize_contents: function($container) {},
        keypress: function(event) {
            if (event.which == 13) {
                event.preventDefault();
                var cmd = this.input_box.val();
                cmd = cmd.replace(/^ +/, "");
                cmd = cmd.replace(/ +$/, "");
                this.dbg("Run (" + cmd + ")");
                this.out_cmd(cmd);
                var exception = cmd + cmd;
                var m;
                if (m = cmd.match(/^\s*(\$\S+)/)) {
                    exception = m[1];
                }
                for (variable in this.variables) {
                    if (variable.match(exception)) {
                        continue;
                    }
                    var escapedVar = variable.replace(/\$/, "\\$");
                    var varRegex = new RegExp(escapedVar, "g");
                    cmd = cmd.replace(varRegex, this.variables[variable]);
                }
                this.run(cmd);
                this.scroll();
                this.input_box.val("");
            }
        },
        keydown: function(event) {
            if (event.which == 38) {
                event.preventDefault();
                if (this.commandHistoryPosition > 0) {
                    this.commandHistoryPosition--;
                }
                this.input_box.val(this.commandHistory[this.commandHistoryPosition]);
            } else if (event.which == 40) {
                event.preventDefault();
                if (this.commandHistoryPosition < this.commandHistory.length) {
                    this.commandHistoryPosition++;
                }
                this.input_box.val(this.commandHistory[this.commandHistoryPosition]);
            } else if (event.which == 39) {
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
                        var ret = this.options.grammar.evaluate(this.input_box.val());
                        if (ret != undefined && ret["next"] && ret["next"].length) {
                            var nextRegex = new RegExp("^" + toComplete);
                            var newNext = [];
                            for (var idx = 0; idx < ret["next"].length; idx++) {
                                var n = ret["next"][idx];
                                if (n.match(nextRegex)) {
                                    newNext.push(n);
                                }
                            }
                            if (newNext.length || ret.parsed.length == 0) {
                                ret["next"] = newNext;
                                if (ret["next"].length == 1) {
                                    var toCompleteRegex = new RegExp("s*" + toComplete + "s*$");
                                    this.input_box.val(this.input_box.val().replace(toCompleteRegex, ""));
                                }
                            }
                            if (ret["next"].length == 1) {
                                var pad = " ";
                                if (this.input_box.val().match(/\s+$/)) {
                                    pad = "";
                                }
                                this.appendInput(pad + ret["next"][0] + " ", 0);
                                this.selectNextInputVariable();
                                return;
                            } else if (ret["next"].length) {
                                var shouldComplete = true;
                                var regex = new RegExp(toComplete + "\\s*$");
                                for (prop in ret.next) {
                                    if (!prop.match(regex)) {
                                        shouldComplete = false;
                                    }
                                }
                                this.displayCompletions(ret["next"], toComplete);
                                return;
                            }
                        }
                        var completions = this.options.commandsElement.kbaseIrisCommands("completeCommand", toComplete);
                        if (completions.length == 1) {
                            var completion = completions[0].replace(new RegExp("^" + toComplete), "");
                            this.appendInput(completion + " ", 0);
                        } else if (completions.length) {
                            this.displayCompletions(completions, toComplete);
                        }
                    }
                }
            }
        },
        selectNextInputVariable: function(e) {
            var match;
            var pos = this.input_box.getCursorPosition();
            if (match = this.input_box.val().match(/(\$\S+)/)) {
                if (e != undefined) {
                    e.preventDefault();
                }
                var start = this.input_box.val().indexOf(match[1]);
                var end = this.input_box.val().indexOf(match[1]) + match[1].length;
                this.input_box.setSelection(start, end);
                this.input_box.setSelection(start, end);
            }
        },
        search_json_to_table: function(json, filter) {
            var $div = $("<div></div>");
            var filterRegex = new RegExp(".");
            if (filter) {
                filterRegex = new RegExp(filter.replace(/,/g, "|"));
            }
            $.each(json, $.proxy(function(idx, record) {
                var $tbl = $("<table></table>").css("border", "1px solid black").css("margin-bottom", "2px");
                var keys = Object.keys(record).sort();
                for (var idx = 0; idx < keys.length; idx++) {
                    var prop = keys[idx];
                    if (prop.match(filterRegex)) {
                        $tbl.append($("<tr></tr>").css("text-align", "left").append($("<th></th>").append(prop)).append($("<td></td>").append(record[prop])));
                    }
                }
                $div.append($tbl);
            }, this));
            return $div;
        },
        displayCompletions: function(completions, toComplete) {
            var prefix = this.options.commandsElement.kbaseIrisCommands("commonCommandPrefix", completions);
            if (prefix != undefined && prefix.length) {
                this.input_box.val(this.input_box.val().replace(new RegExp(toComplete + "s*$"), prefix));
            } else {
                prefix = toComplete;
            }
            var $commandDiv = $("<div></div>");
            this.terminal.append($commandDiv);
            var $tbl = $("<table></table>").attr("border", 1).css("margin-top", "10px").append($("<tr></tr>").append($("<th></th>").text("Suggested commands")));
            jQuery.each(completions, jQuery.proxy(function(idx, val) {
                $tbl.append($("<tr></tr>").append($("<td></td>").append($("<a></a>").attr("href", "#").text(val).bind("click", jQuery.proxy(function(evt) {
                    evt.preventDefault();
                    this.input_box.val(this.input_box.val().replace(new RegExp(prefix + "s*$"), ""));
                    this.appendInput(val + " ");
                }, this)))));
            }, this));
            $commandDiv.append($tbl);
            this.scroll();
        },
        out_cmd: function(text) {
            var $wrapperDiv = $("<div></div>").css("white-space", "pre").css("position", "relative").append($("<span></span>").addClass("command").text(">" + this.cwd + " " + text)).mouseover(function(e) {
                $(this).children().first().show();
            }).mouseout(function(e) {
                $(this).children().first().hide();
            });
            $wrapperDiv.kbaseButtonControls({
                controls: [ {
                    icon: "icon-eye-open",
                    callback: function(e) {
                        var win = window.open();
                        win.document.open();
                        var output = $("<div></div>").append($("<div></div>").css("white-space", "pre").css("font-family", "monospace").append($(this).parent().parent().next().clone()));
                        $.each(output.find("a"), function(idx, val) {
                            $(val).replaceWith($(val).html());
                        });
                        win.document.write(output.html());
                        win.document.close();
                    }
                }, {
                    icon: "icon-remove",
                    callback: function(e) {
                        $(this).parent().parent().next().remove();
                        $(this).parent().parent().next().remove();
                        $(this).parent().parent().remove();
                    }
                } ]
            });
            this.terminal.append($wrapperDiv);
        },
        out: function(text, scroll, html) {
            this.out_to_div(this.terminal, text, scroll, html);
        },
        out_to_div: function($div, text, scroll, html) {
            if (!html && typeof text == "string") {
                text = text.replace(/</g, "&lt;");
                text = text.replace(/>/g, "&gt;");
            }
            $div.append(text);
            if (scroll) {
                this.scroll(0);
            }
        },
        out_line: function(text) {
            var $hr = $("<hr/>");
            this.terminal.append($hr);
            this.scroll(0);
        },
        scroll: function(speed) {
            if (speed == undefined) {
                speed = this.options.scrollSpeed;
            }
            this.terminal.animate({
                scrollTop: this.terminal.prop("scrollHeight") - this.terminal.height()
            }, speed);
        },
        cleanUp: function($commandDiv) {
            setTimeout(function() {
                var cleanupTime = 5e3;
                setTimeout(function() {
                    $commandDiv.prev().fadeOut(500, function() {
                        $commandDiv.prev().remove();
                    });
                }, cleanupTime);
                setTimeout(function() {
                    $commandDiv.next().fadeOut(500, function() {
                        $commandDiv.next().remove();
                    });
                }, cleanupTime);
                setTimeout(function() {
                    $commandDiv.fadeOut(500, function() {
                        $commandDiv.remove();
                    });
                }, cleanupTime);
            }, 1e3);
        },
        run: function(command) {
            if (command == "help") {
                this.out('There is an introductory Iris tutorial available <a target="_blank" href="http://kbase.us/developer-zone/tutorials/iris/introduction-to-the-kbase-iris-interface/">on the KBase tutorials website</a>.', 0, 1);
                return;
            }
            var $commandDiv = $("<div></div>").css("white-space", "pre");
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
                this.client().start_session(sid, jQuery.proxy(function(newsid) {
                    var auth = {
                        kbase_sessionid: sid,
                        success: true
                    };
                    this.terminal.empty();
                    this.trigger("logout", false);
                    this.trigger("loggedIn", auth);
                }, this), jQuery.proxy(function(err) {
                    this.out_to_div($commandDiv, "<i>Error on session_start:<br>" + err.error.message.replace("\n", "<br>\n") + "</i>", 0, 1);
                }, this));
                this.scroll();
                return;
            }
            if (m = command.match(/^authenticate\s*(.*)/)) {
                var args = m[1].split(/\s+/);
                if (args.length != 1) {
                    this.out_to_div($commandDiv, "Invalid login syntax.");
                    return;
                }
                sid = args[0];
                this.trigger("promptForLogin", {
                    user_id: sid
                });
                return;
            }
            if (m = command.match(/^unauthenticate/)) {
                this.trigger("logout");
                this.scroll();
                return;
            }
            if (m = command.match(/^logout/)) {
                this.trigger("logout", false);
                this.scroll();
                return;
            }
            if (!this.sessionId()) {
                this.out_to_div($commandDiv, "You are not logged in.");
                this.scroll();
                return;
            }
            this.commandHistory.push(command);
            this.saveCommandHistory();
            this.commandHistoryPosition = this.commandHistory.length;
            if (command == "clear") {
                this.terminal.empty();
                return;
            }
            if (command == "history") {
                var data = {
                    structure: {
                        header: [],
                        rows: []
                    },
                    sortable: true
                };
                jQuery.each(this.commandHistory, jQuery.proxy(function(idx, val) {
                    data.structure.rows.push([ idx, {
                        value: $("<a></a>").attr("href", "#").text(val).bind("click", jQuery.proxy(function(evt) {
                            evt.preventDefault();
                            this.appendInput(val + " ");
                        }, this)),
                        style: "padding-left : 10px"
                    } ]);
                }, this));
                var $tbl = $.jqElem("div").kbaseTable(data);
                this.out_to_div($commandDiv, $tbl.$elem);
                return;
            } else if (m = command.match(/^!(\d+)/)) {
                command = this.commandHistory.item(m[1]);
            }
            if (m = command.match(/^cd\s*(.*)/)) {
                var args = m[1].split(/\s+/);
                if (args.length != 1) {
                    this.out_to_div($commandDiv, "Invalid cd syntax.");
                    return;
                }
                dir = args[0];
                this.client().change_directory(this.sessionId(), this.cwd, dir, jQuery.proxy(function(path) {
                    this.cwd = path;
                }, this), jQuery.proxy(function(err) {
                    var m = err.error.message.replace("/\n", "<br>\n");
                    this.out_to_div($commandDiv, "<i>Error received:<br>" + err.error.code + "<br>" + m + "</i>", 0, 1);
                    this.cleanUp($commandDiv);
                }, this));
                return;
            }
            if (m = command.match(/^(\$\S+)\s*=\s*(\S+)/)) {
                this.variables[m[1]] = m[2];
                this.out_to_div($commandDiv, m[1] + " set to " + m[2]);
                return;
            }
            if (m = command.match(/^alias\s+(\S+)\s*=\s*(\S+)/)) {
                this.aliases[m[1]] = m[2];
                this.out_to_div($commandDiv, m[1] + " set to " + m[2]);
                return;
            }
            if (m = command.match(/^upload\s*(\S+)?$/)) {
                var file = m[1];
                if (this.fileBrowsers.length) {
                    var $fb = this.fileBrowsers[0];
                    if (file) {
                        $fb.data("override_filename", file);
                    }
                    $fb.data("active_directory", this.cwd);
                    $fb.uploadFile();
                }
                return;
            }
            if (m = command.match(/^#\s*(.+)/)) {
                $commandDiv.prev().remove();
                this.out_to_div($commandDiv, $("<i></i>").text(m[1]));
                return;
            }
            if (m = command.match(/^whatsnew/)) {
                $commandDiv.css("white-space", "");
                $.ajax({
                    async: true,
                    dataType: "text",
                    url: "whatsnew.html",
                    crossDomain: true,
                    success: $.proxy(function(data, status, xhr) {
                        $commandDiv.append(data);
                        this.scroll();
                    }, this),
                    error: $.proxy(function(xhr, textStatus, errorThrown) {
                        $commandDiv.append(xhr.responseText);
                        this.scroll();
                    }, this),
                    type: "GET"
                });
                return;
            }
            if (m = command.match(/^view\s+(\S+)$/)) {
                var file = m[1];
                this.client().get_file(this.sessionId(), file, this.cwd).done($.proxy(function(res) {
                    if (file.match(/\.(jpg|gif|png)$/)) {
                        var $img = $.jqElem("img").attr("src", "data:image/jpeg;base64," + btoa(res));
                        $commandDiv.append($img);
                    } else {
                        $commandDiv.append(res);
                    }
                    this.scroll();
                }, this)).fail($.proxy(function(res) {
                    $commandDiv.append($.jqElem("i").text("No such file"));
                    this.cleanUp($commandDiv);
                }, this));
                return;
            }
            if (m = command.match(/^search\s+(\S+)\s+(\S+)(?:\s*(\S+)\s+(\S+)(?:\s*(\S+))?)?/)) {
                var parsed = this.options.grammar.evaluate(command);
                var searchVars = {};
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
                $.ajax({
                    type: "GET",
                    url: searchURL,
                    dataType: "json",
                    crossDomain: true,
                    xhrFields: {
                        withCredentials: true
                    },
                    xhrFields: {
                        withCredentials: true
                    },
                    beforeSend: function(xhr) {
                        xhr.withCredentials = true;
                    },
                    success: $.proxy(function(data, res, jqXHR) {
                        this.out_to_div($commandDiv, $("<br>"));
                        this.out_to_div($commandDiv, $("<i></i>").html("Command completed."));
                        this.out_to_div($commandDiv, $("<br>"));
                        this.out_to_div($commandDiv, $("<span></span>").append($("<b></b>").html(data.found)).append(" records found."));
                        this.out_to_div($commandDiv, $("<br>"));
                        this.out_to_div($commandDiv, this.search_json_to_table(data.body, filter));
                        var res = this.search_json_to_table(data.body, filter);
                        this.scroll();
                    }, this),
                    error: $.proxy(function(jqXHR, textStatus, errorThrown) {
                        this.out_to_div($commandDiv, errorThrown);
                    }, this)
                });
                return;
            }
            if (m = command.match(/^cp\s*(.*)/)) {
                var args = m[1].split(/\s+/);
                if (args.length != 2) {
                    this.out_to_div($commandDiv, "Invalid cp syntax.");
                    return;
                }
                from = args[0];
                to = args[1];
                this.client().copy(this.sessionId(), this.cwd, from, to, $.proxy(function() {
                    this.refreshFileBrowser();
                }, this), jQuery.proxy(function(err) {
                    var m = err.error.message.replace("\n", "<br>\n");
                    this.out_to_div($commandDiv, "<i>Error received:<br>" + err.error.code + "<br>" + m + "</i>", 0, 1);
                    this.cleanUp($commandDiv);
                }, this));
                return;
            }
            if (m = command.match(/^mv\s*(.*)/)) {
                var args = m[1].split(/\s+/);
                if (args.length != 2) {
                    this.out_to_div($commandDiv, "Invalid mv syntax.");
                    return;
                }
                from = args[0];
                to = args[1];
                this.client().rename_file(this.sessionId(), this.cwd, from, to, $.proxy(function() {
                    this.refreshFileBrowser();
                }, this), jQuery.proxy(function(err) {
                    var m = err.error.message.replace("\n", "<br>\n");
                    this.out_to_div($commandDiv, "<i>Error received:<br>" + err.error.code + "<br>" + m + "</i>", 0, 1);
                    this.cleanUp($commandDiv);
                }, this));
                return;
            }
            if (m = command.match(/^mkdir\s*(.*)/)) {
                var args = m[1].split(/\s+/);
                if (args.length < 1) {
                    this.out_to_div($commandDiv, "Invalid mkdir syntax.");
                    return;
                }
                $.each(args, $.proxy(function(idx, dir) {
                    this.client().make_directory(this.sessionId(), this.cwd, dir, $.proxy(function() {
                        this.refreshFileBrowser();
                    }, this), jQuery.proxy(function(err) {
                        var m = err.error.message.replace("\n", "<br>\n");
                        this.out_to_div($commandDiv, "<i>Error received:<br>" + err.error.code + "<br>" + m + "</i>", 0, 1);
                        this.cleanUp($commandDiv);
                    }, this));
                }, this));
                return;
            }
            if (m = command.match(/^rmdir\s*(.*)/)) {
                var args = m[1].split(/\s+/);
                if (args.length < 1) {
                    this.out_to_div($commandDiv, "Invalid rmdir syntax.");
                    return;
                }
                $.each(args, $.proxy(function(idx, dir) {
                    this.client().remove_directory(this.sessionId(), this.cwd, dir, $.proxy(function() {
                        this.refreshFileBrowser();
                    }, this), jQuery.proxy(function(err) {
                        var m = err.error.message.replace("\n", "<br>\n");
                        this.out_to_div($commandDiv, "<i>Error received:<br>" + err.error.code + "<br>" + m + "</i>", 0, 1);
                        this.cleanUp($commandDiv);
                    }, this));
                }, this));
                return;
            }
            if (m = command.match(/^rm\s*(.*)/)) {
                var args = m[1].split(/\s+/);
                if (args.length < 1) {
                    this.out_to_div($commandDiv, "Invalid rm syntax.");
                    return;
                }
                $.each(args, $.proxy(function(idx, file) {
                    this.client().remove_files(this.sessionId(), this.cwd, file, $.proxy(function() {
                        this.refreshFileBrowser();
                    }, this), jQuery.proxy(function(err) {
                        var m = err.error.message.replace("\n", "<br>\n");
                        this.out_to_div($commandDiv, "<i>Error received:<br>" + err.error.code + "<br>" + m + "</i>", 0, 1);
                        this.cleanUp($commandDiv);
                    }, this));
                }, this));
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
            if (command == "tutorial list") {
                var list = this.tutorial.list();
                if (list.length == 0) {
                    this.out_to_div($commandDiv, "Could not load tutorials");
                    this.out_to_div($commandDiv, "Type <i>tutorial list</i> to see available tutorials.");
                    return;
                }
                $.each(list, $.proxy(function(idx, val) {
                    $commandDiv.append($("<a></a>").attr("href", "#").append(val.title).bind("click", $.proxy(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.out_to_div($commandDiv, "Set tutorial to <i>" + val.title + "</i><br>", 0, 1);
                        this.tutorial.retrieveTutorial(val.url);
                        this.input_box.focus();
                    }, this)).append("<br>"));
                }, this));
                this.scroll();
                return;
            }
            if (command == "show_tutorial") {
                var $page = this.tutorial.contentForCurrentPage();
                if ($page == undefined) {
                    this.out_to_div($commandDiv, "Could not load tutorial");
                    return;
                }
                $page = $page.clone();
                var headerCSS = {
                    "text-align": "left",
                    "font-size": "100%"
                };
                $page.find("h1").css(headerCSS);
                $page.find("h2").css(headerCSS);
                if (this.tutorial.currentPage > 0) {
                    $page.append("<br>Type <i>back</i> to move to the previous step in the tutorial.");
                }
                if (this.tutorial.currentPage < this.tutorial.pages.length - 1) {
                    $page.append("<br>Type <i>next</i> to move to the next step in the tutorial.");
                }
                $page.append("<br>Type <i>tutorial list</i> to see available tutorials.");
                $commandDiv.css("white-space", "");
                this.out_to_div($commandDiv, $page, 0, 1);
                this.scroll();
                return;
            }
            if (command == "commands") {
                this.client().valid_commands(jQuery.proxy(function(cmds) {
                    var data = {
                        structure: {
                            header: [],
                            rows: []
                        },
                        sortable: true,
                        hover: false
                    };
                    jQuery.each(cmds, function(idx, group) {
                        data.structure.rows.push([ {
                            value: group.title,
                            colspan: 2,
                            style: "font-weight : bold; text-align : center"
                        } ]);
                        for (var ri = 0; ri < group.items.length; ri += 2) {
                            data.structure.rows.push([ group.items[ri].cmd, group.items[ri + 1] != undefined ? group.items[ri + 1].cmd : "" ]);
                        }
                    });
                    var $tbl = $.jqElem("div").kbaseTable(data);
                    $commandDiv.append($tbl.$elem);
                    this.scroll();
                }, this));
                return;
            }
            if (m = command.match(/^questions\s*(\S+)?/)) {
                var questions = this.options.grammar.allQuestions(m[1]);
                var data = {
                    structure: {
                        header: [],
                        rows: []
                    },
                    sortable: true
                };
                $.each(questions, $.proxy(function(idx, question) {
                    data.structure.rows.push([ {
                        value: $.jqElem("a").attr("href", "#").text(question).bind("click", jQuery.proxy(function(evt) {
                            evt.preventDefault();
                            this.input_box.val(question);
                            this.selectNextInputVariable();
                        }, this))
                    } ]);
                }, this));
                var $tbl = $.jqElem("div").kbaseTable(data);
                $commandDiv.append($tbl.$elem);
                this.scroll();
                return;
            }
            if (d = command.match(/^ls\s*(.*)/)) {
                var args = d[1].split(/\s+/);
                var obj = this;
                if (args.length == 0) {
                    d = ".";
                } else {
                    if (args.length != 1) {
                        this.out_to_div($commandDiv, "Invalid ls syntax.");
                        return;
                    } else {
                        d = args[0];
                    }
                }
                this.client().list_files(this.sessionId(), this.cwd, d, jQuery.proxy(function(filelist) {
                    var dirs = filelist[0];
                    var files = filelist[1];
                    var allFiles = [];
                    $.each(dirs, function(idx, val) {
                        allFiles.push({
                            size: "(directory)",
                            mod_date: val.mod_date,
                            name: val.name,
                            nameTD: val.name
                        });
                    });
                    $.each(files, $.proxy(function(idx, val) {
                        allFiles.push({
                            size: val.size,
                            mod_date: val.mod_date,
                            name: val.name,
                            nameTD: $("<a></a>").text(val.name).attr("href", "#").bind("click", jQuery.proxy(function(event) {
                                event.preventDefault();
                                this.open_file(val["full_path"]);
                            }, this)),
                            url: this.options.invocationURL + "/download/" + val.full_path + "?session_id=" + this.sessionId()
                        });
                    }, this));
                    var data = {
                        structure: {
                            header: [],
                            rows: []
                        },
                        sortable: true,
                        bordered: false
                    };
                    $.each(allFiles.sort(this.sortByKey("name", "insensitively")), $.proxy(function(idx, val) {
                        data.structure.rows.push([ val.size, val.mod_date, {
                            value: val.nameTD
                        } ]);
                    }, this));
                    var $tbl = $.jqElem("div").kbaseTable(data);
                    $commandDiv.append($tbl.$elem);
                    this.scroll();
                }, this), function(err) {
                    var m = err.error.message.replace("\n", "<br>\n");
                    obj.out_to_div($commandDiv, "<i>Error received:<br>" + err.error.code + "<br>" + m + "</i>", 0, 1);
                    obj.cleanUp($commandDiv);
                });
                return;
            }
            var parsed = this.options.grammar.evaluate(command);
            if (parsed != undefined) {
                if (!parsed.fail && parsed.execute) {
                    command = parsed.execute;
                    if (parsed.explain) {
                        $commandDiv.append(parsed.execute);
                        return;
                    }
                } else if (parsed.parsed.length && parsed.fail) {
                    $commandDiv.append($("<i></i>").html(parsed.error));
                    return;
                }
            }
            var pid = this.uuid();
            var $pe = $("<div></div>").text(command);
            $pe.kbaseButtonControls({
                onMouseover: true,
                context: this,
                controls: [ {
                    icon: "icon-ban-circle",
                    callback: function(e, $term) {
                        $commandDiv.prev().remove();
                        $commandDiv.next().remove();
                        $commandDiv.remove();
                        $term.trigger("removeIrisProcess", pid);
                    }
                } ]
            });
            this.trigger("updateIrisProcess", {
                pid: pid,
                content: $pe
            });
            this.client().run_pipeline(this.sessionId(), command, [], this.options.maxOutput, this.cwd, jQuery.proxy(function(runout) {
                this.trigger("removeIrisProcess", pid);
                if (runout) {
                    var output = runout[0];
                    var error = runout[1];
                    this.refreshFileBrowser();
                    if (output.length > 0 && output[0].indexOf("	") >= 0) {
                        var $tbl = $("<table></table>");
                        jQuery.each(output, jQuery.proxy(function(idx, val) {
                            var parts = val.split(/\t/);
                            var $row = $("<tr></tr>");
                            jQuery.each(parts, jQuery.proxy(function(idx, val) {
                                $row.append($("<td></td>").html(val));
                                if (idx > 0) {
                                    $row.children().last().css("padding-left", "15px");
                                }
                                if (idx < parts.length - 1) {
                                    $row.children().last().css("padding-right", "15px");
                                }
                            }, this));
                            $tbl.append($row);
                        }, this));
                        $commandDiv.append($tbl);
                    } else {
                        jQuery.each(output, jQuery.proxy(function(idx, val) {
                            this.out_to_div($commandDiv, val, 0);
                        }, this));
                    }
                    if (error.length) {
                        jQuery.each(error, jQuery.proxy(function(idx, val) {
                            this.out_to_div($commandDiv, $("<i></i>").html(val));
                        }, this));
                        if (error.length != 1 || !error[0].match(/^Output truncated/)) {
                            this.cleanUp($commandDiv);
                        }
                    } else {
                        this.out_to_div($commandDiv, $("<i></i>").html("<br>Command completed."));
                    }
                } else {
                    this.out_to_div($commandDiv, "Error running command.");
                    this.cleanUp($commandDiv);
                }
                this.scroll();
            }, this));
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseIrisTutorial", "kbaseWidget", {
        version: "1.0.0",
        options: {
            configURL: "http://www.prototypesite.net/kbase/tutorials.cfg"
        },
        format_tutorial_url: function(doc_format_string, repo, filespec) {
            var url = doc_format_string;
            url = url.replace(/\$repo/, repo);
            url = url.replace(/\$filespec/, filespec);
            return url;
        },
        list: function() {
            var output = [];
            for (key in this.repos) {
                for (var idx = 0; idx < this.repos[key].length; idx++) {
                    var tutorial = this.repos[key][idx];
                    var url = this.format_tutorial_url(this.doc_format_string, key, tutorial.file);
                    output.push({
                        title: tutorial.title,
                        url: url
                    });
                }
            }
            return output.sort(this.sortByKey("title", "insensitively"));
        },
        init: function(options) {
            this._super(options);
            this.pages = [];
            this.currentPage = -1;
            $.getJSON(this.options.configURL, $.proxy(function(data) {
                this.repos = data.repos;
                this.doc_format_string = data.doc_format_string;
                if (this.options.tutorial == undefined) {
                    this.options.tutorial = data.default;
                }
                if (this.options.tutorial) {
                    this.retrieveTutorial(this.options.tutorial);
                }
            }, this));
            return this;
        },
        retrieveTutorial: function(url) {
            this.pages = [];
            var token = undefined;
            $.ajax({
                async: true,
                dataType: "text",
                url: url,
                crossDomain: true,
                beforeSend: function(xhr) {
                    if (token) {
                        xhr.setRequestHeader("Authorization", token);
                    }
                },
                success: $.proxy(function(data, status, xhr) {
                    var $resp = $("<div></div>").append(data);
                    $.each($resp.children(), $.proxy(function(idx, page) {
                        $(page).find(".example").remove();
                        this.pages.push($(page));
                    }, this));
                    this.renderAsHTML();
                }, this),
                error: $.proxy(function(xhr, textStatus, errorThrown) {
                    this.dbg(xhr);
                    throw xhr;
                }, this),
                type: "GET"
            });
        },
        renderAsHTML: function() {
            this.$elem.empty();
            $.each(this.pages, $.proxy(function(idx, page) {
                this.$elem.append(page);
            }, this));
        },
        lastPage: function() {
            return this.pages.length - 1;
        },
        currentPage: function() {
            page = this.currentPage;
            if (this.currentPage < 0) {
                page = 0;
            }
            return this.pages[page];
        },
        goToPrevPage: function() {
            var page = this.currentPage - 1;
            if (page < 0) {
                page = 0;
            }
            this.currentPage = page;
            return page;
        },
        goToNextPage: function() {
            var page = this.currentPage + 1;
            if (page >= this.pages.length) {
                page = this.pages.length - 1;
            }
            this.currentPage = page;
            return page;
        },
        contentForPage: function(idx) {
            if (this.pages.length == 0) {
                return undefined;
            } else {
                return this.pages[this.currentPage];
            }
        },
        contentForCurrentPage: function() {
            return this.contentForPage(this.currentPage);
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseLogin", "kbaseWidget", {
        version: "1.0.0",
        options: {
            style: "text",
            loginURL: "http://kbase.us/services/authorization/Sessions/Login",
            possibleFields: [ "verified", "name", "opt_in", "kbase_sessionid", "token", "groups", "user_id", "email", "system_admin" ],
            fields: [ "name", "kbase_sessionid", "user_id", "token" ]
        },
        get_kbase_cookie: function(field) {
            var chips = {};
            var cookieString = $.cookie("kbase_session");
            if (cookieString == undefined) {
                return field == undefined ? chips : undefined;
            }
            var pairs = cookieString.split("|");
            for (var i = 0; i < pairs.length; i++) {
                var set = pairs[i].split("=");
                set[1] = set[1].replace(/PIPESIGN/g, "|");
                set[1] = set[1].replace(/EQUALSSIGN/g, "=");
                chips[set[0]] = set[1];
            }
            chips.success = 1;
            return field == undefined ? chips : chips[field];
        },
        sessionId: function() {
            return this.get_kbase_cookie("kbase_sessionid");
        },
        token: function() {
            return this.get_kbase_cookie("token");
        },
        init: function(options) {
            this._super(options);
            var kbaseCookie = this.get_kbase_cookie();
            this.$elem.empty();
            var style = "_" + this.options.style + "Style";
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
                this.data("_session", kbaseCookie);
                this.trigger("loggedIn", this.get_kbase_cookie());
            }
            $(document).on("loggedInQuery.kbase", $.proxy(function(e, callback) {
                var cookie = this.get_kbase_cookie();
                if (callback) {
                    callback(cookie);
                }
            }, this));
            $(document).on("promptForLogin.kbase", $.proxy(function(e, args) {
                if (args.user_id) {
                    this.data("passed_user_id", args.user_id);
                }
                this.openDialog();
            }, this));
            $(document).on("logout.kbase", $.proxy(function(e, rePrompt) {
                this.logout(rePrompt);
            }, this));
            return this;
        },
        registerLoginFunc: function() {
            return this.registerLogin;
        },
        specificLogoutFunc: function() {
            return this.specificLogout;
        },
        populateLoginInfo: function(args) {
            if (args.success) {
                this.data("_session", args);
                this._error = undefined;
            } else {
                this.data("_session", {});
                this._error = args.message;
            }
        },
        session: function(key, value) {
            if (this.data("_session") == undefined) {
                this.data("_session", {});
            }
            var session = this.data("_session");
            if (arguments.length == 2) {
                session[key] = value;
            }
            if (arguments.length > 0) {
                return session[key];
            } else {
                return session;
            }
        },
        error: function(new_error) {
            if (new_error) {
                this._error = new_error;
            }
            return this._error;
        },
        openDialog: function() {
            if (this.data("loginDialog")) {
                var $ld = this.data("loginDialog");
                $("form", $ld.dialogModal()).get(0).reset();
                $ld.dialogModal().data("user_id").val(this.session("user_id") || this.data("passed_user_id") || this.options.user_id);
                delete this.options.user_id;
                this.session("user_id", undefined);
                $ld.dialogModal().trigger("clearMessages");
                this.data("loginDialog").openPrompt();
            }
        },
        _textStyle: function() {
            this._createLoginDialog();
            this.$elem.css("padding", "9px 15px 7px 10px");
            var $prompt = $("<span></span>").append($("<a></a>").attr("id", "loginlink").attr("href", "#").text("Sign In").bind("click", $.proxy(function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.openDialog();
            }, this))).append($("<div></div>").addClass("btn-group").attr("id", "userdisplay").css("display", "none").append($("<button></button>").addClass("btn").addClass("btn-mini").addClass("dropdown-toggle").append($("<i></i>").addClass("icon-user")).append($("<i></i>").addClass("icon-caret-down")).bind("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).next().toggle();
            })).append($("<ul></ul>").addClass("dropdown-menu").addClass("pull-right").css("padding", "3px").attr("id", "login-dropdown-menu").append($("<li></li>").css("border-bottom", "1px solid lightgray").css("white-space", "nowrap").append($("<span></span>").css("white-space", "nowrap").append("Signed in as ").append($("<a></a>").attr("id", "loggedinuser_id").css("font-weight", "bold").attr("href", "https://gologin.kbase.us/account/UpdateProfile").attr("target", "_blank").css("padding-right", "0px").css("padding-left", "0px")))).append($("<li></li>").addClass("pull-right").append($("<span></span>").append($("<a></a>").css("padding-right", "0px").css("padding-left", "0px").append("Sign out")).bind("click", $.proxy(function(e) {
                e.stopPropagation();
                e.preventDefault();
                this.data("login-dropdown-menu").hide();
                this.logout();
            }, this))))));
            this._rewireIds($prompt, this);
            this.registerLogin = function(args) {
                if (args.success) {
                    this.data("loginlink").hide();
                    this.data("loggedinuser_id").text(args.name);
                    this.data("userdisplay").show();
                    this.data("loginDialog").closePrompt();
                } else {
                    this.data("loginDialog").dialogModal().trigger("error", args.message);
                }
            };
            this.specificLogout = function(args) {
                this.data("userdisplay").hide();
                this.data("loginlink").show();
            };
            return $prompt;
        },
        _hiddenStyle: function() {
            this._createLoginDialog();
            this.registerLogin = function(args) {
                if (args.success) {
                    this.data("loginDialog").closePrompt();
                } else {
                    this.data("loginDialog").dialogModal().trigger("error", args.message);
                }
            };
            return undefined;
        },
        _slimStyle: function() {
            this.data("loginDialog", undefined);
            var $prompt = $("<span></span>").addClass("form-inline").append($("<span></span>").attr("id", "entrance").append($("<span></span>").addClass("input-prepend input-append").append($("<span></span>").addClass("add-on").append("username: ").bind("click", function(e) {
                $(this).next().focus();
            })).append($("<input/>").attr("type", "text").attr("name", "user_id").attr("id", "user_id").attr("size", "20").val(this.options.user_id)).append($("<span></span>").addClass("add-on").append(" password: ").bind("click", function(e) {
                $(this).next().focus();
            })).append($("<input/>").attr("type", "password").attr("name", "password").attr("id", "password").attr("size", "20")).append($("<button></button>").attr("id", "loginbutton").addClass("btn btn-primary").append($("<i></i>").attr("id", "loginicon").addClass("icon-lock"))))).append($("<span></span>").attr("id", "userdisplay").attr("style", "display : none;").addClass("input-prepend").append($("<span></span>").addClass("add-on").append("Logged in as ").append($("<span></span>").attr("id", "loggedinuser_id").attr("style", "font-weight : bold").append("user_id\n"))).append($("<button></button>").addClass("btn").attr("id", "logoutbutton").append($("<i></i>").attr("id", "logouticon").addClass("icon-signout"))));
            this._rewireIds($prompt, this);
            this.data("password").keypress($.proxy(function(e) {
                if (e.keyCode == 13) {
                    this.data("loginbutton").trigger("click");
                    e.stopPropagation();
                }
            }, this));
            this.registerLogin = function(args) {
                this.data("loginicon").removeClass().addClass("icon-lock");
                if (args.success) {
                    this.data("entrance").hide();
                    this.data("user_id").val("");
                    this.data("password").val("");
                    this.data("loggedinuser_id").text(args.name);
                    this.data("userdisplay").show();
                } else {
                    var $errorModal = $("<div></div>").kbasePrompt({
                        title: "Login failed",
                        body: $("<div></div>").attr("class", "alert alert-error").append($("<div></div>").append($("<div></div>").addClass("pull-left").append($("<i></i>").addClass("icon-warning-sign").attr("style", "float: left; margin-right: .3em;"))).append($("<div></div>").append($("<strong></strong>").append(args.message)))),
                        controls: [ "okayButton" ]
                    });
                    $errorModal.openPrompt();
                }
            };
            this.specificLogout = function(args) {
                this.data("userdisplay").hide();
                this.data("entrance").show();
            };
            this.data("loginbutton").bind("click", $.proxy(function(evt) {
                this.data("loginicon").removeClass().addClass("icon-refresh");
                this.login(this.data("user_id").val(), this.data("password").val(), function(args) {
                    this.registerLogin(args);
                    if (this.options.login_callback) {
                        this.options.login_callback.call(this, args);
                    }
                });
            }, this));
            this.data("logoutbutton").bind("click", $.proxy(function(e) {
                this.logout();
                this.data("user_id").focus();
            }, this));
            return $prompt;
        },
        _microStyle: function() {
            var $prompt = $("<span></span>").append($("<button></button>").addClass("btn btn-primary").attr("id", "loginbutton").append($("<i></i>").attr("id", "loginicon").addClass("icon-lock")));
            this._rewireIds($prompt, this);
            this._createLoginDialog();
            this.data("loginbutton").bind("click", $.proxy(function(evt) {
                this.openDialog();
            }, this));
            this.registerLogin = function(args) {
                if (args.success) {
                    this.data("loginDialog").dialogModal().trigger("clearMessages");
                    this.data("loginDialog").closePrompt();
                    this.data("loginbutton").tooltip({
                        title: "Logged in as " + args.name
                    });
                    this.data("loginicon").removeClass().addClass("icon-user");
                    this.data("loginbutton").bind("click", $.proxy(function(evt) {
                        this.logout();
                    }, this));
                } else {
                    this.data("loginDialog").dialogModal().trigger("error", args.message);
                }
            };
            this.specificLogout = function() {
                this.data("loginbutton").tooltip("destroy");
                this.data("loginicon").removeClass().addClass("icon-lock");
            };
            return $prompt;
        },
        _buttonStyle: function() {
            var $prompt = $("<div></div>").attr("style", "width : 250px; border : 1px solid gray").append($("<h4></h4>").attr("style", "padding : 5px; margin-top : 0px; background-color : lightgray ").addClass("text-center").append("User\n")).append($("<div></div>").attr("id", "entrance").append($("<p></p>").attr("style", "text-align : center").append($("<button></button>").attr("id", "loginbutton").append("Login").addClass("btn btn-primary")))).append($("<div></div>").attr("id", "userdisplay").attr("style", "display : none;").append($("<p></p>").attr("style", "text-align : center").append("Logged in as ").append($("<span></span>").attr("id", "loggedinuser_id").attr("style", "font-weight : bold").append("user_id\n")).append($("<button></button>").attr("id", "logoutbutton").append("Logout\n").addClass("btn"))));
            this._rewireIds($prompt, this);
            this._createLoginDialog();
            this.data("loginbutton").bind("click", $.proxy(function(event) {
                this.openDialog();
            }, this));
            this.data("logoutbutton").bind("click", $.proxy(this.logout, this));
            this.registerLogin = function(args) {
                if (args.success) {
                    this.data("loginDialog").dialogModal().trigger("clearMessages");
                    this.data("entrance").hide();
                    this.data("loggedinuser_id").text(args.name);
                    this.data("userdisplay").show();
                    this.data("loginDialog").closePrompt();
                } else {
                    this.data("loginDialog").dialogModal().trigger("error", args.message);
                }
            };
            this.specificLogout = function(args) {
                this.data("userdisplay").hide();
                this.data("entrance").show();
            };
            return $prompt;
        },
        _createLoginDialog: function() {
            var $elem = this.$elem;
            var $ld = $("<div></div").kbasePrompt({
                title: "Login to KBase",
                controls: [ "cancelButton", {
                    name: "Login",
                    type: "primary",
                    id: "loginbutton",
                    callback: $.proxy(function(e) {
                        var user_id = this.data("loginDialog").dialogModal().data("user_id").val();
                        var password = this.data("loginDialog").dialogModal().data("password").val();
                        this.data("loginDialog").dialogModal().trigger("message", user_id);
                        this.login(user_id, password, function(args) {
                            if (this.registerLogin) {
                                this.registerLogin(args);
                            }
                            if (this.options.login_callback) {
                                this.options.login_callback.call(this, args);
                            }
                        });
                    }, this)
                } ],
                body: $("<p></p>").append($("<form></form>").attr("name", "form").attr("id", "form").addClass("form-horizontal").append($("<fieldset></fieldset>").append($("<div></div>").attr("class", "alert alert-error").attr("id", "error").attr("style", "display : none").append($("<div></div>").append($("<div></div>").addClass("pull-left").append($("<i></i>").addClass("icon-warning-sign").attr("style", "float: left; margin-right: .3em;"))).append($("<div></div>").append($("<strong></strong>").append("Error:\n")).append($("<span></span>").attr("id", "errormsg"))))).append($("<div></div>").attr("class", "alert alert-success").attr("id", "pending").attr("style", "display : none").append($("<div></div>").append($("<div></div>").append($("<strong></strong>").append("Logging in as:\n")).append($("<span></span>").attr("id", "pendinguser"))))).append($("<div></div>").attr("class", "control-group").append($("<label></label>").addClass("control-label").attr("for", "user_id").css("margin-right", "10px").append("Username:\n")).append($("<input/>").attr("type", "text").attr("name", "user_id").attr("id", "user_id").attr("size", "20"))).append($("<div></div>").attr("class", "control-group").append($("<label></label>").addClass("control-label").attr("for", "password").css("margin-right", "10px").append("Password:\n")).append($("<input/>").attr("type", "password").attr("name", "password").attr("id", "password").attr("size", "20"))))),
                footer: $("<span></span").append($("<a></a>").attr("href", "https://gologin.kbase.us/ResetPassword").attr("target", "_blank").text("Forgot password?")).append("&nbsp;|&nbsp;").append($("<a></a>").attr("href", " https://gologin.kbase.us/OAuth?response_type=code&step=SignUp&redirect_uri=" + encodeURIComponent(location.href)).attr("target", "_blank").text("Sign up"))
            });
            this._rewireIds($ld.dialogModal(), $ld.dialogModal());
            this.data("loginDialog", $ld);
            $ld.dialogModal().bind("error", function(event, msg) {
                $(this).trigger("clearMessages");
                $(this).data("error").show();
                $(this).data("errormsg").html(msg);
            });
            $ld.dialogModal().bind("message", function(event, msg) {
                $(this).trigger("clearMessages");
                $(this).data("pending").show();
                $(this).data("pendinguser").html(msg);
            });
            $ld.dialogModal().bind("clearMessages", function(event) {
                $(this).data("error").hide();
                $(this).data("pending").hide();
            });
            $ld.dialogModal().on("shown", function(e) {
                if ($(this).data("user_id").val().length == 0) {
                    $(this).data("user_id").focus();
                } else {
                    $(this).data("password").focus();
                }
            });
            return $ld;
        },
        login: function(user_id, password, callback) {
            var args = {
                user_id: user_id,
                status: 1
            };
            if (user_id.length == 0) {
                args.message = "Cannot login w/o user_id";
                args.status = 0;
                callback.call(this, args);
            } else if (password == undefined || password.length == 0) {
                args.message = "Cannot login w/o password";
                args.status = 0;
                if (callback != undefined) {
                    callback.call(this, args);
                }
            } else {
                args.password = password;
                args.cookie = 1;
                args.fields = this.options.fields.join(",");
                $.support.cors = true;
                $.ajax({
                    type: "POST",
                    url: this.options.loginURL,
                    data: args,
                    dataType: "json",
                    crossDomain: true,
                    xhrFields: {
                        withCredentials: true
                    },
                    success: $.proxy(function(data, res, jqXHR) {
                        if (data.kbase_sessionid) {
                            var cookieArray = [];
                            var args = {
                                success: 1
                            };
                            var fields = this.options.fields;
                            for (var i = 0; i < fields.length; i++) {
                                var value = data[fields[i]];
                                args[fields[i]] = value;
                                value = value.replace(/=/g, "EQUALSSIGN");
                                value = value.replace(/\|/g, "PIPESIGN");
                                cookieArray.push(fields[i] + "=" + value);
                            }
                            $.cookie("kbase_session", cookieArray.join("|"));
                            this.populateLoginInfo(args);
                            this.trigger("loggedIn", this.get_kbase_cookie());
                            callback.call(this, args);
                        } else {
                            $.removeCookie("kbase_session");
                            this.populateLoginInfo({});
                            callback.call(this, {
                                status: 0,
                                message: data.error_msg
                            });
                            this.trigger("loggedInFailure", {
                                status: 0,
                                message: data.error_msg
                            });
                        }
                    }, this),
                    error: $.proxy(function(jqXHR, textStatus, errorThrown) {
                        if (textStatus == "error") {
                            textStatus = "Error connecting to KBase login server";
                        }
                        this.populateLoginInfo({});
                        callback.call(this, {
                            status: 0,
                            message: textStatus
                        });
                    }, this),
                    xhrFields: {
                        withCredentials: true
                    },
                    beforeSend: function(xhr) {
                        xhr.withCredentials = true;
                    }
                });
            }
        },
        logout: function(rePrompt) {
            if (rePrompt == undefined) {
                rePrompt = true;
            }
            var session_id = this.get_kbase_cookie("kbase_sessionid");
            if (session_id == undefined) {
                return;
            }
            $.removeCookie("kbase_session");
            if (this.specificLogout) {
                this.specificLogout();
            }
            this.populateLoginInfo({});
            if (this.data("loginDialog") != undefined && rePrompt) {
                this.openDialog();
            }
            this.trigger("loggedOut");
            if (this.options.logout_callback) {
                this.options.logout_callback.call(this);
            }
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbasePrompt", "kbaseWidget", {
        version: "1.0.0",
        options: {
            controls: [ "cancelButton", "okayButton" ],
            modalClass: "fade"
        },
        init: function(options) {
            this._super(options);
            return this;
        },
        openPrompt: function() {
            this.dialogModal().modal({
                keyboard: true
            });
        },
        closePrompt: function() {
            this.dialogModal().modal("hide");
        },
        cancelButton: function() {
            return {
                name: "Cancel",
                callback: function(e, $prompt) {
                    $prompt.closePrompt();
                }
            };
        },
        okayButton: function() {
            return {
                name: "Okay",
                type: "primary",
                callback: function(e, $prompt) {
                    $prompt.closePrompt();
                }
            };
        },
        dialogModal: function() {
            if (this.data("dialogModal") != undefined) {
                return this.data("dialogModal");
            }
            var $dialogModal = $("<div></div>").attr("class", "modal hide " + this.options.modalClass).attr("tabindex", "-1").append($("<div></div>").attr("class", "modal-header").append($("<button></button>").attr("type", "button").attr("class", "close").attr("data-dismiss", "modal").attr("aria-hidden", "true").append("x\n")).append($("<h3></h3>").attr("id", "title"))).append($("<div></div>").attr("class", "modal-body").attr("id", "body")).append($("<div></div>").attr("class", "modal-footer").append($("<div></div>").addClass("row-fluid").addClass("form-horizontal").append($("<div></div>").addClass("span6").addClass("text-left").attr("id", "footer")).append($("<div></div>").addClass("span6").attr("id", "controls").css("white-space", "nowrap"))));
            $dialogModal.unbind("keypress");
            $dialogModal.keypress(function(e) {
                if (e.keyCode == 13) {
                    e.stopPropagation();
                    e.preventDefault();
                    $("a:last", $dialogModal).trigger("click");
                }
            });
            this._rewireIds($dialogModal, $dialogModal);
            if (this.options.title) {
                $dialogModal.data("title").append(this.options.title);
            }
            if (this.options.body) {
                $dialogModal.data("body").append(this.options.body);
            }
            if (this.options.footer) {
                $dialogModal.data("footer").append(this.options.footer);
            }
            var $prompt = this;
            $.each(this.options.controls, function(idx, val) {
                if (typeof val == "string") {
                    val = $prompt[val]();
                }
                var btnClass = "btn";
                if (val.type) {
                    btnClass = btnClass + " btn-" + val.type;
                }
                var $button = $("<a></a>").attr("href", "#").attr("class", btnClass).append(val.name).bind("click", function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    val.callback.call(this, e, $prompt);
                });
                if (val.id) {
                    $button.attr("id", val.id);
                }
                $dialogModal.data("controls").append($button);
            });
            this._rewireIds($dialogModal, $dialogModal);
            this.data("dialogModal", $dialogModal);
            var $firstField = undefined;
            var selection = false;
            $dialogModal.on("shown", $.proxy(function() {
                $.each($dialogModal.find("input[type=text],input[type=password],textarea"), function(idx, val) {
                    if ($firstField == undefined) {
                        $firstField = $(val);
                    }
                    if ($(val).is("input") && $(val).val() == undefined) {
                        $(val).focus();
                        selection = true;
                        return;
                    } else if ($(val).is("textarea") && $(val).text().length == 0) {
                        $(val).focus();
                        selection = true;
                        return;
                    }
                });
                if (!selection && $firstField != undefined) {
                    $firstField.focus();
                }
            }, this));
            return $dialogModal;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseTable", "kbaseWidget", {
        version: "1.0.0",
        options: {
            sortable: false,
            striped: true,
            hover: true,
            bordered: true
        },
        init: function(options) {
            this._super(options);
            this.appendUI($(this.$elem), this.options.structure);
            return this;
        },
        appendUI: function($elem, struct) {
            $elem.empty();
            var $tbl = $("<table></table>").attr("id", "table").addClass("table");
            if (this.options.tblOptions) {
                this.addOptions($tbl, this.options.tblOptions);
            }
            if (this.options.striped) {
                $tbl.addClass("table-striped");
            }
            if (this.options.hover) {
                $tbl.addClass("table-hover");
            }
            if (this.options.bordered) {
                $tbl.addClass("table-bordered");
            }
            if (this.options.caption) {
                $tbl.append($("<caption></caption>").append(this.options.caption));
            }
            if (struct.header) {
                var $thead = $("<thead></thead>").attr("id", "thead");
                var $tr = $("<tr></tr>").attr("id", "headerRow");
                $.each(struct.header, $.proxy(function(idx, header) {
                    var h = this.nameOfHeader(header);
                    var zed = new Date();
                    var $th = $("<th></th>").append(h);
                    if (typeof header != "string") {
                        this.addOptions($th, header);
                        if (header.sortable) {
                            var buttonId = h + "-sortButton";
                            var $buttonIcon = $("<i></i>").addClass("icon-sort");
                            var $button = $("<button></button>").addClass("btn btn-mini").attr("id", buttonId).css("display", "none").css("float", "right").append($buttonIcon).data("shouldHide", true);
                            $button.bind("click", $.proxy(function(e) {
                                var $lastSort = this.data("lastSort");
                                if ($lastSort != undefined && $lastSort.get(0) != $button.get(0)) {
                                    $lastSort.children(":first").removeClass("icon-sort-up");
                                    $lastSort.children(":first").removeClass("icon-sort-down");
                                    $lastSort.children(":first").addClass("icon-sort");
                                    $lastSort.data("shouldHide", true);
                                    $lastSort.css("display", "none");
                                }
                                if ($buttonIcon.hasClass("icon-sort")) {
                                    $buttonIcon.removeClass("icon-sort");
                                    $buttonIcon.addClass("icon-sort-up");
                                    $button.data("shouldHide", false);
                                    this.sortAndLayoutOn(h, 1);
                                } else if ($buttonIcon.hasClass("icon-sort-up")) {
                                    $buttonIcon.removeClass("icon-sort-up");
                                    $buttonIcon.addClass("icon-sort-down");
                                    $button.data("shouldHide", false);
                                    this.sortAndLayoutOn(h, -1);
                                } else if ($buttonIcon.hasClass("icon-sort-down")) {
                                    $buttonIcon.removeClass("icon-sort-down");
                                    $buttonIcon.addClass("icon-sort");
                                    $button.data("shouldHide", true);
                                    this.sortAndLayoutOn(undefined);
                                }
                                this.data("lastSort", $button);
                            }, this));
                            $th.append($button);
                            $th.bind("mouseover", $.proxy(function(e) {
                                $button.css("display", "inline");
                            }, this));
                            $th.bind("mouseout", $.proxy(function(e) {
                                if ($button.data("shouldHide")) {
                                    $button.css("display", "none");
                                }
                            }, this));
                        }
                    }
                    $tr.append($th);
                }, this));
                $thead.append($tr);
                $tbl.append($thead);
            }
            if (struct.rows) {
                var $tbody = this.data("tbody", $("<tbody></tbody>"));
                this.layoutRows(struct.rows, struct.header);
                $tbl.append($tbody);
            }
            if (struct.footer) {
                var $tfoot = $("<tfoot></tfoot>").attr("id", "tfoot");
                for (var idx = 0; idx < struct.footer.length; idx++) {
                    $tfoot.append($("<td></td>").append(struct.footer[idx]));
                }
                $tbl.append($tfoot);
            }
            this._rewireIds($tbl, this);
            $elem.append($tbl);
            return $elem;
        },
        sortAndLayoutOn: function(header, dir) {
            var sortedRows = this.options.structure.rows;
            if (header != undefined) {
                var h = this.nameOfHeader(header);
                sortedRows = this.options.structure.rows.slice().sort(function(a, b) {
                    var keyA = a[h];
                    var keyB = b[h];
                    keyA = typeof keyA == "string" ? keyA.toLowerCase() : keyA;
                    keyB = typeof keyB == "string" ? keyB.toLowerCase() : keyB;
                    if (keyA < keyB) {
                        return 0 - dir;
                    } else if (keyA > keyB) {
                        return dir;
                    } else {
                        return 0;
                    }
                });
            }
            this.layoutRows(sortedRows, this.options.structure.header);
        },
        nameOfHeader: function(header) {
            return typeof header == "string" ? header : header.value;
        },
        layoutRows: function(rows, header) {
            this.data("tbody").empty();
            for (var idx = 0; idx < rows.length; idx++) {
                this.data("tbody").append(this.createRow(rows[idx], header));
            }
        },
        addOptions: function($cell, options) {
            if (options.style != undefined) {
                $cell.attr("style", options.style);
            }
            if (options.class != undefined) {
                var classes = typeof options.class == "string" ? [ options.class ] : options.class;
                $.each(classes, $.proxy(function(idx, cl) {
                    $cell.addClass(cl);
                }, this));
            }
            var events = [ "mouseover", "mouseout", "click" ];
            $.each(events, $.proxy(function(idx, e) {
                if (options[e] != undefined) {
                    $cell.bind(e, options[e]);
                }
            }, this));
            if (options.colspan) {
                $cell.attr("colspan", options.colspan);
            }
            if (options.rowspan) {
                $cell.attr("rowspan", options.rowspan);
            }
        },
        createRow: function(rowData, headers) {
            var $tr = $("<tr></tr>");
            if ($.isArray(rowData)) {
                $.each(rowData, $.proxy(function(idx, row) {
                    var value = typeof row == "string" || typeof row == "number" ? row : row.value;
                    var $td = $.jqElem("td").append(value);
                    if (typeof row != "string" && typeof row != "number") {
                        this.addOptions($td, row);
                    }
                    if (value != undefined) {
                        $tr.append($td);
                    }
                }, this));
            } else {
                $.each(headers, $.proxy(function(hidx, header) {
                    var h = this.nameOfHeader(header);
                    var $td = $("<td></td>");
                    if (rowData[h] != undefined) {
                        var value = typeof rowData[h] == "string" ? rowData[h] : rowData[h].value;
                        $td.append(value);
                        if (typeof rowData[h] != "string") {
                            this.addOptions($td, rowData[h]);
                        }
                    }
                    if (value != undefined) {
                        $tr.append($td);
                    }
                }, this));
            }
            return $tr;
        },
        deletePrompt: function(row) {
            var $deleteModal = $("<div></div>").kbaseDeletePrompt({
                name: row,
                callback: this.deleteRowCallback(row)
            });
            $deleteModal.openPrompt();
        },
        deleteRowCallback: function(row) {},
        shouldDeleteRow: function(row) {
            return 1;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseTabs", "kbaseWidget", {
        version: "1.0.0",
        _accessors: [ "tabsHeight" ],
        options: {
            tabPosition: "top",
            canDelete: false,
            borderColor: "lightgray"
        },
        init: function(options) {
            this._super(options);
            this.data("tabs", {});
            this.data("nav", {});
            this.appendUI($(this.$elem));
            return this;
        },
        appendUI: function($elem, tabs) {
            if (tabs == undefined) {
                tabs = this.options.tabs;
            }
            var $block = $("<div></div>").addClass("tabbable");
            var $tabs = $("<div></div>").addClass("tab-content").attr("id", "tabs-content").css("height", this.tabsHeight());
            var $nav = $("<ul></ul>").addClass("nav nav-tabs").attr("id", "tabs-nav");
            if (this.options.tabPosition == "top") {
                $block.addClass("tabs-above");
                $block.append($nav).append($tabs);
            } else if (this.options.tabPosition == "bottom") {
                $block.addClass("tabs-below");
                $block.append($tabs).append($nav);
            } else if (this.options.tabPosition == "left") {
                $block.addClass("tabs-left");
                $block.append($nav).append($tabs);
            } else if (this.options.tabPosition == "right") {
                $block.addClass("tabs-right");
                $block.append($tabs).append($nav);
            }
            this._rewireIds($block, this);
            $elem.append($block);
            if (tabs) {
                $.each(tabs, $.proxy(function(idx, tab) {
                    this.addTab(tab);
                }, this));
            }
        },
        addTab: function(tab) {
            if (tab.canDelete == undefined) {
                tab.canDelete = this.options.canDelete;
            }
            var $tab = $("<div></div>").addClass("tab-pane fade").append(tab.content);
            if (this.options.border) {
                $tab.css("border", "solid " + this.options.borderColor);
                $tab.css("border-width", "0px 1px 0px 1px");
                $tab.css("padding", "3px");
            }
            var $that = this;
            var $nav = $("<li></li>").css("white-space", "nowrap").append($("<a></a>").attr("href", "#").text(tab.tab).attr("data-tab", tab.tab).bind("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                var previous = $that.data("tabs-nav").find(".active:last a")[0];
                $.fn.tab.Constructor.prototype.activate.call($(this), $(this).parent("li"), $that.data("tabs-nav"));
                $.fn.tab.Constructor.prototype.activate.call($(this), $tab, $tab.parent(), function() {
                    $(this).trigger({
                        type: "shown",
                        relatedTarget: previous
                    });
                });
            }).append($("<button></button>").addClass("btn btn-mini").append($("<i></i>").addClass(this.closeIcon())).css("padding", "0px").css("width", "22px").css("height", "22px").css("margin-left", "10px").attr("title", this.deleteTabToolTip(tab.tab)).tooltip().bind("click", $.proxy(function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (tab.deleteCallback != undefined) {
                    tab.deleteCallback(tab.tab);
                } else {
                    this.deletePrompt(tab.tab);
                }
            }, this))));
            if (!tab.canDelete) {
                $nav.find("button").remove();
            }
            this.data("tabs")[tab.tab] = $tab;
            this.data("nav")[tab.tab] = $nav;
            this.data("tabs-content").append($tab);
            this.data("tabs-nav").append($nav);
            var tabCount = 0;
            for (t in this.data("tabs")) {
                tabCount++;
            }
            if (tab.show || tabCount == 1) {
                this.showTab(tab.tab);
            }
        },
        closeIcon: function() {
            return "icon-remove";
        },
        deleteTabToolTip: function(tabName) {
            return "Remove " + tabName;
        },
        hasTab: function(tabName) {
            return this.data("tabs")[tabName];
        },
        showTab: function(tab) {
            if (this.shouldShowTab(tab)) {
                this.data("nav")[tab].find("a").trigger("click");
            }
        },
        removeTab: function(tabName) {
            var $tab = this.data("tabs")[tabName];
            var $nav = this.data("nav")[tabName];
            if ($nav.hasClass("active")) {
                if ($nav.next("li").length) {
                    $nav.next().find("a").trigger("click");
                } else {
                    $nav.prev("li").find("a").trigger("click");
                }
            }
            $tab.remove();
            $nav.remove();
            this.data("tabs")[tabName] = undefined;
            this.data("nav")[tabName] = undefined;
        },
        shouldShowTab: function(tab) {
            return 1;
        },
        deletePrompt: function(tabName) {
            var $deleteModal = $("<div></div>").kbaseDeletePrompt({
                name: tabName,
                callback: this.deleteTabCallback(tabName)
            });
            $deleteModal.openPrompt();
        },
        deleteTabCallback: function(tabName) {
            return $.proxy(function(e, $prompt) {
                if ($prompt != undefined) {
                    $prompt.closePrompt();
                }
                if (this.shouldDeleteTab(tabName)) {
                    this.removeTab(tabName);
                }
            }, this);
        },
        shouldDeleteTab: function(tabName) {
            return 1;
        },
        activeTab: function() {
            var activeNav = this.data("tabs-nav").find(".active:last a")[0];
            return $(activeNav).attr("data-tab");
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget("kbaseWorkspaceBrowser", "kbaseFileBrowser", {
        version: "1.0.0",
        options: {
            name: "Workspace Browser",
            workspace: "chenrydemo",
            selectWorkspace: true
        },
        init: function(options) {
            options.controlButtons = [ "deleteButton", "viewButton", "uploadButton", "addButton" ];
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
        token: function() {
            var token = this.$loginbox.get_kbase_cookie("token");
            return token;
        },
        selected: function(path) {
            var workspace = this.data("workspace-select").val();
            var $option = this.data("workspace-select").find(":selected");
            if ($option.data("perm") != "a") {
                this.deleteButton().addClass("disabled");
            }
        },
        refreshDirectory: function(path) {
            this.listWorkspaces();
        },
        listDirectory: function(path, $ul) {
            if (path == this.workspace) {
                this.wsClient.list_workspace_objects_async({
                    workspace: path,
                    auth: this.token(),
                    showDeletedObject: false
                }, $.proxy(function(res) {
                    var files = [];
                    this.meta = {};
                    $.each(res, $.proxy(function(idx, val) {
                        files.push({
                            name: val[0],
                            path: val[0],
                            type: val[3] == 0 ? "file" : "directory"
                        });
                        this.meta[val[0]] = {
                            name: val[0],
                            version: val[3],
                            type: val[1]
                        };
                    }, this));
                    this.displayPath("/", $ul, files.sort(this.sortByName));
                }, this));
            } else if (this.workspace) {
                var files = [];
                var version = this.meta[path].version;
                for (var i = version; i >= 0; i--) {
                    files.push({
                        name: "Revision " + i,
                        path: path,
                        type: "file",
                        meta: {
                            version: i
                        }
                    });
                }
                this.displayPath("path", $ul, files);
            }
        },
        viewButton: function() {
            var $viewButton = this._super();
            $viewButton.data("require", "a");
            $viewButton.unbind("click");
            $viewButton.bind("click", $.proxy(function(e) {
                e.preventDefault();
                if (!this.viewButton().hasClass("disabled")) {
                    var file = this.data("activeFile");
                    if (file == undefined) {
                        file = this.data("activeDirectory");
                    }
                    this.openFile(file);
                }
            }, this));
            return $viewButton;
        },
        addButton: function() {
            var $addButton = this._super();
            $addButton.data("require", "a");
            $addButton.unbind("click");
            $addButton.bind("click", $.proxy(function(e) {
                e.preventDefault();
                if (!this.addButton().hasClass("disabled")) {
                    var file = this.data("activeFile");
                    if (file == undefined) {
                        file = this.data("activeDirectory");
                    }
                    this.options.addFileCallback(file);
                }
            }, this));
            return $addButton;
        },
        stringify: function(key, val) {
            if (typeof val == "array") {
                val = val.join(", ");
            } else if (typeof val != "string") {
                val = this.stringify(val);
            }
            return key + " : " + val;
        },
        fetchContent: function(file, win) {
            var $opened = this.$elem.find(".active");
            var params = {
                type: this.meta[file].type,
                workspace: this.workspace,
                id: file
            };
            if (meta = $opened.data("meta")) {
                params.instance = meta.version;
            }
            this.wsClient.get_object_async(params, $.proxy(function(res) {
                try {
                    if (typeof res.data == "string") {
                        res = res.data;
                    } else {
                        var jsonStr = JSON.stringify(res.data, undefined, 2);
                        res = jsonStr;
                    }
                } catch (e) {
                    this.dbg("FAILURE");
                    this.dbg(e);
                    res = res.data;
                }
                this.openFile(file, res, win);
            }, this), $.proxy(function(res) {
                win.close();
                var $errorModal = $("<div></div>").kbaseErrorPrompt({
                    title: "Fetch failed",
                    message: res.message
                });
                $errorModal.openPrompt();
            }, this));
        },
        deleteFileCallback: function(file, active_dir) {
            if (this.workspace == undefined) {} else {
                this.wsClient.delete_object_async({
                    type: "Unspecified",
                    workspace: this.workspace,
                    id: file,
                    auth: this.token()
                }, $.proxy(function(res) {
                    this.listDirectory(this.workspace, this.data("ul-nav"));
                }, this), $.proxy(function(res) {
                    var $errorModal = $("<div></div>").kbaseErrorPrompt({
                        title: "Deletion failed",
                        message: res.message
                    });
                    $errorModal.openPrompt();
                }, this));
            }
        },
        uploadFile: function(name, content, upload_dir, $processElem) {
            if (this.workspace == undefined) {} else {
                this.wsClient.save_object_async({
                    type: "Unspecified",
                    workspace: this.workspace,
                    id: name,
                    data: content,
                    auth: this.token()
                }, $.proxy(function(res) {
                    if (this.options.processList) {
                        this.options.processList.removeProcess($processElem);
                    }
                    this.listDirectory(this.workspace, this.data("ul-nav"));
                }, this), $.proxy(function(res) {
                    if (this.options.processList) {
                        this.options.processList.removeProcess($processElem);
                    }
                    var $errorModal = $("<div></div>").kbaseErrorPrompt({
                        title: "Creation failed",
                        message: res.message
                    });
                    $errorModal.openPrompt();
                }, this));
            }
        },
        createWorkspace: function() {
            var $addWorkspaceModal = $("<div></div>").kbasePrompt({
                title: "Create workspace",
                body: $("<p></p>").append("Create workspace ").append(" ").append($("<input></input>").attr("type", "text").attr("name", "ws_name").attr("size", "20")),
                controls: [ "cancelButton", {
                    name: "Create workspace",
                    type: "primary",
                    callback: $.proxy(function(e, $prompt) {
                        $prompt.closePrompt();
                        this.wsClient.create_workspace_async({
                            workspace: $addWorkspaceModal.dialogModal().find("input").val(),
                            permission: "a",
                            auth: this.token()
                        }, $.proxy(function(res) {
                            this.workspace = $addWorkspaceModal.dialogModal().find("input").val();
                            this.listWorkspaces();
                        }, this), $.proxy(function(res) {
                            var $errorModal = $("<div></div>").kbaseErrorPrompt({
                                title: "Creation failed",
                                message: res.message
                            });
                            $errorModal.openPrompt();
                        }, this));
                    }, this)
                } ]
            });
            $addWorkspaceModal.openPrompt();
        },
        deleteWorkspace: function() {
            var $deleteModal = $("<div></div>").kbaseDeletePrompt({
                name: this.data("workspace-select").val(),
                callback: $.proxy(function(e, $prompt) {
                    $prompt.closePrompt();
                    this.deleteWorkspaceCallback(this.data("workspace-select").val());
                }, this)
            });
            $deleteModal.openPrompt();
        },
        deleteWorkspaceCallback: function(ws) {
            this.wsClient.delete_workspace_async({
                workspace: ws,
                auth: this.token()
            }, $.proxy(function(res) {
                this.listWorkspaces();
            }, this), $.proxy(function(res) {
                var $errorModal = $("<div></div>").kbaseErrorPrompt({
                    title: "deletion failed",
                    message: res.message
                });
                $errorModal.openPrompt();
            }, this));
        },
        fileBrowserContainer: function() {
            var superContainer = this._super("fileBrowserContainer");
            if (this.options.selectWorkspace) {
                superContainer.prepend($("<div></div>").addClass("btn-toolbar").addClass("text-left").css("width", "100%").append($("<div></div>").addClass("input-append").attr("id", "workspace-controls").append($("<select></select>").css("height", "22px").css("width", "254px").attr("id", "workspace-select").bind("change", $.proxy(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.workspace = undefined;
                    var workspace = this.data("workspace-select").val();
                    var $option = this.data("workspace-select").find(":selected");
                    if ($option.data("perm") != "a") {
                        this.data("deleteWorkspace-button").addClass("disabled");
                    } else {
                        this.data("deleteWorkspace-button").removeClass("disabled");
                    }
                    if (workspace != "--- choose workspace ---") {
                        this.workspace = workspace;
                        this.listDirectory(workspace, this.data("ul-nav"));
                    }
                }, this))).append($("<button></button>").addClass("btn btn-mini").attr("id", "deleteWorkspace-button").append($("<i></i>").addClass("icon-minus")).bind("click", $.proxy(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!this.data("deleteWorkspace-button").hasClass("disabled")) {
                        this.deleteWorkspace();
                    }
                }, this))).append($("<button></button>").addClass("btn btn-mini").attr("id", "createWorkspace-button").append($("<i></i>").addClass("icon-plus")).bind("click", $.proxy(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.createWorkspace();
                }, this)))));
            }
            this._rewireIds(superContainer, this);
            return superContainer;
        },
        listWorkspaces: function() {
            this.wsClient.list_workspaces_async({
                auth: this.token()
            }, $.proxy(function(res) {
                var workspaces = [];
                $.each(res, $.proxy(function(idx, val) {
                    workspaces.push({
                        name: val[0],
                        perm: val[4]
                    });
                }, this));
                var perm;
                workspaces = workspaces.sort(this.sortByName);
                if (this.data("workspace-select") != undefined) {
                    this.data("workspace-select").empty();
                    this.data("workspace-select").append($("<option></option>").append(" --- choose workspace --- ").attr("val", ""));
                    $.each(workspaces, $.proxy(function(idx, val) {
                        var $option = $("<option></option>").append(val.name).attr("value", val.name).data("perm", val.perm);
                        if (val.name == this.workspace) {
                            perm = val.perm;
                        }
                        this.data("workspace-select").append($option);
                    }, this));
                }
                if (this.workspace) {
                    this.data("workspace-select").val(this.workspace);
                    this.listDirectory(this.workspace, this.data("ul-nav"));
                }
                if (perm != "a") {
                    this.data("deleteWorkspace-button").addClass("disabled");
                }
            }, this));
        }
    });
})(jQuery);