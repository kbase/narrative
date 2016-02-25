define([
        'jquery', 
        'plotly',
        'kbwidget', 
        'kbaseGrowthParametersAbstract', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap' 
        ], function($,Plotly) {
    $.KBWidget({
        name: 'kbaseGrowthParamsPlot',
        parent: 'kbaseGrowthParametersAbstract',
        version: '1.0.0',        
        options: {
            growthParam: null,
            conditionParam: null
        },
        
        render: function(){
            var sampleParams = this.buildSamplesWithParameters();
            var seriesParams = this.groupSamplesWithParametersIntoSeries(sampleParams);
            
            this.loading(false);
            var $vizContainer = $("<div/>");
            this.$elem.append( $vizContainer );
            this.buildWidget( $vizContainer , seriesParams);                 
        },        
        
        buildWidget: function($containerDiv, seriesParams){   
            var growthParamNames = {
                "growth_rate": "Growth rate",
                "max_growth": "Max growth",
                "lag_phase":  "Lag phase",
                "area_under_curve": "Area under curve"
            };                        
            
            var growthParamType = this.options.growthParam;
            var growthParamName = growthParamNames[growthParamType];
            var conditionParamX = this.options.conditionParam;                
                        
            this.buildPlot($containerDiv, growthParamType, growthParamName, seriesParams, conditionParamX);
        },
        
        buildPlot: function($containerDiv, growthParamType, growthParamName, seriesParams, conditionParamX){
            var self = this;
            
            var xyeValues = [];
            var conditionParamXUnit;
            
            var filters = self.options.conditionFilter;
            
            // iterate over all series
            for(var i in seriesParams){
                var seriesParam = seriesParams[i];
                var samples = seriesParam.samples;
                
                // Check all properties
                var filterPassed = true;
                var value = null;
                var unit = null;
                
                for(var conditionName in seriesParam.conditionHash){
                    var pv = seriesParam.conditionHash[conditionName];
                    if(conditionName == conditionParamX){
                        value = pv.property_value;
                        unit = pv.property_unit;
                    } else {
                        if( !(conditionName in filters)){
                            filterPassed = false;
                            break;                                
                        }
                        if( pv.property_value != filters[conditionName] ){
                            filterPassed = false;
                            break;                                
                        }                        
                    }
                }
                
                
                if( value != null && filterPassed){
                    xyeValues.push({
                        x: value,
                        y: seriesParam['avg_' + growthParamType],
                        e: seriesParam['se_' + growthParamType]
                    });
                    conditionParamXUnit = unit;
                }
            }


            
            
            // Sort by xvalues
            if(conditionParamXUnit != null && conditionParamXUnit != ""){
                // If unit is provided we expect that it x values are numeric
                xyeValues.sort(function(a, b) { return a.x - b.x;});            
            } else{
                xyeValues.sort(function(a, b) { return a.x > b.x ? 1 : -1});            
            }
            
            
            // Build xValue and yValues arrays
            var xValues = [];
            var yValues = [];
            var yErrors = [];
            for(var i in xyeValues){
                xValues.push(xyeValues[i].x);
                yValues.push(xyeValues[i].y);
                yErrors.push(xyeValues[i].e);
            }
            
            
            // Build track
            var data = [];
            data.push({
                    x : xValues,
                    y : yValues,
                    'error_y':{
                      type: 'data',
                      array: yErrors,
                      visible: true
                    },
                
                //                    text: names,
                    mode: 'lines+markers',
                    type: 'scatter',
                    marker: { size: 9 }
            });

            // Build title
            var title = growthParamName;
            if(filters && Object.keys(filters).length > 0){
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
//                    title: growthParamName,
                }
            };     

            Plotly.plot( $containerDiv[0], data, layout, {showLink: false} );              
        }
    });        
}); 
