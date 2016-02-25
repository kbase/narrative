define([
        'jquery', 
        'kbwidget', 
        'kbaseGrowthMatrixAbstract', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap' 
        ], function($) {
    $.KBWidget({
        name: 'kbaseGrowthParametersAbstract',
        parent: 'kbaseGrowthMatrixAbstract',
        version: '1.0.0',
        options: {
            growthParametersID: null,   
        },
        
        // Data form the GrwothParameters object
        growthParams: null,
        
        //@Overriride 
        loadAndRender: function(){
            var self = this;
            self.loading(true);

            var refGrowthParams = self.buildObjectIdentity(this.options.workspaceID, this.options.growthParametersID);
            self.wsClient.get_objects([refGrowthParams], 
                function(data) {
                    self.growthParams = data[0].data;
                    var matrixRef = self.growthParams.matrix_id;
                
                    var ref = self.buildObjectIdentity('', '', '', matrixRef);                
                    // Load metadata
                    self.wsClient.get_objects([ref], 
                        function(data) {
                            self.matrix = data[0].data;
                            self.render();
                        },
                        function(error){
                            self.clientError(error);
                        }
                    );
                },
                function(error){
                    self.clientError(error);
                }
            );
        } ,
        
        buildColumnId2ParamsHash: function(){
            var columnId2Params = {};
            var params = this.growthParams.parameters; 
            for(var i in params){
                columnId2Params[params[i].mtx_column_id] = params[i];
            }
            return columnId2Params;
        },
        
        buildSamplesWithParameters: function(){
            
            var samples = [];
            var columnId2Params = this.buildColumnId2ParamsHash();
            
            var columnsMetadata = this.matrix.metadata.column_metadata;
            for(var columnId in columnsMetadata){
                var columnMetadata = columnsMetadata[columnId];
                var seriesId = this.getPropertyValue(columnMetadata, 'DataSeries', 'SeriesID');
                var sampleProperties = this.getProperties(columnMetadata, 'Condition');
                var sampleLabel = this.propertiesToString(sampleProperties);
                
                var grp = columnId2Params[columnId];
                
                var sample = {
                    columnId: columnId,
                    seriesId: seriesId,
                    label: sampleLabel,
                    conditions: sampleProperties,
                    
                    grp_area_under_curve: grp.area_under_curve,
                    grp_growth_rate: grp.growth_rate,
                    grp_lag_phase: grp.lag_phase,
                    grp_max_growth: grp.max_growth,
                    grp_method: grp.method
                };
                samples.push(sample);
            }
            
            return samples;            
        },
        
        groupSamplesWithParametersIntoSeries: function(samplesWithParams){
            var seriesHash = {};
            for(var i in samplesWithParams){
                var sample = samplesWithParams[i];
                var seriesId = sample.seriesId;
                var series = seriesHash[seriesId];
                if(series == null){
                    series = {
                        seriesId: seriesId,
                        samples: [],
                        label: sample.label,
                        conditionHash: {},

                        avg_area_under_curve: 0,
                        avg_growth_rate: 0,
                        avg_lag_phase: 0,
                        avg_max_growth: 0,
                        
                        se_area_under_curve: 0,
                        se_growth_rate: 0,
                        se_lag_phase: 0,
                        se_max_growth: 0,                        
                        
                        grp_method: null, 
                        
                        samplesCountTotal: 0,
                        samplesCountGood: 0,
                    };
                    seriesHash[seriesId] = series;
                }
                series.samples.push(sample);
                
                for(var i in sample.conditions){
                    var pv = sample.conditions[i];
                    series.conditionHash[pv.property_name] = pv;
                }
                    
            }

            // Convert hash into list and fill out the number of samples (to be used in the jtables)
            var seriesList = [];
            for(var seriesId in seriesHash){
                var series = seriesHash[seriesId];
                series.samplesCount = series.samples.length;
                this.updateGrowthParamStat(series);
                
                seriesList.push(series);
            }
            
            return seriesList;            
        },
        
        updateGrowthParamStat: function(series){
            var samples = series.samples;
            
            var s1_area_under_curve = 0;
            var s2_area_under_curve = 0;

            var s1_growth_rate = 0;
            var s2_growth_rate = 0;

            var s1_lag_phase = 0;
            var s2_lag_phase = 0;

            var s1_max_growth = 0;
            var s2_max_growth = 0;

            var method = 'NA';
            var n = 0;            
            for(var i in samples){
                var sample = samples[i];

                if(sample.grp_method != 'NA'){
                    n += 1;
                    method = sample.grp_method;
                    s1_area_under_curve += sample.grp_area_under_curve;
                    s2_area_under_curve += sample.grp_area_under_curve*sample.grp_area_under_curve;
                    
                    s1_growth_rate += sample.grp_growth_rate;
                    s2_growth_rate += sample.grp_growth_rate*sample.grp_growth_rate;

                    s1_lag_phase += sample.grp_lag_phase;
                    s2_lag_phase += sample.grp_lag_phase*sample.grp_lag_phase;

                    s1_max_growth += sample.grp_max_growth;
                    s2_max_growth += sample.grp_max_growth*sample.grp_max_growth;
                }                                
            }
            series.avg_area_under_curve  = (n > 0 ? s1_area_under_curve/n : 0).toFixed(3);
            series.avg_growth_rate       = (n > 0 ? s1_growth_rate/n : 0).toFixed(3);
            series.avg_lag_phase         = (n > 0 ? s1_lag_phase/n : 0).toFixed(3);
            series.avg_max_growth        = (n > 0 ? s1_max_growth/n : 0).toFixed(3);

            series.se_area_under_curve  = (n > 1 ?  Math.sqrt( (s2_area_under_curve*n - s1_area_under_curve*s1_area_under_curve)/(n-1)/n/n ): 0).toFixed(5);
            series.se_growth_rate       = (n > 1 ?  Math.sqrt( (s2_growth_rate*n - s1_growth_rate*s1_growth_rate)/(n-1)/n/n ): 0).toFixed(5);
            series.se_lag_phase         = (n > 1 ?  Math.sqrt( (s2_lag_phase*n - s1_lag_phase*s1_lag_phase)/(n-1)/n/n ): 0).toFixed(5);
            series.se_max_growth        = (n > 1 ?  Math.sqrt( (s2_max_growth*n - s1_max_growth*s1_max_growth)/(n-1)/n/n ): 0).toFixed(5);
            series.samplesCountTotal    = samples.length;
            series.samplesCountGood     = n;    
            series.grp_method           = method;
        }        
    });        
}); 

