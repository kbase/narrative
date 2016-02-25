

define(['jquery', 
        'plotly',  
        'kbaseMatrix2DAbstract',
        'kbwidget', 
        'kbaseAuthenticatedWidget', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap'
        ], function($, Plotly) {
    $.KBWidget({
        name: 'kbaseChromatograms',
        parent: 'kbaseMatrix2DAbstract',
        version: '1.0.0',

        render: function(){
            this.loading(false);
            
            var $vizContainer = $("<div/>");
            this.$elem.append( $vizContainer );
            this.buildWidget( $vizContainer );            
        },
      
        // To be overriden
        buildWidget: function($containerDiv){
            
            var self = this;
            var data = [];
            var timeUnit = "";
            var timeType = "";
            
            var rowIds = self.matrix.data.row_ids;
            var rowsMetadata = self.matrix.metadata.row_metadata;
            var columnIds = self.matrix.data.col_ids;
            var coulmnsMetadata = self.matrix.metadata.column_metadata;            
            var values = self.matrix.data.values;

            for(var cIndex in columnIds) {
                var cId = columnIds[cIndex];
                var columnMetadata = coulmnsMetadata[cId];
                
                // Build xValues. It should be time series and the values should be in row metadata
                var xValues = [];                
                for(var rIndex in rowIds){
                    var rId = rowIds[rIndex];
                    var rowMetadata = rowsMetadata[rId];                    
                    for (var i in rowMetadata){
                        var pv = rowMetadata[i];
                        if(pv.category == 'TimeSeries'){
                            xValues.push(pv.property_value );
                            timeType = pv.property_name;
                            timeUnit = pv.property_unit;
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
                    var pv = columnMetadata[i];
                    if(pv.category == 'Measurement' && pv.property_name == 'Substance'){
                        label = pv.property_value;
                        break;
                    }
                }
                
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
                "title": self.matrix.description, 
                "titlefont": {
                    "color": "rgb(33, 33, 33)", 
                    "family": "", 
                    "size": 0
                },  
                "xaxis": {
                    "title": timeType + ", " + timeUnit, 
                    "titlefont": {
                        "color": "", 
                        "family": "", 
                        "size": 0
                    } 
                },                 
                "yaxis": {
                    "title": "", 
                    autorange: true
                }                
            };     
            Plotly.plot( $containerDiv[0], data, layout, {showLink: false} );            
        }
    });
});