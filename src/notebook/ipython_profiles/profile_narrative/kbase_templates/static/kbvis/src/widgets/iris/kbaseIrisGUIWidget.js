/*


*/

define('kbaseIrisGUIWidget',
    [
        'jquery',
        'kbaseIrisWidget',
        'kbaseFormBuilder',
        'kbaseBox',
        'kbaseDeletePrompt'
    ],
    function ($) {


    $.KBWidget(
        {

            name: "kbaseIrisGUIWidget",
            parent: 'kbaseIrisWidget',

            version: "1.0.0",

            _accessors : [
                'terminal',
            ],

            options: {

            },

            appendUI : function($elem) {

                var metaFunc = MetaToolInfo(this.options.command);

                var meta = metaFunc(this.options.command);

                var $form = $.jqElem('div').kbaseFormBuilder(
                    {
                        elements : meta.fields
                    }
                );

                var $box = $.jqElem('div').kbaseBox(
                    {
                        title : meta.label,
                        content :
                            $.jqElem('div')
                                .addClass('row')
                                .append(
                                    $.jqElem('div')
                                        .addClass('col-sm-9')
                                        //.css('border', '1px solid red')
                                        .append($form.$elem)
                                )
                                .append(
                                    $.jqElem('div')
                                        .addClass('col-sm-2')
                                        .css('height', '100px')
                                        //.css('border', '1px solid green')
                                        //.css('display', 'none')
                                        .css('font-size', '4px')
                                        .css('overflow', 'hidden')
                                        .attr('id', 'output')
                                        .on('click',
                                            $.proxy(function (e) {
                                                e.stopPropagation(); e.preventDefault();
                                                this.viewOutput();
                                            }, this)
                                        )
                                        .kb_bind(this, 'output')
                                ),
                        controls : [
                            {
                                icon : 'fa fa-copy',
                                callback : $.proxy(function(e) {
                                    var $box = this.data('box').kbaseBox();

                                }, this),
                                id : 'runButton'
                            },
                            {
                                icon : 'fa fa-save',
                                callback : $.proxy(function(e) {
                                    var $box = this.data('box').kbaseBox();

                                }, this),
                                id : 'runButton'
                            },
                            {
                                icon : 'fa fa-play',
                                callback : $.proxy(function(e) {
                                    $box.startThinking();
                                    var command = this.options.command + ' ' + $form.getFormValuesAsString();
                                    this.terminal().run(command, this);
                                }, this),
                                id : 'runButton'
                            },
                            {
                                icon : 'fa fa-question',
                                callback : $.proxy(function(e) {
                                    e.preventDefault(); e.stopPropagation();

                                    this.setOutput(undefined);
                                    this.terminal().run(this.options.command + ' -h', this);

                                }, this),
                                id : 'helpButton'
                            },
                            {
                                icon : 'fa fa-times',
                                callback :
                                    $.proxy(function (e, $gui) {
                                        var $deleteModal = $.jqElem('div').kbaseDeletePrompt(
                                            {
                                                name : this.options.command,
                                                callback : function(e, $prompt) {
                                                    $prompt.closePrompt();
                                                    $elem.remove();
                                                }
                                            }
                                        );

                                        $deleteModal.openPrompt();

                                    }, this)
                            },
                        ],

                    }
                );

                $elem
                    .append(
                        $box.$elem
                            .attr('id', 'box')
                    )
                ;
                this._rewireIds($elem, this);

                return $elem;

            },

            setOutput : function (newOutput) {
                this.data('box').kbaseBox('stopThinking');
                this._super(newOutput);
            },

            /*setOutput : function(newOutput) {
                if (newOutput != undefined && newOutput.length) {
                    this.data('output').css('display', 'block');
                }
                else {
                    this.data('output').css('display', 'none');
                }
                this._super(newOutput);
            }*/

        }

    );

});
