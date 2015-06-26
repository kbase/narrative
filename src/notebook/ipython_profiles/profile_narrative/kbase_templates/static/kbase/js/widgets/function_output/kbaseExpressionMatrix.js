/**
 * Output widget to vizualize ExpressionMatrix object.
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

define(['jquery', 
        'kbwidget', 
        'kbaseAuthenticatedWidget', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap'], function($) {
    $.KBWidget({
        name: 'kbaseExpressionMatrix',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.2',
        options: {
            expressionMatrixID: null,
            workspaceID: null,
            expressionMatrixVer: null,
            workspaceURL: window.kbconfig.urls.workspace,
            loadingImage: "static/kbase/images/ajax-loader.gif",
            height: null,
	       maxDescriptionLength: 200
        },

        // Data for vizualization
        expressionMatrix: null,
        genomeRef: null,
        conditionsetRef: null,

        genomeID: null,
        genomeName: null,
        features: null,


        init: function(options) {
            this._super(options);

            // Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);
	    
            return this;
        },

        loggedInCallback: function(event, auth) {

//            this.options.workspaceID = 645;
//            this.options.expressionMatrixID = 8;
//            this.options.expressionMatrixVer = 1;

	        // error if not properly initialized

            if (this.options.expressionMatrixID == null) {
                this.showMessage("[Error] Couldn't retrieve expression matrix.");
                return this;
            }

            // Create a new workspace client
            this.ws = new Workspace(this.options.workspaceURL, auth);
           
            // Let's go...
            this.render();           
           
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.ws = null;
            this.isLoggedIn = false;
            return this;
        },
  
        render: function(){

            var self = this;
            self.pref = this.uuid();
            self.loading(true);

            var container = this.$elem;
            var kbws = this.ws;


            var expressionMatrixRef = self.buildObjectIdentity(this.options.workspaceID, this.options.expressionMatrixID, this.options.expressionMatrixVer);
            kbws.get_objects([expressionMatrixRef], function(data) {

                self.expressionMatrix = data[0].data;
                self.genomeRef = self.expressionMatrix.genome_ref;
                self.conditionsetRef = self.expressionMatrix.conditionset_ref;


                // Job to get properties of AnnotationDomain object: name and id of the annotated genome
                var jobGetGenomeProperties = kbws.get_object_subset(
                    [
                        { 'ref':self.genomeRef, 'included':['/id'] },
                        { 'ref':self.genomeRef, 'included':['/scientific_name'] },
                        { 'ref':self.genomeRef, 'included':['/features'] }
                    ], 
                    function(data){
                        self.genomeID = data[0].data.id;
                        self.genomeName = data[1].data.scientific_name;
                        self.features = data[2].data.features;
                    }, 
                    function(error){
                        self.clientError(error);
                    }                    
                );

                var jobGetConditionSet =  kbws.get_objects(
                    [{ref: self.conditionsetRef}], 
                    function(data) {
                        // SHould be implemented once we have ConditionSet object defined..          
                    },
                    function(error){
                        self.clientError(error);
                    }
                );

                // Launch jobs and vizualize data once they are done
                $.when.apply($, [jobGetGenomeProperties/*, jobGetConditionSet*/]).done( function(){
                    self.loading(false);

                    ///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
                    container.empty();
                    var tabPane = $('<div id="'+self.pref+'tab-content">');
                    container.append(tabPane);
                    tabPane.kbaseTabs({canDelete : true, tabs : []});                    
                    ///////////////////////////////////// Overview table ////////////////////////////////////////////           
                    var tabOverview = $("<div/>");
                    tabPane.kbaseTabs('addTab', {tab: 'Overview', content: tabOverview, canDelete : false, show: true});
                    var tableOver = $('<table class="table table-striped table-bordered" '+
                        'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="'+self.pref+'overview-table"/>');
                    tabOverview.append(tableOver);
                    tableOver
                        .append( self.makeRow( 
                            'Genome', 
                            $('<span />').append(self.genomeName).css('font-style', 'italic') ) )
                        .append( self.makeRow( 
                            'Description', 
                            self.expressionMatrix.description ) )
                        .append( self.makeRow( 
                            'Scale', 
                            self.expressionMatrix.scale ) )
                        .append( self.makeRow( 
                            'Value type', 
                            self.expressionMatrix.type) )
                        .append( self.makeRow( 
                            'Row normalization', 
                            self.expressionMatrix.row_normalization) )
                        .append( self.makeRow( 
                            'Column normalization', 
                            self.expressionMatrix.col_normalization) )
                        ;

                    ///////////////////////////////////// Conditions table ////////////////////////////////////////////          
                    var tabConditions = $("<div/>");
                    tabPane.kbaseTabs('addTab', {tab: 'Conditions', content: tabConditions, canDelete : false, show: false});
                    var tableConditions = $('<table class="table table-striped table-bordered" '+
                        'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="'+self.pref+'conditions-table"/>');
                    tabConditions.append(tableConditions);
                    var conditionsTableSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aaData": [],
                        "aaSorting": [[ 3, "asc" ], [0, "asc"]],
                        "aoColumns": [
                            { sTitle: "Condition", mData: "id"},
                            { sTitle: "Min", mData: "min"},
                            { sTitle: "Max", mData: "max"},
                            { sTitle: "Avg", mData: "avg"},
                            { sTitle: "Std", mData: "std"},
                            { sTitle: "Missed", mData: "missed"}
                        ],
                        "oLanguage": {
                                    "sEmptyTable": "No conditions found!",
                                    "sSearch": "Search: "
                        }
                    };
                    conditionsTableSettings.aaData = self.buildConditionsTableData();
                    tableConditions = tableConditions.dataTable(conditionsTableSettings);

                    ///////////////////////////////////// Genes table ////////////////////////////////////////////          
                    var tabGenes = $("<div/>");
                    tabPane.kbaseTabs('addTab', {tab: 'Genes', content: tabGenes, canDelete : false, show: false});
                    var tableGenes = $('<table class="table table-striped table-bordered" '+
                        'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="'+self.pref+'genes-table"/>');
                    tabGenes.append(tableGenes);
                    var genesTableSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aaData": [],
                        "aaSorting": [[ 3, "asc" ], [0, "asc"]],
                        "aoColumns": [
                            { sTitle: "Name", mData: "id"},
                            { sTitle: "Function", mData: "function"},
                            { sTitle: "Min", mData: "min"},
                            { sTitle: "Max", mData: "max"},
                            { sTitle: "Avg", mData: "avg"},
                            { sTitle: "Std", mData: "std"},
                            { sTitle: "Missed", mData: "missed"}
                        ],
                        "oLanguage": {
                                    "sEmptyTable": "No genes found!",
                                    "sSearch": "Search: "
                        }
                    };
                    genesTableSettings.aaData = self.buildGenesTableData();
                    tableGenes = tableGenes.dataTable(genesTableSettings);                   
                });                
            });
        },

        buildConditionsTableData: function(){
            var self = this;
            var row_ids = self.expressionMatrix.data.row_ids;
            var col_ids = self.expressionMatrix.data.col_ids;

            var values = self.expressionMatrix.data.values;
            var tableData = [];

            for(var cIndex = 0; cIndex < col_ids.length; cIndex++){

                var rLen = 0;
                var min = values[0][cIndex];
                var max = values[0][cIndex];
                var avg = 0;
                var std = 0;
                var missed = 0;

                // Calculate min, max, missed, sum         
                for(var rIndex = 0 ; rIndex < row_ids.length; rIndex++ ){

                    if(values[rIndex][cIndex] === null){
                        missed++;
                    } else{
                        rLen++;
                        if(values[rIndex][cIndex] < min || min === null) min = values[rIndex][cIndex];
                        if(values[rIndex][cIndex] > max || max === null) max = values[rIndex][cIndex];
                        avg += values[rIndex][cIndex];
                    }
                }

                // Calculate avg 
                if(rLen > 0 ){
                    avg /= rLen;
                } else{
                    avg = null;
                }

                // Calculate std
                if( rLen > 1){
                    for(var rIndex = 0 ; rIndex < row_ids.length; rIndex++ ){
                        if( values[rIndex][cIndex] !== null ){
                            std += (values[rIndex][cIndex] - avg)*(values[rIndex][cIndex] - avg);
                        }
                    }
                    std = Math.sqrt(std/(rLen-1));
                } else{
                    std = null;
                }


                tableData.push(
                    {
                        'id': col_ids[cIndex],
                        'min': min === null? ' ' : min.toFixed(2),
                        'max': max === null? ' ' : max.toFixed(2),
                        'avg': avg === null? ' ' : avg.toFixed(2),
                        'std': std === null? ' ' : std.toFixed(2),
                        'missed':missed
                    }
                );
            }
            return tableData;
        },

        buildGenesTableData: function(){
            var self = this;

            var featureId2Features = self.buildFeatureId2FeatureHash();
            var row_ids = self.expressionMatrix.data.row_ids;
            var col_ids = self.expressionMatrix.data.col_ids;

            var values = self.expressionMatrix.data.values;
            var tableData = [];

            for(var rIndex = 0; rIndex < row_ids.length; rIndex++){

                var cLen = 0;
                var min = values[rIndex][0];
                var max = values[rIndex][0];
                var avg = 0;
                var std = 0;
                var missed = 0;

                // Calculate min, max, missed, sum
                for(var cIndex = 0 ; cIndex < col_ids.length; cIndex++ ){

                    if(values[rIndex][cIndex] === null){
                        missed++;
                    } else{
                        cLen++;
                        if(values[rIndex][cIndex] < min || min === null) min = values[rIndex][cIndex];
                        if(values[rIndex][cIndex] > max || max === null) max = values[rIndex][cIndex];
                        avg += values[rIndex][cIndex];
                    }
                }

                // Calculate avg 
                if(cLen > 0 ){
                    avg /= cLen;
                } else{
                    avg = null;
                }

                // Calculate std
                if( cLen > 1){
                    for(var cIndex = 0 ; cIndex < col_ids.length; cIndex++ ){
                        if( values[rIndex][cIndex] !== null ){
                            std += (values[rIndex][cIndex] - avg)*(values[rIndex][cIndex] - avg);
                        }
                    }
                    std = Math.sqrt(std/(cLen-1));
                } else{
                    std = null;
                }


                featureId = row_ids[rIndex];
                tableData.push(
                    {
                        'id': row_ids[rIndex],
                        'function' : featureId2Features[featureId]['function'],
                        'min': min === null? ' ' : min.toFixed(2),
                        'max': max === null? ' ' : max.toFixed(2),
                        'avg': avg === null? ' ' : avg.toFixed(2),
                        'std': std === null? ' ' : std.toFixed(2),
                        'missed':missed
                    }
                );
            }
            return tableData;
        },

        buildFeatureId2FeatureHash: function(){
            var self = this;
            var features = self.features;
            var id2features = {};
            for(var i in features){
                id2features[features[i].id] = features[i];
            }
            return id2features;
        },

        makeRow: function(name, value) {
            var $row = $("<tr/>")
                       .append($("<th />").css('width','20%').append(name))
                       .append($("<td />").append(value));
            return $row;
        },

        getData: function() {
            return {
                type: 'ExpressionMatrix',
                id: this.options.expressionMatrixID,
                workspace: this.options.workspaceID,
                title: 'Expression Matrix'
            };
        },

        loading: function(isLoading) {
            if (isLoading)
                this.showMessage("<img src='" + this.options.loadingImage + "'/>");
            else
                this.hideMessage();                
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);

            this.$messagePane.append(span);
            this.$messagePane.show();
        },

        hideMessage: function() {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },

        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        },

        buildObjectIdentity: function(workspaceID, objectID, objectVer, wsRef) {
            var obj = {};
            if (wsRef) {
                obj['ref'] = wsRef;
            } else {
                if (/^\d+$/.exec(workspaceID))
                    obj['wsid'] = workspaceID;
                else
                    obj['workspace'] = workspaceID;

                // same for the id
                if (/^\d+$/.exec(objectID))
                    obj['objid'] = objectID;
                else
                    obj['name'] = objectID;
                
                if (objectVer)
                    obj['ver'] = objectVer;
            }
            return obj;
        },        

        clientError: function(error){
            this.loading(false);
            this.showMessage(error.error.error);
        }        

    });
});