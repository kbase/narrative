


define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'plotly',
		'kbaseGrowthMatrixAbstract',
		'kbaseTabs',
		'jquery-dataTables'
	], (
		KBWidget,
		bootstrap,
		$,
		Plotly,
		kbaseGrowthMatrixAbstract,
		kbaseTabs,
		jquery_dataTables
	) => {
    return KBWidget({
        name: 'kbaseGrowthParams2DPlot',
        parent : kbaseGrowthMatrixAbstract,
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

            const growthParamNames = {
                "maxRate": "Max growth rate",
                "maxRateTime": "Max growth rate time",
                "maxOD":  "Max OD",
                "maxODTime": "Max OD time"
            };

            const growthParamType = this.options.growthParam;
            const growthParamName = growthParamNames[growthParamType];
            const conditionParamX = this.options.conditionParamX;
            const conditionParamY = this.options.conditionParamY;


            this.buildPlot($containerDiv, growthParamType, growthParamName, conditionParamX, conditionParamY);

        },

        buildPlot: function($containerDiv, growthParamType, growthParamName, conditionParamX, conditionParamY){
            const self = this;
            var data = [];
            let xLabel = "";
            let yLabel = "";

            let xUnit = null;
            let yUnit = null;

            const xValues = {};
            const yValues = {};
            const zValues = {};

            const conditions = self.conditions;
            for(const ci in conditions){
                const condition = conditions[ci];

                var xValue;
                var yValue;
                for(var i in condition.metadata){
                    const propValue  = condition.metadata[i];
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
            const dataXs = [];
            for(var i in xValues){
                dataXs.push( xUnit ?  parseFloat(xValues[i]) : xValues[i]);
            }
//            console.log('xUnit', xUnit);
//            console.log('before sort: dataXs', dataXs);
            dataXs.sort((a, b) => { return a > b ? 1 : -1});
//            console.log('after sort: dataXs', dataXs);
//            dataXs.sort(function(a, b) { return parseFloat(a) > parseFloat(b) ? 1 : -1});

            const dataYs = [];
            for(var i in yValues){
                dataYs.push( yUnit ?  parseFloat(yValues[i]) : yValues[i]);
            }
//            console.log('yUnit', yUnit);
//            console.log('before sort: dataYs', dataYs);
            dataYs.sort((a, b) => { return a > b ? 1 : -1});
//            console.log('after sort: dataYs', dataYs);
//            dataYs.sort(function(a, b) { return parseFloat(a) > parseFloat(b) ? 1 : -1});


            const dataZs = [];
            for(const yIndex in dataYs){
                const row = [];
                for(const xIndex in dataXs){
                    const key = dataXs[xIndex] + "_" + dataYs[yIndex];
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
            let title = growthParamName;
            const filters = self.options.conditionFilter;
            if(filters){
                title += '<br><span style="font-size:0.8em; font-style: italic">constrained parameteres: ';
                var i = 0;
                for(const param in filters){
                    const value = filters[param];
                    if(i > 0){
                        title += ', ';
                    }
                    title += param + ":" + value;
                    i++;
                }
                title += "</span>";
            }

            const layout = {
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

            const $plotDiv = $("<div/>");
            $containerDiv.append( $plotDiv );
            Plotly.plot( $plotDiv[0], data, layout, {showLink: false} );
        }
    });
});
