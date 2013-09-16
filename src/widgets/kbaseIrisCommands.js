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

    $.KBWidget({

		  name: "kbaseIrisCommands",
		parent: 'kbaseAccordion',

        version: "1.0.0",
        options: {
            link : function (evt) {
                alert("clicked on " + $(evt.target).text());
            },
            englishCommands : 0,
            fontSize : '90%',
            overflow : true,
            sectionHeight : '300px',
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
            this.client.valid_commands(
                $.proxy(
                    function (res) {
var num = 0;
                        var commands = [];
                        $.each(
                            res,
                            $.proxy(
                                function (idx, group) {
num += group.items.length;
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
                                                if (this.commandCategories[group.name] == undefined) {
                                                    this.commandCategories[group.name] = [];
                                                }
                                                this.commandCategories[group.name].push(val.cmd);

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
                                            'category' : group.name,
                                            'body' : $ul
                                        }
                                    );
                                },
                                this
                            )
                        );
console.log("NUM " + num);
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

            var $li = $('<li></li>')
                .append($('<a></a>')
                    .attr('href', '#')
                    .attr('title', cmd)
                    .data('type', 'invocation')
                    .text(label)
                    .bind(
                        'click',
                        func
                    )
                )
            ;

            $li.kbaseButtonControls(
                {
                    context : this,
                    controls : [
                        {
                            icon : 'icon-question',
                            callback : function(e, $ic) {
                                if ($ic.options.terminal != undefined) {
                                    $ic.options.terminal.run(cmd + ' -h');
                                }
                            },
                            id : 'helpButton',
                           // 'tooltip' : {title : label + ' help', placement : 'bottom'},
                        },
                    ]
                }
            );

            return $li;

        },

        loadedCallback : function($elem, commands) {

            var that = this;

            $('input,textarea').on('focus.kbaseIrisCommands', $.proxy( function (e) {
                if ($(':focus').get(0) != undefined && $(':focus').get(0) != this.data('searchField').get(0)) {
                    this.data('focused', $(':focus'));
                }
            }, this));

            this.data('focused', $(':focus'));

            var $form = $.jqElem('form')
                .css('margin-bottom', '2px')
                .append(
                    $('<div></div>')
                        .css('max-height', this.options.overflow ? this.options.sectionHeight : '5000px')
                        .css('overflow', this.options.overflow ? 'auto' : 'visible')
                        .append(
                            $('<div></div>')
                                .addClass('input-group')
                                .addClass('pull-right')
                                .addClass('input-group-sm')
//                                .css('margin-top', '5px')
                                .attr('id', 'searchFieldBox')
                                .append(
                                    $('<input></input>')
                                        .attr('type', 'text')
                                        .attr('name', 'search')
                                        .addClass('form-control')
//                                        .css('padding-top', '1px')
//                                        .css('padding-bottom', '1px')
                                        .attr('id', 'searchField')
//                                        .css('width', '50%')
                                        .attr('size', '50')
                                        .keyup($.proxy(function (e) {
                                            e.preventDefault(); e.stopPropagation();

                                            if (e.metaKey || e.altKey || e.ctrlKey) {
                                                return;
                                            }

                                            var value = this.data('searchField').val();

                                            if (value.length < 3) {
                                                if (value.length == 0) {
                                                    this.data('test').animate({left : "-100%"}, 150);
                                                }
                                                return;
                                            }

                                            this.data('test').animate({left : "0px"}, 150);

                                            var regex = new RegExp(value, 'i');
                                            var commands = this.commandsMatchingRegex(regex);

                                            var $ul = $.jqElem('ul')
                                                .css('font-size', this.options.fontSize)
                                                .css('padding-left', '15px')
                                                .addClass('unstyled');


                                            $.each(
                                                commands,
                                                $.proxy( function (idx, cmd) {
                                                    $ul.append(
                                                        this.createLI(
                                                            cmd,
                                                            cmd,
                                                            function (e) {
                                                                that.options.link.call(this, e);
                                                            }
                                                        )
                                                    );
                                                }, this)
                                            );

                                            if (! commands.length) {
                                                $ul.append(
                                                    $('<li></li>')
                                                        .css('font-style', 'italic')
                                                        .text('No matching commands found')
                                                );
                                            };

                                            this.data('searchResults').empty();
                                            this.data('searchResults').append($ul);

                                            this.data('searchResults').prepend(
                                                $.jqElem('div')
                                                    .css('position', 'relative')
                                                    .css('top', '2px')
                                                    .css('left', '90%')
                                                    .append(
                                                        $.jqElem('button')
                                                            .addClass('btn btn-default btn-xs')
                                                            .append($.jqElem('i').addClass('icon-remove'))
                                                            .on('click',
                                                                $.proxy(function(e) {
                                                                    this.data('searchField').val('');
                                                                    this.data('searchField').trigger('keyup');
                                                                }, this)
                                                            )
                                                    )
                                            );

                                        }, this))
                                )
                                .append(
                                    $.jqElem('span')
                                        .addClass('input-group-btn')
//                                        .css('padding-top', '1px')
//                                        .css('padding-bottom', '1px')
                                        .css('height', '30px')
                                        .append(
                                            $.jqElem('button')
                                                .addClass('btn btn-default')
//                                                .css('padding-top', '1px')
//                                                .css('padding-bottom', '1px')
                                                .attr('id', 'search-button')
                                                .append($.jqElem('i').attr('id', 'search-button-icon').addClass('icon-search'))
                                                .on(
                                                    'click',
                                                    $.proxy(function(e) {
                                                        e.preventDefault(); e.stopPropagation();
                                                        this.data('searchField').trigger('keyup');
                                                    }, this)
                                                )
                                        )
                                )
                            )
                        )
                    ;

            var $box = $.jqElem('div').kbaseBox(
                {
                    'title' : 'Command list',
                    'content' :
                        $.jqElem('div')
                            .append(
                                $.jqElem('div')
                                    .attr('id', 'command-container')
                                    .css('max-height', this.options.overflow ? this.options.sectionHeight : '5000px')
                                    .css('overflow', this.options.overflow ? 'auto' : 'visible')
                                    .append(
                                        $.jqElem('div')
                                            .attr('id', 'test')
                                            .css('position', 'relative')
                                            .css('left', '-100%')
                                            .css('width', '200%')
                                            .append(
                                                $.jqElem('div')
                                                    //.css('width', '50%')
                                                    //.css('border', '1px solid black')
                                                    .text("This is my left div right here")
                                                    .css('width', '50%')
                                                    .css('float', 'left')
                                                    .attr('id', 'searchResults')
                                            )
                                            .append(
                                                $.jqElem('div')
                                                    .css('width', '50%')
                                                    .css('float', 'right')
                                                    .append(
                                                        $.jqElem('div')
                                                            .attr('id', 'all-commands')
                                                            .css('white-space', 'nowrap')
                                                    )
                                            )

                                    )
                            )
                        .append($form)
                    ,
                }
            );

            $elem.append($box.$elem);

            this._rewireIds($box.$elem, this);

            this._superMethod('appendUI', this.data('all-commands'), commands);

            this.data('accordion').css('margin-bottom', '0px');

        },


    });

}( jQuery ) );
