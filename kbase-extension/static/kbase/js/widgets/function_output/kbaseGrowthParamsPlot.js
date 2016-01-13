
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
        name: 'kbaseGrowthParamsPlot',
        parent: 'kbaseGrowthMatrixAbstract',
        version: '1.0.0',        
        options: {
            growthParam: null,
            conditionParam: null
        },
        
        
        
        setTestParameters: function(){
        },        
        
        buildWidget: function($containerDiv){
            
            var growthParamNames = {
                "maxRate": "Max growth rate",
                "maxRateTime": "Max growth rate time",
                "maxOD":  "Max OD",
                "maxODTime": "Max OD time"
            };                        
            
            var growthParamType = this.options.growthParam;
            var growthParamName = growthParamNames[growthParamType];
            var conditionParamX = this.options.conditionParam;                
                        
            this.buildPlot($containerDiv, growthParamType, growthParamName, conditionParamX);
        },
        
        buildPlot: function($containerDiv, growthParamType, growthParamName, conditionParamX){
            var self = this;
            
            var xyValues = [];
            var conditionParamXUnit;
            
            var conditions = self.conditions;
            for(var ci in conditions){
                var condition = conditions[ci];
                

                // find the value        
                var value;                    
                for(var j in condition.metadata){
                    var pv  = condition.metadata[j];
                    if( pv.entity != 'Condition') continue;
                    if( pv.property_name == conditionParamX){
                        value = pv.property_value;
                        conditionParamXUnit = pv.property_unit;
                        break;
                    }
                }
                
                // Check whether xValues are numeric
                var xIsNumber = (conditionParamXUnit? true: false);
                

                // if value is found, add it to the data
                if(value != undefined){
                    xyValues.push({
                        x: xIsNumber? parseFloat(value): value,
                        y: condition[growthParamType]
                    });
                }
            }
            
            
            // Sort by xvalues
            xyValues.sort(function(a, b) { return a.x > b.x ? 1 : -1});            
            
            // Build xValue and yValues arrays
            var xValues = [];
            var yValues = [];
            for(var i in xyValues){
                xValues.push(xyValues[i].x);
                yValues.push(xyValues[i].y);
            }
            
            
            // Build track
            var data = [];
            data.push({
                    x : xValues,
                    y : yValues,
//                    text: names,
                    mode: 'lines+markers',
                    type: 'scatter',
                    marker: { size: 9 }
            });

            // Build title
            var title = growthParamName;
            var filters = self.options.conditionFilter;
            if(filters){
                title += '<br><span style="font-size:0.8em; font-style: italic">constrained parameteres: ';
                var i = 0;
                for(var param in filters){
                    var value = filters[param];
                    if(i > 0){
                        title += ', ';                    
                    }
                    title += param + ":" + value;
                    i++;
                }
                title += "</span>";
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
                title: title, 
                titlefont: {
                    color: "rgb(33, 33, 33)", 
                    family: "", 
                    size: 0
                },  
                xaxis: {
                    title: conditionParamX + (conditionParamXUnit ? " (" + conditionParamXUnit + ")": "")   ,
                    type: "category"
                },                 
                yaxis: {
                    title: growthParamName,
                }
            };     

            Plotly.plot( $containerDiv[0], data, layout, {showLink: false} );              
        }
    });        
}); 
