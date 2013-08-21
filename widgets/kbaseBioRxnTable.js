(function( $, undefined ) {

$.kbWidget("kbaseBioRxnTable", 'kbaseWidget', {
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;        
        var token = options.auth;

        self.reaction_data = [];

        this.$elem.append('<div id="kbase-bio-rxn-table" class="panel panel-default">\
                                <div class="panel-heading">\
                                    <h4 class="panel-title">Biochemistry Reactions</h4>\
                                </div>\
                                <div class="panel-body"></div>\
                           </div>');

        var container = $('#kbase-bio-rxn-table .panel-body');

        var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

        var tableSettings = {
            "fnDrawCallback": rxnEvents,
            "sPaginationType": "full_numbers",
            "iDisplayLength": 20,
            "aaData": [],
            "oLanguage": {
                "sSearch": "Search all:"
            }
        }

        var chunk = 500;

        var bioAJAX = fba.get_biochemistry({});
        container.append('<div class="progress">\
              <div class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 3%;">\
              </div>\
            </div>');

        // add optimization later
        if (self.reaction_data.length > 0) {
            $('.progress').remove();                        
            load_table(self.reaction_data)
        } else {
            k = 1;        
            $.when(bioAJAX).done(function(data){

                var rxns = data.reactions;
                var total_rxns = rxns.length
                var iterations = parseInt(total_rxns / chunk)

                for (var i=0; i<iterations; i++) {
                    var rxn_subset = rxns.slice( i*chunk, (i+1)*chunk -1) ;

                    var rxnAJAX = fba.get_reactions({reactions: rxn_subset });
                    $.when(rxnAJAX).done(function(rxn_data){
                        k = k + 1;
                        self.reaction_data = self.reaction_data.concat(rxn_data);
                        var percent = (self.reaction_data.length / total_rxns) * 100+'%';
                        $('.progress-bar').css('width', percent)

                        if (k == iterations) {
                            $('.progress').remove();                        
                            load_table(self.reaction_data)
                        }            
                    });
                }
            })
        }

        function load_table(reaction_data) {
            var dataDict = formatRxnObjs(reaction_data);
            var keys = ["id", "abbrev", "definition", "deltaG", "deltaGErr", "enzymes", "name"];
            var labels = ["id", "abbrev", "definition", "deltaG", "deltaGErr", "enzymes", "name"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = cols;
            container.append('<table id="rxn-table" class="table table-striped table-bordered"></table>')
            var table = $('#rxn-table').dataTable(tableSettings);
            table.fnAddData(dataDict);
        }

        function formatRxnObjs(rxnObjs) {
            for (var i in rxnObjs) {
                var rxn = rxnObjs[i];
                rxn.id = '<a class="rxn-click" data-rxn="'+rxn.id+'">'
                            +rxn.id+'</a>'
                rxn.enzymes = rxn.enzymes.join('<br>')
            }
            return rxnObjs
        }

        function getColumns(keys, labels) {
            var cols = [];

            for (var i=0; i<keys.length; i++) {
                cols.push({sTitle: labels[i], mData: keys[i]})
            }
            return cols;
        }

        function rxnEvents() {
            $('.rxn-click').unbind('click');
            $('.rxn-click').click(function() {
                var rxn = [$(this).data('rxn')];
                self.trigger('rxnClick', {rxns: rxn});
            });
        }

        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init


})
}( jQuery ) );
