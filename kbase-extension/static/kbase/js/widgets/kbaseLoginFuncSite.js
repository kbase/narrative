/*global define*/
/*jslint white:true,browser:true*/

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

define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'narrativeConfig',
    'kbase-client-api',
    'jqueryCookie',
    'kbasePrompt'
], function (
    KBWidget,
    bootstrap,
    $,
    Config,
    kbase_client_api,
    jqueryCookie,
    kbasePrompt
    ) {
    'use strict';
    return KBWidget({
        name: "kbaseLogin",
        version: "1.0.0",
        options: {
            style: 'text',
            loginURL: "https://kbase.us/services/authorization/Sessions/Login",
            possibleFields: ['verified', 'name', 'opt_in', 'kbase_sessionid', 'token', 'groups', 'user_id', 'email', 'system_admin'],
            fields: ['name', 'kbase_sessionid', 'user_id', 'token']
        },
        cookieName: 'kbase_session',
        get_kbase_cookie: function (field) {
            if (!$.cookie(this.cookieName)) {
                return {};
            }

            var chips = this.decodeCookie($.cookie(this.cookieName));
            return field === undefined ? chips : chips[field];
        },
        /**
         * Decodes a Globus authentication token, transforming the token
         * plain string into a map of field names to values.
         *
         * @function decodeToken
         * @private
         *
         * @param {string} - A globus auth token
         *
         * @returns {GlobusAuthToken} an object representing the decoded
         * token.
         */
        decodeCookie: function (token) {
            var parts = token.split('|');
            var map = {};
            var i;
            for (i = 0; i < parts.length; i++) {
                var fieldParts = parts[i].split('=');
                var key = fieldParts[0];
                var value = fieldParts[1];
                map[key] = value;
            }
            if (map.token) {
                map.token = map.token.replace(/PIPESIGN/g, '|').replace(/EQUALSSIGN/g, '=');
                map.success = 1;
            }
            return map;
        },
        sessionId: function () {
            return this.get_kbase_cookie('kbase_sessionid');
        },
        token: function () {
            return this.get_kbase_cookie('token');
        },
        userId: function () {
            return this.get_kbase_cookie('user_id');
        },
        /**
         * Token validity is tested by the 'expiry' tag in the token.
         * That tag is followed by the number of seconds in the time when it expires.
         * So, pull that out, multiply x1000, and make a Date() out of it. If that Date is greater than
         * the current one, it's still good.
         * If not, or if there is no 'expiry' field, it's not a valid token.
         */
        is_token_valid: function (token) {
            var expirySec = /\|expiry\=(\d+)\|/.exec(token);
            if (expirySec) {
                expirySec = expirySec[1];
                var expiryDate = new Date(expirySec * 1000);
                return (expiryDate - new Date() > 0);
            }
            return false;
        },
        init: function (options) {
            this._super(options);
            var kbaseCookie = this.get_kbase_cookie();
            this.$elem.empty();
            var style = '_' + this.options.style + 'Style';
            this.ui = this[style]();
            if (this.ui) {
                this.$elem.append(this.ui);
            }

            // Now the drop down has been added, show the correct


            if (kbaseCookie.user_id) {
                if (!this.is_token_valid(kbaseCookie.token)) {
                    localStorage.removeItem('kbase_session');
                    // nuke the cookie, too, just in case it's still there.
                    $.removeCookie(this.cookieName, {path: '/', domain: '.kbase.us'});
                    $.removeCookie(this.cookieName, {path: '/'});
                    this.data('loginlink').show();
                    this.data('userdisplay').hide();
                } else {
                    this.data('loginlink').hide();
                    this.data('userdisplay').show();
                    if (this.registerLogin) {
                        this.registerLogin(kbaseCookie);
                    }
                    if (this.options.prior_login_callback) {
                        this.options.prior_login_callback.call(this, kbaseCookie);
                    }
                }

                this.data('_session', kbaseCookie);
                this.trigger('loggedIn', this.get_kbase_cookie());
            } else {
                this.data('loginlink').show();
                this.data('userdisplay').hide();
            }

            $(document).on('loggedInQuery.kbase', $.proxy(function (e, callback) {
                var cookie = this.get_kbase_cookie();
                if (callback) {
                    callback(cookie);
                }
            }, this));
            $(document).on('promptForLogin.kbase', $.proxy(function (e, args) {
                if (args.user_id) {
                    this.data('passed_user_id', args.user_id);
                }
                this.openDialog();
            }, this));
            $(document).on('logout.kbase', $.proxy(function (e, rePrompt) {
                this.logout(rePrompt);
            }, this));
            return this;
        },
        registerLoginFunc: function () {
            return this.registerLogin;
        },
        specificLogoutFunc: function () {
            return this.specificLogout;
        },
        populateLoginInfo: function (args) {
            if (args.success) {
                this.data('_session', args);
                this._error = undefined;
            } else {
                this.data('_session', {});
                this._error = args.message;
            }
        },
        session: function (key, value) {
            if (this.data('_session') === undefined) {
                this.data('_session', {});
            }

            var session = this.data('_session');
            if (arguments.length === 2) {
                session[key] = value;
            }

            if (arguments.length > 0) {
                return session[key];
            } else {
                return session;
            }
        },
        error: function (new_error) {
            if (new_error) {
                this._error = new_error;
            }

            return this._error;
        },
        openDialog: function () {
            if (this.data('loginDialog')) {
                var $ld = this.data('loginDialog');
                $('form', $ld.dialogModal()).get(0).reset();
                $ld.dialogModal().data("user_id").val(this.session('user_id') || this.data('passed_user_id') || this.options.user_id);
                delete this.options.user_id;
                this.session('user_id', undefined);
                $ld.dialogModal().trigger('clearMessages');
                this.data('loginDialog').openPrompt();
            }
        },
        _textStyle: function () {
            this._createLoginDialog();
            var $prompt = $('<span></span>')
                .append(
                    $('<a></a>')
                    .attr('id', 'loginlink')
                    .attr('href', '#')
                    .text('Sign In')
                    .bind('click',
                        $.proxy(function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            this.openDialog();
                        }, this)))
                .append(
                    $('<div></div>')
                    .addClass('dropdown')
                    .attr('id', 'userdisplay')
                    .append(
                        $('<button></button>')
                        .addClass('btn btn-default')
                        .addClass('btn-xs')
                        .addClass('dropdown-toggle')
                        .attr('data-toggle', 'dropdown')
                        .attr('aria-expanded', 'false')
                        .attr('aria-haspopup', 'true')
                        .attr('type', 'button')
                        .append($('<span></span>').addClass('glyphicon glyphicon-user'))
                        .append($('<span></span>').addClass('caret')))
                    .append(
                        $('<ul></ul>')
                        .addClass('dropdown-menu')
                        .addClass('pull-right')
                        .attr('aria-labelledby', 'userdisplay')
                        .css('padding', '3px')
                        .attr('id', 'login-dropdown-menu')
                        .append(
                            $('<li></li>')
                            .css('border-bottom', '1px solid lightgray')
                            .css('white-space', 'nowrap')
                            .append(
                                $.jqElem('div')  //so as to style the link in blue.
                                .css('text-align', 'center')
                                .append(
                                    $('<a></a>')
                                    .css('font-weight', 'bold')
                                    .attr('id', 'loggedinuser_id')
                                    .addClass('btn btn-link')
                                    .attr('href', 'https://gologin.kbase.us/account/UpdateProfile')
                                    .attr('target', '_blank'))))
                        .append(
                            $('<li></li>')
                            .css('text-align', 'center')
                            .append(
                                $('<span></span>')
                                .append(
                                    $('<a></a>')
                                    .addClass('btn btn-link')
                                    .append('Sign out')
                                    )
                                .bind('click',
                                    $.proxy(function (e) {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        this.logout();
                                    }, this)
                                    )))));
            this._rewireIds($prompt, this);
            this.registerLogin =
                function (args) {
                    var setUsernameField = function (name, id) {
                        this.data('loggedinuser_id').text(name)
                            .attr('href', '/#people/' + id)
                            .click();
                    }.bind(this);
                    if (args.success) {
                        // TODO: this is terrible, but it is just for a few days.
                        this.data("loginlink").hide();
                        if (args.name) {
                            setUsernameField(args.name, args.user_id);
                        } else {
                            var profileClient = new UserProfile(Config.url('user_profile'));
                            profileClient.get_user_profile([args.user_id])
                                .done(function (users) {
                                    setUsernameField(users[0].user.realname, args.user_id);
                                }.bind(this))
                                .fail(function (error) {
                                    setUsernameField(args.user_id, args.user_id);
                                }.bind(this));
                        }
                        this.data('userdisplay').show();
                        this.data('loginDialog').closePrompt();
                    } else {
                        this.data('loginDialog').dialogModal().trigger('error', args.message);
                    }
                };
            this.specificLogout = function (args) {
                this.data("userdisplay").hide();
                this.data("loginlink").show();
            };
            return $prompt;
        },
        _createLoginDialog: function () {
            var $elem = this.$elem;
            var $ld = new kbasePrompt($('<div></div'), {
                title: 'Login to KBase',
                controls: [
                    'cancelButton',
                    {
                        name: 'Login',
                        type: 'primary',
                        id: 'loginbutton',
                        callback: $.proxy(function (e) {
                            var user_id = this.data('loginDialog').dialogModal().data('user_id').val();
                            var password = this.data('loginDialog').dialogModal().data('password').val();
                            this.data('loginDialog').dialogModal().trigger('message', user_id);
                            this.login(user_id, password, function (args) {

                                if (this.registerLogin) {
                                    this.registerLogin(args);
                                }

                                if (this.options.login_callback) {
                                    this.options.login_callback.call(this, args);
                                }
                            });
                        }, this)
                    }
                ],
                body:
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
                                    /*.append(
                                     $('<div></div>')
                                     .addClass('pull-left')
                                     .append(
                                     $('<i></i>')
                                     .addClass('icon-info-sign')
                                     .attr('style', 'float: left; margin-right: .3em;')
                                     )
                                     )*/
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
                                .attr('class', 'form-group')
                                .append(
                                    $('<label></label>')
                                    .addClass('control-label')
                                    .addClass('col-lg-2')
                                    .attr('for', 'user_id')
                                    .css('margin-right', '10px')
                                    .append('Username:\n')
                                    )
                                .append(
                                    $.jqElem('div')
                                    .addClass('col-lg-9')
                                    .append(
                                        $('<input>')
                                        .addClass('form-control')
                                        .attr('type', 'text')
                                        .attr('name', 'user_id')
                                        .attr('id', 'user_id')
                                        .attr('size', '20')
                                        )
                                    )
                                )
                            .append(
                                $('<div></div>')
                                .attr('class', 'form-group')
                                .append(
                                    $('<label></label>')
                                    .addClass('control-label')
                                    .addClass('col-lg-2')
                                    .attr('for', 'password')
                                    .css('margin-right', '10px')
                                    .append('Password:\n')
                                    )
                                .append(
                                    $.jqElem('div')
                                    .addClass('col-lg-9')
                                    .append(
                                        $('<input>')
                                        .addClass('form-control')
                                        .attr('type', 'password')
                                        .attr('name', 'password')
                                        .attr('id', 'password')
                                        .attr('size', '20')
                                        )
                                    )
                                )
                            )
                        )
                , //body
                footer: $('<span></span')
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
            }
            );
            this._rewireIds($ld.dialogModal(), $ld.dialogModal());
            this.data('loginDialog', $ld);
            $ld.dialogModal().bind('error',
                function (event, msg) {
                    $(this).trigger('clearMessages');
                    $(this).data("error").show();
                    $(this).data("errormsg").html(msg);
                }
            );
            $ld.dialogModal().bind('message',
                function (event, msg) {
                    $(this).trigger('clearMessages');
                    $(this).data("pending").show();
                    $(this).data("pendinguser").html(msg);
                }
            );
            $ld.dialogModal().bind('clearMessages',
                function (event) {
                    $(this).data("error").hide();
                    $(this).data("pending").hide();
                }
            );
            $ld.dialogModal().on('shown.bs.modal',
                function (e) {

                    if ($(this).data('user_id').val().length === 0) {
                        $(this).data('user_id').focus();
                    } else {
                        $(this).data('password').focus();
                    }
                }
            );
            return $ld;
        },
        login: function (user_id, password, callback) {

            var args = {user_id: user_id, status: 1};
            // here's a couple of simple cases that need to be handled somewhere. Figured I'd just toss 'em into this function
            // to keep 'em all in one place.
            if (user_id.length === 0) {
                args.message = 'Cannot login w/o user_id';
                args.status = 0;
                callback.call(this, args);
            } else if (password === undefined || password.length === 0) {
                args.message = 'Cannot login w/o password';
                args.status = 0;
                if (callback !== undefined) {
                    callback.call(this, args);
                }
            } else {
                args.password = password;
                args.cookie = 1;
                args.fields = this.options.fields.join(',');
                $.support.cors = true;
                $.ajax(
                    {
                        type: "POST",
                        url: this.options.loginURL,
                        data: args,
                        dataType: "json",
                        crossDomain: true,
                        xhrFields: {withCredentials: true},
                        success: $.proxy(
                            function (data, res, jqXHR) {

                                if (data.kbase_sessionid) {

                                    if ($.cookie) {
                                        // $.cookie('kbase_session',
                                        //       'unEQUALSSIGN' + data.user_id
                                        //     + 'PIPESIGN'
                                        //     + 'kbase_sessionidEQUALSSIGN' + data.kbase_sessionid
                                        //     + 'PIPESIGN'
                                        //     + 'token_idEQUALSSIGN' + data.kbase_sessionid,
                                        //     { expires: 60 });
                                        var cookieString = 'un=' + data.user_id +
                                            '|kbase_sessionid=' + data.kbase_sessionid +
                                            '|user_id=' + data.user_id +
                                            '|token=' + data.token.replace(/=/g, 'EQUALSSIGN').replace(/\|/g, 'PIPESIGN');
                                        $.cookie(this.cookieName, cookieString, {path: '/', domain: 'kbase.us', expires: 60});
                                        $.cookie(this.cookieName, cookieString, {path: '/', expires: 60});
                                    }




                                    // var cookieArray = [];

                                    var args = {success: 1}; //this.get_kbase_cookie();
                                    var fields = this.options.fields;
                                    for (var i = 0; i < fields.length; i++) {
                                        var value = data[fields[i]];
                                        args[fields[i]] = value;
                                    }
                                    var jsonARGS = JSON.stringify(args);
                                    localStorage.setItem('kbase_session', jsonARGS);
                                    this.populateLoginInfo(args);
                                    this.trigger('loggedIn', this.get_kbase_cookie());
                                    callback.call(this, args);
                                } else {
                                    localStorage.removeItem('kbase_session');
                                    this.populateLoginInfo({});
                                    callback.call(this, {status: 0, message: data.error_msg});
                                    this.trigger('loggedInFailure', {status: 0, message: data.error_msg});
                                }

                            },
                            this
                            ),
                        error: $.proxy(
                            function (jqXHR, textStatus, errorThrown) {

                                // If we have a useless error message, replace with
                                // friendly, but useless error message

                                var errmsg = textStatus;
                                if (jqXHR.responseJSON) {
                                    errmsg = jqXHR.responseJSON.error_msg;
                                }

                                if (errmsg === "error") {
                                    errmsg = "Error connecting to KBase login server";
                                } else if (errmsg === "LoginFailure: Authentication failed.") {
                                    errmsg = "Login Failed: your username/password is incorrect.";
                                }


                                this.populateLoginInfo({});
                                callback.call(this, {status: 0, message: errmsg});
                            },
                            this
                            ),
                        beforeSend: function (xhr) {
                            // make cross-site requests
                            xhr.withCredentials = true;
                        }
                    }
                );
            }
        },
        logout: function (rePrompt) {

            rePrompt = false;
            if (rePrompt === undefined) {
                rePrompt = true;
            }

            var session_id = this.get_kbase_cookie('kbase_sessionid');
            if (session_id === undefined) {
                return;
            }

            localStorage.removeItem('kbase_session');
            $.removeCookie(this.cookieName, {path: '/'});
            $.removeCookie(this.cookieName, {path: '/', domain: 'kbase.us'});
            // the rest of this is just housekeeping.

            if (this.specificLogout) {
                this.specificLogout();
            }

            this.populateLoginInfo({});
            //automatically prompt to log in again
            if (this.data('loginDialog') !== undefined && rePrompt) {
                this.openDialog();
            }

            this.trigger('loggedOut');
            if (this.options.logout_callback) {
                this.options.logout_callback.call(this);
            }
        }

    });
});
