

define(['jquery', 
        'plotly',        
        'kbwidget', 
        'kbaseAuthenticatedWidget', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap'
        ], function($, Plotly) {
    $.KBWidget({
        name: 'kbaseChromatographyMatrix',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.0',
        options: {
            workspaceID: null,

            chromatographyMatrixID: null,

            // Service URL: should be in window.kbconfig.urls.
            workspaceURL: window.kbconfig.urls.workspace,
            loadingImage: "static/kbase/images/ajax-loader.gif"
        },

        // Prefix for all div ids
        pref: null,

        // KBaseFeatureValue client
        wsClient: null,

        // Matrix set stat
        chromatographyhMatrix: null,

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
            // this.options.workspaceID = '645';
            // this.options.chromatographyhMatrixID = '9';
        },


        loadAndRender: function(){
            var self = this;
            self.loading(true);

//            self.setTestParameters();
            var ref = self.buildObjectIdentity(this.options.workspaceID, this.options.chromatographyMatrixID);
            self.wsClient.get_objects([ref], 
                function(data) {

                    self.chromatographyhMatrix = data[0].data;
                    console.log("chromatographyhMatrix",self.chromatographyhMatrix);
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
            
            var self = this;
            var data = [];
            var timeUnit = "";
            
            var rowIds = self.chromatographyhMatrix.data.row_ids;
            var rowsMetadata = self.chromatographyhMatrix.metadata.row_metadata;
            var columnIds = self.chromatographyhMatrix.data.col_ids;
            var coulmnsMetadata = self.chromatographyhMatrix.metadata.column_metadata;            
            var values = self.chromatographyhMatrix.data.values;

                        
            for(var cIndex in columnIds) {
                var cId = columnIds[cIndex];
                var columnMetadata = coulmnsMetadata[cId];
                
                // Build xValues. It should be time series and the values should be in row metadata
                var xValues = [];                
                for(var rIndex in rowIds){
                    var rId = rowIds[rIndex];
                    var rowMetadata = rowsMetadata[rId];                    
                    for (var i in rowMetadata){
                        var propValue = rowMetadata[i];
                        if(propValue.entity == 'TimeSeries'){
                            xValues.push(propValue.property_value );
                            timeUnit =  propValue.property_unit;
                        }
                    }
                }
                
                // Build yValues
                var yValues = [];
                for(var rIndex in rowIds) {
                    yValues.push( values[rIndex][cIndex] );
                }
                
                var label = "";
                for(var i in columnMetadata){
                    var propValue = columnMetadata[i];
                    if(propValue.entity == 'Measurement' && propValue.property_name == 'Intensity'){
                        label = propValue.property_value;
                        break;
                    }
                }
                
                console.log("coulmnsMetadata  + columnMetadata + label", coulmnsMetadata, columnMetadata, label)
                
                
                
                // Build track
                var dataTrack = {
                    x : xValues,
                    y : yValues,
                    name: label
                };
                data.push(dataTrack);
            }            
            
            
            
            var layout = {
                autosize: true,
                margin: {
                    l: 50,
                    r: 50,
                    b: 100,
                    t: 100,
                    pad: 4
                },
                "title": self.chromatographyhMatrix.description, 
                "titlefont": {
                    "color": "rgb(33, 33, 33)", 
                    "family": "", 
                    "size": 0
                },  
                "xaxis": {
                    "title": "Time, " + timeUnit, 
                    "titlefont": {
                        "color": "", 
                        "family": "", 
                        "size": 0
                    } 
                },                 
                "yaxis": {
                    "title": "", 
//                    type: 'log',
                    autorange: true
                }                
            };     

            console.log('data', data);
            Plotly.plot( $containerDiv[0], data, layout, {showLink: false} );            
            
            
            
//            var matrix = this.chromatographyhMatrix;
//            var xValues = matrix.column_metadata.time_values;
//            var names = matrix.row_metadata.elem_labels;            
//
//            var data =[];
//            for(var i = 0; i < names.length; i ++){
//                var values = [];
//                for(var j = 0; j < xValues.length; j++){
//                    values.push( [xValues[j], matrix.data.values[j][i]] );
//                }
//                data.push({
//                    name: names[i],
//                    data: values
//                });
//            }
//            console.log('seriees',data);
//            $containerDiv.highcharts({
//                title: {
//                    text: matrix.description ,
//                    x: -20 //center
//                },
//                subtitle: {
//                    text: 'Source: ENIGMA Metals Campaign',
//                    x: -20
//                },
//                xAxis: {
//                    title: {
//                        text: 'Time, ' + matrix.column_metadata.unit
//                    },
//                    plotLines: [{
//                        value: 0,
//                        width: 1,
//                        color: '#808080'
//                    }]
//                },
//                yAxis: {
//                    title: {
//                        text: ''
//                    },
//                    plotLines: [{
//                        value: 0,
//                        width: 1,
//                        color: '#808080'
//                    }]
//                },
//                tooltip: {
//                    valueSuffix: '°C'
//                },
//                legend: {
//                    layout: 'vertical',
//                    align: 'right',
//                    verticalAlign: 'middle',
//                    borderWidth: 0
//                },
//                credits: {
//                    enabled: false
//                },                
//                   series: data
//            });
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