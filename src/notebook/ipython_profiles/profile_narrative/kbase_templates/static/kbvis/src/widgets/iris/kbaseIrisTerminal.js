/*


*/

define('kbaseIrisTerminal',
    [
        'jquery',
        'kbaseButtonControls',
        'kbaseIrisTutorial',
        'kbaseIrisFileBrowser',
        'kbaseAuthenticatedWidget',
        'kbaseIrisCommands',
        'kbaseIrisGrammar',
        'kbaseIrisTerminalWidget',
        'kbaseIrisTextWidget',
        'kbaseIrisContainerWidget',
        'kbaseTable',
    ],
    function ($) {


    $.KBWidget({

		  name: "kbaseIrisTerminal",
		parent: 'kbaseAuthenticatedWidget',

        version: "1.0.0",
        _accessors : ['terminalHeight', 'client', 'subWidgets'],
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
            terminalHeight : '550px',
            promptIfUnauthenticated : false,
            autocreateFileBrowser: true,
            environment : ['maxOutput', 'scrollSpeed'],
            subWidgets : [],
            defaultFileType : 'IrisFile',
        },

        run_dispatch : [
            {
                name        : 'help',
                auth        : false,
                callback    : function (args, command, $widget, $deferred, $promise) {
                    $widget.setOutput(
                        $.jqElem('span').html(
                            'There is an introductory Iris tutorial available <a target="_blank" href="http://kbase.us/developer-zone/tutorials/iris/introduction-to-the-kbase-iris-interface/">on the KBase tutorials website</a>.'
                        )
                    );
                    $deferred.resolve();
                    return true;
                }
            },
            {
                name        : 'retest',
                auth        : true,
                regex       : new RegExp(/^retest (.+)$/),
                callback    : function (args, command, $widget, $deferred) {
                    $widget.setOutput(
                        "RETEST " +
                        args.join(', ')
                    );
                    $deferred.resolve();
                    return true;
                }
            },
            {
                name        : 'login',
                auth        : false,
                regex       : new RegExp(/^log[io]n\s+(.+)$/),
                callback    : function (args, command, $widget, $deferred) {

                    args = args[0].split(/\s+/);
                    if (args.length != 1) {
                        $widget.setError(
                            $.jqElem('span')
                                .append("Invalid login syntax, should be : ")
                                .append(this.create_input_link("login $username"))
                        );
                        $deferred.reject();
                        return;
                    }

                    this.client().start_session(
                        args[0],
                        $.proxy(
                            function (newsid) {
                                var auth = {'kbase_sessionid' : sid, success : true, unauthenticated : true};

                                if (this.sessionId()) {
                                    this.terminal.empty();
                                    this.trigger('logout', false);
                                    this.trigger('loggedOut');
                                }
                                this.trigger('loggedIn', auth );

                                // XXX not quite accurate...because the resolve needs to fire AFTER the loggedIn.
                                $deferred.resolve();

                            },
                            this
                        ),
                        $.proxy(
                            function (err) {
                                $widget.setError(
                                    $.jqElem('span').append("Error on session_start:<br>" + this.format_error(err))
                                );
                                $deferred.reject();
                            },
                            this
                        )
                    );

                    return true;

                }
            },
            {
                name        : 'authenticate',
                auth        : false,
                regex       : new RegExp(/^authenticate\s*(.*)$/),
                callback    : function (args, command, $widget, $deferred) {

                    if (args.length == 0) {
                        args = [''];
                    }

                    args = args[0].split(/\s+/);
                    if (args.length > 1) {
                        $widget.setError(
                            $.jqElem('span')
                                .append("Invalid authenticate syntax, should be : ")
                                .append(this.create_input_link("authenticate $username"))
                        );
                        $deferred.reject();
                        return;
                    }

                    if (this.sessionId()) {this.trigger('loggedOut');}
                    this.trigger('promptForLogin', {user_id : args[0]});

                    //XXX no promise resolution here, so we will not return the promise.
                    //this is the ONLY exception

                    return true;
                }
            },
            {
                name        : 'unauthenticate',
                auth        : true,
                callback    : function (args, command, $widget, $deferred) {
                    this.trigger('logout');
                    $deferred.resolve();
                    return true;
                }
            },
            {
                name        : 'logout',
                auth        : true,
                callback    : function (args, command, $widget, $deferred) {
                    this.trigger('logout', false);
                    this.trigger('loggedOut', false);
                    $deferred.resolve();
                    return true;
                }
            },
            {
                name        : 'whatsnew',
                auth        : false,
                callback    : function (args, command, $widget, $deferred) {
                    $.ajax(
                        {
                            async       : true,
                            dataType    : "text",
                            url         : "whatsnew.html",
                            crossDomain : true,
                            success     :
                                $.proxy(function (data, status, xhr) {
                                    $widget.setOutput($.jqElem('div').html(data));
                                    $deferred.resolve();
                                    if (! $widget.isHidden()) { this.scroll() };
                                }, this),
                            error       :
                                $.proxy(function(xhr, textStatus, errorThrown) {
                                    $widget.setError($.jqElem('div').html(xhr.responseText));
                                    $deferred.reject();
                                    if (! $widget.isHidden()) { this.scroll() };
                                }, this),
                            type        : 'GET',
                        }
                    );
                    return true;
                }
            },
            {
                name        : 'next',
                auth        : false,
                callback    : function (args, command, $widget, $deferred) {
                    this.tutorial.goToNextPage();
                    return "show_tutorial";
                }
            },
            {
                name        : 'back',
                auth        : false,
                callback    : function (args, command, $widget, $deferred) {
                    this.tutorial.goToPrevPage();
                    return "show_tutorial";
                }
            },
            {
                name        : 'tutorial',
                auth        : false,
                callback    : function (args, command, $widget, $deferred) {
                    this.tutorial.currentPage = 0;
                    return "show_tutorial";
                }
            },
            {
                name        : 'questions',
                regex       : new RegExp(/^questions\s*(\S+)?/),
                auth        : false,
                callback    : function (args, command, $widget, $deferred) {

                    var questions = this.options.grammar.allQuestions(args[0]);

                    var data = {
                        structure : {
                            header      : [],
                            rows        : [],
                        },
                        sortable    : true,
                    };

                    $.each(
                        questions,
                        $.proxy( function (idx, question) {
                            data.structure.rows.push(
                                [
                                    {
                                        value :
                                            $.jqElem('a')
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
                                    }
                                ]
                            );

                        }, this)
                    );

                    var $tbl = $.jqElem('div').kbaseTable(data);

                    $widget.setOutput($tbl.$elem);
                    $widget.setValue(questions);
                    $deferred.resolve();
                    if (! $widget.isHidden()) { this.scroll() };

                    return true;
                }
            },

        ],

        create_input_link : function(text, value) {

            if (value == undefined) {
                value = text;
            }

            var $a = $.jqElem('a')
                .attr('title', text)
                .append(text)
                .on('click',
                    $.proxy(function(e) {
                        var append = value + ' ';
                        if (this.input_box.val().length && ! $term.input_box.val().match(/[\|;]\s*$/)) {
                            append = '| ' + append;
                        }
                        this.appendInput(append);
                        this.input_box.setCursorPosition(0);
                        if (! this.selectNextInputVariable()) {
                            this.input_box.focusEnd();
                        }

                    }, this)
                );

            return $a;
        },

        create_run_link : function(text, value) {

            if (value == undefined) {
                value = text;
            }

            var $a = $.jqElem('a')
                .attr('title', text)
                .append(text)
                .on('click',
                    $.proxy(function(e) {
                        this.run(value);
                    }, this)
                );

            return $a;
        },

        warn_not_logged_in : function($widget) {
            $widget.setError(
                $.jqElem('span')
                    .append("You are not logged in.<br>Please click the ")
                    .append(this.create_run_link('Sign In', '((authenticate))'))
                    .append(" link in the upper right to get started.")
            );
            if (! $widget.isHidden()) { this.scroll() };
        },

        format_error : function(err) {
            var msg = undefined;

            if (typeof(err.error) == 'string' ) {
                msg = err.error + ' : ' + err.status;
            }
            else {
                msg = err.error.message;
            }

            msg.replace("\n", "<br>\n");
            return msg;
        },

        setenv : function (variable, value) {

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

            //set up available environment as environment keys.
            this.envKeys = {};
            $.each(
                this.options.environment,
                $.proxy( function (idx, key) {
                    this.envKeys[key] = 1;
                }, this)
            );


            //end embedded plugin

            if (this.client() == undefined) {
                this.client(
                    new InvocationService(
                        this.options.invocationURL,
                        this.auth()
                    )
                );
            }

            this.tutorial = $.jqElem('div').kbaseIrisTutorial();

            this.commandHistory = [];
            this.commandHistoryPosition = 0;

            this.path = '.';
            this.cwd = "/";
            this.variables = {};
            this.aliases = {};
            this.live_widgets = [];

            this.appendUI( $( this.$elem ) );

            this.fileBrowsers = [];
            if (this.options.fileBrowser) {
                this.addFileBrowser(this.options.fileBrowser);
            }
            else if (this.options.autocreateFileBrowser) {

                this.addFileBrowser(
                    $.jqElem('div').kbaseIrisFileBrowser (
                        {
                            client              : this.client(),
                            externalControls    : false,
                            invocationURL       : this.options.invocationURL,
                        }
                    )
                )
            };

            $(document).on(
                'loggedInQuery.kbase',
                $.proxy(function (e, callback) {

                var auth = this.auth();
                    if (callback && auth != undefined && auth.unauthenticated == true) {
                        callback(auth);
                    }
                }, this)
            );

            this.selectedWidgets = [];
            this.$elem.on(
                'toggleWidgetSelection.kbaseIris',
                $.proxy(function (e, $widget) {
                    e.stopPropagation();e.preventDefault();
                    if ($widget.isSelected()) {
                        this.deselectWidget($widget);
                    }
                    else {
                        this.selectWidget($widget);
                    }
                }, this)
            );

            this.$elem.on(
                'removeWidget.kbaseIris',
                $.proxy(function (e, params) {
                    this.removeWidget(params.$widget);
                }, this)
            );

            this.$elem.on(
                'scrollTo.kbaseIris',
                $.proxy(function (e, pos) {
                    this.terminal.animate(
                        {
                            scrollTop: this.terminal.prop('offsetTop') - 85
                        },
                        0
                    );
                }, this)
            );

            this.$elem.on(
                'runWidget.kbaseIris',
                $.proxy(function (e, params) {
                    if (params.$widget.isComment()) {
                        params.command = '#' + params.command;
                    }
                    this.run(
                        params.command,
                        {
                            $widget : params.$widget
                        }
                    );
                }, this)
            );



            if (this.options.commandsElement == undefined) {
                this.options.commandsElement = $.jqElem('div');
                this.options.commandsElement.kbaseIrisCommands(
                    {
                        client      : this.client(),
                        terminal    : this,
                    }
                )
            }

            if (this.options.grammar == undefined) {
                this.options.grammar = $.jqElem('div').kbaseIrisGrammar();
            }

            var lastScrollTop = 0;
            this.terminal.on(
                'scroll',
                function (e) {

                    var st = $(this).scrollTop();
                    if (st < lastScrollTop){
                        $(this).stop(true);
                    }

                    lastScrollTop = st;
                }

            );

            return this;

        },

        loggedInCallback : function(e, args) {


            if (args.success) {
                this.client().start_session(
                    args.user_id,
                    $.proxy( function (newsid) {
                        this.loadCommandHistory();
                        if (args.token) {
                            this.out_text("Authenticated as " + args.name);
                        }
                        else {
                            this.out_text("Unauthenticated logged in as " + args.kbase_sessionid);
                        }
                        //make sure that we always have the IrisFile type available.
                        this.run('((kbws-addtype ' + this.options.defaultFileType + '))');
                        this.out_line();
                        this.scroll();
                    }, this ),
                    $.proxy( function (err) {
                        this.out_text(
                            "<i>Error on session_start:<br>" + err.error.message.replace("\n", "<br>\n") + "</i>",
                            'html'
                        );
                    }, this )
                );

                this.input_box.focus();
            }
        },

        loggedInQueryCallback : function(args) {
            this.loggedInCallback(undefined,args);
            if (! args.success && this.options.promptIfUnauthenticated) {
                this.trigger('promptForLogin');
            }
        },

        loggedOutCallback : function(e) {
            this.cwd = '/';
            this.commandHistory = [];
            this.commandHistoryPosition = 0;
            this.terminal.empty();
            this.variables = {};
            this.trigger('clearIrisProcesses');
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
                        .attr('style', 'width : 95%;')
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

            this.out_text(
                $.jqElem('span')
                .append(
                    "Welcome to the interactive KBase terminal!<br>\n"
                    +"Please click the ")
                    .append(this.create_run_link('Sign In', '((authenticate))'))
                    .append(" button in the upper right to get started.<br>\n"
                    +"Type ")
                    .append(this.create_run_link('commands'))
                    .append(" for a list of commands.<br>\n"
                    +"For usage information about a specific command, type the command name with -h or --help after it.<br>\n"
                    +"Please visit <a href = 'http://www.kbase.us/for-users/get-started#iris' target = '_blank'>http://www.kbase.us/for-users/get-started#iris</a> or type ")
                    .append(this.create_run_link('tutorial'))
                    .append(" for an Iris tutorial.<br>\n"
                    +"To find out what's new, type "
                    )
                    .append(this.create_run_link('whatsnew'))
                    .append(" (v0.0.7 - 01/XX/2014)<br>\n"),
                    'html'
            );

            this.out_line();

            this.input_box.on(
                'keypress',
                jQuery.proxy(function(event) { this.keypress(event); }, this)
            );
            this.input_box.on(
                'keydown',
                jQuery.proxy(function(event) { this.keydown(event) }, this)
            );
            this.input_box.on(
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
            this.client().put_file(
                this.sessionId(),
                "history",
                JSON.stringify(this.commandHistory),
                "/",
                function() {},
                function() {}
            );
        },

        addCommandHistory : function(history) {
            if (this.commandHistory == undefined) {
                this.commandHistory = [];
            }

            this.commandHistory.push(history);
            this.saveCommandHistory();
            this.commandHistoryPosition = this.commandHistory.length;

            if (this.recording) {
                if (this.record == undefined) {
                    this.record = [];
                }
                this.record.push(history);
            }
        },

        loadCommandHistory : function() {
            this.client().get_file(
                this.sessionId(),
                "history", "/",
                jQuery.proxy(
                    function (txt) {
                        this.commandHistory = JSON.parse(txt);
                        if (this.commandHistory == undefined) {
                            this.commandHistory = [];
                        }
                        this.commandHistoryPosition = this.commandHistory.length;
                    },
                    this
                ),
                jQuery.proxy(function (e) {
                    this.dbg("error on history load : ");this.dbg(e);
		    }, this)
            );
        },

        resize_contents: function($container) {
            //	var newx = window.getSize().y - document.id(footer).getSize().y - 35;
            //	container.style.height = newx;
        },

        keypress: function(event) {

            if (event.which == 13) {

                if (event.metaKey || event.altKey || event.ctrlKey) {
                    return;
                }

                event.preventDefault();
                var cmd = this.input_box.val();

                if (cmd == 'gui') {
                    this.gui = true;
                    this.input_box.val('');
                    return;
                }
                if (cmd == 'nogui') {
                    this.gui = false;
                    this.input_box.val('');
                    return;
                }

                this.run(cmd);
                this.scroll();
                this.input_box.val('');
            }
        },

        keydown: function(event) {

            if (event.metaKey || event.altKey || event.ctrlKey) {
                return;
            }


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
                    var ret;
                        if (ret = this.selectNextInputVariable(event)) {
                            return;
                        }
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
                            var completion = completions[0][0].replace(new RegExp('^' + toComplete), '');
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

            var posRegex = new RegExp('.{' + pos + ',}?(\\$\\S+)');

            if (match = this.input_box.val().match(posRegex)) {

                if (e != undefined) {
                    e.preventDefault();
                }

                var start = this.input_box.val().indexOf(match[1]);
                var end = this.input_box.val().indexOf(match[1]) + match[1].length;
                //this.input_box.focusEnd();
                if (pos < start || pos == 0) {
                    this.input_box.setSelection(
                        start,
                        end
                    );
                    this.input_box.setSelection(start, end);
                    return true;
                }
                else if (pos == start) {
                    this.input_box.setCursorPosition(pos + 1);
                }
            }
            else {
                this.input_box.setCursorPosition(pos + 1);
            }


            return false;
        },

        search_json_to_table : function(json, filter) {

            var $div = $.jqElem('div');

            var filterRegex = new RegExp('.');
            if (filter) {
                filterRegex = new RegExp(filter.replace(/,/g,'|'));
            };

            $.each(
                json,
                $.proxy(function(idx, record) {
                    var $tbl = $.jqElem('table')
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

            var $tbl = $.jqElem('table')
                .attr('border', 1)
                .css('margin-top', '10px')
                .append(
                    $.jqElem('tr')
                        .append(
                            $.jqElem('th')
                                .text('Suggested commands')
                        )
                    );
            jQuery.each(
                completions,
                jQuery.proxy(
                    function (idx, val) {

                        var label = $.isArray(val)
                            ? val[0]
                            : val;

                        $tbl.append(
                            $.jqElem('tr')
                                .append(
                                    $.jqElem('td')
                                        .append(
                                            $.jqElem('a')
                                                .attr('href', '#')
                                                .text(label)
                                                .on('click',
                                                    $.proxy(function (evt) {
                                                        evt.preventDefault();
                                                        this.input_box.val(
                                                            this.input_box.val().replace(new RegExp(prefix + '\s*$'), '')
                                                        );
                                                        this.appendInput(label + ' ');
                                                    }, this)
                                                )
                                        )
                                    )
                            );
                    },
                    this
                )
            );
            var $widget = $.jqElem('div').kbaseIrisTerminalWidget();
            this.appendWidget($widget);
            $widget.setOutput($tbl);
            $widget.setValue(
                {
                    completions : completions,
                    prefix : prefix
                }
            );
            this.scroll();

        },

        out_text: function(text, type) {

            var $text = $.jqElem('div').kbaseIrisTextWidget();
            this.appendWidget( $text );

            $text.setText(text, type);

        },

        // Outputs an hr
        out_line: function($container) {

            if ($container == undefined) {
                $container = this.terminal;
            }

            var $hr = $('<hr>');
            $container.append($hr);
            this.scroll(0);
        },

        scroll: function(speed) {

            this.terminal.stop(true);

            if (speed == undefined) {
                speed = parseInt(this.options.scrollSpeed);
            }

            this.terminal.animate({scrollTop: this.terminal.prop('scrollHeight') - this.terminal.height()}, speed);
        },

        replaceVariables : function(command) {

            command = command.replace(/^ +/, '');
            command = command.replace(/ +$/, '');

            var exception = command + command; //something that cannot possibly be a match
            var m;
            if (m = command.match(/^\s*(\$\S+)/)) {
                exception = m[1];
            }

            if (m = command.match(/^(\$\S+)\s*=\s*(\S+)/)) {
                delete this.variables[m[1]];
            }

            for (variable in this.variables) {
                if (variable.match(exception)) {
                    continue;
                }
                var escapedVar = variable.replace(/\$/, '\\$');
                var varRegex = new RegExp(escapedVar, 'g');
                command = command.replace(varRegex, this.variables[variable]);
            }
            return command;
        },

        jobqueue : function($widget, queue, callback, throttle) {

            var ns = this.uuid();
            var job;
            var genes = [];

            var $lastWidget;

            $widget.startThinking();
            $(document).on(
                'removeIrisProcess.kbaseIris' + ns,
                $.proxy(function (e, pid) {

                    if (pid == job) {

                        if (callback != undefined) {
                            callback($lastWidget);
                        }

                        var nextJob = this.nextJobInQueue(queue);

                        if (nextJob != undefined && (throttle == undefined || throttle > 0)) {

                            var promise = this.invoke($widget, nextJob);
                            job = promise.$widget.pid();
                            $lastWidget = promise.$widget;

                            if (throttle != undefined) {
                                throttle--;
                            }

                        }
                        else {
                            $widget.stopThinking();
                            $(document).off('removeIrisProcess.kbaseIris' + ns);
                        }
                    }
                }, this)
            );

            var nextJob = this.nextJobInQueue(queue);
            if (nextJob) {
                var promise = this.invoke($widget, nextJob);
                job = promise.$widget.pid();
                $lastWidget = promise.$widget;
            }

        },

        nextJobInQueue : function(queue) {
            if ($.isArray(queue)) {
                return queue.length
                    ? queue.shift()
                    : undefined;
            }
            else {
                return queue();
            }
        },

        addWidget : function(widgetName, refuseInput) {

            var $widget = this.options.widgets[widgetName]();


            this.appendWidget( $widget );

            $widget.render();
            if (this.live_widgets.length) {
                var wIdx = this.live_widgets.length - 1;
                while (wIdx >= 0) {
                    var $last = this.live_widgets[wIdx];
                    if ( ! $last.isHidden() ) {
                        $widget.acceptInput($last, refuseInput);
                        break;
                    }
                    else {
                        wIdx--;
                    }
                }
            }

            this.live_widgets.push($widget);
            this.subWidgets().push($widget);

            return $widget;
        },

        appendWidget: function($widget) {

            var isSubWidget = false;

            $.each(
                this.subWidgets(),
                $.proxy(function (idx, $wdgt) {
                    if ($wdgt === $widget) {
                        isSubWidget = true;
                        return;
                    }
                }, this)
            );

            if (! isSubWidget) {
                this.terminal.append($widget.$elem);
                this.subWidgets().push($widget);
                $widget.$terminal = this;
            }
        },

        removeWidget : function($widget) {
            for (var idx = 0; idx < this.subWidgets().length; idx++) {
                if (this.subWidgets()[idx] === $widget) {
                    this.deselectWidget($widget);
                    this.subWidgets().splice(idx,1);
                    $widget.$elem.remove();
                    break;
                }
            }

        },

        selectWidget : function($widget) {
            this.selectedWidgets.push($widget);
            $widget.setIsSelected(true);
        },

        deselectWidget : function ($widget) {
            for (var idx = 0; idx < this.selectedWidgets.length; idx++) {
                if (this.selectedWidgets[idx] === $widget) {
                    this.selectedWidgets.splice(idx,1);
                    $widget.setIsSelected(false);
                    break;
                }
            };
        },

        evaluateScript : function($terminal, $widget, script, $deferred) {
            var res;
            try {

                if (script.match(/^(['"]).*\1$/)) {
                    script = eval(script);
                }

                if ($widget.output() == undefined) {
                    $widget.setOutput($.jqElem('div'));
                }

                script = script.replace(/\$terminal.invoke\(/g, '$terminal.invoke($widget,');

                res = eval(script);
                if ($widget.output() == undefined) {
                    $widget.setOutput(res);
                };
                $deferred.resolve();

                return true;
            }
            catch (e) {
                $widget.setError(e);
                $deferred.reject();

                return false;
            }

        },

        invoke : function($containerWidget, rawCmd) {
            return this.run(
                rawCmd,
                {
                    subCommand : false,
                    $containerWidget : $containerWidget,
                    viaInvoke : true
                }
            );
        },

        // Executes a command
        //run: function(rawCmd, /*$widget*/, /*subCommand*/, $containerWidget, /*viaInvoke*/) {

        run: function (rawCmd, opts) {
            if (opts == undefined) {
                opts = {};
            }

            var historyLabel = rawCmd;
            if ($.isArray(rawCmd)) {
                historyLabel = rawCmd[1];
                rawCmd = rawCmd[0];
            }

            var $widget             = opts.$widget || $.jqElem('div').kbaseIrisTerminalWidget();
            var $containerWidget    = opts.$containerWidget;

            var $deferred = $.Deferred();
            var $promise = $deferred.promise();
            $promise['$widget'] = $widget;


            var tokens = this.options.grammar.tokenize(rawCmd);

            // no tokens? No command. Bail out.
            if (tokens.length == 0) {
                $deferred.resolve();
                return $promise;
            }

            // okay. We've tokenized the command. If the first element is an array, then it's a set of commands
            // which are semicolon/newline delimited. We need to monitor the deferred object and jump to the
            // next token when it comes up.
            if ($.isArray(tokens[0])) {

                if (! opts.subCommand) {
                    if (! opts.viaInvoke && ! opts.historyLess) {
                        this.addCommandHistory(rawCmd);
                    }

                    var $scriptWidget = $.jqElem('div').kbaseIrisTerminalWidget();

                    if ($containerWidget) {
                        $containerWidget.appendWidget($scriptWidget);
                        $scriptWidget.setSubCommand(true, true);
                    }
                    else {
                        this.appendWidget($scriptWidget);
                    }

                    $scriptWidget.setCwd(this.cwd);
                    $scriptWidget.setInput(historyLabel);
                    $scriptWidget.setOutput($.jqElem('div'));
                    opts.subCommand = true;
                    $containerWidget = $scriptWidget;
                }

                rawCmd = this.options.grammar.detokenize(tokens.shift());
                $deferred.done(
                    $.proxy(function(res) {
                        //$widget.remove();
                        this.run(
                            this.options.grammar.detokenize(tokens),
                            {
                                subCommand : true,
                                $containerWidget : $containerWidget,
                                viaInvoke : opts.viaInvoke
                            }
                        );
                    }, this)
                );
            }
            //otherwise, we just soldier on. Replace the variables in the raw command. We're off to the races.
            //detokenize the tokens back into a command
            else {
                rawCmd = this.options.grammar.detokenize(tokens);
            }

            //now replaceVariables on the rawCmd and away we go.
            var command = this.replaceVariables(rawCmd);

            var isHidden = false;
            if ( m = command.match(/^\(\(([^]+)\)\)$/) ) {
                isHidden = true;
                command = m[1];
                command = command.replace(/^\s+/, '');
                command = command.replace(/\s+$/, '');
            }

            var workspaceTokens = [];
            //okay. The very very first thing we want to do is check for a magic workspace token.
            if (wstokens = command.match(/((?:<|>>?)\s*)?@W#([^\-#\s]+)(?:-(?:\d+))?(#[io])?/g)) {
            //if (wstokens = command.match(/@W#([^#]+)#([io])/g)) {

                var cmdCopy = command;
                var validTokens = true;

                $.each(
                    wstokens,
                    $.proxy(function (idx, wstoken_string) {

                        var workspaceToken = {
                            type : this.options.defaultFileType
                        };

                        if (m = wstoken_string.match(/((?:<|>>?)\s*)?@W#([^\-#\s]+)(?:-(\d+))?#?([io])?/)) {
                        //if (m = wstoken_string.match(/@W#([^#]+)#([io])/)) {


                            var id;
                            var io = '';

                            if (m[1] != undefined && m[1].match(/([<>])/)) {
                                var str = m.shift();  //toss out the string;
                                io  = m.shift();  //the io redirection;
                                m.unshift(str);          //toss the string back on
                            }
                            else {
                                var str = m.shift();     //toss out the string;
                                m.shift();               //toss out the io redirection;
                                m.unshift(str);          //toss the string back on
                            }

                            id = m[1];
                            workspaceToken.io = m[3];
                            workspaceToken.instance = m[2];


                            if (io.match(/</)) {
                                workspaceToken.io = 'i';
                            }
                            else if (io.match(/>/)) {
                                workspaceToken.io = 'o';
                            }

                            id = id.split(':');
                            if (id.length == 3) {
                                workspaceToken.workspace    = id[0];
                                workspaceToken.type         = id[1];
                                workspaceToken.id           = id[2];

                                if (id[1] == '') {
                                    workspaceToken.type = this.options.defaultFileType;
                                }
                            }
                            else if (id.length == 2) {
                                workspaceToken.type         = id[0];
                                workspaceToken.id           = id[1];
                            }
                            else if (id.length == 1) {
                                workspaceToken.id           = id[0];
                            }


                            if (workspaceToken.io == undefined) {
                                validTokens = false;
//                                return;
                            }

                            workspaceTokens.push(workspaceToken);

                            cmdCopy = cmdCopy.replace(wstoken_string, io + workspaceToken.id);

                        }
                    }, this)
                );

                if (! validTokens) {

                    $widget.setInput(rawCmd);
                    this.addCommandHistory(rawCmd);
                    $widget.setError("Error - invalid format for workspace token - " + m[0]);

                    if ($containerWidget) {
                        $containerWidget.appendWidget($widget);
                    }
                    else {
                        this.appendWidget($widget);
                    }

                    $deferred.reject();
                    return $promise;
                }

                var newCommands = [];

                $.each(
                    workspaceTokens,
                    function (idx, token) {
                        if (token.io == 'i') {
                            var workspaceId = '';
                            var instance = '';
                            if (token.workspace != undefined) {
                                workspaceId = ' -w ' + token.workspace + ' ';
                            }
                            if (token.instance != undefined) {
                                instance = ' -i ' + token.instance + ' ';
                            }
                            newCommands.push(
                                '((kbws-get -e ' + token.type + ' ' + token.id + workspaceId + instance + ' > ' + token.id + '))'
                            )
                        }
                    }
                );

                newCommands.push(cmdCopy);

                $.each(
                    workspaceTokens,
                    function (idx, token) {
                        if (token.io == 'o') {
                            var workspaceId = '';
                            if (token.workspace != undefined) {
                                workspaceId = ' -w ' + token.workspace + ' ';
                            }
                            newCommands.push(
                                '((kbws-load -e ' + token.type + ' ' + token.id + ' ' + token.id + ' -s ' + workspaceId + '));(( rm ' + token.id + '))'
                            )
                        }
                        else if (token.io == 'i') {
                            newCommands.push(
                                '(( rm ' + token.id + '))'
                            )
                        }
                    }
                );

                this.addCommandHistory(command);

                $deferred.resolve();
                this.run(
                    [newCommands.join(';'), rawCmd],
                    {
                        $widget : $widget,
                        subCommand : opts.subCommand,
                        $containerWidget : $containerWidget,
                        viaInvoke : opts.viaInvoke,
                        historyLess : true,
                    }
                );

                return $promise;

            }
            else {
                //this.dbg("no magic workspace token");
            }

//                my @commands =
//
//((kbws-get string agresults > @W##agresults#i));
//genomes_to_contigs < @W##agresults#i > @W##g2cres#o;
//((kbws-load string g2cres @W##g2cres#o -s; rm @W##g2cres#o))

            $widget.setCwd(this.cwd);
            $widget.setInput(command);
            $widget.setSubCommand(opts.subCommand);
            $widget.setIsHidden(isHidden);

            if ($containerWidget) {
                $containerWidget.appendWidget($widget);
            }
            else {
                this.appendWidget($widget);
            }

            this.dbg("Run (" + command + ')[' + isHidden + ']');

            var redispatching = false;

            do {

                redispatching = false;
                var dispatched = false;
                $.each(
                    this.run_dispatch,
                    $.proxy(function (idx, dispatch) {
                        if (dispatched) {
                            return;
                        }

                        var m = [];
                        var use_callback = false;
                        if (dispatch.regex) {
                            if (m = command.match(dispatch.regex) ) {
                                m.shift();  //toss out the full match. we don't use it.
                                use_callback = true;
                            }
                        }
                        else if (dispatch.name == command) {
                            use_callback = true;
                        }

                        if (use_callback) {

                            if (dispatch.auth == true && ! this.sessionId()) {
                                this.warn_not_logged_in($widget);
                                dispatched = true;
                            }
                            else {
                                dispatched = dispatch.callback.call(this, m, command, $widget, $deferred, $promise);
                            }
                        }
                    }, this)
                );

                if (typeof(dispatched) == 'boolean' && dispatched == true) {
                    return $promise;
                }
                else if (typeof(dispatched) == 'string') {
                    //okay. We've been given a new command to dispatch. Hop all the way back up and do it again.
                    command = dispatched;
                    redispatching = true;
                }
                else {
// XXX RE-ENABLE THIS ONE LATER!
/*                    this.dbg("need to run a pipeline");
                    if (! this.sessionId()) {
                        this.warn_not_logged_in($widget);
                        $deferred.resolve();
                        return $promise;
                    }
*/
                }
            } while (redispatching);

            var m;

            /*if (m = command.match(/^log[io]n\s*(.*)/)) {
                var args = m[1].split(/\s+/);

                this.dbg(args.length);
                if (! args[0].match(/^\w/)) {
                    $widget.setError('Invalid login syntax');
                    $deferred.reject();
                    return $promise;
                }
                sid = args[0];

                //old login code. copy and pasted into iris.html.
                this.client().start_session(
                    sid,
                    jQuery.proxy(
                        function (newsid) {
                            var auth = {'kbase_sessionid' : sid, success : true, unauthenticated : true};

                            this.terminal.empty();
                            this.trigger('logout', false);
                            this.trigger('loggedOut');
                            this.trigger('loggedIn', auth );

                            // XXX not quite accurate...because the resolve needs to fire AFTER the loggedIn.
                            $deferred.resolve();

                        },
                        this
                    ),
                    jQuery.proxy(
                        function (err) {
                            $widget.setError(
                                "Error on session_start:<br>" + err.error.message.replace("\n", "<br>\n"),
                                "html"
                            );
                            $deferred.reject();
                        },
                        this
                    )
                );
                if (! isHidden) { this.scroll() };
                return $promise;
            }*/

            /*if (m = command.match(/^authenticate\s*(.*)/)) {
                var args = m[1].split(/\s+/)
                if (args.length != 1) {
                    $widget.setError("Invalid login syntax.");
                    $deferred.resolve();
                    return $promise;
                }
                sid = args[0];

                this.trigger('loggedOut');
                this.trigger('promptForLogin', {user_id : sid});

                //XXX no promise resolution here, so we will not return the promise.
                //this is the ONLY exception

                return;
            }*/

            /*if (m = command.match(/^unauthenticate/)) {

                this.trigger('logout');
                if (! isHidden) { this.scroll() };

                $deferred.resolve();

                return $promise;
            }*/

            /*if (m = command.match(/^logout/)) {

                this.trigger('logout', false);
                this.trigger('loggedOut', false);
                if (! isHidden) { this.scroll() };

                $deferred.resolve();

                return $promise;
            }*/

            /*if (m = command.match(/^whatsnew/)) {
                $.ajax(
                    {
                        async : true,
                        dataType: "text",
                        url: "whatsnew.html",
                        crossDomain : true,
                        success: $.proxy(function (data, status, xhr) {
                            $widget.setOutput($.jqElem('div').html(data));
                            $deferred.resolve();
                            if (! isHidden) { this.scroll() };
                        }, this),
                        error : $.proxy(function(xhr, textStatus, errorThrown) {
                            $widget.setError($.jqElem('div').html(xhr.responseText));
                            $deferred.reject();
                            if (! isHidden) { this.scroll() };
                        }, this),
                        type: 'GET',
                    }
                );
                return $promise;
            }*/

            /*if (command == "next") {
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
            }*/

            if (command == 'tutorial list') {
                var list = this.tutorial.list();

                if (list.length == 0) {
                    $widget.setError(
                        $.jqElem('span').append("Could not load tutorials.<br>\n"
                        + "Type <i>tutorial list</i> to see available tutorials.")
                    );
                    $deferred.reject();
                    return $promise;
                }

                var $output = $widget.data('output');
                $output.empty();


                $.each(
                    list,
                    $.proxy( function (idx, val) {
                        $output.append(
                            $('<a></a>')
                                .attr('href', '#')
                                .append(val.title)
                                .bind('click', $.proxy( function (e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    $widget.setError($.jqElem('span').append('Set tutorial to <b>' + val.title + '</b><br>'));
                                    this.tutorial.retrieveTutorial(val.url);
                                    if (! isHidden) { this.scroll() };
                                    this.input_box.focus();
                                }, this))
                            .append('<br>')
                        );

                    }, this)
                );

                $deferred.resolve();

                if (! isHidden) { this.scroll() };
                return $promise;
            }

            if (command == 'show_tutorial') {
                var $page = this.tutorial.contentForCurrentPage();
                $widget.setValue($page);

                if ($page == undefined) {
                    $widget.setError("Could not load tutorial");
                    $deferred.reject();
                    return $promise;
                }

                $page = $page.clone();

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

                $widget.setOutput($page);
                $deferred.resolve();
                if (! isHidden) { this.scroll() };

                return $promise;
            }

            if (command == 'commands') {

                this.client().valid_commands(
                    jQuery.proxy(
                        function (cmds) {

                            var data = {
                                structure : {
                                    header      : [],
                                    rows        : [],
                                },
                                sortable    : true,
                                hover       : false,
                            };

                            jQuery.each(
                                cmds,
                                function (idx, group) {
                                    data.structure.rows.push( [ { value : group.title, colspan : 2, style : 'font-weight : bold; text-align : center' } ] );

                                    for (var ri = 0; ri < group.items.length; ri += 2) {
                                        data.structure.rows.push(
                                            [
                                                group.items[ri].cmd,
                                                group.items[ri + 1] != undefined
                                                    ? group.items[ri + 1].cmd
                                                    : ''
                                            ]
                                        );
                                    }
                                }
                            );

                            var $tbl = $.jqElem('div').kbaseTable(data);

                            $widget.setOutput($tbl.$elem);
                            $widget.setValue(cmds);
                            $deferred.resolve();
                            if (! isHidden) { this.scroll() };

                        },
                       this
                    )
                );
                return $promise;
            }

            /*if (m = command.match(/^questions\s*(\S+)?/)) {

                var questions = this.options.grammar.allQuestions(m[1]);

                var data = {
                    structure : {
                        header      : [],
                        rows        : [],
                    },
                    sortable    : true,
                };

                $.each(
                    questions,
                    $.proxy( function (idx, question) {
                        data.structure.rows.push(
                            [
                                {
                                    value :
                                        $.jqElem('a')
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
                                }
                            ]
                        );

                    }, this)
                );

                var $tbl = $.jqElem('div').kbaseTable(data);

                $widget.setOutput($tbl.$elem);
                $widget.setValue(questions);
                $deferred.resolve();
                if (! isHidden) { this.scroll() };

                return $promise;
            }*/

            if (command == 'clear') {

                while (this.subWidgets().length) {
                    this.removeWidget(this.subWidgets()[0]);
                }

                this.trigger('clearIrisProcesses');
                this.terminal.empty();
                $deferred.resolve();

                return $promise;
            }

            if (command == 'end') {
                this.terminal.animate({scrollTop: this.terminal.prop('scrollHeight') - this.terminal.height()}, 0);
                $deferred.resolve();
                return $promise;
            }

            if (! this.sessionId()) {
                this.warn_not_logged_in($widget);                $deferred.resolve();
                return $promise;
            }

            if (m = command.match(/^save\s*(.+)/)) {
                var args = m[1].split(/\s+/);
                if (args.length != 1) {
                    $widget.setError("Invalid save syntax. Please specify a file name.");
                    $deferred.reject();
                    return $promise;
                }
                file = args[0];

                this.client().put_file(
                    this.sessionId(),
                    file,
                    //JSON.stringify(this.record),
                    this.record.join('\n'),
                    this.cwd,
                    $.proxy(function() {
                        $widget.setOutput('Recording saved as ' + file);
                        this.recording = false;
                        this.record = undefined;
                        $deferred.resolve();
                    }, this),
                    $.proxy( function(err) {
                        $widget.setError($.jqElem('span').append("Error received:<br>" + err.error.code + "<br>" + m));
                        $deferred.reject();
                    }, this)
                );

                return $promise;

            }

            if (! opts.subCommand && this.commandHistory != undefined && ! opts.viaInvoke && ! isHidden) {
                this.addCommandHistory(command);
            }

            if (command == 'record') {
                $widget.setError("recording actions");
                this.recording = true;
                if (! isHidden) { this.scroll() };
                $deferred.resolve();
                return $promise;
            }

            if (m = command.match(/^snapshot\s*(.+)/)) {
                var args = m[1].split(/\s+/);
                if (args.length != 1) {
                    $widget.setError("Invalid snapshot syntax. Please specify a file name.");
                    $deferred.reject();
                    return $promise;
                }
                file = args[0];

                if (! this.selectedWidgets.length) {
                    $widget.setError('No widgets selected for snapshot');
                    $deferred.reject();
                    return $promise;
                }

                var snappedWidgets = [];
                $.each(
                    this.selectedWidgets,
                    function (idx, $widget) {
                        snappedWidgets.push($widget.freeze());
                    }
                );

                var snappedFiles = [];

                $.each(
                    this.fileBrowsers,
                    function (idx, $fb) {

                        $.each(
                            $fb.selectedFiles(),
                            function (file, isSelected) {
                                if (isSelected) {
                                    snappedFiles.push(file);
                                }
                            }
                        )
                    }
                );

                snapshot = {
                    widgets : snappedWidgets,
                    files : snappedFiles,
                };

                this.client().put_file(
                    this.sessionId(),
                    file,
                    JSON.stringify(snapshot),
                    this.cwd,
                    $.proxy(function() {
                        $widget.setOutput('Snapshot saved as ' + file);
                        var selectedWidgets = this.selectedWidgets;
                        $.each(
                            selectedWidgets,
                            function (idx, $widget) {

                                $widget.setIsSelected(false);
                            }
                        );
                        $.each(
                            this.fileBrowsers,
                            function (idx, $fb) {

                                var selectedFiles = $fb.selectedFiles();
                                $.each(
                                    selectedFiles,
                                    function (file, isSelected) {
                                        if (isSelected) {
                                            $fb.toggleSelection(file);
                                        }
                                    }
                                )
                            }
                        );
                        $deferred.resolve();
                    }, this),
                    $.proxy( function(err) {
                        $widget.setError($.jqElem('span').append("Error received:<br>" + err.error.code + "<br>" + m));
                        $deferred.reject();
                    }, this)
                );

                return $promise;

            }

            if (m = command.match(/^thaw\s*(.+)/)) {
                var args = m[1].split(/\s+/);
                if (args.length != 1) {
                    $widget.setError("Invalid that syntax. Please specify a file name.");
                    $deferred.reject();
                    return $promise;
                }
                file = args[0];

                $widget.$elem.css('background-color', '#DDDDDD');

                this.client().get_file(
                    this.sessionId(),
                    file,
                    this.cwd,
                    $.proxy(function(res) {
                        var snapshot = JSON.parse(res);
                        $.each(
                            snapshot.widgets,
                            $.proxy(function (idx, wdgt) {
                                //re-use the previously created widget for the thaw factory.
                                var $thawedWidget = $widget.thaw(wdgt);
                                $widget.appendWidget($thawedWidget);
                            }, this)
                        );

                        $deferred.resolve();
                    }, this),
                    $.proxy( function(err) {
                        $widget.setError($.jqElem('span').append("Error received:<br>" + err.error.code + "<br>" + m));
                        $deferred.reject();
                    }, this)
                );

                return $promise;

            }

            if (command == 'history') {

                var data = {
                    structure : {
                        header      : [],
                        rows        : [],
                    },
                    sortable    : true,
                };

                jQuery.each(
                    this.commandHistory,
                    jQuery.proxy(
                        function (idx, val) {
                            data.structure.rows.push(
                                [
                                    idx,
                                    {
                                        value : $.jqElem('a')
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
                                            ),
                                        style : 'padding-left : 10px',
                                    }
                                ]
                            );
                        },
                        this
                    )
                );

                var $tbl = $.jqElem('div').kbaseTable(data);

                $widget.setOutput($tbl.$elem);
                $widget.setValue(this.commandHistory);
                $deferred.resolve();
                return $promise;
            }
            else if (m = command.match(/^!(\d+)/)) {
                command = this.commandHistory[m[1]];
            }


            if (m = command.match(/^cd\s*(.*)/)) {
                var args = m[1].split(/\s+/)
                if (args.length != 1) {
                    $widget.setError("Invalid cd syntax.");
                    $deferred.reject();
                    return $promise;
                }
                dir = args[0];

                this.client().change_directory(
                    this.sessionId(),
                    this.cwd,
                    dir,
                        jQuery.proxy(
                            function (path) {
                                this.cwd = path;
                                $deferred.resolve();
                            },
                            this
                        ),
                    jQuery.proxy(
                        function (err) {
                            var m = err.error.message.replace("/\n", "<br>\n");
                            $widget.setError($.jqElem('span').append("Error received:<br>" + err.error.code + "<br>" + m));
                            $deferred.reject();
                        },
                        this
                    )
                );
                return $promise;
            }

            if (m = command.match(/^(\$\S+)\s*=\s*(\S+)/)) {
                if (m[2] == 'undefined') {
                    delete this.variables[m[1]];
                    $widget.setOutput('Deleted ' + m[1]);
                }
                else {
                    this.variables[m[1]] = m[2];
                    $widget.setOutput(m[1] + ' set to ' + m[2]);
                }
                $deferred.resolve();
                return $promise;
            }

            if (command == 'variables') {

                var keyedVars = [];
                $.each(
                    Object.keys(this.variables).sort(),
                    $.proxy( function (idx, key) {
                        keyedVars.push(
                            {
                                variable : key,
                                value : this.variables[key]
                            }
                        );
                    }, this)
                );

                var data = {
                    structure : {
                        header      : ['variable', 'value'],
                        rows        : keyedVars,
                    },
                    sortable    : true,
                    hover       : false,
                };

                var $tbl = $.jqElem('div').kbaseTable(data);
                $widget.setOutput($tbl.$elem);
                $widget.setValue(keyedVars);
                $deferred.resolve();
                if (! isHidden) { this.scroll() };
                return $promise;

            }

            if (command == 'environment') {

                var keyedVars = [];
                $.each(
                    Object.keys(this.envKeys).sort(),
                    $.proxy( function (idx, key) {
                        keyedVars.push(
                            {
                                variable : key,
                                value : this.options[key] == undefined
                                    ? '<i>undefined</i>'
                                    : this.options[key]
                            }
                        );
                    }, this)
                );

                var data = {
                    structure : {
                        header      : ['variable', 'value'],
                        rows        : keyedVars,
                    },
                    sortable    : true,
                    hover       : false,
                };

                var $tbl = $.jqElem('div').kbaseTable(data);
                $widget.setOutput($tbl.$elem);
                $widget.setValue(keyedVars);
                $deferred.resolve();
                if (! isHidden) { this.scroll() };
                return $promise;

            }

            if (m = command.match(/^setenv\s+(\S+)\s*=\s*(\S+)/)) {
                if (this.envKeys[m[1]]) {
                    this.options[m[1]] = m[2] == 'undefined'
                        ? undefined
                        : m[2];
                    $widget.setOutput(m[1] + ' set to ' + m[2]);
                    $widget.setValue(m[2]);
                }
                else {
                    $widget.setError("Cannot set environment variable <i>" + m[1] + "</i>: Unknown");
                }
                $deferred.resolve();
                if (! isHidden) { this.scroll() };
                return $promise;
            }



            if (m = command.match(/^alias\s+(\S+)\s*=\s*(\S+)/)) {
                this.aliases[m[1]] = m[2];
                $widget.setOutput(m[1] + ' set to ' + m[2]);
                $deferred.resolve();
                return $promise;
            }

            if (m = command.match(/^upload\s*(\S+)?$/)) {
                var file = m[1];
                if (this.fileBrowsers.length) {
                    var $fb = this.fileBrowsers[0];
                    if (file) {
                        $fb.data('override_filename', file);
                    }
                    $fb.data('active_directory', this.cwd);
                    $fb.uploadFile();
                    //XXX NOT QUITE ACCURATE...NEEDS TO WAIT FOR UPLOADFILE TO FINISH
                    $deferred.resolve();
                }
                return $promise;
            }

            if (m = command.match(/^download\s*(\S+)?$/)) {
                var file = m[1];
                if (this.fileBrowsers.length) {
                    var $fb = this.fileBrowsers[0];
                    $fb.data('active_directory', this.cwd);
                    $fb.openFile(file);
                    $deferred.resolve();
                }
                return $promise;
            }

            if (m = command.match(/^edit\s*(\S+)?$/)) {
                var file = m[1];
                if (this.fileBrowsers.length) {
                    var $fb = this.fileBrowsers[0];
                    $fb.data('active_directory', this.cwd);
                    if ($fb.editFileCallback()) {
                        $fb.editFileCallback()(file, $fb);
                    }
                    else {
                        $widget.setError("Cannot edit : no editor");
                    }

                    $deferred.resolve();
                }
                return $promise;
            }

            if (m = command.match(/^#\s*((?:.|\n)+)/)) {
                //$widget.$elem.remove();
                $widget.setIsComment(true);
                $widget.setInput(m[1]);

                $widget.setOutput('');
                $widget.setError('');
                $widget.subWidgets([]);
                //$widget.setOutput($.jqElem('i').text(m[1]));
                //$widget.setValue(m[1]);
                $deferred.resolve();
                return $promise;
            }

            if (m = command.match(/^view\s+(\S+)$/)) {
                var file = m[1];

                var $img = $.jqElem('img')
                    .attr('src', this.fileBrowsers[0].urlForFile(file))
                    .css('max-width', '90%');

                var $link = $.jqElem('a')
                    .append($img)
                    .attr('href', this.fileBrowsers[0].urlForFile(file))
                    .css('border', '0px');

                $widget.setOutput(
                    $link
                );


                setTimeout($.proxy(function() {this.scroll()}, this), 500);
                $deferred.resolve();

                return $promise;


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
                                var $output = $.jqElem('span');
                                $output.append('<br>', 'html');
                                $output.append($('<i></i>').html("Command completed."));
                                $output.append('<br>', 'html');
                                $output.append(
                                    $.jqElem('span')
                                        .append($.jqElem('b').html(data.found))
                                        .append(" records found.")
                                );
                                $output.append('<br>', 'html');
                                $output.append(this.search_json_to_table(data.body, filter));
                                $widget.setOutput($output);
                                $widget.setValue({
                                    results : data.body,
                                    filter : filter
                                });
                                var res = this.search_json_to_table(data.body, filter);

                                if (! isHidden) { this.scroll() };
                                $deferred.resolve();

                            },
                            this
                        ),
                        error: $.proxy(
                            function (jqXHR, textStatus, errorThrown) {

                                $widget.setError(errorThrown);
                                $deferred.reject();

                            }, this
                        ),
                   }
                );

                return $promise;
            }

            if (m = command.match(/^cp\s*(.*)/)) {
                var args = m[1].split(/\s+/)
                if (args.length != 2) {
                    $widget.setError("Invalid cp syntax.");
                    $deferred.reject();
                    return $promise;
                }
                from = args[0];
                to   = args[1];
                this.client().copy(
                    this.sessionId(),
                    this.cwd,
                    from,
                    to,
                    $.proxy(
                        function () {
                            this.refreshFileBrowser();
                            $deferred.resolve();
                        },this
                    ),
                    jQuery.proxy(
                        function (err) {
                            var m = err.error.message.replace("\n", "<br>\n");
                            $widget.setError($.jqElem('span').append("Error received:<br>" + err.error.code + "<br>" + m));
                            $deferred.reject();
                        },
                        this
                    )
                );
                return $promise;
            }
            if (m = command.match(/^mv\s*(.*)/)) {
                var args = m[1].split(/\s+/)
                if (args.length != 2) {
                    $widget.setError("Invalid mv syntax.");
                    $deferred.reject();
                    return $promise;
                }

                from = args[0];
                to   = args[1];
                this.client().rename_file(
                    this.sessionId(),
                    this.cwd,
                    from,
                    to,
                    $.proxy(
                        function () {
                            this.refreshFileBrowser();
                            $deferred.resolve();
                        },this
                    ),
                    jQuery.proxy(
                        function (err) {
                            var m = err.error.message.replace("\n", "<br>\n");
                            $widget.setError($.jqElem('span').append("Error received:<br>" + err.error.code + "<br>" + m));
                            $deferred.reject();
                        },
                        this
                    ));
                return $promise;
            }

            if (m = command.match(/^mkdir\s*(.*)/)) {
                var args = m[1].split(/\s+/)
                if (args[0].length < 1){
                    $widget.setError("Invalid mkdir syntax.");
                    $deferred.reject();
                    return $promise;
                }
                $.each(
                    args,
                    $.proxy(function (idx, dir) {
                        this.client().make_directory(
                            this.sessionId(),
                            this.cwd,
                            dir,
                            $.proxy(
                                function () {
                                    this.refreshFileBrowser();
                                    $deferred.resolve();
                                },this
                            ),
                            jQuery.proxy(
                                function (err) {
                                    var m = err.error.message.replace("\n", "<br>\n");
                                    $widget.setError($.jqElem('span').append("Error received:<br>" + err.error.code + "<br>" + m));
                                    $deferred.reject();
                                },
                                this
                            )
                        );
                    }, this)
                )
                return $promise;
            }

            if (m = command.match(/^rmdir\s*(.*)/)) {
                var args = m[1].split(/\s+/)
                if (args[0].length < 1) {
                    $widget.setError("Invalid rmdir syntax.");
                    $deferred.reject();
                    return $promise;
                }
                $.each(
                    args,
                    $.proxy( function(idx, dir) {
                        this.client().remove_directory(
                            this.sessionId(),
                            this.cwd,
                            dir,
                            $.proxy(
                                function () {
                                    this.refreshFileBrowser();
                                    $deferred.resolve();
                                },this
                            ),
                            jQuery.proxy(
                                function (err) {
                                    var m = err.error.message.replace("\n", "<br>\n");
                                    $widget.setError($.jqElem('span').append("Error received:<br>" + err.error.code + "<br>" + m));
                                    $deferred.reject();
                                },
                                this
                            )
                        );
                    }, this)
                );
                return $promise;
            }

            if (m = command.match(/^rm\s+(.*)/)) {
                var args = m[1].split(/\s+/);
                if (args[0].length < 1) {
                    $widget.setError("Invalid rm syntax.");
                    $deferred.reject();
                    return $promise;
                }
                $.each(
                    args,
                    $.proxy(function (idx, file) {
                        this.client().remove_files(
                            this.sessionId(),
                            this.cwd,
                            file,
                            $.proxy(
                                function () {
                                    this.refreshFileBrowser();
                                    $deferred.resolve();
                                },this
                            ),
                            jQuery.proxy(
                                function (err) {
                                    var m = err.error.message.replace("\n", "<br>\n");
                                    $widget.setError($.jqElem('span').append("Error received:<br>" + err.error.code + "<br>" + m));
                                    $deferred.reject();
                                },
                                this
                            )
                        );
                    }, this)
                );
                return $promise;
            }

            if (m = command.match(/^execute\s+(.*)/)) {
                var args = m[1].split(/\s+/);
                if (args.length != 1) {
                    $widget.setError("Invalid execute syntax.");
                    $deferred.reject();
                    return $promise;
                }
                this.client().get_file(
                    this.sessionId(),
                    args[0], this.cwd,
                    jQuery.proxy(
                        function (script) {
                            //XXX promise resolution here is...sketchy at best.
                            //we obviously haven't finished running anything, so we shouldn't
                            //necessarily resolve, but it would be resolved by the next call through
                            //the run loop anyway. So bugger all if I know. I'll have to revisit.
                            $deferred.resolve();

                            //Sigh. Freakin' special case. This is the time that a run commmand
                            //can spawn a new run, but NOT via tokenization. So we explicitly
                            //toss the <hr> into the output, and nuke the following hr in the terminal
                            //$widget.setOutput('abc');//$.jqElem('div'));
                            //this.out_line($widget.output());
                            if ($widget.$elem.next().prop('tagName') == 'HR') {
                                $widget.$elem.next().remove();
                            }


                            this.run(
                                script,
                                {
                                    subCommand : true,
                                    //$widget : $widget,
                                    $containerWidget : $widget,
                                    viaInvoke : opts.viaInvoke
                                }
                            );
                        },
                        this
                    ),
                    jQuery.proxy(function (e) {
                        $widget.setError("No such script");
                        $deferred.reject();
                    }, this)
                );
                return $promise;
            }

            if (m = command.match(/^evaluate\s+(.*)/)) {

                var script = m[1];
                if (script.length < 1) {
                    $widget.setError("Invalid evalute syntax.");
                    $deferred.reject();
                    return $promise;
                }

                this.client().get_file(
                    this.sessionId(),
                    script, this.cwd,
                    jQuery.proxy(
                        function (script) {
                            this.evaluateScript(this, $widget, script, $deferred, $widget);
                        },
                        this
                    ),
                    jQuery.proxy(function (e) {

                        //dammit. No such script. see if we can evalute it.
                        this.evaluateScript(this, $widget, script, $deferred, $widget);

                    }, this)
                );

                return $promise;
            }

            if (d = command.match(/^ls\s*(.*)/)) {
                var args = d[1].split(/\s+/)
                var obj = this;
                if (args.length == 0) {
                    d = ".";
                }
                else {
                    d = d[1];
                }

                //okay, add in regex support
                var regex = undefined;
                if (d.match(/[*+?\s.]/)) {
                    d = d.replace(/\s+/g, '|');
                    d = d.replace(/\./g, '\.');
                    d = d.replace(/([*+?])/g, '.$1');
                    regex = new RegExp('^(' + d + ')$');
                    d = '.';
                }

                this.client().list_files(
                    this.sessionId(),
                    this.cwd,
                    d,
                    jQuery.proxy(
                        function (filelist) {
                            var dirs = filelist[0];
                            var files = filelist[1];

                            var allFiles = [];

                            $.each(
                                dirs,
                                function (idx, val) {

                                    if (regex != undefined && ! val.name.match(regex)) {
                                        return;
                                    }

                                    allFiles.push(
                                        {
                                            size    : '(directory)',
                                            mod_date: val.mod_date,
                                            name    : val.name,
                                            nameTD  : val.name,
                                        }
                                    );
                                }
                            );

                            $.each(
                                files,
                                $.proxy( function (idx, val) {

                                    if (regex != undefined && ! val.name.match(regex)) {
                                        return;
                                    }

                                    allFiles.push(
                                        {
                                            size    : val.size,
                                            mod_date: val.mod_date,
                                            name    : val.name,
                                            nameTD  :
                                                $.jqElem('a')
                                                    .text(val.name)
                                                    //uncomment these two lines to click and open in new window
                                                    //.attr('href', url)
                                                    //.attr('target', '_blank')
                                                    //comment out this block if you don't want the clicks to pop up via the api
                                                    //*
                                                    .attr('href', '#')
                                                    .on(
                                                        'click',
                                                        jQuery.proxy(
                                                            function (e) {
                                                                e.preventDefault();e.stopPropagation();
                                                                this.open_file(val['full_path']);
                                                                return false;
                                                            },
                                                            this
                                                        )
                                                    ),
                                                    //*/,
                                            url     : this.options.invocationURL + "/download/" + val.full_path + "?session_id=" + this.sessionId()
                                        }
                                    );

                                }, this)
                            );

                            var data = {
                                structure : {
                                    header      : [],
                                    rows        : [],
                                },
                                sortable    : true,
                                bordered    : false
                            };

                            $.each(
                                allFiles.sort(this.sortByKey('name', 'insensitively')),
                                $.proxy( function (idx, val) {
                                    data.structure.rows.push(
                                        [
                                            val.size,
                                            val.mod_date,
                                            { value : val.nameTD }
                                        ]
                                    );
                                }, this)
                            );

                            var $tbl = $.jqElem('div').kbaseTable(data);

                            if (data.structure.rows.length) {
                                $widget.setOutput($tbl.$elem);
                                $widget.setValue(filelist);
                            }
                            else {
                                $widget.setError("no matching files found");
                            }
                            $deferred.resolve();
                            if (! isHidden) { this.scroll() };
                         },
                         this
                     ),
                     function (err)
                     {
                         var m = err.error.message.replace("\n", "<br>\n");
                         $widget.setError($.jqElem('span').append("Error received:<br>" + err.error.code + "<br>" + m))
                         $deferred.reject();
                     }
                    );
                return $promise;
            }

            if (w = command.match(/^widget\s+(.*)/)) {
                var args = w[1].split(/\s+/)
                var obj = this;

                if (! args[0].length) {
                    $widget.setError("incorrect add widget syntax");
                    $deferred.reject();
                    return $promise;
                }

                var $widget = this.addWidget(args[0], args.length > 1);

                if (args.length > 1) {
                    $widget.setInput(args[1]);
                }

                $deferred.resolve();
                return $promise;
            }


            var parsed = this.options.grammar.evaluate(command);

            if (parsed != undefined) {
                if (! parsed.fail && parsed.execute) {
                    command = parsed.execute;

                    if (parsed.explain) {
                        $widget.setOutput(parsed.execute);
                        $deferred.resolve();
                        return $promise;
                    }

                }
                else if (parsed.parsed.length && parsed.fail) {
                    $widget.setError(parsed.error);
                    $deferred.reject();
                    return $promise;
                }
            }

            //command = command.replace(/\\\n/g, " ");
            //command = command.replace(/\n/g, " ");

            var pid = this.uuid();
            $widget.setPid(pid);

            var $pe = $.jqElem('div').text(command);
            $pe.kbaseButtonControls(
                {
                    onMouseover : true,
                    context : this,
                    controls : [
                        {
                            'icon' : 'fa fa-ban-circle',
                            //'tooltip' : 'Cancel',
                            callback : function(e, $term) {
                                $widget.promise().xhr.abort();
                                $widget.$elem.remove();
                            }
                        },
                    ]

                }
            );

            if (! isHidden) {
                this.trigger(
                    'updateIrisProcess',
                    {
                        pid : pid,
                        content : $pe
                    }
                );
            }

            //var commands = command.split(/[;\r\n]/) {

            var promise = this.client().run_pipeline(
                this.sessionId(),
                command,
                [],
                this.options.maxOutput,
                this.cwd,
                jQuery.proxy(
                    function (runout) {

                        if (runout) {

                            var output = runout[0];
                            var error  = runout[1];

                            this.refreshFileBrowser();

                            if (output.length > 0 && output[0].indexOf("\t") >= 0) {

                                var data = {
                                    structure : {
                                        header      : [],
                                        rows        : [],
                                    },
                                    sortable    : false,
                                    hover       : false,
                                    resizable   : true,
                                };

                                $.each(
                                    output,
                                    function (idx, rowStr) {
                                        var row = [];
                                        data.structure.rows.push(row);
                                        $.each(
                                            rowStr.split(/\t/),
                                            function (idx, val) {
                                                row.push(val);
                                            }
                                        )
                                    }
                                );

                                var $tbl = $.jqElem('div').kbaseTable(data);
                                $widget.setOutput($tbl.$elem);

                                $widget.setValue(output);
                            }
                            else {
                                $widget.setOutput(output.join(''));
                                $widget.setValue(output);
                            }

                            if (error.length) {

                                $widget.setError(error.join(''));
                                if (output.length) {
                                    $deferred.resolve();
                                }
                                else {
                                    $deferred.reject();
                                }
                            }
                            else {
                                $widget.setError('Command Completed');
                                $deferred.resolve();
                            }
                        }
                        else {
                            $widget.setError('Error running command.');
                            $deferred.reject();
                        }
                        if (! isHidden) { this.scroll() };

                        this.trigger( 'removeIrisProcess', pid );
                    },
                    this
                ),
                $.proxy( function(res) { this.trigger( 'removeIrisProcess', pid ); }, this)
            );

            $widget.promise(promise);
            this.live_widgets.push($widget);

            return $promise;
        }


    });

});
