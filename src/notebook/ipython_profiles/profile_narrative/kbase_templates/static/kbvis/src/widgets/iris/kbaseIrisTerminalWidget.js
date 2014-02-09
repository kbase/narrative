/*


*/

define('kbaseIrisTerminalWidget',
    [
        'jquery',
        'kbaseIrisWidget',
        'kbaseButtonControls',
        'kbaseDeletePrompt',
    ],
    function ($) {



    $.KBWidget(
        {

            name: "kbaseIrisTerminalWidget",
            parent: 'kbaseIrisWidget',

            version: "1.0.0",

            _accessors : [
                'collapsed',
                {name : 'isComment', setter : 'setIsComment'},
            ],

            options: {
                subCommand : false,
            },

            init : function(options) {
                this._super(options);

                $(document).on(
                    'updateIrisProcess.kbaseIris',
                    $.proxy(function (e, params) {
                        if (params.pid == this.pid()) {
                            this.startThinking();
                        }
                    }, this)
                );

                $(document).on(
                    'removeIrisProcess.kbaseIris',
                    $.proxy(function (e, pid) {
                        if (pid == this.pid()) {
                            this.stopThinking();
                        }
                    }, this)
                );

                $(document).on(
                    'clearIrisProcesses.kbaseIris',
                    $.proxy(function (e) {
                        this.stopThinking();
                    }, this)
                );

                return this;
            },

            setIsComment : function(isComment) {
                this.setValueForKey('isComment', isComment);

                if (isComment) {
                    this.data('cwdDisplay').css('display', 'none');
                    this.data('inputContainer').css('font-weight', 'normal');
                    this.data('input').css('font-weight', 'normal');
                    this.data('inputContainer').css('font-style', 'italic');
                    this.data('line').css('display', 'none');
                }
                else {
                    this.data('cwdDisplay').css('display', '');
                    this.data('inputContainer').css('font-weight', 'bold');
                    this.data('input').css('font-weight', '');
                    this.data('inputContainer').css('font-style', '');
                    this.data('line').css('display', '');
                }
            },

            appendUI : function($elem) {

                var $inputDiv = $.jqElem('div')
                    .css('white-space', 'pre')
                    .css('position', 'relative')
                    .css('style', 'font-weight : bold')
                    .append(
                        $.jqElem('span')
                            .attr('id', 'cwdDisplay')
                            .append('&gt;')
                            .append(
                                $.jqElem('span')
                                    .attr('id', 'cwd')
                                    .addClass('command')
                                    .kb_bind(this, 'cwd', {transformedValue : $.proxy(function (val) {return this.escapeText(val)}, this)} )
                            )
                            .append('&nbsp;')
                    )
                    .append(
                        $.jqElem('span')
                            .attr('id', 'input')
                            .attr('contenteditable', 'true')
                            .addClass('command')
                            .kb_bind(this, 'input',
                                {
                                    transformedValue        : $.proxy(function (val) {return this.escapeText(val)}, this),
                                    reverseTransformedValue : $.proxy(function (val) {
                                        var $html = $.jqElem('span').html(val);

                                        this.trigger('runWidget', {$widget : this, command : $html.text()});
                                        return $html.text()
                                    }, this)
                                }
                            )
                            .bind('keypress', function(e) {
                                if (event.metaKey || event.altKey || event.ctrlKey) {
                                    return;
                                }
                                if (event.which == 13) {
                                    this.blur();
                                }
                            })
                    )
                    .mouseover(
                        function(e) {
                            $(this).children().first().show();
                        }
                    )
                    .mouseout(
                        function(e) {
                            $(this).children().first().hide();
                        }
                    )
                ;

                $elem
                    .append(
                        $.jqElem('div')
                            .attr('id', 'thoughtBox')
                            .addClass('pull-left')
                            .append( $.jqElem('i').addClass('fa fa-spinner fa fa-spin') )
                            .css('display', 'none')
                    )
                    .append(
                        $inputDiv
                            .attr('id', 'inputContainer')
                            .on('click',
                                $.proxy(function(e) {
                                    this.data('output').show();
                                    this.data('subWidgets').show();
                                    this.data('error').show();
                                    this.data('line').show();
                                }, this)
                            )
                    )
                    .append(
                        $.jqElem('div')
                            .attr('id', 'outputWrapper')
                            .css('position', 'relative')
                            .append(
                                $.jqElem('div')
                                    .attr('id', 'output')
                                    .kb_bind(this, 'output', {transformedValue : $.proxy(function (val) {return this.escapeText(val)}, this)} )
                            )
                            .append(
                                $.jqElem('div')
                                    .attr('id', 'subWidgets')
                            )
                    )
                    .append(
                        $.jqElem('div')
                            .attr('id', 'error')
                            .css('font-style', 'italic')
                            .kb_bind(this, 'error', {transformedValue : $.proxy(function (val) {return this.escapeText(val)}, this)} )
                    )
                    .append($.jqElem('hr').attr('id', 'line'))
                ;

                this._rewireIds($elem, this);

                $inputDiv.kbaseButtonControls(
                    {
                        context : this,
                        controls : [
                            {

                                icon : 'fa fa-link',
                                //tooltip : 'select widget',
                                callback :
                                    function (e, $it) {
                                        $it.toggleSelection();
                                    },
                            },

                            {
                                icon : 'fa fa-eye',
                                //tooltip : 'view output',
                                callback :
                                    function (e, $it) {
                                        $it.viewOutput();
                                    },
                            },
                            {
                                icon : 'fa fa-times',
                                //tooltip : 'remove command',
                                callback :
                                    $.proxy( function (e) {
                                        this.removeWidgetPrompt();
                                    }, this)
                            },
                            {
                                icon : 'fa fa-caret-up',
                                'icon-alt' : 'fa fa-caret-down',
                                //tooltip : {title : 'collapse / expand', placement : 'bottom'},
                                callback : $.proxy(function(e) {
                                    this.collapsed( ! this.collapsed() );
                                    this.data('output').toggle();
                                    this.data('subWidgets').toggle();
                                    this.data('error').toggle();
                                    this.data('line').toggle();
                                }, this)
                            },

                        ]
                    }
                );

                this.data('outputWrapper').kbaseButtonControls(
                    {
                        position : 'bottom',
                        context : this,
                        controls : [
                            {
                                icon : 'fa fa-link',
                                callback :
                                    function (e, $it) {
                                        $it.toggleSelection();
                                    }
                            },
                            {
                                icon : 'fa fa-angle-double-up',
                                callback :
                                function (e, $it) {
                                    $it.trigger('scrollTo', $it.$elem.prop('offsetTop') - 85);
                                    /*$it.$elem.parent().animate(
                                            {
                                                scrollTop: $it.$elem.prop('offsetTop') - 85
                                            },
                                            0
                                        );
                                    }*/
                                }
                            },
                            {
                                icon : 'fa fa-times',
                                callback :
                                    function (e, $it) {
                                        $it.removeWidgetPrompt();
                                    }
                            }
                        ]
                    }
                );

                return $elem;

            },

            removeWidgetPrompt : function() {
                var $deletePrompt = $.jqElem('div').kbaseDeletePrompt(
                    {
                        name     : 'this widget',
                        callback : $.proxy( function(e, $prompt) {
                            $prompt.closePrompt();
                            /*var $next = this.$elem.next();
                            if ($next.prop('tagName') == 'HR') {
                                $next.remove();
                            }
                            this.$elem.remove();*/
                            this.trigger('removeWidget', {$widget : this});
                        }, this)
                    }
                );

                $deletePrompt.openPrompt();
            },

            startThinking : function() {
                this.data('thoughtBox').show();
            },

            stopThinking : function() {
                this.data('thoughtBox').hide();
            },

            setInput : function(newVal) {
                this._super(newVal);

                if (typeof newVal != 'string' || ! newVal.length) {
                    this.data('inputContainer').css('display', 'none');
                }

            },

            setError : function (newVal) {
                this._super(newVal);

                if (typeof newVal == 'string' && newVal.match(/error/i) ) {
                    this.data('inputContainer').css('color', 'red');
                }

            },

            setSubCommand : function(subCommand, open) {

                if (this.data('inputContainer') == undefined) {
                    return;
                }

                if (subCommand) {
                    this.data('inputContainer').css('color', 'gray');
                    if (! open) {
                        this.data('output').hide();
                        this.data('error').hide();
                        this.data('line').hide();
                    }
                }
                else {
                    this.data('inputContainer').css('color', 'black');
                }

                this._super(subCommand);

            },

            freeze : function() {
                var json = this._super();
                json.collapsed = this.collapsed();
                json.isComment = this.isComment();
                return json;
            },

            thaw : function(json) {
                var $widget = this._super(json);
                if (json.collapsed) {
                    $widget.data('output').hide();
                    $widget.data('subWidgets').hide();
                    $widget.data('error').hide();
                    $widget.data('line').hide();
                }
                $widget.setIsComment(json.isComment);
                return $widget;
            },

        }

    );

});
