(function( $, undefined ) {

$.kbWidget("kbaseBioMediaTable", 'kbaseWidget', {
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;        
        var token = options.auth;

        var bio_media_ws = "KBaseMedia"

        this.$elem.append('<div id="kbase-bio-media-table" class="panel">\
                                <div class="panel-heading"><b>Biochemistry Media</b>\
                                <span class="label label-info pull-right">'+bio_media_ws+'</span><br>\
                           </div>');
        var container = $('#kbase-bio-media-table');

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
        var wsAJAX = kbws.list_workspace_objects({workspace: bio_media_ws, type:"Media"})

        container.append('<p class="muted loader-table"> \
                                  <img src="../common/img/ajax-loader.gif"> loading...</p>')

        $.when(wsAJAX).done(function(data){
            console.log(data)

            var dataList = formatObjs(data);
            var labels = ["id", "abbrev", "formula", "charge", "deltaG", "deltaGErr", "name", "aliases"];
            var cols = getColumnsByLabel(labels);
            tableSettings.aoColumns = cols;
//            tableSettings.aaData = dataList
            container.append('<table id="rxn-table" class="table table-striped table-bordered"></table>')
            var table = $('#rxn-table').dataTable(tableSettings);
            table.fnAddData(dataList);

            $('.loader-table').remove()

        });



        function ws_list(count) {
            var ws = []
            for (var i=0; i < count; i++ ) { ws.push('KBaseMedia'); }
            return ws
        }

        function load_table(media_data) {
            var dataDict = formatObjs(media_data);
            var keys = ["id", "abbrev", "formula",  "charge", "deltaG", "deltaGErr", "name", "aliases"];
            var labels = ["id", "abbrev", "formula", "charge", "deltaG", "deltaGErr", "name", "aliases"];
            var cols = getColumnsByLabel(labels);
            tableSettings.aoColumns = cols;
            container.append('<table id="rxn-table" class="table table-striped table-bordered"></table>')
            var table = $('#rxn-table').dataTable(tableSettings);
            table.fnAddData(dataDict);
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
        }


        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init


})
}( jQuery ) );
