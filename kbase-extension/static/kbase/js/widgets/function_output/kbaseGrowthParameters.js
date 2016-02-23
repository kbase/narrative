define([
        'jquery', 
        'kbwidget', 
        'kbaseAuthenticatedWidget', 
        'kbaseGrowthParametersAbstract', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap' 
        ], function($) {
    $.KBWidget({
        name: 'kbaseGrowthParameters',
        parent: 'kbaseAuthenticatedWidget',
        parent: 'kbaseGrowthParametersAbstract',
        version: '1.0.0',
         

        render: function(){
            var pref = self.pref;
            
            var sampleParams = this.buildSamplesWithParameters();
            var seriesParams = this.groupSamplesWithParametersIntoSeries(sampleParams);
            
            this.loading(false);
            var $container = $("<div/>");
            this.$elem.append( $container );        
            
            // Create a tabPane for all tabs
            var $tabPane = $('<div>')
                .attr( 'id', pref+'tab-content')
                .appendTo($container);
            $tabPane.kbaseTabs({canDelete : true, tabs : []});   

            // Build matrix overview tab
            var $tabOverview = $("<div/>");
            $tabPane.kbaseTabs('addTab', {tab: 'Overview', content: $tabOverview, canDelete : false, show: true});
            this.buildMatrixOverview( $tabOverview );

            // Build  grwoth parameters tab
            var $tabSamplesGrowthParameters = $("<div/>");
            $tabPane.kbaseTabs('addTab', {tab: 'Samples growth parameters', content: $tabSamplesGrowthParameters, canDelete : false, show: false});
            this.buildSampleParams($tabSamplesGrowthParameters, sampleParams);                                    

            // Build  grwoth parameters tab
            var $tabSeriesGrowthParameters = $("<div/>");
            $tabPane.kbaseTabs('addTab', {tab: 'Series growth parameters', content: $tabSeriesGrowthParameters, canDelete : false, show: false});
            this.buildSeriesParams($tabSeriesGrowthParameters, seriesParams);  
            
        },
        
        
        buildSampleParams: function($container, sampleParams){
            this.buildTable(
                $container,
                sampleParams,
                [
                    { sTitle: "Sample ID", mData: "columnId"},
                    { sTitle: "Series ID", mData: "seriesId"},
                    { sTitle: "Conditions", mData: "label"},
                    { sTitle: "Growth rate", mData:"grp_growth_rate" },
                    { sTitle: "Max growth", mData:"grp_max_growth" },
                    { sTitle: "Lag phase", mData:"grp_lag_phase" },
                    { sTitle: "Area under curve", mData:"grp_area_under_curve" },
                    { sTitle: "Method", mData:"grp_method" }
                ],
                "No sample growth parameters found!"
            );
        } ,       
        
        buildSeriesParams: function($container, seriesParams){
            this.buildTable(
                $container,
                seriesParams,
                [
                    { sTitle: "Series ID", mData: "seriesId"},
                    { sTitle: "Conditions", mData: "label"},
                    { sTitle: "Growth rate (AVG)", mData:"avg_growth_rate" },
                    { sTitle: "Growth rate (SE)", mData:"se_growth_rate" },
                    { sTitle: "Max growth (AVG)", mData:"avg_max_growth" },
                    { sTitle: "Max growth (SE)", mData:"se_max_growth" },
                    { sTitle: "Lag phase (AVG)", mData:"avg_lag_phase" },
                    { sTitle: "Lag phase (SE)", mData:"se_lag_phase" },
                    { sTitle: "Area under curve (AVG)", mData:"avg_area_under_curve" },
                    { sTitle: "Area under curve (SE)", mData:"se_area_under_curve" },
                    { sTitle: "Method", mData:"grp_method" }
                ],
                "No series growth parameters found!"
            );
        } ,               
        
//        
//        getTimePoints: function(matrix){
//            return this.getNumericPropertyCourse(matrix.data.row_ids, matrix.metadata.row_metadata, 'TimeSeries', 'Time');
//        },        
//        
//        buildMatrixSummary: function($tab, timeSeriesSummary, substances){
//            var pref = this.pref;
//            
//            // Substances summary
//            var $container = $("<div>")
//                .css('margin-top','1em')
//                .appendTo($tab);
//            
//            
//            $("<div>")
//                .append( "Substances summary")
//                .css('font-style', 'italic')
//                .appendTo($container);
//            
//            var $tableConditionsSummary = $('<table>')
//                .attr('id', pref+'conditions-summary-table')
//                .addClass("table table-striped table-bordered")
//                .css('width', '100%')
//                .css('margin-left', '0px' )
//                .css('margin-right', '0px')
//                .appendTo($container);
//                        
//            
//    
//            $tableConditionsSummary
//                .append( this.makeRow( 
//                    "Number of substances", 
//                    substances.length ) );
//            
//            for(var i in substances){
//                var substabce = substances[i];
//                $tableConditionsSummary
//                    .append( this.makeRow( 
//                        'Substance', 
//                        substabce.label ) );
//            }
//            
//            
//            // Time points summary
//            $("<div>")
//                .append("Time course summary")
//                .css('font-style', 'italic')
//                .css('margin-top', '3em')
//                .appendTo($container);
//            
//            var $tableTimeSummary =  $('<table>')
//                .attr('id', pref+'time-summary-table')
//                .addClass("table table-striped table-bordered")
//                .css('width', '100%')
//                .css('margin-left', '0px' )
//                .css('margin-right', '0px')
//                .appendTo($container);
//                        
//            $tableTimeSummary
//                .append( this.makeRow( 
//                    'Number of points', 
//                    this.matrix.data.row_ids.length ) )
//                .append( this.makeRow( 
//                    'Min time (' + timeSeriesSummary.valueUnit + ')', 
//                    timeSeriesSummary.valueMin ) )
//                .append( this.makeRow( 
//                    'Max time (' + timeSeriesSummary.valueUnit + ')', 
//                    timeSeriesSummary.valueMax ) );                             
//        },        
        
//        buildSubstances: function(matrix, timePoints){
//            var substances = [];
//            var columnIds = matrix.data.col_ids;
//            var columnsMetadata = matrix.metadata.column_metadata;
//
//            for(var cIndex in columnIds){
//                var columnId = columnIds[cIndex];
//                var columnMetadata = columnsMetadata[columnId];
//                var substanceName = this.getPropertyValue(columnMetadata, 'Measurement', 'Substance');
//                if(substanceName == null) continue;
//                
//                var maxValue = null;
//                var maxValueTime = null;
//                for(var i in timePoints){
//                    var timePoint = timePoints[i];
//                    var time = timePoint.value;
//                    var rIndex = timePoint.index;
//                    
//                    var val = matrix.data.values[rIndex][cIndex];
//                    if(maxValue == null || val > maxValue){
//                        maxValue = val;
//                        maxValueTime = time;
//                    }
//                }                
//                
//                substance = {
//                    substanceId : columnId,
//                    label : substanceName,
//                    maxValue : maxValue,
//                    maxValueTime: maxValueTime
//                };
//                substances.push(substance);
//            }
//            
//            return substances;
//        },
//        
//        buildSubstancesTable: function($container, substances){
//            this.buildTable(
//                $container,
//                substances,
//                [
//                    { sTitle: "Substance ID", mData: "substanceId"},
//                    { sTitle: "Substance", mData: "label"},
//                    { sTitle: "Max value", mData: "maxValue"},                                        
//                    { sTitle: "Max value time", mData:"maxValueTime" }
//                ],
//                "No substances found!"
//            );            
//        }             
        
    });        
}); 





