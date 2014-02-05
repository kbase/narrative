(function( $, undefined ) {

$.KBWidget({
    name: "kbaseModelTable",
    version: "1.0.0",
    options: {
    },

    getData: function() {
        return {
//            id: this.options.id, // not sure where this is or if its necessary.
            type: "Model",
            workspace: this.options.ws,
            title: "Model Info"
        };
    },

    init: function(options) {
        this._super(options);
        var self = this;        
        var token = options.auth;
        var ws = options.ws

        var panel = this.$elem.kbasePanel({title: 'Model Info', 
                                           rightLabel: ws});
        panel.loading();
        var panel_body = panel.body();

        var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

        var tableSettings = {
            "fnDrawCallback": modelEvents,
            "sPaginationType": "full_numbers",
            "iDisplayLength": 20,
            "aaData": [],
            "oLanguage": {
                "sSearch": "Search all:"
            }
        }

        var wsAJAX = kbws.list_workspace_objects({workspace: ws, type: "Model", auth: token})

        panel_body.append('<p class="muted loader-table"> \
                                  <img src="assets/img/ajax-loader.gif"> loading...</p>')

        $.when(wsAJAX).done(function(data){
            var dataList = formatObjs(data);
            var labels = ["id", "Type", "Modified", "Command", "Something?", "Owner"];
            var cols = getColumnsByLabel(labels);
            tableSettings.aoColumns = cols;
            panel_body.append('<table id="rxn-table" class="table table-striped table-bordered"></table>')
            var table = $('#rxn-table').dataTable(tableSettings);
            table.fnAddData(dataList);

            $('.loader-table').remove()
        });

        function formatObjs(models) {
            for (var i in models) {
                var model = models[i];
                model[0] = '<a class="model-click" data-model="'+model[0]+'">'
                            +model[0]+'</a>'
            }
            return models;
        }

        function getColumnsByLabel(labels) {
            var cols = [];
            for (var i in labels) {
                cols.push({sTitle: labels[i]})
            }
            return cols;
        }

        function modelEvents() {
            $('.model-click').unbind('click');
            $('.model-click').click(function() {
                var model = $(this).data('model');
                self.trigger('modelClick', {model: model});
            });
        }

        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init


})
}( jQuery ) );
