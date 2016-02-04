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
