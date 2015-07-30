/**
 * Expression profile for a set of genes
 *
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

 define([
        'jquery', 
        'kbaseExpressionGenesetBaseWidget',      
        'highcharts',
        'highcharts-more'
        ], function($) {
    $.KBWidget({
        name: 'kbaseExpressionSparkline',
        parent: 'kbaseExpressionGenesetBaseWidget',
        version: '1.0.0',

        // To be overriden to specify additional parameters
        getSubmtrixParams: function(){
            var self = this;
            // self.setTestParameters();
            return{
                input_data: self.options.workspaceID + "/" + self.options.expressionMatrixID,
                row_ids: $.map(self.options.geneIds.split(","), $.trim),
                fl_column_set_stat: 1,
                fl_row_set_stats: 1,
                fl_mtx_column_set_stat: 1
            };
        },

        
        buildWidget: function($containerDiv){
            var submatrixStat = this.submatrixStat;
            var columnDescriptors = submatrixStat.column_descriptors;
            var columnSetStats = submatrixStat.column_set_stat;
            var mtxColumnSetStats = submatrixStat.mtx_column_set_stat;
            var matrixAvg = []
            var clusterAvg = []
            var clusterDisp = []
            
            for( var i = 0 ; i < columnSetStats.size; i++){
                condition = columnDescriptors[i].id;
                matrixAvg.push([condition,  mtxColumnSetStats.avgs[i]]);
                clusterAvg.push([condition,  columnSetStats.avgs[i]]);
                clusterDisp.push([condition,  columnSetStats.mins[i], columnSetStats.maxs[i]]);
            }
            
            $containerDiv.highcharts({

                title: {
                    text: 'Expression profile'
                },
                xAxis: {
                    labels: {
                        enabled: false
                    },               
                },
                yAxis: {
                    title: {
                        text: null
                    }
                },

                tooltip: {
                    crosshairs: false,
                    shared: false,
                },

                legend: {
                },

                credits: {
                    enabled: false
                },
                
                series: [
                    {
                        name: 'Selected genes average',
                        data: clusterAvg,
                        zIndex: 2,
                        marker: {
                            enabled: false,
                            fillColor: 'white',
                            lineWidth: 2,
                            lineColor: Highcharts.getOptions().colors[0]
                        },
                        states:{
                            hover: {
                                enabled: false
                            }
                        },
                        color: Highcharts.getOptions().colors[0],
                        allowPointSelect: true,
                        stickyTracking: false, 
                    }, 
                    {
                        name: 'Matrix average',
                        data: matrixAvg,
                        zIndex: 1,
                        marker: {
                            enabled: false,
                            fillColor: 'white',
                            lineWidth: 1,
                            lineColor: Highcharts.getOptions().colors[3]
                        },
                        color: Highcharts.getOptions().colors[3],
                        stickyTracking: false, 
                        states:{
                            hover: {
                                enabled: false
                            }
                        }
                    },                     
                    {
                        name: 'Selected genes [min, max]',
                        data: clusterDisp,
                        type: 'arearange',
                        lineWidth: 0,
                        color: Highcharts.getOptions().colors[0],
                        fillOpacity: 0.3,
                        zIndex: 0,
                        states:{
                            hover: {
                                enabled: false
                            }
                        },
                        enableMouseTracking : false
                    }
                ]
            });       
        }
    });
});