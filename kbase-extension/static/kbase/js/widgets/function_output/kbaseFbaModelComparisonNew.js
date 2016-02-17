define(['jquery',
        'narrativeConfig',
        'bluebird',
        'util/string',
        'kbwidget', 
        'kbaseAuthenticatedWidget',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap'],
function($, 
         Config,
         Promise,
         StringUtil) {
$.KBWidget({
    name: "kbaseFbaModelComparisonNew",     
    parent: "kbaseAuthenticatedWidget",
    version: "1.0.0",
    ws_name: null,
    mc_id: null,
    options: {
        ws_name: null,
        mc_id: null
    },

    wsUrl: Config.url('workspace'),
    loadingImage: Config.get('loading_gif'),

    init: function(options) {
        this._super(options);
        this.ws_name = options.ws_name;
        this.mc_id = options.mc_id;
        return this;
    },
    
    render: function() {
        var self = this;
        var container = this.$elem;
        container.empty();
        if (!self.authToken()) {
            container.append("<div>[Error] You're not logged in</div>");
            return;
        }

        container.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;Loading model comparison data...</div>");

        var pref = StringUtil.uuid();
        var kbws = new Workspace(this.wsUrl, {'token': self.authToken()});
        var get_object_input = [{ref: self.ws_name + "/" + self.mc_id}];

        Promise.resolve(kbws.get_objects(get_object_input))
        .then(function(data) {

            var modelComp = data[0].data;
            self.fba_model1 = modelComp.models[0];
            self.fba_model2 = modelComp.models[1];

            ///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
            container.empty();
            var tabPane = $('<div id="'+pref+'tab-content">');
            container.append(tabPane);
            tabPane.kbaseTabs({canDelete : true, tabs : []});
            //////////////////////////////////////////// Statistics tab /////////////////////////////////////////////
            var tabStats = $("<div/>");
            tabPane.kbaseTabs('addTab', {tab: 'Statistics', content: tabStats, canDelete : false, show: true});
            var tableStats = $('<table class="table table-striped table-bordered" '+
                    'style="margin-left: auto; margin-right: auto;" id="'+pref+'modelcomp-stats"/>');
            tabStats.append(tableStats);
	    for (var i = 0; i < modelComp.models.length; i++) {
		tableStats.append('<tr><td><b>'+modelComp.models[i].id+'</b> genome</td><td>'+modelComp.models[i].name+'</td></tr>');
	    }
	    if (modelComp.pangenome_ref) {
		tableStats.append('<tr><td>Pangenome</td><td>'+modelComp.pangenome_ref+'</td></tr>');		
	    }
	    if (modelComp.protcomp_ref) {
		tableStats.append('<tr><td>Proteome Comparison</td><td>'+modelComp.protcomp_ref+'</td></tr>');		
	    }
            tableStats.append('<tr><td>Conserved reactions</td><td>'+modelComp.core_reactions+'</td></tr>');
            tableStats.append('<tr><td>Conserved compounds</td><td>'+modelComp.core_compounds+'</td></tr>');
            tableStats.append('<tr><td>Conserved biomass compounds</td><td>'+modelComp.core_biomass_compounds+'</td></tr>');
            tableStats.append('<tr><td>Conserved protein families</td><td>'+modelComp.core_families+'</td></tr>');
            //////////////////////////////////////////// Reactions tab /////////////////////////////////////////////
            var tabReactions = $("<div/>");
            tabPane.kbaseTabs('addTab', {tab: 'Reactions', content: tabReactions, canDelete : false, show: false});
            var tableReactions = $('<table class="table table-striped table-bordered" '+
                    'style="margin-left: auto; margin-right: auto;" id="'+pref+'modelcomp-common"/>');
            tabReactions.append(tableReactions);
	    for (var i = 0; i < modelComp.reactions.length; i++) {
		for (var j = 0; j < modelComp.models.length; j++) {
		    var model_id = modelComp.models[j].id;
		    if (modelComp.reactions[i].reaction_model_data.hasOwnProperty(model_id)) {
			if (modelComp.reactions[i].reaction_model_data[model_id][3] !== "") {
			    modelComp.reactions[i]["model"+j] = modelComp.reactions[i].reaction_model_data[model_id][3];
			}
			else if (modelComp.reactions[i].reaction_model_data[model_id][0] === 1) {
			    modelComp.reactions[i]["model"+j] = "present";
			}
			else {
			    modelComp.reactions[i]["model"+j] = "absent";
			}
		    }
		    else {
			modelComp.reactions[i]["model"+j] = "absent";
		    }
		}
	    }
	    var aoColumns = [
                                  { "sTitle": "Reaction", 'mData': 'id'},
                                  { "sTitle": "Equation&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;", 'mData': 'equation'},
                                  { "sTitle": "Number Models", 'mData': 'number_models'},
                                  { "sTitle": "Conserved", 'mData': 'core'},
			     ];
	    for (var i = 0; i < modelComp.models.length; i++) {
		aoColumns.push({"sTitle": modelComp.models[i].id, 'mData':"model"+i });
	    }
            tableReactions.dataTable({
                    "sPaginationType": "full_numbers",
                    "iDisplayLength": 10,
                    "aaData": modelComp.reactions,
                    "aaSorting": [[ 2, "desc" ], [0, "asc"]],
                    "aoColumns": aoColumns,
                    "oLanguage": {
                                "sEmptyTable": "No reactions found!",
                                "sSearch": "Search: "
                    },
                    'fnDrawCallback': events
            });
            //////////////////////////////////////////// Compounds tab /////////////////////////////////////////////
            var tabCompounds = $("<div/>");
            tabPane.kbaseTabs('addTab', {tab: 'Compounds', content: tabCompounds, canDelete : false, show: false});
            var tableCompounds = $('<table class="table table-striped table-bordered" '+
                    'style="margin-left: auto; margin-right: auto;" id="'+pref+'modelcomp-common"/>');
            tabCompounds.append(tableCompounds);
	    for (var i = 0; i < modelComp.compounds.length; i++) {
		for (var j = 0; j < modelComp.models.length; j++) {
		    var model_id = modelComp.models[j].id;
		    if (modelComp.compounds[i].model_compound_compartments.hasOwnProperty(model_id)) {
			if (modelComp.compounds[i].model_compound_compartments[model_id].length > 0) {
			    modelComp.compounds[i]["model"+j] = "present";
			}
			else {
			    modelComp.compounds[i]["model"+j] = "absent";
			}
		    }
		    else {
			modelComp.compounds[i]["model"+j] = "absent";
		    }
		}
	    }
	    aoColumns = [
                                  { "sTitle": "Compound", 'mData': 'id'},
                                  { "sTitle": "Name&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;", 'mData': 'name'},
                                  { "sTitle": "Number Models", 'mData': 'number_models'},
                                  { "sTitle": "Conserved", 'mData': 'core'},
			     ];
	    for (var i = 0; i < modelComp.models.length; i++) {
		aoColumns.push({"sTitle": modelComp.models[i].id, 'mData':"model"+i });
	    }
            tableCompounds.dataTable({
                    "sPaginationType": "full_numbers",
                    "iDisplayLength": 10,
                    "aaData": modelComp.compounds,
                    "aaSorting": [[ 2, "desc" ], [0, "asc"]],
                    "aoColumns": aoColumns,
                    "oLanguage": {
                                "sEmptyTable": "No compounds found!",
                                "sSearch": "Search: "
                    },
                    'fnDrawCallback': events
            });
            //////////////////////////////////////////// Biomass tab /////////////////////////////////////////////
            var tabBiomass = $("<div/>");
            tabPane.kbaseTabs('addTab', {tab: 'Biomass compounds', content: tabBiomass, canDelete : false, show: false});
            var tableBiomass = $('<table class="table table-striped table-bordered" '+
                    'style="margin-left: auto; margin-right: auto;" id="'+pref+'modelcomp-common"/>');
            tabBiomass.append(tableBiomass);
	    for (var i = 0; i < modelComp.biomasscpds.length; i++) {
		for (var j = 0; j < modelComp.models.length; j++) {
		    var model_id = modelComp.models[j].id;
		    if (modelComp.biomasscpds[i].model_biomass_compounds.hasOwnProperty(model_id)) {
			if (modelComp.biomasscpds[i].model_biomass_compounds[model_id].length > 0) {
			    modelComp.biomasscpds[i]["model"+j] = "present";
			}
			else {
			    modelComp.biomasscpds[i]["model"+j] = "absent";
			}
		    }
		    else {
			modelComp.biomasscpds[i]["model"+j] = "absent";
		    }
		}
	    }
	    aoColumns = [
                                  { "sTitle": "Compound", 'mData': 'id'},
                                  { "sTitle": "Name&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;", 'mData': 'name'},
                                  { "sTitle": "Number Models", 'mData': 'number_models'},
                                  { "sTitle": "Conserved", 'mData': 'core'},
			     ];
	    for (var i = 0; i < modelComp.models.length; i++) {
		aoColumns.push({"sTitle": modelComp.models[i].id, 'mData':"model"+i });
	    }
            tableBiomass.dataTable({
                    "sPaginationType": "full_numbers",
                    "iDisplayLength": 10,
                    "aaData": modelComp.biomasscpds,
                    "aaSorting": [[ 2, "desc" ], [0, "asc"]],
		    "aoColumns": aoColumns,
                    "oLanguage": {
                                "sEmptyTable": "No biomass found!",
                                "sSearch": "Search: "
                    },
                    'fnDrawCallback': events
            });
            //////////////////////////////////////////// Families tab /////////////////////////////////////////////
            var tabFamilies = $("<div/>");
            tabPane.kbaseTabs('addTab', {tab: 'Families', content: tabFamilies, canDelete : false, show: false});
            var tableFamilies = $('<table class="table table-striped table-bordered" '+
                    'style="margin-left: auto; margin-right: auto;" id="'+pref+'modelcomp-common"/>');
            tabFamilies.append(tableFamilies);
	    for (var i = 0; i < modelComp.families.length; i++) {
		for (var j = 0; j < modelComp.models.length; j++) {
		    var model_id = modelComp.models[j].id;
		    if (modelComp.families[i].family_model_data.hasOwnProperty(model_id)) {
			if (modelComp.families[i].family_model_data[model_id][0] === 1) {
			    modelComp.families[i]["model"+j] = "present";
			}
			else {
			    modelComp.families[i]["model"+j] = "absent";
			}
		    }
		    else {
			modelComp.families[i]["model"+j] = "absent";
		    }
		}
	    }
	    aoColumns = [
                                  { "sTitle": "Family", 'mData': 'family_id'},
                                  { "sTitle": "Function&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;", 'mData': 'function'},
                                  { "sTitle": "Number Models", 'mData': 'number_models'},
                                  { "sTitle": "Conserved", 'mData': 'core'},
			     ];
	    for (var i = 0; i < modelComp.models.length; i++) {
		aoColumns.push({"sTitle": modelComp.models[i].id, 'mData':"model"+i });
	    }
            tableFamilies.dataTable({
                    "sPaginationType": "full_numbers",
                    "iDisplayLength": 10,
                    "aaData": modelComp.families,
                    "aaSorting": [[ 2, "desc" ], [0, "asc"]],
                    "aoColumns": aoColumns,
                    "oLanguage": {
                                "sEmptyTable": "No families found!",
                                "sSearch": "Search: "
                    },
                    'fnDrawCallback': events
            });
            ///////////////////////////////////// Event handling for links ///////////////////////////////////////////
            function events() {
                // event for clicking on ortholog count
                $('.show-reaction'+pref).unbind('click');
                $('.show-reaction'+pref).click(function() {
                    var id = $(this).data('id');
                    if (tabPane.kbaseTabs('hasTab', id)) {
                        tabPane.kbaseTabs('showTab', id);
                        return;
                    }           
                    tabPane.kbaseTabs('addTab', {tab: id, content: "Coming soon!", canDelete : true, show: true});
                });
                $('.show-gene'+pref).unbind('click');
                $('.show-gene'+pref).click(function() {
                    var id = $(this).data('id');
                    if (tabPane.kbaseTabs('hasTab', id)) {
                        tabPane.kbaseTabs('showTab', id);
                        return;
                    }
                    tabPane.kbaseTabs('addTab', {tab: id, content: "Coming soon!", canDelete : true, show: true});
                });
            }

        }.bind(this))
        .catch(function(error) {
            container.empty();
            if (error.error.message) {
                container.append('<p>[Error] ' + error.error.message + '</p>');
            }
            else {
                container.append('<p>[Error] ' + JSON.stringify(error));
            }
        });
        return this;
    },

    getData: function() {
        return {
            type: "ModelComparison",
            id: this.ws_name + "." + this.mc_id,
            workspace: this.ws_name,
            title: "Model Comparison Widget"
        };
    },

    loggedInCallback: function(event, auth) {
        //        this.token = auth.token;
        this.render();
        return this;
    },

    loggedOutCallback: function(event, auth) {
        //        this.token = null;
        this.render();
        return this;
    },

})
});
