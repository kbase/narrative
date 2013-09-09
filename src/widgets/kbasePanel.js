(function( $, undefined ) {

$.KBWidget({
    name: "kbasePanel",
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;
        var ws = options.ws;   
        var title = options.title ? options.title : "Default Panel Heading";
        var right_label = options.rightLabel;
        var body = options.body

        var container = $('<div class="panel panel-default">\
                                <div class="panel-heading">\
                                    <h4 class="panel-title">'+title+'</h4>\
                                </div>\
                                <div class="panel-body"></div>\
                           </div>');
        console.log(right_label)

        if (body) {

        }
        
        if (right_label) {
            container.find('.panel-heading').append(
                '<span class="label label-primary pull-right">'+right+'</span><br>');
        }

        self.$elem.append(container);

        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init
})
}( jQuery ) );
