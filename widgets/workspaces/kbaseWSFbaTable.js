(function( $, undefined ) {

$.KBWidget({
    name: "kbaseWSFbaTable",
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;        
        var token = options.auth;
        var ws = options.ws

        this.$elem.append('<div id="kbase-ws-fba-table" class="panel panel-default">\
                                <div class="panel-heading">\
                                    <h4 class="panel-title">FBA Objects</h4>\
                                    <span class="label label-primary pull-right">'+ws+'</span><br>\
                                </div>\
                                <div class="panel-body"></div>\
                           </div>');
        var container = $('#kbase-ws-fba-table .panel-body');

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

        var wsAJAX = kbws.list_workspace_objects({workspace: ws, type: "FBA", auth: token})

        container.append('<p class="muted loader-table"> \
                                  <img src="../common/img/ajax-loader.gif"> loading...</p>')

        $.when(wsAJAX).done(function(data){
            var dataList = formatObjs(data);
            var labels = ["id", "Type", "Modified", "Something", "Command", "Owner"];
            var cols = getColumnsByLabel(labels);
            tableSettings.aoColumns = cols;
            container.append('<table id="ws-fba-table" class="table table-striped table-bordered"></table>')
            var table = $('#ws-fba-table').dataTable(tableSettings);
            table.fnAddData(dataList);
            $('.loader-table').remove()
        });

        function formatObjs(objs) {
            for (var i in objs) {
                var obj = objs[i];
                obj[0] = '<a class="fba-click" data-fba="'+obj[0]+'">'
                            +obj[0]+'</a>'
            }
            return objs;
        }

        function getColumnsByLabel(labels) {
            var cols = [];
            for (var i in labels) {
                cols.push({sTitle: labels[i]})
            }
            return cols;
        }

        function modelEvents() {
            $('.fba-click').unbind('click');
            $('.fba-click').click(function() {
                var fba = $(this).data('fba');
                self.trigger('fbaClick', {fba: fba});
            });
        }

        return this;
    }  //end init
})
}( jQuery ) );
