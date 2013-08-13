(function( $, undefined ) {

$.kbWidget("kbaseModelTabs", 'kbaseWidget', {
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;        
        var models = options.ids;
        var workspaces = options.workspaces;
        var token = options.auth;

        this.$elem.append('<div id="kbase-model-tabs" class="panel">\
                                <div class="panel-heading"><b>Model Details</b><br> '
                                +models[0]+
                                ' <div style="float:right;"><span class="label label-info">'+workspaces[0]+'</span></div></div>\
                           </div>');
        var container = $('#kbase-model-tabs');

        var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');


        // build tabs
        var tabs = $('<ul id="table-tabs" class="nav nav-tabs"> \
                        <li class="active" > \
                        <a href="#'+tableIds[0]+'" data-toggle="tab" >'+tables[0]+'</a> \
                      </li></ul>')
        for (var i=1; i<tableIds.length; i++) {
            tabs.append('<li><a href="#'+tableIds[i]+'" data-toggle="tab">'+tables[i]+'</a></li>')
        }

        // add tabs
        container.append(tabs);

        var tab_pane = $('<div id="tab-content" class="tab-content">')
        // add table views (don't hide first one)
        tab_pane.append('<div class="tab-pane in active" id="'+tableIds[0]+'"> \
                            <table cellpadding="0" cellspacing="0" border="0" id="'+tableIds[0]+'-table" \
                            class="table table-bordered table-striped" style="width: 100%;"></table>\
                        </div>');

        for (var i=1; i<tableIds.length; i++) {
            var tableDiv = $('<div class="tab-pane in" id="'+tableIds[i]+'"> ');
            var table = $('<table cellpadding="0" cellspacing="0" border="0" id="'+tableIds[i]+'-table" \
                            class="table table-striped table-bordered">');
            tableDiv.append(table);
            tab_pane.append(tableDiv);
        }

        container.append(tab_pane)

        // event for showing tabs
        $('#table-tabs a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        })

        var tableSettings = {
            "sPaginationType": "full_numbers",
            "iDisplayLength": 5,
            "aaData": [],
            "oLanguage": {
                "sSearch": "Search all:"
            }
        }


        var models_AJAX = fba.get_models({models: models, workspaces: workspaces});
        $('.tab-pane').not('#overview').append('<p class="muted loader-tables"> \
                                  <img src="../common/img/ajax-loader.gif"> loading...</p>')
        $.when(models_AJAX).done(function(data){
            var model = data[0];

            // compartment table
            var dataDict = model.compartments;
            var keys = ["id", "index", "name", "pH", "potential"];
            var labels = ["id", "index", "name", "pH", "potential"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = cols;
            var table = $('#compartment-table').dataTable(tableSettings);
            table.fnAddData(dataDict);

            $('.loader-tables').remove();
        })


        function formatRxnObjs(rxnObjs) {
            for (var i in rxnObjs) {
                var rxn = rxnObjs[i];
                rxn.reaction = '<a class="rxn-click" data-rxn="'+rxn.reaction+'">'
                            +rxn.reaction+'</a> ('+rxn.compartment+')'
                rxn.features = rxn.features.join('<br>')
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
