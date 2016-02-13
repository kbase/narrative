
define([
        'jquery', 
        'plotly',
        'kbwidget', 
        'kbaseGrowthMatrixAbstract', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap' 
        ], function($,Plotly) {
    $.KBWidget({
        name: 'kbaseGrowthCurves',
        parent: 'kbaseGrowthMatrixAbstract',
        version: '1.0.0',

        setTestParameters: function(){
//            this.options.columnIds = 'C1,C3';
        },        
        
        // Build widget to visualize growth curves
        buildWidget: function($containerDiv){
            var self = this;
            var data = [];
            var timeUnit = "";
            
            var rowIds = self.growthMatrix.data.row_ids;
            var rowsMetadata = self.growthMatrix.metadata.row_metadata;            
            var conditions = self.conditions;
                        
            for(var ci in conditions) {
                var condition = conditions[ci];
                
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
                var values = self.growthMatrix.data.values;
                for(var rIndex in rowIds) {
                    yValues.push( values[rIndex][condition.columnIndex] );
                }
                
                
                // Build track
                var dataTrack = {
                    x : xValues,
                    y : yValues,
                    name: condition.label
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
                "title": self.growthMatrix.description, 
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
                    "title": "OD", 
                    type: 'log',
                    autorange: true
                }                
            };     

            console.log('Script Loaded');
            Plotly.plot( $containerDiv[0], data, layout, {showLink: false} );
        }
    });
});