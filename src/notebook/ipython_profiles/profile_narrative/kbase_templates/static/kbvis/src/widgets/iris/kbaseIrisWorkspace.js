/*


*/

define('kbaseIrisWorkspace',
    [
        'jquery',
        'kbaseTabs',
    ],
    function ($) {



    $.KBWidget({
        name   : 'kbaseIrisWorkspace',
        parent : 'kbaseTabs',
        version: "1.0.0",

        options: {
        },

        XXXappendUI : function ($elem, elements) {

            $elem.append(
                $.jqElem('div')
                    .css('padding', '2px')
                    .append(
                        $('<h5></h5>')
                            .addClass('text-left')
                            .html('&nbsp;')
                            .css('padding', '2px')
                            .css('margin', '0px')
                            .css('position', 'relative')
                            .append(
                                $.jqElem('div')
                                .css('right', '0px')
                                .css('top', '0px')
                                .css('position', 'absolute')
                                .append(
                                    $.jqElem('button')
                                        .addClass('btn btn-default btn-mini')
                                        .append($('<i></i>').addClass('fa fa-plus'))
                                        .css('padding-top', '1px')
                                        .css('padding-bottom', '1px')
                                        .attr('title', 'Add a terminal')
                                        .tooltip()
                                        .bind('click', $.proxy(function (e) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            this.addTab(
                                                {
                                                    tab : 'Iris Terminal',
                                                    content : $term.$elem,
                                                    canDelete : false,
                                                    show : true,
                                                }
                                            );


                                        },this))
                                )
                        )
                    )
            );

            this._super($elem, elements);

        },



    });

});
