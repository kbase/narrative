define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'plotly',
		'kbaseGrowthParametersAbstract',
		'kbaseTabs',
		'jquery-dataTables'
	], (
		KBWidget,
		bootstrap,
		$,
		Plotly,
		kbaseGrowthParametersAbstract,
		kbaseTabs,
		jquery_dataTables
	) => {
    return KBWidget({
        name: 'kbaseGrowthParamsPlot',
        parent : kbaseGrowthParametersAbstract,
        version: '1.0.0',
        options: {
            growthParam: null,
            conditionParam: null
        },

        render: function(){
            const sampleParams = this.buildSamplesWithParameters();
            const seriesParams = this.groupSamplesWithParametersIntoSeries(sampleParams);

            this.loading(false);
            const $vizContainer = $("<div/>");
            this.$elem.append( $vizContainer );
            this.buildWidget( $vizContainer , seriesParams);
        },

        buildWidget: function($containerDiv, seriesParams){
            const growthParamNames = {
                "growth_rate": "Growth rate",
                "max_growth": "Max growth",
                "lag_phase":  "Lag phase",
                "area_under_curve": "Area under curve"
            };

            const growthParamType = this.options.growthParam;
            const growthParamName = growthParamNames[growthParamType];
            const conditionParamX = this.options.conditionParam;

            this.buildPlot($containerDiv, growthParamType, growthParamName, seriesParams, conditionParamX);
        },

        buildPlot: function($containerDiv, growthParamType, growthParamName, seriesParams, conditionParamX){
            const self = this;

            const xyeValues = [];
            let conditionParamXUnit;

            const filters = self.options.conditionFilter;

            // iterate over all series
            for(var i in seriesParams){
                const seriesParam = seriesParams[i];
                const samples = seriesParam.samples;

                // Check all properties
                let filterPassed = true;
                var value = null;
                let unit = null;

                for(const conditionName in seriesParam.conditionHash){
                    const pv = seriesParam.conditionHash[conditionName];
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
                xyeValues.sort((a, b) => { return a.x - b.x;});
            } else{
                xyeValues.sort((a, b) => { return a.x > b.x ? 1 : -1});
            }


            // Build xValue and yValues arrays
            const xValues = [];
            const yValues = [];
            const yErrors = [];
            for(var i in xyeValues){
                xValues.push(xyeValues[i].x);
                yValues.push(xyeValues[i].y);
                yErrors.push(xyeValues[i].e);
            }


            // Build track
            const data = [];
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
            let title = growthParamName;
            if(filters && Object.keys(filters).length > 0){
                title += '<br><span style="font-size:0.8em; font-style: italic">constrained parameteres: ';
                var i = 0;
                for(const param in filters){
                    var value = filters[param];
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
