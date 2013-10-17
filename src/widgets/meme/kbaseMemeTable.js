(function( $, undefined ) {

$.KBWidget({
    name: "kbaseMemeTable",      
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;        
        var ws = options.ws;
        var title = options.title;
        var data = options.data;
        var type = options.type;
        var tableId = options.tableId;
        var panelTitle = '';
        if (type === 'MemeRunResult'){
            panelTitle = 'MEME run results';
        } else if (type === 'TomtomRunResult'){
            panelTitle = 'TOMTOM run results';
        } else if (type === 'MastRunResult'){
            panelTitle = 'MAST run results';
        };

        var panel = this.$elem.kbasePanel({title: panelTitle, 
                                           rightLabel: ws});
        panel.loading();
        var panel_body = panel.body();

        var tableSettings = {
            "fnDrawCallback": memeEvents,
            "sPaginationType": "full_numbers",
            "iDisplayLength": 10,
            "aaData": [],
            "oLanguage": {
                "sSearch": "Search all:"
            }
        };

        var dataList = formatObjs(data);
        var labels = ["ID", "Type", "Modification time"];
        var cols = getColumnsByLabel(labels);
        tableSettings.aoColumns = cols;
        panel_body.append('<table id="' + tableId + '" class="table table-striped table-bordered"></table>');
        var table = $('#'+ tableId).dataTable(tableSettings);
        table.fnAddData(dataList);
/*
        function ws_list(count) {
            var ws = [];
            for (var i=0; i < count; i++ ) { ws.push('AKtest'); }
            return ws;
        }
*/
        function formatObjs(meme_meta) {
            var meme_list = [];
            for (var i in meme_meta) {
                var meme = meme_meta[i].slice();
                meme[0] = '<a class="meme-click" data-meme="'+meme[0]+'">'
                            +meme[0]+'</a>';
                meme_list.push(meme);
            }
            return meme_list;
        }

        function getColumnsByLabel(labels) {
            var cols = [];
            for (var i in labels) {
                cols.push({sTitle: labels[i]});
            }
            return cols;
        }

        function memeEvents() {
            $('.meme-click').unbind('click');
            $('.meme-click').click(function() {
                var meme = $(this).data('meme');
                self.trigger('memeClick', {id: meme});
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


});
}( jQuery ) );
