/*


*/

define('kbaseIrisEchoWidget',
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

            name: "kbaseIrisEchoWidget",
            parent: 'kbaseIrisWidget',

            version: "1.0.0",

            _accessors : [
                'terminal',
            ],

            options: {

            },

            setInput : function (newVal) {
                this.setValueForKey('input',  newVal);
                this.setValueForKey('output', newVal);
                this.setValueForKey('value', newVal);
//                this.setOutput(newVal);
            },

            appendUI : function($elem) {

                var $form = $.jqElem('div').kbaseFormBuilder(
                    {
                        elements :
                            [
                                 {
                                    name : 'echo',
                                    label : 'Echo this value',
                                    type : 'text',
                                    key : 'echo',
                                    description: "This widget echoes and broadcasts the value typed in.",
                                    kb_bind : [this, 'input'],
                                }
                            ],
                    }
                );

                var $box = $.jqElem('div').kbaseBox(
                    {
                        title : 'Echo Chamber',
                        content :
                            $.jqElem('div')
                                .addClass('row')
                                .append(
                                    $.jqElem('div')
                                        .addClass('col-sm-12')
                                        .append($form.$elem)
                                ),
                        controls : [
                            {
                                icon : 'fa fa-times',
                                callback :
                                    $.proxy(function (e, $gui) {
                                        var $deleteModal = $.jqElem('div').kbaseDeletePrompt(
                                            {
                                                name : 'Echo Chamber',
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
