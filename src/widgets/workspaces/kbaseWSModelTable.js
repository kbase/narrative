(function( $, undefined ) {

$.KBWidget({
    name: "kbaseWSModelTable",    
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;        
        var ws = options.ws;
        var data = options.data;

        var container = this.$elem;

        var tableSettings = {
            "fnDrawCallback": modelEvents,
            "sPaginationType": "full_numbers",
            "iDisplayLength": 20,
            "aaData": [],
            "oLanguage": {
                "sSearch": "Search all:"
            }
        }

        var dataList = formatObjs(data);
        var labels = ["id", "Type", "Modified", "Command", "Something?", "Owner"];
        var cols = getColumnsByLabel(labels);
        tableSettings.aoColumns = cols;
        container.append('<table id="rxn-table" class="table table-striped table-bordered"></table>');
        var table = $('#rxn-table').dataTable(tableSettings);
        table.fnAddData(dataList);


        function formatObjs(models) {
            var mdls = [];
            for (var i in models) {
                var model = models[i].slice();
                model[0] = '<a class="model-click" data-model="'+model[0]+'">'
                            +model[0]+'</a>'
                mdls.push(model);
            }
            return mdls;
        }

        function getColumnsByLabel(labels) {
            var cols = [];
            for (var i in labels) {
                cols.push({sTitle: labels[i]})
            }
            return cols;
        }

        function modelEvents() {
            $('.model-click').unbind('click');
            $('.model-click').click(function() {
                var model = $(this).data('model');
                self.trigger('modelClick', {model: model});
            });
        }

        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init


})
}( jQuery ) );
