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

            var features = [];
            if(self.options.geneIds) { features = $.map(self.options.geneIds.split(","), $.trim); }

            return{
                input_data: self.options.workspaceID + "/" + self.options.expressionMatrixID,
                row_ids: features,
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
            var clusterDisp = []
            
            for( var i = 0 ; i < columnSetStats.size; i++){
                condition = columnDescriptors[i].id;
                matrixAvg.push({
                    x: i+5,
                    y: mtxColumnSetStats.avgs[i],
                    name: condition,
                    label: 'All Data Average<br>'+mtxColumnSetStats.avgs[i]+"<br>"+condition
                });
                clusterAvg.push(
                {
                    x: i+5,
                    y: columnSetStats.avgs[i],
                    name: condition,
                    label: 'Selected Features Average<br>'+columnSetStats.avgs[i]+"<br>"+condition
                });
                clusterDisp.push({
                    x: i+5,
                    y: columnSetStats.mins[i],
                    y2: columnSetStats.maxs[i],
                    name: condition
                });
            }

            $lineChartDiv = $("<div style = 'width : 700px; height : 300px'></div>");
            $containerDiv.append($lineChartDiv);
            $containerDiv.append("<div style = 'width : 5px; height : 5px'></div>");

            $lineChartDiv.kbaseLinechart(
                {
                    scaleAxes       : true,
                    hGrid           : true,
                    xLabel          : 'Conditions',
                    yLabel          : 'Expression Values',
                    xLabelRegion : 'yPadding',
                    yLabelRegion : 'xPadding',
                    xAxisColor : '#444',
                    yAxisColor : '#444',
                    xPadding : 80,
                    yPadding : 30,
                    xLabels  : false,
                    overColor : null,
                    autoLegend : true,
                    legendRegion : 'xGutter',
                    xGutter : 175,
                    legendAlignment : 'TR',
                    dataset : [
                        {
                            strokeColor: 'red',
                            label : 'Min and Max of Selected Features',
                            values : clusterDisp,
                            fillColor: 'red',
                            strokeOpacity: 0.2,
                            fillOpacity: 0.2,
                            width: 0
                        },
                        {
                            strokeColor : 'green',
                            label : 'Selected Features Average',
                            values : clusterAvg,
                            width: 1,
                            shape: 'circle',
                            shapeArea: 36,
                            /* TODO: in functions, d is not preserving all data in the data list
                            pointOver   :
                                function(d) {
                                  this.showToolTip({label : 'Selected Features Average<br>'+d.y+"<br>"+d.name});
                                },
                            pointOut    :
                                function(d) {
                                  this.hideToolTip();
                                }*/
                        },
                        {
                            strokeColor : 'blue',
                            label : 'All Data Average',
                            values : matrixAvg,
                            width: 1,
                            shape: 'circle',
                            shapeArea: 36,
                            /*pointOver   :
                                function(d) {
                                  this.showToolTip({label : 'All Data Average<br>'+d.y+"<br>"+d.name});
                                },
                            pointOut    :
                                function(d) {
                                  this.hideToolTip();
                                }*/
                        }
                    ],
                }
            );            
        }
        
    });
});