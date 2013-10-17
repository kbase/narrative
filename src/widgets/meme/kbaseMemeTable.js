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

        var panel = this.$elem.kbasePanel({title: 'MEME service results', 
                                           rightLabel: ws});
        panel.loading();

        var tableSettings = {
            "fnDrawCallback": memeEvents,
            "sPaginationType": "full_numbers",
            "iDisplayLength": 10,
            "aaData": [],
            "oLanguage": {
                "sSearch": "Search all:"
            }
        };
        
        var prom = kb.req('ws', 'list_workspace_objects',
                            {type: 'MemeRunResult', workspace: ws});
        $.when(prom).done(function(d){

            var dataListMeme = formatObjs(d);

            var promT = kb.req('ws', 'list_workspace_objects',
                            {type: 'TomtomRunResult', workspace: ws});

            $.when(promT).done(function(d){
                var dataListTomtom = formatObjs(d);

                var promM = kb.req('ws', 'list_workspace_objects',
                                {type: 'MastRunResult', workspace: ws});
                $.when(promM).done(function(d){
                    var dataListMast = formatObjs(d);

                    var panel_body = panel.body();
                    var labels = ["ID", "Type", "Modification time"];
                    var cols = getColumnsByLabel(labels);
                    tableSettings.aoColumns = cols;
                    panel_body.append('<table id="meme-table2" class="table table-striped table-bordered"></table>');
                    var table = $('#meme-table2').dataTable(tableSettings);

                    table.fnAddData(dataListMeme);
                    table.fnAddData(dataListTomtom);
                    table.fnAddData(dataListMast);
                })
                
            })

        })

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
