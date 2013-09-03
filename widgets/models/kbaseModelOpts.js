(function( $, undefined ) {

$.KBWidget({
    name: "kbaseModelOpts",
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        var self = this;
        this._super(options);
        var id = options.id
        var workspace = options.workspace;
        var token = options.auth;

        this.$elem.append('<div id="kbase-model-opts" class="panel panel-default">\
                                <div class="panel-heading">\
                                    <h4 class="panel-title">Model Options</h4>\
                                </div>\
                                <div class="panel-body"></div>\
                           </div>');

        var container = $('#kbase-model-opts .panel-body');

        container.append('<a class="app-icon" href="http://140.221.84.128/#models?tab=model-selection&kbids='+
                    id+'&ws='+workspace+'" target="_blank">\
                        <img src="http://www.kbase.us/files/6313/6148/9465/model_icon.png" width=30 >\
                    </a>\
                    <a href="http://140.221.84.128/#models?tab=model-selection&kbids='+
                    id+'&ws='+workspace+'" target="_blank">Add to Model Viewer</a>');
        container.append('<br><br>')
        container.append('<a href="#/run-fba/'+workspace+'/'+id+'">Run FBA</a> <span class="glyphicon glyphicon-arrow-right"></span>')


        return this;

    }  //end init

})
}( jQuery ) );
