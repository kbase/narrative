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

        get_kbase_cookie : function () {

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

            return chips;
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

                $ld = this.data('loginDialog');

                $('form', $ld).get(0).reset();


                $ld.data("user_id").val( this.session('user_id') || this.data('passed_user_id') || this.options.user_id );

                delete this.options.user_id;
                this.session('user_id',undefined);

                $ld.trigger('clearMessages');

        		this.data('loginDialog').modal('show');
        	}
        },

        _textStyle : function() {
            this._createLoginDialog();
            console.log('called text')

            var $prompt = $('<span></span>')
                .append(
                    $('<a></a>')
                        .attr('id', 'loginlink')
                        //.attr('href', '#') (i'm not sure anybody wants this)
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
                                /*.css('margin-top', '2px')*/
                                .append($('<span></span>').attr('id', 'loggedinuser_id')/*.css('font-weight', 'bold')*/)
                                .append('&nbsp;')
                        )
                        .append(
                            $('<a></a>')
                                .attr('id', 'logoutlink')
                                /*.attr('href', '#') (not needed?)
                                .addClass('btn btn-primary')
                                .css('margin-bottom', '5px')
                                .css('padding-left', '3px')
                                .css('padding-right', '3px')
                                */
                                .attr('title', 'Logout')
                                //.tooltip({'placement' : 'bottom'})
                                .bind('click',
                                    $.proxy( function(e) {
                                        this.logout();
                                    }, this)
                                )
                                .append('Logout')
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
                        this.data('loginDialog').modal('hide');
                    }
                    else {
                        this.data('loginDialog').trigger('error', args.message);
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
						this.data('loginDialog').modal('hide');
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
                                        .addClass('icon-remove-circle')
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
                        //this.data('loginDialog').trigger('clearMessages');
                        //this.data('loginDialog').modal('hide');
                    }
                    else {

                        var $errorModal = $('<div></div>')
                            .attr('class', 'modal hide')
                            .attr('tabindex', '-1')
                            .append(
                                $('<div></div>')
                                    .attr('class', 'modal-body')
                                    .append(
                                        $('<div></div>')
                                            .attr('class', 'alert alert-error')
                                            .attr('id', 'error')
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
                                    )
                                    .append(
                                        $('<div></div>')
                                            .attr('class', 'modal-footer')
                                            .append(
                                                $('<a></a>')
                                                    //.attr('href', '#')
                                                    .attr('class', 'btn btn-primary')
                                                    .append('OK\n')
                                                    .bind('click',
                                                        function(e) {
                                                            $(this).closest('.modal').modal('hide');
                                                        }
                                                    )
                                                    .focus()
                                            )
                                        )
                                )
                            ;
                        $errorModal.bind('shown',
                            function (e) {
                                $errorModal.unbind('keypress');
                                $errorModal.keypress(
                                    function(e) {
                                        if (e.keyCode == 13) {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            $(this).find('a').trigger("click");
                                        }
                                    }
                                )
                            }
                        );
                        $errorModal.bind('hidden',
                            $.proxy(function (e) {
                                e.stopPropagation();
                                e.preventDefault();
                                this.data('password').focus();
                            }, this)
                        );
                        $errorModal.modal('show');
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

                        this.data('loginDialog').trigger('clearMessages');
                        this.data('loginDialog').modal('hide');

                        /*
                        this.data('loginbutton').tooltip(
                            {
                                title : 'Logged in as ' + args.name
                            }
                        );
                        */

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
                        this.data('loginDialog').trigger('error', args.message);
                    }
                };

            this.specificLogout =
                function() {
                    //this.data('loginbutton').tooltip('destroy');
                    this.data('loginicon').removeClass().addClass('icon-lock');
                };

            return $prompt;

        },

        _buttonStyle : function () {
            var $prompt = $('<div></div>')
                .attr('style', 'width : 250px; border : 1px solid gray')
                .append(
                    $('<h4></h4>')
                        .attr('style', 'margin-top : 0px; background-color : lightgray ')
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
                        this.data('loginDialog').trigger('clearMessages');
                        this.data("entrance").hide();
                        this.data("loggedinuser_id").text(args.name);
                        this.data("userdisplay").show();
                        this.data('loginDialog').modal('hide');
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

            var $elem = this.$elem;

            var $ld = $('<div></div>')
                .attr('class', 'modal hide')
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
                                .append(' \n')
                        )
                        .append(
                            $('<h3></h3>')
                                .append('Login to KBase\n')
                        )
                )
                .append(
                    $('<div></div>')
                        .attr('class', 'modal-body')
                        .append(
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
                                                                        /*
                                                                        .append(
                                                                            $('<i></i>')
                                                                                .addClass('icon-info-sign')
                                                                                .attr('style', 'float: left; margin-right: .3em;')
                                                                        )*/
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
                                                        .attr('class', 'inputbox control-group')
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
                                                                .keypress(
                                                                    $.proxy(
                                                                        function(e) {
                                                                            if (e.keyCode == 13) {
                                                                                this.data('loginDialog').data('loginbutton').trigger("click");
                                                                                e.stopPropagation();
                                                                                e.preventDefault();
                                                                            }
                                                                        },
                                                                        this
                                                                    )
                                                                )
                                                        )
                                                )
                                        )
                                )
                        )
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
                                )
                                .append(
                                    $('<div></div>')
                                        .addClass('span4 offset2')
                                    .append(
                                        $('<a></a>')
                                            //.attr('href', '#')
                                            .attr('class', 'btn')
                                            .append('Cancel\n')
                                            .bind('click',
                                                function(e) {
                                                    $(this).closest('.modal').modal('hide');
                                                }
                                            )
                                    )
                                    .append(
                                        $('<a></a>')
                                            //.attr('href', '#')
                                            .attr('id', 'loginbutton')
                                            .attr('class', 'btn btn-primary')
                                            .append('Login\n')
                                            .bind('click',
                                                $.proxy( function(e) {
                                                    var user_id  = this.data('loginDialog').data('user_id').val();
                                                    var password = this.data('loginDialog').data('password').val();

                                                    this.data('loginDialog').trigger('message', user_id);

                                                    this.login(user_id, password, function(args) {

                                                        if (this.registerLogin) {
                                                            this.registerLogin(args);
                                                        }

                                                        if (this.options.login_callback) {
                                                            this.options.login_callback.call(this, args);
                                                        }
                                                    });

                                                },this)
                                            )
                                    )
                                )
                        )
                )
            ;

            this._rewireIds($ld, $ld);
            this.data('loginDialog', $ld);

            $ld.modal({'keyboard' : true, 'show' : false});

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

            $ld.on('shown',
                $.proxy(
                    function () {
                        var $ld = this.data('loginDialog');
                        $ld.data("user_id").focus();
                        if ($ld.data('user_id').val()) {
                            $ld.data('password').focus();
                        }
                    },
                    this
                )
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
            //if (this.data('loginDialog') != undefined) {
            //    this.openDialog();
            //}

            if (this.options.logout_callback) {
                this.options.logout_callback.call(this);
            }
        }

    });

}( jQuery ) );
