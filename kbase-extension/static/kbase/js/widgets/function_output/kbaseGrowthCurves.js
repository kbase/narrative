
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
        options: {
            
            valueType: null,
            sampleSeriesIds: null,
            
            showErrorBar: 1,
            logScale: 1,
        },        

        MAX_LABEL_LENGTH : 25,
        
        render: function(){            
            if(this.options.valueType == this.TYPE_SAMPLES){
                this.renderSamplesMatrix();
            } else if(this.options.valueType == this.TYPE_SERIES){
                this.renderSeriesMatrix();
            }            
        },
        
        getSampleIds: function(){
            var valueType = this.options.valueType;
            var sampleSeriesIds = this.options.sampleSeriesIds;
            
            console.log('kbaseGrowthCurves this.options', this.options);
            
            
            var sampleIds = [];
            if(valueType == this.TYPE_SAMPLES){
                if(sampleSeriesIds == null){
                    sampleIds = this.matrix.data.col_ids;
                } else{
//                    sampleIds = sampleSeriesIds.split(',');
                    sampleIds = sampleSeriesIds;
                }
            } else if (valueType == this.TYPE_SERIES){
                if(sampleSeriesIds == null){
                    sampleIds = this.matrix.data.col_ids;
                } else {
                    // Build hash of seriesIds for the lookup
                    var seriesIdsSet = {};
//                    var seriesIds = sampleSeriesIds.split(',');
                    var seriesIds = sampleSeriesIds;
                    for(var i in seriesIds){
                        seriesIdsSet[seriesIds[i]] = true;
                    }
                    
                    var columnsMetadata = this.matrix.metadata.column_metadata;
                    for(var cId in columnsMetadata){
                        var columnMetadata = columnsMetadata[cId];
                        var seriesId = this.getPropertyValue(columnMetadata, 'DataSeries', 'SeriesID');
                        if (seriesId == null) continue;
                        if (seriesId in seriesIdsSet){
                            sampleIds.push(cId);
                        }
                    }
                }               
            }
            
            return sampleIds;
        },
        
        
        renderSamplesMatrix: function(){
            
            var timePoints = this.getTimePoints(this.matrix);                        
            var sampleIds = this.getSampleIds();
            var samples = this.buildSamples(this.matrix, sampleIds, timePoints);
            var timeSeriesStat = this.getNumericProperyStat(this.matrix.metadata.row_metadata, 'TimeSeries', 'Time');
            this.loading(false);
            
            var $overviewContainer = $("<div/>");
            this.$elem.append( $overviewContainer );
            this.buildOverviewDiv( $overviewContainer, samples, this.TYPE_SAMPLES );


            var $vizContainer = $("<div/>");
            this.$elem.append( $vizContainer );
            this.buildSamplesWidget( $vizContainer, samples, timePoints, timeSeriesStat);              
        },      
        
        renderSeriesMatrix: function(){
            
            var timePoints = this.getTimePoints(this.matrix);            
            var sampleIds = this.getSampleIds();
            var samples = this.buildSamples(this.matrix, sampleIds, timePoints);            
            var series = this.groupSamplesIntoSeries(this.matrix, samples, timePoints);
            var timeSeriesStat = this.getNumericProperyStat(this.matrix.metadata.row_metadata, 'TimeSeries', 'Time');
            
            this.loading(false);
            
            var $overviewContainer = $("<div/>");
            this.$elem.append( $overviewContainer );
            this.buildOverviewDiv( $overviewContainer, series, this.TYPE_SERIES );

            // // Separator
            // this.$elem.append( $('<div style="margin-top:1em"></div>') );

            var $vizContainer = $("<div/>");
            this.$elem.append( $vizContainer );
            this.buildSeriesWidget( $vizContainer, series, timePoints, timeSeriesStat);
        },         
        
        buildOverviewDiv: function($containerDiv, conditions, valuesType){
            var self = this;
            var pref = this.pref;

            var msg = "";
            if(valuesType == this.TYPE_SAMPLES){
                msg = '[Show/Hide Samples]';
            } else if (valuesType == this.TYPE_SERIES){
                msg = '[Show/Hide Series]';
            }
            var $overviewSwitch = $("<a/>").html( msg);
            $containerDiv.append($overviewSwitch);

            var $overvewContainer = $('<div hidden style="margin:1em 0 4em 0"/>');
            $containerDiv.append($overvewContainer);
            
            if(valuesType == this.TYPE_SAMPLES){                
                self.buildSamplesTable($overvewContainer, conditions);
            } else if (valuesType == this.TYPE_SERIES){
                self.buildSeriesTable($overvewContainer, conditions);
            }
            
            $overviewSwitch.click(function(){
                $overvewContainer.toggle();
            });              
        },        
        
        buildSamplesWidget: function($containerDiv, samples, timePoints, timeSeriesStat){
            
            var data = [];  
            
            console.log('samples', samples);
            
            var values = this.matrix.data.values;            
            for(var i in samples){
                
                var sample = samples[i];
                
                // Build xValues
                var xValues = [];                
                for(var j in timePoints){
                    var timePoint = timePoints[j];
                    xValues.push( timePoint.value );
                }
            
                
                // Build yValues
                var yValues = [];
                for(var j in timePoints){
                    var rIndex = timePoints[j].index;
                    yValues.push( values[rIndex][sample.columnIndex] );
                }
                                
                var label = sample.columnId + " - " +  sample.label; 
                if(label.length > this.MAX_LABEL_LENGTH){
                    label = label.substring(0,this.MAX_LABEL_LENGTH) + "...";
                }
                
                // Build track
                var dataTrack = {
                    x : xValues,
                    y : yValues,
                    name: label
                };
                data.push(dataTrack);
            }              
            this.buildWidget($containerDiv, 
                             data, 
                             this.matrix.description, 
                             "Time, " + timeSeriesStat.valueUnit, 
                             "OD");
        },
        
        buildSeriesWidget: function($containerDiv, seriesList, timePoints, timeSeriesStat){
            var options = this.options;            
            var data = [];  
            
            
            console.log('seriesList', seriesList);
            var values = this.matrix.data.values;            
            for(var i in seriesList){
                
                var series = seriesList[i];
                
                // Build xValues
                var xValues = [];                
                for(var j in timePoints){
                    var timePoint = timePoints[j];
                    xValues.push( timePoint.value );
                }
            
                
                // Build yValues
                var yValues = [];
                var yErrors = [];
                for(var j in timePoints){
                    var rIndex = timePoints[j].index;
                    
                    
                    var samples = series.samples;
                    var s1 = 0;
                    var s2 = 0;
                    var n = samples.length;
                    for(var k in samples){
                        var cIndex = samples[k].columnIndex;
                        s1 += values[rIndex][cIndex];
                        s2 += values[rIndex][cIndex]*values[rIndex][cIndex];
                    }
                    avg = s1/n;
                    se = n > 1 ? Math.sqrt( (s2*n - s1*s1)/(n-1)/n/n ): 0;

                    yValues.push( avg );
                    yErrors.push( se );
                }
                             
                var label = series.seriesId + " - " +  series.label; 
                if(label.length > this.MAX_LABEL_LENGTH){
                    label = label.substring(0,this.MAX_LABEL_LENGTH) + "...";
                }

                // Build track
                var dataTrack = {
                    x : xValues,
                    y : yValues,
                    name: label,
                };
                
                if(options.showErrorBar == 1){
                    dataTrack['error_y'] =
                        {
                          type: 'data',
                          array: yErrors,
                          visible: true
                        }; 
                }
                data.push(dataTrack);
            }     
            this.buildWidget($containerDiv, 
                             data, 
                             this.matrix.description, 
                             "Time, " + timeSeriesStat.valueUnit, 
                             "OD");
        },        
        
        // Build widget to visualize growth curves
        buildWidget: function($containerDiv, data, title, xAxisTitle, yAxisTitle){
            
            var options = this.options;
            var layout = {
                autosize: true,
                margin: {
                    l: 50,
                    r: 50,
                    b: 100,
                    t: 100,
                    pad: 4
                },
                "title": title, 
                "showlegend": true,   
                legend: {
                    x: 1,
                    y: 1
                },
                "titlefont": {
                    "color": "rgb(33, 33, 33)", 
                    "family": "", 
                    "size": 0
                },  
                "xaxis": {
                    "title": xAxisTitle, 
                    "titlefont": {
                        "color": "", 
                        "family": "", 
                        "size": 0
                    } 
                },                 
                "yaxis": {
                    "title": options.plotYAxisTitle, 
                    "title": yAxisTitle, 
                    autorange: true
                }
            };   
            
            if(options.logScale == 1){
                layout.yaxis.type = 'log';
            }
            

            Plotly.plot( $containerDiv[0], data, layout, {showLink: false} );
        }                
    });
});