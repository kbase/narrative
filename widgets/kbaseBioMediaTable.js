(function( $, undefined ) {

$.kbWidget("kbaseBioMediaTable", 'kbaseWidget', {
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;        
        var token = options.auth;

        this.$elem.append('<div id="kbase-bio-media-table" class="panel">\
                                <div class="panel-heading"><b>Biochemistry Media</b><br>\
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

        var chunk = 3;

        var bioAJAX = fba.get_biochemistry({});

        container.append('<div class="progress">\
              <div class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 3%;">\
              </div>\
            </div>')

        var proms = [];
        k = 1;        
        $.when(bioAJAX).done(function(data){
            console.log(data)
            var medias = data.media;
            var total = medias.length
            var iterations = parseInt(total / chunk)
            var media_data = []

            for (var i=0; i<iterations; i++) {
                var media_subset = medias.slice( i*chunk, (i+1)*chunk -1) ;
                console.log(media_subset)
                var AJAX = fba.get_media({medias: media_subset });
                proms.push(AJAX); // doesn't work for whatever reason
                $.when(AJAX).done(function(media){
                    k = k + 1;
                    media_data =  media_data.concat(media);
                    var percent = (media_data.length / total) * 100+'%';
                    $('.progress-bar').css('width', percent)

                    if (k == iterations) {
                        console.log(media_data);
                        $('.progress').remove();                        
                        load_table(cpd_data)
                    }            
                });
            }
        })

        function load_table(media_data) {
            var dataDict = formatObjs(media_data);
            var keys = ["id", "abbrev", "formula",  "charge", "deltaG", "deltaGErr", "name", "aliases"];
            var labels = ["id", "abbrev", "formula", "charge", "deltaG", "deltaGErr", "name", "aliases"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = cols;
            container.append('<table id="rxn-table" class="table table-striped table-bordered"></table>')
            var table = $('#rxn-table').dataTable(tableSettings);
            table.fnAddData(dataDict);
        }

        function formatObjs(media_data) {
            for (var i in media_data) {
                var media = media_data[i];
                media.id = '<a class="media-click" data-media="'+media.id+'">'
                            +media.id+'</a>'
                media.aliases = media.aliases.join('<br>')
            }
            return media_data;
        }

        function getColumns(keys, labels) {
            var cols = [];

            for (var i=0; i<keys.length; i++) {
                cols.push({sTitle: labels[i], mData: keys[i]})
            }
            return cols;
        }

        function mediaEvents() {
            $('.media-click').unbind('click');
            $('.media-click').click(function() {
                var rxn = [$(this).data('media')];
                self.trigger('mediaClick', {rxns: rxn});
            });
        }

        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init


})
}( jQuery ) );
