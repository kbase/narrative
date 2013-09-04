(function( $, undefined ) {

$.KBWidget({
    name: "kbaseWSModelTable",    
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;        
        var token = options.auth;
        var ws = options.ws

        this.$elem.append('<div id="kbase-model-table" class="panel panel-default">\
                                <div class="panel-heading">\
                                    <h4 class="panel-title">Models</h4>\
                                    <span class="label label-primary pull-right">'+ws+'</span><br>\
                                </div>\
                                <div class="panel-body"></div>\
                           </div>');
        var container = $('#kbase-model-table .panel-body');

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

        container.append('<p class="muted loader-table"> \
                                  <img src="../common/img/ajax-loader.gif"> loading...</p>')

        $.when(wsAJAX).done(function(data){
            var dataList = formatObjs(data);
            var labels = ["id", "Type", "Modified", "Command", "Something?", "Owner"];
            var cols = getColumnsByLabel(labels);
            tableSettings.aoColumns = cols;
            container.append('<table id="rxn-table" class="table table-striped table-bordered"></table>')
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
