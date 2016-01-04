

define(['jquery', 
        'plotly',        
        'kbwidget', 
        'kbaseAuthenticatedWidget', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap'    
        ], function($, Plotly) {
    $.KBWidget({
        name: 'kbaseWellSample2DPlot',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.0',
        options: {
            workspaceID: null,

            wellSampleMatrixID: null,
            substanceX: 'Cu',
            substanceY: 'W',

            // Service URL: should be in window.kbconfig.urls.
            workspaceURL: window.kbconfig.urls.workspace,
            loadingImage: "static/kbase/images/ajax-loader.gif"
        },

        // Prefix for all div ids
        pref: null,

        // KBaseFeatureValue client
        wsClient: null,

        // Matrix set stat
        wellSampleMatrix: null,

        init: function(options) {
            this._super(options);
            this.pref = this.uuid();

            // Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);       

            return this;
        },

        loggedInCallback: function(event, auth) {

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

            // self.setTestParameters();
            var ref = self.buildObjectIdentity(this.options.workspaceID, this.options.wellSampleMatrixID);
            self.wsClient.get_objects([ref], 
                function(data) {

                    self.wellSampleMatrix = data[0].data;
                    console.log("wellSampleMatrix",self.wellSampleMatrix);
                    self.loading(false);
                    self.render();
                },
                function(error){
                    self.clientError(error);
                }
            );
        },

        render: function(){

            // var $overviewContainer = $("<div/>");
            // this.$elem.append( $overviewContainer );
            // this.buildOverviewDiv( $overviewContainer );

            // // Separator
            // this.$elem.append( $('<div style="margin-top:1em"></div>') );

            var $vizContainer = $("<div/>");
            this.$elem.append( $vizContainer );
            this.buildWidget( $vizContainer );            
        },

        buildOverviewDiv: function($containerDiv){
            var self = this;
            var pref = this.pref;

            var $overviewSwitch = $("<a/>").html('[Selected genes]');
            $containerDiv.append($overviewSwitch);

            $overviewSwitch.click(function(){
                $overvewContainer.toggle();
            });
        },
      

        // To be overriden
        buildWidget: function($containerDiv){
            
            var data = this.wellSampleMatrix.data;
            var row_metadata = this.wellSampleMatrix.metadata.row_metadata;
            var column_metadata = this.wellSampleMatrix.metadata.column_metadata;
            
            var xColumnIndex = -1;
            var xSubstance = "";
            var xUnits = "";
            var yColumnIndex = -1;
            var ySubstance = "";
            var yUnits = "";
            
            for(var cIndex in data.col_ids){
                var cm = column_metadata[data.col_ids[cIndex]];
                
                var averageColumn = false;
                var substance = "";
                var units = "";
                
                
                for(var pvIndex in cm){
                    var pv = cm[pvIndex];
                    if(pv.entity == 'Measurement' && pv.property_name == 'Substance'){
                        substance = pv.property_value;
                        units = pv.property_unit;
                    } 
                    if(pv.entity == 'Measurement' && pv.property_name == 'ValueType' && pv.property_value == 'Average'){
                        averageColumn = true;
                    } 
                }
                
                if(!averageColumn) continue;
                if(substance == this.options.substanceX) {
                    xColumnIndex = cIndex;
                    xSubstance = substance;
                    xUnits = units;
                }
                if(substance == this.options.substanceY) {
                    yColumnIndex = cIndex;
                    ySubstance = substance;
                    yUnits = units;
                }
            }
            
            console.log('indeces', xColumnIndex, yColumnIndex);
            
            var trace1 = {
              x: [],
              y: [],
              mode: 'markers+text',
              type: 'scatter',
              name: '',
              text: [],
              textfont : {
                family:'Times New Roman'
              },
              textposition: 'bottom center',                
              marker: { size: 12 }
            };
            
            for(var rIndex in data.row_ids){
                var rowId = data.row_ids[rIndex];
                var wellId = '';
                var rm = row_metadata[rowId];
                for(var rmIndex in rm){
                    var propValue = rm[rmIndex];
                    if( propValue.entity == 'Sample' && propValue.property_name == 'Well' ){
                        wellId = propValue.property_value;
                    }
                }
                trace1.x.push(data.values[rIndex][xColumnIndex]);
                trace1.y.push(data.values[rIndex][yColumnIndex]);
                trace1.text.push(wellId);
            };
            
            var traces = [ trace1 ];

            var layout = { 
                title: this.wellSampleMatrix.description,
                
              xaxis: {
                    type: 'log',
                    autorange: true,
                    title: xSubstance + " ("  + xUnits + ")"
              },
              yaxis: {
                    type: 'log',
                    autorange: true,
                    title: ySubstance + " ("  + yUnits + ")"
              },
              legend: {
                y: 0.5,
                yref: 'paper',
                font: {
                  family: 'Arial, sans-serif',
                  size: 20,
                  color: 'grey',
                }
              }

            };

            Plotly.newPlot($containerDiv[0], traces, layout, {showLink: false});            
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