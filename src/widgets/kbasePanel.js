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
                                    <h4 class="panel-title">'+title+'</h4>\
                                </div>\
                                <div class="panel-body"></div>\
                           </div>');

        var panel_body = container.find('.panel-body');

        if (body) {
            panel_body.append(body);
        }
        
        if (subText) {
            container.find('.panel-heading').append(subText)
        }

        if (right_label) {
            container.find('.panel-heading').append(
                '<span class="label label-primary pull-right">'+right_label+'</span><br>');
        }

        self.$elem.append(container);

        //this._rewireIds(this.$elem, this);

        this.body = function() {
            return panel_body;
        }

        return this;
    }  //end init
})
}( jQuery ) );
