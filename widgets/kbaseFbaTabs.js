(function( $, undefined ) {

$.KBWidget("kbaseFbaTabs", 'kbaseWidget', {
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;        
        var fbas = options.ids;
        var workspaces = options.workspaces;
        var token = options.auth;

        this.$elem.append('<div id="kbase-fba-tabs" class="panel panel-default">\
                                <div class="panel-heading">\
                                    <h4 class="panel-title">FBA Details</h4>'
                                     +fbas[0]+
                                    '<span class="label label-primary pull-right">'+workspaces[0]+'</span><br>\
                                </div>\
                                <div class="panel-body"></div>\
                           </div>');


        var container = $('#kbase-fba-tabs .panel-body');

        var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
        //var kbws = new workspaceService('http://kbase.us/services/workspace_service/');

        var tables = ['Reactions', 'Compounds']
        var tableIds = ['reaction', 'compound']

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
            "iDisplayLength": 10,
            "oLanguage": {
                "sSearch": "Search all:"
            }
        }

        var fbaAJAX = fba.get_fbas({fbas: fbas, workspaces: workspaces});
        $('.tab-pane').append('<p class="muted loader-tables"> \
                                  <img src="../common/img/ajax-loader.gif"> loading...</p>')
        $.when(fbaAJAX).done(function(data){
            var fba = data[0];
            console.log(fba)

            // rxn flux table
            var dataDict = formatObjs(fba.reactionFluxes);
            var labels = ["id", "Flux", "lower", "upper", "min", "max", "basd","Equation"];
            var cols = getColumnsByLabel(labels);
            var rxnTableSettings = $.extend({}, tableSettings, {fnDrawCallback: events});               
            rxnTableSettings.aoColumns = cols;
            rxnTableSettings.aaData = dataDict;
            container.append('<table id="reaction-table" class="table table-striped table-bordered"></table>')            
            var table = $('#reaction-table').dataTable(rxnTableSettings);
    
            // cpd flux table
            var dataDict = formatObjs(fba.compoundFluxes);
            var labels = ["id", "Flux", "lower", "upper", "min", "max","Equation"];
            var cols = getColumnsByLabel(labels);
            var cpdTableSettings = $.extend({}, tableSettings, {fnDrawCallback: events});               
            cpdTableSettings.aoColumns = cols;
            cpdTableSettings.aaData = dataDict;
            container.append('<table id="compound-table" class="table table-striped table-bordered"></table>')            
            var table = $('#compound-table').dataTable(cpdTableSettings);

            $('.loader-tables').remove();
        })


        function formatObjs(objs) {
            for (var i in objs) {
                var obj = objs[i];
                var rxn = obj[0].split('_')[0]
                var compart = obj[0].split('_')[1]
                obj[0] = '<a class="rxn-click" data-rxn="'+rxn+'">'
                            +rxn+'</a> ('+compart+')'
            }
            return objs;
        }

        function getColumnsByLabel(labels) {
            var cols = [];
            for (var i in labels) {
                cols.push({sTitle: labels[i]})
            }
            return cols;
        }

        function events() {
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
