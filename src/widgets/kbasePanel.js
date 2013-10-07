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
        var body = options.body;

        var drag = options.drag;

        var container = $('<div class="panel panel-default">\
                                <div class="panel-heading">\
                                    <h4 class="panel-title"></h4>\
                                    <div class="panel-subtitle"></div>\
                                </div>\
                                <div class="panel-body"></div>\
                           </div>');

        var panel_header = container.find('.panel-heading');
        var panel_title = container.find('.panel-title');
        var panel_subtitle = container.find('.panel-subtitle');        
        var panel_body = container.find('.panel-body');

        this.header = function(data) {
            if (data) panel_header.html(data);
            return panel_header;
        }

        this.title = function(data) {
            if (data) panel_title.html(data);
            return panel_title;
        }

        this.subText = function(data) {
            if (data) panel_subtitle.html(data)
            return panel_subtitle;            
        }

        this.body = function(data) {
            if (data) panel_body.html(data); 
            this.rmLoading();         
            return panel_body;
        }

        this.loading = function() {
            panel_body.html('<p class="muted ajax-loader"> \
                <img src="assets/img/ajax-loader.gif"> loading...</p>');
        }

        // deprecated?  I think this method could be handy
        this.rmLoading = function() {
            panel_body.find('.ajax-loader').remove();
        }


        if (title) this.title(title);
        if (body) this.body(body); 
        if (subText) panel_header.append(subText)

        if (right_label) {
            panel_header.append('<span class="label label-primary pull-right">'
                                    +right_label+'</span><br>');
        }

        self.$elem.append(container);

        return this;
    }  //end init
})
}( jQuery ) );

