(function( $, undefined ) {

$.KBWidget({
    name: "kbaseWSMediaTable",      
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;        
        var token = options.auth;
        var ws = options.ws
        var title = options.title ? options.title : "Biochemistry Media"
        var selectable = options.selectable;

        var container = $('<div id="kbase-ws-media-table" class="panel panel-default">\
                                <div class="panel-heading">\
                                    <h4 class="panel-title">'+title+'</h4>\
                                    <span class="label label-primary pull-right select-ws" \
                                    data-ws="'+ws+'">'+ws+'</span><br>\
                                </div>\
                                <div class="panel-body"></div>\
                           </div>')
        this.$elem.append(container);

        var panel_body = container.find('.panel-body');

        var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

        var tableSettings = {
            "fnDrawCallback": mediaEvents,
            "sPaginationType": "full_numbers",
            "iDisplayLength": 20,
            "aaData": [],
            "oLanguage": {
                "sSearch": "Search all:"
            }
        }

        //var bioAJAX = fba.get_biochemistry({});
        var wsAJAX = kbws.list_workspace_objects({workspace: ws, type:"Media"})

        panel_body.append('<p class="muted loader-table"> \
                                  <img src="../common/img/ajax-loader.gif"> loading...</p>')

        $.when(wsAJAX).done(function(data){
            var dataList = formatObjs(data);
            var labels = ["id", "abbrev", "formula", "charge", "deltaG", "deltaGErr", "name", "aliases"];
            var cols = getColumnsByLabel(labels);
            tableSettings.aoColumns = cols;
            panel_body.append('<table id="media-table2" class="table table-striped table-bordered"></table>')
            var table = $('#media-table2').dataTable(tableSettings);
            table.fnAddData(dataList);

            $('.loader-table').remove()
        });

        function ws_list(count) {
            var ws = []
            for (var i=0; i < count; i++ ) { ws.push('KBaseMedia'); }
            return ws
        }

        function formatObjs(media_meta) {
            for (var i in media_meta) {
                var media = media_meta[i];
                media[0] = '<a class="media-click" data-media="'+media[0]+'">'
                            +media[0]+'</a>'
            }
            return media_meta;
        }

        function getColumnsByLabel(labels) {
            var cols = [];
            for (var i in labels) {
                cols.push({sTitle: labels[i]})
            }
            return cols;
        }

        function mediaEvents() {
            $('.media-click').unbind('click');
            $('.media-click').click(function() {
                var media = $(this).data('media');
                self.trigger('mediaClick', {media: media});
            });

            $('.select-ws').unbind('click');
            $('.select-ws').click(function() {
                var ws = $(this).data('ws');
                self.trigger('selectWS', {ws: ws});
            });
        }

        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init


})
}( jQuery ) );
