(function( $, undefined ) {

$.KBWidget({
    name: "kbaseBioCpdTable",
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;

        var container = this.$elem;

        var tableSettings = {
            "fnDrawCallback": cpdEvents,
            "sPaginationType": "full_numbers",
            "iDisplayLength": 20,
            "aaData": [],
            "oLanguage": {
                "sSearch": "Search Cpds:"
            }
        }

        this.loadTable = function(compound_data) {
            var dataDict = formatCpdObjs(compound_data);
            var keys = ["id", "abbrev", "formula",  "charge", "deltaG", "deltaGErr", "name", "aliases"];
            var labels = ["id", "abbrev", "formula", "charge", "deltaG", "deltaGErr", "name", "aliases"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = cols;
            container.append('<table id="rxn-table" class="table table-striped table-bordered"></table>')
            var table = $('#rxn-table').dataTable(tableSettings);
            table.fnAddData(dataDict);
        }

        function formatCpdObjs(cpdObjs) {
            var cpds = [];
            for (var i in cpdObjs) {
                var cpd = $.extend({}, cpdObjs[i]);
                cpd.id = '<a class="cpd-click" data-cpd="'+cpd.id+'">'
                            +cpd.id+'</a>'
                cpd.aliases = cpd.aliases.join('<br>')
                cpds.push(cpd)
            }
            return cpds;
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
