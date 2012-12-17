/*

    KBase JQueryUI plugin to handle all login/session related stuff.

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


    $.widget("kbase.login", {
        version: "1.0.0",
        options: {
            style : 'button',
            loginURL : "http://kbase.us/services/authorization/Sessions/Login",
            login_button_options : {label : 'Login'},
            possibleFields : ['verified','name','opt_in','kbase_sessionid','token','groups','user_id','email','system_admin'],
            fields : ['name', 'kbase_sessionid', 'user_id'],
        },

    get_kbase_cookie : function () {

        var chips = {};

        var cookieString = $.cookie('kbase_session');

        if (cookieString == undefined) {
            return chips;
        }

        var pairs = cookieString.split('\|');

        for (var i = 0; i < pairs.length; i++) {
            var set = pairs[i].split('=');
            chips[set[0]] = set[1];
        }

        chips.success = 1;

        return chips;
    },

        _init: function() {

            var kbaseCookie = this.get_kbase_cookie();

            this.element.empty();

            var style = '_' + this.options.style + 'Style';

            this.ui = this[style]();
            if (this.ui) {
                this.element.append(this.ui);
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

        },

        data : function (key, val) {
            if (this.options._storage == undefined) {
                this.options._storage = {};
            }

            if (arguments.length == 2) {
                this.options._storage[key] = val;
            }

            return this.options._storage[key];
        },

        _rewireIds : function($elem, $target) {

            if ($target == undefined) {
                $target = $elem;
            }

            $elem.removeAttr('id');

            $.each(
                $elem.find('[id]'),
                function(idx) {
                    $target.data($(this).attr('id'), $(this));
                    $(this).removeAttr('id');
                    }
            );

            return $elem;
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
        		this.data('loginDialog').dialog('open');
        	}
        },

        _hiddenStyle : function() {

			this.data('loginDialog', this._createLoginDialog());

			this.registerLogin =
				function(args) {
					if (args.success) {
						this.data('loginDialog').dialog('close');
					}
					else {
                        this.data('loginDialog').trigger('error', args.message);
                    }
				};

            return undefined;
        },

        _slimStyle : function() {

        	this.data('loginDialog', undefined);

            var $prompt = $('<span></span>')
                .attr('class', 'ui-widget ui-widget-content ui-corner-all')
                .css('display', 'inline-block')
                .css('padding', '2px')
                .append(
                    $('<span></span>')
                        .attr('id', 'entrance')
                            .append(
                                    $('<label></label>')
                                            .attr('for', 'user_id')
                                            .append('username:')
                                    .append(
                                        $('<input/>')
                                            .attr('type', 'text')
                                            .attr('name', 'user_id')
                                            .attr('id', 'user_id')
                                            .attr('size', '20')
                                            .val(this.options.user_id)
                                    )
                            )
                            .append(
                                $('<label></label>')
                                    .attr('for', 'password')
                                    .append('password:\n')
                            )
                            .append(
                                $('<input/>')
                                    .attr('type', 'password')
                                    .attr('name', 'password')
                                    .attr('id', 'password')
                                    .attr('size', '20')
                            )
                            .append(
                                $('<button></button>')
                                    .attr('id', 'loginbutton')
                                    .append('%nbsp;')
                            )
                )
                .append(
                    $('<span></span>')
                        .attr('id', 'userdisplay')
                        .attr('style', 'display : none;')
                        .append(
                            $('<span></span>')
                                .attr('style', 'text-align : center')
                                .append('Logged in as ')
                                .append(
                                    $('<span></span>')
                                        .attr('id', 'loggedinuser_id')
                                        .attr('style', 'font-weight : bold')
                                        .append('user_id\n')
                                )
                                .append(' ')
                                .append(
                                    $('<button></button>')
                                        .attr('id', 'logoutbutton')
	                                    .append('%nbsp;')
                                )
                        )
                );

            this._rewireIds($prompt, this);

            this.data('loginbutton').button({text : false, icons : {primary : 'ui-icon-key'}});
            this.data('logoutbutton').button({text : false, icons : {primary : 'ui-icon-circle-close'}});

            this.data('password').keypress(
                $.proxy(
                    function(e) {
                        if (e.keyCode == $.ui.keyCode.ENTER) {
                            this.data('loginbutton').trigger("click");
                            e.stopPropagation();
                        }
                    },
                    this
                )
            );

            this.registerLogin =
                function(args) {

                    this.data('loginbutton').button({icons : {primary : 'ui-icon-key'}});

                    if ( args.success ) {
                        this.data("entrance").hide();
                        this.data('user_id').val('');
                        this.data('password').val('');
                        this.data("loggedinuser_id").text(args.name);
                        this.data("userdisplay").show();
                    }
                    else {
                        $(function() {
                            $('<div></div>')
                                .attr('class', 'ui-state-error ui-corner-all')
                                .attr('style', 'padding: 0 .7em;')
                                .append(
                                    $('<p></p>')
                                        .append(
                                            $('<span></span>')
                                                .attr('class', 'ui-icon ui-icon-alert')
                                                .attr('style', 'float: left; margin-right: .3em;')
                                        )
                                        .append(
                                            $('<strong></strong>').append(args.message)
                                        )
                                )
                                .dialog({
                                    modal: true,
                                    title : 'Error',
                                    buttons: {
                                        Ok: function() {
                                            $( this ).dialog( "close" );
                                        }
                                }
                            });
                        });
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

                        this.data('loginbutton').button({icons : {primary : 'ui-icon-refresh'}});

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
                        .attr('id', 'loginbutton')
                        .append('%nbsp;')
                );

            this._rewireIds($prompt, this);

            this.data('loginbutton').button({text : false, icons : {primary : 'ui-icon-key'}});

            this._createLoginDialog();

            this.data('loginbutton').bind(
                'click',
                $.proxy(
                    function(evt) {
                        this.data('loginDialog').dialog('open');
                    },
                    this
                )
            );

            this.registerLogin =
                function(args) {

                    if ( args.success ) {

                        this.data('loginDialog').trigger('clearMessages');
                        this.data('loginDialog').dialog('close');

                        this.data('loginbutton').tooltip(
                            {
                                disabled : false,
                                content : 'Logged in as ' + args.name
                            }
                        );

                        this.data('loginbutton').button({icons : {primary : 'ui-icon-person'}});

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
                        this.data('loginDialog').trigger('error', args.message);
                    }
                };

            this.specificLogout =
                function() {
                    this.data('loginbutton').tooltip({disabled : true});
                    this.data('loginbutton').button({icons : {primary : 'ui-icon-key'}});
                };

            return $prompt;

        },

        _buttonStyle : function () {
            var $prompt = $('<div></div>')
                .attr('class', 'ui-widget ui-widget-content ui-corner-all')
                .attr('style', 'width : 250px;')
                .append(
                    $('<h3></h3>')
                        .attr('class', 'ui-widget-header ui-corner-top')
                        .attr('style', 'padding : 5px; margin-top : 0px ')
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
                                        .append('&nbsp;')
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
                                )
                        )
                );

            this._rewireIds($prompt, this);

            this.data('loginbutton').button(this.options.login_button_options);
            this.data('logoutbutton').button();

            var loginDialog = this._createLoginDialog();

            this.data('loginbutton').bind('click',
                $.proxy(
                    function(event) {
                        this.data('loginDialog').dialog('open');
                    },
                    this
                )
            );

            this.data('logoutbutton').bind('click', $.proxy(this.logout, this));

            this.registerLogin =
                function(args) {

                    if ( args.success ) {
                        this.data('loginDialog').trigger('clearMessages');
                        this.data("entrance").hide();
                        this.data("loggedinuser_id").text(args.name);
                        this.data("userdisplay").show();
                        this.data('loginDialog').dialog('close');
                    }
                    else {
                        this.data('loginDialog').trigger('error', args.message);
                    }
                };

            this.specificLogout = function(args) {
                this.data("userdisplay").hide();
                this.data("entrance").show();
            };

            return $prompt;
        },

        _createLoginDialog : function () {

            var $elem = this.element;

            var labelStyle = 'width : 70px; float : left; margin-right : 10px; margin-bottom : 5px; clear : left; text-align : right';

            var $ld = $('<div></div>')
                .attr('id', 'dialog')
                .attr('title', 'Login')
                .css('height', 'auto')
                .append(
                    $('<form></form>')
                        .attr('name', 'form')
                        .attr('id', 'form')
                        .append(
                            $('<fieldset></fieldset>')
                                .attr('class', 'ui-helper-reset')
                                .append(
                                    $('<div></div>')
                                        .attr('class', 'ui-widget')
                                        .attr('id', 'error')
                                        .attr('style', 'display : none')
                                        .append(
                                            $('<div></div>')
                                                .attr('class', 'ui-state-error ui-corner-all')
                                                .attr('style', 'padding: 0 .7em;')
                                                .append(
                                                    $('<p></p>')
                                                        .append(
                                                            $('<span></span>')
                                                                .attr('class', 'ui-icon ui-icon-alert')
                                                                .attr('style', 'float: left; margin-right: .3em;')
                                                        )
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
                                        .attr('class', 'ui-widget')
                                        .attr('id', 'pending')
                                        .attr('style', 'display : none')
                                        .append(
                                            $('<div></div>')
                                                .attr('class', 'ui-state-highlight ui-corner-all')
                                                .attr('style', 'padding: 0 .7em;')
                                                .append(
                                                    $('<p></p>')
                                                        .append(
                                                            $('<span></span>')
                                                                .attr('class', 'ui-icon ui-icon-info')
                                                                .attr('style', 'float: left; margin-right: .3em;')
                                                        )
                                                        .append(
                                                            $('<strong></strong>')
                                                                .append('Logging in as \n')
                                                                .append(
                                                                    $('<span></span>')
                                                                        .attr('id', 'pendinguser')
                                                                )
                                                                .append('...\n')
                                                        )
                                                )
                                        )
                                )
                                .append(
                                    $('<div></div>')
                                        .attr('class', 'inputbox')
                                        .append(
                                            $('<label></label>')
                                                .attr('for', 'user_id')
                                                .attr('style', labelStyle)
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
                                        .attr('class', 'inputbox')
                                        .append(
                                            $('<label></label>')
                                                .attr('for', 'password')
                                                .attr('style', labelStyle)
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
                );

            this._rewireIds($ld, $ld);
            this.data('loginDialog', $ld);

            $ld.dialog(
                {
                    autoOpen : false,
                    modal : true,
                    resizable: false,
                    buttons : {
                        Cancel : function () {
                            $( this ).dialog('close');
                        },
                        Login : $.proxy(function() {

                            var $ld = this.data('loginDialog');

                            var user_id  = $ld.data("user_id").val();
                            var password = $ld.data("password").val();

                            this.data('loginDialog').trigger('message', user_id);

                            this.login(user_id, password, function(args) {

                                if (this.registerLogin) {
                                    this.registerLogin(args);
                                }

                                if (this.options.login_callback) {
                                    this.options.login_callback.call(this, args);
                                }
                            });

                            },
                            this
                        ),
                    },
                    open : $.proxy(
                        function() {
                            $ld = this.data('loginDialog');
                            $('form', $ld).get(0).reset();
                            //assign the user_id, if one is provided.
                            $ld.data("user_id").focus();
                            $ld.data("user_id").val( this.session('user_id') || this.options.user_id );
                            delete this.options.user_id;
                            this.session('user_id',undefined);
                            if ($ld.data('user_id').val()) {
                            	$ld.data('password').focus();
                            }

                            $ld.trigger('clearMessages');
                            $ld.unbind('keypress');
                            $ld.keypress(function(e) {
                                if (e.keyCode == $.ui.keyCode.ENTER) {
                                    $('button:last', $ld.parent()).trigger("click");
                                    e.stopPropagation();
                                }
                            });
                        },
                        this
                    ),
                }

            );

            $ld.bind('error',
                function(event, msg) {
                    $(this).trigger('clearMessages');
                    $(this).data("error").show();
                    $(this).data("errormsg").html(msg);
                }
            );

            $ld.bind('message',
                function(event, msg) {
                    $(this).trigger('clearMessages');
                    $(this).data("pending").show();
                    $(this).data("pendinguser").html(msg);
                }
            );

            $ld.bind('clearMessages',
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
            } else if (password.length == 0) {
                args.message = 'Cannot login w/o password';
                args.status = 0;
                callback.call(this, args);
            }
            else {
                args.password = password;
                args.cookie = 1;
                args.fields = this.options.fields.join(',');

                $.ajax(
                    {
                        type            : "POST",
                        url                : this.options.loginURL,
                        data            : args,
                        dataType        : "json",
                        crossDomain        : true,
                        xhrFields        : { withCredentials: true },
                        success            : $.proxy(
                            function (data,res,jqXHR) {
console.log("ABLE");console.log(data); console.log(res); console.log(jqXHR);
console.log(data.kbase_sessionid);
                                if (data.kbase_sessionid) {

									//$.cookie('kbase_session',
								    //	  'un=' + data.user_id
									//	+ '|'
									//	+ 'kbase_sessionid=' + data.kbase_sessionid);

                                    var cookieArray = [];

                                    var args = { success : 1 };//this.get_kbase_cookie();
                                    var fields = this.options.fields;

                                    for (var i = 0; i < fields.length; i++) {
                                        args[fields[i]] = data[fields[i]];
                                        cookieArray.push(fields[i] + '=' + data[fields[i]]);
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
                            console.log(jqXHR);console.log(textStatus);console.log(errorThrown);
                                // If we have a useless error message, replace with
                                // friendly, but useless error message
                                console.log(jqXHR);console.log(textStatus);console.log(errorThrown);
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

        logout: function() {

            $.removeCookie('kbase_session');

            // the rest of this is just housekeeping.

            if (this.specificLogout) {
                this.specificLogout();
            }

            this.populateLoginInfo({});

            //automatically prompt to log in again
            if (this.data('loginDialog') != undefined) {
                this.data("loginDialog").dialog('open');
            }

            if (this.options.logout_callback) {
                this.options.logout_callback.call(this);
            }
        }

    });

}( jQuery ) );
