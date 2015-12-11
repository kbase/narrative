 


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
        name: 'kbaseGrowthMatrix',
        parent: 'kbaseGrowthMatrixAbstract',
        version: '1.0.0',

        setTestParameters: function(){
//            this.options.columnIds = 'C1,C3';
        },        
        
        render: function(){
            var self = this;
            var pref = self.pref;
            
            var $container = $("<div/>");
            this.$elem.append( $container );
    
            ///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
            $container.empty();
            var $tabPane = $('<div id="'+pref+'tab-content">');
            $container.append($tabPane);
            $tabPane.kbaseTabs({canDelete : true, tabs : []});   
            
            ///////////////////////////////////// Overview table ////////////////////////////////////////////           
            var $tabOverview = $("<div/>");
            $tabPane.kbaseTabs('addTab', {tab: 'Overview', content: $tabOverview, canDelete : false, show: true});
            var $tableOverview = $('<table class="table table-striped table-bordered" '+
                'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="'+pref+'overview-table"/>');
            $tabOverview.append($tableOverview);
            
                                
            for(var i in self.growthMatrix.metadata.matrix_metadata){
                var md = self.growthMatrix.metadata.matrix_metadata[i];
                
                var label = md.entity;
                if( md.property_name != undefined && md.property_name != ''){
                    label += "." + md.property_name;
                }
                
                $tableOverview .append( self.makeRow( 
                    label, 
                    md.property_value + (md.property_unit ? md.property_unit : "" ) ) );                
            }
            $tableOverview
                .append( self.makeRow( 
                    'Number of conditions', 
                    self.growthMatrix.data.col_ids.length ) )
                .append( self.makeRow( 
                    'Number of time points', 
                    self.growthMatrix.data.row_ids.length ) );
            

            ///////////////////////////////////// Domains table ////////////////////////////////////////////          
            var $tabConditions = $("<div/>");
            $tabPane.kbaseTabs('addTab', {tab: 'Conditions', content: $tabConditions, canDelete : false, show: false});
            self.buildConditionsTable($tabConditions);
            
//            var $tableConditions = $('<table class="table table-striped table-bordered" '+
//                'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="'+pref+'conditions-table"/>');

            
            
        }
    });        
}); 

