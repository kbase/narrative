(function( $, undefined ) {

$.KBWidget({
    name: "kbaseFbaTabsNarrative",
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;        
        var fbas = options.ids;
        var workspaces = options.workspaces;
        var data = options.fbaData;

        var randId = this._uuidgen();


        var container = this.$elem;
        
        container.append("<h4 style=\"display:inline\">"+fbas[0]+"</h4>");
        if (data[0].objective < 0.001) {
            // no grow, make it red!
            container.append("&nbsp&nbsp Objective: <span class=\"label label-danger\">" + data[0].objective + "</span>");
        } else {
            // grow, make it green!
            container.append("&nbsp&nbsp Objective: <span class=\"label label-success\">" + data[0].objective + "</span>");
        }

        var tables = ['Reactions', 'Compounds'];
        var tableIds = [randId+'reaction', randId+'compound'];

        // build tabs
        var tabs = $('<ul id="' + randId + 'table-tabs" class="nav nav-tabs"> \
                        <li class="active" > \
                        <a href="#'+tableIds[0]+'" data-toggle="tab" >'+tables[0]+'</a> \
                      </li></ul>')
        for (var i=1; i<tableIds.length; i++) {
            tabs.append('<li><a href="#'+tableIds[i]+'" data-toggle="tab">'+tables[i]+'</a></li>');
        }

        // add tabs
        container.append(tabs);

        var tab_pane = $('<div id="tab-content" class="tab-content">')
        // add table views (don't hide first one)
        tab_pane.append('<div class="tab-pane in active" id="'+tableIds[0]+'"> \
                            <table cellpadding="0" cellspacing="0" border="0" id="'+tableIds[0]+'-table" \
                            class="table table-bordered table-striped" style="width: 100%; margin:0"></table>\
                        </div>');

        for (var i=1; i<tableIds.length; i++) {
            var tableDiv = $('<div class="tab-pane in" id="'+tableIds[i]+'"> ');
            var table = $('<table cellpadding="0" cellspacing="0" border="0" id="'+tableIds[i]+'-table" \
                            class="table table-striped table-bordered" style:"margin:0">');
            tableDiv.append(table);
            tab_pane.append(tableDiv);
        }

        container.append(tab_pane)

        // event for showing tabs
        $('#' + randId + 'table-tabs a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        })

        var tableSettings = {
            "sPaginationType": "full_numbers",
            "iDisplayLength": 5,
            "oLanguage": {
                "sSearch": "Search all:"
            }
        }

        var fba = data[0];

        // rxn flux table
        var dataDict = formatObjs(fba.reactionFluxes);
        var labels = ["id", "Flux", "lower", "upper", "min", "max", "basd","Equation"];
        var cols = getColumnsByLabel(labels);
        var rxnTableSettings = $.extend({}, tableSettings, {fnDrawCallback: events});               
        rxnTableSettings.aoColumns = cols;
        rxnTableSettings.aaData = dataDict;
        container.append('<table id="' + randId + 'reaction-table" class="table table-striped table-bordered" style:"margin:0"></table>');           
        var table = $('#' + randId + 'reaction-table').dataTable(rxnTableSettings);

        // cpd flux table
        var dataDict = formatObjs(fba.compoundFluxes);
        var labels = ["id", "Flux", "lower", "upper", "min", "max","Equation"];
        var cols = getColumnsByLabel(labels);
        var cpdTableSettings = $.extend({}, tableSettings, {fnDrawCallback: events});
        cpdTableSettings.aoColumns = cols;
        cpdTableSettings.aaData = dataDict;
        container.append('<table id="' + randId + 'compound-table" class="table table-striped table-bordered" style:"margin:0"></table>');
        var table = $('#' + randId + 'compound-table').dataTable(cpdTableSettings);

 
        function formatObjs(objs) {
            var fluxes = []
            for (var i in objs) {
                var obj = $.extend({}, objs[i]);
                var rxn = obj[0].split('_')[0]
                var compart = obj[0].split('_')[1]
                obj[0] = '<a class="' + randId + 'rxn-click" data-rxn="'+rxn+'">'
                            +rxn+'</a> ('+compart+')';
                fluxes.push(obj);
            }
            return fluxes;
        }

        function getColumnsByLabel(labels) {
            var cols = [];
            for (var i in labels) {
                cols.push({sTitle: labels[i]})
            }
            return cols;
        }

        function events() {
            $('.' + randId + 'rxn-click').unbind('click');
            $('.' + randId + 'rxn-click').click(function() {
                var rxn = [$(this).data('rxn')];
                self.trigger('rxnClick', {rxns: rxn});
            });            
        }

        //this._rewireIds(this.$elem, this);
        return this;
    },  //end init

    /**
     * uuid generator
     *
     * @private
     */
     _uuidgen: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);});
     },




})
}( jQuery ) );
