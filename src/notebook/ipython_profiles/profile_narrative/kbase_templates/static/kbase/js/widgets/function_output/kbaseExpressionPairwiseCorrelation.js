/**
 * Pairwise correlation of gene expression profiles.
 *
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

 define([
        'jquery', 
        'kbaseExpressionGenesetBaseWidget',      
        'kbaseHeatmap'
        ], function($) {
    $.KBWidget({
        name: 'kbaseExpressionPairwiseCorrelation',
        parent: 'kbaseExpressionGenesetBaseWidget',
        version: '1.0.0',


        // To be overriden to specify additional parameters
        getSubmtrixParams: function(){
            var self = this;
            return{
                input_data: self.options.workspaceID + "/" + self.options.expressionMatrixID,
                row_ids: $.map(self.options.geneIds.split(","), $.trim),
                fl_row_pairwise_correlation: 1,
                fl_row_set_stats: 1
            };
        },

        buildWidget : function($containerDiv){
            var submatrixStat = this.submatrixStat;
            var rowDescriptors = submatrixStat.row_descriptors;
            var values = submatrixStat.row_pairwise_correlation.comparison_values;

            //Build row ids
            var rowIds = [];
            for(var i = 0 ; i < rowDescriptors.length; i++){
                rowIds.push(rowDescriptors[i].id);
            }

            // Build data
            var data = [];
            var minVal = null;
            var maxVal = null;
            for(var i = 0 ; i < rowDescriptors.length; i++){
                var row = [];
                for(var j = 0 ; j < rowDescriptors.length; j++){
                    row.push(values[i][j]);
                    if (minVal == null || minVal > values[i][j])
                        minVal = values[i][j];
                    if (maxVal == null || maxVal < values[i][j])
                        maxVal = values[i][j];
                }                
                data.push(row);
            }            
            if (minVal > maxVal - 0.1)
                minVal = maxVal - 0.1;
            var heatmap =
                {
                    row_ids : rowIds,
                    row_labels : rowIds,
                    column_ids : rowIds,
                    column_labels : rowIds,
                    data : data,
                };

            var size = rowIds.length;
            var rowH = 35;
            var hmH = 80 + 20 + size * rowH;
            if (hmH > 700)
                hmH = 700;
            if (hmH < 210) {
                hmH = 210;
                rowH = Math.round((hmH - 100) / size);
            }
            var colW = rowH;
            var hmW = 150 + 110 + size * colW;
            if (hmW > 700)
                hmW = 700;
            $heatmapDiv = $("<div style = 'width : "+hmW+"px; height : "+hmH+"px'></div>");
            $containerDiv.append($heatmapDiv);
            $containerDiv.append("<div style = 'width : 5px; height : 5px'></div>");


            var hm = $heatmapDiv.kbaseHeatmap(
                {
                    dataset : heatmap,
                    // ulIcon : '../img/labs_icon.png',
                    colors : ['#FFA500', '#FFFFFF', '#0066AA'],
                    //ulIcon : '/functional-site/assets/navbar/images/kbase_logo.png',
                    minValue : minVal,
                    maxValue : maxVal
                }
            );
            
        }

        
        // buildWidget: function($containerDiv){
        //     var submatrixStat = this.submatrixStat;
        //     var rowDescriptors = submatrixStat.row_descriptors;
        //     var values = submatrixStat.row_pairwise_correlation.comparison_values;

        //     //Build row ids
        //     var rowIds = [];
        //     for(var i = 0 ; i < rowDescriptors.length; i++){
        //         rowIds.push(rowDescriptors[i].id);
        //     }

        //     // Build data
        //     var data = [];
        //     for(var i = 0 ; i < rowDescriptors.length; i++){
        //         for(var j = 0 ; j < rowDescriptors.length; j++){
        //             data.push([i, j, values[i][j] ]);
        //         }                
        //     }

        //     // Build heatmap
        //     $containerDiv.highcharts({

        //         chart: {
        //             type: 'heatmap',
        //             marginTop: 40,
        //             marginBottom: 80
        //         },
        //         title: {
        //             text: 'Pairwise correlation'
        //         },
        //         xAxis: {
        //             categories: rowIds
        //         },
        //         yAxis: {
        //             categories: rowIds,
        //             title: null
        //         },
        //         colorAxis: {
        //             min: -1,
        //             max: 1,
        //             stops: [
        //                 [0, '#3060cf'],
        //                 // [0.5, '#fffbbc'],
        //                 [0.5, '#ffffff'],
        //                 [1, '#c4463a']
        //             ]
        //         },
        //         legend: {
        //             align: 'right',
        //             layout: 'vertical',
        //             margin: 0,
        //             verticalAlign: 'top',
        //             y: 25,
        //             symbolHeight: 280
        //         },
        //         credits: {
        //             enabled: false
        //         },                
        //         tooltip: {
        //             formatter: function () {
        //                 return 'Pearson correlation: ' + this.point.value.toFixed(2) 
        //                     + '<br><b>' + this.series.xAxis.categories[this.point.x] + '</b>' 
        //                     + '<br><b>' + this.series.yAxis.categories[this.point.y] + '</b>';
        //             }
        //         },

        //         series: [{
        //             name: 'Sales per employee',
        //             borderWidth: 1,
        //             data: data,
        //             dataLabels: {
        //                 enabled: false,
        //                 color: '#000000'
        //             }
        //         }]

        //     });
        // }     

    });
});