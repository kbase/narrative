/* 
    kbasePanel

    This is a helper widget for drawing panels.

    API Example:
        var panel = this.$elem.kbasePanel({title: 'Model Details', 
                                           rightLabel: 'Super Workspace,
                                           subText: 'kb|g.super.genome '});
*/

(function( $, undefined ) {

$.KBWidget({
    name: "kbasePanel",
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;

        var title = options.title ? options.title : "Default Panel Heading";
        var subText = options.subText;
        var right_label = options.rightLabel;
        var body = options.body

        var container = $('<div class="panel panel-default">\
                                <div class="panel-heading">\
                                    <h4 class="panel-title"></h4>\
                                </div>\
                                <div class="panel-body"></div>\
                           </div>');

        var panel_header = container.find('.panel-heading');
        var panel_title = container.find('.panel-title');
        var panel_body = container.find('.panel-body');

        if (title) panel_title.html(title);
        if (body) panel_body.html(body); 
        if (subText) panel_header.append(subText)

        if (right_label) {
            panel_header.append('<span class="label label-primary pull-right">'
                                    +right_label+'</span><br>');
        }

        this.header = function(data) {
            if (data) panel_header.html(data);
            return panel_header;
        }

        this.title = function(data) {
            if (data) panel_title.html(data);
            return panel_title;
        }        

        this.body = function(data) {
            if (data) panel_body.html(data);          
            return panel_body;
        }


        self.$elem.append(container);

        //this._rewireIds(this.$elem, this);

        return this;
    }  //end init
})
}( jQuery ) );
