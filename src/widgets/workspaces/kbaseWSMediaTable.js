(function( $, undefined ) {

$.KBWidget({
    name: "kbaseWSMediaTable",      
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;        
        var ws = options.ws
        var title = options.title;
        var data = options.data;

        var panel = this.$elem.kbasePanel({title: 'Biochemistry Media', 
                                           rightLabel: ws});
        panel.loading();
        var panel_body = panel.body();

        var tableSettings = {
            "fnDrawCallback": mediaEvents,
            "sPaginationType": "full_numbers",
            "iDisplayLength": 20,
            "aaData": [],
            "oLanguage": {
                "sSearch": "Search all:"
            }
        }

        var dataList = formatObjs(data);
        var labels = ["id", "abbrev", "formula", "charge", "deltaG", "deltaGErr", "name", "aliases"];
        var cols = getColumnsByLabel(labels);
        tableSettings.aoColumns = cols;
        panel_body.append('<table id="media-table2" class="table table-striped table-bordered"></table>')
        var table = $('#media-table2').dataTable(tableSettings);
        table.fnAddData(dataList);

        function ws_list(count) {
            var ws = []
            for (var i=0; i < count; i++ ) { ws.push('KBaseMedia'); }
            return ws
        }

        function formatObjs(media_meta) {
            console.log(media_meta)
            var media_list = [];
            for (var i in media_meta) {
                var media = media_meta[i].slice();
                media[0] = '<a class="media-click" data-media="'+media[0]+'">'
                            +media[0]+'</a>'
                media_list.push(media);
            }
            return media_list;
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
