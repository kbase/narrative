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

    $.kbWidget("kbaseIrisCommands", 'kbaseAccordion', {
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
