define(['jquery', 
        'plotly',        
        'kbwidget', 
        'kbaseMatrix2DAbstract',
        'kbaseAuthenticatedWidget', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap'
        ], function($, Plotly) {
    $.KBWidget({
        name: 'kbaseSamplePropertyMatrixAbstract',
        parent: 'kbaseMatrix2DAbstract',
        version: '1.0.0',

        
        TERM_SAMPLE: 'Sample',
        TERM_PROPERTY: 'Property',
        TERM_DATASERIES: 'DataSeries',
        
        TERM_MEASUREMENT: 'Measurement',
        TERM_NAME: 'Name',
        TERM_SERIES_ID: 'SeriesID',
        

        buildConstrainedSampleProperties: function(columnIds, columnMetadata, seriesIds, sorted){
            var series2Columns = this.groupCrowsByPropertyValue(columnIds, 
                    columnMetadata, 
                    this.TERM_DATASERIES, 
                    this.TERM_SERIES_ID);
            
            var seriesColumns = [];
            for(var i in seriesIds){
                var seriesId = seriesIds[i];
                var columns = series2Columns[seriesId];
                if(columns != null){
                    seriesColumns.push({
                        seriesId: seriesId,
                        columns: columns
                    });
                }
            }
            
            return this.buildSeriesSamplePorperties(seriesColumns, columnMetadata, sorted);
        },
        
        buildSampleProperties: function(columnIds, columnMetadata){
            var series2Columns = this.groupCrowsByPropertyValue(columnIds, 
                    columnMetadata, 
                    this.TERM_DATASERIES, 
                    this.TERM_SERIES_ID);
            
            var seriesColumns = [];
            for(var seriesId in series2Columns){
                var columns = series2Columns[seriesId];
                seriesColumns.push({
                    seriesId: seriesId,
                    columns: columns
                });
            }
            
            return this.buildSeriesSamplePorperties(seriesColumns, columnMetadata, true);
        },
        
        

        buildSeriesSamplePorperties: function(seriesColumns, columnMetadata, sorted){
            var sampleProperties = [];
            
            for(var i  in seriesColumns){
                var seriesId = seriesColumns[i].seriesId;
                var columns = seriesColumns[i].columns;

                // Build property name
                var samplePropertyNames = {};
                for(var i in columns){
                    var val = this.getPropertyValue(columns[i].properties, this.TERM_PROPERTY, this.TERM_NAME);
                    if(val != null){
                        samplePropertyNames[val] = true;
                    }
                }
                var samplePropertyName = "";
                for(var val in samplePropertyNames){
                    if(samplePropertyName != ""){
                        samplePropertyName += '; ';
                    }
                    samplePropertyName += val;
                }
                
                // Build property units
                var samplePropertyUnits = {};
                for(var i in columns){
                    var pv = this.getProperty(columns[i].properties, this.TERM_PROPERTY, this.TERM_MEASUREMENT);
                    if(pv != null){
                        samplePropertyUnits[pv.property_unit] = true;
                    }
                }
                var samplePropertyUnit = "";
                for(var val in samplePropertyUnits){
                    if(val == null || val == '') continue;
                    if(samplePropertyUnit != ""){
                        samplePropertyUnit += '; ';
                    }
                    samplePropertyUnit += val;
                }
                
                
                // Build sampleProperty
                sampleProperties.push({
                    seriesId: seriesId,
                    name: samplePropertyName,
                    unit: samplePropertyUnit,
                    columns: columns
                })
            }
            if(sorted){
                sampleProperties.sort(function(a, b) { return a.name > b.name ? 1 :  (a.name < b.name) ? -1 : 0});
            }
            
            return sampleProperties;            
        },
        
        buildSamples: function(rowIds, rowsMetadata){
            var samples = [];
            for(var rIndex in rowIds){
                var rowId = rowIds[rIndex];
                var rowMetadata = rowsMetadata[rowId];
                var sampleName = this.getPropertyValue(rowMetadata, this.TERM_SAMPLE, this.TERM_NAME);
                if(sampleName != null){
                    samples.push({
                        name: sampleName,
                        rIndex: rIndex,
                        rId : rowId
                    });
                }
            }
            return samples;
        },
        
        
        buildConstrainedSamples: function(rowIds, rowsMetadata, sampleIds){
            var samples = [];
            for(var sIndex in sampleIds){
                var sampleName = sampleIds[sIndex];
                for(var rIndex in rowIds){
                    var rowId = rowIds[rIndex];
                    var rowMetadata = rowsMetadata[rowId];
                    var val = this.getPropertyValue(rowMetadata, this.TERM_SAMPLE, this.TERM_NAME);
                    if(val != null && val == sampleName){
                        samples.push({
                            name: sampleName,
                            rIndex: rIndex,
                            rId : rowId
                        });
                        // Not perfect; It is because we have several samples for the same well....
                        break;
                    }
                }
            }
            return samples;
        },
        
        buildSamplePropertyStat: function(matrix, samples, sampleProperties){
            var samplePropertyStat = [];
            
            var values = matrix.data.values;
            for(var i in sampleProperties){
                var sampleProperty = sampleProperties[i];
                var columns = sampleProperty.columns;

                var n = samples.length;
                var s1 = 0;
                var s2 = 0;
                var se = 0;
                var count = 0;
                for(var j in samples){
                    var sample = samples[j];
                    var rIndex = sample.rIndex;

                    var value = 0;
                    for(var k in columns){                        
                        var cIndex = columns[k].index;
                        value += values[rIndex][cIndex];
                    }
                    value /= columns.length;
                    
                    s1 += value;
                    s2 += value*value;
                    count ++;
                }
                
                
                var avg = s1/n;
                var std = n > 1 ? Math.sqrt( (s2*n - s1*s1)/(n-1)/n ): 0;  
                var se  = n > 1 ? Math.sqrt( (s2*n - s1*s1)/(n-1)/n/n ): 0;  
                
                samplePropertyStat.push({
                    name: sampleProperty.name,
                    unit: sampleProperty.unit,
                    label: sampleProperty.name 
                            + (sampleProperty.unit != null ? " (" + sampleProperty.unit + ")" : ""),
                    avg: avg.toFixed(3),
                    std: std.toFixed(3),
                    se: se.toFixed(3),
                    count: count
                })
            }
            return samplePropertyStat;
        },
        
        buildSamplesStat: function(matrix, samples, sampleProperties){
            var samplesStat = [];
            
            var values = matrix.data.values;
            for(var i in samples){
                var sample = samples[i];
                var rIndex = sample.rIndex;

                
                var maxValue = null;
                var maxPropertyName = null;
                var maxPrpopertyUnit = null;
                var minValue = null;
                var minPropertyName = null;
                var minPrpopertyUnit = null;
                
                for(var j in sampleProperties){
                    var sampleProperty = sampleProperties[j];
                    var columns = sampleProperty.columns;
                    var value = 0;
                    for(var k in columns){                        
                        var cIndex = columns[k].index;
                        value += values[rIndex][cIndex];
                    }
                    value /= columns.length;
                    
                    if(maxValue == null || value > maxValue){
                        maxValue = value;
                        maxPropertyName = sampleProperty.name;
                        maxPrpopertyUnit = sampleProperty.unit;
                    }
                    
                    if(minValue == null || value < minValue){
                        minValue = value;
                        minPropertyName = sampleProperty.name;
                        minPrpopertyUnit = sampleProperty.unit;
                    }                    
                }
                samplesStat.push({
                    rIndex : rIndex,
                    rId: samples[i],
                    name: samples[i].name,
                    maxPropertyValue: maxValue.toFixed(3),
                    maxPropertyLabel: maxPropertyName 
                            + ( maxPrpopertyUnit != "" ?  " (" + maxPrpopertyUnit + ")": ""),
                    minPropertyValue: minValue.toFixed(3),
                    minPropertyLabel: minPropertyName 
                            + ( minPrpopertyUnit != "" ?  " (" + minPrpopertyUnit + ")": "")
                    
                });                
            }
            return samplesStat;
        }        
    })
});
