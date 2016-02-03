define(['jquery', 
        'kbwidget', 
        'kbaseAuthenticatedWidget',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap'], function($) {
$.KBWidget({
    name: "FbaModelComparisonWidget",     
    parent: "kbaseAuthenticatedWidget",
    version: "1.0.0",
	ws_name: null,
	    mc_id: null,
    options: {
    	ws_name: null,
        mc_id: null
    },

    wsUrl: window.kbconfig.urls.workspace,
    loadingImage: window.kbconfig.loading_gif,

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

    	var pref = this.uuid();
        var kbws = new Workspace(this.wsUrl, {'token': self.authToken()});
        var get_object_input = [{ref: self.ws_name + "/" + self.mc_id}];
        kbws.get_objects(get_object_input, function(data) {
		var modelComp = data[0].data;
		self.fba_model1 = modelComp.models[0];
		self.fba_model2 = modelComp.models[1];

            ///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
			container.empty();
			var tabPane = $('<div id="'+self.pref+'tab-content">');
			container.append(tabPane);
			tabPane.kbaseTabs({canDelete : true, tabs : []});
            //////////////////////////////////////////// Statistics tab /////////////////////////////////////////////
        	var tabStats = $("<div/>");
			tabPane.kbaseTabs('addTab', {tab: 'Statistics', content: tabStats, canDelete : false, show: true});
			var tableStats = $('<table class="table table-striped table-bordered" '+
					'style="margin-left: auto; margin-right: auto;" id="'+self.pref+'modelcomp-stats"/>');
			tabStats.append(tableStats);
			tableStats.append('<tr><td><b>'+self.fba_model1.id+'</b> genome</td><td>'+self.fba_model1.genome_ref+'<br>('+self.fba_model1.name+')</td></tr>');
			tableStats.append('<tr><td><b>'+self.fba_model2.id+'</b> genome</td><td>'+self.fba_model2.genome_ref+'<br>('+self.fba_model2.name+')</td></tr>');
			tableStats.append('<tr><td>Reactions in <b>'+self.fba_model1.id+'</b></td><td>'+self.fba_model1.reactions+'</td></tr>');
			tableStats.append('<tr><td>Reactions in <b>'+self.fba_model2.id+'</b></td><td>'+self.fba_model2.reactions+'</td></tr>');
			tableStats.append('<tr><td>Common reactions</td><td>'+modelComp.core_reactions+'</td></tr>');
        	//////////////////////////////////////////// Common tab /////////////////////////////////////////////
        	var tabCommon = $("<div/>");
    		tabPane.kbaseTabs('addTab', {tab: 'Common reactions', content: tabCommon, canDelete : false, show: false});
        	var tableCommon = $('<table class="table table-striped table-bordered" '+
        			'style="margin-left: auto; margin-right: auto;" id="'+self.pref+'modelcomp-common"/>');
        	tabCommon.append(tableCommon);
			tableCommon.dataTable({
					"sPaginationType": "full_numbers",
					"iDisplayLength": 10,
					"aaData": [],
					"aaSorting": [[ 2, "desc" ], [0, "asc"]],
					"aoColumns": [
								  { "sTitle": "Reaction", 'mData': 'model1rxn.dispid'},
								  { "sTitle": "Equation&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;", 'mData': 'model1rxn.equation'},
								  { "sTitle": "<b>"+self.fba_model1.id+"</b> features", 'mData': 'model1features'},
								  { "sTitle": "<b>"+self.fba_model2.id+"</b> features", 'mData': 'model2features'},
								  { "sTitle": "Name", 'mData': 'model1rxn.name'},
								  { "sTitle": "Exact", 'mData': 'exact'},
					],
					"oLanguage": {
								"sEmptyTable": "No functions found!",
								"sSearch": "Search: "
					},
					'fnDrawCallback': events
			});
			tabCommon.append($('<table><tr><td>(*) color legend: sub-best bidirectional hits are marked<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;by <font color="blue">blue</font>, '+
            		'orphan features are marked by <font color="red">red</font>.</td></tr></table>'));
        	//////////////////////////////////////////// Model1 only tab /////////////////////////////////////////////
        	var tabModel1 = $("<div/>");
    		tabPane.kbaseTabs('addTab', {tab: self.fba_model1.id+" only", content: tabModel1, canDelete : false, show: false});
        	var tableModel1 = $('<table class="table table-striped table-bordered" '+
        			'style="margin-left: auto; margin-right: auto;" id="'+self.pref+'modelcomp-model1"/>');
        	tabModel1.append(tableModel1);
			tableModel1.dataTable({
					"sPaginationType": "full_numbers",
					"iDisplayLength": 10,
					"aaData": [],
					"aaSorting": [[ 2, "desc" ], [0, "asc"]],
					"aoColumns": [
								  { "sTitle": "Reaction", 'mData': 'dispid'},
								  { "sTitle": "Equation&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;", 'mData': 'equation'},
								  { "sTitle": "<b>"+self.fba_model1.id+"</b> features", 'mData': 'dispfeatures'},
								  { "sTitle": "Name", 'mData': 'name'},
					],
					"oLanguage": {
								"sEmptyTable": "No functions found!",
								"sSearch": "Search: "
					},
					'fnDrawCallback': events
			});
        	//////////////////////////////////////////// Model2 only tab /////////////////////////////////////////////
        	var tabModel2 = $("<div/>");
    		tabPane.kbaseTabs('addTab', {tab: self.fba_model2.id+" only", content: tabModel2, canDelete : false, show: false});
        	var tableModel2 = $('<table class="table table-striped table-bordered" '+
        			'style="margin-left: auto; margin-right: auto;" id="'+self.pref+'modelcomp-model2"/>');
        	tabModel2.append(tableModel2);
			tableModel2.dataTable({
					"sPaginationType": "full_numbers",
					"iDisplayLength": 10,
					"aaData": [],
					"aaSorting": [[ 2, "desc" ], [0, "asc"]],
					"aoColumns": [
								  { "sTitle": "Reaction", 'mData': 'dispid'},
								  { "sTitle": "Equation&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;", 'mData': 'equation'},
								  { "sTitle": "<b>"+self.fba_model2.id+"</b> features", 'mData': 'dispfeatures'},
								  { "sTitle": "Name", 'mData': 'name'},
					],
					"oLanguage": {
								"sEmptyTable": "No functions found!",
								"sSearch": "Search: "
					},
					'fnDrawCallback': events
			});
			///////////////////////////////////// Event handling for links ///////////////////////////////////////////
			function events() {
				// event for clicking on ortholog count
				$('.show-reaction'+self.pref).unbind('click');
				$('.show-reaction'+self.pref).click(function() {
					var id = $(this).data('id');
					if (tabPane.kbaseTabs('hasTab', id)) {
						tabPane.kbaseTabs('showTab', id);
						return;
					}			
					tabPane.kbaseTabs('addTab', {tab: id, content: "Coming soon!", canDelete : true, show: true});
				});
				$('.show-gene'+self.pref).unbind('click');
				$('.show-gene'+self.pref).click(function() {
					var id = $(this).data('id');
					if (tabPane.kbaseTabs('hasTab', id)) {
						tabPane.kbaseTabs('showTab', id);
						return;
					}
					tabPane.kbaseTabs('addTab', {tab: id, content: "Coming soon!", canDelete : true, show: true});
				});
			}

        }, function(data) {
        	if (!error)
        		container.empty();
        	error = true;
    		container.append('<p>[Error] ' + data.error.message + '</p>');
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

    uuid: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
            function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
    }
})
});
