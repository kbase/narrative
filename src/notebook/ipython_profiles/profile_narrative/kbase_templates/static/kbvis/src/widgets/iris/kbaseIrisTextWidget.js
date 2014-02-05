/*


*/

define('kbaseIrisTextWidget',
    [
        'jquery',
        'kbaseIrisWidget',
    ],
    function ($) {



    $.KBWidget(
        {

            name: "kbaseIrisTextWidget",
            parent: 'kbaseIrisWidget',

            version: "1.0.0",
            _accessors : [
                {name : 'text', setter : 'setText'}
            ],

            options: {

            },


            setText : function (newVal, type) {

                if (type == undefined) {
                    type = 'text';
                }

                if (type == 'text') {
                    newVal = $.jqElem('span')
                        .css('white-space', 'pre')
                        .append(
                            typeof newVal == 'string'
                                ? newVal
                                : newVal.text()
                        ).html();
                }
                else if (type == 'html' && typeof newVal == 'string') {
                    newVal = $.jqElem('span').html(newVal);
                }

                this.setValueForKey('text', newVal);
            },

            appendUI : function($elem) {

                var $textDiv = $.jqElem('div')
                    .attr('id', 'text')
                    .kb_bind(this, 'text', {transformedValue : $.proxy(function (val) {return this.escapeText(val)}, this)} )
                ;

                $elem.append($textDiv);

                this._rewireIds($elem, this);

                return $elem;

            },
        }

    );

});
