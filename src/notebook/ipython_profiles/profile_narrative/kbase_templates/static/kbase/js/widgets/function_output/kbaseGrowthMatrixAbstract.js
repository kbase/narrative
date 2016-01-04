

define([
        'jquery', 
        'kbwidget', 
        'kbaseAuthenticatedWidget', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap' 
        ], function($) {
    $.KBWidget({
        name: 'kbaseGrowthMatrixAbstract',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.0',
        options: {
            workspaceID: null,
            growthMatrixID: null,
            columnIds: null,
            conditionParam: null,
            conditionParamX: null,
            conditionParamY: null,            
            conditionFilter: {},

            // Service URL: should be in window.kbconfig.urls.
            workspaceURL: window.kbconfig.urls.workspace,
            loadingImage: "static/kbase/images/ajax-loader.gif"
        },

        // Prefix for all div ids
        pref: null,

        // KBaseFeatureValue client
        wsClient: null,

        // Matrix 
        growthMatrix: null,
                
        // Conditions
        conditions: null,
        

        init: function(options) {
            this._super(options);
            this.pref = this.uuid();

            // Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);       

            return this;
        },

        loggedInCallback: function(event, auth) {

            console.log('options', this.options);
            
           // Build a client
            this.wsClient = new Workspace(this.options.workspaceURL, auth);

            // Let's go...
            this.loadAndRender();           
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.isLoggedIn = false;
            return this;
        },

        setTestParameters: function(){
        },


        loadAndRender: function(){
            var self = this;
            self.loading(true);

            self.setTestParameters();
            var ref = self.buildObjectIdentity(this.options.workspaceID, this.options.growthMatrixID);
            self.wsClient.get_objects([ref], 
                function(data) {

                    self.growthMatrix = data[0].data;
                    self.conditions = self.buildConditions();
                    console.log("growthMatrix",self.growthMatrix);
                    self.loading(false);
                    self.render();
                },
                function(error){
                    self.clientError(error);
                }
            );
        },

        // main function to render widget
        render: function(){

            var $overviewContainer = $("<div/>");
            this.$elem.append( $overviewContainer );
            this.buildOverviewDiv( $overviewContainer );

            // // Separator
            // this.$elem.append( $('<div style="margin-top:1em"></div>') );

            var $vizContainer = $("<div/>");
            this.$elem.append( $vizContainer );
            this.buildWidget( $vizContainer );               
        },

        buildOverviewDiv: function($containerDiv){
            var self = this;
            var pref = this.pref;

            
            var $overviewSwitch = $("<a/>").html('[Show/Hide Conditions]');
            $containerDiv.append($overviewSwitch);

            var $overvewContainer = $('<div hidden style="margin:1em 0 4em 0"/>');
            $containerDiv.append($overvewContainer);
            self.buildConditionsTable($overvewContainer);
            
            $overviewSwitch.click(function(){
                $overvewContainer.toggle();
            });              
        },
        
        buildConditionsTable: function($container){
            
            console.log('from buildConditionsTable');
            var self = this;
            var pref = self.pref;
            
            var iDisplayLength = 10;
            var style = 'lftip';
            if(self.conditions.length<=iDisplayLength) { style = 'fti'; }

            var table = $('<table id="'+pref+'conditions-table"  \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>')
                .appendTo($container)
                .dataTable( {
                    "sDom": style,
                    "iDisplayLength": iDisplayLength,
                    "aaData": self.conditions,
                    "aoColumns": [
                        { sTitle: "Condition ID", mData: "columnId"},
                        { sTitle: "Conditions", mData: "label"},
                        { sTitle: "Max rate", mData:"maxRate" },
                        { sTitle: "Max rate time", mData:"maxRateTime" },
                        { sTitle: "Max OD", mData:"maxOD" },
                        { sTitle: "Max OD time", mData:"maxODTime" }
                    ],
                    "oLanguage": {
                                "sEmptyTable": "No conditions found!",
                                "sSearch": "Search: "
                    }                    
                } );          
        },
        
        
        
        // Prepare conditions for furhter visualization:
        // 1. build condition label
        // 2. calculate growth curve paramaeters
        buildConditions: function(){
            var self = this;
            var conditions = [];
            
            
            var rowIds = self.growthMatrix.data.row_ids;
            
            // If columnIds parameter is defined then let us use only thouse columns, 
            // otherwise we will use all columns in the matrix
            var columnIds = self.options.columnIds ? 
                    $.map(self.options.columnIds.split(","), $.trim): 
                    self.growthMatrix.data.col_ids;
            
            // Build hash of columnIds to column indeces to be able to access values by columnId
            var columnIds2ColumnIndex = self.buildColumnIds2ColumnIndex(self.growthMatrix);
                        
            
            // metadat of columns and rows
            var rowsMetadata = self.growthMatrix.metadata.row_metadata;
            var columnsMetadata = self.growthMatrix.metadata.column_metadata;
            
            // Actual values in the matrix
            var values = self.growthMatrix.data.values;
            
            var conditionFilter = self.options.conditionFilter;
            
            var conditionParam = self.options.conditionParam;
            var conditionParamX = self.options.conditionParamX;
            var conditionParamY = self.options.conditionParamY;


            var conditionParams = {};
            if(conditionParam) conditionParams[conditionParam] = "";
            if(conditionParamX) conditionParams[conditionParamX] = "";
            if(conditionParamY) conditionParams[conditionParamY] = "";

            
            
            for(var ci in columnIds) {
                var columnId = columnIds[ci];
                
                // cIndex is the index of columnId in the matrix 
                var cIndex = columnIds2ColumnIndex[columnId];
                var columnMetadata = columnsMetadata[columnId];
                                
                // Check conditionParam && filters: all column params should be specified
                if( !$.isEmptyObject(conditionParams) ){
                    
                    // Check that all conditions params are present in a given column
                    var conditionParamsFound = true;
                    for(var conditionParam in conditionParams){
                        var conditionParamFound = false;
                        for(var i in columnMetadata){
                            var pv  = columnMetadata[i];
                            if(pv.entity != 'Condition') continue;
                            if(conditionParam == pv.property_name ){
                                conditionParamFound = true;
                                break;
                            }
                        }
                        if(!conditionParamFound){
                            conditionParamsFound = false;
                            break;
                        }                        
                    }
                    
                    if(!conditionParamsFound) continue;
                        
                    // Check that all params are either main params or constrained by filter
                    var filtersPassed = true;                
                    for(var i in columnMetadata){
                        var pv  = columnMetadata[i];
                        if(pv.entity != 'Condition') continue;
                        if( !(pv.property_name in conditionParams) && ( !(pv.property_name in conditionFilter) || conditionFilter[pv.property_name ] != pv.property_value) ){
                            filtersPassed = false;
                            break;
                        } 
                    }

                    if(!filtersPassed){
                        continue;
                    }                
                }                
                
                // Calculate growth curve parameters
                var maxRate = 0;
                var maxRateTime = 0;
                var maxOD = 0;
                var maxODTime = 0;
                for(var rIndex in rowIds) {
                    
                    var od = values[rIndex][cIndex];  
                    var time = self.getRowTime(rowIds[rIndex], rowsMetadata);
                    if(rIndex > 0){
                        var odPrev = values[rIndex-1][cIndex];  
                        var timePrev = self.getRowTime(rowIds[rIndex-1], rowsMetadata);

                        var rate = 0;
                        if(od > 0 && odPrev > 0){
                            rate = (Math.log(od) - Math.log(odPrev))/(time - timePrev);
                        }
//                        var rate = (growth - growthPrev)/(time - timePrev);
                        if(rate > maxRate){
                            maxRate = rate;
                            maxRateTime = time;
                        }
                    }
                        
                    if(od > maxOD){
                        maxOD = od;
                        maxODTime = time;
                    }
                }
                
                
                // Build a properties record for a given condition
                conditions.push({
                    columnIndex: cIndex,
                    columnId: columnId,
                    label: self.getColumnLabel(columnMetadata),
                    metadata: columnMetadata,
                    
                    maxOD: maxOD.toFixed(3),
                    maxODTime: maxODTime.toFixed(1),
                    maxRate: maxRate.toFixed(3),
                    maxRateTime: maxRateTime.toFixed(1)
                });
            }
            
            return conditions;
        },
        
        // Builds and returns map of columnIds => column index in the matrix
        buildColumnIds2ColumnIndex: function(matrix){
            var columnIds2ColumnIndex = {};
            var columnIds = matrix.data.col_ids;
            for(var columnIndex in columnIds){
                columnIds2ColumnIndex[ columnIds[columnIndex] ] = columnIndex;
            }
            return columnIds2ColumnIndex;
        },
        
        // Builds and returns a column label by combining all column properties described in the metadata
        getColumnLabel: function(columnMetadata){
            var label = "";
            for(var i in columnMetadata){
                propValue  = columnMetadata[i];
                if(i > 0){
                    label += "; ";
                }
                label += propValue.property_name + ":" + propValue.property_value +  (propValue.property_unit ? propValue.property_unit : "");
            }
            return label;
        },
        
        // Returns time value for a given row in the matrix
        getRowTime : function(rowId, rowsMetadata){
            var time;
            var rowMetadata = rowsMetadata[rowId];                    
            for (var i in rowMetadata){
                var propValue = rowMetadata[i];
                if(propValue.entity == 'TimeSeries'){
                    time = propValue.property_value;
                    break;
                }
            }            
            return parseFloat(time);
        },        
        
        // Returns max value in 2d array for a given column
        maxValueForColumn: function(values, columnIndex){
            var maxValue = values[0][columnIndex];
            for(var i = 0; i < values.length; i++){
                if(maxValue > values[i][columnIndex]){
                    maxValue = values[i][columnIndex];
                }
            }
            return maxValue;
        },
        
        makeRow: function(name, value) {
            var $row = $("<tr/>")
                       .append($("<th />").css('width','20%').append(name))
                       .append($("<td />").append(value));
            return $row;
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

        clientError: function(error){
            this.loading(false);
            this.showMessage(error.error.error);
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
        }

    });
});