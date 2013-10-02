(function($) {
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
    $.KBWidget = function(def) {
        def = def || {};
        var name = def.name;
        var parent = def.parent;
        if (parent == undefined) {
            parent = "kbaseWidget";
        }
        var asPlugin = def.asPlugin;
        if (asPlugin === undefined) {
            asPlugin = true;
        }
        var Widget = function($elem) {
            this.$elem = $elem;
            this.options = $.extend(true, {}, def.options, this.constructor.prototype.options);
            return this;
        };
        if (name) {
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
        }
        if (parent) {
            var pWidget = widgetRegistry[parent];
            if (pWidget === undefined) throw new Error("Parent widget is not registered");
            subclass(Widget, pWidget);
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
            var ctor = function(method, args) {
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
                    if ($w._init === undefined) {
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
            ctor.name = name;
            $.fn[name] = ctor;
            $[name] = $.fn[name];
        }
        this.on = function(evt, callback) {
            this.$elem.bind(evt, callback);
            return this;
        };
        this.emit = function(evt, data) {
            this.$elem.trigger(evt, data);
            return this;
        };
        this.off = function(evt) {
            this.$elem.unbind(evt);
            return this;
        };
        if (name !== undefined) {
            Widget.prototype[name] = function() {
                return $.fn[name].apply(this.$elem, arguments);
            };
            return $.fn[name];
        } else {
            return this;
        }
    };
    $.KBWidget.registry = function() {
        var registry = {};
        for (var widget in widgetRegistry) {
            if (widget !== "kbaseWidget") {
                registry[widget] = widgetRegistry[widget];
            }
        }
        return registry;
    };
    $.KBWidget.resetRegistry = function() {
        for (var widget in widgetRegistry) {
            if (widget !== "kbaseWidget") {
                delete widgetRegistry[widget];
            }
        }
        return this;
    };
    $.KBWidget({
        name: "kbaseWidget",
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

(function($) {
    $.KBApplication = $.fn.KBApplication = function(def) {
        this.constructor = $.KBWidget.constructor;
        return this;
    };
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseLogin",
        version: "1.0.0",
        options: {
            style: "text",
            loginURL: "http://kbase.us/services/authorization/Sessions/Login",
            possibleFields: [ "verified", "name", "opt_in", "kbase_sessionid", "token", "groups", "user_id", "email", "system_admin" ],
            fields: [ "name", "kbase_sessionid", "user_id", "token" ]
        },
        get_kbase_cookie: function(field) {
            var chips = sessionStorage.getItem("kbase_session");
            console.log(sessionStorage);
            if (chips != undefined) {
                console.log(chips);
                chips = JSON.parse(chips);
            } else {
                chips = {};
            }
            console.log(chips);
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
            }, this))).append($("<div></div>").addClass("btn-group").attr("id", "userdisplay").css("display", "none").append($("<button></button>").addClass("btn btn-default").addClass("btn-xs").addClass("dropdown-toggle").append($("<i></i>").addClass("icon-user")).append($("<i></i>").addClass("icon-caret-down")).bind("click", function(e) {
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
            var $prompt = $("<span></span>").addClass("form-inline").append($("<span></span>").attr("id", "entrance").append($("<span></span>").addClass("input-group").append($("<span></span>").addClass("input-group-addon").append("username: ").bind("click", function(e) {
                $(this).next().focus();
            })).append($("<input/>").attr("type", "text").attr("name", "user_id").attr("id", "user_id").attr("size", "20").val(this.options.user_id)).append($("<span></span>").addClass("input-group-addon").append(" password: ").bind("click", function(e) {
                $(this).next().focus();
            })).append($("<input/>").attr("type", "password").attr("name", "password").attr("id", "password").attr("size", "20")).append($("<button></button>").attr("id", "loginbutton").addClass("btn btn-primary").append($("<i></i>").attr("id", "loginicon").addClass("icon-lock"))))).append($("<span></span>").attr("id", "userdisplay").attr("style", "display : none;").addClass("input-group").append($("<span></span>").addClass("input-group-addon").append("Logged in as ").append($("<span></span>").attr("id", "loggedinuser_id").attr("style", "font-weight : bold").append("user_id\n"))).append($("<button></button>").addClass("btn btn-default").attr("id", "logoutbutton").append($("<i></i>").attr("id", "logouticon").addClass("icon-signout"))));
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
            var $prompt = $("<div></div>").attr("style", "width : 250px; border : 1px solid gray").append($("<h4></h4>").attr("style", "padding : 5px; margin-top : 0px; background-color : lightgray ").addClass("text-center").append("User\n")).append($("<div></div>").attr("id", "entrance").append($("<p></p>").attr("style", "text-align : center").append($("<button></button>").attr("id", "loginbutton").append("Login").addClass("btn btn-primary")))).append($("<div></div>").attr("id", "userdisplay").attr("style", "display : none;").append($("<p></p>").attr("style", "text-align : center").append("Logged in as ").append($("<span></span>").attr("id", "loggedinuser_id").attr("style", "font-weight : bold").append("user_id\n")).append($("<button></button>").attr("id", "logoutbutton").append("Logout\n").addClass("btn btn-default"))));
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
                body: $("<p></p>").append($("<form></form>").attr("name", "form").attr("id", "form").addClass("form-horizontal").append($("<fieldset></fieldset>").append($("<div></div>").attr("class", "alert alert-error").attr("id", "error").attr("style", "display : none").append($("<div></div>").append($("<div></div>").addClass("pull-left").append($("<i></i>").addClass("icon-warning-sign").attr("style", "float: left; margin-right: .3em;"))).append($("<div></div>").append($("<strong></strong>").append("Error:\n")).append($("<span></span>").attr("id", "errormsg"))))).append($("<div></div>").attr("class", "alert alert-success").attr("id", "pending").attr("style", "display : none").append($("<div></div>").append($("<div></div>").append($("<strong></strong>").append("Logging in as:\n")).append($("<span></span>").attr("id", "pendinguser"))))).append($("<div></div>").attr("class", "form-group").css("margin-left", "50px").append($("<label></label>").addClass("control-label").attr("for", "user_id").css("margin-right", "10px").append("Username:\n")).append($("<input/>").attr("type", "text").attr("name", "user_id").attr("id", "user_id").attr("size", "20"))).append($("<div></div>").attr("class", "form-group").css("margin-left", "50px").append($("<label></label>").addClass("control-label").attr("for", "password").css("margin-right", "10px").append("Password:\n")).append($("<input/>").attr("type", "password").attr("name", "password").attr("id", "password").attr("size", "20"))))),
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
            $ld.dialogModal().on("shown.bs.modal", function(e) {
                console.log("IS SHOWNz!");
                console.log($(this).data("user_id"));
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
                            }
                            var jsonARGS = JSON.stringify(args);
                            sessionStorage.setItem("kbase_session", jsonARGS);
                            console.log(sessionStorage);
                            this.populateLoginInfo(args);
                            console.log("ARGS");
                            console.log(args);
                            console.log(jsonARGS);
                            this.trigger("loggedIn", this.get_kbase_cookie());
                            callback.call(this, args);
                        } else {
                            sessionStorage.removeItem("kbase_session");
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
            sessionStorage.removeItem("kbase_session");
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
    $.KBWidget({
        name: "kbaseModal",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var title = options.title;
            var subtext = options.subText;
            var right_label = options.rightLabel;
            var body = options.body;
            var buttons = options.buttons;
            var container = $('<div class="modal">                              <div class="modal-dialog">                                  <div class="modal-content">                                    <div class="modal-header">                                        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>                                        <h3 class="modal-title"></h3>                                        <span class="modal-subtext"></span>                                    </div>                                    <div class="modal-body"></div>                                    <div class="modal-footer">                                      <a href="#" class="btn btn-default" data-dismiss="modal">Close</a>                                    </div>                                  </div>                              </div>                           </div>');
            var modal_header = container.find(".modal-header");
            var modal_title = container.find(".modal-title");
            var modal_subtext = container.find(".modal-subtext");
            var modal_body = container.find(".modal-body");
            var modal_footer = container.find(".modal-footer");
            if (title) modal_title.append(title);
            if (subtext) modal_subtext.append(subtext);
            if (body) modal_body.append(body);
            if (buttons) this.buttons(buttons);
            self.$elem.append(container);
            this.header = function(data) {
                if (data) modal_header.html(data);
                return modal_header;
            };
            this.title = function(data) {
                if (data) modal_title.html(data);
                return modal_title;
            };
            this.body = function(data) {
                if (data) modal_body.html(data);
                return modal_body;
            };
            this.footer = function(data) {
                if (data) modal_footer.html(data);
                return modal_footer;
            };
            this.buttons = function(buttons) {
                modal_footer.html("");
                for (var i in buttons) {
                    var btn = buttons[i];
                    if (!btn.dismiss) {
                        var ele = $('<a class="btn" data-dismiss="modal">' + btn.text + "</a>");
                    } else {
                        var ele = $('<a class="btn">' + btn.text + "</a>");
                    }
                    if (btn.color == "primary") {
                        ele.addClass("btn-primary");
                    } else {
                        ele.addClass("btn-default");
                    }
                    modal_footer.append(ele);
                }
            };
            this.show = function() {
                container.modal("show");
            };
            this.hide = function() {
                container.modal("hide");
            };
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbasePanel",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var title = options.title ? options.title : "Default Panel Heading";
            var subText = options.subText;
            var right_label = options.rightLabel;
            var body = options.body;
            var container = $('<div class="panel panel-default">                                <div class="panel-heading">                                    <h4 class="panel-title"></h4>                                </div>                                <div class="panel-body"></div>                           </div>');
            var panel_header = container.find(".panel-heading");
            var panel_title = container.find(".panel-title");
            var panel_body = container.find(".panel-body");
            if (title) panel_title.html(title);
            if (body) panel_body.html(body);
            if (subText) panel_header.append(subText);
            if (right_label) {
                panel_header.append('<span class="label label-primary pull-right">' + right_label + "</span><br>");
            }
            this.header = function(data) {
                if (data) panel_header.html(data);
                return panel_header;
            };
            this.title = function(data) {
                if (data) panel_title.html(data);
                return panel_title;
            };
            this.body = function(data) {
                if (data) panel_body.html(data);
                return panel_body;
            };
            this.loading = function() {
                panel_body.append('<p class="muted ajax-loader">                 <img src="assets/img/ajax-loader.gif"> loading...</p>');
            };
            this.rmLoading = function() {
                panel_body.find(".ajax-loader").remove();
            };
            self.$elem.append(container);
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbasePrompt",
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
            var $dialogModal = $("<div></div>").attr("class", "modal " + this.options.modalClass).attr("tabindex", "-1").append($.jqElem("div").addClass("modal-dialog").append($.jqElem("div").addClass("modal-content").append($("<div></div>").attr("class", "modal-header").append($("<button></button>").attr("type", "button").attr("class", "close").attr("data-dismiss", "modal").attr("aria-hidden", "true").append("x\n")).append($("<h3></h3>").addClass("modal-title").attr("id", "title"))).append($("<div></div>").attr("class", "modal-body").attr("id", "body")).append($("<div></div>").attr("class", "modal-footer").append($("<div></div>").addClass("row").addClass("form-horizontal").append($("<div></div>").addClass("col-md-6").addClass("text-left").attr("id", "footer")).append($("<div></div>").addClass("col-md-6").attr("id", "controls").css("white-space", "nowrap"))))));
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
                var btnClass = "btn btn-default";
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
            $dialogModal.on("shown.bs.modal", $.proxy(function() {
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
    $.KBWidget({
        name: "kbaseTable",
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
            struct = struct || {};
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
                            var $button = $("<button></button>").addClass("btn btn-default btn-xs").attr("id", buttonId).css("display", "none").css("float", "right").append($buttonIcon).data("shouldHide", true);
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
    $.KBWidget({
        name: "kbaseTabs",
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
            $block.append($nav).append($tabs);
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
            }).append($("<button></button>").addClass("btn btn-default btn-xs").append($("<i></i>").addClass(this.closeIcon())).css("padding", "0px").css("width", "22px").css("height", "22px").css("margin-left", "10px").attr("title", this.deleteTabToolTip(tab.tab)).tooltip().bind("click", $.proxy(function(e) {
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

(function($) {
    var URL_ROOT = "http://140.221.84.142/objects/coexpr_test/Networks";
    $.KBWidget({
        name: "ForceDirectedNetwork",
        version: "0.1.0",
        options: {},
        init: function(options) {
            this._super(options);
            this.render();
            return this;
        },
        render: function() {
            var self = this;
	    if (this.options.token && this.options.new_workspaceID) {
                var ws_regex = /^(\w+)\.(.+)/;
		var wsid = ws_regex.exec( this.options.new_workspaceID);
		console.log( wsid);
                if ( wsid[1] && wsid[2]) {
		    var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
		    meta_AJAX = kbws.get_object( { auth : this.options.token,
						workspace : wsid[1],
						id : wsid[2],
						type : 'Networks'
					      });
		    $.when(meta_AJAX).done( function(result) {
						console.log( result);
						var data = transformNetwork(result.data);
						datavis.require([ "renderers/network" ], function(Network) {
								    var network = new Network({
												  element: self.$elem,
												  dock: false,
												  nodeLabel: {
												      type: "GENE"
												  }
											      });
								    network.setData(data);
								    network.render();
								});
					    });
		}
	    } else {
		$.ajax({
			   dataType: "json",
			   url: URL_ROOT + "/" + encodeURIComponent(this.options.workspaceID) + ".json"
		       }).done(function(result) {
				   var data = transformNetwork(result.data);
				   datavis.require([ "renderers/network" ], function(Network) {
						       var network = new Network({
										     element: self.$elem,
										     dock: false,
										     nodeLabel: {
											 type: "GENE"
										     }
										 });
						       network.setData(data);
						       network.render();
						   });
			       });
	    }
	    return self;
        }
    });
    function transformNetwork(networkJson) {
        var json = {
            nodes: [],
            edges: []
        };
        var nodeMap = {};
        for (var i = 0; i < networkJson.nodes.length; i++) {
            var node = $.extend({}, networkJson.nodes[i]);
            nodeMap[node.id] = i;
            node.kbid = node.id;
            node.group = node.type;
            node.id = i;
            json.nodes.push(node);
        }
        for (var i = 0; i < networkJson.edges.length; i++) {
            var edge = $.extend({}, networkJson.edges[i]);
            edge.source = parseInt(nodeMap[edge.nodeId1]);
            edge.target = parseInt(nodeMap[edge.nodeId2]);
            edge.weight = 1;
            json.edges.push(edge);
        }
        for (var prop in networkJson) {
            if (!json.hasOwnProperty(prop)) {
                json[prop] = networkJson[prop];
            }
        }
        return json;
    }
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseAccordion",
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
                $block.append($("<div></div>").addClass("panel panel-default").css("margin-bottom", "2px").append($("<div></div>").addClass("panel-heading").css("padding", "0px").append($("<i></i>").css("margin-right", "5px").css("margin-left", "3px").addClass("icon-chevron-right").addClass("pull-left").css("height", "22px").css("line-height", "22px").css("color", "gray")).append($("<a></a>").css("padding", "0px").attr("href", "#").attr("title", val.title).css("height", "22px").css("line-height", "22px").append(val.title)).bind("click", function(e) {
                    e.preventDefault();
                    var $opened = $(this).closest(".panel").find(".in");
                    var $target = $(this).next();
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
                })).append($("<div></div>").addClass("panel-body collapse").css("padding-top", "9px").css("padding-bottom", "9px").append(val.body)));
            }, this));
            this._rewireIds($block, this);
            $elem.append($block);
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseBox",
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

$.fn.workspaceSelector = function(workspaces, state) {
    var self = this;
    var wsRows = [], wsFiltRows = [], workspaceIdToRow = {}, selected = [], lastSelectedRow = null, lastShiftSelect = null, container = this;
    var filterCollapse = $(filterCollapseHtml());
    filterCollapse.find("#create-workspace").click(function(e) {
        e.stopImmediatePropagation();
        createWorkspaceModal();
        return false;
    });
    var resizeInt = null;
    filterCollapse.find(".collapse").on("shown", function() {
        resizeTable();
        state.set("filter-open", true);
        filterCollapse.find(".caret").removeClass().addClass("caret-up");
        filterCollapse.find("input").removeAttr("tabindex");
        window.clearInterval(resizeInt);
        resizeInt = null;
    }).on("hidden", function() {
        resizeTable();
        state.set("filter-open", false);
        filterCollapse.find(".caret-up").removeClass().addClass("caret");
        filterCollapse.find("input").attr("tabindex", "-1");
        window.clearInterval(resizeInt);
        resizeInt = null;
    }).on("show hide", function() {
        resizeInt = window.setInterval(function() {
            resizeTable();
        }, 1e3 / 50);
    });
    filterCollapse.find("button").click(function() {
        filterCollapse.find(".collapse").collapse("toggle");
    });
    var filterOpen = state.get("filter-open");
    if (filterOpen) {
        filterCollapse.find(".collapse").addClass("in");
    }
    var filterOwner = filterCollapse.find("#ws-filter-owner").change(filter);
    var filterAdmin = filterCollapse.find("#ws-filter-admin").change(filter);
    var filterWrite = filterCollapse.find("#ws-filter-write").change(filter);
    var filterRead = filterCollapse.find("#ws-filter-read").change(filter);
    container.append(filterCollapse);
    var filterSearch = $('<input type="text" class="search-query" style="margin-bottom: 5px;" placeholder="Filter Workspaces">');
    container.append(filterSearch);
    filterSearch.keyup(filter);
    var prevFilter = state.get("filter");
    if (prevFilter !== null) {
        filterOwner.prop("checked", prevFilter.owner);
        filterAdmin.prop("checked", prevFilter.admin);
        filterWrite.prop("checked", prevFilter.write);
        filterRead.prop("checked", prevFilter.read);
        filterSearch.val(prevFilter.search);
    } else {
        filterOwner.prop("checked", false);
        filterAdmin.prop("checked", true);
        filterWrite.prop("checked", true);
        filterRead.prop("checked", true);
    }
    var tableDiv = $('<div id="ws-table-div" tabindex="0">');
    container.append(tableDiv);
    var table = $('<table id="ws-table" class="table table-bordered table-condensed">');
    tableDiv.append(table);
    tableDiv.click(function() {
        tableDiv.focus();
    });
    tableDiv.keydown(tableKey);
    var callback = $.Callbacks();
    this.getHtml = function() {
        return container;
    };
    this.onselect = function(cb) {
        callback.add(cb);
        var ws = [];
        for (var i = 0; i < selected.length; i++) {
            ws.push(selected[i].getWorkspace());
        }
    };
    this.setLoaded = function(workspace) {
        var wsRow = workspaceIdToRow[workspace.id];
        if (wsRow) {
            wsRow.loaded();
        }
    };
    this.reload = reload;
    this.resizeTable = resizeTable;
    function resizeTable() {
        tableDiv.css("top", filterCollapse.outerHeight(true) + filterSearch.outerHeight(true) + "px");
    }
    var initialized = false;
    function reload() {
        table.empty();
        var infoRow = $('<tr id="ws-info-row">');
        table.append(infoRow);
        var infoCell = $("<td>");
        infoRow.append(infoCell);
        var saveSelected = {};
        if (initialized) {
            for (var i = 0; i < selected.length; i++) {
                saveSelected[selected[i].getWorkspace().id] = true;
            }
        } else {
            var ids = state.get("selected");
            if ($.type(ids) === "array") {
                for (var i = 0; i < ids.length; i++) {
                    saveSelected[ids[i]] = true;
                }
            }
        }
        workspaceIdToRow = {};
        var newSelected = [];
        var newRows = [];
        for (var i = 0; i < workspaces.length; i++) {
            var workspace = workspaces[i];
            var wsRow = new WorkspaceRow(workspace);
            if (saveSelected[workspace.id]) {
                newSelected.push(wsRow);
            }
            table.append(wsRow.getHtml());
            newRows.push(wsRow);
            workspaceIdToRow[workspace.id] = wsRow;
        }
        selected = newSelected;
        wsRows = newRows;
        filter();
    }
    function select(wsRows) {
        for (var i = 0; i < selected.length; i++) {
            selected[i].unselect();
        }
        var ws = [], ids = [];
        for (var i = 0; i < wsRows.length; i++) {
            var wsRow = wsRows[i];
            var workspace = wsRow.getWorkspace();
            ws.push(workspace);
            ids.push(workspace.id);
            wsRow.select();
        }
        selected = wsRows;
        state.set("selected", ids);
        callback.fire(ws);
    }
    function getRowPosition(wsRow) {
        return $.inArray(wsRow, wsFiltRows);
    }
    function getPrevious(wsRow) {
        var ind = getRowPosition(wsRow);
        if (ind > 0) {
            return wsFiltRows[ind - 1];
        } else {
            return null;
        }
    }
    function getNext(wsRow) {
        var ind = getRowPosition(wsRow);
        if (ind < wsFiltRows.length - 1) {
            return wsFiltRows[ind + 1];
        } else {
            return null;
        }
    }
    function wsRowClick(e, wsRow) {
        if (e.ctrlKey || e.metaKey) {
            var ind = $.inArray(wsRow, selected);
            var newSelected = selected.slice();
            if (ind > -1) {
                newSelected.splice(ind, 1);
            } else {
                newSelected.push(wsRow);
            }
            lastSelectedRow = wsRow;
            lastShiftSelect = null;
            select(newSelected);
        } else if (e.shiftKey) {
            if (lastSelectedRow === null) {
                lastSelectedRow = wsRow;
            }
            var i0 = getRowPosition(lastSelectedRow);
            var i1 = getRowPosition(wsRow);
            var dir;
            var last;
            if (i0 === i1) {
                dir = "none";
                last = i0;
            } else if (i0 > i1) {
                dir = "up";
                last = i1;
                var t = i0;
                i0 = i1;
                i1 = t;
            } else {
                dir = "down";
                last = i1;
            }
            lastShiftSelect = {
                dir: dir,
                last: wsFiltRows[last]
            };
            var newSelected = [];
            for (var i = i0; i <= i1; i++) {
                newSelected.push(wsFiltRows[i]);
            }
            select(newSelected);
        } else {
            lastSelectedRow = wsRow;
            lastShiftSelect = null;
            select([ wsRow ]);
        }
    }
    function tableKey(e) {
        if ((e.ctrlKey || e.metaKey) && e.which == 65) {
            select(wsFiltRows);
            return false;
        }
        if (e.keyCode === 38) {
            if ((lastShiftSelect ? getRowPosition(lastShiftSelect.last) : getRowPosition(lastSelectedRow)) === 0) {
                return false;
            }
            if (e.shiftKey) {
                if (lastSelectedRow === null) {
                    lastSelectedRow = wsFiltRows[wsFiltRows.length - 1];
                }
                if (lastShiftSelect === null) {
                    lastShiftSelect = {
                        dir: "none",
                        last: lastSelectedRow
                    };
                }
                var prev;
                if (lastShiftSelect.dir === "down") {
                    prev = lastShiftSelect.last;
                } else {
                    prev = getPrevious(lastShiftSelect.last);
                }
                if (prev !== null) {
                    var newSelected = selected.slice();
                    if (getRowPosition(lastShiftSelect.last) <= getRowPosition(lastSelectedRow)) {
                        if ($.inArray(prev, newSelected) < 0) {
                            newSelected.push(prev);
                            scrollIntoView("up", prev);
                        }
                    } else if (prev === lastSelectedRow) {
                        prev = getPrevious(prev);
                        newSelected.push(prev);
                        scrollIntoView("up", prev);
                    } else {
                        newSelected.splice($.inArray(prev, newSelected), 1);
                        scrollIntoView("up", getPrevious(prev));
                    }
                    lastShiftSelect = {
                        dir: "up",
                        last: prev
                    };
                    select(newSelected);
                    return false;
                }
            } else {
                var prev;
                if (lastSelectedRow === null) {
                    prev = wsFiltRows[wsFiltRows.length - 1];
                } else if (lastShiftSelect !== null) {
                    prev = getPrevious(lastShiftSelect.last);
                } else {
                    prev = getPrevious(lastSelectedRow);
                }
                if (prev !== null) {
                    lastSelectedRow = prev;
                    lastShiftSelect = null;
                    select([ prev ]);
                    scrollIntoView("up", prev);
                    return false;
                }
            }
        } else if (e.keyCode === 40) {
            if ((lastShiftSelect ? getRowPosition(lastShiftSelect.last) : getRowPosition(lastSelectedRow)) === wsFiltRows.length - 1) {
                return false;
            }
            if (e.shiftKey) {
                if (lastSelectedRow === null) {
                    lastSelectedRow = wsFiltRows[0];
                }
                if (lastShiftSelect === null) {
                    lastShiftSelect = {
                        dir: "none",
                        last: lastSelectedRow
                    };
                }
                var next;
                if (lastShiftSelect.dir === "up") {
                    next = lastShiftSelect.last;
                } else {
                    next = getNext(lastShiftSelect.last);
                }
                if (next !== null) {
                    var newSelected = selected.slice();
                    if (getRowPosition(lastShiftSelect.last) >= getRowPosition(lastSelectedRow)) {
                        if ($.inArray(next, newSelected) < 0) {
                            newSelected.push(next);
                            scrollIntoView("down", next);
                        }
                    } else if (next === lastSelectedRow) {
                        next = getNext(next);
                        newSelected.push(next);
                        scrollIntoView("down", next);
                    } else {
                        newSelected.splice($.inArray(next, newSelected), 1);
                        scrollIntoView("down", getNext(next));
                    }
                    lastShiftSelect = {
                        dir: "down",
                        last: next
                    };
                    select(newSelected);
                    return false;
                }
            } else {
                var next;
                if (lastSelectedRow === null) {
                    next = wsFiltRows[0];
                } else if (lastShiftSelect !== null) {
                    next = getNext(lastShiftSelect.last);
                } else {
                    next = getNext(lastSelectedRow);
                }
                if (next !== null) {
                    lastSelectedRow = next;
                    lastShiftSelect = null;
                    select([ next ]);
                    scrollIntoView("down", next);
                    return false;
                }
            }
        }
        return true;
    }
    function scrollIntoView(dir, wsRow) {
        var ind = $.inArray(wsRow, wsFiltRows);
        if (ind < 0) {
            return;
        }
        var height = wsRow.getHtml().height();
        var start = ind * height + 1;
        var end = start + height;
        var scrollStart = tableDiv.scrollTop();
        var scrollEnd = scrollStart + tableDiv.height();
        if (start >= scrollStart && end <= scrollEnd) {
            return;
        }
        if (dir === "down") {
            if (Math.abs(start - scrollEnd) <= height) {
                wsRow.getHtml().get(0).scrollIntoView(false);
                return;
            }
        } else if (dir === "up") {
            if (Math.abs(end - scrollStart) <= height) {
                wsRow.getHtml().get(0).scrollIntoView(true);
                return;
            }
        }
        tableDiv.scrollTop(start - (scrollEnd - scrollStart - height) / 2);
    }
    function filter() {
        var owner = filterOwner.prop("checked");
        var admin = filterAdmin.prop("checked");
        var write = filterWrite.prop("checked");
        var read = filterRead.prop("checked");
        var search = filterSearch.val();
        state.set("filter", {
            owner: owner,
            admin: admin,
            write: write,
            read: read,
            search: search
        });
        if (wsRows.length === 0) {
            table.find("#ws-info-row").removeClass("hide").find("td").html("no workspaces");
            return;
        }
        var searchRegex = new RegExp(search, "i");
        wsFiltRows = [];
        for (var i = 0; i < wsRows.length; i++) {
            var wsRow = wsRows[i];
            var workspace = wsRow.getWorkspace();
            var show = false;
            if (admin && workspace.user_permission === "a") {
                show = true;
            }
            if (write && workspace.user_permission === "w") {
                show = true;
            }
            if (read && workspace.user_permission === "r") {
                show = true;
            }
            if (show && owner && !workspace.isOwned) {
                show = false;
            }
            if (show && search != "") {
                show = searchRegex.test(workspace.id);
            }
            if (show) {
                wsRow.show();
                wsFiltRows.push(wsRow);
            } else {
                var ind = $.inArray(wsRow, selected);
                if (ind > -1) {
                    wsRow.unselect();
                    selected.splice(ind, 1);
                }
                wsRow.hide();
            }
        }
        if (wsFiltRows.length === 0) {
            table.find("#ws-info-row").removeClass("hide").find("td").html("no workspaces (change filters)");
        } else {
            table.find("#ws-info-row").addClass("hide");
        }
        select(selected);
    }
    function filterCollapseHtml() {
        return "" + '<div class="accordion" style="margin-bottom: 0px;">' + '<div class="accordion-group">' + '<div class="accordion-heading" style="text-align: center; position: relative;">' + '<button class="btn btn-link" title="Filter Workspaces" style="width: 100%; height: 100%;">' + 'Workspaces <span class="caret"></span>' + "</button>" + '<button id="create-workspace" class="btn btn-xs"' + ' style="position: absolute; right: 3px; height: 20px; top: 5px; font-size: 15px; padding: 0px 4px 2px 4px;">' + "+" + "</button>" + "</div>" + '<div id="collapseOne" class="accordion-body collapse">' + '<div class="accordion-inner">' + '<div class="pull-left" style="position: relative; margin-right: 10px; height: 75px;">' + '<div style="display: table; position: static; height: 100%;">' + '<div style="display: table-cell; vertical-align: middle; position: static">' + '<label class="checkbox"><input id="ws-filter-owner" type="checkbox" tabindex="-1" /> owner</label>' + '</div></div></div><div class="pull-left">' + '<label class="checkbox"><input id="ws-filter-admin" type="checkbox" tabindex="-1" /> admin</label>' + '<label class="checkbox"><input id="ws-filter-write" type="checkbox" tabindex="-1" /> write</label>' + '<label class="checkbox"><input id="ws-filter-read" type="checkbox" tabindex="-1" /> read</label>' + '</div><div class="clearfix"></div>' + "</div></div></div></div>";
    }
    function WorkspaceRow(workspace) {
        var self = this;
        var row = $('<tr class="ws-row">');
        var cell = $('<td class="ws-cell">');
        row.append(cell);
        var div = $('<div class="ws-cell-content">');
        cell.append(div);
        div.append('<span class="ws-num-objects badge">~ ' + workspace.objects + "</span>");
        div.append(workspace.isOwned ? "<strong>" + workspace.id + "</strong>" : workspace.id);
        cell.mousedown(function() {
            return false;
        });
        cell.click(function(e) {
            wsRowClick(e, self);
        });
        var manage = $('<a class="ws-cell-manage btn btn-xs btn-xmini hide"' + ' style="margin-right: 2px; padding-bottom: 2px;"' + ' title="Manage Workspace"><i class="icon-cog"></i></a>');
        div.append(manage);
        manage.click(function() {
            manageWorkspaceModal(workspace);
            return false;
        });
        if ($.type(workspace.objectData) === "array") {
            loaded();
        }
        if ($.browser.mobile) {
            manage.removeClass("hide");
            div.addClass("ws-cell-content-hover");
        } else {
            cell.hover(function() {
                manage.removeClass("hide");
                div.addClass("ws-cell-content-hover");
            }, function() {
                manage.addClass("hide");
                div.removeClass("ws-cell-content-hover");
            });
        }
        this.getHtml = function() {
            return row;
        };
        this.select = function() {
            cell.addClass("ws-cell-selected");
        };
        this.unselect = function() {
            cell.removeClass("ws-cell-selected");
        };
        this.hide = function() {
            row.addClass("hide");
        };
        this.show = function() {
            row.removeClass("hide");
        };
        this.getWorkspace = function() {
            return workspace;
        };
        this.loaded = loaded;
        function loaded() {
            div.find(".badge").addClass("badge-success").html(workspace.objectData.length);
        }
    }
    function createWorkspaceModal() {
        var modal = new Modal();
        modal.setTitle("Create Workspace");
        modal.setContent('<table style="margin-left: auto; margin-right: auto; text-align: right;">' + "<tr><td>Workspace Id:</td>" + '<td><input type="text" id="create-id" style="width: 150px" /></td></tr>' + "<tr><td>Global Permission:</td>" + "<td>" + createPermissionSelect("create-permission", "n") + "</td></tr></table>");
        $("#create-permission").css({
            width: "164px"
        });
        modal.on("hidden", function() {
            modal.delete();
        });
        $("#create-id").keypress(function(e) {
            if (e.which == 13) {
                modal.submit();
            }
        });
        modal.setButtons("Cancel", "Create");
        modal.on("submit", function() {
            createWorkspace(modal);
        });
        modal.show();
        $("#create-id").focus();
    }
    function Modal() {
        var self = this;
        var modal = baseModal.clone();
        $("body").append(modal);
        var isLocked = false;
        modal.on("hide", function(e) {
            if (isLocked) {
                e.stopImmediatePropagation();
                return false;
            } else {
                return true;
            }
        });
        var alertRegex = /error|warning|info|success/;
        var btns = modal.find(".modal-footer").find("button");
        btns.eq(1).click(function() {
            modal.trigger("submit");
        });
        this.setTitle = function(title) {
            modal.find(".modal-header").find("h3").html(title);
        };
        this.setContent = function(content) {
            modal.find(".modal-body").empty().append(content);
        };
        this.setButtons = function(cancel, submit) {
            if (cancel === null) {
                btns.eq(0).remove();
            } else if (typeof cancel === "string") {
                btns.eq(0).html(cancel);
            }
            if (submit === null) {
                btns.eq(1).remove();
            } else if (typeof submit === "string") {
                btns.eq(1).html(submit);
            }
        };
        this.on = function() {
            modal.on.apply(modal, arguments);
        };
        this.off = function() {
            modal.off.apply(modal, arguments);
        };
        this.show = function(options, width) {
            if (!options) {
                options = {
                    backdrop: "static"
                };
            }
            modal.modal(options);
            this.setWidth(width);
            modal.find(".modal-body").css({
                padding: "0px 15px",
                margin: "15px 0px"
            });
        };
        this.hide = function() {
            modal.modal("hide");
        };
        this.delete = function() {
            modal.modal("hide");
            modal.remove();
        };
        this.lock = function() {
            isLocked = true;
            modal.find(".modal-header").find("button").prop("disabled", true);
            btns.prop("disabled", true);
        };
        this.unlock = function() {
            isLocked = false;
            modal.find(".modal-header").find("button").prop("disabled", false);
            btns.prop("disabled", false);
        };
        this.cover = function(content) {
            modal.find(".base-modal-cover-box").removeClass().addClass("base-modal-cover-box base-modal-cover-content").empty().append(content);
            modal.find(".modal-body").fadeTo(0, .3);
            modal.find(".base-modal-cover").height(modal.find(".modal-body").outerHeight()).width(modal.find(".modal-body").outerWidth()).removeClass("hide");
        };
        this.uncover = function() {
            modal.find(".base-modal-cover").addClass("hide");
            modal.find(".modal-body").fadeTo(0, 1);
        };
        this.alert = function(message, type) {
            type = alertRegex.test(type) ? "alert-" + type : "";
            modal.find(".base-modal-alert").removeClass("hide alert-error alert-info alert-success").addClass(type).empty().append(message);
        };
        this.alertHide = function() {
            modal.find(".base-modal-alert").addClass("hide");
        };
        this.coverAlert = function(message, type) {
            type = alertRegex.test(type) ? "alert-" + type : "";
            this.cover(message);
            modal.find(".base-modal-cover-box").removeClass().addClass("base-modal-cover-box alert " + type);
        };
        this.coverAlertHide = function() {
            this.uncover();
        };
        this.focus = function() {
            modal.focus();
        };
        this.setWidth = function(width) {
            modal.css({
                width: function() {
                    return width ? width : $(this).width();
                },
                "margin-left": function() {
                    return -($(this).width() / 2);
                }
            });
        };
        this.submit = function() {
            modal.trigger("submit");
        };
    }
    var baseModal = $('<div class="modal base-modal hide" style="width: auto;" tabindex="-1" role="dialog">            <div class="modal-header">              <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>              <h3>Modal</h3>            </div>            <div class="alert base-modal-alert hide"></div>            <div class="base-modal-cover hide">              <div class="base-modal-cover-table">                <div class="base-modal-cover-cell">                  <span class="base-modal-cover-box">                  </span>                </div>              </div>            </div>            <div class="modal-body"></div>            <div class="modal-footer">              <button data-dismiss="modal" class="btn">Cancel</button>              <button class="btn btn-primary">Submit</button>            </div>          </div>');
    function createPermissionSelect(id, value, noNone) {
        var sel = ' selected="selected"';
        var idval = ' id="' + id + '"';
        return "<select" + (id ? idval : "") + ' class="input-sm"' + ' style="margin: 0px;" data-value="' + value + '">' + (noNone ? "" : '<option value="n"' + (value === "n" ? sel : "") + ">none</option>") + '<option value="r"' + (value === "r" ? sel : "") + ">read</option>" + '<option value="w"' + (value === "w" ? sel : "") + ">write</option>" + '<option value="a"' + (value === "a" ? sel : "") + ">admin</option>" + "</select>";
    }
    return this;
};

(function($, undefined) {
    $.KBWidget({
        name: "kbaseAuthenticatedWidget",
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
                console.log("LI");
                this.setAuth(auth);
                if (this.loggedInCallback) {
                    this.loggedInCallback(e, auth);
                }
            }, this));
            $(document).on("loggedOut.kbase", $.proxy(function(e) {
                console.log("LO");
                this.setAuth(undefined);
                if (this.loggedOutCallback) {
                    this.loggedOutCallback(e);
                }
            }, this));
            $(document).trigger("loggedInQuery", $.proxy(function(auth) {
                console.log("CALLS LIQ");
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
            console.log("SETS AUTH TO ");
            console.log(newAuth);
            console.log(this);
        },
        loggedInQueryCallback: function(args) {
            if (this.loggedInCallback) {
                this.loggedInCallback(undefined, args);
            }
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseButtonControls",
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
                var btnClass = "btn btn-default btn-xs";
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
    $.KBWidget({
        name: "KBaseCardManager",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {},
        cardIndex: 0,
        cards: {},
        init: function(options) {
            this._super(options);
            $.ui.dialog.prototype._makeDraggable = function() {
                this.uiDialog.draggable({
                    containment: false
                });
            };
            var self = this;
            $(document).on("kbaseCardClosed", function(event, id) {
                self.cardClosed(id);
            });
            return this;
        },
        cardClosed: function(id) {
            delete this.cards[id];
        },
        addNewCard: function(cardName, options, position) {
            var newCardId = "kblpc" + this.cardIndex;
            if (position === null) {
                position = {
                    my: "center",
                    at: "center",
                    of: "window"
                };
            }
            this.$elem.append("<div id='" + newCardId + "'/>");
            var newWidget = $("#" + newCardId)[cardName](options);
            var cardTitle = newWidget.options.title ? newWidget.options.title : "";
            var cardWidth = newWidget.options.width ? newWidget.options.width : 300;
            var self = this;
            var newCard = $("#" + newCardId).LandingPageCard({
                position: position,
                title: cardTitle,
                width: cardWidth,
                id: newCardId
            });
            this.cards[newCardId] = {
                card: newCard,
                widget: newWidget
            };
            this.cardIndex++;
        },
        destroy: function() {
            this.listDataObjects();
            for (var cardId in this.cards) {
                this.cards[cardId].card.LandingPageCard("close");
            }
            $(document).off("kbaseCardClosed");
            this.$elem.empty();
            this.cards = {};
            this.$elem.remove();
        },
        listDataObjects: function() {
            for (var cardId in this.cards) {
                console.log(this.cards[cardId].widget.getData());
            }
        },
        exportAllCardsToWorkspace: function(workspace) {
            for (var cardId in this.cards) {
                sendCardToWorkspace(cardId, workspace);
            }
        },
        exportCardToWorkspace: function(cardId, workspace) {
            this.cards[cardId].widget.exportToWorkspace(workspace);
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseDataBrowser",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        options: {
            title: "Data Browser",
            canCollapse: true,
            height: "200px",
            types: {
                file: {
                    icon: "icon-file-alt"
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
                var $li = $("<li></li>").attr("id", val.id).append($("<a></a>").css("padding", "3px 5px 3px 5px").append($button).append(" ").append(val.label));
                if (val.data) {
                    $li.data("data", val.data);
                }
                if (val.id) {
                    $li.data("id", val.id);
                    this.targets[val.id] = $li;
                }
                $target.append($li);
                if (val.expandable) {
                    var $ul = $("<ul></ul>").addClass("databrowser-nav list-group").css("margin-bottom", "0px");
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
            return $("<ul></ul>").addClass("databrowser-nav list-group").css("margin-bottom", "0px").css("height", this.options.height).css("overflow", "auto").attr("id", "ul-nav");
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
    $.KBWidget({
        name: "kbaseDeletePrompt",
        parent: "kbasePrompt",
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
    $.KBWidget({
        name: "kbaseErrorPrompt",
        parent: "kbasePrompt",
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
    $.KBWidget({
        name: "kbaseFormBuilder",
        version: "1.0.0",
        options: {
            elements: [],
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
            },
            canSubmit: false
        },
        init: function(options) {
            this._super(options);
            this.$elem.append(this._buildForm(this.options.elements));
            return this;
        },
        getFormValuesAsObject: function() {
            var values = this.getFormValuesAsArray();
            var ret = {};
            $.each(values, function(idx, val) {
                ret[val[0]] = val.slice(1);
                if (val.length == 1) {
                    ret[val[0]] = true;
                }
            });
            return ret;
        },
        getFormValuesAsArray: function() {
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
            var extractedFormValues = this.getFormValuesAsArray();
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
            var $form = $.jqElem("form").addClass("form-horizontal");
            if (data.action) {
                form.attr("action", data.action);
            }
            if (data.method) {
                form.attr("method", data.method);
            }
            if (!data.canSubmit) {
                $form.bind("submit", function(evt) {
                    return false;
                });
            }
            this.data("form", $form);
            var formValues = this.data("formValues", {});
            var $lastFieldset = undefined;
            $.each(data, $.proxy(function(idx, formInput) {
                if (formInput.key == undefined) {
                    formInput.key = formInput.name;
                }
                if (formValues[formInput.key] != undefined) {
                    var errorMsg = "FORM ERROR. KEY " + formInput.key + " IS DOUBLE DEFINED";
                    $form = errorMsg;
                    return false;
                }
                formValues[formInput.key] = formInput;
                if (formInput.fieldset) {
                    if ($lastFieldset == undefined || $lastFieldset.attr("name") != formInput.fieldset) {
                        $lastFieldset = $.jqElem("fieldset").attr("name", formInput.fieldset).append($.jqElem("legend").append(formInput.fieldset));
                        $form.append($lastFieldset);
                    }
                } else {
                    $lastFieldset = $form;
                }
                var labelText = formInput.label != undefined ? formInput.label : formInput.name;
                var $label = $.jqElem("label").addClass("control-label col-lg-2").append($.jqElem("span").attr("title", labelText).append(labelText)).bind("click", function(e) {
                    $(this).next().children().first().focus();
                });
                if (this.options.values[formInput.key] != undefined) {
                    formInput.value = formInput.checked = formInput.selected = this.options.values[formInput.key];
                }
                var $field;
                if (formInput.type == undefined) {
                    formInput.type = "text";
                }
                if (this.options.dispatch[formInput.type]) {
                    $field = this[this.options.dispatch[formInput.type]](formInput);
                } else {
                    $field = this.buildTextField(formInput);
                }
                var $container = $("<div></div>").addClass("col-lg-10");
                var $description;
                if (formInput.description) {
                    $description = $.jqElem("span").addClass("help-block").append(formInput.description);
                }
                if (formInput.multi) {
                    $container.append($.jqElem("div").addClass("input-group").append($field).append($.jqElem("span").addClass("input-group-btn").append($("<button></button>").addClass("btn btn-default").attr("title", "Add more").append($("<i></i>").addClass("icon-plus")).bind("click", function(evt) {
                        $container.append($field.clone());
                        evt.stopPropagation();
                    })))).append($description);
                } else {
                    $container.append($field).append($description);
                }
                if (formInput.disabled) {
                    $field.prop("disabled", true);
                }
                $form.append($("<div></div>").addClass("form-group").append($label).append($container));
            }, this));
            return $form;
        },
        buildTextField: function(data) {
            return $.jqElem("input").attr("type", "text").attr("value", data.value).attr("name", data.name).addClass("form-control");
        },
        buildTextArea: function(data) {
            var $textArea = $.jqElem("textarea").attr("name", data.name).addClass("form-control").append(data.value);
            if (data.rows) {
                $textArea.attr("rows", data.rows);
            }
            return $textArea;
        },
        buildSecureTextField: function(data) {
            return $.jqElem("input").attr("type", "password").attr("value", data.value).attr("name", data.name).addClass("form-control");
        },
        buildCheckbox: function(data) {
            var $checkbox = $.jqElem("input").attr("type", "checkbox").addClass("form-control").attr("name", data.name).attr("value", data.value);
            if (data.checked) {
                $checkbox.prop("checked", true);
            }
            return $checkbox;
        },
        buildRadioButton: function(data) {
            var $radioDiv = $.jqElem("div");
            $.each(data.values, $.proxy(function(idx, val) {
                var value = val;
                var name = val;
                if (typeof val != "string") {
                    value = val.value;
                    name = val.name;
                }
                var $buttonDiv = $.jqElem("div").addClass("radio");
                var $radio = $.jqElem("input").attr("type", "radio").attr("name", data.name).attr("value", value);
                if (data.checked == value) {
                    $radio.prop("checked", true);
                }
                var $l = $.jqElem("label").addClass("control-label").append($radio).append(name);
                $buttonDiv.append($l);
                $radioDiv.append($buttonDiv);
            }, this));
            return $radioDiv;
        },
        buildSelectbox: function(data) {
            var $selectbox = $.jqElem("select").attr("name", data.name).addClass("form-control");
            if (data.type == "multiselect") {
                $selectbox.prop("multiple", true);
                if (data.size) {
                    $selectbox.attr("size", data.size);
                }
            }
            if (data.names == undefined) {
                data.names = [];
            }
            $.each(data.values, function(idx, val) {
                var value = val;
                var name = val;
                if (typeof val != "string") {
                    value = val.value;
                    name = val.name;
                }
                var $option = $.jqElem("option").attr("value", value).append(name);
                if (typeof data.selected == "string" && data.selected == value) {
                    $option.prop("selected", true);
                } else if (typeof data.selected == "object") {
                    $.each(data.selected, function(idx, selectedValue) {
                        if (selectedValue == value) {
                            $option.prop("selected", true);
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
    $.KBWidget({
        name: "kbaseIrisCommands",
        parent: "kbaseAccordion",
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
                var num = 0;
                var commands = [];
                $.each(res, $.proxy(function(idx, group) {
                    num += group.items.length;
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
                console.log("NUM " + num);
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
            var $form = $.jqElem("form").css("margin-bottom", "2px").append($("<div></div>").css("max-height", this.options.overflow ? this.options.sectionHeight : "5000px").css("overflow", this.options.overflow ? "auto" : "visible").append($("<div></div>").addClass("input-group").addClass("pull-right").addClass("input-group-sm").attr("id", "searchFieldBox").append($("<input></input>").attr("type", "text").attr("name", "search").addClass("form-control").attr("id", "searchField").attr("size", "50").keyup($.proxy(function(e) {
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
                this.data("searchResults").prepend($.jqElem("div").css("position", "relative").css("top", "2px").css("left", "90%").append($.jqElem("button").addClass("btn btn-default btn-xs").append($.jqElem("i").addClass("icon-remove")).on("click", $.proxy(function(e) {
                    this.data("searchField").val("");
                    this.data("searchField").trigger("keyup");
                }, this))));
            }, this))).append($.jqElem("span").addClass("input-group-btn").css("height", "30px").append($.jqElem("button").addClass("btn btn-default").attr("id", "search-button").append($.jqElem("i").attr("id", "search-button-icon").addClass("icon-search")).on("click", $.proxy(function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.data("searchField").trigger("keyup");
            }, this))))));
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
    $.KBWidget({
        name: "kbaseIrisFileBrowser",
        parent: "kbaseDataBrowser",
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
    $.KBWidget({
        name: "kbaseIrisFileEditor",
        parent: "kbaseAuthenticatedWidget",
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
            }, this), $.proxy(function(err) {
                this.dbg("FILE FAILURE");
                this.dbg(err);
                this.dbg(this);
            }, this));
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
    $.KBWidget({
        name: "kbaseIrisGrammar",
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
                }, this),
                type: "GET"
            });
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseIrisProcessList",
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
            $(document).on("clearIrisProcesses.kbaseIris", $.proxy(function(e) {
                this.clearProcesses(e);
            }, this));
            this.appendUI(this.$elem);
            return this;
        },
        clearProcesses: function(e) {
            var pids = Object.keys(this.processList());
            $.each(pids, $.proxy(function(idx, pid) {
                this.removeProcess(e, pid);
            }, this));
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
    $.KBWidget({
        name: "kbaseIrisTerminal",
        parent: "kbaseAuthenticatedWidget",
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
            $(document).on("loggedInQuery.kbase", $.proxy(function(e, callback) {
                var auth = this.auth();
                console.log("TRIG AUTH");
                console.log(auth);
                if (callback && auth != undefined && auth.unauthenticated == true) {
                    callback(auth);
                }
            }, this));
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
            this.trigger("clearIrisProcesses");
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
                        success: true,
                        unauthenticated: true
                    };
                    this.terminal.empty();
                    this.trigger("logout", false);
                    this.trigger("loggedOut");
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
                this.trigger("loggedOut");
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
                this.trigger("loggedOut", false);
                this.scroll();
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
                    this.out_to_div($commandDiv, "Could not load tutorials.<br>\n", 0, 1);
                    this.out_to_div($commandDiv, "Type <i>tutorial list</i> to see available tutorials.", 0, 1);
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
            if (command == "clear") {
                this.terminal.empty();
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
            if (m = command.match(/^rm\s+(.*)/)) {
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
            var promise = this.client().run_pipeline(this.sessionId(), command, [], this.options.maxOutput, this.cwd, jQuery.proxy(function(runout) {
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
            }, this), $.proxy(function(res) {
                this.trigger("removeIrisProcess", pid);
            }, this));
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseIrisTutorial",
        version: "1.0.0",
        options: {
            configURL: "http://www.kbase.us/docs/tutorials.cfg",
            tutorial: "http://www.kbase.us/docs/getstarted/getstarted_iris/getstarted_iris.html"
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
    $.KBWidget({
        name: "LandingPageCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            draggable: true,
            autoOpen: true,
            closeOnEscape: false,
            position: null,
            id: 0
        },
        init: function(options) {
            this._super(options);
            if (this.options.position === null) {
                this.options.position = {
                    my: "center",
                    at: "center"
                };
            }
            var self = this;
            this.options.open = function(event, ui) {
                self.$elem.css("overflow", "hidden");
            };
            this.options.close = function(event, ui) {
                self.$elem.dialog("destroy");
                self.$elem.remove();
                $(document).trigger("kbaseCardClosed", self.options.id);
            };
            this.$elem.addClass("kblpc");
            this.$elem.dialog(this.options);
            return this;
        },
        close: function(options) {
            this.$elem.dialog("close");
        },
        destroy: function(options) {
            this.$elem.dialog("destroy");
            this.$elem.remove();
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseBioCpdTable",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var token = options.auth;
            var panel = this.$elem.kbasePanel({
                title: "Biochemistry Compounds",
                rightLabel: ws
            });
            var panel_body = panel.body();
            var fba = new fbaModelServices("https://kbase.us/services/fba_model_services/");
            var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
            var tableSettings = {
                fnDrawCallback: cpdEvents,
                sPaginationType: "full_numbers",
                iDisplayLength: 20,
                aaData: [],
                oLanguage: {
                    sSearch: "Search all:"
                }
            };
            var chunk = 250;
            var bioAJAX = fba.get_biochemistry({});
            panel_body.append('<div class="progress">              <div class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 3%;">              </div>            </div>');
            var proms = [];
            k = 1;
            $.when(bioAJAX).done(function(data) {
                var cpds = data.compounds;
                var total_cpds = cpds.length;
                var iterations = parseInt(total_cpds / chunk);
                var compound_data = [];
                for (var i = 0; i < iterations; i++) {
                    var cpd_subset = cpds.slice(i * chunk, (i + 1) * chunk - 1);
                    var cpdAJAX = fba.get_compounds({
                        compounds: cpd_subset
                    });
                    $.when(cpdAJAX).done(function(cpd_data) {
                        k = k + 1;
                        compound_data = compound_data.concat(cpd_data);
                        var percent = compound_data.length / total_cpds * 100 + "%";
                        $(".progress-bar").css("width", percent);
                        if (k == iterations) {
                            $(".progress").remove();
                            load_table(compound_data);
                        }
                    });
                }
            });
            function load_table(reaction_data) {
                var dataDict = formatCpdObjs(reaction_data);
                var keys = [ "id", "abbrev", "formula", "charge", "deltaG", "deltaGErr", "name", "aliases" ];
                var labels = [ "id", "abbrev", "formula", "charge", "deltaG", "deltaGErr", "name", "aliases" ];
                var cols = getColumns(keys, labels);
                tableSettings.aoColumns = cols;
                panel_body.append('<table id="rxn-table" class="table table-striped table-bordered"></table>');
                var table = $("#rxn-table").dataTable(tableSettings);
                table.fnAddData(dataDict);
            }
            function formatCpdObjs(cpdObjs) {
                for (var i in cpdObjs) {
                    var cpd = cpdObjs[i];
                    cpd.id = '<a class="cpd-click" data-cpd="' + cpd.id + '">' + cpd.id + "</a>";
                    cpd.aliases = cpd.aliases.join("<br>");
                }
                return cpdObjs;
            }
            function getColumns(keys, labels) {
                var cols = [];
                for (var i = 0; i < keys.length; i++) {
                    cols.push({
                        sTitle: labels[i],
                        mData: keys[i]
                    });
                }
                return cols;
            }
            function cpdEvents() {
                $(".cpd-click").unbind("click");
                $(".cpd-click").click(function() {
                    var rxn = [ $(this).data("cpd") ];
                    self.trigger("cpdClick", {
                        rxns: rxn
                    });
                });
            }
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseBioRxnTable",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var token = options.auth;
            self.reaction_data = [];
            var panel = this.$elem.kbasePanel({
                title: "Biochemistry Reactions"
            });
            var panel_body = panel.body();
            var fba = new fbaModelServices("https://kbase.us/services/fba_model_services/");
            var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
            var tableSettings = {
                fnDrawCallback: rxnEvents,
                sPaginationType: "full_numbers",
                iDisplayLength: 20,
                aaData: [],
                oLanguage: {
                    sSearch: "Search all:"
                }
            };
            var chunk = 500;
            var bioAJAX = fba.get_biochemistry({});
            panel_body.append('<div class="progress">              <div class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 3%;">              </div>            </div>');
            if (self.reaction_data.length > 0) {
                $(".progress").remove();
                load_table(self.reaction_data);
            } else {
                k = 1;
                $.when(bioAJAX).done(function(data) {
                    var rxns = data.reactions;
                    var total_rxns = rxns.length;
                    var iterations = parseInt(total_rxns / chunk);
                    for (var i = 0; i < iterations; i++) {
                        var rxn_subset = rxns.slice(i * chunk, (i + 1) * chunk - 1);
                        var rxnAJAX = fba.get_reactions({
                            reactions: rxn_subset
                        });
                        $.when(rxnAJAX).done(function(rxn_data) {
                            k = k + 1;
                            self.reaction_data = self.reaction_data.concat(rxn_data);
                            var percent = self.reaction_data.length / total_rxns * 100 + "%";
                            $(".progress-bar").css("width", percent);
                            if (k == iterations) {
                                $(".progress").remove();
                                load_table(self.reaction_data);
                            }
                        });
                    }
                });
            }
            function load_table(reaction_data) {
                var dataDict = formatRxnObjs(reaction_data);
                var keys = [ "id", "abbrev", "definition", "deltaG", "deltaGErr", "enzymes", "name" ];
                var labels = [ "id", "abbrev", "definition", "deltaG", "deltaGErr", "enzymes", "name" ];
                var cols = getColumns(keys, labels);
                tableSettings.aoColumns = cols;
                panel_body.append('<table id="rxn-table" class="table table-striped table-bordered"></table>');
                var table = $("#rxn-table").dataTable(tableSettings);
                table.fnAddData(dataDict);
            }
            function formatRxnObjs(rxnObjs) {
                for (var i in rxnObjs) {
                    var rxn = rxnObjs[i];
                    rxn.id = '<a class="rxn-click" data-rxn="' + rxn.id + '">' + rxn.id + "</a>";
                    rxn.enzymes = rxn.enzymes.join("<br>");
                }
                return rxnObjs;
            }
            function getColumns(keys, labels) {
                var cols = [];
                for (var i = 0; i < keys.length; i++) {
                    cols.push({
                        sTitle: labels[i],
                        mData: keys[i]
                    });
                }
                return cols;
            }
            function rxnEvents() {
                $(".rxn-click").unbind("click");
                $(".rxn-click").click(function() {
                    var rxn = [ $(this).data("rxn") ];
                    self.trigger("rxnClick", {
                        rxns: rxn
                    });
                });
            }
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseRxnModal",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var token = options.auth;
            var fba = new fbaModelServices("https://kbase.us/services/fba_model_services/");
            var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
            var modal = self.$elem.kbaseModal({
                title: "Reaction Info",
                subText: "Note: this view is currently under development."
            });
            modal.loading();
            var modal_body = modal.body();
            this.show = function(options) {
                var rxns = options.rxns;
                var model_id = options.model_id;
                modal.show();
                var selection_list = $('<ul id="rxn-tabs" class="sub-nav nav nav-tabs">');
                for (var i in rxns) {
                    var link = $('<a href="#' + rxns[i] + '" data-toggle="tab" >' + rxns[i] + "</a>");
                    var li = $("<li>");
                    if (i == 0) {
                        li.addClass("active");
                    }
                    li.append(link);
                    selection_list.append(li);
                }
                modal_body.append(selection_list);
                var fbaAJAX = fba.get_reactions({
                    reactions: rxns,
                    auth: token
                });
                $.when(fbaAJAX).done(function(data) {
                    if (model_id) {
                        model_rxn_tab(modal_body, data);
                    } else {
                        rxn_tab(modal_body, data);
                    }
                });
            };
            function rxn_tab(container, data) {
                container.find(".ajax-loader").remove();
                for (var i in data) {
                    var rxn = data[i];
                    var cpds = get_cpds(rxn["equation"]);
                    var rxn_tab = $('<div id="' + rxn.id + '" class="tab-pane in"></div>');
                    if (i != 0) {
                        rxn_tab.hide();
                    }
                    rxn_tab.append("<h4>" + rxn["name"] + "</h4>");
                    for (var i = 0; i < cpds.left.length; i++) {
                        var cpd = cpds.left[i];
                        var img_url = "http://bioseed.mcs.anl.gov/~chenry/jpeg/" + cpd + ".jpeg";
                        rxn_tab.append('<div class="pull-left text-center">                                        <img src="' + img_url + '" width=150 ><br>' + cpd + "</div>");
                        var plus = $('<div class="pull-left text-center">+</div>');
                        plus.css("margin", "30px 0 0 0");
                        if (i < cpds.left.length - 1) {
                            rxn_tab.append(plus);
                        }
                    }
                    var direction = $('<div class="pull-left text-center">' + "<=>" + "</div>");
                    direction.css("margin", "25px 0 0 0");
                    rxn_tab.append(direction);
                    for (var i = 0; i < cpds.right.length; i++) {
                        var cpd = cpds.right[i];
                        var img_url = "http://bioseed.mcs.anl.gov/~chenry/jpeg/" + cpd + ".jpeg";
                        rxn_tab.append('<div class="pull-left text-center">                                        <img src="' + img_url + '" width=150 ><br>' + cpd + "</div>");
                        var plus = $('<div class="pull-left text-center">+</div>');
                        plus.css("margin", "25px 0 0 0");
                        if (i < cpds.right.length - 1) {
                            rxn_tab.append(plus);
                        }
                    }
                    rxn_tab.append("<br>");
                    var table = $('<table class="table table-striped table-bordered">');
                    for (var key in rxn) {
                        if (key == "id") continue;
                        if (key == "aliases") {
                            var value = rxn[key].join("<br>");
                        } else {
                            var value = rxn[key];
                        }
                        table.append("<tr><td>" + key + "</td><td>" + value + "</td></tr>");
                    }
                    rxn_tab.append(table);
                    container.append(rxn_tab);
                }
            }
            function model_rxn_tab(data) {}
            function get_cpds(equation) {
                var cpds = {};
                var sides = equation.split("=");
                cpds.left = sides[0].match(/cpd\d*/g);
                cpds.right = sides[1].match(/cpd\d*/g);
                return cpds;
            }
            $("#rxn-tabs a").click(function(e) {
                e.preventDefault();
                $(this).tab("show");
            });
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseFbaTabs",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var fbas = options.ids;
            var workspaces = options.workspaces;
            var token = options.auth;
            this.$elem.append('<div id="kbase-fba-tabs" class="panel panel-default">                                <div class="panel-heading">                                    <h4 class="panel-title">FBA Details</h4>' + fbas[0] + '<span class="label label-primary pull-right">' + workspaces[0] + '</span><br>                                </div>                                <div class="panel-body"></div>                           </div>');
            var container = $("#kbase-fba-tabs .panel-body");
            var fba = new fbaModelServices("https://kbase.us/services/fba_model_services/");
            var tables = [ "Reactions", "Compounds" ];
            var tableIds = [ "reaction", "compound" ];
            var tabs = $('<ul id="table-tabs" class="nav nav-tabs">                         <li class="active" >                         <a href="#' + tableIds[0] + '" data-toggle="tab" >' + tables[0] + "</a>                       </li></ul>");
            for (var i = 1; i < tableIds.length; i++) {
                tabs.append('<li><a href="#' + tableIds[i] + '" data-toggle="tab">' + tables[i] + "</a></li>");
            }
            container.append(tabs);
            var tab_pane = $('<div id="tab-content" class="tab-content">');
            tab_pane.append('<div class="tab-pane in active" id="' + tableIds[0] + '">                             <table cellpadding="0" cellspacing="0" border="0" id="' + tableIds[0] + '-table"                             class="table table-bordered table-striped" style="width: 100%;"></table>                        </div>');
            for (var i = 1; i < tableIds.length; i++) {
                var tableDiv = $('<div class="tab-pane in" id="' + tableIds[i] + '"> ');
                var table = $('<table cellpadding="0" cellspacing="0" border="0" id="' + tableIds[i] + '-table"                             class="table table-striped table-bordered">');
                tableDiv.append(table);
                tab_pane.append(tableDiv);
            }
            container.append(tab_pane);
            $("#table-tabs a").click(function(e) {
                e.preventDefault();
                $(this).tab("show");
            });
            var tableSettings = {
                sPaginationType: "full_numbers",
                iDisplayLength: 10,
                oLanguage: {
                    sSearch: "Search all:"
                }
            };
            var fbaAJAX = fba.get_fbas({
                fbas: fbas,
                workspaces: workspaces
            });
            $(".tab-pane").append('<p class="muted loader-tables">                                   <img src="assets/img/ajax-loader.gif"> loading...</p>');
            $.when(fbaAJAX).done(function(data) {
                console.log(data);
                var fba = data[0];
                console.log(fba);
                var dataDict = formatObjs(fba.reactionFluxes);
                var labels = [ "id", "Flux", "lower", "upper", "min", "max", "basd", "Equation" ];
                var cols = getColumnsByLabel(labels);
                var rxnTableSettings = $.extend({}, tableSettings, {
                    fnDrawCallback: events
                });
                rxnTableSettings.aoColumns = cols;
                rxnTableSettings.aaData = dataDict;
                container.append('<table id="reaction-table" class="table table-striped table-bordered"></table>');
                var table = $("#reaction-table").dataTable(rxnTableSettings);
                var dataDict = formatObjs(fba.compoundFluxes);
                var labels = [ "id", "Flux", "lower", "upper", "min", "max", "Equation" ];
                var cols = getColumnsByLabel(labels);
                var cpdTableSettings = $.extend({}, tableSettings, {
                    fnDrawCallback: events
                });
                cpdTableSettings.aoColumns = cols;
                cpdTableSettings.aaData = dataDict;
                container.append('<table id="compound-table" class="table table-striped table-bordered"></table>');
                var table = $("#compound-table").dataTable(cpdTableSettings);
                $(".loader-tables").remove();
            });
            function formatObjs(objs) {
                for (var i in objs) {
                    var obj = objs[i];
                    var rxn = obj[0].split("_")[0];
                    var compart = obj[0].split("_")[1];
                    obj[0] = '<a class="rxn-click" data-rxn="' + rxn + '">' + rxn + "</a> (" + compart + ")";
                }
                return objs;
            }
            function getColumnsByLabel(labels) {
                var cols = [];
                for (var i in labels) {
                    cols.push({
                        sTitle: labels[i]
                    });
                }
                return cols;
            }
            function events() {
                $(".rxn-click").unbind("click");
                $(".rxn-click").click(function() {
                    var rxn = [ $(this).data("rxn") ];
                    self.trigger("rxnClick", {
                        rxns: rxn
                    });
                });
            }
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseFormulationForm",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var token = options.auth;
            var media = options.id;
            var ws = options.ws;
            var title = options.title ? options.title : "Set formulation";
            var fba = new fbaModelServices("http://140.221.85.73:4043/");
            var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
            var container = $('<div id="kbase-formulation-form" class="panel panel-default">                                <div class="panel-heading">                                    <h4 class="panel-title">' + title + '</h4>                                </div>                                <div class="panel-body"></div>                           </div>');
            self.$elem.append(container);
            var panel_body = container.find(".panel-body");
            var test = [ {
                label: "media",
                tag: "input",
                type: "text",
                placeholder: "optional",
                id: "media"
            }, {
                label: "additionalcpds",
                tag: "input",
                type: "text",
                placeholder: "optional",
                id: "additionalcpds"
            }, {
                label: "prommodel",
                tag: "input",
                type: "text",
                placeholder: "optional",
                id: "prommodel"
            }, {
                label: "prommodel_workspace",
                tag: "input",
                type: "text",
                placeholder: "optional",
                id: "prommodel_workspace"
            }, {
                label: "media_workspace",
                tag: "input",
                type: "text",
                placeholder: "optional",
                id: "media_workspace"
            }, {
                label: "objfraction",
                tag: "input",
                type: "text",
                placeholder: "optional",
                id: "objfraction"
            }, {
                label: "defaultmaxflux",
                tag: "input",
                type: "text",
                placeholder: "required",
                val: "100",
                id: "defaultmaxflux",
                required: true
            }, {
                label: "defaultminuptake",
                tag: "input",
                type: "text",
                placeholder: "required",
                val: "-100",
                id: "defaultminuptake",
                required: true
            }, {
                label: "defaultmaxuptake",
                tag: "input",
                type: "text",
                placeholder: "required",
                val: "0",
                id: "defaultmaxuptake",
                required: true
            }, {
                label: "simplethermoconst",
                tag: "checkbox",
                type: "checkbox",
                placeholder: "optional",
                id: "simplethermoconst"
            }, {
                label: "thermoconst",
                tag: "checkbox",
                type: "checkbox",
                placeholder: "optional",
                id: "thermoconst"
            }, {
                label: "nothermoerror",
                tag: "checkbox",
                type: "checkbox",
                placeholder: "optional",
                id: "nothermoerror"
            }, {
                label: "minthermoerror",
                tag: "checkbox",
                type: "checkbox",
                placeholder: "optional",
                id: "minthermoerror"
            } ];
            var form = form_builder(test);
            panel_body.append(form);
            function form_builder(objs) {
                var form = $('<form class="form-horizontal" role="form">');
                console.log(objs);
                for (var i in objs) {
                    var obj = objs[i];
                    if (obj.tag == "input") {
                        var group = $('<div class="form-group">');
                        var label = $('<label for="' + obj.id + '" class="col-lg-4 control-label">' + obj.label + "</label>");
                        group.append(label);
                        var grid = $('<div class="col-lg-8">');
                        if (obj.required) {
                            grid.append('<input type="' + obj.type + '" id="' + obj.id + '" class="form-control"  value="' + obj.val + '" required>');
                        } else {
                            grid.append('<input type="' + obj.type + '" id="' + obj.id + '" class="form-control" placeholder="' + obj.placeholder + '">');
                        }
                        group.append(grid);
                        form.append(group);
                    } else if (obj.tag == "checkbox") {
                        var group = $('<div class="form-group">');
                        var label = $('<label for="' + obj.id + '" class="col-lg-4 control-label">' + obj.label + "</label>");
                        group.append(label);
                        var grid = $('<div class="col-lg-8">');
                        grid.append('<input type="' + obj.type + '" id="' + obj.id + '" class="form-control" placeholder="' + obj.placeholder + '">');
                        group.append(grid);
                        form.append(group);
                    }
                }
                return form;
            }
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseRunFba",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var ws = options.ws;
            var id = options.id;
            var formulation = options.formulation;
            var fba = new fbaModelServices("http://140.221.85.73:4043/");
            var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
            var container = $('<div id="kbase-run-fba">');
            var body = $('<div class="fba-run-info"><b>Model:</b> ' + id + "<br><br></div>");
            var fba_button = $('<button type="button" class="btn btn-primary run-fba-btn" disabled="disabled">Run FBA</button>');
            body.append(fba_button);
            var panel = container.kbasePanel({
                title: "Run FBA",
                body: body.html()
            });
            self.$elem.append(container);
            $(".run-fba-btn").click(function() {
                var fbaAJAX = fba.queue_runfba({
                    model: id,
                    formulation: formulation,
                    workspace: ws
                });
                self.$elem.append('<p class="muted loader-rxn">                 <img src="assets/img/ajax-loader.gif"> loading...</p>');
                $.when(fbaAJAX).done(function(data) {
                    console.log(data);
                });
            });
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "KBaseContigBrowser",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            contig: null,
            centerFeature: null,
            onClickUrl: null,
            allowResize: true,
            svgWidth: 500,
            svgHeight: 100,
            trackMargin: 5,
            trackThickness: 15,
            leftMargin: 5,
            topMargin: 20,
            arrowSize: 10,
            start: 1,
            length: 1e4,
            embedInCard: false,
            showButtons: false,
            cardContainer: null,
            onClickFunction: null,
            width: 550,
            title: "Contig Browser"
        },
        cdmiURL: "http://kbase.us/services/cdmi_api",
        proteinInfoURL: "http://kbase.us/services/protein_info_service",
        workspaceURL: "http://kbase.us/services/workspace",
        tooltip: null,
        operonFeatures: [],
        $messagePane: null,
        init: function(options) {
            this._super(options);
            if (this.options.contig === null) {}
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane").addClass("kbwidget-hide-message");
            this.$elem.append(this.$messagePane);
            this.cdmiClient = new CDMI_API(this.cdmiURL);
            this.entityClient = new CDMI_EntityAPI(this.cdmiURL);
            this.proteinInfoClient = new ProteinInfo(this.proteinInfoURL);
            this.workspaceClient = new workspaceService(this.workspaceURL);
            this.options.title += " - " + this.options.contig;
            this.render();
            var self = this;
            if (this.options.showButtons) {
                this.$elem.KBaseContigBrowserButtons({
                    browser: self
                });
            }
            this.options.onClickFunction = function(svgElement, feature) {
                self.trigger("featureClick", {
                    feature: feature,
                    featureElement: svgElement
                });
            };
            return this;
        },
        render: function() {
            this.loading(false);
            this.tooltip = d3.select("body").append("div").classed("kbcb-tooltip", true);
            this.svg = d3.select(this.$elem[0]).append("svg").attr("width", this.options.svgWidth).attr("height", this.options.svgHeight).classed("kbcb-widget", true);
            this.trackContainer = this.svg.append("g");
            this.xScale = d3.scale.linear().domain([ this.options.start, this.options.start + this.options.length ]).range([ 0, this.options.svgWidth ]);
            this.xAxis = d3.svg.axis().scale(this.xScale).orient("top").tickFormat(d3.format(",.0f"));
            this.axisSvg = this.svg.append("g").attr("class", "kbcb-axis").attr("transform", "translate(0, " + this.options.topMargin + ")").call(this.xAxis);
            var self = this;
            $(window).on("resize", function() {
                self.resize();
            });
            if (this.options.centerFeature != null) this.setCenterFeature(this.options.centerFeature);
            this.setContig();
            return this;
        },
        track: function() {
            var that = {};
            that.regions = [];
            that.min = Infinity;
            that.max = -Infinity;
            that.numRegions = 0;
            that.addRegion = function(feature_location) {
                for (var i = 0; i < feature_location.length; i++) {
                    var start = Number(feature_location[i][1]);
                    var length = Number(feature_location[i][3]);
                    var end = feature_location[i][2] === "+" ? start + length - 1 : start - length + 1;
                    if (start > end) {
                        var x = end;
                        end = start;
                        start = x;
                    }
                    this.regions.push([ start, end ]);
                    if (start < this.min) this.min = start;
                    if (end > this.max) this.max = end;
                    this.numRegions++;
                }
            };
            that.hasOverlap = function(feature_location) {
                for (var i = 0; i < feature_location.length; i++) {
                    var start = Number(feature_location[i][1]);
                    var length = Number(feature_location[i][3]);
                    var end = feature_location[i][2] === "+" ? start + length - 1 : start - length + 1;
                    if (start > end) {
                        var x = end;
                        end = start;
                        start = x;
                    }
                    for (var ii = 0; ii < this.regions.length; ii++) {
                        var region = this.regions[ii];
                        if (!(start <= region[0] && end <= region[0] || start >= region[1] && end >= region[1])) return true;
                    }
                }
                return false;
            };
            return that;
        },
        setContig: function(contigId) {
            if (contigId && this.options.contig !== contigId) {
                this.options.centerFeature = null;
                this.operonFeatures = [];
                this.options.contig = contigId;
            }
            var self = this;
            this.cdmiClient.contigs_to_lengths([ this.options.contig ], function(contigLength) {
                self.contigLength = parseInt(contigLength[self.options.contig]);
                self.options.start = 0;
                if (self.options.length > self.contigLength) self.options.length = self.contigLength;
            });
            if (this.options.centerFeature) {
                this.setCenterFeature();
            } else {
                this.update();
            }
        },
        setCenterFeature: function(centerFeature) {
            if (centerFeature) this.options.centerFeature = centerFeature;
            var self = this;
            this.proteinInfoClient.fids_to_operons([ this.options.centerFeature ], function(operonGenes) {
                self.operonFeatures = operonGenes[self.options.centerFeature];
                self.update();
            }, function(error) {
                self.throwError(error);
            });
        },
        setGenome: function(genomeId) {
            this.options.genomeId = genomeId;
            var genomeList = cdmiAPI.genomes_to_contigs([ genomeId ], function(genomeList) {
                setContig(this.genomeList[genomeId][0]);
            });
        },
        setRange: function(start, length) {
            this.options.start = start;
            this.options.length = length;
            this.update();
        },
        processFeatures: function(features) {
            var tracks = [];
            tracks[0] = this.track();
            var feature_arr = [];
            for (fid in features) {
                feature_arr.push(features[fid]);
            }
            features = feature_arr;
            features.sort(function(a, b) {
                return a.feature_location[0][1] - b.feature_location[0][1];
            });
            for (var j = 0; j < features.length; j++) {
                var feature = features[j];
                for (var i = 0; i < tracks.length; i++) {
                    if (!tracks[i].hasOverlap(feature.feature_location)) {
                        tracks[i].addRegion(feature.feature_location);
                        feature.track = i;
                        break;
                    }
                }
                if (feature.track === undefined) {
                    var next = tracks.length;
                    tracks[next] = this.track();
                    tracks[next].addRegion(feature.feature_location);
                    feature.track = next;
                }
            }
            this.numTracks = tracks.length;
            return features;
        },
        update: function(useCenter) {
            var self = this;
            var renderFromCenter = function(feature) {
                if (feature) {
                    feature = feature[self.options.centerFeature];
                    self.options.start = Math.max(0, Math.floor(parseInt(feature.feature_location[0][1]) + parseInt(feature.feature_location[0][3]) / 2 - self.options.length / 2));
                } else {
                    window.alert("Error: fid '" + self.options.centerFeature + "' not found! Continuing with original range...");
                }
                self.cdmiClient.region_to_fids([ self.options.contig, self.options.start, "+", self.options.length ], getFeatureData);
            };
            var getFeatureData = function(fids) {
                self.cdmiClient.fids_to_feature_data(fids, getOperonData);
            };
            var getOperonData = function(features) {
                if (self.options.centerFeature) {
                    for (var j in features) {
                        for (var i in self.operonFeatures) {
                            if (features[j].feature_id === self.operonFeatures[i]) features[j].isInOperon = 1;
                        }
                    }
                }
                self.renderFromRange(features);
            };
            if (self.options.centerFeature && useCenter) self.cdmiClient.fids_to_feature_data([ self.options.centerFeature ], renderFromCenter); else self.cdmiClient.region_to_fids([ self.options.contig, self.options.start, "+", self.options.length ], getFeatureData);
        },
        adjustHeight: function() {
            var neededHeight = this.numTracks * (this.options.trackThickness + this.options.trackMargin) + this.options.topMargin + this.options.trackMargin;
            if (neededHeight > this.svg.attr("height")) {
                this.svg.attr("height", neededHeight);
            }
        },
        renderFromRange: function(features) {
            features = this.processFeatures(features);
            var self = this;
            if (this.options.allowResize) this.adjustHeight();
            var trackSet = this.trackContainer.selectAll("path").data(features, function(d) {
                return d.feature_id;
            });
            trackSet.enter().append("path").classed("kbcb-feature", true).classed("kbcb-operon", function(d) {
                return self.isOperonFeature(d);
            }).classed("kbcb-center", function(d) {
                return self.isCenterFeature(d);
            }).attr("id", function(d) {
                return d.feature_id;
            }).on("mouseover", function(d) {
                d3.select(this).style("fill", d3.rgb(d3.select(this).style("fill")).darker());
                self.tooltip = self.tooltip.text(d.feature_id + ": " + d.feature_function);
                return self.tooltip.style("visibility", "visible");
            }).on("mouseout", function() {
                d3.select(this).style("fill", d3.rgb(d3.select(this).style("fill")).brighter());
                return self.tooltip.style("visibility", "hidden");
            }).on("mousemove", function() {
                return self.tooltip.style("top", d3.event.pageY + 15 + "px").style("left", d3.event.pageX - 10 + "px");
            }).on("click", function(d) {
                if (self.options.onClickFunction) {
                    self.options.onClickFunction(this, d);
                } else {
                    self.highlight(this, d);
                }
            });
            trackSet.exit().remove();
            trackSet.attr("d", function(d) {
                return self.featurePath(d);
            });
            self.xScale = self.xScale.domain([ self.options.start, self.options.start + self.options.length ]);
            self.xAxis = self.xAxis.scale(self.xScale);
            self.axisSvg.call(self.xAxis);
            self.resize();
            this.loading(true);
        },
        featurePath: function(feature) {
            var path = "";
            var coords = [];
            for (var i = 0; i < feature.feature_location.length; i++) {
                var location = feature.feature_location[i];
                var left = this.calcXCoord(location);
                var top = this.calcYCoord(location, feature.track);
                var height = this.calcHeight(location);
                var width = this.calcWidth(location);
                coords.push([ left, left + width ]);
                if (location[2] === "+") path += this.featurePathRight(left, top, height, width) + " "; else path += this.featurePathLeft(left, top, height, width) + " ";
            }
            if (feature.feature_location.length > 1) {
                coords.sort(function(a, b) {
                    return a[0] - b[0];
                });
                var mid = this.calcYCoord(feature.feature_location[0], feature.track) + this.calcHeight(feature.feature_location[0]) / 2;
                for (var i = 0; i < coords.length - 1; i++) {
                    path += "M" + coords[i][1] + " " + mid + " L" + coords[i + 1][0] + " " + mid + " Z ";
                }
            }
            return path;
        },
        featurePathRight: function(left, top, height, width) {
            var path = "M" + left + " " + top;
            if (width > this.options.arrowSize) {
                path += " L" + (left + (width - this.options.arrowSize)) + " " + top + " L" + (left + width) + " " + (top + height / 2) + " L" + (left + (width - this.options.arrowSize)) + " " + (top + height) + " L" + left + " " + (top + height) + " Z";
            } else {
                path += " L" + (left + width) + " " + (top + height / 2) + " L" + left + " " + (top + height) + " Z";
            }
            return path;
        },
        featurePathLeft: function(left, top, height, width) {
            var path = "M" + (left + width) + " " + top;
            if (width > this.options.arrowSize) {
                path += " L" + (left + this.options.arrowSize) + " " + top + " L" + left + " " + (top + height / 2) + " L" + (left + this.options.arrowSize) + " " + (top + height) + " L" + (left + width) + " " + (top + height) + " Z";
            } else {
                path += " L" + left + " " + (top + height / 2) + " L" + (left + width) + " " + (top + height) + " Z";
            }
            return path;
        },
        calcXCoord: function(location) {
            var x = location[1];
            if (location[2] === "-") x = location[1] - location[3] + 1;
            return (x - this.options.start) / this.options.length * this.options.svgWidth;
        },
        calcYCoord: function(location, track) {
            return this.options.topMargin + this.options.trackMargin + this.options.trackMargin * track + this.options.trackThickness * track;
        },
        calcWidth: function(location) {
            return Math.floor((location[3] - 1) / this.options.length * this.options.svgWidth);
        },
        calcHeight: function(location) {
            return this.options.trackThickness;
        },
        isCenterFeature: function(feature) {
            return feature.feature_id === this.options.centerFeature;
        },
        isOperonFeature: function(feature) {
            return feature.isInOperon;
        },
        calcFillColor: function(feature) {
            if (feature.feature_id === this.options.centerFeature) return "#00F";
            if (feature.isInOperon === 1) return "#0F0";
            return "#F00";
        },
        highlight: function(element, feature) {
            this.recenter(feature);
            return;
        },
        recenter: function(feature) {
            centerFeature = feature.feature_id;
            if (this.options.onClickUrl) this.options.onClickUrl(feature.feature_id); else this.update(true);
        },
        resize: function() {
            var newWidth = Math.min(this.$elem.parent().width(), this.options.svgWidth);
            this.svg.attr("width", newWidth);
        },
        moveLeftEnd: function() {
            this.options.start = 0;
            this.update();
        },
        moveLeftStep: function() {
            this.options.start = Math.max(0, this.options.start - Math.ceil(this.options.length / 2));
            this.update();
        },
        zoomIn: function() {
            this.options.start = Math.min(this.contigLength - Math.ceil(this.options.length / 2), this.options.start + Math.ceil(this.options.length / 4));
            this.options.length = Math.max(1, Math.ceil(this.options.length / 2));
            this.update();
        },
        zoomOut: function() {
            this.options.length = Math.min(this.contigLength, this.options.length * 2);
            this.options.start = Math.max(0, this.options.start - Math.ceil(this.options.length / 4));
            if (this.options.start + this.options.length > this.contigLength) this.options.start = this.contigLength - this.options.length;
            this.update();
        },
        moveRightStep: function() {
            this.options.start = Math.min(this.options.start + Math.ceil(this.options.length / 2), this.contigLength - this.options.length);
            this.update();
        },
        moveRightEnd: function() {
            this.options.start = this.contigLength - this.options.length;
            this.update();
        },
        loading: function(doneLoading) {
            if (doneLoading) this.hideMessage(); else this.showMessage("<img src='" + this.options.loadingImage + "'/>");
        },
        showMessage: function(message) {
            var span = $("<span/>").append(message);
            this.$messagePane.append(span);
            this.$messagePane.removeClass("kbwidget-hide-message");
        },
        hideMessage: function() {
            this.$messagePane.addClass("kbwidget-hide-message");
            this.$messagePane.empty();
        },
        getData: function() {
            return {
                type: "Contig",
                id: this.options.contig,
                workspace: this.options.workspaceID
            };
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "KBaseContigBrowserButtons",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            direction: "horizontal",
            browser: null
        },
        init: function(options) {
            this._super(options);
            if (this.options.browser === null) {
                console.log("No browser exists for the button set!");
                return;
            }
            var self = this;
            var $buttonSet = $("<div/>").addClass("btn-group").append($("<button/>").attr("type", "button").addClass("btn btn-default").append("First").click(function() {
                self.options.browser.moveLeftEnd();
            })).append($("<button/>").attr("type", "button").addClass("btn btn-default").append("Previous").click(function() {
                self.options.browser.moveLeftStep();
            })).append($("<button/>").attr("type", "button").addClass("btn btn-default").append("Zoom In").click(function() {
                self.options.browser.zoomIn();
            })).append($("<button/>").attr("type", "button").addClass("btn btn-default").append("Zoom Out").click(function() {
                self.options.browser.zoomOut();
            })).append($("<button/>").attr("type", "button").addClass("btn btn-default").append("Next").click(function() {
                self.options.browser.moveRightStep();
            })).append($("<button/>").attr("type", "button").addClass("btn btn-default").append("Last").click(function() {
                self.options.browser.moveRightEnd();
            }));
            this.$elem.append($("<div align='center'/>").append($buttonSet));
            return this;
        },
        render: function() {
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "KBaseGeneInfo",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            featureID: null,
            embedInCard: false,
            auth: null,
            title: "Feature Info"
        },
        cdmiURL: "https://kbase.us/services/cdmi_api",
        workspaceURL: "https://kbase.us/services/workspace",
        init: function(options) {
            this._super(options);
            if (this.options.featureID === null) {
                return this;
            }
            this.cdmiClient = new CDMI_API(this.cdmiURL);
            this.entityClient = new CDMI_EntityAPI(this.cdmiURL);
            this.workspaceClient = new workspaceService(this.workspaceURL);
            this.options.title += " - " + this.options.featureID;
            return this.render();
        },
        render: function(options) {
            var self = this;
            this.$table = $("<table />").addClass("kbgo-table");
            this.entityClient.get_entity_Feature([ this.options.featureID ], [ "feature_type", "function", "alias" ], function(feature) {
                feature = feature[self.options.featureID];
                self.$table.append("<tr><td>ID</td><td>" + feature.id + "</td></tr>");
                self.$table.append("<tr><td>Function</td><td>" + (feature.function ? feature.function : "Unknown function") + "</td></tr>");
                if (feature.alias) {
                    self.$table.append("<tr><td>Alias</td><td>" + feature.alias + "</td></tr>");
                }
                self.cdmiClient.fids_to_feature_data([ feature.id ], function(featureData) {
                    featureData = featureData[self.options.featureID];
                    if (featureData.feature_publications && featureData.feature_publications.length > 0) {
                        var pubStr;
                        if (featureData.feature_publications.length === 1) pubStr = self.buildPublicationString(featureData.feature_publications[0]); else {
                            pubStr = "<ol>";
                            for (var i = 0; i < featureData.feature_publications.length; i++) {
                                pubStr += "<li>" + self.buildPublicationString(featureData.feature_publications[i]) + "</li>";
                            }
                            pubStr += "</ol>";
                        }
                        self.$table.append("<tr><td>Publications</td><td>" + pubStr + "</td></tr>");
                    }
                    self.$elem.append(self.$table);
                }, self.clientError);
            }, this.clientError);
            return this;
        },
        getData: function() {
            return {
                type: "Feature",
                id: this.options.featureID,
                workspace: this.options.workspaceID
            };
        },
        buildPublicationString: function(pub) {
            if (pub.length < 3) return ""; else return "<a href='" + pub[1] + "' target='_new'>" + pub[2] + "</a>";
        },
        clientError: function(error) {}
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "KBaseGeneInstanceInfo",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            featureID: null,
            workspaceID: null,
            auth: null,
            title: "Gene Instance"
        },
        cdmiURL: "https://kbase.us/services/cdmi_api",
        workspaceURL: "https://kbase.us/services/workspace",
        init: function(options) {
            this._super(options);
            if (this.options.featureID === null) {
                return this;
            }
            this.cdmiClient = new CDMI_API(this.cdmiURL);
            this.entityClient = new CDMI_EntityAPI(this.cdmiURL);
            this.workspaceClient = new workspaceService(this.workspaceURL);
            this.options.title += " - " + this.options.featureID;
            return this.render();
        },
        render: function(options) {
            var self = this;
            this.$table = $("<table />").addClass("kbgo-table");
            this.cdmiClient.fids_to_feature_data([ self.options.featureID ], function(featureData) {
                featureData = featureData[self.options.featureID];
                self.$table.append(self.makeRow("Function", featureData.feature_function));
                self.$table.append(self.makeRow("Length", featureData.feature_length + " bp"));
                self.$table.append(self.makeRow("Location", $("<div/>").append(self.parseLocation(featureData.feature_location)).append(self.makeContigButton(featureData.feature_location))));
                self.cdmiClient.fids_to_dna_sequences([ self.options.featureID ], function(dnaSeq) {
                    self.$table.append(self.makeRow("GC Content", self.calculateGCContent(dnaSeq[self.options.featureID]).toFixed(2) + "%"));
                    self.cdmiClient.fids_to_protein_families([ self.options.featureID ], function(families) {
                        families = families[self.options.featureID];
                        if (families) {
                            self.cdmiClient.protein_families_to_functions(families, function(families) {
                                var familyStr = "";
                                if (families && families.length != 0) {
                                    for (var fam in families) {
                                        if (families.hasOwnProperty(fam)) familyStr += fam + ": " + families[fam] + "<br/>";
                                    }
                                }
                                self.$table.append(self.makeRow("Protein Families", familyStr));
                            }, self.clientError);
                        } else {
                            self.$table.append(self.makeRow("Protein Families", "None found"));
                        }
                    }, self.clientError);
                }, self.clientError);
            }, this.clientError);
            this.$elem.append(this.$table);
            var $domainButton = $("<button/>").attr("type", "button").addClass("btn btn-default").append("Domains").on("click", function(event) {
                self.trigger("showDomains", {
                    event: event,
                    featureID: self.options.featureID
                });
            });
            var $operonButton = $("<button/>").attr("type", "button").addClass("btn btn-default").append("Operons").on("click", function(event) {
                self.trigger("showOperons", {
                    event: event,
                    featureID: self.options.featureID
                });
            });
            var $biochemButton = $("<button/>").attr("type", "button").addClass("btn btn-default").append("Biochemistry").on("click", function(event) {
                self.trigger("showBiochemistry", {
                    event: event,
                    featureID: self.options.featureID
                });
            });
            var $buttonGroup = $("<div/>").attr("align", "center").append($("<div/>").addClass("btn-group").append($domainButton).append($operonButton).append($biochemButton));
            this.$elem.append($buttonGroup);
            return this;
        },
        makeRow: function(name, value) {
            var $row = $("<tr/>").append($("<td />").append(name)).append($("<td />").append(value));
            return $row;
        },
        makeContigButton: function(loc) {
            if (loc === null || loc[0][0] === null) return "";
            var contigID = loc[0][0];
            var self = this;
            var $contigBtn = $("<button />").addClass("btn btn-default").append("Show Contig").on("click", function(event) {
                self.trigger("showContig", {
                    contig: contigID,
                    centerFeature: self.options.featureID,
                    event: event
                });
            });
            return $contigBtn;
        },
        calculateGCContent: function(s) {
            var gc = 0;
            s = s.toLowerCase();
            for (var i = 0; i < s.length; i++) {
                var c = s[i];
                if (c === "g" || c === "c") gc++;
            }
            return gc / s.length * 100;
        },
        parseLocation: function(loc) {
            if (loc.length === 0) return "Unknown";
            var locStr = "";
            for (var i = 0; i < loc.length; i++) {
                var start = Number(loc[i][1]);
                var length = Number(loc[i][3]);
                var end = 0;
                if (loc[i][2] === "+") end = start + length - 1; else end = start - length + 1;
                locStr += start + " to " + end + " (" + loc[i][2] + ")<br/>";
            }
            return locStr;
        },
        getData: function() {
            return {
                type: "Feature",
                id: this.options.featureID,
                workspace: this.options.workspaceID
            };
        },
        clientError: function(error) {}
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "KBaseGenomeCardManager",
        parent: "KBaseCardManager",
        version: "1.0.0",
        options: {
            template: null,
            data: {}
        },
        init: function(options) {
            this._super(options);
            var self = this;
            this.registerEvents();
            this.showInitialCards();
            return this;
        },
        showInitialCards: function() {
            if (this.options.template === "genome") this.showGenomeCards();
        },
        showGenomeCards: function() {
            this.addNewCard("KBaseGenomeOverview", {
                genomeID: this.options.data.genomeID,
                loadingImage: "../../widgets/images/ajax-loader.gif",
                isInCard: true
            }, {
                my: "left top",
                at: "left bottom",
                of: "#app"
            });
            this.addNewCard("KBaseWikiDescription", {
                genomeID: this.options.data.genomeID,
                loadingImage: "../../widgets/images/ajax-loader.gif"
            }, {
                my: "left top",
                at: "left+330 bottom",
                of: "#app"
            });
            return this;
        },
        registerEvents: function() {
            var self = this;
            this.registeredEvents = [ "featureClick", "showContig", "showDomains", "showOperons", "showBiochemistry" ];
            $(document).on("showDomains", function(event, data) {
                self.addNewCard("KBaseGeneDomains", {
                    featureID: data.featureID
                }, {
                    my: "left top",
                    at: "center",
                    of: data.event
                });
            });
            $(document).on("showOperons", function(event, data) {
                self.addNewCard("KBaseGeneOperon", {
                    featureID: data.featureID
                }, {
                    my: "left top",
                    at: "center",
                    of: data.event
                });
            });
            $(document).on("showBiochemistry", function(event, data) {
                self.addNewCard("KBaseGeneBiochemistry", {
                    featureID: data.featureID
                }, {
                    my: "left top",
                    at: "center",
                    of: data.event
                });
            });
            $(document).on("featureClick", function(event, data) {
                self.addNewCard("KBaseGeneInfo", {
                    featureID: data.feature.feature_id
                }, {
                    my: "left top",
                    at: "center",
                    of: data.featureElement
                });
                self.addNewCard("KBaseGeneInstanceInfo", {
                    featureID: data.feature.feature_id
                }, {
                    my: "left top",
                    at: "center",
                    of: data.featureElement
                });
            });
            $(document).on("showContig", function(event, data) {
                self.addNewCard("KBaseContigBrowser", {
                    contig: data.contig,
                    showButtons: true,
                    loadingImage: "../../widgets/images/ajax-loader.gif",
                    centerFeature: data.centerFeature
                }, {
                    my: "left top",
                    at: "center",
                    of: data.event
                });
            });
        },
        destroy: function() {
            this._super();
            for (var i = 0; i < this.registeredEvents.length; i++) {
                $(document).off(registeredEvents[i]);
            }
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "KBaseGenomeOverview",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            genomeID: null,
            workspace: null,
            loadingImage: "../../widgets/images/ajax-loader.gif",
            title: "Genome Overview",
            isInCard: false
        },
        cdmiURL: "https://kbase.us/services/cdmi_api",
        workspaceURL: "https://kbase.us/services/workspace",
        init: function(options) {
            this._super(options);
            if (this.options.genomeID === null) {
                return;
            }
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane").addClass("kbwidget-hide-message");
            this.$elem.append(this.$messagePane);
            this.cdmiClient = new CDMI_API(this.cdmiURL);
            this.entityClient = new CDMI_EntityAPI(this.cdmiURL);
            this.workspaceClient = new workspaceService(this.workspaceURL);
            return this.render();
        },
        render: function(options) {
            this.showMessage("<img src='" + this.options.loadingImage + "'/>");
            var self = this;
            this.entityClient.get_entity_Genome([ this.options.genomeID ], [ "id", "scientific_name", "domain", "complete", "dna_size", "source_id", "contigs", "gc_content", "pegs", "rnas" ], function(genome) {
                genome = genome[self.options.genomeID];
                self.genome = genome;
                var $infoTable = $("<div />").append($("<table/>").addClass("kbgo-table").append($("<tr/>").append("<td>ID</td><td>" + genome.id + "</td>")).append($("<tr/>").append("<td>Name</td><td>" + genome.scientific_name + "</td>")).append($("<tr/>").append("<td>Domain</td><td>" + genome.domain + "</td>")).append($("<tr/>").append("<td>Complete?</td><td>" + (genome.complete ? "Yes" : "No") + "</td>")).append($("<tr/>").append("<td>DNA Length</td><td>" + genome.dna_size + "</td>")).append($("<tr/>").append("<td>Source ID</td><td>" + genome.source_id + "</td>")).append($("<tr/>").append("<td>Number of Contigs</td><td>" + genome.contigs + "</td>")).append($("<tr/>").append("<td>GC Content</td><td>" + Number(genome.gc_content).toFixed(2) + " %" + "</td>")).append($("<tr/>").append("<td>Protein encoding genes</td><td>" + genome.pegs + "</td>")).append($("<tr/>").append("<td>RNAs</td><td>" + genome.rnas + "</td>")));
                self.$elem.append($infoTable);
                if (self.options.isInCard) {
                    self.cdmiClient.genomes_to_contigs([ self.options.genomeID ], function(contigs) {
                        self.cdmiClient.contigs_to_lengths(contigs[self.options.genomeID], function(contigsToLengths) {
                            var $dropdown = $("<select />");
                            for (var contig in contigsToLengths) {
                                $dropdown.append("<option id='" + contig + "'>" + contig + " - " + contigsToLengths[contig] + " bp</option>");
                            }
                            self.$elem.append($dropdown);
                            self.$elem.append($("<button class='btn btn-default'>Show Contig</button>").on("click", function(event) {
                                $(self.$elem.selector + " > select option:selected").each(function() {
                                    self.trigger("showContig", {
                                        contig: $(this).attr("id"),
                                        event: event
                                    });
                                });
                            }));
                        }, self.rpcError);
                    }, self.rpcError);
                }
            }, self.rpcError);
            this.hideMessage();
            return this;
        },
        getData: function() {
            return {
                type: "Genome",
                id: this.options.genomeID,
                workspace: this.options.workspaceID
            };
        },
        showMessage: function(message) {
            var span = $("<span/>").append(message);
            this.$messagePane.append(span);
            this.$messagePane.removeClass("kbwidget-hide-message");
        },
        hideMessage: function() {
            this.$messagePane.addClass("kbwidget-hide-message");
            this.$messagePane.empty();
        },
        rpcError: function(error) {
            console.log("An error occurred: " + error);
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "KBaseWikiDescription",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            genomeID: null,
            workspaceID: null,
            title: "Description",
            maxNumChars: 500,
            width: 500,
            loadingImage: null
        },
        wikiScraperURL: "http://140.221.85.80:7051",
        cdmiURL: "https://kbase.us/services/cdmi_api",
        workspaceURL: "https://kbase.us/services/workspace",
        init: function(options) {
            this._super(options);
            if (this.options.featureID === null) {
                return this;
            }
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane").addClass("kbwidget-hide-message");
            this.$elem.append(this.$messagePane);
            this.cdmiClient = new CDMI_API(this.cdmiURL);
            this.entityClient = new CDMI_EntityAPI(this.cdmiURL);
            this.workspaceClient = new workspaceService(this.workspaceURL);
            this.wikiClient = new WikiScraper(this.wikiScraperURL);
            this.options.title += " - " + this.options.genomeID;
            return this.render();
        },
        render: function(options) {
            this.showMessage("<img src='" + this.options.loadingImage + "'/>");
            var self = this;
            if (this.options.genomeID === null) {
                return;
            }
            this.cdmiClient.genomes_to_taxonomies([ this.options.genomeID ], function(taxonomy) {
                taxonomy = taxonomy[self.options.genomeID];
                var searchTerms = [];
                var strainName = taxonomy.pop();
                searchTerms.push(strainName);
                var tokens = strainName.split(" ");
                if (tokens.length > 2) ;
                searchTerms.push(tokens[0] + " " + tokens[1]);
                searchTerms.concat(taxonomy.reverse());
                self.wikiClient.scrape_first_hit(searchTerms, {
                    endpoint: "dbpedia.org"
                }, function(desc) {
                    if (desc.hasOwnProperty("description") && desc.description != null) {
                        if (desc.description.length > self.options.maxNumChars) {
                            desc.description = desc.description.substr(0, self.options.maxNumChars);
                            var lastBlank = desc.description.lastIndexOf(" ");
                            desc.description = desc.description.substr(0, lastBlank) + "...";
                        }
                        var descStr = "<p style='text-align:justify;'>" + desc.description + "</p>";
                        var descHtml;
                        if (desc.term === strainName || strainName === desc.redirect_from) {
                            descHtml = descStr + self.descFooter(desc.wiki_uri);
                        } else {
                            descHtml = self.notFoundHeader(strainName, desc.term) + descStr + self.descFooter(desc.wiki_uri);
                        }
                        var imageHtml = "Unable to find an image. If you have one, you might consider <a href='" + desc.wiki_uri + "' target='_new'>adding it to Wikipedia</a>.";
                        if (desc.image_uri != null) imageHtml = "<img src='" + desc.image_uri + "' />";
                        var descId = self.uid();
                        var imageId = self.uid();
                        var $contentDiv = $("<div />").addClass("tab-content").append($("<div />").attr("id", descId).addClass("tab-pane fade active in").append(descHtml)).append($("<div />").attr("id", imageId).addClass("tab-pane fade").append(imageHtml));
                        var $descTab = $("<a />").attr("href", "#" + descId).attr("data-toggle", "tab").append("Description");
                        var $imageTab = $("<a />").attr("href", "#" + imageId).attr("data-toggle", "tab").append("Image");
                        var $tabSet = $("<ul />").addClass("nav nav-tabs").append($("<li />").addClass("active").append($descTab)).append($("<li />").append($imageTab));
                        self.$elem.append($tabSet).append($contentDiv);
                        self.hideMessage();
                    }
                }, self.clientError);
            }, this.clientError);
            return this;
        },
        uid: function() {
            var id = "";
            for (var i = 0; i < 32; i++) id += Math.floor(Math.random() * 16).toString(16).toUpperCase();
            return id;
        },
        descFooter: function(wikiUri) {
            return "<p>[<a href='" + wikiUri + "'' target='_new'>more at Wikipedia</a>]</p>";
        },
        notFoundHeader: function(strainName, term) {
            var underscoredName = strainName.replace(/\s+/g, "_");
            var str = "<p><b><i>" + strainName + "</i> not found. You can start a new page for this genome on <a href='http://en.wikipedia.org/wiki/" + underscoredName + "' target='_new'>Wikipedia</a>.</b></p>";
            if (term) {
                str += "<p><b>Showing description for <i>" + term + "</i></b></p>";
            }
            return str;
        },
        showMessage: function(message) {
            var span = $("<span/>").append(message);
            this.$messagePane.append(span);
            this.$messagePane.removeClass("kbwidget-hide-message");
        },
        hideMessage: function() {
            this.$messagePane.addClass("kbwidget-hide-message");
            this.$messagePane.empty();
        },
        getData: function() {
            return {
                type: "Description",
                id: this.options.genomeID,
                workspace: this.options.workspaceID
            };
        },
        clientError: function(error) {
            console.debug(error);
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseMediaEditor",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var token = options.auth;
            var media = options.id;
            var ws = options.ws;
            var fba = new fbaModelServices("http://140.221.85.73:4043");
            var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
            var panel = self.$elem.kbasePanel({
                title: "Media Info",
                subText: media
            });
            var container = panel.body();
            container.append('<p class="muted loader-rxn">                 <img src="assets/img/ajax-loader.gif"> loading...</p>');
            var mediaAJAX = fba.get_media({
                medias: [ media ],
                workspaces: [ ws ]
            });
            $.when(mediaAJAX).done(function(data) {
                media = data[0];
                media_view(container, media);
            });
            function media_view(container, data) {
                $(".loader-rxn").remove();
                container.append("<b>Name: </b>" + data.id + " <b>pH: </b>" + data.pH + '<button class="btn btn-default pull-right edit-media">Edit</button><br><br>');
                var table = $('<table class="table table-striped table-bordered">');
                table.append("<tr><th>Compound</th><th>Concentration</th><th>min_flux</th><th>max_flux</th></tr>");
                for (var i in data.media_compounds) {
                    table.append("<tr><td>" + data.media_compounds[i].name + "</td>                    <td>" + data.media_compounds[i].concentration + "</td>                    <td>" + data.media_compounds[i].min_flux + "</td>                    <td>" + data.media_compounds[i].max_flux + "</td></tr>");
                }
                container.append(table);
                $(".edit-media").click(function() {
                    container.html("");
                    media_view_editable(container, data);
                });
            }
            function media_view_editable(container, data) {
                $(".loader-rxn").remove();
                container.append("<b>Name: </b>" + data.id + " <b>pH: </b>" + data.pH + '<button class="btn btn-default pull-right cancel-edit-media">Cancel</button><br><br>');
                var table = $('<table class="table table-striped table-bordered">');
                table.append("<tr><th>Compound</th><th>Concentration</th><th>min_flux</th><th>max_flux</th><th>Delete/Add</th></tr>");
                for (var i in data.media_compounds) {
                    table.append('<tr><td><input id="cmpds' + i + '" class="form-control" value=' + data.media_compounds[i].name + '></input></td>                    <td><input id="conc' + i + '" class="form-control" value=' + data.media_compounds[i].concentration + '></input></td>                    <td><input id="minflux' + i + '" class="form-control" value=' + data.media_compounds[i].min_flux + '></input></td>                    <td><input id="maxflux' + i + '" class="form-control" value=' + data.media_compounds[i].max_flux + '></input></td>                    <td><button id="del' + i + '" onclick="$(this).closest(&#39;tr&#39).remove()" class="form-control"><span class="glyphicon glyphicon-trash"></span></button></tr>');
                }
                table.append('<tr><td><input id="addCmpds" class="form-control" placeholder="add Compound"></input></td>                    <td><input id="addConc" class="form-control" placeholder="add Concentration"></input></td>                    <td><input id="addMinflux" class="form-control" placeholder="add Minflux"></input></td>                    <td><input id="addMaxflux" class="form-control" placeholder="add Maxflux"></input></td>                    <td><button id="addRow" class="form-control"><span class="glyphicon glyphicon-plus"></span></button></tr>');
                container.append(table);
                $("#addRow").click(function(e) {
                    e.preventDefault();
                    var newCmpd = $("#addCmpds").val();
                    var newConc = $("#addConc").val();
                    var newMinflux = $("#addMinflux").val();
                    var newMaxflux = $("#addMaxflux").val();
                    var last = $("[id^=cmpds]").length;
                    var rowToAdd = '<tr><td><input id="cmpds' + last + '" class="form-control" value="' + newCmpd + '"></input></td>                        <td><input id="conc' + last + '" class="form-control" value="' + newConc + '"></input></td>                        <td><input id="minflux' + last + '" class="form-control" value="' + newMinflux + '"></input></td>                        <td><input id="maxflux' + last + '" class="form-control" value="' + newMaxflux + '"></input></td>                        <td><button id="del' + last + '" onclick="$(this).closest(&#39;tr&#39).remove()" class="form-control"><span class="glyphicon glyphicon-trash"></span></button></tr>';
                    table.append(rowToAdd);
                    var row = $(this).closest("tr");
                    row.next().after(row);
                });
                container.append('<a class="btn btn-primary save-to-ws-btn">Save to a workspace -></a>');
                events();
                $(".cancel-edit-media").click(function() {
                    container.html("");
                    media_view(container, data);
                });
            }
            function events() {
                $(".save-to-ws-btn").unbind("click");
                $(".save-to-ws-btn").click(function() {
                    var cmpds = $("[id^=cmpds]");
                    var conc = $("[id^=conc]");
                    var minflux = $("[id^=minflux]");
                    var maxflux = $("[id^=maxflux]");
                    var newmedia = {
                        media: "testSave",
                        workspace: "jko",
                        name: "testSave",
                        isDefined: 0,
                        isMinimal: 0,
                        type: "unknown",
                        compounds: [ cmpds ],
                        concentrations: [ conc ],
                        maxflux: [ minflux ],
                        minflux: [ maxflux ]
                    };
                    self.trigger("saveToWSClick", newmedia);
                });
            }
            function get_genome_id(ws_id) {
                var pos = ws_id.indexOf(".");
                var ws_id = ws_id.slice(0, ws_id.indexOf(".", pos + 1));
                return ws_id;
            }
            $("#rxn-tabs a").click(function(e) {
                e.preventDefault();
                $(this).tab("show");
            });
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseSeqSearch",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var cdmi = new CDMI_EntityAPI("http://kbase.us/services/cdmi_api/");
            var s_search = new seq_search("http://140.221.85.75:7080/");
            var init_data = {
                fnDrawCallback: events,
                sPaginationType: "full_numbers",
                iDisplayLength: 10,
                aaData: [],
                bScrollInfinite: true,
                bScrollCollapse: true,
                sScrollY: "200px",
                aoColumns: [ {
                    sTitle: "Genome"
                }, {
                    sTitle: "KBid"
                } ],
                oLanguage: {
                    sSearch: "",
                    sInfo: "Loaded _END_ of _TOTAL_ genomes"
                },
                fnInitComplete: function() {
                    var table_header, _this = this;
                    table_header = $(".dataTables_scrollHeadInner").css("position", "relative");
                    $("body.admin.selections_index").find(".dataTables_scrollBody").bind("jsp-scroll-x", function(event, scrollPositionX, isAtLeft, isAtRight) {
                        table_header.css("right", scrollPositionX);
                    }).jScrollPane();
                }
            };
            var select_table;
            function load_select_table() {
                $(".target-gnomes").show();
                if (select_table == undefined) {
                    $(".target-genome-tbl").append('<p class="muted s-loader">                          <img src="assets/img/ajax-loader.gif"></img> loading...</p>');
                    var gnome_AJAX = cdmi.all_entities_Genome(0, 1e4, [ "scientific_name" ]);
                    $.when(gnome_AJAX).done(function(data) {
                        $(".target-genomes").show();
                        var t_data = [];
                        for (var key in data) {
                            t_data.push([ data[key].scientific_name, key ]);
                        }
                        init_data.aaData = t_data;
                        select_table = $(".genome-selection").dataTable(init_data);
                        $(".dataTables_filter input").attr("placeholder", "Type a genome");
                        events();
                        $(".s-loader").remove();
                    });
                }
            }
            $(".target-db").change(function() {
                if ($(this).val() == "Select KBase Genomes") {
                    load_select_table();
                } else {
                    $(".target-gnomes").hide();
                }
            });
            var active_list = [];
            function events() {
                $(".genome-selection tr").unbind("click");
                $(".genome-selection tr").click(function() {
                    var td = $(this).children("td");
                    if (td.hasClass("row-selected")) {
                        td.removeClass("row-selected");
                    } else {
                        td.addClass("row-selected");
                    }
                    var col1 = td.first().text();
                    var col2 = td.eq(1).text();
                    var found, pos;
                    for (var i in active_list) {
                        if (active_list[i][0] == col1) {
                            found = true;
                            pos = i;
                        }
                    }
                    if (found) {
                        if (active_list.length == 1) {
                            active_list = [];
                        } else {
                            console.log(active_list.splice(pos, pos));
                        }
                    } else {
                        active_list.push([ col1, col2 ]);
                    }
                    update_selected(active_list);
                });
            }
            function update_selected(active_list) {
                var d = $(".selected-genomes");
                d.html("");
                if (d.children().length == 0) {
                    d.append("<h5>Selected Genomes:</h5>");
                }
                for (var i in active_list) {
                    d.append('<div><span class="badge badge-important selected-genome">' + active_list[i][0] + ' <a href="*">                            <i class="icon-remove"></i></a></span></div>');
                }
                $(".selected-genomes").html(d.html());
            }
            var init_results = {
                sPaginationType: "full_numbers",
                iDisplayLength: 10,
                aoColumns: [ {
                    mData: "e_value",
                    sTitle: "e_value"
                }, {
                    mData: "genome",
                    sTitle: "genome"
                }, {
                    mData: "feature",
                    sTitle: "feature"
                }, {
                    mData: "feature_end",
                    sTitle: "feature_end"
                }, {
                    mData: "feature_length",
                    sTitle: "feature_length"
                }, {
                    mData: "feature_start",
                    sTitle: "feature_start"
                }, {
                    mData: "query_end",
                    sTitle: "query_end"
                }, {
                    mData: "query_length",
                    sTitle: "query_length"
                }, {
                    mData: "query_start",
                    sTitle: "query_start"
                }, {
                    mData: "strand",
                    sTitle: "strand"
                } ],
                oLanguage: {
                    sSearch: ""
                },
                bLengthChange: false,
                bPaginate: false
            };
            $(".submit-btn").click(function() {
                var seq = $(".seq-input").val();
                var genome_ids = [];
                for (var i in active_list) {
                    genome_ids.push(active_list[i][1]);
                }
                if (results_tbl !== undefined) results_tbl.fnDestroy();
                $(".results-container").html("");
                $(".results-container").append('<table class="results-tbl table-striped table-bordered"></table>');
                $(".results-container").append('<p class="muted results-loader">                      <img src="assets/img/ajax-loader.gif"></img> loading...</p>');
                console.log(genome_ids);
                if (genome_ids.length > 0) {
                    var seq_AJAX = s_search.blast_one_sequence_against_a_genome(seq, genome_ids);
                } else {
                    var seq_AJAX = s_search.blast_one_sequence_against_a_genome(seq, [ "NR" ]);
                }
                $.when(seq_AJAX).done(function(data) {
                    disp_results(data);
                    $(".group-item-expander").prepend('<span class="caret"></span>');
                    $(".results-loader").remove();
                });
            });
            var results_tbl;
            function disp_results(data) {
                if (results_tbl == undefined) {
                    results_tbl = $(".results-tbl").dataTable(init_results).rowGrouping({
                        iGroupingColumnIndex: 1,
                        sGroupBy: "name",
                        bExpandableGrouping: true,
                        asExpandedGroups: []
                    });
                    for (var i in data[0]) {
                        var row = data[0][i];
                        row["genome"] = get_model_id(row.feature);
                    }
                    results_tbl.fnAddData(data[0]);
                } else {
                    results_tbl = undefined;
                    results_tbl = $(".results-tbl").dataTable(init_results).rowGrouping({
                        iGroupingColumnIndex: 1,
                        sGroupBy: "name",
                        bExpandableGrouping: true,
                        asExpandedGroups: []
                    });
                    for (var i in data[0]) {
                        var row = data[0][i];
                        row["genome"] = get_model_id(row.feature);
                    }
                    results_tbl.fnAddData(data[0]);
                }
            }
            function get_model_id(ws_id) {
                var pos = ws_id.indexOf(".");
                var ws_id = ws_id.slice(0, ws_id.indexOf(".", pos + 1));
                return ws_id;
            }
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseModelCore",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var models = options.ids;
            var workspaces = options.workspaces;
            var token = options.auth;
            var panel = this.$elem.kbasePanel({
                title: "Model Info",
                rightLabel: workspaces[0],
                subText: models[0],
                body: '<div id="core-model"></div>'
            });
            panel.loading();
            var panel_body = panel.body();
            var fba = new fbaModelServices("https://kbase.us/services/fba_model_services/");
            var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
            var flux_threshold = .001;
            var heat_colors = [ "#731d1d", "#8a2424", "#b35050", "#d05060", "#f28e8e" ];
            var neg_heat_colors = [ "#4f4f04", "#7c7c07", "#8b8d08", "#acc474", "#dded00" ];
            var gapfill_color = "#f000ff";
            var gene_stroke = "#777";
            var g_present_color = "#8bc7e5";
            var grid = 50;
            var r_width = grid * (4 / 5);
            var r_height = grid * (1 / 5);
            var radius = 5;
            load_core_model(models);
            function load_core_model(kbids) {
                draw_core_model(kbids);
            }
            function draw_core_model(kbids) {
                var graph_AJAX = $.getJSON("assets/data/core.json");
                var modelAJAX = fba.get_models({
                    models: models,
                    workspaces: workspaces,
                    auth: token
                });
                $.when(graph_AJAX, modelAJAX).done(function(core_data, models_data) {
                    var core = join_model_to_core(core_data[0], models_data, kbids);
                    var stage = core_model(core, true);
                    panel.rmLoading();
                });
            }
            function join_model_to_core(core, models, kbids, fba_data) {
                var org_names = [];
                for (var i in models) {
                    org_names.push(models[i].name);
                }
                for (var i in core) {
                    var obj = core[i];
                    obj["kbids"] = {};
                    for (var j in kbids) {
                        kbid = kbids[j];
                        var kb_gid = get_genome_id(kbid);
                        obj.kbids[kb_gid] = [];
                    }
                }
                for (var n in models) {
                    var model = models[n];
                    rxn_list = model.reactions;
                    var model_fba = [];
                    for (var k in fba_data) {
                        if (get_genome_id(fba_data[k].id) == get_genome_id(model.id)) {
                            model_fba = fba_data[k];
                        }
                    }
                    for (var i in rxn_list) {
                        var rxn_obj = rxn_list[i];
                        var rxn_id = rxn_obj.reaction;
                        var data = find_shape_by_rxn(core, rxn_id);
                        if (!data) continue;
                        for (var j in data) {
                            obj = data[j];
                            var dict = $.extend({}, rxn_obj);
                            dict.reaction_id = rxn_id;
                            dict.gene_present = true;
                            dict.org_name = org_names[n];
                            for (var z in model_fba.reactionFluxes) {
                                var rxn_flux = model_fba.reactionFluxes[z];
                                if (rxn_flux[0].slice(0, rxn_flux[0].indexOf("_")) == rxn_id) {
                                    dict.flux = parseFloat(rxn_flux[1]);
                                }
                            }
                            obj.kbids[get_genome_id(model.id)].push(dict);
                        }
                    }
                }
                return core;
            }
            function find_shape_by_rxn(core, rxn_id) {
                var objs = [];
                for (var k in core) {
                    var obj = core[k];
                    var core_rxns = obj.rxns;
                    if (core_rxns) {
                        for (var j in core_rxns) {
                            var core_rxn = core_rxns[j];
                            if (core_rxn == rxn_id) {
                                objs.push(obj);
                            }
                        }
                    }
                }
                if (objs.length > 0) {
                    return objs;
                }
            }
            function core_model(data, show_flux) {
                var stage = Raphael("core-model", 1e3, 1500);
                for (var i in data) {
                    var obj = data[i];
                    var x = (obj.x - 2) * grid;
                    var y = (obj.y - 2) * grid;
                    if (obj.shape == "rect") {
                        var rect = stage.core_rect(obj, x, y, r_width, r_height, show_flux);
                    } else if (obj.shape == "circ") {
                        var circle = stage.circle(x + r_width / 2, y + r_height / 2, radius);
                        if (obj.textPos) {
                            if (obj.textPos == "left") {
                                var text = stage.text(x, y + r_height / 2, obj.text);
                                var offset = -1 * text.getBBox().width / 2 + (radius + 3);
                                text.translate(offset, 0);
                            } else if (obj.textPos == "above") {
                                var text = stage.text(x, y - r_height / 2, obj.text);
                            } else if (obj.textPos == "below") {
                                var text = stage.text(x, y + r_height / 2 + r_height, obj.text);
                            }
                        } else {
                            var text = stage.text(x + r_width / 2, y + r_height / 2, obj.text);
                            var offset = text.getBBox().width / 2 + radius + 3;
                            text.translate(offset, 0);
                        }
                    }
                }
                for (var i = 0; i < data.length; i++) {
                    var obj = data[i];
                    if (obj.shape != "circ") continue;
                    var conns = obj.connects;
                    if (!conns) continue;
                    if (conns instanceof Array) {
                        for (var j = 0; j < conns.length; j++) {
                            var conn_id = conns[j];
                            for (var k = 0; k < data.length; k++) {
                                var link_obj = data[k];
                                if (link_obj.id == conn_id) {
                                    stage.draw_arrow(obj, link_obj);
                                }
                            }
                        }
                    } else if (conns instanceof Object) {
                        for (var key in conns) {
                            if (key == "curve") {
                                stage.draw_curve(obj);
                            }
                            if (key == "dashed") {
                                for (var j = 0; j < conns.dashed.length; j++) {
                                    var conn_id = conns.dashed[j];
                                    for (var k = 0; k < data.length; k++) {
                                        var link_obj = data[k];
                                        if (link_obj.id == conn_id) {
                                            stage.draw_arrow(obj, link_obj, "--");
                                        }
                                    }
                                }
                            }
                            if (key == "conns") {
                                for (var j = 0; j < conns.conns.length; j++) {
                                    var conn_id = conns.conns[j];
                                    for (var k = 0; k < data.length; k++) {
                                        var link_obj = data[k];
                                        if (link_obj.id == conn_id) {
                                            stage.draw_arrow(obj, link_obj);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                $(".model-rxn").unbind("click");
                $(".model-rxn").click(function(event) {
                    var rxns = $(this).data("rxns").split(",");
                    self.trigger("rxnClick", {
                        rxns: rxns
                    });
                });
                return stage;
            }
            Raphael.fn.core_rect = function(obj, x, y, r_width, r_height, show_flux) {
                var orgs = obj.kbids;
                var org_count = 0;
                for (var i in orgs) {
                    org_count++;
                }
                var offset = r_width / org_count;
                if (orgs) {
                    var i = 0;
                    for (var kbid in orgs) {
                        var rect = this.rect(x + i * offset, y, offset, r_height);
                        rect.node.setAttribute("class", "model-rxn");
                        rect.node.setAttribute("data-rxns", obj.rxns.join(","));
                        var rxn_list = orgs[kbid];
                        var has_flux = false;
                        var flux = 0;
                        var gene_present = false;
                        var tip = "";
                        for (var j in rxn_list) {
                            var rxn_obj = rxn_list[j];
                            if (rxn_obj.gene_present == true) var gene_present = true;
                            flux += rxn_obj.flux;
                            tip += core_tooltip(rxn_obj, rxn_obj.flux);
                        }
                        if (Math.abs(flux) > flux_threshold) var has_flux = true;
                        if (orgs[kbid][0]) var org_name = orgs[kbid][0].org_name; else var org_name = "";
                        $(rect.node).popover({
                            content: tip,
                            title: org_name,
                            trigger: "hover",
                            html: true,
                            container: "body",
                            placement: "bottom"
                        });
                        if (has_flux && show_flux) {
                            if (!rxn_list[0]) continue;
                            if (Math.abs(flux) >= 100) {
                                var color = heat_colors[0];
                            } else if (Math.abs(flux) >= 50) {
                                var color = heat_colors[1];
                            } else if (Math.abs(flux) >= 10) {
                                var color = heat_colors[2];
                            } else if (Math.abs(flux) >= 5) {
                                var color = heat_colors[3];
                            } else {
                                var color = heat_colors[4];
                            }
                            rect.attr({
                                fill: color
                            });
                        } else if (gene_present) {
                            rect.attr({
                                fill: g_present_color
                            });
                        } else {
                            rect.attr({
                                fill: "white",
                                "stroke-width": .5
                            });
                        }
                        rect.data("rxns", obj.rxns);
                        i++;
                    }
                }
            };
            function core_tooltip(rxn_obj, flux_val) {
                var tip = "";
                tip += "<b>Rxn:</b> " + rxn_obj.reaction + "<br>";
                tip += "<b>Eq:</b> " + rxn_obj.definition + "<br>";
                tip += "<b>Flux Value:</b> " + flux_val + "<br><br>";
                return tip;
            }
            Raphael.fn.draw_curve = function(obj) {
                var xys = obj.connects.curve.path;
                if (obj.pathPos == "below") {
                    var x1 = (xys[0][0] - 2) * grid + r_width / 2;
                    var y1 = (xys[0][1] - 2) * grid + radius * 3;
                    var x2 = (xys[1][0] - 2) * grid + r_width / 2;
                    var y2 = (xys[1][1] - 2) * grid + r_width / 2;
                    var x3 = (xys[2][0] - 2) * grid + r_width / 2;
                    var y3 = (xys[2][1] - 2) * grid + radius * 3;
                } else if (obj.pathPos == "above") {
                    var x1 = (xys[0][0] - 2) * grid + r_width / 2;
                    var y1 = (xys[0][1] - 2) * grid - radius;
                    var x2 = (xys[1][0] - 2) * grid + r_width / 2;
                    var y2 = (xys[1][1] - 2) * grid;
                    var x3 = (xys[2][0] - 2) * grid + r_width / 2;
                    var y3 = (xys[2][1] - 2) * grid - radius;
                }
                var path = this.path("M" + x1 + "," + y1 + "C" + x1 + "," + y2 + " " + x3 + "," + y2 + " " + x3 + "," + y3);
                path.toBack();
                return path;
            };
            Raphael.fn.draw_curved_arrow = function(obj) {
                var xys = obj.connects.curve.path;
                if (obj.pathPos == "below") {
                    var x1 = xys[0][0] * grid - 2 + r_width / 2;
                    var y1 = xys[0][1] * grid - 2 + radius * 3;
                    var x2 = xys[1][0] * grid - 2 + r_width / 2;
                    var y2 = xys[1][1] * grid - 2 + r_width / 2;
                    var x3 = xys[2][0] * grid - 2 + r_width / 2;
                    var y3 = xys[2][1] * grid - 2 + radius * 3;
                } else if (obj.pathPos == "above") {
                    var x1 = (xys[0][0] - 2) * grid + r_width / 2;
                    var y1 = (xys[0][1] - 2) * grid - radius;
                    var x2 = (xys[1][0] - 2) * grid + r_width / 2;
                    var y2 = (xys[1][1] - 2) * grid;
                    var x3 = (xys[2][0] - 2) * grid + r_width / 2;
                    var y3 = (xys[2][1] - 2) * grid - radius;
                }
                var angle = Math.atan2(x1 - x2, y2 - y1);
                angle = angle / (2 * Math.PI) * 360;
                var arrowPath = this.path("M" + x2 + " " + y2 + " L" + (x2 - size) + " " + (y2 - size) + " L" + (x2 - size) + " " + (y2 + size) + " L" + x2 + " " + y2).rotate(90 + angle, x2, y2);
                var linePath = this.path("M" + x1 + " " + y1 + " L" + x2 + " " + y2);
                linePath.attr({
                    stroke: "#444",
                    "stroke-dasharray": style
                });
                arrowPath.attr({
                    stroke: "#444",
                    fill: "#666",
                    "stroke-dasharray": style
                });
                linePath.data("type", "path");
                arrowPath.data("type", "path");
                linePath.toBack();
                arrowPath.toBack();
                return this.path("M" + x1 + "," + y1 + "C" + x1 + "," + y2 + " " + x3 + "," + y2 + " " + x3 + "," + y3);
            };
            Raphael.fn.draw_arrow = function(obj, link_obj, dashed) {
                if (link_obj.y < obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2;
                    var y1 = (obj.y - 2) * grid + r_height / 2 - 10;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2 + 10;
                } else if (link_obj.y > obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2;
                    var y1 = (obj.y - 2) * grid + r_height / 2 + 10;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2 - 10;
                }
                if (link_obj.x < obj.x && link_obj.y > obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2 - 10;
                    var y1 = (obj.y - 2) * grid + r_height / 2 + 10;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2 + 10;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2 - 10;
                } else if (link_obj.x < obj.x && link_obj.y < obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2 - 10;
                    var y1 = (obj.y - 2) * grid + r_height / 2 - 10;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2 + 10;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2 + 10;
                } else if (link_obj.x > obj.x && link_obj.y > obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2 + 10;
                    var y1 = (obj.y - 2) * grid + r_height / 2 + 10;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2 - 10;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2 - 10;
                } else if (link_obj.x > obj.x && link_obj.y < obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2 + 10;
                    var y1 = (obj.y - 2) * grid + r_height / 2 - 10;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2 - 10;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2 + 10;
                } else if (link_obj.x < obj.x && link_obj.y == obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2 - 10;
                    var y1 = (obj.y - 2) * grid + r_height / 2;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2 + 10;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2;
                } else if (link_obj.x > obj.x && link_obj.y == obj.y) {
                    var x1 = (obj.x - 2) * grid + r_width / 2 + 10;
                    var y1 = (obj.y - 2) * grid + r_height / 2;
                    var x2 = (link_obj.x - 2) * grid + r_width / 2 - 10;
                    var y2 = (link_obj.y - 2) * grid + r_height / 2;
                }
                if (dashed) {
                    return this.arrow(x1, y1, x2, y2, 4, dashed);
                } else {
                    return this.arrow(x1, y1, x2, y2, 4);
                }
            };
            Raphael.fn.arrow = function(x1, y1, x2, y2, size, style) {
                var angle = Math.atan2(x1 - x2, y2 - y1);
                angle = angle / (2 * Math.PI) * 360;
                var arrowPath = this.path("M" + x2 + " " + y2 + " L" + (x2 - size) + " " + (y2 - size) + " L" + (x2 - size) + " " + (y2 + size) + " L" + x2 + " " + y2).rotate(90 + angle, x2, y2);
                var linePath = this.path("M" + x1 + " " + y1 + " L" + x2 + " " + y2);
                linePath.attr({
                    stroke: "#444",
                    "stroke-dasharray": style
                });
                arrowPath.attr({
                    stroke: "#444",
                    fill: "#666",
                    "stroke-dasharray": style
                });
                linePath.data("type", "path");
                arrowPath.data("type", "path");
                linePath.toBack();
                arrowPath.toBack();
                return linePath;
            };
            function get_genome_id(ws_id) {
                var pos = ws_id.indexOf(".");
                var ws_id = ws_id.slice(0, ws_id.indexOf(".", pos + 1));
                return ws_id;
            }
            return self;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseModelMeta",
        version: "1.0.0",
        options: {},
        init: function(options) {
            var self = this;
            this._super(options);
            var models = options.ids;
            var workspaces = options.workspaces;
            var token = options.auth;
            var panel = this.$elem.kbasePanel({
                title: "Model Info",
                rightLabel: workspaces[0],
                subText: models[0]
            });
            panel.loading();
            var panel_body = panel.body();
            var fba = new fbaModelServices("https://kbase.us/services/fba_model_services/");
            var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
            var meta_AJAX = kbws.get_objectmeta({
                type: "Model",
                workspace: workspaces[0],
                id: models[0]
            });
            $.when(meta_AJAX).done(function(data) {
                console.log(data);
                var labels = [ "ID", "Type", "Moddate", "Instance", "Command", "Last Modifier", "Owner", "Workspace", "Ref" ];
                var table = $('<table class="table table-striped table-bordered"                                   style="margin-left: auto; margin-right: auto;"></table>');
                for (var i = 0; i < data.length - 2; i++) {
                    table.append("<tr><td>" + labels[i] + "</td>                               <td>" + data[i] + "</td></tr>");
                }
                panel.rmLoading();
                panel_body.append(table);
            });
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseModelOpts",
        version: "1.0.0",
        options: {},
        init: function(options) {
            var self = this;
            this._super(options);
            var id = options.id;
            var ws = options.workspace;
            var token = options.auth;
            var panel = this.$elem.kbasePanel({
                title: "Model Options",
                rightLabel: ws,
                subText: id
            });
            var panel_body = panel.body();
            panel_body.append('<a class="app-icon" href="http://140.221.84.128/#models?tab=model-selection&kbids=' + id + "&ws=" + ws + '" target="_blank">                        <img src="http://www.kbase.us/files/6313/6148/9465/model_icon.png" width=30 >                    </a>                    <a href="http://140.221.84.128/#models?tab=model-selection&kbids=' + id + "&ws=" + ws + '" target="_blank">Add to Model Viewer</a>');
            panel_body.append("<br><br>");
            panel_body.append('<a href="#/run-fba/' + ws + "/" + id + '">Run FBA</a> <span class="glyphicon glyphicon-arrow-right"></span>');
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseModelTable",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var token = options.auth;
            var ws = options.ws;
            var panel = this.$elem.kbasePanel({
                title: "Model Info",
                rightLabel: ws
            });
            panel.loading();
            var panel_body = panel.body();
            var fba = new fbaModelServices("https://kbase.us/services/fba_model_services/");
            var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
            var tableSettings = {
                fnDrawCallback: modelEvents,
                sPaginationType: "full_numbers",
                iDisplayLength: 20,
                aaData: [],
                oLanguage: {
                    sSearch: "Search all:"
                }
            };
            var wsAJAX = kbws.list_workspace_objects({
                workspace: ws,
                type: "Model",
                auth: token
            });
            panel_body.append('<p class="muted loader-table">                                   <img src="assets/img/ajax-loader.gif"> loading...</p>');
            $.when(wsAJAX).done(function(data) {
                var dataList = formatObjs(data);
                var labels = [ "id", "Type", "Modified", "Command", "Something?", "Owner" ];
                var cols = getColumnsByLabel(labels);
                tableSettings.aoColumns = cols;
                panel_body.append('<table id="rxn-table" class="table table-striped table-bordered"></table>');
                var table = $("#rxn-table").dataTable(tableSettings);
                table.fnAddData(dataList);
                $(".loader-table").remove();
            });
            function formatObjs(models) {
                for (var i in models) {
                    var model = models[i];
                    model[0] = '<a class="model-click" data-model="' + model[0] + '">' + model[0] + "</a>";
                }
                return models;
            }
            function getColumnsByLabel(labels) {
                var cols = [];
                for (var i in labels) {
                    cols.push({
                        sTitle: labels[i]
                    });
                }
                return cols;
            }
            function modelEvents() {
                $(".model-click").unbind("click");
                $(".model-click").click(function() {
                    var model = $(this).data("model");
                    self.trigger("modelClick", {
                        model: model
                    });
                });
            }
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseModelTabs",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var models = options.ids;
            var workspaces = options.workspaces;
            var token = options.auth;
            var panel = this.$elem.kbasePanel({
                title: "Model Details",
                rightLabel: workspaces[0],
                subText: models[0]
            });
            var panel_body = panel.body();
            var fba = new fbaModelServices("https://kbase.us/services/fba_model_services/");
            var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
            var tables = [ "Reactions", "Compounds", "Compartment", "Biomass", "Gapfill", "Gapgen" ];
            var tableIds = [ "reaction", "compound", "compartment", "biomass", "gapfill", "gapgen" ];
            var tabs = $('<ul id="table-tabs" class="nav nav-tabs">                         <li class="active" >                         <a href="#' + tableIds[0] + '" data-toggle="tab" >' + tables[0] + "</a>                       </li></ul>");
            for (var i = 1; i < tableIds.length; i++) {
                tabs.append('<li><a href="#' + tableIds[i] + '" data-toggle="tab">' + tables[i] + "</a></li>");
            }
            panel_body.append(tabs);
            var tab_pane = $('<div id="tab-content" class="tab-content">');
            tab_pane.append('<div class="tab-pane in active" id="' + tableIds[0] + '">                             <table cellpadding="0" cellspacing="0" border="0" id="' + tableIds[0] + '-table"                             class="table table-bordered table-striped" style="width: 100%;"></table>                        </div>');
            for (var i = 1; i < tableIds.length; i++) {
                var tableDiv = $('<div class="tab-pane in" id="' + tableIds[i] + '"> ');
                var table = $('<table cellpadding="0" cellspacing="0" border="0" id="' + tableIds[i] + '-table"                             class="table table-striped table-bordered">');
                tableDiv.append(table);
                tab_pane.append(tableDiv);
            }
            panel_body.append(tab_pane);
            $("#table-tabs a").click(function(e) {
                e.preventDefault();
                $(this).tab("show");
            });
            var tableSettings = {
                sPaginationType: "full_numbers",
                iDisplayLength: 5,
                aaData: [],
                oLanguage: {
                    sSearch: "Search all:"
                }
            };
            var models_AJAX = fba.get_models({
                models: models,
                workspaces: workspaces
            });
            $(".tab-pane").not("#overview").append('<p class="muted loader-tables">                                   <img src="assets/img/ajax-loader.gif"> loading...</p>');
            $.when(models_AJAX).done(function(data) {
                model = data[0];
                console.log(model);
                var dataDict = model.compartments;
                var keys = [ "id", "index", "name", "pH", "potential" ];
                var labels = [ "id", "index", "name", "pH", "potential" ];
                var cols = getColumns(keys, labels);
                tableSettings.aoColumns = cols;
                var table = $("#compartment-table").dataTable(tableSettings);
                table.fnAddData(dataDict);
                var dataDict = formatRxnObjs(model.reactions);
                var keys = [ "reaction", "definition", "features", "name" ];
                var labels = [ "reaction", "equation", "features", "name" ];
                var cols = getColumns(keys, labels);
                var rxnTableSettings = $.extend({}, tableSettings, {
                    fnDrawCallback: rxnEvents
                });
                rxnTableSettings.aoColumns = cols;
                var table = $("#reaction-table").dataTable(rxnTableSettings);
                table.fnAddData(dataDict);
                var dataDict = model.compounds;
                var keys = [ "compartment", "compound", "name" ];
                var labels = [ "compartment", "compound", "name" ];
                var cols = getColumns(keys, labels);
                tableSettings.aoColumns = cols;
                var table = $("#compound-table").dataTable(tableSettings);
                table.fnAddData(dataDict);
                var dataDict = model.biomasses;
                var keys = [ "definition", "id", "name" ];
                var labels = [ "definition", "id", "name" ];
                var cols = getColumns(keys, labels);
                tableSettings.aoColumns = cols;
                var table = $("#biomass-table").dataTable(tableSettings);
                table.fnAddData(dataDict);
                gapFillTable(data);
                var model_gapgen = model.gapgen;
                var keys = [ "id", "index", "name", "pH", "potential" ];
                var labels = [ "id", "index", "name", "pH", "potential" ];
                var cols = getColumns(keys, labels);
                tableSettings.aoColumns = cols;
                var table = $("#gapgen-table").dataTable(tableSettings);
                $(".loader-tables").remove();
            });
            function formatRxnObjs(rxnObjs) {
                for (var i in rxnObjs) {
                    var rxn = rxnObjs[i];
                    rxn.reaction = '<a class="rxn-click" data-rxn="' + rxn.reaction + '">' + rxn.reaction + "</a> (" + rxn.compartment + ")";
                    rxn.features = rxn.features.join("<br>");
                }
                return rxnObjs;
            }
            function getColumns(keys, labels) {
                var cols = [];
                for (var i = 0; i < keys.length; i++) {
                    cols.push({
                        sTitle: labels[i],
                        mData: keys[i]
                    });
                }
                return cols;
            }
            function rxnEvents() {
                $(".rxn-click").unbind("click");
                $(".rxn-click").click(function() {
                    var rxn = [ $(this).data("rxn") ];
                    self.trigger("rxnClick", {
                        rxns: rxn
                    });
                });
            }
            function gapFillTable(models) {
                var gapTable = undefined;
                var active = false;
                var init_data = {
                    sPaginationType: "full_numbers",
                    fnDrawCallback: events,
                    iDisplayLength: 20,
                    aoColumns: [ {
                        sTitle: "Integrated",
                        sWidth: "10%"
                    }, {
                        bVisible: false
                    }, {
                        sTitle: "Ref",
                        sWidth: "40%"
                    }, {
                        sTitle: "Media"
                    }, {
                        sTitle: "Media WS",
                        sWidth: "20%"
                    }, {
                        bVisible: false
                    }, {
                        bVisible: false
                    } ],
                    oLanguage: {
                        sSearch: "Search all:",
                        sEmptyTable: "No gapfill objects for this model."
                    }
                };
                var initTable = function(settings) {
                    if (settings) {
                        gapTable = $("#gapfill-table").dataTable(settings);
                    } else {
                        gapTable = $("#gapfill-table").dataTable(init_data);
                    }
                };
                function add_search_boxes() {
                    var single_search = '<th rowspan="1" colspan="1"><input type="text"                                           name="search_reactions" placeholder="Search"                                           class="search_init input-mini">                                      </th>';
                    var searches = $("<tr>");
                    $("#gapfill-table thead tr th").each(function() {
                        $(this).css("border-bottom", "none");
                        searches.append(single_search);
                    });
                    $("#gapfill-table thead").append(searches);
                    $("thead input").keyup(function() {
                        gapTable.fnFilter(this.value, $("thead input").index(this));
                    });
                    active = true;
                }
                this.load_table = function(models) {
                    var gaps = [];
                    var intGapfills = models[0].integrated_gapfillings;
                    for (var i in intGapfills) {
                        var intGap = intGapfills[i];
                        if (intGap.length == 6) {
                            intGap.splice(0, 0, "Yes");
                            intGap.splice(2, 1, '<a class="show-gap" data-ref="' + intGap[2] + '" >' + intGap[2] + "</a>");
                        }
                    }
                    var unIntGapfills = models[0].unintegrated_gapfillings;
                    for (var i in unIntGapfills) {
                        var unIntGap = unIntGapfills[i];
                        if (unIntGap.length == 6) {
                            unIntGap.splice(0, 0, "No");
                            unIntGap.splice(2, 1, '<a class="show-gap" data-ref="' + unIntGap[2] + '" >' + unIntGap[2] + "</a>");
                        }
                    }
                    if (unIntGapfills) {
                        var gapfills = unIntGapfills.concat(intGapfills);
                    }
                    var gapfills = intGapfills;
                    console.log(gapfills);
                    init_data.aaData = gapfills;
                    initTable();
                    gapTable.fnSort([ [ 1, "desc" ] ]);
                };
                this.load_table(models);
                function events() {
                    $(".show-gap").tooltip({
                        html: true,
                        title: 'show more info                     <i class="icon-list-alt icon-white history-icon"></i>',
                        placement: "right"
                    });
                    $(".show-gap").unbind("click");
                    $(".show-gap").click(function() {
                        var gapRef = $(this).data("ref");
                        var tr = $(this).closest("tr")[0];
                        if (gapTable.fnIsOpen(tr)) {
                            gapTable.fnClose(tr);
                        } else {
                            gapTable.fnOpen(tr, "", "info_row");
                            $(this).closest("tr").next("tr").children(".info_row").append('<p class="muted loader-gap-sol">                             <img src="assets/img/ajax-loader.gif"> loading possible solutions...</p>');
                            showGapfillSolutions(tr, gapRef);
                        }
                    });
                }
                function showGapfillSolutions(tr, gapRef) {
                    var gapAJAX = fba.get_gapfills({
                        gapfills: [ gapRef ],
                        workspaces: [ "NO_WORKSPACE" ],
                        auth: USER_TOKEN
                    });
                    $.when(gapAJAX).done(function(data) {
                        var data = data[0];
                        var sols = data.solutions;
                        var solList = $('<div class="gap-selection-list">');
                        for (var i in sols) {
                            var sol = sols[i];
                            var solID = sol.id;
                            if (sol.integrated == "1") {
                                solList.append('<div> <a type="button" class="gap-sol"                                data-toggle="collapse" data-target="#' + gapRef + solID.replace(/\./g, "_") + '" >' + solID + '</a> <span class="caret" style="vertical-align: middle;"></span>                                <div class="radio inline gapfill-radio">                                     <input type="radio" name="gapfillRadios" id="gapfillRadio' + i + '" value="integrated" checked>                                </div> <span class="label integrated-label">Integrated</span>                                    <button data-gapfill="' + gapRef + solID + '"                                     class="hide btn btn-primary btn-mini integrate-btn">Integrate</button>                                  </div>');
                            } else {
                                solList.append('<div> <a type="button" class="gap-sol"                                data-toggle="collapse" data-target="#' + gapRef + solID.replace(/\./g, "_") + '" >' + solID + '</a> <span class="caret" style="vertical-align: middle;"></span>                                <div class="radio inline gapfill-radio">                                     <input type="radio" name="gapfillRadios" id="gapfillRadio' + i + '" value="unitegrated">                                </div>                                <button data-gapfill="' + gapRef + solID + '"                                 class="hide btn btn-primary btn-mini integrate-btn">Integrate</button>                                 </div>');
                            }
                            var rxnAdditions = sol.reactionAdditions;
                            if (rxnAdditions.length == 0) {
                                var rxnInfo = $("<p>No reaction additions in this solution</p>");
                            } else {
                                var rxnInfo = $('<table class="gapfill-rxn-info">');
                                var header = $("<tr><th>Reaction</th>                                                <th>Equation</th></tr>");
                                rxnInfo.append(header);
                                for (var j in rxnAdditions) {
                                    var rxnArray = rxnAdditions[j];
                                    var row = $("<tr>");
                                    row.append('<td><a class="gap-rxn" data-rxn="' + rxnArray[0] + '" >' + rxnArray[0] + "</a></td>");
                                    row.append("<td>" + rxnArray[4] + "</td>");
                                    rxnInfo.append(row);
                                }
                            }
                            var solResults = $('<div id="' + gapRef + solID.replace(/\./g, "_") + '" class="collapse">');
                            solResults.append(rxnInfo);
                            solList.append(solResults);
                        }
                        $(tr).next().children("td").append(solList.html());
                        $(".loader-gap-sol").remove();
                        $("input[name='gapfillRadios']").unbind("change");
                        $("input[name='gapfillRadios']").change(function() {
                            $(".integrate-btn").hide();
                            $(this).parent().next(".integrate-btn").show();
                        });
                        $(".gap-sol").unbind("click");
                        $(".gap-sol").click(function() {
                            var caret = $(this).next("span");
                            if (caret.hasClass("caret")) {
                                caret.removeClass("caret");
                                caret.addClass("caret-up");
                            } else {
                                caret.removeClass("caret-up");
                                caret.addClass("caret");
                            }
                        });
                        $(".integrate-btn").unbind("click");
                        $(".integrate-btn").click(function() {
                            $(this).after('<span class="muted loader-integrating" >                               <img src="assets/img/ajax-loader.gif"> loading...</span>');
                            var gapfill_id = $(this).data("gapfill");
                            var model = modelspace.active_kbids()[0];
                            var fbaAJAX = fba.integrate_reconciliation_solutions({
                                model: model,
                                model_workspace: ws,
                                gapfillSolutions: [ gapfill_id ],
                                gapgenSolutions: [ "" ],
                                auth: USER_TOKEN,
                                workspace: ws
                            });
                            $.when(fbaAJAX).done(function(data) {
                                alert("NOTE: This functionality is still under development\n", data);
                                $(".loader-integrating").remove();
                            });
                        });
                        $(".gap-rxn").click(function() {
                            var rxn = $(this).data("rxn");
                            reaction_view([ rxn ]);
                        });
                    });
                }
            }
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseSimpleWSSelect",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var token = options.auth;
            var default_ws = options.defaultWS;
            var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
            this.show = function(options) {
                var modal = self.$elem.kbaseModal({
                    title: "Save to a Workspace"
                });
                var modal_body = modal.body('<p class="muted loader">                     <img src="assets/img/ajax-loader.gif"> loading...</p>');
                modal.buttons([ {
                    text: "Close"
                }, {
                    text: "Save",
                    color: "primary"
                } ]);
                modal.show();
                var wsAJAX = kbws.list_workspaces({
                    auth: token
                });
                $.when(wsAJAX).done(function(data) {
                    ws_selector_modal(modal_body, data);
                });
            };
            function ws_selector_modal(container, data) {
                container.find(".loader").remove();
                var form = $("<form>");
                var newMediaName = $('<div class="col-xs-6 col-md-4">                <p>Enter new name:</p>                <p><input class="form-control" placeholder="new name"></input>                <p>Enter new pH:</p><p><input class="form-control" placeholder="pH"></input></p>                <p>Save to Workspace:</p></div><br/>');
                var select = $('<select class="form-control simple-ws-select"></select>');
                for (var i in data) {
                    if (data[i][0] == default_ws) {
                        select.append('<option selected="selected">' + data[i][0] + "</option>");
                    } else {
                        select.append("<option>" + data[i][0] + "</option>");
                    }
                }
                form.append(newMediaName);
                form.append(select);
                container.append(form);
                events();
            }
            function events(container) {
                $(".select-ws-btn").unbind("click");
                $(".select-ws-btn").click(function() {
                    alert("yo");
                    var ws = $(".simple-ws-select").val();
                    var newMediaInfo = {
                        ws: ws,
                        name: newMediaName
                    };
                    self.trigger("selectedWS", newMediaInfo);
                });
            }
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseWSFbaTable",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var token = options.auth;
            var ws = options.ws;
            this.$elem.append('<div id="kbase-ws-fba-table" class="panel panel-default">                                <div class="panel-heading">                                    <h4 class="panel-title">FBA Objects</h4>                                    <span class="label label-primary pull-right">' + ws + '</span><br>                                </div>                                <div class="panel-body"></div>                           </div>');
            var container = $("#kbase-ws-fba-table .panel-body");
            var fba = new fbaModelServices("https://kbase.us/services/fba_model_services/");
            var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
            var tableSettings = {
                fnDrawCallback: modelEvents,
                sPaginationType: "full_numbers",
                iDisplayLength: 20,
                aaData: [],
                oLanguage: {
                    sSearch: "Search all:"
                }
            };
            var wsAJAX = kbws.list_workspace_objects({
                workspace: ws,
                type: "FBA",
                auth: token
            });
            container.append('<p class="muted loader-table">                                   <img src="assets/img/ajax-loader.gif"> loading...</p>');
            $.when(wsAJAX).done(function(data) {
                var dataList = formatObjs(data);
                var labels = [ "id", "Type", "Modified", "Something", "Command", "Owner" ];
                var cols = getColumnsByLabel(labels);
                tableSettings.aoColumns = cols;
                container.append('<table id="ws-fba-table" class="table table-striped table-bordered"></table>');
                var table = $("#ws-fba-table").dataTable(tableSettings);
                table.fnAddData(dataList);
                $(".loader-table").remove();
            });
            function formatObjs(objs) {
                for (var i in objs) {
                    var obj = objs[i];
                    obj[0] = '<a class="fba-click" data-fba="' + obj[0] + '">' + obj[0] + "</a>";
                }
                return objs;
            }
            function getColumnsByLabel(labels) {
                var cols = [];
                for (var i in labels) {
                    cols.push({
                        sTitle: labels[i]
                    });
                }
                return cols;
            }
            function modelEvents() {
                $(".fba-click").unbind("click");
                $(".fba-click").click(function() {
                    var fba = $(this).data("fba");
                    self.trigger("fbaClick", {
                        fba: fba
                    });
                });
            }
            return this;
        }
    });
})(jQuery);

function WSHandler(params) {
    console.log("here");
    var parent = this;
    var user = params && params.user ? params.user : null;
    var url = params && params.url ? params.url : "http://kbase.us/services/workspace";
    var service = new workspaceService(url);
    this.getWorkspace = function(workspaceId) {
        var def = $.Deferred();
        var params = {
            workspace: workspaceId
        };
        if (user) {
            params.auth = user.token;
        }
        service.get_workspacemeta(params).done(function(rawWorkspace) {
            var workspace = new Workspace(rawWorkspace);
            def.resolve(workspace);
        }).fail(function() {
            def.reject();
        });
        return def.promise();
    };
    this.getWorkspaces = function() {
        def = $.Deferred();
        var params = {};
        if (user) {
            params.auth = user.token;
        }
        service.list_workspaces(params).done(function(rawWorkspaces) {
            var workspaces = [];
            for (var i = 0; i < rawWorkspaces.length; i++) {
                var workspace = new Workspace(rawWorkspaces[i]);
                workspaces.push(workspace);
            }
            def.resolve(workspaces);
        }).fail(function() {
            def.reject();
        });
        return def.promise();
    };
    this.createWorkspace = function(workspaceId, permission) {
        var def = $.Deferred();
        if (!validatePermission(permission)) {
            permission = "n";
        }
        var params = {
            workspace: workspaceId,
            default_permission: permission
        };
        if (user) {
            params.auth = user.token;
        }
        service.create_workspace(params).done(function(rawWorkspace) {
            var workspace = new Workspace(rawWorkspace);
            workspace.permissions = {};
            def.resolve(workspace);
        }).fail(function(error) {
            def.reject(error);
        });
        return def.promise();
    };
    function validatePermission(perm) {
        return /^[nrwa]$/.test(perm);
    }
    function Workspace(data) {
        var self = this;
        var dataFields = [ "id", "owner", "moddate", "objects", "user_permission", "global_permission" ];
        for (var i = 0; i < dataFields.length; i++) {
            this[dataFields[i]] = data[i];
        }
        if (user) {
            this.isOwned = user.user_id === this.owner ? true : false;
        } else {
            this.isOwned = "public" === this.owner ? true : false;
        }
        this.clone = function(newWorkspaceId, permission) {
            var def = $.Deferred();
            if (!validatePermission(permission)) {
                permission = null;
            }
            var params = {
                current_workspace: self.id,
                new_workspace: newWorkspaceId
            };
            if (permission) {
                params.default_permission = permission;
            }
            if (user) {
                params.auth = user.token;
            }
            service.clone_workspace(params).done(function() {
                parent.getWorkspace(newWorkspaceId).done(function(newWorkspace) {
                    def.resolve(newWorkspace);
                }).fail(function(error) {
                    def.reject(error);
                });
            }).fail(function(error) {
                def.reject(error);
            });
            return def.promise();
        };
        this.getAllObjectsMeta = function() {
            var def = $.Deferred();
            var params = {
                workspace: self.id
            };
            if (user) {
                params.auth = user.token;
            }
            service.list_workspace_objects(params).done(function(data) {
                for (var i = 0; i < data.length; i++) {
                    data[i] = new WorkspaceObject(data[i]);
                }
                def.resolve(data);
            }).fail(function() {
                def.reject();
            });
            return def.promise();
        };
        this.hasObject = function() {};
        this.getObject = function(type, id) {
            var def = $.Deferred();
            var params = {
                workspace: this.id,
                type: type,
                id: id
            };
            if (user) {
                params.auth = user.token;
            }
            service.get_object(params).done(function(data) {
                def.resolve(data.data);
            }).fail(function() {
                def.reject();
            });
            return def.promise();
        };
        this.getObjectHistory = function(type, id) {
            var def = $.Deferred();
            var params = {
                workspace: this.id,
                type: type,
                id: id
            };
            if (user) {
                params.auth = user.token;
            }
            var prom = service.object_history(params).fail(function() {
                def.reject();
            });
            return prom;
        };
        this.deleteObj = function(type, id) {
            var def = $.Deferred();
            var params = {
                workspace: this.id,
                type: type,
                id: id
            };
            console.log(params);
            if (user) {
                params.auth = user.token;
            }
            service.delete_object(params).done(function() {
                def.resolve(self);
            }).fail(function() {
                def.reject();
            });
            return def.promise();
        };
        this.copyObject = function(type, id, new_ws, new_id) {
            var def = $.Deferred();
            var params = {
                source_workspace: this.id,
                type: type,
                source_id: id,
                new_workspace: new_ws,
                new_id: new_id
            };
            console.log(params);
            if (user) {
                params.auth = user.token;
            }
            service.copy_object(params).done(function() {
                def.resolve(self);
            }).fail(function() {
                def.reject();
            });
            return def.promise();
        };
        this.moveObject = function(type, id, new_ws, new_id) {
            var def = $.Deferred();
            var params = {
                source_workspace: this.id,
                type: type,
                source_id: id,
                new_workspace: new_ws,
                new_id: new_id
            };
            console.log(params);
            if (user) {
                params.auth = user.token;
            }
            service.move_object(params).done(function() {
                def.resolve(self);
            }).fail(function() {
                def.reject();
            });
            return def.promise();
        };
        this.saveObject = function() {};
        this.revertObject = function() {};
        if (!(this.isOwned || this.user_permission === "a")) {
            return;
        }
        this.getPermissions = function() {
            var def = $.Deferred();
            var params = {
                workspace: self.id
            };
            if (user) {
                params.auth = user.token;
            }
            service.get_workspacepermissions(params).done(function(perms) {
                delete perms["default"];
                if (user) {
                    delete perms[user.user_id];
                } else {
                    delete perms["public"];
                }
                self.permissions = perms;
                def.resolve(self);
            }).fail(function() {
                def.reject();
            });
            return def.promise();
        };
        this.setGlobalPermission = function(permission) {
            var def = $.Deferred();
            if (!validatePermission(permission)) {
                def.reject();
                return def.promise();
            }
            var params = {
                workspace: self.id,
                new_permission: permission
            };
            if (user) {
                params.auth = user.token;
            }
            service.set_global_workspace_permissions(params).done(function() {
                self.global_permission = permission;
                def.resolve(self);
            }).fail(function() {
                def.reject();
            });
            return def.promise();
        };
        this.setWorkspacePermissions = function(userPerms) {
            var def = $.Deferred();
            var perms = {
                n: [],
                r: [],
                w: [],
                a: []
            };
            var error = false;
            $.each(userPerms, function(u, v) {
                if (!validatePermission(v)) {
                    error = true;
                }
            });
            if (error) {
                def.reject();
                return def.promise();
            }
            $.each(self.permissions, function(u, v) {
                if (userPerms[u] === undefined) {
                    perms.n.push(u);
                }
            });
            $.each(userPerms, function(u, v) {
                if (v !== self.permissions[u]) {
                    perms[v].push(u);
                }
            });
            var promises = [];
            $.each(perms, function(perm, users) {
                if (users.length === 0) {
                    return;
                }
                var params = {
                    workspace: self.id,
                    new_permission: perm,
                    users: users
                };
                if (user) {
                    params.auth = user.token;
                }
                var p = service.set_workspace_permissions(params);
                promises.push(p);
            });
            $.when.apply($, promises).done(function() {
                self.permissions = userPerms;
                def.resolve(self);
            }).fail(function() {
                def.reject();
            });
            return def.promise();
        };
        if (!this.isOwned) {
            return;
        }
        this.delete = function() {
            var def = $.Deferred();
            var params = {
                workspace: self.id
            };
            if (user) {
                params.auth = user.token;
            }
            service.delete_workspace(params).done(function() {
                def.resolve(self);
            }).fail(function() {
                def.reject();
            });
            return def.promise();
        };
    }
    function WorkspaceObject(data) {
        var dataFields = [ "id", "type", "moddate", "instance", "command", "lastmodifier", "owner", "workspace", "ref", "chsum", "metadata" ];
        for (var i = 0; i < dataFields.length; i++) {
            this[dataFields[i]] = data[i];
        }
    }
}

(function($, undefined) {
    $.KBWidget({
        name: "kbaseWSMediaTable",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var token = options.auth;
            var ws = options.ws;
            var title = options.title ? options.title : "Biochemistry Media";
            var selectable = options.selectable;
            var container = $('<div id="kbase-ws-media-table" class="panel panel-default">                                <div class="panel-heading">                                    <h4 class="panel-title">' + title + '</h4>                                    <span class="label label-primary pull-right select-ws"                                     data-ws="' + ws + '">' + ws + '</span><br>                                </div>                                <div class="panel-body"></div>                           </div>');
            this.$elem.append(container);
            var panel_body = container.find(".panel-body");
            var fba = new fbaModelServices("https://kbase.us/services/fba_model_services/");
            var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
            var tableSettings = {
                fnDrawCallback: mediaEvents,
                sPaginationType: "full_numbers",
                iDisplayLength: 20,
                aaData: [],
                oLanguage: {
                    sSearch: "Search all:"
                }
            };
            var wsAJAX = kbws.list_workspace_objects({
                workspace: ws,
                type: "Media"
            });
            panel_body.append('<p class="muted loader-table">                                   <img src="assets/img/ajax-loader.gif"> loading...</p>');
            $.when(wsAJAX).done(function(data) {
                var dataList = formatObjs(data);
                var labels = [ "id", "abbrev", "formula", "charge", "deltaG", "deltaGErr", "name", "aliases" ];
                var cols = getColumnsByLabel(labels);
                tableSettings.aoColumns = cols;
                panel_body.append('<table id="media-table2" class="table table-striped table-bordered"></table>');
                var table = $("#media-table2").dataTable(tableSettings);
                table.fnAddData(dataList);
                $(".loader-table").remove();
            });
            function ws_list(count) {
                var ws = [];
                for (var i = 0; i < count; i++) {
                    ws.push("KBaseMedia");
                }
                return ws;
            }
            function formatObjs(media_meta) {
                for (var i in media_meta) {
                    var media = media_meta[i];
                    media[0] = '<a class="media-click" data-media="' + media[0] + '">' + media[0] + "</a>";
                }
                return media_meta;
            }
            function getColumnsByLabel(labels) {
                var cols = [];
                for (var i in labels) {
                    cols.push({
                        sTitle: labels[i]
                    });
                }
                return cols;
            }
            function mediaEvents() {
                $(".media-click").unbind("click");
                $(".media-click").click(function() {
                    var media = $(this).data("media");
                    self.trigger("mediaClick", {
                        media: media
                    });
                });
                $(".select-ws").unbind("click");
                $(".select-ws").click(function() {
                    var ws = $(this).data("ws");
                    self.trigger("selectWS", {
                        ws: ws
                    });
                });
            }
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseWSModelTable",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var token = options.auth;
            var ws = options.ws;
            var panel = this.$elem.kbasePanel({
                title: "Model Info",
                rightLabel: ws
            });
            panel.loading();
            var panel_body = panel.body();
            var fba = new fbaModelServices("https://kbase.us/services/fba_model_services/");
            var kbws = new workspaceService("http://kbase.us/services/workspace_service/");
            var tableSettings = {
                fnDrawCallback: modelEvents,
                sPaginationType: "full_numbers",
                iDisplayLength: 20,
                aaData: [],
                oLanguage: {
                    sSearch: "Search all:"
                }
            };
            var wsAJAX = kbws.list_workspace_objects({
                workspace: ws,
                type: "Model",
                auth: token
            });
            $.when(wsAJAX).done(function(data) {
                var dataList = formatObjs(data);
                var labels = [ "id", "Type", "Modified", "Command", "Something?", "Owner" ];
                var cols = getColumnsByLabel(labels);
                tableSettings.aoColumns = cols;
                panel_body.append('<table id="rxn-table" class="table table-striped table-bordered"></table>');
                var table = $("#rxn-table").dataTable(tableSettings);
                table.fnAddData(dataList);
                panel.rmLoading();
            });
            function formatObjs(models) {
                for (var i in models) {
                    var model = models[i];
                    model[0] = '<a class="model-click" data-model="' + model[0] + '">' + model[0] + "</a>";
                }
                return models;
            }
            function getColumnsByLabel(labels) {
                var cols = [];
                for (var i in labels) {
                    cols.push({
                        sTitle: labels[i]
                    });
                }
                return cols;
            }
            function modelEvents() {
                $(".model-click").unbind("click");
                $(".model-click").click(function() {
                    var model = $(this).data("model");
                    self.trigger("modelClick", {
                        model: model
                    });
                });
            }
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseWSObjectTable",
        version: "1.0.0",
        options: {},
        init: function(options) {
            var self = this;
            this._super(options);
            var checkedList = [];
            this.$elem.append('<div id="object-table-container"></div>');
            var container = $("#object-table-container");
            var tableLoading = $('<div id="object-table-loading" style="text-align: center; margin-top: 60px;">' + '<img src="assets/img/ajax-loader.gif" /><p class="text-muted">Loading...<p></div>');
            container.append(tableLoading);
            var tableDiv = $('<div id="object-table">');
            container.append(tableDiv);
            var table = $('<table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">');
            tableDiv.append(table);
            tableDiv.addClass("hide");
            table.dataTable({
                sScrollY: "100%",
                sScrollX: "100%",
                iDisplayLength: 25,
                oLanguage: {
                    sZeroRecords: '<div style="text-align: center">No objects</div>'
                },
                aoColumns: [ {
                    sTitle: ""
                }, {
                    sTitle: "Workspace",
                    bVisible: false
                }, {
                    sTitle: "ID"
                }, {
                    sTitle: "Org"
                }, {
                    sTitle: "Type"
                }, {
                    sTitle: "Command"
                }, {
                    sTitle: "Owner"
                }, {
                    sTitle: "Modified"
                } ],
                aoColumnDefs: [ {
                    bSortable: false,
                    aTargets: [ 0 ]
                } ]
            });
            $("thead input").keydown(function(event) {
                if (event.keyCode == 13) {
                    oTable.fnFilter(this.value, $("thead input").index(this) - 1);
                    $("tfoot input").eq($("thead input").index(this) - 4).val(this.value);
                    this.blur();
                }
            });
            $("thead input").each(function(i) {
                asInitVals[i] = this.value;
            });
            $("thead input").focus(function() {
                if (this.value == asInitVals[$("thead input").index(this)]) {
                    this.value = "";
                }
            });
            $("thead input").blur(function() {
                if (this.value == "") {
                    this.value = asInitVals[$("thead input").index(this)];
                    $("tfoot input").eq($("thead input").index(this) - 4).val(this.value);
                }
            });
            table.on("click", ".view-meta", workspaceObjectClick);
            table.on("click", ".view-obj-page", viewObject);
            var prev = {};
            this.reload = function(workspaces) {
                var def = $.Deferred();
                $("#object-table-container").show();
                var objects = [];
                for (var i = 0; i < workspaces.length; i++) {
                    objects = objects.concat(workspaces[i].objectData);
                }
                var processed = 0, number = 100, total = objects.length, isCancelled = {};
                if (total > 1e3) {
                    number = 500;
                } else if (total > 500) {
                    number = 200;
                }
                if (total > number) {
                    self.loading(true);
                }
                table.fnClearTable();
                prev.cancel = true;
                prev = isCancelled;
                process();
                return def.promise();
                function process() {
                    window.setTimeout(function() {
                        if (isCancelled.cancel) {
                            return;
                        }
                        var data = [];
                        var nextTotal = processed + number;
                        if (nextTotal > total) {
                            nextTotal = total;
                        }
                        for (;processed < nextTotal; processed++) {
                            var obj = objects[processed];
                            $(".ncheck").data("workspace");
                            var check = '<div class="ncheck check-option"' + ' data-workspace="' + obj.workspace + '"' + ' data-type="' + obj.type + '"' + ' data-id="' + obj.id + '"></div>';
                            var version = '<a class="obj-version"' + ' data-workspace="' + obj.workspace + '"' + ' data-type="' + obj.type + '"' + ' data-id="' + obj.id + '">' + "(" + obj.instance + ")</a>";
                            var id = '<div class="obj-table-opts" style="white-space: nowrap;">' + '<button class="btn btn-link view-options"' + ' style="padding-right: 5px;"' + ' data-workspace="' + obj.workspace + '"' + ' data-type="' + obj.type + '"' + ' data-id="' + obj.id + '">' + obj.id + "</button>" + version;
                            var mod = '<div style="white-space: nowrap;">' + obj.moddate + "</div>";
                            data.push([ check, obj.workspace, id, obj.metadata.name ? obj.metadata.name : "", obj.type, obj.command, obj.owner, mod ]);
                        }
                        table.fnAddData(data);
                        initOptButtons();
                        objectIdClick();
                        versionObjectClick(".obj-version", table);
                        $(".type-filter").change(function() {
                            if ($(this).val() == "All Types") {
                                table.fnFilter("", 4);
                                checkBoxObjectClick(".check-option");
                                objectIdClick();
                                versionObjectClick(".obj-version", table);
                            } else {
                                table.fnFilter($(this).val(), 4);
                                checkBoxObjectClick(".check-option");
                                objectIdClick();
                                versionObjectClick(".obj-version", table);
                            }
                        });
                        table.fnFilter("", 4);
                        if (nextTotal === total) {
                            self.loading(false);
                            self.fixColumnSize();
                            def.resolve();
                        } else {
                            process();
                        }
                        if (workspaces.length > 1) {
                            fnShow(1, table);
                        } else {
                            fnHide(1, table);
                        }
                        $(".select-objs .ncheck-btn").removeClass("ncheck-checked");
                        $(".select-objs .ncheck-btn").removeClass("ncheck-minus");
                    }, 0);
                }
            };
            this.loading = function(flag) {
                if (flag) {
                    tableLoading.removeClass("hide");
                    tableDiv.addClass("hide");
                } else {
                    tableDiv.removeClass("hide");
                    tableLoading.addClass("hide");
                }
            };
            this.fixColumnSize = function() {
                table.fnAdjustColumnSizing();
            };
            function fnShow(iCol, table) {
                var bVis = table.fnSettings().aoColumns[iCol].bVisible;
                table.fnSetColumnVis(iCol, true);
            }
            function fnHide(iCol, table) {
                var bVis = table.fnSettings().aoColumns[iCol].bVisible;
                table.fnSetColumnVis(iCol, false);
            }
            function objectIdClick() {
                $(".view-options").unbind("click");
                $(".view-options").click(function() {
                    var ws = $(this).data("workspace");
                    var type = $(this).data("type");
                    var id = $(this).data("id");
                    console.log(ws, type, id);
                    if (type == "Genome") {
                        window.location.hash = "/genomes/" + ws + "/" + id;
                    } else if (type == "Model") {
                        window.location.hash = "/models/" + ws + "/" + id;
                    } else if (type == "FBA") {
                        window.location.hash = "/fbas/" + ws + "/" + id;
                    } else if (type == "Media") {
                        window.location.hash = "/media/" + ws + "/" + id;
                    }
                });
            }
            function copyObjects(checkedList) {
                var workspace = checkedList[0][2];
                var modal = new Modal();
                modal.setTitle("Copy " + checkedList.length + " Object(s)");
                modal.setContent('<div><h4 style="margin-top: 0px;"></h4>' + '<table style="margin-left: auto; margin-right: auto; text-align: right; width: 300px;">' + "<tr><td>Workspace:</td>" + '<td id="clone-into-cell"></td></tr>' + "</tr></table></div>");
                $("#clone-permission").css({
                    width: "164px"
                });
                var cell = $("#clone-into-cell"), newInput = $('<input class="form-control" type="text" id="clone-id" style="width: 150px" />'), existingInput = $('<select class="form-control" style="width: 164px">'), permRow = $("#clone-permission-row");
                cell.append(newInput).append(existingInput);
                isNew = false;
                newInput.hide();
                permRow.hide();
                existingInput.show();
                newInput.keypress(function(e) {
                    if (e.which == 13) {
                        modal.submit();
                    }
                });
                for (var i = 0; i < workspaces.length; i++) {
                    var ws = workspaces[i];
                    if (ws === workspace) {
                        continue;
                    }
                    if (ws.user_permission === "a" || ws.user_permission === "w") {
                        existingInput.append('<option value="' + ws.id + '">' + ws.id + "</option>");
                    }
                }
                modal.setButtons("Cancel", "Copy");
                modal.on("submit", function() {
                    for (var i in checkedList) {
                        var item = checkedList[i];
                        var id = item[0], ws = item[2], type = item[3];
                        var workspace = getWorkspaceFromId(ws);
                        var workspaceId, perm;
                        workspaceId = existingInput.find("option").filter(":selected").val();
                        modal.alertHide();
                        modal.lock();
                        modal.cover('<img src="assets/img/ajax-loader.gif" /><br />This may take a while...');
                        var promises = [];
                        var p = workspace.copyObject(type, id, workspaceId, id);
                        promises.push(p);
                    }
                    $.when.apply($, promises).done(function(newWorkspace) {
                        newWorkspace.getAllObjectsMeta().done(function(objects) {
                            newWorkspace.objectData = objects;
                            modal.coverAlert("<strong>Success</strong><br />" + "Done copying objects.", "success");
                            modal.off("hidden");
                            modal.on("hidden", function() {
                                var existWorkspace;
                                for (var i = 0; i < workspaces.length; i++) {
                                    var workspace = workspaces[i];
                                    if (workspace.id === workspaceId) {
                                        existWorkspace = workspace;
                                        break;
                                    }
                                }
                                modal.delete();
                                window.location.reload();
                            });
                            finish();
                        }).fail(function(error) {
                            modal.coverAlert("<strong>Error</strong><br />" + "Could not get workspace '" + workspace.id + "'", "error");
                            finish();
                        });
                    }).fail(function() {
                        modal.coverAlert("<strong>Error</strong><br />" + "Could not clone workspace '" + workspace.id + "'", "error");
                        finish();
                    });
                });
                modal.show();
                function finish() {
                    modal.setButtons(null, "Close");
                    modal.off("submit");
                    modal.on("submit", function() {
                        modal.hide();
                    });
                    modal.unlock();
                }
            }
            function moveObjects(checkedList) {
                var workspace = checkedList[0][2];
                var modal = new Modal();
                modal.setTitle("Move " + checkedList.length + " Object(s)");
                modal.setContent('<div><h4 style="margin-top: 0px;"></h4>' + '<table style="margin-left: auto; margin-right: auto; text-align: right; width: 300px;">' + "<tr><td>Workspace:</td>" + '<td id="clone-into-cell"></td></tr>' + "</tr></table></div>");
                $("#clone-permission").css({
                    width: "164px"
                });
                var cell = $("#clone-into-cell"), newInput = $('<input class="form-control" type="text" id="clone-id" style="width: 150px" />'), existingInput = $('<select class="form-control" style="width: 164px">'), permRow = $("#clone-permission-row");
                cell.append(newInput).append(existingInput);
                isNew = false;
                newInput.hide();
                permRow.hide();
                existingInput.show();
                newInput.keypress(function(e) {
                    if (e.which == 13) {
                        modal.submit();
                    }
                });
                for (var i = 0; i < workspaces.length; i++) {
                    var ws = workspaces[i];
                    if (ws === workspace) {
                        continue;
                    }
                    if (ws.user_permission === "a" || ws.user_permission === "w") {
                        existingInput.append('<option value="' + ws.id + '">' + ws.id + "</option>");
                    }
                }
                modal.setButtons("Cancel", "Move");
                modal.on("submit", function() {
                    for (var i in checkedList) {
                        var item = checkedList[i];
                        var id = item[0], ws = item[2], type = item[3];
                        var workspace = getWorkspaceFromId(ws);
                        var workspaceId, perm;
                        workspaceId = existingInput.find("option").filter(":selected").val();
                        modal.alertHide();
                        modal.lock();
                        modal.cover('<img src="assets/img/ajax-loader.gif" /><br />This may take a while...');
                        var promises = [];
                        var p = workspace.moveObject(type, id, workspaceId, id);
                        promises.push(p);
                    }
                    $.when.apply($, promises).done(function(newWorkspace) {
                        newWorkspace.getAllObjectsMeta().done(function(objects) {
                            newWorkspace.objectData = objects;
                            modal.coverAlert("<strong>Success</strong><br />" + "Moved objects into '" + newWorkspace.id + "'", "success");
                            modal.off("hidden");
                            modal.on("hidden", function() {
                                var existWorkspace;
                                for (var i = 0; i < workspaces.length; i++) {
                                    var workspace = workspaces[i];
                                    if (workspace.id === workspaceId) {
                                        existWorkspace = workspace;
                                        break;
                                    }
                                }
                                modal.delete();
                                window.location.reload();
                            });
                            finish();
                        }).fail(function(error) {
                            modal.coverAlert("<strong>Error</strong><br />" + "Could not get workspace '" + workspace.id + "'", "error");
                            finish();
                        });
                    }).fail(function() {
                        modal.coverAlert("<strong>Error</strong><br />" + "Could not clone workspace '" + workspace.id + "'", "error");
                        finish();
                    });
                });
                modal.show();
                function finish() {
                    modal.setButtons(null, "Close");
                    modal.off("submit");
                    modal.on("submit", function() {
                        modal.hide();
                    });
                    modal.unlock();
                }
            }
            function deleteWorkspace(workspace, manageModal) {
                var modal = new Modal();
                modal.setTitle("Delete Workspace");
                modal.setContent("<span>Are you sure you want to delete this workspace?" + "<h3>" + workspace.id + "</h3>" + "This action is irreversible.</span>");
                modal.alert("<strong>Warning</strong><br />All objects in the workspace will be deleted!", "warning");
                modal.on("hidden", function() {
                    manageModal.on("hidden", function() {
                        manageModal.delete();
                    });
                    modal.delete();
                    manageModal.show();
                });
                manageModal.off("hidden");
                manageModal.hide();
                modal.setButtons("No", "Yes");
                modal.on("submit", function() {
                    modal.alertHide();
                    modal.lock();
                    modal.cover('<img src="assets/img/ajax-loader.gif" /><br />This may take a while...');
                    workspace.delete().done(function() {
                        modal.coverAlert("<strong>Success</strong><br />" + "Deleted workspace '" + workspace.id + "'", "success");
                        modal.off("hidden");
                        modal.on("hidden", function() {
                            workspaces.remove(workspace);
                            manageModal.delete();
                            modal.delete();
                        });
                    }).fail(function() {
                        modal.coverAlert("<strong>Error</strong><br />" + "Could not delete workspace '" + workspace.id + "'", "error");
                    }).always(function() {
                        modal.setButtons(null, "Close");
                        modal.off("submit");
                        modal.on("submit", function() {
                            modal.hide();
                        });
                        modal.unlock();
                    });
                });
                modal.show();
            }
            function deleteObjects(checkList) {
                var modal = new Modal();
                modal.setTitle("Delete " + checkList.length + " object(s)?");
                modal.setContent("<span>Are you sure you want to delete these " + checkList.length + " object(s)?<br>" + "This action is irreversible.</span>");
                modal.alert("<strong>Warning</strong><br />All selected objects in this workspace will be deleted!", "warning");
                modal.setButtons("No", "Yes");
                modal.on("submit", function() {
                    modal.alertHide();
                    modal.lock();
                    modal.cover('<img src="assets/img/ajax-loader.gif" /><br />This may take a while...');
                    del_objs = [];
                    for (var i in checkedList) {
                        var ws_object = checkList[i];
                        var id = ws_object[0], ws = ws_object[2], type = ws_object[3];
                        del_objs.push(id);
                        var workspace = getWorkspaceFromId(ws);
                        var promises = [];
                        var p = workspace.deleteObj(type, id);
                        promises.push(p);
                    }
                    $.when.apply($, promises).done(function(data) {
                        modal.coverAlert("<strong>Success</strong><br />" + "Deleted " + checkedList.length + " objects", "success");
                        modal.off("hidden");
                        modal.on("hidden", function() {
                            modal.delete();
                            window.location.reload();
                        });
                    }).fail(function() {
                        modal.coverAlert("<strong>Error</strong><br />" + "Could not delete an object", "error");
                    }).always(function() {
                        modal.setButtons(null, "Close");
                        modal.off("submit");
                        modal.on("submit", function() {
                            modal.hide();
                        });
                        modal.unlock();
                    });
                });
                modal.show();
            }
            function createPermissionSelect(id, value, noNone) {
                var sel = ' selected="selected"';
                var idval = ' id="' + id + '"';
                return "<select" + (id ? idval : "") + ' class="input-sm form-control"' + ' style="margin: 0px;" data-value="' + value + '">' + (noNone ? "" : '<option value="n"' + (value === "n" ? sel : "") + ">none</option>") + '<option value="r"' + (value === "r" ? sel : "") + ">read</option>" + '<option value="w"' + (value === "w" ? sel : "") + ">write</option>" + '<option value="a"' + (value === "a" ? sel : "") + ">admin</option>" + "</select>";
            }
            function getWorkspaceFromId(id) {
                for (var i = 0; i < workspaces.length; i++) {
                    var workspace = workspaces[i];
                    if (workspace.id === id) {
                        return workspace;
                    }
                }
                return null;
            }
            function getWorkspaceObjectFromId(workspace, type, id) {
                for (var i = 0; i < workspace.objectData.length; i++) {
                    var object = workspace.objectData[i];
                    if (object.type === type && object.id === id) {
                        return object;
                    }
                }
                return null;
            }
            function viewObject(e) {
                $("#object-table-container").hide();
                var ids = [ $(this).data("id") ];
                var ws = [ $(this).data("workspace") ];
                var type = $(this).data("type");
                if (type == "Model") {
                    $("#main-right-content").append('<button class="btn back-button"                     style="float: left; margin: 0 5px 0 0;" >back</div>');
                    $(".back-button").unbind("click");
                    $(".back-button").click(function() {
                        $("#object-table-container").show();
                    });
                }
                if (type == "FBA") {
                    $("#main-right-content").append('<button class="btn back-button"                     style="float: left; margin: 0 5px 0 0;" >back</div>');
                    fbaView = $("#main-right-content").fbaView({
                        ids: ids,
                        workspaces: ws
                    });
                    $(".back-button").unbind("click");
                    $(".back-button").click(function() {
                        $("#object-table-container").show();
                    });
                }
            }
            function initOptButtons() {
                if ($(".select-objs").length) {
                    $(".select-objs").remove();
                }
                var container = $(".obj-opts");
                container.append('<button type="button" class="btn btn-default select-objs pull-left">                                <div class="ncheck-btn"></div></button>');
                $(".type-filter").remove();
                container.append('<select class="form-control type-filter pull-left">                                           <option selected="selected">All Types</option>                                           <option>Genome</option>                                           <option>FBA</option>                                           <option>Model</option>                                           <option>PhenotypeSet</option>                                           <option>Media</option>                                     </select>');
                $(".select-objs").unbind("click");
                $(".select-objs").click(function() {
                    if ($(this).children(".ncheck-btn").hasClass("ncheck-checked")) {
                        $(".check-option").removeClass("ncheck-checked");
                        $(this).children(".ncheck-btn").removeClass("ncheck-checked");
                        $(".checked-opts").hide();
                        checkedList = [];
                    } else {
                        $(".checked-opts").show();
                        $(".check-option").addClass("ncheck-checked");
                        $(this).children(".ncheck-btn").removeClass("ncheck-minus");
                        $(this).children(".ncheck-btn").addClass("ncheck-checked");
                        checkedList = [];
                        $(".check-option").each(function() {
                            var id = $(this).attr("data-id");
                            var modelID = get_fba_model_id($(this).attr("data-id"));
                            var dataWS = $(this).attr("data-workspace");
                            var dataType = $(this).attr("data-type");
                            checkedList.push([ id, modelID, dataWS, dataType ]);
                        });
                    }
                    checkBoxObjectClick();
                });
                checkBoxObjectClick(".check-option");
            }
            function checkBoxObjectClick(ele) {
                if (!ele) {
                    resetOptionButtons();
                    objOptClick();
                    return;
                }
                $(ele).unbind("click");
                $(ele).click(function() {
                    var id = $(this).attr("data-id");
                    var modelID = get_fba_model_id($(this).attr("data-id"));
                    var dataWS = $(this).attr("data-workspace");
                    var dataType = $(this).attr("data-type");
                    $(".select-objs .ncheck-btn").addClass("ncheck-minus");
                    if ($(this).hasClass("ncheck-checked")) {
                        $(this).removeClass("ncheck-checked");
                        for (var i = 0; i < checkedList.length; i++) {
                            if (checkedList[i][0] == id) {
                                checkedList.splice(i, 1);
                            }
                        }
                    } else {
                        checkedList.push([ id, modelID, dataWS, dataType ]);
                        $(this).addClass("ncheck-checked");
                    }
                    resetOptionButtons();
                    objOptClick();
                });
                function resetOptionButtons() {
                    if ($(".checked-opts").length == 0) {
                        var container = $('<div class="checked-opts obj-opt">');
                        container.append('<a class="btn btn-danger obj-btn opt-delete ">                                               <i class="glyphicon glyphicon-trash"></i></a>');
                        container.append('<div class="dropdown obj-opt opt-dropdown">                                         <a class="btn btn-default obj-btn dropdown-toggle" type="button" data-toggle="dropdown">                                      <i class="glyphicon glyphicon-folder-open"></i> <span class="caret"></span></a>                                     <ul class="dropdown-menu">                                       <li opt="copy"><a>Copy</a> </li>                                       <li  opt="move"><a>Move</a></li>                                       <li class="divider"><a></a></li>                                       <li><a>Download</li>                                 </ul></div>');
                    } else if (checkedList.length == 0) {
                        $(".checked-opts").remove();
                        $(".select-objs .ncheck-btn").removeClass("ncheck-minus");
                    }
                    $(".obj-opts").append(container);
                }
            }
            function versionObjectClick(ele, table) {
                $(ele).tooltip({
                    html: true,
                    title: 'show history                 <span class="glyphicon glyphicon-list-alt history-icon"></span>',
                    placement: "right"
                });
                $(ele).unbind("click");
                $(ele).click(function() {
                    var self = this;
                    var id = $(this).attr("data-id"), ws = $(this).attr("data-workspace"), type = $(this).attr("data-type");
                    var workspace = getWorkspaceFromId(ws);
                    var tr = $(this).closest("tr")[0];
                    if (table.fnIsOpen(tr)) {
                        table.fnClose(tr);
                        $(self).attr("data-original-title", "show history").tooltip("fixTitle");
                    } else {
                        table.fnOpen(tr, "", "info_row");
                        var prom = workspace.getObjectHistory(type, id);
                        $.when(prom).done(function(data) {
                            $(tr).next().children("td").append("<h5>History of <i>" + id + "</i></h5>");
                            var info = $('<table class="history-table">');
                            var header = $("<tr><th>ID</th>                                            <th>Type</th>                                            <th>WS</th>                                            <th>Vers</th>                                            <th>Owner</th>                                            <th>Last modby</th>                                            <th>Cmd</th>                                            <th>Moddate</th>");
                            info.append(header);
                            for (var i = 0; i < data.length; i++) {
                                var ver = data[i];
                                var row = $("<tr>");
                                row.append('<td><a class="id-download" data-version="' + ver[3] + '" data-id="' + id + '" data-type="' + type + '" data-workspace="' + ws + '">' + ver[0] + "</a></td>" + "<td>" + ver[1] + "</td>" + "<td>" + ver[2] + "</td>" + "<td>" + ver[3] + "</td>" + "<td>" + ver[4] + "</td>" + "<td>" + ver[5] + "</td>" + "<td>" + ver[6] + "</td>" + "<td>" + ver[7] + "</td>");
                                info.append(row);
                            }
                            $(tr).next().children("td").append(info.html());
                            $(self).attr("data-original-title", "hide history").tooltip("fixTitle");
                        });
                    }
                });
            }
            function objOptClick() {
                $(".opt-delete").unbind("click");
                $(".opt-delete").click(function() {
                    deleteObjects(checkedList);
                });
                $(".opt-dropdown ul li").unbind("click");
                $(".opt-dropdown ul li").click(function() {
                    if ($(this).attr("opt") == "copy") {
                        copyObjects(checkedList);
                    } else if ($(this).attr("opt") == "move") {
                        moveObjects(checkedList);
                    }
                });
            }
            function workspaceObjectClick(e) {
                var workspace = getWorkspaceFromId(String($(this).data("workspace"))), type = String($(this).data("type")), object = getWorkspaceObjectFromId(workspace, type, String($(this).data("id")));
                var hasHtml = type.match(/^(Genome|Model|Media|FBA|Annotation)$/) !== null ? true : false;
                var modal = new Modal();
                modal.setTitle($(this).data("id"));
                modal.setButtons(null, "Close");
                modal.on("submit", function() {
                    modal.hide();
                });
                modal.on("hidden", function() {
                    modal.delete();
                    modal = null;
                });
                var container = $("<div>");
                var openURL = workspaceObjectLink(workspace, type, object, "json");
                container.append('<a href="' + openURL + '" target="_blank">Open</a>');
                var meta = $('<table class="table table-bordered table-condensed">');
                container.append("<br />Metadata<br />", meta);
                if ($.isEmptyObject(object.metadata)) {
                    meta.append('<tr><td><div style="text-align: center">No metadata</div></td></tr>');
                } else {
                    $.each(object.metadata, function(key, value) {
                        meta.append("<tr><td><strong>" + key + "</strong></td><td>" + value + "</td></tr>");
                    });
                }
                container.append("<br />Properties");
                var prop = $('<table class="table table-bordered table-condensed">');
                container.append(prop);
                $.each(object, function(key, value) {
                    if (key === "metadata") {
                        return;
                    }
                    prop.append("<tr><td><strong>" + key + "</strong></td><td>" + value + "</td></tr>");
                });
                modal.setContent(container);
                modal.show({
                    backdrop: true
                });
            }
            function workspaceObjectVersionClick(e) {
                var workspace = getWorkspaceFromId(String($(this).data("workspace"))), type = String($(this).data("type")), object = getWorkspaceObjectFromId(workspace, type, String($(this).data("id")));
                var hasHtml = type.match(/^(Genome|Model|Media|FBA|Annotation)$/) !== null ? true : false;
                var modal = new Modal();
                modal.setTitle($(this).data("id"));
                modal.setButtons(null, "Close");
                modal.on("submit", function() {
                    modal.hide();
                });
                modal.on("hidden", function() {
                    modal.delete();
                    modal = null;
                });
                var container = $("<div>");
                var openURL = workspaceObjectLink(workspace, type, object, "json");
                container.append('<a href="' + openURL + '" target="_blank">Open</a>');
                if (hasHtml) {
                    var htmlURL = workspaceObjectLink(workspace, type, object, "html");
                    container.append('<a href="' + htmlURL + '" target="_blank" style="margin-left: 50px;">View HTML</a>');
                }
                var meta = $('<table class="table table-bordered table-condensed">');
                container.append("<br />Metadata<br />", meta);
                if ($.isEmptyObject(object.metadata)) {
                    meta.append('<tr><td><div style="text-align: center">No metadata</div></td></tr>');
                } else {
                    $.each(object.metadata, function(key, value) {
                        meta.append("<tr><td><strong>" + key + "</strong></td><td>" + value + "</td></tr>");
                    });
                }
                container.append("<br />Properties");
                var prop = $('<table class="table table-bordered table-condensed">');
                container.append(prop);
                $.each(object, function(key, value) {
                    if (key === "metadata") {
                        return;
                    }
                    prop.append("<tr><td><strong>" + key + "</strong></td><td>" + value + "</td></tr>");
                });
                modal.setContent(container);
                modal.show({
                    backdrop: true
                });
            }
            function workspaceObjectLink(workspace, type, object, action) {
                return "/objects" + "/" + encodeURIComponent(workspace.id) + "/" + encodeURIComponent(type) + "/" + encodeURIComponent(object.id) + "." + action;
            }
            function State() {
                var ls;
                try {
                    ls = "localStorage" in window && window["localStorage"] !== null;
                } catch (e) {
                    ls = false;
                }
                this.get = function(key) {
                    if (!ls) {
                        return null;
                    }
                    var val = localStorage.getItem(key);
                    try {
                        val = JSON.parse(val);
                    } catch (e) {
                        return null;
                    }
                    return val;
                };
                this.set = function(key, val) {
                    if (!ls) {
                        return null;
                    }
                    try {
                        val = JSON.stringify(val);
                    } catch (e) {
                        return null;
                    }
                    return localStorage.setItem(key, val);
                };
            }
            function Modal() {
                var self = this;
                var modal = baseModal.clone();
                $("body").append(modal);
                var isLocked = false;
                modal.on("hide", function(e) {
                    if (isLocked) {
                        e.stopImmediatePropagation();
                        return false;
                    } else {
                        return true;
                    }
                });
                var alertRegex = /error|warning|info|success/;
                var btns = modal.find(".modal-footer").find("button");
                btns.eq(1).click(function() {
                    modal.trigger("submit");
                });
                this.setTitle = function(title) {
                    modal.find("modal-title").html(title);
                };
                this.setContent = function(content) {
                    modal.find(".modal-body").empty().append(content);
                };
                this.setButtons = function(cancel, submit) {
                    if (cancel === null) {
                        btns.eq(0).remove();
                    } else if (typeof cancel === "string") {
                        btns.eq(0).html(cancel);
                    }
                    if (submit === null) {
                        btns.eq(1).remove();
                    } else if (typeof submit === "string") {
                        btns.eq(1).html(submit);
                    }
                };
                this.on = function() {
                    modal.on.apply(modal, arguments);
                };
                this.off = function() {
                    modal.off.apply(modal, arguments);
                };
                this.show = function(options, width) {
                    modal.modal(options);
                };
                this.hide = function() {
                    modal.modal("hide");
                };
                this.delete = function() {
                    modal.modal("hide");
                    modal.remove();
                };
                this.lock = function() {
                    isLocked = true;
                    modal.find(".modal-header").find("button").prop("disabled", true);
                    btns.prop("disabled", true);
                };
                this.unlock = function() {
                    isLocked = false;
                    modal.find(".modal-header").find("button").prop("disabled", false);
                    btns.prop("disabled", false);
                };
                this.cover = function(content) {
                    modal.find(".base-modal-cover-box").removeClass().addClass("base-modal-cover-box base-modal-cover-content").empty().append(content);
                    modal.find(".modal-body").fadeTo(0, .3);
                    modal.find(".base-modal-cover").height(modal.find(".modal-body").outerHeight()).width(modal.find(".modal-body").outerWidth()).removeClass("hide");
                };
                this.uncover = function() {
                    modal.find(".base-modal-cover").addClass("hide");
                    modal.find(".modal-body").fadeTo(0, 1);
                };
                this.alert = function(message, type) {
                    type = alertRegex.test(type) ? "alert-" + type : "";
                    modal.find(".base-modal-alert").removeClass("hide alert-error alert-info alert-success").addClass(type).empty().append(message);
                };
                this.alertHide = function() {
                    modal.find(".base-modal-alert").addClass("hide");
                };
                this.coverAlert = function(message, type) {
                    type = alertRegex.test(type) ? "alert-" + type : "";
                    this.cover(message);
                    modal.find(".base-modal-cover-box").removeClass().addClass("base-modal-cover-box alert " + type);
                };
                this.coverAlertHide = function() {
                    this.uncover();
                };
                this.focus = function() {
                    modal.focus();
                };
                this.submit = function() {
                    modal.trigger("submit");
                };
            }
            var baseModal = $('<div class="modal base-modal">                <div class="modal-dialog">                 <div class="modal-content">                   <div class="modal-header">                      <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>                      <h3 class="modal-title">Modal</h3>                    </div>                    <div class="alert base-modal-alert hide"></div>                    <div class="base-modal-cover hide">                      <div class="base-modal-cover-table">                        <div class="base-modal-cover-cell">                          <span class="base-modal-cover-box">                          </span>                        </div>                      </div>                    </div>                    <div class="modal-body"></div>                    <div class="modal-footer">                      <button data-dismiss="modal" class="btn">Cancel</button>                      <button class="btn btn-primary">Submit</button>                    </div>                  </div>               </div>             </div>');
            function extendDefaults() {
                $.extend(true, $.fn.dataTable.defaults, {
                    sDom: "<'row'<'col-md-12 obj-opts'f>r>t<'row'<'col-md-6'il><'col-md-6'p>>",
                    sPaginationType: "bootstrap",
                    oLanguage: {
                        sLengthMenu: "_MENU_ records per page"
                    }
                });
                $.extend($.fn.dataTableExt.oStdClasses, {
                    sWrapper: "dataTables_wrapper form-inline"
                });
                $.fn.dataTableExt.oApi.fnPagingInfo = function(oSettings) {
                    return {
                        iStart: oSettings._iDisplayStart,
                        iEnd: oSettings.fnDisplayEnd(),
                        iLength: oSettings._iDisplayLength,
                        iTotal: oSettings.fnRecordsTotal(),
                        iFilteredTotal: oSettings.fnRecordsDisplay(),
                        iPage: Math.ceil(oSettings._iDisplayStart / oSettings._iDisplayLength),
                        iTotalPages: Math.ceil(oSettings.fnRecordsDisplay() / oSettings._iDisplayLength)
                    };
                };
                $.extend($.fn.dataTableExt.oPagination, {
                    bootstrap: {
                        fnInit: function(oSettings, nPaging, fnDraw) {
                            var oLang = oSettings.oLanguage.oPaginate;
                            var fnClickHandler = function(e) {
                                e.preventDefault();
                                if (oSettings.oApi._fnPageChange(oSettings, e.data.action)) {
                                    fnDraw(oSettings);
                                }
                            };
                            $(nPaging).addClass("pagination").append('<ul class="pagination">' + '<li class="prev disabled"><a href="#">&larr; ' + oLang.sPrevious + "</a></li>" + '<li class="next disabled"><a href="#">' + oLang.sNext + " &rarr; </a></li>" + "</ul>");
                            var els = $("a", nPaging);
                            $(els[0]).bind("click.DT", {
                                action: "previous"
                            }, fnClickHandler);
                            $(els[1]).bind("click.DT", {
                                action: "next"
                            }, fnClickHandler);
                        },
                        fnUpdate: function(oSettings, fnDraw) {
                            var iListLength = 5;
                            var oPaging = oSettings.oInstance.fnPagingInfo();
                            var an = oSettings.aanFeatures.p;
                            var i, j, sClass, iStart, iEnd, iHalf = Math.floor(iListLength / 2);
                            if (oPaging.iTotalPages < iListLength) {
                                iStart = 1;
                                iEnd = oPaging.iTotalPages;
                            } else if (oPaging.iPage <= iHalf) {
                                iStart = 1;
                                iEnd = iListLength;
                            } else if (oPaging.iPage >= oPaging.iTotalPages - iHalf) {
                                iStart = oPaging.iTotalPages - iListLength + 1;
                                iEnd = oPaging.iTotalPages;
                            } else {
                                iStart = oPaging.iPage - iHalf + 1;
                                iEnd = iStart + iListLength - 1;
                            }
                            for (i = 0, iLen = an.length; i < iLen; i++) {
                                $("li:gt(0)", an[i]).filter(":not(:last)").remove();
                                for (j = iStart; j <= iEnd; j++) {
                                    sClass = j == oPaging.iPage + 1 ? 'class="active"' : "";
                                    $("<li " + sClass + '><a href="#">' + j + "</a></li>").insertBefore($("li:last", an[i])[0]).bind("click", function(e) {
                                        e.preventDefault();
                                        oSettings._iDisplayStart = (parseInt($("a", this).text(), 10) - 1) * oPaging.iLength;
                                        fnDraw(oSettings);
                                    });
                                }
                                if (oPaging.iPage === 0) {
                                    $("li:first", an[i]).addClass("disabled");
                                } else {
                                    $("li:first", an[i]).removeClass("disabled");
                                }
                                if (oPaging.iPage === oPaging.iTotalPages - 1 || oPaging.iTotalPages === 0) {
                                    $("li:last", an[i]).addClass("disabled");
                                } else {
                                    $("li:last", an[i]).removeClass("disabled");
                                }
                            }
                        }
                    }
                });
            }
            function get_fba_model_id(ws_id) {
                var pos = ws_id.indexOf("fba.");
                var ws_id = ws_id.slice(0, ws_id.indexOf(".", pos - 4));
                return ws_id;
            }
            return this;
        }
    });
})(jQuery);

(function($, undefined) {
    $.KBWidget({
        name: "kbaseWSSelector",
        version: "1.0.0",
        options: {},
        init: function(options) {
            this._super(options);
            var self = this;
            var user = {};
            user["token"] = options.userToken;
            var state = new State();
            var selectHandler = options.selectHandler;
            var wsHandler = new WSHandler({
                user: user
            });
            var wsRows = [], wsFiltRows = [], workspaceIdToRow = {}, selected = [], lastSelectedRow = null, lastShiftSelect = null, container = self.$elem;
            wsHandler.getWorkspaces().done(handleGetWorkspaces).fail(handleGetWorkspacesError);
            self.workspaces;
            function handleGetWorkspaces(allWorkspaces) {
                self.workspaces = allWorkspaces;
                workspaces = self.workspaces;
                extendWorkspaceArray();
                workspaces.mysort();
                self.onselect(selectHandler);
                self.reload();
                self.resizeTable();
                workspaces.onchange(function() {
                    self.reload();
                });
            }
            function handleGetWorkspacesError(error) {
                console.log("Error: ", error);
            }
            function extendWorkspaceArray() {
                var callback = $.Callbacks();
                workspaces.add = function(workspace) {
                    workspaces.push(workspace);
                    workspaces.mysort();
                    callback.fire();
                };
                workspaces.remove = function(workspace) {
                    var index = $.inArray(workspace, workspaces);
                    workspaces.splice(index, 1);
                    callback.fire();
                };
                workspaces.replace = function(workspace, newWorkspace) {
                    var index = $.inArray(workspace, workspaces);
                    workspaces.splice(index, 1, newWorkspace);
                    callback.fire();
                };
                workspaces.mysort = function() {
                    workspaces.sort(function(a, b) {
                        if (a.isOwned) {
                            if (!b.isOwned) {
                                return -1;
                            }
                        } else if (b.isOwned) {
                            if (!a.isOwned) {
                                return 1;
                            }
                        }
                        var aId = a.id.toLowerCase();
                        var bId = b.id.toLowerCase();
                        if (aId < bId) {
                            return -1;
                        } else if (aId === bId) {
                            return 0;
                        } else {
                            return 1;
                        }
                    });
                };
                workspaces.onchange = function(cb) {
                    callback.add(cb);
                };
            }
            filterCollapse = $(filterCollapseHtml());
            filterCollapse.find("#create-workspace").click(function(e) {
                e.stopImmediatePropagation();
                createWorkspaceModal();
                return false;
            });
            var resizeInt = null;
            filterCollapse.find(".collapse").on("shown", function() {
                resizeTable();
                state.set("filter-open", true);
                filterCollapse.find(".caret").removeClass().addClass("caret-up");
                filterCollapse.find("input").removeAttr("tabindex");
                window.clearInterval(resizeInt);
                resizeInt = null;
            }).on("hidden", function() {
                resizeTable();
                state.set("filter-open", false);
                filterCollapse.find(".caret-up").removeClass().addClass("caret");
                filterCollapse.find("input").attr("tabindex", "-1");
                window.clearInterval(resizeInt);
                resizeInt = null;
            }).on("show hide", function() {
                resizeInt = window.setInterval(function() {
                    resizeTable();
                }, 1e3 / 50);
            });
            filterCollapse.find("button").click(function() {
                if (filterCollapse.find(".collapse").length) {
                    filterCollapse.find(".collapse").collapse("toggle");
                } else {
                    filterCollapse.find("#collapseOne").collapse("toggle");
                }
            });
            var filterOpen = state.get("filter-open");
            if (filterOpen) {
                filterCollapse.find(".collapse").addClass("in");
            }
            var filterOwner = filterCollapse.find("#ws-filter-owner").change(filter);
            var filterAdmin = filterCollapse.find("#ws-filter-admin").change(filter);
            var filterWrite = filterCollapse.find("#ws-filter-write").change(filter);
            var filterRead = filterCollapse.find("#ws-filter-read").change(filter);
            container.append(filterCollapse);
            var filterSearch = $('<form role="form"><input type="text" class="form-control search-query"             placeholder="Filter Workspaces"></form');
            container.append(filterSearch);
            var filterSearch = filterSearch.find("input");
            filterSearch.keyup(filter);
            var prevFilter = state.get("filter");
            if (prevFilter !== null) {
                filterOwner.prop("checked", prevFilter.owner);
                filterAdmin.prop("checked", prevFilter.admin);
                filterWrite.prop("checked", prevFilter.write);
                filterRead.prop("checked", prevFilter.read);
                filterSearch.val(prevFilter.search);
            } else {
                filterOwner.prop("checked", false);
                filterAdmin.prop("checked", true);
                filterWrite.prop("checked", true);
                filterRead.prop("checked", true);
            }
            var tableDiv = $('<div id="ws-table-div" tabindex="0">');
            container.append(tableDiv);
            var table = $('<table id="ws-table" class="table table-bordered table-condensed">');
            tableDiv.append(table);
            tableDiv.click(function() {
                tableDiv.focus();
            });
            tableDiv.keydown(tableKey);
            var callback = $.Callbacks();
            this.getHtml = function() {
                return container;
            };
            this.onselect = function(cb) {
                callback.add(cb);
                var ws = [];
                for (var i = 0; i < selected.length; i++) {
                    ws.push(selected[i].getWorkspace());
                }
            };
            this.setLoaded = function(workspace) {
                var wsRow = workspaceIdToRow[workspace.id];
                if (wsRow) {
                    wsRow.loaded();
                }
            };
            this.reload = reload;
            this.resizeTable = resizeTable;
            function resizeTable() {
                tableDiv.css("top", filterCollapse.outerHeight(true) + filterSearch.outerHeight(true) + "px");
            }
            var initialized = false;
            function reload() {
                table.empty();
                var infoRow = $('<tr id="ws-info-row">');
                table.append(infoRow);
                var infoCell = $("<td>");
                infoRow.append(infoCell);
                var saveSelected = {};
                if (initialized) {
                    for (var i = 0; i < selected.length; i++) {
                        saveSelected[selected[i].getWorkspace().id] = true;
                    }
                } else {
                    var ids = state.get("selected");
                    if ($.type(ids) === "array") {
                        for (var i = 0; i < ids.length; i++) {
                            saveSelected[ids[i]] = true;
                        }
                    }
                }
                workspaceIdToRow = {};
                var newSelected = [];
                var newRows = [];
                for (var i = 0; i < workspaces.length; i++) {
                    var workspace = workspaces[i];
                    var wsRow = new WorkspaceRow(workspace);
                    if (saveSelected[workspace.id]) {
                        newSelected.push(wsRow);
                    }
                    table.append(wsRow.getHtml());
                    newRows.push(wsRow);
                    workspaceIdToRow[workspace.id] = wsRow;
                }
                selected = newSelected;
                wsRows = newRows;
                filter();
            }
            function select(wsRows) {
                for (var i = 0; i < selected.length; i++) {
                    selected[i].unselect();
                }
                var ws = [], ids = [];
                for (var i = 0; i < wsRows.length; i++) {
                    var wsRow = wsRows[i];
                    var workspace = wsRow.getWorkspace();
                    ws.push(workspace);
                    ids.push(workspace.id);
                    wsRow.select();
                }
                selected = wsRows;
                state.set("selected", ids);
                callback.fire(ws);
            }
            function getRowPosition(wsRow) {
                return $.inArray(wsRow, wsFiltRows);
            }
            function getPrevious(wsRow) {
                var ind = getRowPosition(wsRow);
                if (ind > 0) {
                    return wsFiltRows[ind - 1];
                } else {
                    return null;
                }
            }
            function getNext(wsRow) {
                var ind = getRowPosition(wsRow);
                if (ind < wsFiltRows.length - 1) {
                    return wsFiltRows[ind + 1];
                } else {
                    return null;
                }
            }
            function wsRowClick(e, wsRow) {
                if (e.ctrlKey || e.metaKey) {
                    var ind = $.inArray(wsRow, selected);
                    var newSelected = selected.slice();
                    if (ind > -1) {
                        newSelected.splice(ind, 1);
                    } else {
                        newSelected.push(wsRow);
                    }
                    lastSelectedRow = wsRow;
                    lastShiftSelect = null;
                    select(newSelected);
                } else if (e.shiftKey) {
                    if (lastSelectedRow === null) {
                        lastSelectedRow = wsRow;
                    }
                    var i0 = getRowPosition(lastSelectedRow);
                    var i1 = getRowPosition(wsRow);
                    var dir;
                    var last;
                    if (i0 === i1) {
                        dir = "none";
                        last = i0;
                    } else if (i0 > i1) {
                        dir = "up";
                        last = i1;
                        var t = i0;
                        i0 = i1;
                        i1 = t;
                    } else {
                        dir = "down";
                        last = i1;
                    }
                    lastShiftSelect = {
                        dir: dir,
                        last: wsFiltRows[last]
                    };
                    var newSelected = [];
                    for (var i = i0; i <= i1; i++) {
                        newSelected.push(wsFiltRows[i]);
                    }
                    select(newSelected);
                } else {
                    lastSelectedRow = wsRow;
                    lastShiftSelect = null;
                    select([ wsRow ]);
                }
            }
            function tableKey(e) {
                if ((e.ctrlKey || e.metaKey) && e.which == 65) {
                    select(wsFiltRows);
                    return false;
                }
                if (e.keyCode === 38) {
                    if ((lastShiftSelect ? getRowPosition(lastShiftSelect.last) : getRowPosition(lastSelectedRow)) === 0) {
                        return false;
                    }
                    if (e.shiftKey) {
                        if (lastSelectedRow === null) {
                            lastSelectedRow = wsFiltRows[wsFiltRows.length - 1];
                        }
                        if (lastShiftSelect === null) {
                            lastShiftSelect = {
                                dir: "none",
                                last: lastSelectedRow
                            };
                        }
                        var prev;
                        if (lastShiftSelect.dir === "down") {
                            prev = lastShiftSelect.last;
                        } else {
                            prev = getPrevious(lastShiftSelect.last);
                        }
                        if (prev !== null) {
                            var newSelected = selected.slice();
                            if (getRowPosition(lastShiftSelect.last) <= getRowPosition(lastSelectedRow)) {
                                if ($.inArray(prev, newSelected) < 0) {
                                    newSelected.push(prev);
                                }
                            } else if (prev === lastSelectedRow) {
                                prev = getPrevious(prev);
                                newSelected.push(prev);
                            } else {
                                newSelected.splice($.inArray(prev, newSelected), 1);
                            }
                            lastShiftSelect = {
                                dir: "up",
                                last: prev
                            };
                            select(newSelected);
                            return false;
                        }
                    } else {
                        var prev;
                        if (lastSelectedRow === null) {
                            prev = wsFiltRows[wsFiltRows.length - 1];
                        } else if (lastShiftSelect !== null) {
                            prev = getPrevious(lastShiftSelect.last);
                        } else {
                            prev = getPrevious(lastSelectedRow);
                        }
                        if (prev !== null) {
                            lastSelectedRow = prev;
                            lastShiftSelect = null;
                            select([ prev ]);
                            return false;
                        }
                    }
                } else if (e.keyCode === 40) {
                    if ((lastShiftSelect ? getRowPosition(lastShiftSelect.last) : getRowPosition(lastSelectedRow)) === wsFiltRows.length - 1) {
                        return false;
                    }
                    if (e.shiftKey) {
                        if (lastSelectedRow === null) {
                            lastSelectedRow = wsFiltRows[0];
                        }
                        if (lastShiftSelect === null) {
                            lastShiftSelect = {
                                dir: "none",
                                last: lastSelectedRow
                            };
                        }
                        var next;
                        if (lastShiftSelect.dir === "up") {
                            next = lastShiftSelect.last;
                        } else {
                            next = getNext(lastShiftSelect.last);
                        }
                        if (next !== null) {
                            var newSelected = selected.slice();
                            if (getRowPosition(lastShiftSelect.last) >= getRowPosition(lastSelectedRow)) {
                                if ($.inArray(next, newSelected) < 0) {
                                    newSelected.push(next);
                                }
                            } else if (next === lastSelectedRow) {
                                next = getNext(next);
                                newSelected.push(next);
                            } else {
                                newSelected.splice($.inArray(next, newSelected), 1);
                            }
                            lastShiftSelect = {
                                dir: "down",
                                last: next
                            };
                            select(newSelected);
                            return false;
                        }
                    } else {
                        var next;
                        if (lastSelectedRow === null) {
                            next = wsFiltRows[0];
                        } else if (lastShiftSelect !== null) {
                            next = getNext(lastShiftSelect.last);
                        } else {
                            next = getNext(lastSelectedRow);
                        }
                        if (next !== null) {
                            lastSelectedRow = next;
                            lastShiftSelect = null;
                            select([ next ]);
                            return false;
                        }
                    }
                }
                return true;
            }
            function scrollIntoView(dir, wsRow) {
                var ind = $.inArray(wsRow, wsFiltRows);
                if (ind < 0) {
                    return;
                }
                var height = wsRow.getHtml().height();
                var start = ind * height + 1;
                var end = start + height;
                var scrollStart = tableDiv.scrollTop();
                var scrollEnd = scrollStart + tableDiv.height();
                if (start >= scrollStart && end <= scrollEnd) {
                    return;
                }
                if (dir === "down") {
                    if (Math.abs(start - scrollEnd) <= height) {
                        wsRow.getHtml().get(0).scrollIntoView(false);
                        return;
                    }
                } else if (dir === "up") {
                    if (Math.abs(end - scrollStart) <= height) {
                        wsRow.getHtml().get(0).scrollIntoView(true);
                        return;
                    }
                }
                tableDiv.scrollTop(start - (scrollEnd - scrollStart - height) / 2);
            }
            function filter() {
                var owner = filterOwner.prop("checked");
                var admin = filterAdmin.prop("checked");
                var write = filterWrite.prop("checked");
                var read = filterRead.prop("checked");
                var search = filterSearch.val();
                state.set("filter", {
                    owner: owner,
                    admin: admin,
                    write: write,
                    read: read,
                    search: search
                });
                if (wsRows.length === 0) {
                    table.find("#ws-info-row").removeClass("hide").find("td").html("no workspaces");
                    return;
                }
                var searchRegex = new RegExp(search, "i");
                wsFiltRows = [];
                for (var i = 0; i < wsRows.length; i++) {
                    var wsRow = wsRows[i];
                    var workspace = wsRow.getWorkspace();
                    var show = false;
                    if (admin && workspace.user_permission === "a") {
                        show = true;
                    }
                    if (write && workspace.user_permission === "w") {
                        show = true;
                    }
                    if (read && workspace.user_permission === "r") {
                        show = true;
                    }
                    if (show && owner && !workspace.isOwned) {
                        show = false;
                    }
                    if (show && search != "") {
                        show = searchRegex.test(workspace.id);
                    }
                    if (show) {
                        wsRow.show();
                        wsFiltRows.push(wsRow);
                    } else {
                        var ind = $.inArray(wsRow, selected);
                        if (ind > -1) {
                            wsRow.unselect();
                            selected.splice(ind, 1);
                        }
                        wsRow.hide();
                    }
                }
                if (wsFiltRows.length === 0) {
                    table.find("#ws-info-row").removeClass("hide").find("td").html("no workspaces (change filters)");
                } else {
                    table.find("#ws-info-row").addClass("hide");
                }
                select(selected);
            }
            function filterCollapseHtml() {
                return "" + '<div class="accordion" style="margin-bottom: 0px;">' + '<div class="accordion-group">' + '<div class="accordion-heading" style="text-align: center;">' + '<button class="btn btn-link" title="Filter Workspaces">' + 'Workspaces <span class="caret"></span>' + "</button>" + '<button type="button" id="create-workspace" class="btn btn-default btn-xs  pull-right">' + '<span title="Create new workspace">+</span>' + "</button>" + "</div>" + '<div id="collapseOne" class="accordion-body collapse">' + '<div class="accordion-inner">' + '<div class="pull-left" style="position: relative; margin-right: 10px; height: 75px;">' + '<div style="display: table; position: static; height: 100%;">' + '<div style="display: table-cell; vertical-align: middle; position: static">' + '<label class="checkbox"><input id="ws-filter-owner" type="checkbox" tabindex="-1" /> owner</label>' + '</div></div></div><div class="pull-left">' + '<label class="checkbox"><input id="ws-filter-admin" type="checkbox" tabindex="-1" /> admin</label>' + '<label class="checkbox"><input id="ws-filter-write" type="checkbox" tabindex="-1" /> write</label>' + '<label class="checkbox"><input id="ws-filter-read" type="checkbox" tabindex="-1" /> read</label>' + '</div><div class="clearfix"></div>' + "</div></div></div></div>";
            }
            function WorkspaceRow(workspace) {
                var self = this;
                var row = $('<tr class="ws-row">');
                var cell = $('<td class="ws-cell">');
                row.append(cell);
                var div = $('<div class="ws-cell-content">');
                cell.append(div);
                div.append('<span class="ws-num-objects badge">~ ' + workspace.objects + "</span>");
                div.append(workspace.isOwned ? "<strong>" + workspace.id + "</strong>" : workspace.id);
                cell.mousedown(function() {
                    return false;
                });
                cell.click(function(e) {
                    wsRowClick(e, self);
                });
                var manage = $('<button type="button" class="ws-cell-manage btn btn-default btn-sm hide"' + ' title="Manage Workspace"><span class="glyphicon glyphicon-cog"></span></button>');
                div.append(manage);
                manage.click(function() {
                    manageWorkspaceModal(workspace);
                    return false;
                });
                if ($.type(workspace.objectData) === "array") {
                    loaded();
                }
                cell.hover(function() {
                    manage.removeClass("hide");
                    div.addClass("ws-cell-content-hover");
                }, function() {
                    manage.addClass("hide");
                    div.removeClass("ws-cell-content-hover");
                });
                this.getHtml = function() {
                    return row;
                };
                this.select = function() {
                    cell.addClass("ws-cell-selected");
                };
                this.unselect = function() {
                    cell.removeClass("ws-cell-selected");
                };
                this.hide = function() {
                    row.addClass("hide");
                };
                this.show = function() {
                    row.removeClass("hide");
                };
                this.getWorkspace = function() {
                    return workspace;
                };
                this.loaded = loaded;
                function loaded() {
                    div.find(".badge").addClass("badge-success").html(workspace.objectData.length);
                }
            }
            function manageWorkspaceSave(workspace, modal) {
                var container = $(".manage-workspace");
                var existingPerms = container.find(".manage-existing-perm");
                var newPerms = container.find(".manage-new-perm");
                var error = false;
                newPerms.find("input").each(function(i, el) {
                    $(el).parent().removeClass("control-group error");
                    if ($(el).val() === "") {
                        modal.alert("Username canot be empty", "error");
                        $(el).parent().addClass("control-group error");
                        $(el).focus();
                        error = true;
                        return false;
                    }
                    if (!validateString($(el).val())) {
                        modal.alert("Invalid username<br />(alphanumeric characters only)", "error");
                        $(el).parent().addClass("control-group error");
                        $(el).focus().select();
                        error = true;
                        return false;
                    }
                    return true;
                });
                if (error) {
                    return;
                }
                var globalPerm = $("#global-perm");
                var newGlobalPerm = globalPerm.find("option").filter(":selected").val();
                if (globalPerm.data("value") === newGlobalPerm) {
                    newGlobalPerm = null;
                }
                var userPerms = {};
                existingPerms.each(function(i, el) {
                    var user = $(el).find("td").eq(0).html();
                    var perm = $(el).find("option").filter(":selected").val();
                    userPerms[user] = perm;
                });
                newPerms.each(function(i, el) {
                    var user = $(el).find("input").val();
                    var perm = $(el).find("option").filter(":selected").val();
                    userPerms[user] = perm;
                });
                var same = true;
                $.each(workspace.permissions, function(k, v) {
                    if (userPerms[k] !== v) {
                        same = false;
                    }
                });
                $.each(userPerms, function(k, v) {
                    if (workspace.permissions[k] !== v) {
                        same = false;
                    }
                });
                if (newGlobalPerm === null && same) {
                    modal.alert("No changes to submit", "info");
                    return;
                }
                modal.alertHide();
                modal.focus();
                $(".modal-body").find("input,select,button").attr("tabindex", "-1");
                var promises = [];
                if (newGlobalPerm !== null) {
                    var p = workspace.setGlobalPermission(newGlobalPerm);
                    promises.push(p);
                }
                if (!same) {
                    var p = workspace.setWorkspacePermissions(userPerms);
                    promises.push(p);
                }
                modal.lock();
                modal.cover('<img src="assets/img/loading.gif" />');
                $.when.apply($, promises).done(function() {
                    modal.coverAlert("<strong>Success</strong><br />Changed workspace permissions", "success");
                }).fail(function() {
                    modal.coverAlert("<strong>Error</strong><br />Failed to change workspace permissions", "error");
                }).always(function() {
                    modal.setButtons(null, "Close");
                    modal.off("submit");
                    modal.on("submit", function() {
                        modal.hide();
                    });
                    modal.unlock();
                });
            }
            function createWorkspaceModal() {
                var modal = new Modal();
                modal.setTitle("Create Workspace");
                modal.setContent('<table style="margin-left: auto; margin-right: auto; text-align: right;">' + "<tr><td>Workspace Id:</td>" + '<td><input type="text" id="create-id" class="form-control" style="width: 150px" /></td></tr>' + "<tr><td>Global Permission:</td>" + "<td>" + createPermissionSelect("create-permission", "n") + "</td></tr></table>");
                $("#create-permission").css({
                    width: "164px"
                });
                modal.on("hidden", function() {
                    modal.delete();
                });
                $("#create-id").keypress(function(e) {
                    if (e.which == 13) {
                        modal.submit();
                    }
                });
                modal.setButtons("Cancel", "Create");
                modal.on("submit", function() {
                    createWorkspace(modal);
                });
                modal.show();
                $("#create-id").focus();
            }
            function Modal() {
                var self = this;
                var modal = baseModal.clone();
                $("body").append(modal);
                var isLocked = false;
                modal.on("hide", function(e) {
                    if (isLocked) {
                        e.stopImmediatePropagation();
                        return false;
                    } else {
                        return true;
                    }
                });
                var alertRegex = /error|warning|info|success/;
                var btns = modal.find(".modal-footer").find("button");
                btns.eq(1).click(function() {
                    modal.trigger("submit");
                });
                this.setTitle = function(title) {
                    modal.find("modal-title").html(title);
                };
                this.setContent = function(content) {
                    modal.find(".modal-body").empty().append(content);
                };
                this.setButtons = function(cancel, submit) {
                    if (cancel === null) {
                        btns.eq(0).remove();
                    } else if (typeof cancel === "string") {
                        btns.eq(0).html(cancel);
                    }
                    if (submit === null) {
                        btns.eq(1).remove();
                    } else if (typeof submit === "string") {
                        btns.eq(1).html(submit);
                    }
                };
                this.on = function() {
                    modal.on.apply(modal, arguments);
                };
                this.off = function() {
                    modal.off.apply(modal, arguments);
                };
                this.show = function(options, width) {
                    modal.modal(options);
                };
                this.hide = function() {
                    modal.modal("hide");
                };
                this.delete = function() {
                    modal.modal("hide");
                    modal.remove();
                };
                this.lock = function() {
                    isLocked = true;
                    modal.find(".modal-header").find("button").prop("disabled", true);
                    btns.prop("disabled", true);
                };
                this.unlock = function() {
                    isLocked = false;
                    modal.find(".modal-header").find("button").prop("disabled", false);
                    btns.prop("disabled", false);
                };
                this.cover = function(content) {
                    modal.find(".base-modal-cover-box").removeClass().addClass("base-modal-cover-box base-modal-cover-content").empty().append(content);
                    modal.find(".modal-body").fadeTo(0, .3);
                    modal.find(".base-modal-cover").height(modal.find(".modal-body").outerHeight()).width(modal.find(".modal-body").outerWidth()).removeClass("hide");
                };
                this.uncover = function() {
                    modal.find(".base-modal-cover").addClass("hide");
                    modal.find(".modal-body").fadeTo(0, 1);
                };
                this.alert = function(message, type) {
                    type = alertRegex.test(type) ? "alert-" + type : "";
                    modal.find(".base-modal-alert").removeClass("hide alert-error alert-info alert-success").addClass(type).empty().append(message);
                };
                this.alertHide = function() {
                    modal.find(".base-modal-alert").addClass("hide");
                };
                this.coverAlert = function(message, type) {
                    type = alertRegex.test(type) ? "alert-" + type : "";
                    this.cover(message);
                    modal.find(".base-modal-cover-box").removeClass().addClass("base-modal-cover-box alert " + type);
                };
                this.coverAlertHide = function() {
                    this.uncover();
                };
                this.focus = function() {
                    modal.focus();
                };
                this.submit = function() {
                    modal.trigger("submit");
                };
            }
            var baseModal = $('<div class="modal base-modal">            <div class="modal-dialog">             <div class="modal-content">               <div class="modal-header">                  <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>                  <h3 class="modal-title">Modal</h3>                </div>                <div class="alert base-modal-alert hide"></div>                <div class="base-modal-cover hide">                  <div class="base-modal-cover-table">                    <div class="base-modal-cover-cell">                      <span class="base-modal-cover-box">                      </span>                    </div>                  </div>                </div>                <div class="modal-body"></div>                <div class="modal-footer">                  <button data-dismiss="modal" class="btn">Cancel</button>                  <button class="btn btn-primary">Submit</button>                </div>              </div>           </div>         </div>');
            function createPermissionSelect(id, value, noNone) {
                var sel = ' selected="selected"';
                var idval = ' id="' + id + '"';
                return "<select" + (id ? idval : "") + ' class="input-small form-control"' + ' style="margin: 0px;" data-value="' + value + '">' + (noNone ? "" : '<option value="n"' + (value === "n" ? sel : "") + ">none</option>") + '<option value="r"' + (value === "r" ? sel : "") + ">read</option>" + '<option value="w"' + (value === "w" ? sel : "") + ">write</option>" + '<option value="a"' + (value === "a" ? sel : "") + ">admin</option>" + "</select>";
            }
            function permToReadable(value) {
                var map = {
                    n: "none",
                    r: "read",
                    w: "write",
                    a: "admin"
                };
                return map[value];
            }
            function manageWorkspaceModal(workspace) {
                var modal = new Modal();
                modal.setTitle("Manage Workspace");
                modal.show(null, "350px");
                if ((workspace.isOwned || workspace.user_permission === "a") && $.type(workspace.permissions) === "undefined") {
                    modal.lock();
                    modal.setContent('<div style="height: 250px; text-align: center; margin-top: 30px;">' + '<img src="assets/img/loading.gif" /><br />Loading...' + "</div>");
                    workspace.getPermissions().done(function() {
                        populateModal();
                        modal.unlock();
                    });
                } else {
                    populateModal();
                }
                function populateModal() {
                    var container = $('<div class="manage-workspace">');
                    var table = $('<table class="table table-bordered table-condensed">');
                    container.append(table);
                    modal.setContent(container);
                    var perm;
                    if (workspace.isOwned || workspace.user_permission === "a") {
                        perm = createPermissionSelect("global-perm", workspace.global_permission);
                    } else {
                        perm = permToReadable(workspace.global_permission);
                    }
                    var data = [ [ "Id", workspace.id ], [ "Objects", $.type(workspace.objectData) === "array" ? workspace.objectData.length : "~ " + workspace.objects ], [ "Owner", workspace.owner ], [ "Permission", permToReadable(workspace.user_permission) ], [ "Global Permission", perm ] ];
                    for (var i = 0; i < data.length; i++) {
                        var row = $("<tr>");
                        row.append('<td class="manage-modal-attribute"><strong>' + data[i][0] + "</strong></td>" + '<td class="manage-modal-value">' + data[i][1] + "</td>");
                        table.append(row);
                    }
                    if (workspace.isOwned || workspace.user_permission === "a") {
                        var perms = [];
                        $.each(workspace.permissions, function(user, perm) {
                            if (perm !== "n") {
                                perms.push([ user, perm ]);
                            }
                        });
                        var userTable = $('<table class="table table-bordered table-condensed">');
                        var noPermRow = $('<tr><td colspan="3" style="text-align: center;">None</td></tr>');
                        userTable.append(noPermRow);
                        if (perms.length > 0) {
                            noPermRow.addClass("hide");
                            for (var i = 0; i < perms.length; i++) {
                                var perm = perms[i];
                                userTable.append('<tr class="manage-existing-perm"><td style="width: 100%">' + perm[0] + "</td>" + "<td>" + createPermissionSelect(null, perm[1], true) + "</td>" + '<td style="vertical-align: middle;">' + '<button type="button" class="close" aria-hidden="true">&times;</button>' + "</td></tr>");
                            }
                        }
                        var addPerm = $('<button class="btn btn-link">(add)</button>');
                        addPerm.click(function() {
                            noPermRow.addClass("hide");
                            userTable.append('<tr class="manage-new-perm"><td>' + '<input type="text" class="form-control input-medium" style="margin: 0px;" placeholder="username" />' + "</td><td>" + createPermissionSelect(null, null, true) + "</td>" + '<td style="vertical-align: middle;">' + '<button type="button" class="close" aria-hidden="true">&times;</button>' + "</td></tr>");
                            var inputs = userTable.find("input");
                            inputs.eq(inputs.length - 1).focus().keypress(function(e) {
                                if (e.which == 13) {
                                    modal.submit();
                                }
                            });
                        });
                        userTable.on("click", ".close", function() {
                            $(this).parent().parent().remove();
                            if (userTable.find("tr").length === 1) {
                                noPermRow.removeClass("hide");
                            }
                        });
                        var title = $("<div>User Permissions </div>");
                        title.append(addPerm);
                        container.append(title);
                        container.append(userTable);
                    }
                    modal.on("hidden", function() {
                        modal.delete();
                    });
                    var clone = $('<button class="btn btn-link">Clone</button>');
                    clone.click(function() {
                        cloneWorkspace(workspace, modal);
                    });
                    if (workspace.isOwned) {
                        var del = $('<button class="btn btn-link">Delete</button>');
                        del.click(function() {
                            deleteWorkspace(workspace, modal);
                        });
                        var left = $('<div class="pull-left"></div>');
                        left.append(clone);
                        var right = $('<div class="pull-right"></div>');
                        right.append(del);
                        container.append(left).append(right).append('<div class="clearfix"></div>');
                    } else {
                        container.append(clone);
                    }
                    if (workspace.isOwned || workspace.user_permission === "a") {
                        modal.setButtons("Cancel", "Save");
                        modal.on("submit", function() {
                            manageWorkspaceSave(workspace, modal);
                        });
                    } else {
                        modal.setButtons(null, "Close");
                        modal.on("submit", function() {
                            modal.hide();
                        });
                    }
                }
            }
            function cloneWorkspace(workspace, manageModal) {
                var modal = new Modal();
                modal.setTitle("Clone Workspace");
                modal.setContent('<div><h4 style="margin-top: 0px;">' + workspace.id + "</h4>" + '<table style="margin-left: auto; margin-right: auto; text-align: right; width: 300px;">' + '<tr style="height: 42px;"><td style="width: 100%;">Clone into:</td>' + '<td style="padding-right: 30px;">' + '<label class="radio inline" style="padding-right: 5px; padding-top: 0px;">' + '<input id="new-input" type="radio" name="clone-into" value="new" checked />new' + '</label><label class="radio inline" style="padding-right: 5px; padding-top: 0px;">' + '<input id="existing-input" type="radio" name="clone-into" value="existing" />existing' + "</label></td></tr>" + "<tr><td>Workspace:</td>" + '<td id="clone-into-cell"></td></tr>' + '<tr id="clone-permission-row"><td>Global Permission:</td>' + "<td>" + createPermissionSelect("clone-permission", workspace.global_permission) + "</td></tr></table></div>");
                $("#clone-permission").css({
                    width: "164px"
                });
                var isNew = true, cell = $("#clone-into-cell"), newInput = $('<input type="text" id="clone-id" class="form-control" style="width: 150px" />'), existingInput = $('<select class="form-control hide" style="width: 164px">'), permRow = $("#clone-permission-row");
                cell.append(newInput).append(existingInput);
                $("#new-input").click(function() {
                    isNew = true;
                    existingInput.hide();
                    newInput.show();
                    permRow.show();
                });
                $("#existing-input").click(function() {
                    isNew = false;
                    newInput.hide();
                    permRow.hide();
                    existingInput.show();
                });
                newInput.keypress(function(e) {
                    if (e.which == 13) {
                        modal.submit();
                    }
                });
                for (var i = 0; i < workspaces.length; i++) {
                    var ws = workspaces[i];
                    if (ws === workspace) {
                        continue;
                    }
                    if (ws.user_permission === "a" || ws.user_permission === "w") {
                        existingInput.append('<option value="' + ws.id + '">' + ws.id + "</option>");
                    }
                }
                modal.on("hidden", function() {
                    manageModal.on("hidden", function() {
                        manageModal.delete();
                    });
                    modal.delete();
                    manageModal.show();
                });
                manageModal.off("hidden");
                manageModal.hide();
                modal.setButtons("Cancel", "Clone");
                modal.on("submit", function() {
                    var workspaceId, perm;
                    if (isNew) {
                        workspaceId = newInput.val();
                        if (workspaceId === "") {
                            modal.alert("Must enter a workspace id", "error");
                            newInput.focus();
                            return;
                        }
                        if (!validateString(workspaceId)) {
                            modal.alert("Invalid workspace id<br />(alphanumeric characters only)", "error");
                            newInput.focus().select();
                            return;
                        }
                        for (var i = 0; i < workspaces.length; i++) {
                            if (workspaceId === workspaces[i].id) {
                                modal.alert("Workspace already exists", "error");
                                newInput.focus().select();
                                return;
                            }
                        }
                        perm = permRow.find("option").filter(":selected").val();
                    } else {
                        workspaceId = existingInput.find("option").filter(":selected").val();
                    }
                    modal.alertHide();
                    modal.lock();
                    modal.cover('<img src="assets/img/loading.gif" /><br />This may take a while...');
                    workspace.clone(workspaceId, perm).done(function(newWorkspace) {
                        newWorkspace.getAllObjectsMeta().done(function(objects) {
                            newWorkspace.objectData = objects;
                            modal.coverAlert("<strong>Success</strong><br />" + "Cloned workspace into '" + newWorkspace.id + "'", "success");
                            modal.off("hidden");
                            modal.on("hidden", function() {
                                if (isNew) {
                                    workspaces.add(newWorkspace);
                                } else {
                                    var existWorkspace;
                                    for (var i = 0; i < workspaces.length; i++) {
                                        var workspace = workspaces[i];
                                        if (workspace.id === workspaceId) {
                                            existWorkspace = workspace;
                                            break;
                                        }
                                    }
                                    workspaces.replace(existWorkspace, newWorkspace);
                                }
                                manageModal.delete();
                                modal.delete();
                            });
                            finish();
                        }).fail(function(error) {
                            modal.coverAlert("<strong>Error</strong><br />" + "Could not get workspace '" + workspace.id + "'", "error");
                            finish();
                        });
                    }).fail(function() {
                        modal.coverAlert("<strong>Error</strong><br />" + "Could not clone workspace '" + workspace.id + "'", "error");
                        finish();
                    });
                });
                modal.show();
                function finish() {
                    modal.setButtons(null, "Close");
                    modal.off("submit");
                    modal.on("submit", function() {
                        modal.hide();
                    });
                    modal.unlock();
                }
            }
            function createWorkspace(modal) {
                var workspaceId = $("#create-id").val();
                if (workspaceId === "") {
                    modal.alert("Must enter a workspace id", "error");
                    $("#create-id").focus();
                    return;
                }
                if (!validateString(workspaceId)) {
                    modal.alert("Invalid workspace id<br />(alphanumeric characters only)", "error");
                    $("#create-id").focus().select();
                    return;
                }
                var perm = $("#create-permission").find("option").filter(":selected").attr("value");
                modal.alertHide();
                modal.lock();
                modal.cover('<img src="assets/img/loading.gif" />');
                modal.focus();
                $(".modal-body").find("input,select").attr("tabindex", "-1");
                wsHandler.createWorkspace(workspaceId, perm).done(function(newWorkspace) {
                    newWorkspace.objectData = [];
                    modal.coverAlert("<strong>Success</strong><br />Created workspace '" + workspaceId + "'</div>", "success");
                    modal.setButtons(null, "Close");
                    modal.off("submit");
                    modal.on("submit", function() {
                        modal.hide();
                    });
                    modal.on("hidden", function() {
                        workspaces.add(newWorkspace);
                    });
                }).fail(function() {
                    modal.alert("Workspace already in use, please try again", "error");
                    modal.uncover();
                    $("#create-id").focus().select();
                }).always(function() {
                    modal.unlock();
                });
                return;
            }
            var stringRegex = /^[a-zA-Z0-9_]+$/;
            function validateString(id) {
                return stringRegex.test(id);
            }
            function State() {
                var ls;
                try {
                    ls = "localStorage" in window && window["localStorage"] !== null;
                } catch (e) {
                    ls = false;
                }
                this.get = function(key) {
                    if (!ls) {
                        return null;
                    }
                    var val = localStorage.getItem(key);
                    try {
                        val = JSON.parse(val);
                    } catch (e) {
                        return null;
                    }
                    return val;
                };
                this.set = function(key, val) {
                    if (!ls) {
                        return null;
                    }
                    try {
                        val = JSON.stringify(val);
                    } catch (e) {
                        return null;
                    }
                    return localStorage.setItem(key, val);
                };
            }
            return this;
        }
    });
})(jQuery);