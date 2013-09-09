(function( $, undefined ) {

$.KBWidget({
    name: "kbaseModelTabs",    
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;        
        var models = options.ids;
        var workspaces = options.workspaces;
        var token = options.auth;

        var panel = this.$elem.kbasePanel({title: 'Model Details', 
                                           rightLabel: workspaces[0],
                                           subText: models[0]});
        var container = panel.body();

        var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

        var tables = ['Reactions', 'Compounds', 'Compartment', 'Biomass', 'Gapfilling', 'Gapgen'];
        var tableIds = ['reaction', 'compound', 'compartment', 'biomass', 'gapfilling', 'gapgen'];

        // build tabs
        var tabs = $('<ul id="table-tabs" class="nav nav-tabs"> \
                        <li class="active" > \
                        <a href="#'+tableIds[0]+'" data-toggle="tab" >'+tables[0]+'</a> \
                      </li></ul>');
        for (var i=1; i<tableIds.length; i++) {
            tabs.append('<li><a href="#'+tableIds[i]+'" data-toggle="tab">'+tables[i]+'</a></li>');
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
                                  <img src="assets/img/ajax-loader.gif"> loading...</p>')
        $.when(models_AJAX).done(function(data){
            var model = data[0];
            console.log(model)

            // compartment table
            var dataDict = model.compartments;
            var keys = ["id", "index", "name", "pH", "potential"];
            var labels = ["id", "index", "name", "pH", "potential"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = cols;
            var table = $('#compartment-table').dataTable(tableSettings);
            table.fnAddData(dataDict);

            // reaction table
            var dataDict = formatRxnObjs(model.reactions);

            var keys = ["reaction", "definition",
                        "features","name"];
            var labels = ["reaction", "equation",
                        "features","name"];
            var cols = getColumns(keys, labels);
            var rxnTableSettings = $.extend({}, tableSettings, {fnDrawCallback: rxnEvents});   
            rxnTableSettings.aoColumns = cols;
            var table = $('#reaction-table').dataTable(rxnTableSettings);
            table.fnAddData(dataDict);

            // compound table
            var dataDict = model.compounds;
            var keys = ["compartment", "compound", "name"];
            var labels = ["compartment", "compound", "name"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = cols;
            var table = $('#compound-table').dataTable(tableSettings);
            table.fnAddData(dataDict);

            // biomass table
            var dataDict = model.biomasses;
            var keys = ["definition", "id", "name"];
            var labels = ["definition", "id", "name"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = cols;
            var table = $('#biomass-table').dataTable(tableSettings);
            table.fnAddData(dataDict);

            // gapfilling table
            var dataDict = model.compounds;
            var keys = ["id", "index", "name", "pH","potential"];
            var labels = ["id", "index", "name", "pH","potential"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = cols;
            var table = $('#gapfill-table').dataTable(tableSettings);

            // gapgen table
            var model_gapgen = model.gapgen;
            var keys = ["id", "index", "name", "pH","potential"];
            var labels = ["id", "index", "name", "pH","potential"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = cols;
            var table = $('#gapgen-table').dataTable(tableSettings);
    
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
