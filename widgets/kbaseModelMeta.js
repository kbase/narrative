(function( $, undefined ) {

$.kbWidget("kbaseModelMeta", 'kbaseWidget', {
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        var self = this;
        this._super(options);
        var models = options.ids;
        var workspaces = options.workspaces;
        var token = options.auth;


        this.$elem.append('<div id="kbase-model-meta" class="panel panel-default">\
                                <div class="panel-heading">\
                                    <h4 class="panel-title">Model Info</h4>'
                                     +models[0]+
                                    '<span class="label label-primary pull-right">'+workspaces[0]+'</span><br>\
                                </div>\
                                <div class="panel-body"></div>\
                           </div>');

        var container = $('#kbase-model-meta .panel-body');

        var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

        var meta_AJAX = kbws.get_objectmeta({type: 'Model',
                workspace: workspaces[0], id: models[0]});
        container.append('<p class="muted loader-overview"> \
                                  <img src="../common/img/ajax-loader.gif"> loading...</p>');

        $.when(meta_AJAX).done(function(data){
            $('.loader-overview').remove();            
            var labels = ['ID','Type','Moddate','Instance',
                          'Command','Last Modifier','Owner','Workspace','Ref']

            var table = $('<table class="table table-striped table-bordered" style="margin-left: auto; margin-right: auto;"></table>');
            for (var i=0; i<data.length-2; i++) {
                table.append('<tr><td>'+labels[i]+'</td> \
                                                 <td>'+data[i]+'</td></tr>');
            }
            container.append(table);
            // model viewer link
            container.append('<a class="app-icon" href="http://140.221.84.128/#models?tab=model-selection&kbids='+
                    models[0]+'&ws='+workspaces[0]+'" >\
                        <img src="http://www.kbase.us/files/6313/6148/9465/model_icon.png" width=30 >\
                    </a>\
                    <a href="http://140.221.84.128/#models?tab=model-selection&kbids='+
                    models[0]+'&ws='+workspaces[0]+'" >Add to Model Viewer</a>');
        })

        //this._rewireIds(this.$elem, this);
        return this;

    }  //end init

})
}( jQuery ) );
