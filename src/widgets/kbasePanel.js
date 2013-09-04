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
        var body = options.body

        var fba = new fbaModelServices('http://140.221.85.73:4043/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

        var container = $('<div class="panel panel-default">\
                                <div class="panel-heading">\
                                    <h4 class="panel-title">'+title+'</h4>\
                                </div>\
                                <div class="panel-body">'+body+'</div>\
                           </div>');
        self.$elem.append(container);



        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init
})
}( jQuery ) );
