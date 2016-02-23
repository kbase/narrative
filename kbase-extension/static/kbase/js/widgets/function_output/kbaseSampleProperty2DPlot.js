define(['jquery', 
        'plotly',        
        'kbwidget', 
        'kbaseSamplePropertyMatrix', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap'    
        ], function($, Plotly) {
    $.KBWidget({
        name: 'kbaseSampleProperty2DPlot',
        parent: 'kbaseSamplePropertyMatrix',
        version: '1.0.0',
        options: {
            propertySeriesX: null,
            propertySeriesY: null
        },
        
        render: function(){
            var matrix = this.matrix;
            var data = matrix.data;
            var rowsMetadata = matrix.metadata.row_metadata;
            var columnsMetadata = matrix.metadata.column_metadata;
            var sampleIds = this.options.sampleIds;
            
            
            var samples = this.buildSamples(data.row_ids, rowsMetadata);
            var sampleProperties = this.buildConstrainedSampleProperties(
                data.col_ids, 
                columnsMetadata, 
                [this.options.propertySeriesX, this.options.propertySeriesY]);            
            
            
            this.loading(false);
            var $vizContainer = $("<div/>");
            this.$elem.append( $vizContainer );
            this.buildWidget( $vizContainer, sampleProperties[0], sampleProperties[1] );            
        },

        // To be overriden
        buildWidget: function($containerDiv, samplePropertyX, samplePropertyY){
            
            var data = this.matrix.data;
            var rowsMetadata = this.matrix.metadata.row_metadata;
            
            var x = [];
            var y = [];
            var propNames = [];
            
            for(var rIndex in data.row_ids){
                var rowId = data.row_ids[rIndex];
                var propName = '';
                var rowMetadata = rowsMetadata[rowId];
                for(var i in rowMetadata){
                    var pv = rowMetadata[i];
                    if( pv.category == 'Sample' && pv.property_name == 'Name' ){
                        propName = pv.property_value;
                    }
                }
                
                // calcualte x value
                var xValue = this.getAvgValue(data.values, rIndex, samplePropertyX);
                var yValue = this.getAvgValue(data.values, rIndex, samplePropertyY);
                
                x.push(xValue);
                y.push(yValue);
                propNames.push(propName);
            };
            
            var traces = [ 
                {
                  x: x,
                  y: y,
                  mode: 'markers+text',
                  type: 'scatter',
                  name: '',
                  text: propNames,
                  textfont : {
                    family:'Times New Roman'
                  },
                  textposition: 'bottom center',                
                  marker: { size: 12 }
                }
            ];
            
            var layout = { 
                title: this.matrix.description,
                
              xaxis: {
                    type: 'log',
                    autorange: true,
                    title: samplePropertyX.name + " ("  + samplePropertyX.unit + ")"
              },
              yaxis: {
                    type: 'log',
                    autorange: true,
                    title: samplePropertyY.name + " ("  + samplePropertyY.unit + ")"
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
        
        getAvgValue :function(values, rIndex, sampleProperty){
            var columns = sampleProperty.columns;
            var val = 0;
            for(var i in columns){
                val += values[rIndex][columns[i].index];
            }
            val /= columns.length;
            return val;
        }
        
    });
});