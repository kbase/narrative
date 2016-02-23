define([
        'jquery', 
        'plotly',
        'kbwidget', 
        'kbaseSamplePropertyMatrixAbstract', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap' 
        ], function($,Plotly) {
    $.KBWidget({
        name: 'kbaseSamplePropertyMatrix',        
        parent: 'kbaseSamplePropertyMatrixAbstract',
        version: '1.0.0',
         
        render: function(){
            var pref = self.pref;
            
            // Prepare data for visualization
            var matrix = this.matrix;
            var data = matrix.data;
            var rowsMetadata = matrix.metadata.row_metadata;
            var columnsMetadata = matrix.metadata.column_metadata;
            
            var samples = this.buildSamples(data.row_ids, rowsMetadata);
            var sampleProperties = this.buildSampleProperties(data.col_ids, columnsMetadata);
            
            var samplesSat = this.buildSamplesStat(matrix, samples, sampleProperties);
            var samplePropertiesStat = this.buildSamplePropertyStat(matrix, samples, sampleProperties);

            
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

            // Build  matrix summary tab
            var $tabSummary = $("<div/>");
            $tabPane.kbaseTabs('addTab', {tab: 'Summary', content: $tabSummary, canDelete : false, show: false});
            this.buildMatrixSummary($tabSummary, samples, sampleProperties);            

            // Build  samples tab
            var $tabSamples = $("<div/>");
            $tabPane.kbaseTabs('addTab', {tab: 'Samples', content: $tabSamples, canDelete : false, show: false});
            this.buildSamplesTab($tabSamples, samplesSat);            
            
            // Build  sample properties tab
            var $tabSampleProperties = $("<div/>");
            $tabPane.kbaseTabs('addTab', {tab: 'Sample properties', content: $tabSampleProperties, canDelete : false, show: false});
            this.buildSamplePropertiesTab($tabSampleProperties, samplePropertiesStat);            
            
        },       

        buildSamplesTab: function($container, samplesSat){
            this.buildTable(
                $container,
                samplesSat,
                [
                    {sTitle: "Sample", mData: "name"},
                    {sTitle: "Max value", mData: "maxPropertyValue"},
                    {sTitle: "Max value property", mData: "maxPropertyLabel"},
                    {sTitle: "Min value", mData: "minPropertyValue"},
                    {sTitle: "Min value property", mData: "minPropertyLabel"},
                ],
                "No samples found!"
            );         
        },

        buildSamplePropertiesTab: function($container, samplePropertiesStat){
            this.buildTable(
                $container,
                samplePropertiesStat,
                [
                    {sTitle: "Sample property", mData: "label"},
                    {sTitle: "Average", mData: "avg"},
                    {sTitle: "STD", mData: "std"},
                    {sTitle: "SE", mData: "se"},
                    {sTitle: "Number of samples", mData: "count"}
                ],
                "No sample properties found!"
            );             
        },
        
        
        buildMatrixSummary: function($tab, samples, sampleProperties){
            var pref = this.pref;
            
            // Substances summary
            var $container = $("<div>")
                .css('margin-top','1em')
                .appendTo($tab);
            
            
            var $tableSummary = $('<table>')
                .attr('id', pref+'summary-table')
                .addClass("table table-striped table-bordered")
                .css('width', '100%')
                .css('margin-left', '0px' )
                .css('margin-right', '0px')
                .appendTo($container);
                        
            $tableSummary
                .append( this.makeRow( 
                    "Number of samples", 
                    samples.length ) )
                .append( this.makeRow( 
                    'Number of properties', 
                    sampleProperties.length ) );            
        }                                   
    });        
}); 



