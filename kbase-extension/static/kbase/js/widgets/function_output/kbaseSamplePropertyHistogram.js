define(['jquery', 
        'plotly',        
        'kbwidget', 
        'kbaseSamplePropertyMatrixAbstract',
        ], function($, Plotly) {
    $.KBWidget({
        name: 'kbaseSamplePropertyHistogram',
        parent: 'kbaseSamplePropertyMatrixAbstract',
        version: '1.0.0',
        options: {
            sampleIds: [],
            logScale: 1,
            showErrorBar: 0
        },
        
        
        render: function(){
            this.loading(false);
            var $vizContainer = $("<div/>");
            this.$elem.append( $vizContainer );
            this.buildWidget( $vizContainer );                 
        },
        
        buildWidget: function($containerDiv){
            var matrix = this.matrix;
            var data = matrix.data;
            var rowsMetadata = matrix.metadata.row_metadata;
            var columnsMetadata = matrix.metadata.column_metadata;
            var sampleIds = this.options.sampleIds;
            
            
            var samples = this.buildConstrainedSamples(data.row_ids, rowsMetadata, sampleIds);
            var sampleProperties = this.buildSampleProperties(data.col_ids, columnsMetadata);
            
            var traces = [];
            for(var i in samples){
                var sample = samples[i];
                var rIndex = sample.rIndex;
                var x = [];
                var y = [];
                var yErrors = [];
                for(var j in sampleProperties){
                    var sampleProperty = sampleProperties[j];
                    var columns = sampleProperty.columns;
                    
                    var n = columns.length;
                    var s1 = 0;
                    var s2 = 0;
                    for(var k in columns){                        
                        var cIndex = columns[k].index;
                        s1 += data.values[rIndex][cIndex];
                        s2 += data.values[rIndex][cIndex]*data.values[rIndex][cIndex];
                    }
                    var avg = s1/n;
                    se = n > 1 ? Math.sqrt( (s2*n - s1*s1)/(n-1)/n/n ): 0;
                    x.push(sampleProperty.name);
                    y.push(avg);
                    yErrors.push( se );                    
                }
                
                var trace = {
                    x: x,
                    y: y,
                    name: sample.name, 
                    type: 'bar'
                };
                
                if(this.options.showErrorBar == 1){
                    trace['error_y'] = {
                        type: 'data',
                        array: yErrors,
                        visible: true
                    };
                }
                traces.push(trace);
            }
            var layout = {
                barmode: 'group',
                title: matrix.description,
                "yaxis": {
                    autorange: true
                }                  
            };
            
            if(this.options.logScale == 1){
                layout.yaxis.type = 'log';
            }
            Plotly.newPlot($containerDiv[0], traces, layout, {showLink: false});            
        }
    });
});