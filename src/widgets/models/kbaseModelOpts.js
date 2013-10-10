(function( $, undefined ) {

$.KBWidget({
    name: "kbaseModelOpts",
    version: "1.0.0",
    options: {
    },
    getData: function() {
        return {
            id: this.options.id,
            ws: this.options.workspace,
            title: "Model Options",
            type: "Model"
        }
    },
    
    init: function(options) {
        var self = this;
        this._super(options);
        var id = options.id
        var ws = options.workspace;
        var token = options.auth;

        var panel = this.$elem.kbasePanel({title: 'Model Options', 
                                           rightLabel: ws,
                                           subText: id});

        var panel_body = panel.body();

        panel_body.append('<a class="app-icon" href="http://140.221.84.128/#models?tab=model-selection&kbids='+
                    id+'&ws='+ws+'" target="_blank">\
                        <img src="http://www.kbase.us/files/6313/6148/9465/model_icon.png" width=30 >\
                    </a>\
                    <a href="http://140.221.84.128/#models?tab=model-selection&kbids='+
                    id+'&ws='+ws+'" target="_blank">Add to Model Viewer</a>');
        //panel_body.append('<br><br>')
        //panel_body.append('<a href="#/run-fba/'+ws+'/'+id+'">Run FBA</a> <span class="glyphicon glyphicon-arrow-right"></span>')

        return this;

    }  //end init

})
}( jQuery ) );
