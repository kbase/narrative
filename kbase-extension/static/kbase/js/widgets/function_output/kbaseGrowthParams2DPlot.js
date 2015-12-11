 


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
        name: 'kbaseGrowthParams2DPlot',
        parent: 'kbaseGrowthMatrixAbstract',
        version: '1.0.0',

        setTestParameters: function(){
//            this.options.growthParam = 'maxRate';
//            this.options.conditionParamX = 'Tungsten';
//            this.options.conditionParamY = 'Strain';
////            this.options.columnIds = 'C1,C3';
//            this.options.conditionFilter = [
//                {'Molybdenum': 100}
//            ];
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
            var conditionParamX = this.options.conditionParamX;     
            var conditionParamY = this.options.conditionParamY;     
            
            
            this.buildPlot($containerDiv, growthParamType, growthParamName, conditionParamX, conditionParamY);
        
        },
        
        buildPlot: function($containerDiv, growthParamType, growthParamName, conditionParamX, conditionParamY){
            var self = this;
            var data = [];
            var xLabel = "";
            var yLabel = "";  
            
            var xUnit = null;
            var yUnit = null;
            
            var xValues = {};
            var yValues = {};
            var zValues = {};
            
            var conditions = self.conditions;
            for(var ci in conditions){
                var condition = conditions[ci];
                
                var xValue;
                var yValue;
                for(var i in condition.metadata){
                    var propValue  = condition.metadata[i];
                    if( propValue.entity != 'Condition') continue;
                    
                    if( propValue.property_name == conditionParamX){
                        xValue = propValue.property_value;
                        xLabel = propValue.property_name;// + "." + propValue.property_name;
                        xUnit = propValue.property_unit;
                        if(propValue.property_unit != undefined && propValue.property_unit != ''){
                            xLabel += " (" + propValue.property_unit + ")";
                        }
                    }
                    if( propValue.property_name == conditionParamY){
                        yValue = propValue.property_value;
                        yLabel = propValue.property_name;// + "." + propValue.property_name; 
                        yUnit = propValue.property_unit;
                        if(propValue.property_unit != undefined && propValue.property_unit != ''){
                            yLabel += " (" + propValue.property_unit + ")";
                        }
                    }
                }                
                xValues[xValue] = xValue;
                yValues[yValue] = yValue;
                zValues[xValue + "_" + yValue] = condition[growthParamType];
            }
            
            
            // Build data X's, Y's, and Z's
            var dataXs = [];
            for(var i in xValues){
                dataXs.push( xUnit ?  parseFloat(xValues[i]) : xValues[i]);
            }
//            console.log('xUnit', xUnit);
//            console.log('before sort: dataXs', dataXs);
            dataXs.sort(function(a, b) { return a > b ? 1 : -1});
//            console.log('after sort: dataXs', dataXs);
//            dataXs.sort(function(a, b) { return parseFloat(a) > parseFloat(b) ? 1 : -1});            
            
            var dataYs = [];
            for(var i in yValues){
                dataYs.push( yUnit ?  parseFloat(yValues[i]) : yValues[i]);
            }
//            console.log('yUnit', yUnit);
//            console.log('before sort: dataYs', dataYs);
            dataYs.sort(function(a, b) { return a > b ? 1 : -1});
//            console.log('after sort: dataYs', dataYs);
//            dataYs.sort(function(a, b) { return parseFloat(a) > parseFloat(b) ? 1 : -1});
                
            
            var dataZs = [];
            for(var yIndex in dataYs){
                var row = [];
                for(var xIndex in dataXs){
                    var key = dataXs[xIndex] + "_" + dataYs[yIndex];
                    if(key in zValues){
                        row.push(zValues[key]);
                    } else{
                        row.push(undefined);
                    }
                }
                dataZs.push(row);
            }

            var data = [
              {
                x: dataXs,
                y: dataYs,
                z: dataZs,
                type: 'heatmap'
              }
            ];

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
                    title: xLabel, 
                    type:"category",
//                    autorange:false                    
                },                 
                yaxis: {
                    title: yLabel, 
                    type:"category",
//                    autorange:false                    
                }
            };     

            var $plotDiv = $("<div/>");
            $containerDiv.append( $plotDiv );            
            Plotly.plot( $plotDiv[0], data, layout, {showLink: false} );              
        }
    });        
}); 

