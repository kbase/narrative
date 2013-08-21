(function( $, undefined ) {

$.kbWidget("kbaseBioCpdTable", 'kbaseWidget', {
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;        
        var token = options.auth;

        this.$elem.append('<div id="kbase-bio-cpd-table" class="panel panel-default">\
                                <div class="panel-heading">\
                                    <h4 class="panel-title">Biochemistry Compounds</h4>\
                                </div>\
                                <div class="panel-body"></div>\
                           </div>');

        var container = $('#kbase-bio-cpd-table .panel-body');

        var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

        var tableSettings = {
            "fnDrawCallback": cpdEvents,
            "sPaginationType": "full_numbers",
            "iDisplayLength": 20,
            "aaData": [],
            "oLanguage": {
                "sSearch": "Search all:"
            }
        }

        var chunk = 250;

        var bioAJAX = fba.get_biochemistry({});

        container.append('<div class="progress">\
              <div class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 3%;">\
              </div>\
            </div>')

        var proms = [];
        k = 1;        
        $.when(bioAJAX).done(function(data){
            var cpds = data.compounds;
            var total_cpds = cpds.length
            var iterations = parseInt(total_cpds / chunk)
            var compound_data = []

            for (var i=0; i<iterations; i++) {
                var cpd_subset = cpds.slice( i*chunk, (i+1)*chunk -1) ;

                var cpdAJAX = fba.get_compounds({compounds: cpd_subset });
                proms.push(cpdAJAX); // doesn't work for whatever reason
                $.when(cpdAJAX).done(function(cpd_data){
                    k = k + 1;
                    compound_data =  compound_data.concat(cpd_data);
                    var percent = (compound_data.length / total_cpds) * 100+'%';
                    $('.progress-bar').css('width', percent)

                    if (k == iterations) {
                        console.log(compound_data);
                        $('.progress').remove();                        
                        load_table(cpd_data)
                    }            
                });
            }
        })

        function load_table(reaction_data) {
            var dataDict = formatCpdObjs(reaction_data);
            var keys = ["id", "abbrev", "formula",  "charge", "deltaG", "deltaGErr", "name", "aliases"];
            var labels = ["id", "abbrev", "formula", "charge", "deltaG", "deltaGErr", "name", "aliases"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = cols;
            container.append('<table id="rxn-table" class="table table-striped table-bordered"></table>')
            var table = $('#rxn-table').dataTable(tableSettings);
            table.fnAddData(dataDict);
        }

        function formatCpdObjs(cpdObjs) {
            for (var i in cpdObjs) {
                var cpd = cpdObjs[i];
                cpd.id = '<a class="cpd-click" data-cpd="'+cpd.id+'">'
                            +cpd.id+'</a>'
                cpd.aliases = cpd.aliases.join('<br>')
            }
            return cpdObjs;
        }

        function getColumns(keys, labels) {
            var cols = [];

            for (var i=0; i<keys.length; i++) {
                cols.push({sTitle: labels[i], mData: keys[i]})
            }
            return cols;
        }

        function cpdEvents() {
            $('.cpd-click').unbind('click');
            $('.cpd-click').click(function() {
                var rxn = [$(this).data('cpd')];
                self.trigger('cpdClick', {rxns: rxn});
            });
        }

        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init


})
}( jQuery ) );
