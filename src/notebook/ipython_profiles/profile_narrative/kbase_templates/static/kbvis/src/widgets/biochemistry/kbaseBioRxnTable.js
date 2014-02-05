(function( $, undefined ) {

$.KBWidget({
    name: "kbaseBioRxnTable",      
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;
        var container = this.$elem;

        var tableSettings = {
            "fnDrawCallback": rxnEvents,
            "sPaginationType": "full_numbers",
            "iDisplayLength": 20,
            "aaData": [],
            "oLanguage": {
                "sSearch": "Search Rxns:"
            }
        }

        this.loadTable = function(reaction_data) {
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
            console.log(rxnObjs)
            var rxns = [];
            for (var i in rxnObjs) {
                var rxn = $.extend({}, rxnObjs[i]);
                rxn.id = '<a class="rxn-click" data-rxn="'+rxn.id+'">'
                            +rxn.id+'</a>'
                rxn.enzymes = rxn.enzymes.join('<br>')
                rxns.push(rxn);
            }
            return rxns;
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
