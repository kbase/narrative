(function( $, undefined ) {

$.kbWidget("kbaseModelView", 'kbaseWidget', {
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var models = options.ids;
        var workspaces = options.workspaces;

        this.$elem.append('<div id="kbase-model-view"></div>');
        var container = $('#kbase-model-view');

        var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
        var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

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
        container.append(tabs);

        // add table views (don't hide first one)
        container.append('<div class="'+tableIds[0]+'-view view"> \
                            <table id="'+tableIds[0]+'-table" \
                            class="table table-bordered table-striped"></table>\
                        </div>');

        for (var i=1; i<tableIds.length; i++) {
            container.append('<div class="'+tableIds[i]+'-view view hide"> \
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

        var meta_AJAX = kbws.get_objectmeta({type: 'Model',
                workspace: workspaces[0], id: models[0]});
        $('.overview-view').append('<p class="muted loader-overview"> \
                                  <img src="/img/ajax-loader.gif"> loading...</p>')
        $.when(meta_AJAX).done(function(data){
            var labels = ['ID','Type','Moddate','Instance',
                          'Command','Last Modifier','Owner','Workspace','Ref',
                          'Check Sum']

            for (var i=0; i<data.length-1; i++){
                $('#overview-table').append('<tr><td>'+labels[i]+'</td> \
                                                 <td>'+data[i]+'</td></tr>')
            }
            $('.loader-overview').remove();
        })

        var models_AJAX = fba.get_models({models: models, workspaces: workspaces});
        $('.view').not('.overview-view').append('<p class="muted loader-tables"> \
                                  <img src="/img/ajax-loader.gif"> loading...</p>')
        $.when(models_AJAX).done(function(data){
            var model = data[0];

            // compartment table
            var dataDict = model.compartments;
            var keys = ["id", "index", "name", "pH", "potential"];
            var labels = ["id", "index", "name", "pH", "potential"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            var table = $('#compartment-table').dataTable(tableSettings);
            table.fnAddData(dataDict);

            // reaction table
            var dataDict = model.reactions;
            var keys = ["compartment", "definition", "direction", "equation",
                        "features","id","name","reaction"];
            var labels = ["compartment", "definition", "direction", "equation",
                        "features","id","name","reaction"];
            var cols = getColumns(keys, labels)
            tableSettings.aoColumns = getColumns(keys, labels)
            var table = $('#reaction-table').dataTable(tableSettings);
            table.fnAddData(dataDict);

            // compound table
            var dataDict = model.compounds;
            var keys = ["compartment", "compound", "id", "name"];
            var labels = ["compartment", "compound", "id", "name"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            var table = $('#compound-table').dataTable(tableSettings);
            table.fnAddData(dataDict);

            // biomass table
            var dataDict = model.biomasses;
            var keys = ["definition", "id", "name"];
            var labels = ["definition", "id", "name"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            var table = $('#biomass-table').dataTable(tableSettings);
            table.fnAddData(dataDict);

            // gapfilling table
            var dataDict = model.compounds;
            var keys = ["id", "index", "name", "pH","potential"];
            var labels = ["id", "index", "name", "pH","potential"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            var table = $('#gapfill-table').dataTable(tableSettings);

            // gapgen table
            var model_gapgen = model.gapgen;
            var keys = ["id", "index", "name", "pH","potential"];
            var labels = ["id", "index", "name", "pH","potential"];
            var cols = getColumns(keys, labels);
            tableSettings.aoColumns = getColumns(keys, labels);
            var table = $('#gapgen-table').dataTable(tableSettings);

            $('.loader-tables').remove();
        })

        function getColumns(keys, labels) {
            var cols = [];

            for (var i=0; i<keys.length; i++) {
                cols.push({sTitle: labels[i], mData: keys[i]})
            }
            return cols;
        }

        function events() {}

        this.hideView = function(){
            container.hide()
        }

        this.showView = function(){
            container.show()
        }

        this.destroyView = function(){
            container.remove();
        }

        //
        //this._rewireIds(this.$elem, this);

        return this;

    }  //end init

})
}( jQuery ) );
