

$.fn.modelView = function(options) {
    var models = options.models;
    var workspaces = options.workspaces;

    var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
    var kbws = new workspaceService('https://kbase.us/services/workspace/');

    var tables = ['Overview', 'Compartment', 'Reactions', 'Compounds', 'Biomass', 'Gapfilling', 'Gapgen']
    var tableIds = ['overview', 'compartment', 'reaction', 'compound', 'biomass', 'gapfilling', 'gapgen']


    // build tabs
    var tabs = $('<ul id="table-tabs" class="nav nav-tabs"> \
                    <li class="active" > \
                    <a view="'+tableIds[0]+'" data-toggle="tab" >'+tables[0]+'</a> \
                  </li></ul>')
    for (var i=1; i<tableIds.length; i++) {
        tabs.append('<li><a view="'+tableIds[i]+'" data-toggle="tab">'+tables[i]+'</a></li>')
    }

    // add tabs
    this.append(tabs);

    // add table views (don't hide first one)
    this.append('<div class="'+tableIds[0]+'-view view"> \
                        <table id="'+tableIds[0]+'-table" \
                        class="table table-bordered table-striped"></table>\
                    </div>');

    for (var i=1; i<tableIds.length; i++) {
        this.append('<div class="'+tableIds[i]+'-view view hide"> \
                        <table id="'+tableIds[i]+'-table" \
                        class="table table-bordered table-striped"></table>\
                    </div>');
    }

    // tab events
    $('.nav-tabs li').click(function(){
        $('.view').hide(); // hide all views
        $('.nav-tabs li').removeClass('active'); //fixme: this is not neccessary
        $(this).addClass('active')

        var view = $(this).children('a').attr('view');
        $('.'+view+'-view').show();
    })    
    

    var tableSettings = {"fnDrawCallback": events,        
        "sPaginationType": "full_numbers",
        "iDisplayLength": 20,
        "aaData": [],
        "oLanguage": {
        "sSearch": "Search all:"
        }
    }

    var overview_table
    var comp_table;
    var rxn_table;
    var cpd_table;    
    var biomass_table;
    var gapfill_table;
    var gapgen_table;

    var meta_AJAX = kbws.get_objectmeta({type: 'Model', 
            workspace: workspaces[0], id: models[0]});
    $('.overview-view').append('<p class="muted loader-overview"> \
                              <img src="/img/ajax-loader.gif"> loading...</p>')
    $.when(meta_AJAX).done(function(data){
        console.log(data)

        var labels = ['uuid','id','name','defaultNameSpace','version',
                      'current','type','growth','status','mapping_uuid',
                      'biochemistry_uuid','annotation_uuid']

        for (var i in data){
            $('#overview-table').append('<tr><td>'+labels[i]+'</td> \
                                             <td>'+data[i]+'</td></tr>')
        }
        $('.loader-overview').remove();
    })

    var models_AJAX = fba.get_models({models: models, workspaces: workspaces});
    $('.view').not('.overview-view').append('<p class="muted loader-tables"> \
                              <img src="/img/ajax-loader.gif"> loading...</p>')
    $.when(models_AJAX).done(function(models){
        console.log(models)
        for (var i in models) {
            var model = models[i];

            // compartment table
            var model_comparts = model.compartments;
            var keys = ["id", "index", "name", "pH","potential"];
            var labels = ["id", "index", "name", "pH","potential"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            comp_table = $('#compartment-table').dataTable(tableSettings);

            // reaction table
            var model_rxns = model.reactions;
            var keys = ["compartment", "definition", "direction", "equation",
                        "features","id","name","reaction"];
            var labels = ["compartment", "definition", "direction", "equation",
                        "features","id","name","reaction"];
            var cols = getColumns(keys, labels)
            tableSettings.aoColumns = getColumns(keys, labels)
            rxn_table = $('#reaction-table').dataTable(tableSettings);

            // compound table
            var model_cpds = model.compounds;
            var keys = ["compartment", "compound", "id", "name"];
            var labels = ["compartment", "compound", "id", "name"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            cpd_table = $('#compound-table').dataTable(tableSettings);

            // biomass table
            var model_biomass = model.biomasses;
            var keys = ["definition", "id", "name"];
            var labels = ["definition", "id", "name"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            biomass_table = $('#biomass-table').dataTable(tableSettings);

            // gapfilling table
            var model_gapfills = model.compounds;
            var keys = ["id", "index", "name", "pH","potential"];
            var labels = ["id", "index", "name", "pH","potential"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            gapfill_table = $('#gapfill-table').dataTable(tableSettings);

            // gapgen table
            var model_gapgen = model.gapgen;
            var keys = ["id", "index", "name", "pH","potential"];
            var labels = ["id", "index", "name", "pH","potential"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            gapgen_table = $('#gapgen-table').dataTable(tableSettings); 

        }
        comp_table.fnAddData(model_comparts);        
        rxn_table.fnAddData(model_rxns);
        cpd_table.fnAddData(model_cpds);
        biomass_table.fnAddData(model_biomass);        
        $('.loader-tables').remove();
    })

    function getColumns(keys, labels) {
        var cols = [];

        for (var i=0; i<keys.length; i++) {
            cols.push({sTitle: labels[i], mData: keys[i]})
        }
        return cols;
    }

    function events() {

    }
}
