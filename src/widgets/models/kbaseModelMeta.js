(function( $, undefined ) {

$.KBWidget({
    name: "kbaseModelMeta",     
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        var self = this;
        this._super(options);
        var models = options.ids;
        var workspaces = options.workspaces;
        var token = options.auth;

        var panel = this.$elem.kbasePanel({title: 'Model Info', 
                                           rightLabel: workspaces[0],
                                           subText: models[0]});
        panel.loading();
        var panel_body = panel.body();

        var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

        var meta_AJAX = kbws.get_objectmeta({type: 'Model',
                            workspace: workspaces[0], id: models[0]});
        $.when(meta_AJAX).done(function(data){
            console.log(data)
            var labels = ['ID','Type','Moddate','Instance',
                          'Command','Last Modifier','Owner','Workspace','Ref']

            var table = $('<table class="table table-striped table-bordered" \
                                  style="margin-left: auto; margin-right: auto;"></table>');
            for (var i=0; i<data.length-2; i++) {
                table.append('<tr><td>'+labels[i]+'</td> \
                              <td>'+data[i]+'</td></tr>');
            }
            panel.rmLoading();
            panel_body.append(table);
        })

        return this;

    }  //end init

})
}( jQuery ) );
