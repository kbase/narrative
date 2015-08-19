/**
 * Expression profile for a set of genes
 *
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

 define([
        'jquery', 
        'kbaseExpressionGenesetBaseWidget',      
        'kbaseLinechart'
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
            var matrixAvg = [];
            var clusterAvg = [];
            // var clusterDisp = []
            
            for( var i = 0 ; i < columnSetStats.size; i++){
                condition = columnDescriptors[i].id;
                matrixAvg.push({
                    x: i,
                    y: mtxColumnSetStats.avgs[i],
                    name: condition
                });
                clusterAvg.push(
                {
                    x: i,
                    y: columnSetStats.avgs[i],
                    name: condition
                });
                // clusterDisp.push([condition,  columnSetStats.mins[i], columnSetStats.maxs[i]]);
            }
            console.log(clusterAvg);

            $lineChartDiv = $("<div style = 'width : 500px; height : 300px'></div>");
            $containerDiv.append($lineChartDiv);


            $lineChartDiv.kbaseLinechart(
                {
                    scaleAxes       : true,

                    // xLabel      : 'Some useful experiment',
                    // yLabel      : 'Meaningful data',

                    dataset : [
                        {
                            color : 'green',
                            label : 'Selected genes average',
                            values : clusterAvg,
                        },
                        {
                            color : 'blue',
                            label : 'Matrix average',
                            values : matrixAvg,
                        }
                    ],
                }
            );            
        }
        
    });
});