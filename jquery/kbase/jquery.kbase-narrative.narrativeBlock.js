/*


*/


(function( $, undefined ) {


    $.widget("kbase-narrative.narrativeBlock", {
        version: "1.0.0",
        options: {
            name : 'COMMAND',
            outputTruncate : 2000,
            fields :
                [
                    {
                        name    : 'args',
                        key     : 'args',
                        label   : 'args',
                        type    : 'string',
                        valOnly : 1,
                    },
                ],
            inputType   : ['*'],
            outputType  : ['*'],
        },

        _init: function() {

            this.narrative = this.options.narrative;

            //if (this.options.lastRun == undefined) {
            //    this.options.lastRun = (new Date).toJSON();
            //}

            this.element.append(this.ui(this.options.elements));
            this.data('command-interface').formBuilder('resizeToMinimum');

            if (this.options.output) {
                this.appendOutputUI(this.options.output);
            }

            $(this.element).data('blockType', 'narrativeBlock');

            //$(window).trigger('resize');
            if (this.narrative) {
                this.narrative.reposition();
            }

            return this;
        },

        id : function() {
            return this.options.id;
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

        commandString : function() {
            var args = this.data('command-interface').formBuilder('getFormValuesAsString');

            return [this.options.name, args].join(' ');
        },

        ui : function(opts) {

            var $block = $('<div></div>')
                .attr('id', 'block')
                .attr('class', 'ui-widget-content ui-widget-content ui-corner-all')
                .attr('style', 'padding : 5px; overflow : hidden; margin-bottom : 5px')
                .append($('<div></div>')
                    .attr('style', 'font-size : 50%; text-align : left; color : gray')
                    .attr('id', 'input-type')
                    .append(this.options.inputType.join(' '))
                )
                .append(
                    $('<div></div>')
                        .attr('id', 'command-header')
                        .attr('class', 'ui-widget-header ui-corner-all')
                        .attr('style', 'padding : 5px; margin-top : 0px; height : 18px')
                        .append(
                            $('<h3></h3>')
                                .attr('style', 'position : absolute;')
                                .attr('id', 'command-name')
                        )
                        .append(
                            $('<div></div>')
                                .attr('style', 'position : absolute; height : 18px; text-align : right; white-space : nowrap')
                                .attr('id', 'command-controls')
                                /*.append(
                                    $('<button></button>')
                                        .attr('id', 'noticebutton')
                                        .append('Drop\n')
                                        .css({width : '19px', height : '18px'})
                                        .button({text : false, icons : {primary : 'ui-icon-notice'}})
                                )
                                .append(
                                    $('<button></button>')
                                        .attr('id', 'stopbutton')
                                        .append('Stop\n')
                                        .css({width : '19px', height : '18px'})
                                        .button({text : false, icons : {primary : 'ui-icon-pause'}})
                                )*/
                                .append(
                                    $('<button></button>')
                                        .attr('id', 'linkbutton')
                                        .append('Link to narrative\n')
                                        .css({width : '19px', height : '18px'})
                                        .button({text : false, icons : {primary : 'ui-icon-link'}})
                                )
                                .append(
                                    $('<button></button>')
                                        .attr('id', 'gobutton')
                                        .append('Go\n')
                                        .css({width : '19px', height : '18px'})
                                        .button({text : false, icons : {primary : 'ui-icon-play'}})
                                )
                                .append(
                                    $('<button></button>')
                                        .attr('id', 'closebutton')
                                        .append('Close\n')
                                        .css({width : '19px', height : '18px'})
                                        .button({text : false, icons : {primary : 'ui-icon-closethick'}})
                                )
                        )
                        .append(
                            $('<time></time>')
                                .attr('style', 'text-align : right; font-size : 25%; position : absolute')
                                .attr('id', 'command-lastrun')
                                .attr('datetime', this.options.lastRun)
                                .css('width', '159px')  //hardwired cuz this is crazy
                                .css('height', '11px')  //hardwired cuz this is crazy
                        )
                )
                .append(
                    $('<div></div>')
                        .attr('style', 'margin-top : 5px;min-height : 150px; float : left; width : 100%;')
                        .attr('id', 'command-interface')
                )
                .append($('<div></div>')
                    .attr('style', 'font-size : 50%; text-align : right; color : gray; clear : both')
                    .attr('id', 'output-type')
                    .append(this.options.outputType.join(' '))
                )
            ;

            this._rewireIds($block, this);

            this.appendInputUI();

            if (this.options.label == undefined) {
                this.options.label = this.options.name.replace(/_/g,' ');
            }

            this.data('command-name').text(this.options.label || this.options.name);

            $.timeago.settings.strings.prefixAgo = 'Last run: ';
            this.data('command-lastrun').timeago();

            //odd. Apparently I can't do this when the element isn't within the document. Moved down into re-position to set once
            //this.data('command-lastrun').css('width', this.data('command-lastrun').width());

            var $deleteDialog = $('<div></div>')
                .append('Really delete block?')
                .dialog(
                    {
                        title : 'Confirmation',
                        autoOpen : false,
                        modal : true,
                        resizable: false,
                        buttons : {
                            Cancel : function () {
                                $( this ).dialog('close');
                            },
                            Delete :
                                $.proxy(
                                    function() {

                                        if (this.data('running')) {
                                            this.data('command-name').spinner('remove');
                                        };
                                        $block.parent().remove();
                                        $deleteDialog.dialog('close');
                                        if (this.narrative != undefined) {
                                            this.narrative.save();
                                            this.narrative.reposition();
                                        }

                                    },
                                    this
                                )
                        },
                        open :  function () {
                            $('button:last', $(this).parent()).focus();
                        }
                    }
                );

            this.data('gobutton').bind(
                'click',
                $.proxy(
                    function (evt) {

                        if (! this.data('running')) {

                            if (this.narrative != undefined) {
                                this.narrative.save();
                            }

                            this.run();
                        }

                        evt.stopPropagation();
                    },
                    this
                )
            );

            //this.data('stopbutton').bind('click', $.proxy( function(evt) { this.data('gobutton').trigger('click'); evt.stopPropagation(); }, this) );
            //this.data('noticebutton').bind('click', $.proxy( function(evt) { this.data('gobutton').trigger('click'); evt.stopPropagation(); }, this) );

            this.data('closebutton').bind(
                'click',
                function (evt) {
                    $deleteDialog.dialog('open');
                    evt.stopPropagation();
                }
            );

            this.data('linkbutton').bind(
                'click',
                function (evt) {
                    alert("We can't socialize. Yet.");
                    evt.stopPropagation();
                }
            );

            this.data('command-header').bind('click',
                $.proxy(
                    function(evt) {
                        if (this.data('state') != 'active') {
                            this.activate();
                        }
                        else {
                            this.deactivate();
                        }

                    },
                    this
                )
            );

            return $block;


        },

        prompt : function() {

            var $promptDialog = $('<div></div>')
                //.append('Really delete block?')
                .append(this.data('command-interface'))
                .dialog(
                    {
                        title : this.options.label || this.options.name,
                        autoOpen : false,
                        modal : true,
                        resizable: false,
                        minWidth : 500,
                        buttons : {
                            Cancel :
                                $.proxy(
                                    function () {
                                        this.data('promptDialog').dialog('close');
                                        this.data('block').parent().remove();
                                        this.narrative.reposition();
                                    },
                                    this
                                ),
                            Add :
                                $.proxy(
                                    function() {

                                        this.data('output-type').before(this.data('command-interface'));
                                        this.data('promptDialog').dialog('close');
                                        this.narrative.reposition();

                                    },
                                    this
                                ),
                            'Add and Run' :
                                $.proxy(
                                    function () {
                                        this.data('output-type').before(this.data('command-interface'));
                                        this.data('promptDialog').dialog('close');
                                        this.run();
                                        this.narrative.reposition();
                                    },
                                    this
                                ),
                        },
                        open :  function () {
                            $('button:last', $(this).parent()).focus();
                        },
                        /*close :
                            $.proxy(
                                function () {
                                    //this.data('promptDialog').dialog('close');
                                    this.narrative.reposition();
                                    //this.data('block').parent().remove();
                                },
                                this
                            ),*/
                    }
            );

            this.data('promptDialog', $promptDialog)
            $(".ui-dialog-titlebar-close", $promptDialog).hide();

            $promptDialog.dialog('open');

        },

        run : function() {

            if (this.narrative) {

                this.leaveErrorState();

                this.data('command-lastrun').removeData('timeago');
                this.data('command-lastrun').attr('datetime', (new Date).toJSON())
                this.data('command-lastrun').timeago('refresh');

                this.appendRunningUI();

                var command = this.commandString();


                if (this.options.inputType.length) {
                    var $before = $(this.element).prev();

                    while ($before.length) {
                        if ($before.data('blockType') == 'narrativeBlock') {
                            if ($before.narrativeBlock('data', 'state') == 'error') {
                                this.enterErrorState();
                                this.appendOutputUI("Cannot run - input block is in error condition");
                                return;
                            }
                            command += ' < ' + $before.narrativeBlock('id') + ' ';
                            break;
                        }
                        else {
                            $before = $before.prev();
                        }
                    }
                }

                if (this.options.id) {
                    command += ' > ' + this.options.id + ' ';
                }
                console.log("RUNS COMMAND " + command);
                this.narrative.client.run_pipeline2_async(
                    this.narrative.user_id,
                    command,
                    [],
                    undefined,
                    this.narrative.wd,
                    $.proxy(
                        function (res) {

                            if (! res[1][0].match(/ 0$/)) {
                                var errorMsg = res[1].join("");
                                this.appendOutputUI(errorMsg);
                                this.enterErrorState();
                                this.narrative.save();
                            }
                            else {

                                if (res[1].length > 1) {
                                    this.appendOutputUI(res[1][1]);
                                }
                                else {

                                    this.narrative.client.get_file_async(
                                        this.narrative.user_id,
                                        this.options.id,
                                        this.narrative.wd,
                                        $.proxy(
                                            function (res) {
                                                this.appendOutputUI(res);
                                                this.narrative.save();
                                            },
                                            this
                                        ),
                                        function (err) { console.log("FILE FAILURE"); console.log(err) }
                                    );
                                }
                            }

                        },
                        this
                    ),
                    function (err) { console.log("RUN FAILURE"); console.log(err) }
                );


            }

        },

        activate : function() {
            this.data('block').css('border', '1px solid green');
            this.data('command-header').css('background-color', 'green');
            this.data('command-header').css('background-image', 'none');
            this.data('state', 'active');

            if (this.options.activateCallback) {
                this.options.activateCallback(this);
            }
        },

        enterErrorState : function() {
            this.data('block').css('border', '1px solid red');
            this.data('command-header').css('background-color', 'red');
            this.data('command-header').css('background-image', 'none');
            this.data('state', 'error');
        },

        leaveErrorState : function() {
            this.data('block').css('border', '');
            this.data('command-header').css('background-color', '');
            this.data('command-header').css('background-image', '');
            this.data('state', 'inactive');
        },

        deactivate : function() {
            this.data('block').css('border', '');
            this.data('command-header').css('background-color', '');
            this.data('command-header').css('background-image', '');
            this.data('state', 'inactive');

            if (this.options.deactivateCallback) {
                this.options.deactivateCallback(this);
            }

        },

        appendInputUI : function() {
            this.data('running', 0);
            this.data('command-name').spinner('remove');
            this.data('command-interface').slidingPanel();
            this.data('command-interface').slidingPanel('remove');

            if (! this.data('input-initialized')) {
                this.data('command-interface').formBuilder({elements : this.options.fields, values : this.options.values});
                this.data('input-initialized', 1);
            }

            this.data('gobutton').removeAttr('disabled');
            $('input', this.data('block')).each(
                function (idx, val) {
                    $(val).removeAttr('disabled');
                }
            );
        },

        appendOutputUI : function(output) {
            this.appendInputUI();
            if (output != undefined) {
                this.data('command-interface').slidingPanel({
                    content : output,
                    truncate : this.options.outputTruncate,
                    autoOpen : true
                });
            }
        },

        appendRunningUI : function() {
            this.appendInputUI();
            this.data('command-name').spinner({ position : 'right', hide: false, img : './jquery/spinner/spinner.gif'});
            this.data('gobutton').attr('disabled', 'disabled');
            this.data('running', 1);
            $('input', this.data('block')).each(
                function (idx, val) {
                    $(val).attr('disabled', 'disabled');
                }
            );
        },

        reposition : function() {

            this.data('command-name').position({of : this.data('command-header'), my : 'left', at : 'left+5 center'});

            this.data('command-controls').position({of : this.data('command-header'), my : 'right', at : 'right-5 center'});

//            if (! this.data('command-lastrun').data('initWidth')
//                && this.data('command-lastrun').width() > 0) {
//                this.data('command-lastrun').css('width', this.data('command-lastrun').width());
//                this.data('command-lastrun').data('initWidth', 1);
//            }

            this.data('command-lastrun').position({of : this.data('command-controls'), my : 'right center', at : 'left-3 center'});
            this.data('command-interface').formBuilder('resizeToMinimum');

            if ( this.data('command-interface').data('hasSlidingPanel') ) {
                this.data('command-interface').slidingPanel('reposition');
            }

        },

        blockDefinition : function() {

            return {
                values : this.data('command-interface').formBuilder('getFormValues'),
                type    : 'narrativeBlock',
                id      : this.options.id,
                fields  : this.options.fields,
                name    : this.options.name,
                outputTruncate : this.options.outputTruncate,
                inputType : this.options.inputType,
                outputType : this.options.outputType,
                lastRun : this.data('state') == 'error'
                    ? undefined
                    : this.data('command-lastrun').attr('datetime')
            };
        },

        inputType : function () {
            return this.options.inputType;
        },
        outputType : function () {
            return this.options.outputType;
        },

    });

}( jQuery ) );
